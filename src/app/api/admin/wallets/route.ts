import { NextRequest, NextResponse } from "next/server";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(request: NextRequest) {
    try {
        const authSupabase = await createServerClient();
        const { data: { user: authUser } } = await authSupabase.auth.getUser();
        const clerkUserId = authUser?.id;

        if (!clerkUserId) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

        if (!supabaseUrl || !supabaseServiceKey) {
            return NextResponse.json(
                { error: "Supabase not configured" },
                { status: 500 }
            );
        }

        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        // Check if user is admin in DB
        const { data: dbUser } = await supabase
            .from("users")
            .select("role")
            .eq("clerk_id", clerkUserId)
            .single();

        if (!dbUser || (dbUser.role !== "admin" && dbUser.role !== "super_admin")) {
            return NextResponse.json(
                { error: "Forbidden: Admin access required" },
                { status: 403 }
            );
        }

        const body = await request.json();
        const { userId, walletId, balance, currency, accountNumber, accountName, action } = body;

        if (!userId) {
            return NextResponse.json(
                { error: "User ID is required" },
                { status: 400 }
            );
        }

        // Action: Update existing wallet balance
        if (action === "update_balance" && walletId) {
            const { error } = await supabase
                .from("wallets")
                .update({
                    balance: parseFloat(balance),
                    updated_at: new Date().toISOString()
                })
                .eq("id", walletId);

            if (error) throw error;

            // Log the action
            await supabase.from("audit_logs").insert({
                action: "wallet_balance_updated",
                user_id: userId,
                details: { wallet_id: walletId, new_balance: balance, admin_id: clerkUserId },
            });

            return NextResponse.json({ success: true, message: "Balance updated" });
        }

        // Action: Create new wallet (e.g., crypto wallet)
        if (action === "create_wallet") {
            const { data: newWallet, error } = await supabase
                .from("wallets")
                .insert({
                    user_id: userId,
                    account_name: accountName || "Crypto Wallet",
                    account_number: accountNumber || generateAccountNumber(currency),
                    account_type: currency === "USD" ? "checking" : "crypto",
                    currency: currency || "BTC",
                    balance: parseFloat(balance) || 0,
                    is_primary: false,
                })
                .select()
                .single();

            if (error) throw error;

            // Log the action
            await supabase.from("audit_logs").insert({
                action: "wallet_created",
                user_id: userId,
                details: { wallet_id: newWallet.id, currency, admin_id: clerkUserId },
            });

            return NextResponse.json({ success: true, wallet: newWallet });
        }

        // Action: Credit/Debit wallet
        if (action === "credit" || action === "debit") {
            const { data: wallet } = await supabase
                .from("wallets")
                .select("balance")
                .eq("id", walletId)
                .single();

            if (!wallet) {
                return NextResponse.json(
                    { error: "Wallet not found" },
                    { status: 404 }
                );
            }

            const amount = parseFloat(balance);
            const newBalance = action === "credit"
                ? wallet.balance + amount
                : wallet.balance - amount;

            if (newBalance < 0) {
                return NextResponse.json(
                    { error: "Insufficient balance for debit" },
                    { status: 400 }
                );
            }

            const { error } = await supabase
                .from("wallets")
                .update({ balance: newBalance })
                .eq("id", walletId);

            if (error) throw error;

            // Create a transaction record
            await supabase.from("transactions").insert({
                user_id: userId,
                type: action === "credit" ? "deposit" : "withdrawal",
                amount: amount,
                status: "approved",
                description: `Admin ${action}: ${currency || "USD"} ${amount}`,
            });

            // Log the action
            await supabase.from("audit_logs").insert({
                action: `wallet_${action}`,
                user_id: userId,
                details: {
                    wallet_id: walletId,
                    amount,
                    old_balance: wallet.balance,
                    new_balance: newBalance,
                    admin_id: clerkUserId
                },
            });

            return NextResponse.json({
                success: true,
                message: `${action.charAt(0).toUpperCase() + action.slice(1)} successful`,
                newBalance
            });
        }

        return NextResponse.json(
            { error: "Invalid action" },
            { status: 400 }
        );
    } catch (error) {
        console.error("Admin wallet API error:", error);
        return NextResponse.json(
            { error: "Failed to update wallet" },
            { status: 500 }
        );
    }
}

function generateAccountNumber(currency: string): string {
    const prefix = currency === "BTC" ? "BTC" : currency === "ETH" ? "ETH" : currency === "USDT" ? "USDT" : "USD";
    const numbers = Array.from({ length: 10 }, () => Math.floor(Math.random() * 10)).join("");
    return `${prefix}${numbers}`;
}

// GET: Fetch user wallets for admin
export async function GET(request: NextRequest) {
    try {
        const authSupabase = await createServerClient();
        const { data: { user: authUser } } = await authSupabase.auth.getUser();
        const clerkUserId = authUser?.id;

        if (!clerkUserId) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

        if (!supabaseUrl || !supabaseServiceKey) {
            return NextResponse.json(
                { error: "Supabase not configured" },
                { status: 500 }
            );
        }

        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        // Check if user is admin in DB
        const { data: dbUser } = await supabase
            .from("users")
            .select("role")
            .eq("clerk_id", clerkUserId)
            .single();

        if (!dbUser || (dbUser.role !== "admin" && dbUser.role !== "super_admin")) {
            return NextResponse.json(
                { error: "Forbidden: Admin access required" },
                { status: 403 }
            );
        }

        const { searchParams } = new URL(request.url);
        const userId = searchParams.get("userId");

        if (!userId) {
            return NextResponse.json(
                { error: "User ID is required" },
                { status: 400 }
            );
        }

        const { data: wallets, error } = await supabase
            .from("wallets")
            .select("*")
            .eq("user_id", userId)
            .order("is_primary", { ascending: false });

        if (error) throw error;

        return NextResponse.json({ wallets });
    } catch (error) {
        console.error("Admin wallet GET error:", error);
        return NextResponse.json(
            { error: "Failed to fetch wallets" },
            { status: 500 }
        );
    }
}
