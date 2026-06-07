// Bank configuration constants
export const BANK_NAME = "Monvana Bank";
export const BANK_TAGLINE = "Your Trusted Digital Banking Partner";

// Default values
export const DEFAULT_PIN = "1234";
export const DEFAULT_CURRENCY = "USD";

// Billing code types
export const BILLING_CODE_TYPES = [
    { id: "imf", name: "IMF Code", description: "International Monetary Fund verification code" },
    { id: "vat", name: "VAT Code", description: "Value Added Tax compliance code" },
    { id: "lbt", name: "LBT Code", description: "Local Bank Transfer code" },
    { id: "upgrade_fee", name: "Upgrade Fee", description: "Account upgrade processing fee" },
    { id: "withdrawal_fee", name: "Withdrawal Fee", description: "Withdrawal processing fee" },
] as const;

// Transaction statuses
export const TRANSACTION_STATUSES = [
    { id: "pending", name: "Pending", color: "warning" },
    { id: "processing", name: "Processing", color: "warning" },
    { id: "on_hold", name: "On Hold", color: "warning" },
    { id: "approved", name: "Approved", color: "success" },
    { id: "cancelled", name: "Cancelled", color: "destructive" },
    { id: "failed", name: "Failed", color: "destructive" },
] as const;

// Transaction types
export const TRANSACTION_TYPES = [
    { id: "deposit", name: "Deposit" },
    { id: "withdrawal", name: "Withdrawal" },
    { id: "transfer", name: "Wire Transfer" },
    { id: "loan", name: "Loan" },
    { id: "investment", name: "Investment" },
    { id: "donation", name: "Donation" },
    { id: "bonus", name: "Bonus" },
    { id: "fee", name: "Fee" },
] as const;

// Account types
export const ACCOUNT_TYPES = [
    { id: "savings", name: "Savings Account", description: "Standard savings account with competitive interest rates" },
    { id: "checking", name: "Checking Account", description: "Everyday transaction account" },
    { id: "business", name: "Business Account", description: "Account designed for business operations" },
    { id: "premium", name: "Premium Account", description: "Premium banking with exclusive benefits" },
    { id: "corporate", name: "Corporate Account", description: "Enterprise-level banking solutions" },
] as const;

// Supported currencies
export const CURRENCIES = [
    { code: "USD", name: "US Dollar", symbol: "$" },
    { code: "EUR", name: "Euro", symbol: "€" },
    { code: "GBP", name: "British Pound", symbol: "£" },
    { code: "JPY", name: "Japanese Yen", symbol: "¥" },
    { code: "CHF", name: "Swiss Franc", symbol: "Fr" },
    { code: "AUD", name: "Australian Dollar", symbol: "A$" },
    { code: "CAD", name: "Canadian Dollar", symbol: "C$" },
    { code: "CNY", name: "Chinese Yuan", symbol: "¥" },
    { code: "INR", name: "Indian Rupee", symbol: "₹" },
    { code: "SGD", name: "Singapore Dollar", symbol: "S$" },
] as const;

// Navigation items for user dashboard
// First 5 items are shown in mobile bottom nav: Deposit, Withdraw, Dashboard, Transactions, Settings
export const USER_NAV_ITEMS = [
    { name: "Deposit", href: "/user/deposits", icon: "Download" },
    { name: "Withdraw", href: "/user/withdrawals", icon: "Upload" },
    { name: "Dashboard", href: "/user", icon: "LayoutDashboard" },
    { name: "Transactions", href: "/user/transactions", icon: "Receipt" },
    { name: "Settings", href: "/user/settings", icon: "Settings" },
    { name: "Transfer", href: "/user/transfers", icon: "ArrowLeftRight" },
    { name: "Loans", href: "/user/loans", icon: "Landmark" },
    { name: "Investments", href: "/user/investments", icon: "TrendingUp" },
    { name: "Charities", href: "/user/charities", icon: "Heart" },
    { name: "Messages", href: "/user/messages", icon: "MessageCircle" },
    { name: "Verification", href: "/user/kyc", icon: "ShieldCheck" },
] as const;

// Navigation items for admin dashboard
export const ADMIN_NAV_ITEMS = [
    { name: "Dashboard", href: "/admin", icon: "LayoutDashboard" },
    { name: "Users", href: "/admin/users", icon: "Users" },
    { name: "Transactions", href: "/admin/transactions", icon: "Receipt" },
    { name: "Loans", href: "/admin/loans", icon: "Landmark" },
    { name: "Investments", href: "/admin/investments", icon: "TrendingUp" },
    { name: "Charities", href: "/admin/charities", icon: "Heart" },
    { name: "Crypto", href: "/admin/crypto", icon: "Bitcoin" },
    { name: "Messages", href: "/admin/messages", icon: "MessageCircle" },
    { name: "Inbox", href: "/admin/inbox", icon: "Mail" },
    { name: "Verification", href: "/admin/kyc", icon: "ShieldCheck" },
    { name: "Audit Logs", href: "/admin/audit", icon: "FileText" },
    { name: "Analytics", href: "/admin/analytics", icon: "BarChart3" },
    { name: "Settings", href: "/admin/settings", icon: "Settings" },
] as const;

// Countries list (Comprehensive Global List)
export const COUNTRIES = [
    "Afghanistan", "Albania", "Algeria", "Andorra", "Angola", "Antigua and Barbuda", "Argentina", "Armenia", "Australia", "Austria",
    "Azerbaijan", "Bahamas", "Bahrain", "Bangladesh", "Barbados", "Belarus", "Belgium", "Belize", "Benin", "Bhutan",
    "Bolivia", "Bosnia and Herzegovina", "Botswana", "Brazil", "Brunei", "Bulgaria", "Burkina Faso", "Burundi", "Cabo Verde", "Cambodia",
    "Cameroon", "Canada", "Central African Republic", "Chad", "Chile", "China", "Colombia", "Comoros", "Congo", "Costa Rica",
    "Côte d'Ivoire", "Croatia", "Cuba", "Cyprus", "Czech Republic", "Denmark", "Djibouti", "Dominica", "Dominican Republic", "Ecuador",
    "Egypt", "El Salvador", "Equatorial Guinea", "Eritrea", "Estonia", "Eswatini", "Ethiopia", "Fiji", "Finland", "France",
    "Gabon", "Gambia", "Georgia", "Germany", "Ghana", "Greece", "Grenada", "Guatemala", "Guinea", "Guyana",
    "Haiti", "Honduras", "Hong Kong", "Hungary", "Iceland", "India", "Indonesia", "Iran", "Iraq", "Ireland",
    "Israel", "Italy", "Jamaica", "Japan", "Jordan", "Kazakhstan", "Kenya", "Kiribati", "Korea, North", "Korea, South",
    "Kuwait", "Kyrgyzstan", "Laos", "Latvia", "Lebanon", "Lesotho", "Liberia", "Libya", "Liechtenstein", "Lithuania",
    "Luxembourg", "Madagascar", "Malawi", "Malaysia", "Maldives", "Mali", "Malta", "Marshall Islands", "Mauritania", "Mauritius",
    "Mexico", "Micronesia", "Moldova", "Monaco", "Mongolia", "Montenegro", "Morocco", "Mozambique", "Myanmar", "Namibia",
    "Nauru", "Nepal", "Netherlands", "New Zealand", "Nicaragua", "Niger", "Nigeria", "North Macedonia", "Norway", "Oman",
    "Pakistan", "Palau", "Panama", "Papua New Guinea", "Paraguay", "Peru", "Philippines", "Poland", "Portugal", "Qatar",
    "Romania", "Russia", "Rwanda", "Saint Kitts and Nevis", "Saint Lucia", "Samoa", "San Marino", "Saudi Arabia", "Senegal", "Serbia",
    "Seychelles", "Sierra Leone", "Singapore", "Slovakia", "Slovenia", "Solomon Islands", "Somalia", "South Africa", "Spain", "Sri Lanka",
    "Sudan", "Suriname", "Sweden", "Switzerland", "Syria", "Taiwan", "Tajikistan", "Tanzania", "Thailand", "Timor-Leste",
    "Togo", "Tonga", "Trinidad and Tobago", "Tunisia", "Turkey", "Turkmenistan", "Tuvalu", "Uganda", "Ukraine", "United Arab Emirates",
    "United Kingdom", "United States", "Uruguay", "Uzbekistan", "Vanuatu", "Vatican City", "Venezuela", "Vietnam", "Yemen", "Zambia", "Zimbabwe"
] as const;

// Occupations list
export const OCCUPATIONS = [
    "Software Engineer", "Doctor", "Lawyer", "Accountant", "Teacher",
    "Business Owner", "Consultant", "Engineer", "Nurse", "Architect",
    "Financial Analyst", "Marketing Manager", "Sales Executive", "Researcher", "Scientist",
    "Entrepreneur", "Retired", "Student", "Other",
] as const;
