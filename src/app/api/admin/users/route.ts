import { NextResponse } from "next/server";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { sendAccountStatusEmail } from "@/lib/email";

// Crypto prices cache (in USD)
const CRYPTO_PRICES: Record<string, number> = {
    BTC: 100000,  // Will be updated via API
    ETH: 3500,
    USDT: 1,
    USDC: 1,
    USD: 1,
    EUR: 1.08,
    GBP: 1.27,
};

// Fetch latest crypto prices
async function getCryptoPrices(): Promise<Record<string, number>> {
    try {
        // Use CoinGecko free API
        const response = await fetch(
            "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,tether,usd-coin&vs_currencies=usd",
            { next: { revalidate: 300 } } // Cache for 5 minutes
        );
        if (response.ok) {
            const data = await response.json();
            return {
                BTC: data.bitcoin?.usd || CRYPTO_PRICES.BTC,
                ETH: data.ethereum?.usd || CRYPTO_PRICES.ETH,
                USDT: data.tether?.usd || 1,
                USDC: data["usd-coin"]?.usd || 1,
                USD: 1,
                EUR: 1.08,
                GBP: 1.27,
            };
        }
    } catch (error) {
        console.error("Error fetching crypto prices:", error);
    }
    return CRYPTO_PRICES;
}

// Helper to get admin supabase client
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

// Helper to verify admin
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

interface WalletData {
    currency: string;
    balance: number;
}

// Calculate total balance in USD
function calculateTotalBalanceUSD(wallets: WalletData[], prices: Record<string, number>): number {
    return wallets.reduce((total, wallet) => {
        const price = prices[wallet.currency] || 1;
        return total + (Number(wallet.balance) * price);
    }, 0);
}

// GET - Fetch all users with their wallets and billing codes
export async function GET() {
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

        // Get crypto prices for balance calculation
        const prices = await getCryptoPrices();

        // Fetch all users with their wallets
        const { data: users, error: usersError } = await supabase
            .from("users")
            .select(`
                *,
                wallets (id, currency, balance, account_number, account_name, account_type, is_primary, deposit_address),
                billing_codes (id, code_type, code, amount, is_paid, is_active)
            `)
            .neq("id", admin.id) // Exclude current admin
            .neq("status", "deleted") // Exclude deleted users
            .order("created_at", { ascending: false });

        if (usersError) {
            console.error("Error fetching users:", usersError);
            return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
        }

        // Calculate total balance in USD for each user
        const usersWithTotals = (users || []).map(user => {
            const userWallets = (user.wallets || []) as WalletData[];
            const totalBalanceUSD = calculateTotalBalanceUSD(userWallets, prices);
            return {
                ...user,
                totalBalance: totalBalanceUSD,
                walletBreakdown: userWallets.map(w => ({
                    currency: w.currency,
                    balance: w.balance,
                    usdValue: Number(w.balance) * (prices[w.currency] || 1)
                }))
            };
        });

        return NextResponse.json({
            users: usersWithTotals,
            cryptoPrices: prices
        });

    } catch (error) {
        console.error("Error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

// Helper to log admin actions
async function logAudit(
    supabase: SupabaseClient,
    adminId: string,
    action: string,
    targetUserId: string | null,
    details: string,
    req: Request
) {
    try {
        await supabase.from("audit_logs").insert({
            admin_id: adminId,
            action,
            target_user_id: targetUserId,
            details,
            ip_address: req.headers.get("x-forwarded-for") || "unknown",
        });
    } catch (e) {
        console.error("Audit log error:", e);
    }
}

// PATCH - Update user details, status, balance, or billing codes
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
        const { action, targetUserId } = body;

        if (!action || !targetUserId) {
            return NextResponse.json({ error: "Action and targetUserId required" }, { status: 400 });
        }

        // Wrapper for easier logging in this handler
        const logAuditLocal = async (actionType: string, details: string) => {
            await logAudit(supabase, admin.id, actionType, targetUserId, details, req);
        };

        switch (action) {
            // Update user status (activate/suspend)
            case "updateStatus": {
                const { status } = body;
                if (!["active", "suspended", "pending"].includes(status)) {
                    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
                }

                // Get user info for email
                const { data: targetUser } = await supabase
                    .from("users")
                    .select("email, first_name")
                    .eq("id", targetUserId)
                    .single();

                const { error } = await supabase
                    .from("users")
                    .update({
                        status,
                        updated_at: new Date().toISOString(),
                        suspended_at: status === "suspended" ? new Date().toISOString() : null,
                        suspended_by: status === "suspended" ? admin.id : null,
                    })
                    .eq("id", targetUserId);

                if (error) throw error;

                // Create notification for user
                await supabase.from("notifications").insert({
                    user_id: targetUserId,
                    title: status === "suspended" ? "Account Suspended" : "Account Activated",
                    message: status === "suspended"
                        ? "Your account has been suspended. Please contact support for more information."
                        : "Your account has been activated. You now have full access.",
                    type: "system",
                    is_read: false,
                });

                // Send email notification
                if (targetUser?.email && (status === "active" || status === "suspended")) {
                    try {
                        await sendAccountStatusEmail(
                            targetUser.email,
                            targetUser.first_name || "Customer",
                            status as "active" | "suspended"
                        );
                    } catch (emailError) {
                        console.error("Email error:", emailError);
                    }
                }

                await logAuditLocal("updateStatus", `Changed user status to ${status}`);
                return NextResponse.json({ success: true, message: `User status updated to ${status}` });
            }

            // Update user KYC status
            case "updateKycStatus": {
                const { kycStatus } = body;
                if (!["unverified", "pending", "approved", "rejected"].includes(kycStatus)) {
                    return NextResponse.json({ error: "Invalid KYC status" }, { status: 400 });
                }

                const { error } = await supabase
                    .from("users")
                    .update({
                        kyc_status: kycStatus,
                        updated_at: new Date().toISOString(),
                    })
                    .eq("id", targetUserId);

                if (error) throw error;

                // Also update the status of the most recent kyc_submission if it exists
                if (kycStatus === "approved" || kycStatus === "rejected") {
                    try {
                        const { data: latestSub } = await supabase
                            .from("kyc_submissions")
                            .select("id")
                            .eq("user_id", targetUserId)
                            .order("created_at", { ascending: false })
                            .limit(1)
                            .single();

                        if (latestSub) {
                            await supabase
                                .from("kyc_submissions")
                                .update({ status: kycStatus })
                                .eq("id", latestSub.id);
                        }
                    } catch (e) {
                        console.error("No kyc_submission found to sync status with");
                    }
                }

                await logAuditLocal("updateKycStatus", `Manually changed user KYC status to ${kycStatus}`);
                return NextResponse.json({ success: true, message: `KYC status updated to ${kycStatus}` });
            }

            // Update user profile
            case "updateProfile": {
                const { firstName, lastName, email, country, accountType, dailyLimit, monthlyLimit } = body;

                const updateData: Record<string, unknown> = {
                    updated_at: new Date().toISOString(),
                };

                if (firstName !== undefined) updateData.first_name = firstName;
                if (lastName !== undefined) updateData.last_name = lastName;
                if (email !== undefined) updateData.email = email;
                if (country !== undefined) updateData.country = country;
                if (accountType !== undefined) updateData.account_type = accountType;
                if (dailyLimit !== undefined) updateData.daily_limit = dailyLimit;
                if (monthlyLimit !== undefined) updateData.monthly_limit = monthlyLimit;

                const { error } = await supabase
                    .from("users")
                    .update(updateData)
                    .eq("id", targetUserId);

                if (error) throw error;
                await logAuditLocal("updateProfile", `Updated profile fields: ${Object.keys(updateData).join(", ")}`);
                return NextResponse.json({ success: true, message: "User profile updated" });
            }

            // Admin deposit (replaces updateBalance)
            case "adminDeposit": {
                // Now supports Credits (+), Debits (-), and Charges (-)
                const { walletId, amount, txType, txSubtype, senderName, senderAccount, senderBank, reference, date, reason } = body;

                // Get current balance
                const { data: wallet } = await supabase
                    .from("wallets")
                    .select("*")
                    .eq("id", walletId)
                    .single();

                if (!wallet) {
                    return NextResponse.json({ error: "Wallet not found" }, { status: 404 });
                }

                const txAmount = parseFloat(amount);
                if (isNaN(txAmount) || txAmount <= 0) {
                    return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
                }

                // Balance calculation: credit (+), debit/charge (-)
                const isDebit = txType === "debit" || txType === "charge";
                const newBalance = isDebit
                    ? parseFloat(wallet.balance) - txAmount
                    : parseFloat(wallet.balance) + txAmount;

                if (isDebit && newBalance < 0) {
                    return NextResponse.json({ error: "Insufficient balance for this transaction" }, { status: 400 });
                }

                // Map UI subtypes to DB types
                // DB types allowed: 'deposit', 'withdrawal', 'transfer', 'loan', 'investment', 'donation', 'bonus', 'fee', 'refund', 'charge'
                let dbType = "deposit";
                if (txType === "charge") dbType = "charge";
                else if (txType === "debit") dbType = "withdrawal";
                else {
                    // Credit types
                    if (txSubtype?.toLowerCase().includes("transfer")) dbType = "transfer";
                    else if (txSubtype?.toLowerCase().includes("bonus")) dbType = "bonus";
                    else dbType = "deposit";
                }

                // 1. Update wallet balance
                const { error: walletError } = await supabase
                    .from("wallets")
                    .update({
                        balance: newBalance,
                        updated_at: new Date().toISOString()
                    })
                    .eq("id", walletId);

                if (walletError) throw walletError;

                // 2. Create an approved transaction record
                // Professional descriptions: Account Credit, Account Debit, Service Charge
                const defaultDesc = isDebit
                    ? (txType === "charge" ? `Service Charge - ${txSubtype || "Maintenance"}` : `Account Debit - ${txSubtype || "Miscellaneous"}`)
                    : `Account Credit - ${senderName || "Inbound Transfer"}`;

                const defaultRefPrefix = dbType === "deposit" ? "CRD" : dbType === "withdrawal" ? "DBT" : dbType === "fee" ? "FEE" : "TRF";

                const { error: txError } = await supabase.from("transactions").insert({
                    user_id: targetUserId,
                    wallet_id: walletId,
                    type: dbType,
                    amount: txAmount,
                    currency: wallet.currency,
                    status: "approved",
                    description: reason || defaultDesc,
                    reference: reference || `${defaultRefPrefix}-${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
                    sender_name: txType === "credit" ? senderName : null,
                    sender_account: txType === "credit" ? senderAccount : null,
                    sender_bank: txType === "credit" ? senderBank : null,
                    processed_by: admin.id,
                    processed_at: new Date().toISOString(),
                    created_at: date || new Date().toISOString()
                });

                if (txError) throw txError;

                // 3. Create notification for user
                let notifTitle = "Funds Received";
                let notifMsg = `An amount of ${txAmount} ${wallet.currency} has been added to your account.`;

                if (txType === "charge") {
                    notifTitle = "Service Charge";
                    notifMsg = `A service charge of ${txAmount} ${wallet.currency} has been debited from your account for ${txSubtype}.`;
                } else if (txType === "debit") {
                    notifTitle = "Funds Withdrawn";
                    notifMsg = `A manual withdrawal of ${txAmount} ${wallet.currency} has been processed from your account.`;
                }

                await supabase.from("notifications").insert({
                    user_id: targetUserId,
                    title: notifTitle,
                    message: notifMsg,
                    type: "transaction",
                    is_read: false,
                });

                await logAuditLocal(
                    "adminTransaction",
                    `${txType} of ${txAmount} ${wallet.currency} (${txSubtype}). ${isDebit ? "" : "Sender: " + (senderName || "N/A")}`
                );

                return NextResponse.json({ success: true, message: `${txType.charAt(0).toUpperCase() + txType.slice(1)} completed successfully` });
            }

            // Create new wallet
            case "createWallet": {
                const { currency, initialBalance, depositAddress } = body;

                // Check if wallet already exists
                const { data: existing } = await supabase
                    .from("wallets")
                    .select("id")
                    .eq("user_id", targetUserId)
                    .eq("currency", currency)
                    .single();

                if (existing) {
                    return NextResponse.json({ error: "Wallet already exists" }, { status: 400 });
                }

                // Get user name for account name
                const { data: user } = await supabase
                    .from("users")
                    .select("first_name, last_name")
                    .eq("id", targetUserId)
                    .single();

                const accountNumber = `${Date.now().toString().slice(-6)}${Math.floor(Math.random() * 10000).toString().padStart(4, "0")}`;
                const accountName = `${user?.first_name || ""} ${user?.last_name || ""} - ${currency}`.trim();

                const { error } = await supabase.from("wallets").insert({
                    user_id: targetUserId,
                    currency,
                    balance: parseFloat(initialBalance) || 0,
                    account_type: ["BTC", "ETH", "USDT", "USDC"].includes(currency) ? "crypto" : "savings",
                    account_number: accountNumber,
                    account_name: accountName,
                    deposit_address: depositAddress || null,
                    is_primary: false,
                });

                if (error) throw error;
                await logAuditLocal("createWallet", `Created ${currency} wallet with initial balance ${initialBalance}`);
                return NextResponse.json({ success: true, message: `${currency} wallet created` });
            }

            // Update wallet deposit address
            case "updateDepositAddress": {
                const { walletId, depositAddress } = body;

                const { error } = await supabase
                    .from("wallets")
                    .update({
                        deposit_address: depositAddress,
                        updated_at: new Date().toISOString()
                    })
                    .eq("id", walletId);

                if (error) throw error;
                await logAuditLocal("updateDepositAddress", `Updated deposit address for wallet ${walletId}`);
                return NextResponse.json({ success: true, message: "Deposit address updated" });
            }

            // Manage billing codes
            case "manageBillingCode": {
                const { codeType, code, amount, isActive } = body;

                // Check if code already exists
                const { data: existing } = await supabase
                    .from("billing_codes")
                    .select("id")
                    .eq("user_id", targetUserId)
                    .eq("code_type", codeType)
                    .single();

                if (existing) {
                    // Update existing code
                    const updateData: Record<string, unknown> = {
                        updated_at: new Date().toISOString(),
                    };
                    if (code !== undefined) updateData.code = code;
                    if (amount !== undefined) updateData.amount = amount;
                    if (isActive !== undefined) updateData.is_active = isActive;

                    const { error } = await supabase
                        .from("billing_codes")
                        .update(updateData)
                        .eq("id", existing.id);

                    if (error) throw error;
                } else {
                    // Create new code
                    const generatedCode = code || `${codeType.toUpperCase()}-${Math.random().toString(36).substr(2, 8).toUpperCase()}`;

                    const { error } = await supabase.from("billing_codes").insert({
                        user_id: targetUserId,
                        code_type: codeType,
                        code: generatedCode,
                        amount: amount || 0,
                        is_active: isActive !== undefined ? isActive : true,
                        is_paid: false,
                    });

                    if (error) throw error;
                }

                await logAuditLocal("manageBillingCode", `${existing ? "Updated" : "Created"} ${codeType} billing code`);
                return NextResponse.json({ success: true, message: `Billing code ${existing ? "updated" : "created"}` });
            }

            // Reset billing code (mark as unpaid)
            case "resetBillingCode": {
                const { codeId } = body;

                const { error } = await supabase
                    .from("billing_codes")
                    .update({
                        is_paid: false,
                        paid_at: null,
                        updated_at: new Date().toISOString()
                    })
                    .eq("id", codeId);

                if (error) throw error;
                await logAuditLocal("resetBillingCode", `Reset billing code ${codeId}`);
                return NextResponse.json({ success: true, message: "Billing code reset" });
            }

            // Update user transaction PIN
            case "updatePin": {
                const { newPin } = body;

                if (!newPin || newPin.length !== 4 || !/^\d{4}$/.test(newPin)) {
                    return NextResponse.json({ error: "PIN must be exactly 4 digits" }, { status: 400 });
                }

                const { error } = await supabase
                    .from("users")
                    .update({
                        transaction_pin: newPin,
                        updated_at: new Date().toISOString()
                    })
                    .eq("id", targetUserId);

                if (error) throw error;

                // Notify user that their PIN was reset
                await supabase.from("notifications").insert({
                    user_id: targetUserId,
                    title: "Transaction PIN Reset",
                    message: "Your transaction PIN has been reset by an administrator. Please contact support if you did not request this.",
                    type: "security",
                    is_read: false,
                });

                await logAuditLocal("updatePin", `Reset user transaction PIN`);
                return NextResponse.json({ success: true, message: "PIN reset successfully" });
            }

            default:
                return NextResponse.json({ error: "Unknown action" }, { status: 400 });
        }

    } catch (error) {
        console.error("Error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

// DELETE - Delete a user
export async function DELETE(req: Request) {
    try {
        const authSupabase = await createServerClient();
        const { data: { user: authUser } } = await authSupabase.auth.getUser();
        const clerkUserId = authUser?.id;
        if (!clerkUserId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const supabase = getAdminSupabase();
        const admin = await verifyAdmin(supabase, clerkUserId);
        if (!admin) {
            return NextResponse.json({ error: "Admin access required" }, { status: 403 });
        }

        const body = await req.json();
        const { targetUserId } = body;

        if (!targetUserId) {
            return NextResponse.json({ error: "User ID required" }, { status: 400 });
        }

        // 1. Fetch user's clerk_id from Supabase
        const { data: user, error: fetchError } = await supabase
            .from("users")
            .select("clerk_id, email, first_name, last_name")
            .eq("id", targetUserId)
            .single();

        if (fetchError || !user) {
            console.error("Error fetching user for deletion:", fetchError);
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        // 2. Log audit BEFORE deletion (to maintain FK integrity while user still exists)
        await logAudit(supabase, admin.id, "DELETE_USER", targetUserId, `Permanently deleted user: ${user.email} (${user.first_name} ${user.last_name})`, req);

        // 3. Delete from Supabase Auth
        try {
            await supabase.auth.admin.deleteUser(user.clerk_id);
        } catch (authError: any) {
            console.error("Supabase auth deletion error:", authError);
        }

        // 4. Cleanup potentially blocking relations manually (Fallback if migration 025 wasn't run)
        try {
            await supabase.from("referrals").delete().or(`referrer_id.eq.${targetUserId},referred_id.eq.${targetUserId}`);
        } catch (e) {
            console.warn("Referral cleanup warning (may be safe to ignore):", e);
        }

        // 5. Delete from Supabase (Cascade will handle related data for most tables)
        const { data: deletedRows, error: deleteError } = await supabase
            .from("users")
            .delete()
            .eq("id", targetUserId)
            .select();

        if (deleteError) {
            console.error("Error deleting user from database:", deleteError);
            return NextResponse.json({
                error: "Failed to delete user from database",
                details: deleteError.message,
                code: deleteError.code
            }, { status: 500 });
        }

        const count = deletedRows?.length || 0;
        console.log(`Deletion diagnostic: targetUserId=${targetUserId}, rowsDeleted=${count}`);

        if (count === 0) {
            return NextResponse.json({
                error: "User record not found in database during deletion",
                diagnostic: { targetUserId, count }
            }, { status: 404 });
        }

        return NextResponse.json({
            success: true,
            message: "User deleted successfully from all systems",
            diagnostic: { rowsDeleted: count, targetUserId }
        });

    } catch (error) {
        console.error("Error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
