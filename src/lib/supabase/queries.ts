import { createClient } from "@/lib/supabase/client";
import type { User, Wallet, Transaction, Loan, Investment, VirtualCard, Message } from "@/types";

const supabase = createClient();

// ==========================================
// USER QUERIES
// ==========================================

export async function getCurrentUser(): Promise<User | null> {
    const { data, error } = await supabase
        .from("users")
        .select("*")
        .single();

    if (error) {
        console.error("Error fetching user:", error);
        return null;
    }
    return data;
}

export async function getUserByClerkId(clerkId: string): Promise<User | null> {
    const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("clerk_id", clerkId)
        .single();

    if (error) {
        console.error("Error fetching user by clerk ID:", error);
        return null;
    }
    return data;
}

export async function updateUserProfile(userId: string, updates: Partial<User>) {
    const { data, error } = await supabase
        .from("users")
        .update(updates)
        .eq("id", userId)
        .select()
        .single();

    if (error) throw error;
    return data;
}

// ==========================================
// WALLET QUERIES
// ==========================================

export async function getUserWallet(userId: string): Promise<Wallet | null> {
    const { data, error } = await supabase
        .from("wallets")
        .select("*")
        .eq("user_id", userId)
        .eq("is_primary", true)
        .single();

    if (error) {
        console.error("Error fetching wallet:", error);
        return null;
    }
    return data;
}

export async function getAllUserWallets(userId: string): Promise<Wallet[]> {
    const { data, error } = await supabase
        .from("wallets")
        .select("*")
        .eq("user_id", userId)
        .order("is_primary", { ascending: false });

    if (error) {
        console.error("Error fetching wallets:", error);
        return [];
    }
    return data || [];
}

export async function updateWalletBalance(walletId: string, newBalance: number) {
    const { data, error } = await supabase
        .from("wallets")
        .update({ balance: newBalance })
        .eq("id", walletId)
        .select()
        .single();

    if (error) throw error;
    return data;
}

// ==========================================
// TRANSACTION QUERIES
// ==========================================

export async function getUserTransactions(
    userId: string,
    options?: {
        limit?: number;
        offset?: number;
        type?: string;
        status?: string;
    }
): Promise<Transaction[]> {
    let query = supabase
        .from("transactions")
        .select("*")
        .eq("user_id", userId)
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

    if (error) {
        console.error("Error fetching transactions:", error);
        return [];
    }
    return data || [];
}

export async function createTransaction(transaction: Omit<Transaction, "id" | "created_at" | "updated_at">) {
    const { data, error } = await supabase
        .from("transactions")
        .insert(transaction)
        .select()
        .single();

    if (error) throw error;
    return data;
}

export async function getTransactionById(transactionId: string): Promise<Transaction | null> {
    const { data, error } = await supabase
        .from("transactions")
        .select("*")
        .eq("id", transactionId)
        .single();

    if (error) {
        console.error("Error fetching transaction:", error);
        return null;
    }
    return data;
}

// ==========================================
// LOAN QUERIES
// ==========================================

export async function getUserLoans(userId: string): Promise<Loan[]> {
    const { data, error } = await supabase
        .from("loans")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

    if (error) {
        console.error("Error fetching loans:", error);
        return [];
    }
    return data || [];
}

export async function getActiveLoans(userId: string): Promise<Loan[]> {
    const { data, error } = await supabase
        .from("loans")
        .select("*")
        .eq("user_id", userId)
        .in("status", ["active", "approved"])
        .order("created_at", { ascending: false });

    if (error) {
        console.error("Error fetching active loans:", error);
        return [];
    }
    return data || [];
}

export async function createLoanApplication(loan: Omit<Loan, "id" | "created_at" | "updated_at">) {
    const { data, error } = await supabase
        .from("loans")
        .insert(loan)
        .select()
        .single();

    if (error) throw error;
    return data;
}

// ==========================================
// INVESTMENT QUERIES
// ==========================================

export async function getInvestmentPlans() {
    const { data, error } = await supabase
        .from("investment_plans")
        .select("*")
        .eq("is_active", true)
        .order("min_amount", { ascending: true });

    if (error) {
        console.error("Error fetching investment plans:", error);
        return [];
    }
    return data || [];
}

export async function getUserInvestments(userId: string): Promise<Investment[]> {
    const { data, error } = await supabase
        .from("investments")
        .select(`
      *,
      plan:investment_plans(*)
    `)
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

    if (error) {
        console.error("Error fetching investments:", error);
        return [];
    }
    return data || [];
}

export async function createInvestment(investment: Omit<Investment, "id" | "created_at" | "updated_at">) {
    const { data, error } = await supabase
        .from("investments")
        .insert(investment)
        .select()
        .single();

    if (error) throw error;
    return data;
}

// ==========================================
// VIRTUAL CARD QUERIES
// ==========================================

export async function getUserCards(userId: string): Promise<VirtualCard[]> {
    const { data, error } = await supabase
        .from("virtual_cards")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

    if (error) {
        console.error("Error fetching cards:", error);
        return [];
    }
    return data || [];
}

export async function createVirtualCard(card: Omit<VirtualCard, "id" | "created_at" | "updated_at">) {
    const { data, error } = await supabase
        .from("virtual_cards")
        .insert(card)
        .select()
        .single();

    if (error) throw error;
    return data;
}

export async function updateCardStatus(cardId: string, status: "active" | "frozen" | "cancelled") {
    const { data, error } = await supabase
        .from("virtual_cards")
        .update({ status })
        .eq("id", cardId)
        .select()
        .single();

    if (error) throw error;
    return data;
}

// ==========================================
// CHARITY & DONATIONS
// ==========================================

export async function getCharities() {
    const { data, error } = await supabase
        .from("charities")
        .select("*")
        .eq("is_active", true)
        .order("name");

    if (error) {
        console.error("Error fetching charities:", error);
        return [];
    }
    return data || [];
}

export async function getUserDonations(userId: string) {
    const { data, error } = await supabase
        .from("donations")
        .select(`
      *,
      charity:charities(name, category)
    `)
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

    if (error) {
        console.error("Error fetching donations:", error);
        return [];
    }
    return data || [];
}

export async function createDonation(donation: {
    user_id: string;
    charity_id: string;
    amount: number;
    is_anonymous?: boolean;
    message?: string;
}) {
    const { data, error } = await supabase
        .from("donations")
        .insert(donation)
        .select()
        .single();

    if (error) throw error;
    return data;
}

// ==========================================
// MESSAGES
// ==========================================

export async function getUserMessages(userId: string): Promise<Message[]> {
    const { data, error } = await supabase
        .from("messages")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: true });

    if (error) {
        console.error("Error fetching messages:", error);
        return [];
    }
    return data || [];
}

export async function sendMessage(message: {
    user_id: string;
    content: string;
    sender_type: "user" | "admin" | "system";
}) {
    const { data, error } = await supabase
        .from("messages")
        .insert(message)
        .select()
        .single();

    if (error) throw error;
    return data;
}

export async function markMessagesAsRead(userId: string) {
    const { error } = await supabase
        .from("messages")
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq("user_id", userId)
        .eq("is_read", false);

    if (error) throw error;
}

// ==========================================
// BILLING CODES (Withdrawal Verification)
// ==========================================

export async function getUserBillingCodes(userId: string, transactionId?: string) {
    let query = supabase
        .from("billing_codes")
        .select("*")
        .eq("user_id", userId)
        .eq("is_active", true);

    if (transactionId) {
        query = query.eq("transaction_id", transactionId);
    }

    const { data, error } = await query.order("created_at", { ascending: true });

    if (error) {
        console.error("Error fetching billing codes:", error);
        return [];
    }
    return data || [];
}

export async function verifyBillingCode(
    userId: string,
    codeType: string,
    code: string
): Promise<boolean> {
    const { data, error } = await supabase
        .from("billing_codes")
        .select("*")
        .eq("user_id", userId)
        .eq("code_type", codeType)
        .eq("code", code)
        .eq("is_paid", false)
        .eq("is_active", true)
        .single();

    if (error || !data) return false;

    // Mark as paid
    await supabase
        .from("billing_codes")
        .update({ is_paid: true, paid_at: new Date().toISOString() })
        .eq("id", data.id);

    return true;
}

// ==========================================
// CRYPTO ADDRESSES
// ==========================================

export async function getUserCryptoAddress(userId: string, network: string) {
    const { data, error } = await supabase
        .from("crypto_addresses")
        .select("*")
        .eq("user_id", userId)
        .eq("network", network)
        .single();

    if (error) {
        console.error("Error fetching crypto address:", error);
        return null;
    }
    return data;
}

export async function getAllUserCryptoAddresses(userId: string) {
    const { data, error } = await supabase
        .from("crypto_addresses")
        .select("*")
        .eq("user_id", userId);

    if (error) {
        console.error("Error fetching crypto addresses:", error);
        return [];
    }
    return data || [];
}

// ==========================================
// DASHBOARD STATS
// ==========================================

export async function getDashboardStats(userId: string) {
    const [wallet, transactions, loans, investments, cards] = await Promise.all([
        getUserWallet(userId),
        getUserTransactions(userId, { limit: 5 }),
        getActiveLoans(userId),
        getUserInvestments(userId),
        getUserCards(userId),
    ]);

    // Calculate income/expenses for this month
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const monthlyTransactions = await supabase
        .from("transactions")
        .select("type, amount, status")
        .eq("user_id", userId)
        .eq("status", "approved")
        .gte("created_at", startOfMonth.toISOString());

    let income = 0;
    let expenses = 0;

    (monthlyTransactions.data || []).forEach((tx: { type: string; amount: number }) => {
        if (tx.type === "deposit" || tx.type === "bonus") {
            income += tx.amount;
        } else if (tx.type === "withdrawal" || tx.type === "transfer" || tx.type === "fee") {
            expenses += tx.amount;
        }
    });

    return {
        balance: wallet?.balance || 0,
        income,
        expenses,
        recentTransactions: transactions,
        activeLoans: loans.length,
        totalLoansValue: loans.reduce((sum, l) => sum + l.remaining_balance, 0),
        activeInvestments: investments.filter((i) => i.status === "active").length,
        totalInvestmentsValue: investments
            .filter((i) => i.status === "active")
            .reduce((sum, i) => sum + i.amount, 0),
        virtualCards: cards.filter((c) => c.status === "active").length,
    };
}
