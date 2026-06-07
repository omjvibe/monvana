import { NextResponse } from "next/server";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { sendAdminNotificationEmail } from "@/lib/email";

function getSupabase(): SupabaseClient {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
        throw new Error("Server configuration error");
    }

    return createClient(supabaseUrl, supabaseServiceKey);
}

// POST - Create deposit request
export async function POST(req: Request) {
    try {
        const authSupabase = await createServerClient();
        const { data: { user: authUser } } = await authSupabase.auth.getUser();
        const clerkUserId = authUser?.id;
        if (!clerkUserId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const supabase = getSupabase();

        // Get user
        const { data: user, error: userError } = await supabase
            .from("users")
            .select("id, first_name, last_name, email")
            .eq("clerk_id", clerkUserId)
            .single();

        if (userError || !user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        const body = await req.json();
        const { amount, currency, method, proof_url, deposit_method_id } = body;

        if (!amount || parseFloat(amount) <= 0) {
            return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
        }

        if (!proof_url) {
            return NextResponse.json({ error: "Proof of payment is required" }, { status: 400 });
        }

        // Get user's primary wallet
        const { data: wallet } = await supabase
            .from("wallets")
            .select("id")
            .eq("user_id", user.id)
            .eq("is_primary", true)
            .single();

        if (!wallet) {
            return NextResponse.json({ error: "User wallet not found" }, { status: 404 });
        }

        // Generate reference
        const reference = `DEP-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

        // Create deposit transaction
        const { data: transaction, error: txError } = await supabase
            .from("transactions")
            .insert({
                user_id: user.id,
                wallet_id: wallet.id,
                type: "deposit",
                amount: parseFloat(amount),
                currency: currency || "USD",
                status: "pending",
                reference,
                description: `${method || "Deposit"} - Awaiting approval`,
                proof_url,
            })
            .select()
            .single();

        if (txError) {
            console.error("Error creating transaction:", txError);
            return NextResponse.json({ error: "Failed to create deposit request" }, { status: 500 });
        }

        // Notify all admins
        console.log('[DEPOSIT] Fetching admin users for notification...');
        const { data: admins, error: adminsError } = await supabase
            .from("users")
            .select("id")
            .eq("role", "admin");

        console.log('[DEPOSIT] Admins found:', admins?.length || 0, 'Error:', adminsError);

        if (admins && admins.length > 0) {
            const notifications = admins.map((admin: { id: string }) => ({
                user_id: admin.id,
                title: "New Deposit Request",
                message: `${user.first_name} ${user.last_name} submitted a deposit request for ${currency || 'USD'} ${parseFloat(amount).toLocaleString()}. Proof attached.`,
                type: "transaction",
                is_read: false,
            }));

            console.log('[DEPOSIT] Creating admin notifications:', notifications.length);
            const { error: notifError } = await supabase.from("notifications").insert(notifications);
            if (notifError) {
                console.error('[DEPOSIT] Error creating admin notifications:', notifError);
            } else {
                console.log('[DEPOSIT] ✅ Admin in-app notifications created');
            }
        } else {
            console.warn('[DEPOSIT] ⚠️ No admin users found to notify!');
        }

        // Notify user
        console.log('[DEPOSIT] Creating user notification...');
        const { error: userNotifError } = await supabase.from("notifications").insert({
            user_id: user.id,
            title: "Deposit Request Received",
            message: `Your deposit request for ${currency || 'USD'} ${parseFloat(amount).toLocaleString()} has been submitted and is being reviewed.`,
            type: "transaction",
            is_read: false,
        });

        if (userNotifError) {
            console.error('[DEPOSIT] Error creating user notification:', userNotifError);
        } else {
            console.log('[DEPOSIT] ✅ User notification created');
        }

        // Send email notification to admin
        console.log('[DEPOSIT] Sending admin email notification...');
        try {
            const emailResult = await sendAdminNotificationEmail("new_deposit", {
                userName: `${user.first_name} ${user.last_name}`,
                userEmail: user.email,
                amount: parseFloat(amount),
                transactionType: "deposit",
                reference,
                description: method || "Deposit",
            });
            console.log('[DEPOSIT] Email result:', emailResult);
        } catch (emailError) {
            console.error("[DEPOSIT] Admin email notification error:", emailError);
        }

        return NextResponse.json({
            success: true,
            transaction: {
                id: transaction.id,
                reference: transaction.reference,
            }
        });

    } catch (error) {
        console.error("Error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
