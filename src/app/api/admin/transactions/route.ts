import { NextResponse } from "next/server";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { sendTransactionEmail } from "@/lib/email";

function getAdminSupabase(): SupabaseClient {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
        throw new Error("Server configuration error");
    }

    return createClient(supabaseUrl, supabaseServiceKey);
}

interface AdminUser {
    id: string;
    role: string;
}

async function verifyAdmin(supabase: SupabaseClient, clerkUserId: string): Promise<AdminUser | null> {
    const { data: adminUser } = await supabase
        .from("users")
        .select("id, role")
        .eq("clerk_id", clerkUserId)
        .single();

    if (adminUser && (adminUser as AdminUser).role === "admin") {
        return adminUser as AdminUser;
    }

    return null;
}

// GET - Fetch all transactions
export async function GET(req: Request) {
    try {
        const authSupabase = await createServerClient();
        const { data: { user: authUser } } = await authSupabase.auth.getUser();
        const userId = authUser?.id;
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const supabase = getAdminSupabase();
        const admin = await verifyAdmin(supabase, userId);
        if (!admin) {
            return NextResponse.json({ error: "Admin access required" }, { status: 403 });
        }

        const url = new URL(req.url);
        const status = url.searchParams.get("status");
        const type = url.searchParams.get("type");
        const limit = parseInt(url.searchParams.get("limit") || "50");

        let query = supabase
            .from("transactions")
            .select(`
                *,
                user:users!user_id(id, first_name, last_name, email),
                wallet:wallets(id, currency, account_number)
            `)
            .order("created_at", { ascending: false })
            .limit(limit);

        if (status && status !== "all") {
            query = query.eq("status", status);
        }
        if (type && type !== "all") {
            query = query.eq("type", type);
        }

        const { data: transactions, error } = await query;

        if (error) {
            console.error("Error fetching transactions:", error);
            return NextResponse.json({ error: "Failed to fetch transactions" }, { status: 500 });
        }

        // Get transaction stats
        const { data: allTransactions } = await supabase
            .from("transactions")
            .select("status, amount");

        interface TransactionStat {
            status: string;
            amount: number;
        }

        const stats = {
            total: allTransactions?.length || 0,
            pending: allTransactions?.filter((t: TransactionStat) => t.status === "pending").length || 0,
            processing: allTransactions?.filter((t: TransactionStat) => t.status === "processing").length || 0,
            onHold: allTransactions?.filter((t: TransactionStat) => t.status === "on_hold").length || 0,
            approved: allTransactions?.filter((t: TransactionStat) => t.status === "approved").length || 0,
            totalAmount: allTransactions?.filter((t: TransactionStat) => t.status === "approved").reduce((sum: number, t: TransactionStat) => sum + Number(t.amount), 0) || 0,
        };

        return NextResponse.json({ transactions: transactions || [], stats });

    } catch (error) {
        console.error("Error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

// PATCH - Update transaction status and/or edit transaction details
export async function PATCH(req: Request) {
    try {
        const authSupabase = await createServerClient();
        const { data: { user: authUser } } = await authSupabase.auth.getUser();
        const userId = authUser?.id;
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const supabase = getAdminSupabase();
        const admin = await verifyAdmin(supabase, userId);
        if (!admin) {
            return NextResponse.json({ error: "Admin access required" }, { status: 403 });
        }

        const body = await req.json();
        const { transactionId, status, adminNote, editDetails } = body;

        if (!transactionId) {
            return NextResponse.json({ error: "Transaction ID required" }, { status: 400 });
        }

        // Get current transaction
        const { data: transaction, error: fetchError } = await supabase
            .from("transactions")
            .select("*")
            .eq("id", transactionId)
            .single();

        if (fetchError || !transaction) {
            return NextResponse.json({ error: "Transaction not found" }, { status: 404 });
        }

        // --- Handle detail edits (amount, description, date, recipient, type) ---
        if (editDetails) {
            const detailUpdate: Record<string, unknown> = {
                updated_at: new Date().toISOString(),
            };

            const editableFields = [
                "amount", "description", "type",
                "recipient_name", "recipient_account", "recipient_bank",
                "swift_code", "routing_number", "currency"
            ];

            for (const field of editableFields) {
                if (editDetails[field] !== undefined && editDetails[field] !== null) {
                    detailUpdate[field] = editDetails[field];
                }
            }

            // Special handling for created_at (backdating)
            if (editDetails.created_at) {
                detailUpdate.created_at = new Date(editDetails.created_at).toISOString();
            }

            if (adminNote) {
                detailUpdate.admin_note = adminNote;
            }

            const { error: editError } = await supabase
                .from("transactions")
                .update(detailUpdate)
                .eq("id", transactionId);

            if (editError) {
                console.error("Error editing transaction details:", editError);
                return NextResponse.json({ error: "Failed to edit transaction" }, { status: 500 });
            }

            // Log audit for detail edit
            try {
                const changedFields = Object.keys(detailUpdate).filter(k => k !== "updated_at");
                await supabase.from("audit_logs").insert({
                    admin_id: admin.id,
                    action: "editTransactionDetails",
                    target_user_id: transaction.user_id,
                    details: `Edited transaction ${transactionId} fields: ${changedFields.join(", ")}`,
                    ip_address: req.headers.get("x-forwarded-for") || "unknown",
                });
            } catch (e) {
                console.error("Audit log error:", e);
            }

            // If no status change requested, return early
            if (!status) {
                return NextResponse.json({
                    success: true,
                    message: "Transaction details updated",
                });
            }
        }

        // --- Handle status change (existing logic) ---
        if (!status) {
            return NextResponse.json({ error: "Status or editDetails required" }, { status: 400 });
        }

        const validStatuses = ["pending", "processing", "on_hold", "approved", "sent", "cancelled", "failed"];
        if (!validStatuses.includes(status)) {
            return NextResponse.json({ error: "Invalid status" }, { status: 400 });
        }

        const previousStatus = transaction.status;

        // Update transaction
        const updateData: Record<string, unknown> = {
            status,
            updated_at: new Date().toISOString(),
        };

        if (status === "approved") {
            updateData.processed_by = admin.id;
            updateData.processed_at = new Date().toISOString();
        }

        if (adminNote) {
            updateData.admin_note = adminNote;
        }

        const { error: updateError } = await supabase
            .from("transactions")
            .update(updateData)
            .eq("id", transactionId);

        if (updateError) {
            console.error("Error updating transaction:", updateError);
            return NextResponse.json({ error: "Failed to update transaction" }, { status: 500 });
        }

        // If transaction is approved for deposits, credit the wallet
        if (status === "approved" && previousStatus !== "approved" && transaction.type === "deposit") {
            const { data: wallet } = await supabase
                .from("wallets")
                .select("balance")
                .eq("id", transaction.wallet_id)
                .single();

            if (wallet) {
                const newBalance = parseFloat(wallet.balance) + parseFloat(transaction.amount);
                await supabase
                    .from("wallets")
                    .update({ balance: newBalance, updated_at: new Date().toISOString() })
                    .eq("id", transaction.wallet_id);
            }
        }

        // If transfer/withdrawal is cancelled or failed, refund the balance
        const isRefundableType = ["transfer", "withdrawal"].includes(transaction.type);
        const isRefundableStatus = ["cancelled", "failed"].includes(status);
        const wasNotAlreadyRefunded = !["cancelled", "failed", "approved"].includes(previousStatus);

        if (isRefundableType && isRefundableStatus && wasNotAlreadyRefunded) {
            // Get or create wallet reference
            let walletId = transaction.wallet_id;

            if (!walletId) {
                // Find user's primary wallet if not set
                const { data: userWallet } = await supabase
                    .from("wallets")
                    .select("id, balance")
                    .eq("user_id", transaction.user_id)
                    .eq("is_primary", true)
                    .single();

                if (userWallet) {
                    walletId = userWallet.id;
                    const newBalance = parseFloat(userWallet.balance) + parseFloat(transaction.amount);
                    await supabase
                        .from("wallets")
                        .update({ balance: newBalance, updated_at: new Date().toISOString() })
                        .eq("id", walletId);
                }
            } else {
                const { data: wallet } = await supabase
                    .from("wallets")
                    .select("balance")
                    .eq("id", walletId)
                    .single();

                if (wallet) {
                    const newBalance = parseFloat(wallet.balance) + parseFloat(transaction.amount);
                    await supabase
                        .from("wallets")
                        .update({ balance: newBalance, updated_at: new Date().toISOString() })
                        .eq("id", walletId);
                }
            }
        }

        // Create notification for user
        let notificationTitle = "";
        let notificationMessage = "";
        const formattedAmount = new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: transaction.currency || "USD",
        }).format(transaction.amount);

        switch (status) {
            case "approved":
                notificationTitle = "Transaction Approved ✅";
                notificationMessage = `Your ${transaction.type} of ${formattedAmount} has been approved.`;
                break;
            case "processing":
                notificationTitle = "Transaction Processing";
                notificationMessage = `Your ${transaction.type} of ${formattedAmount} is now being processed.`;
                break;
            case "on_hold":
                notificationTitle = "Transaction On Hold ⏸️";
                notificationMessage = `Your ${transaction.type} of ${formattedAmount} has been placed on hold. Please contact support.`;
                break;
            case "cancelled":
                notificationTitle = "Transaction Cancelled";
                notificationMessage = `Your ${transaction.type} of ${formattedAmount} has been cancelled.`;
                break;
            case "failed":
                notificationTitle = "Transaction Failed";
                notificationMessage = `Your ${transaction.type} of ${formattedAmount} has failed. Please contact support.`;
                break;
            default:
                notificationTitle = "Transaction Update";
                notificationMessage = `Your ${transaction.type} status has been updated to ${status}.`;
        }

        await supabase.from("notifications").insert({
            user_id: transaction.user_id,
            title: notificationTitle,
            message: notificationMessage,
            type: "transaction",
            is_read: false,
        });

        // Send email notification
        console.log('[TRANSACTION] Sending status update email...');
        try {
            const { data: userData } = await supabase
                .from("users")
                .select("email, first_name")
                .eq("id", transaction.user_id)
                .single();

            console.log('[TRANSACTION] User data for email:', userData?.email ? 'Email found' : 'No email');

            if (userData?.email) {
                const emailResult = await sendTransactionEmail(
                    userData.email,
                    userData.first_name || "Customer",
                    transaction.type as 'deposit' | 'withdrawal' | 'transfer' | 'bonus',
                    parseFloat(transaction.amount),
                    status,
                    transaction.reference,
                    adminNote || transaction.description
                );
                console.log('[TRANSACTION] Email result:', emailResult);
            }
        } catch (emailError) {
            console.error("[TRANSACTION] Email notification error:", emailError);
            // Don't fail the request if email fails
        }

        // Log audit
        try {
            await supabase.from("audit_logs").insert({
                admin_id: admin.id,
                action: "updateTransactionStatus",
                target_user_id: transaction.user_id,
                details: `Changed transaction ${transactionId} from ${previousStatus} to ${status}`,
                ip_address: req.headers.get("x-forwarded-for") || "unknown",
            });
        } catch (e) {
            console.error("Audit log error:", e);
        }

        return NextResponse.json({
            success: true,
            message: `Transaction status updated to ${status}`,
        });

    } catch (error) {
        console.error("Error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

// DELETE - Permanently remove a transaction record
export async function DELETE(req: Request) {
    try {
        const authSupabase = await createServerClient();
        const { data: { user: authUser } } = await authSupabase.auth.getUser();
        const userId = authUser?.id;
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const supabase = getAdminSupabase();
        const admin = await verifyAdmin(supabase, userId);
        if (!admin) {
            return NextResponse.json({ error: "Admin access required" }, { status: 403 });
        }

        const body = await req.json();
        const { transactionId } = body;

        if (!transactionId) {
            return NextResponse.json({ error: "Transaction ID required" }, { status: 400 });
        }

        // 1. Fetch transaction details for audit log before deletion
        const { data: transaction, error: fetchError } = await supabase
            .from("transactions")
            .select("user_id, amount, currency, type, reference")
            .eq("id", transactionId)
            .single();

        if (fetchError || !transaction) {
            return NextResponse.json({ error: "Transaction not found" }, { status: 404 });
        }

        // 2. Delete the transaction
        const { error: deleteError } = await supabase
            .from("transactions")
            .delete()
            .eq("id", transactionId);

        if (deleteError) {
            console.error("Error deleting transaction:", deleteError);
            return NextResponse.json({ error: "Failed to delete transaction" }, { status: 500 });
        }

        // 3. Log audit
        try {
            await supabase.from("audit_logs").insert({
                admin_id: admin.id,
                action: "deleteTransaction",
                target_user_id: transaction.user_id,
                details: `Deleted transaction ${transactionId} (${transaction.type} of ${transaction.amount} ${transaction.currency}, Ref: ${transaction.reference})`,
                ip_address: req.headers.get("x-forwarded-for") || "unknown",
            });
        } catch (e) {
            console.error("Audit log error:", e);
        }

        return NextResponse.json({
            success: true,
            message: "Transaction deleted successfully",
        });

    } catch (error) {
        console.error("Error deleting transaction:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
