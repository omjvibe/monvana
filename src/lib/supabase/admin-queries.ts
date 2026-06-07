import { createClient } from "@supabase/supabase-js";
import type { User, Transaction, Loan } from "@/types";

// Admin queries use service role for full access
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ==========================================
// ADMIN: USER MANAGEMENT
// ==========================================

export async function getAllUsers(options?: {
    limit?: number;
    offset?: number;
    status?: string;
    search?: string;
}) {
    let query = supabaseAdmin
        .from("users")
        .select("*, wallets(*)")
        .order("created_at", { ascending: false });

    if (options?.status && options.status !== "all") {
        query = query.eq("status", options.status);
    }
    if (options?.search) {
        query = query.or(
            `email.ilike.%${options.search}%,first_name.ilike.%${options.search}%,last_name.ilike.%${options.search}%`
        );
    }
    if (options?.limit) {
        query = query.limit(options.limit);
    }
    if (options?.offset) {
        query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
}

export async function getUserById(userId: string) {
    const { data, error } = await supabaseAdmin
        .from("users")
        .select("*, wallets(*)")
        .eq("id", userId)
        .single();

    if (error) throw error;
    return data;
}

export async function updateUser(userId: string, updates: Partial<User>) {
    const { data, error } = await supabaseAdmin
        .from("users")
        .update(updates)
        .eq("id", userId)
        .select()
        .single();

    if (error) throw error;
    return data;
}

export async function updateUserBalance(userId: string, walletId: string, newBalance: number) {
    const { data, error } = await supabaseAdmin
        .from("wallets")
        .update({ balance: newBalance })
        .eq("id", walletId)
        .eq("user_id", userId)
        .select()
        .single();

    if (error) throw error;

    // Log the action
    await logAdminAction({
        action: "balance_update",
        target_type: "wallet",
        target_id: walletId,
        details: { userId, newBalance },
        category: "financial",
    });

    return data;
}

export async function suspendUser(userId: string) {
    return updateUser(userId, { status: "suspended" });
}

export async function activateUser(userId: string) {
    return updateUser(userId, { status: "active" });
}

// ==========================================
// ADMIN: TRANSACTION MANAGEMENT
// ==========================================

export async function getAllTransactions(options?: {
    limit?: number;
    offset?: number;
    type?: string;
    status?: string;
    search?: string;
}) {
    let query = supabaseAdmin
        .from("transactions")
        .select("*, user:users(id, email, first_name, last_name)")
        .order("created_at", { ascending: false });

    if (options?.type && options.type !== "all") {
        query = query.eq("type", options.type);
    }
    if (options?.status && options.status !== "all") {
        query = query.eq("status", options.status);
    }
    if (options?.limit) {
        query = query.limit(options.limit);
    }
    if (options?.offset) {
        query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
}

export async function updateTransactionStatus(
    transactionId: string,
    status: Transaction["status"],
    adminId: string,
    adminNote?: string
) {
    const { data, error } = await supabaseAdmin
        .from("transactions")
        .update({
            status,
            admin_note: adminNote,
            processed_by: adminId,
            processed_at: new Date().toISOString(),
        })
        .eq("id", transactionId)
        .select()
        .single();

    if (error) throw error;

    // If approved, update wallet balance
    if (status === "approved" && data) {
        const tx = data as Transaction;
        if (tx.type === "deposit") {
            await creditUserWallet(tx.user_id, tx.amount);
        } else if (tx.type === "withdrawal" || tx.type === "transfer") {
            await debitUserWallet(tx.user_id, tx.amount);
        }
    }

    await logAdminAction({
        actor_id: adminId,
        action: `transaction_${status}`,
        target_type: "transaction",
        target_id: transactionId,
        details: { status, adminNote },
        category: "financial",
    });

    return data;
}

async function creditUserWallet(userId: string, amount: number) {
    const { data: wallet } = await supabaseAdmin
        .from("wallets")
        .select("*")
        .eq("user_id", userId)
        .eq("is_primary", true)
        .single();

    if (wallet) {
        await supabaseAdmin
            .from("wallets")
            .update({ balance: wallet.balance + amount })
            .eq("id", wallet.id);
    }
}

async function debitUserWallet(userId: string, amount: number) {
    const { data: wallet } = await supabaseAdmin
        .from("wallets")
        .select("*")
        .eq("user_id", userId)
        .eq("is_primary", true)
        .single();

    if (wallet) {
        await supabaseAdmin
            .from("wallets")
            .update({ balance: Math.max(0, wallet.balance - amount) })
            .eq("id", wallet.id);
    }
}

// ==========================================
// ADMIN: LOAN MANAGEMENT
// ==========================================

export async function getAllLoans(options?: {
    limit?: number;
    status?: string;
}) {
    let query = supabaseAdmin
        .from("loans")
        .select("*, user:users(id, email, first_name, last_name)")
        .order("created_at", { ascending: false });

    if (options?.status && options.status !== "all") {
        query = query.eq("status", options.status);
    }
    if (options?.limit) {
        query = query.limit(options.limit);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
}

export async function updateLoanStatus(
    loanId: string,
    status: Loan["status"],
    adminId: string
) {
    const updates: Record<string, unknown> = { status };

    if (status === "approved") {
        updates.approved_by = adminId;
        updates.approved_at = new Date().toISOString();
    }

    const { data, error } = await supabaseAdmin
        .from("loans")
        .update(updates)
        .eq("id", loanId)
        .select()
        .single();

    if (error) throw error;

    // If approved, credit the loan amount to user's wallet
    if (status === "approved" && data) {
        await creditUserWallet(data.user_id, data.amount);

        // Create a transaction record
        await supabaseAdmin.from("transactions").insert({
            user_id: data.user_id,
            type: "loan",
            amount: data.amount,
            status: "approved",
            description: `Loan disbursement - ${data.purpose || "Personal Loan"}`,
        });
    }

    await logAdminAction({
        actor_id: adminId,
        action: `loan_${status}`,
        target_type: "loan",
        target_id: loanId,
        details: { status },
        category: "financial",
    });

    return data;
}

// ==========================================
// ADMIN: INVESTMENT PLAN MANAGEMENT
// ==========================================

export async function createInvestmentPlan(plan: {
    name: string;
    description?: string;
    min_amount: number;
    max_amount: number;
    roi_percentage: number;
    duration_days: number;
    features?: string[];
    created_by?: string;
}) {
    const { data, error } = await supabaseAdmin
        .from("investment_plans")
        .insert({
            ...plan,
            features: JSON.stringify(plan.features || []),
            is_active: true,
        })
        .select()
        .single();

    if (error) throw error;
    return data;
}

export async function updateInvestmentPlan(planId: string, updates: Record<string, unknown>) {
    const { data, error } = await supabaseAdmin
        .from("investment_plans")
        .update(updates)
        .eq("id", planId)
        .select()
        .single();

    if (error) throw error;
    return data;
}

export async function deleteInvestmentPlan(planId: string) {
    const { error } = await supabaseAdmin
        .from("investment_plans")
        .update({ is_active: false })
        .eq("id", planId);

    if (error) throw error;
}

// ==========================================
// ADMIN: CHARITY MANAGEMENT
// ==========================================

export async function createCharity(charity: {
    name: string;
    description?: string;
    category?: string;
    image_url?: string;
    website_url?: string;
    created_by?: string;
}) {
    const { data, error } = await supabaseAdmin
        .from("charities")
        .insert({ ...charity, is_active: true })
        .select()
        .single();

    if (error) throw error;
    return data;
}

export async function updateCharity(charityId: string, updates: Record<string, unknown>) {
    const { data, error } = await supabaseAdmin
        .from("charities")
        .update(updates)
        .eq("id", charityId)
        .select()
        .single();

    if (error) throw error;
    return data;
}

// ==========================================
// ADMIN: CRYPTO ADDRESS MANAGEMENT
// ==========================================

export async function assignCryptoAddress(
    userId: string,
    network: string,
    address: string
) {
    const { data, error } = await supabaseAdmin
        .from("crypto_addresses")
        .upsert({
            user_id: userId,
            network,
            address,
        })
        .select()
        .single();

    if (error) throw error;
    return data;
}

export async function getAllCryptoAddresses() {
    const { data, error } = await supabaseAdmin
        .from("crypto_addresses")
        .select("*, user:users(id, email, first_name, last_name)")
        .order("created_at", { ascending: false });

    if (error) throw error;
    return data || [];
}

// ==========================================
// ADMIN: BILLING CODE MANAGEMENT
// ==========================================

export async function assignBillingCode(
    userId: string,
    codeType: string,
    code: string,
    amount: number,
    transactionId?: string
) {
    const { data, error } = await supabaseAdmin
        .from("billing_codes")
        .insert({
            user_id: userId,
            transaction_id: transactionId,
            code_type: codeType,
            code,
            amount,
            is_paid: false,
            is_active: true,
        })
        .select()
        .single();

    if (error) throw error;
    return data;
}

// ==========================================
// ADMIN: AUDIT LOGS
// ==========================================

export async function getAuditLogs(options?: {
    limit?: number;
    category?: string;
    search?: string;
}) {
    let query = supabaseAdmin
        .from("audit_logs")
        .select("*")
        .order("created_at", { ascending: false });

    if (options?.category && options.category !== "all") {
        query = query.eq("category", options.category);
    }
    if (options?.search) {
        query = query.or(
            `action.ilike.%${options.search}%,actor_email.ilike.%${options.search}%,target_name.ilike.%${options.search}%`
        );
    }
    if (options?.limit) {
        query = query.limit(options.limit);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
}

export async function logAdminAction(params: {
    actor_id?: string;
    actor_email?: string;
    action: string;
    target_type?: string;
    target_id?: string;
    target_name?: string;
    details?: Record<string, unknown>;
    category: "auth" | "financial" | "security" | "settings" | "user";
}) {
    await supabaseAdmin.from("audit_logs").insert(params);
}

// ==========================================
// ADMIN: DASHBOARD STATS
// ==========================================

export async function getAdminDashboardStats() {
    const [usersResult, transactionsResult, loansResult, investmentsResult] =
        await Promise.all([
            supabaseAdmin.from("users").select("id, status", { count: "exact" }),
            supabaseAdmin
                .from("transactions")
                .select("id, status, amount, type", { count: "exact" }),
            supabaseAdmin.from("loans").select("id, status, amount", { count: "exact" }),
            supabaseAdmin.from("investments").select("id, status, amount"),
        ]);

    const users = usersResult.data || [];
    const transactions = transactionsResult.data || [];
    const loans = loansResult.data || [];
    const investments = investmentsResult.data || [];

    const totalBalance = await supabaseAdmin
        .from("wallets")
        .select("balance")
        .then(({ data }) => (data || []).reduce((sum, w) => sum + (w.balance || 0), 0));

    return {
        totalUsers: users.length,
        activeUsers: users.filter((u) => u.status === "active").length,
        suspendedUsers: users.filter((u) => u.status === "suspended").length,
        totalTransactions: transactions.length,
        pendingTransactions: transactions.filter((t) => t.status === "pending").length,
        onHoldTransactions: transactions.filter((t) => t.status === "on_hold").length,
        totalLoans: loans.length,
        pendingLoans: loans.filter((l) => l.status === "pending").length,
        activeLoansValue: loans
            .filter((l) => l.status === "active")
            .reduce((sum, l) => sum + l.amount, 0),
        totalInvestments: investments.length,
        activeInvestmentsValue: investments
            .filter((i) => i.status === "active")
            .reduce((sum, i) => sum + i.amount, 0),
        totalBalance,
    };
}

// ==========================================
// ADMIN: SEND MESSAGE TO USER
// ==========================================

export async function sendAdminMessage(
    userId: string,
    content: string,
    adminId: string
) {
    const { data, error } = await supabaseAdmin
        .from("messages")
        .insert({
            user_id: userId,
            sender_type: "admin",
            sender_id: adminId,
            content,
        })
        .select()
        .single();

    if (error) throw error;
    return data;
}
