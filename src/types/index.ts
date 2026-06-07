// Database types for Monvana Bank

export type Role = "admin" | "user";

export type TransactionType =
    | "deposit"
    | "withdrawal"
    | "transfer"
    | "loan"
    | "investment"
    | "donation"
    | "bonus"
    | "fee";

export type TransactionStatus =
    | "pending"
    | "processing"
    | "on_hold"
    | "approved"
    | "cancelled"
    | "failed";

export type AccountType =
    | "savings"
    | "checking"
    | "business"
    | "premium"
    | "corporate";

export type BillingCodeType =
    | "imf"
    | "vat"
    | "lbt"
    | "upgrade_fee"
    | "withdrawal_fee";

export type LoanStatus =
    | "pending"
    | "approved"
    | "rejected"
    | "active"
    | "paid"
    | "defaulted";

export type InvestmentStatus =
    | "active"
    | "matured"
    | "cancelled";

export type CardStatus =
    | "pending"
    | "active"
    | "frozen"
    | "expired"
    | "cancelled";

export type CardType =
    | "visa"
    | "mastercard";

// User status type
export type UserStatus = "active" | "suspended" | "pending" | "banned";

// User profile type
export interface User {
    id: string;
    clerk_id: string;
    email: string;
    first_name?: string;
    last_name?: string;
    phone?: string;
    avatar_url?: string;
    occupation?: string;
    country?: string;
    currency?: string;
    account_type?: AccountType;
    account_name?: string;
    role: Role;
    status: UserStatus;
    is_verified?: boolean;
    kyc_status?: "pending" | "approved" | "rejected";
    referral_code?: string;
    referred_by?: string;
    transaction_pin?: string;
    created_at: string;
    updated_at: string;
}

// Wallet type
export interface Wallet {
    id: string;
    user_id: string;
    balance: number;
    pin_hash: string;
    assigned_crypto_address?: string;
    created_at: string;
    updated_at: string;
}

// Transaction type
export interface Transaction {
    id: string;
    user_id: string;
    type: TransactionType;
    amount: number;
    currency: string;
    status: TransactionStatus;
    description?: string;
    recipient_name?: string;
    recipient_account?: string;
    recipient_bank?: string;
    reference?: string;
    metadata?: Record<string, unknown>;
    created_at: string;
    updated_at: string;
}

// Billing code type
export interface BillingCode {
    id: string;
    user_id: string;
    code_type: BillingCodeType;
    code: string;
    amount: number;
    is_active: boolean;
    is_paid: boolean;
    created_at: string;
    updated_at: string;
}

// Loan type
export interface Loan {
    id: string;
    user_id: string;
    amount: number;
    interest_rate: number;
    term_months: number;
    monthly_payment: number;
    total_payable?: number;
    remaining_balance: number;
    purpose?: string;
    description?: string;
    status: LoanStatus;
    approved_by?: string;
    approved_at?: string;
    next_payment_date?: string;
    created_at: string;
    updated_at: string;
}

// Investment plan type
export interface InvestmentPlan {
    id: string;
    name: string;
    description?: string;
    min_amount: number;
    max_amount: number;
    roi_percentage: number;
    duration_days: number;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

// User investment type
export interface Investment {
    id: string;
    user_id: string;
    plan_id: string;
    plan?: InvestmentPlan;
    amount: number;
    expected_return: number;
    status: InvestmentStatus;
    maturity_date: string;
    created_at: string;
    updated_at: string;
}

// Charity type
export interface Charity {
    id: string;
    name: string;
    description?: string;
    image_url?: string;
    is_verified: boolean;
    total_donations: number;
    created_at: string;
    updated_at: string;
}

// Donation type
export interface Donation {
    id: string;
    user_id: string;
    charity_id: string;
    charity?: Charity;
    amount: number;
    message?: string;
    is_anonymous: boolean;
    created_at: string;
}

// Virtual card type
export interface VirtualCard {
    id: string;
    user_id: string;
    card_number: string;
    card_type: CardType;
    cvv: string;
    expiry_month: number;
    expiry_year: number;
    cardholder_name: string;
    status: CardStatus;
    limit_amount: number;
    spent_amount: number;
    created_at: string;
    updated_at: string;
}

// Crypto address type
export interface CryptoAddress {
    id: string;
    address: string;
    network: string;
    qr_code_url?: string;
    is_assigned: boolean;
    assigned_to?: string;
    created_at: string;
    updated_at: string;
}

// Referral type
export interface Referral {
    id: string;
    referrer_id: string;
    referred_id: string;
    bonus_amount: number;
    is_paid: boolean;
    created_at: string;
}

// Bank info type
export interface BankInfo {
    id: string;
    name: string;
    logo_url?: string;
    tagline?: string;
    description?: string;
    contact_email?: string;
    contact_phone?: string;
    address?: string;
    social_links?: {
        twitter?: string;
        facebook?: string;
        linkedin?: string;
        instagram?: string;
    };
    branding?: {
        primary_color?: string;
        secondary_color?: string;
    };
    created_at: string;
    updated_at: string;
}

// Audit log type
export interface AuditLog {
    id: string;
    admin_id: string;
    admin?: User;
    action: string;
    entity_type: string;
    entity_id?: string;
    details?: Record<string, unknown>;
    ip_address?: string;
    created_at: string;
}

// Message type for support chat
export interface Message {
    id: string;
    sender_id: string;
    receiver_id: string;
    content: string;
    is_read: boolean;
    created_at: string;
}

// API response types
export interface ApiResponse<T> {
    data?: T;
    error?: string;
    message?: string;
}

export interface PaginatedResponse<T> {
    data: T[];
    total: number;
    page: number;
    per_page: number;
    total_pages: number;
}
