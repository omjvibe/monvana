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

// POST - Create a new transaction (transfer or withdrawal)
export async function POST(req: Request) {
    try {
        const authSupabase = await createServerClient();
        const { data: { user: authUser } } = await authSupabase.auth.getUser();
        const clerkUserId = authUser?.id;
        if (!clerkUserId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const supabase = getSupabase();

        // Get user from Clerk ID
        const { data: user, error: userError } = await supabase
            .from("users")
            .select("id, first_name, last_name, email, transaction_pin")
            .eq("clerk_id", clerkUserId)
            .single();

        if (userError || !user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        const body = await req.json();
        const {
            type,
            amount,
            pin,
            otp, // NEW: OTP verification
            billingCode, // NEW: Billing code verification
            recipientName,
            recipientAccount,
            recipientBank,
            swiftCode,
            routingNumber,
            description
        } = body;

        // Check if OTP is enabled globally
        const { data: otpSetting } = await supabase
            .from("bank_settings")
            .select("value")
            .eq("key", "transfer_otp")
            .single();

        if (otpSetting?.value === "true" && type === "transfer") {
            if (!otp) {
                return NextResponse.json({ error: "OTP verification required" }, { status: 403 });
            }

            // Verify that the OTP was recently verified in the database
            const { data: verifiedOtp } = await supabase
                .from("otps")
                .select("id")
                .eq("user_id", user.id)
                .eq("code", otp)
                .eq("type", "transfer")
                .eq("is_verified", true)
                .gt("expires_at", new Date().toISOString())
                .limit(1)
                .single();

            if (!verifiedOtp) {
                return NextResponse.json({ error: "Invalid or unverified OTP" }, { status: 403 });
            }
        }

        // Validate PIN
        if (user.transaction_pin !== pin) {
            return NextResponse.json({ error: "Invalid PIN" }, { status: 403 });
        }

        // Validate amount
        const txAmount = parseFloat(amount);
        if (!txAmount || txAmount < 1) {
            return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
        }

        // Get primary wallet
        const { data: wallet, error: walletError } = await supabase
            .from("wallets")
            .select("id, balance")
            .eq("user_id", user.id)
            .eq("is_primary", true)
            .single();

        if (walletError || !wallet) {
            return NextResponse.json({ error: "Wallet not found" }, { status: 404 });
        }

        // Check balance
        const currentBalance = parseFloat(wallet.balance);
        if (txAmount > currentBalance) {
            return NextResponse.json({
                error: `Insufficient balance. Available: $${currentBalance.toFixed(2)}`
            }, { status: 400 });
        }

        // Check for active unpaid billing codes that require verification
        const { data: activeCodes } = await supabase
            .from("billing_codes")
            .select("id, code_type, code, amount, is_paid, is_active")
            .eq("user_id", user.id)
            .eq("is_active", true)
            .eq("is_paid", false);

        const unpaidActiveCodes = activeCodes || [];

        if (unpaidActiveCodes.length > 0) {
            // User has unpaid active billing codes - ALL must be verified
            if (!billingCode) {
                const codeTypes = unpaidActiveCodes.map(c => c.code_type.toUpperCase().replace("_", " ")).join(", ");
                const totalAmount = unpaidActiveCodes.reduce((sum, c) => sum + Number(c.amount), 0);
                return NextResponse.json({
                    error: `You have ${unpaidActiveCodes.length} pending verification code(s): ${codeTypes}. Total: $${totalAmount.toFixed(2)}. Contact support for your verification codes.`,
                    requiresBillingCode: true,
                    codeCount: unpaidActiveCodes.length,
                    codeTypes: unpaidActiveCodes.map(c => c.code_type),
                }, { status: 403 });
            }

            // Parse the provided billing codes (can be comma-separated for multiple codes)
            const providedCodes = billingCode.split(",").map((c: string) => c.trim().toUpperCase());

            // Check that ALL active codes are provided
            const allCodesProvided = unpaidActiveCodes.every(activeCode =>
                providedCodes.includes(activeCode.code.toUpperCase())
            );

            if (!allCodesProvided) {
                const missingCodes = unpaidActiveCodes
                    .filter(ac => !providedCodes.includes(ac.code.toUpperCase()))
                    .map(c => c.code_type.toUpperCase().replace("_", " "));

                return NextResponse.json({
                    error: `Missing verification code(s) for: ${missingCodes.join(", ")}. All ${unpaidActiveCodes.length} codes are required.`,
                    requiresBillingCode: true,
                    codeCount: unpaidActiveCodes.length,
                }, { status: 403 });
            }

            // Mark ALL billing codes as paid
            for (const code of unpaidActiveCodes) {
                await supabase
                    .from("billing_codes")
                    .update({
                        is_paid: true,
                        paid_at: new Date().toISOString(),
                    })
                    .eq("id", code.id);
            }
        }

        // Generate reference
        const reference = `${type.toUpperCase().slice(0, 3)}-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

        // Deduct balance from wallet
        const newBalance = currentBalance - txAmount;
        const { error: balanceError } = await supabase
            .from("wallets")
            .update({
                balance: newBalance,
                updated_at: new Date().toISOString()
            })
            .eq("id", wallet.id);

        if (balanceError) {
            console.error("Error updating balance:", balanceError);
            return NextResponse.json({ error: "Failed to update balance" }, { status: 500 });
        }

        // Fetch automated transfer approval settings
        const { data: autoApprovalSetting } = await supabase
            .from("bank_settings")
            .select("value")
            .eq("key", "auto_transfer_approval")
            .single();
        
        const { data: thresholdSetting } = await supabase
            .from("bank_settings")
            .select("value")
            .eq("key", "auto_transfer_threshold")
            .single();

        const isAutoApprovalEnabled = autoApprovalSetting?.value === "true";
        const autoApprovalThreshold = parseFloat(thresholdSetting?.value || "100000");

        // Determine initial status
        let initialStatus = "pending";
        if (type === "transfer" && isAutoApprovalEnabled && txAmount < autoApprovalThreshold) {
            initialStatus = "approved";
        }

        // Create transaction
        const { data: transaction, error: txError } = await supabase.from("transactions").insert({
            user_id: user.id,
            wallet_id: wallet.id,
            type,
            amount: txAmount,
            currency: "USD",
            status: initialStatus,
            description: description || `${type === "transfer" ? "Transfer" : "Withdrawal"} to ${recipientName}`,
            reference,
            recipient_name: recipientName || null,
            recipient_account: recipientAccount || null,
            recipient_bank: recipientBank || null,
            swift_code: swiftCode || null,
            routing_number: routingNumber || null,
        }).select().single();

        if (txError) {
            console.error("Error creating transaction:", txError);
            // Rollback balance
            await supabase
                .from("wallets")
                .update({ balance: currentBalance })
                .eq("id", wallet.id);
            return NextResponse.json({ error: "Failed to create transaction" }, { status: 500 });
        }

        // Get admin users to notify
        const { data: admins } = await supabase
            .from("users")
            .select("id")
            .eq("role", "admin");

        // Notify all admins
        if (admins && admins.length > 0) {
            const notifications = admins.map(admin => ({
                user_id: admin.id,
                title: `New ${type === "transfer" ? "Transfer" : "Withdrawal"} Request`,
                message: `${user.first_name} ${user.last_name} requested a ${type} of $${txAmount.toFixed(2)}`,
                type: "admin",
                is_read: false,
            }));

            await supabase.from("notifications").insert(notifications);
        }

        // Notify user
        await supabase.from("notifications").insert({
            user_id: user.id,
            title: initialStatus === "approved" ? "Transaction Successful" : "Transaction Submitted",
            message: initialStatus === "approved" 
                ? `Your ${type} of $${txAmount.toFixed(2)} was successful.`
                : `Your ${type} request for $${txAmount.toFixed(2)} has been submitted and is pending approval.`,
            type: "transaction",
            is_read: false,
        });

        // Send email notification to user if approved
        if (initialStatus === "approved") {
            try {
                const { sendTransactionEmail } = await import("@/lib/email");
                await sendTransactionEmail(
                    user.email || "", // Need to make sure we have user email
                    user.first_name || "User",
                    type as any,
                    txAmount,
                    "approved",
                    transaction.reference,
                    description || undefined,
                    user.id
                );
            } catch (emailError) {
                console.error("User email notification error:", emailError);
            }
        }

        // Send email notification to admin
        try {
            await sendAdminNotificationEmail(
                type === "transfer" ? "new_transfer" : "new_withdrawal",
                {
                    userName: `${user.first_name} ${user.last_name}`,
                    amount: txAmount,
                    transactionType: type,
                    reference: transaction.reference,
                    description: description || undefined,
                }
            );
        } catch (emailError) {
            console.error("Admin email notification error:", emailError);
        }

        return NextResponse.json({
            success: true,
            message: "Transaction submitted successfully",
            transaction: {
                id: transaction.id,
                reference: transaction.reference,
                amount: txAmount,
                status: initialStatus
            },
            newBalance
        });

    } catch (error) {
        console.error("Error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
