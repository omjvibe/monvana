import { NextResponse } from "next/server";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { createClient, SupabaseClient } from "@supabase/supabase-js";

function getSupabase(): SupabaseClient {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) throw new Error("Server configuration error");
    return createClient(url, key);
}

// GET - Fetch exchange rates + user wallets for the swap UI
export async function GET() {
    try {
        const authSupabase = await createServerClient();
        const { data: { user: authUser } } = await authSupabase.auth.getUser();
        const clerkUserId = authUser?.id;
        if (!clerkUserId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const supabase = getSupabase();

        // Get user's internal ID
        const { data: userData } = await supabase
            .from("users")
            .select("id")
            .eq("clerk_id", clerkUserId)
            .single();

        if (!userData) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        // Fetch wallets and rates in parallel
        const [walletsRes, ratesRes] = await Promise.all([
            supabase
                .from("wallets")
                .select("id, currency, balance, account_name")
                .eq("user_id", userData.id)
                .order("is_primary", { ascending: false }),
            supabase
                .from("exchange_rates")
                .select("*")
                .eq("is_active", true)
                .order("from_currency"),
        ]);

        return NextResponse.json({
            wallets: walletsRes.data || [],
            rates: ratesRes.data || [],
        });
    } catch (error) {
        console.error("Swap GET error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

// POST - Execute a wallet swap
export async function POST(req: Request) {
    try {
        const authSupabase = await createServerClient();
        const { data: { user: authUser } } = await authSupabase.auth.getUser();
        const clerkUserId = authUser?.id;
        if (!clerkUserId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const supabase = getSupabase();
        const body = await req.json();
        const { fromWalletId, toWalletId, amount, pin } = body;

        if (!fromWalletId || !toWalletId || !amount || amount <= 0) {
            return NextResponse.json({ error: "Invalid swap parameters" }, { status: 400 });
        }

        if (fromWalletId === toWalletId) {
            return NextResponse.json({ error: "Cannot swap to the same wallet" }, { status: 400 });
        }

        // Get user
        const { data: userData } = await supabase
            .from("users")
            .select("id, transaction_pin")
            .eq("clerk_id", clerkUserId)
            .single();

        if (!userData) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        // Verify PIN if set
        if (userData.transaction_pin && userData.transaction_pin !== "1234") {
            if (!pin || pin !== userData.transaction_pin) {
                return NextResponse.json({ error: "Invalid transaction PIN" }, { status: 403 });
            }
        }

        // Fetch both wallets (must belong to user)
        const { data: wallets } = await supabase
            .from("wallets")
            .select("id, currency, balance")
            .eq("user_id", userData.id)
            .in("id", [fromWalletId, toWalletId]);

        if (!wallets || wallets.length !== 2) {
            return NextResponse.json({ error: "One or both wallets not found" }, { status: 404 });
        }

        const fromWallet = wallets.find((w) => w.id === fromWalletId)!;
        const toWallet = wallets.find((w) => w.id === toWalletId)!;

        // Check sufficient balance
        const swapAmount = parseFloat(amount);
        if (fromWallet.balance < swapAmount) {
            return NextResponse.json({ error: "Insufficient balance" }, { status: 400 });
        }

        // Get exchange rate
        const { data: rateData } = await supabase
            .from("exchange_rates")
            .select("rate")
            .eq("from_currency", fromWallet.currency)
            .eq("to_currency", toWallet.currency)
            .eq("is_active", true)
            .single();

        if (!rateData) {
            return NextResponse.json({
                error: `No exchange rate found for ${fromWallet.currency} → ${toWallet.currency}`,
            }, { status: 400 });
        }

        const rate = parseFloat(rateData.rate as unknown as string);
        const convertedAmount = swapAmount * rate;

        // Execute swap: debit source, credit destination
        const newFromBalance = fromWallet.balance - swapAmount;
        const newToBalance = toWallet.balance + convertedAmount;

        const [debitRes, creditRes] = await Promise.all([
            supabase
                .from("wallets")
                .update({ balance: newFromBalance, updated_at: new Date().toISOString() })
                .eq("id", fromWalletId),
            supabase
                .from("wallets")
                .update({ balance: newToBalance, updated_at: new Date().toISOString() })
                .eq("id", toWalletId),
        ]);

        if (debitRes.error || creditRes.error) {
            console.error("Swap execution error:", debitRes.error, creditRes.error);
            return NextResponse.json({ error: "Failed to execute swap" }, { status: 500 });
        }

        // Create transaction records for both legs
        const ref = `SWP-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${Math.floor(Math.random() * 10000).toString().padStart(4, "0")}`;

        await supabase.from("transactions").insert([
            {
                user_id: userData.id,
                wallet_id: fromWalletId,
                type: "fee",
                amount: swapAmount,
                currency: fromWallet.currency,
                status: "approved",
                description: `Swap: ${swapAmount} ${fromWallet.currency} → ${convertedAmount.toFixed(8)} ${toWallet.currency}`,
                reference: ref + "-OUT",
            },
            {
                user_id: userData.id,
                wallet_id: toWalletId,
                type: "deposit",
                amount: convertedAmount,
                currency: toWallet.currency,
                status: "approved",
                description: `Swap: Received ${convertedAmount.toFixed(8)} ${toWallet.currency} from ${swapAmount} ${fromWallet.currency}`,
                reference: ref + "-IN",
            },
        ]);

        return NextResponse.json({
            success: true,
            swap: {
                from: { currency: fromWallet.currency, amount: swapAmount, newBalance: newFromBalance },
                to: { currency: toWallet.currency, amount: convertedAmount, newBalance: newToBalance },
                rate,
                reference: ref,
            },
        });
    } catch (error) {
        console.error("Swap POST error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
