"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence, PanInfo } from "framer-motion";
import {
    Send,
    Download,
    Copy,
    Check,
    Loader2,
    Plus,
    Eye,
    EyeOff,
    User,
    ArrowUpRight,
    ArrowDownLeft,
    Banknote,
    Wallet,
    ArrowDownUp,
} from "lucide-react";
import Link from "next/link";
import { useUser } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { AnimatedGlobe } from "@/components/marketing/AnimatedGlobe";

// Types
interface WalletData {
    id: string;
    currency: string;
    balance: number;
    account_number: string;
    account_name: string;
}

interface Transaction {
    id: string;
    type: string;
    amount: number;
    currency: string;
    status: string;
    description: string;
    created_at: string;
    recipient_name?: string;
    sender_name?: string;
}

interface FavoriteContact {
    id: string;
    name: string;
    account_number: string;
    bank_name: string;
}

interface DashboardData {
    user: {
        first_name: string;
        last_name: string;
        email: string;
    };
    wallets: WalletData[];
    transactions: Transaction[];
}

// Utility functions
const formatCurrency = (amount: number, currency: string = "USD") => {
    const symbols: Record<string, string> = {
        USD: "$",
        BTC: "₿",
        ETH: "Ξ",
        USDT: "₮",
    };
    const symbol = symbols[currency] || "$";

    if (currency === "BTC" || currency === "ETH") {
        return `${symbol}${amount.toFixed(6)}`;
    }
    return `${symbol}${amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
};

export default function UserDashboard() {
    const [showBalance, setShowBalance] = useState(true);
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<DashboardData | null>(null);
    const [currentCardIndex, setCurrentCardIndex] = useState(0);
    const [copied, setCopied] = useState(false);
    const [favoriteContacts, setFavoriteContacts] = useState<FavoriteContact[]>([]);
    const [addContactOpen, setAddContactOpen] = useState(false);
    const [newContactName, setNewContactName] = useState("");
    const [newContactAccount, setNewContactAccount] = useState("");
    const [newContactBank, setNewContactBank] = useState("");

    const { user: clerkUser, isLoaded } = useUser();

    // Fetch dashboard data
    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await fetch("/api/user/dashboard");
                if (response.ok) {
                    const result = await response.json();
                    setData(result);
                }
            } catch (error) {
                console.error("Error fetching dashboard:", error);
            } finally {
                setLoading(false);
            }
        };

        if (isLoaded && clerkUser) {
            fetchData();
        }
    }, [isLoaded, clerkUser]);

    // Fetch favorite contacts
    useEffect(() => {
        const fetchContacts = async () => {
            try {
                const response = await fetch("/api/user/contacts");
                if (response.ok) {
                    const result = await response.json();
                    setFavoriteContacts(result.contacts || []);
                }
            } catch (error) {
                console.error("Error fetching contacts:", error);
            }
        };

        if (isLoaded && clerkUser) {
            fetchContacts();
        }
    }, [isLoaded, clerkUser]);

    // Copy to clipboard
    const handleCopy = useCallback((text: string) => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        toast.success("Copied to clipboard!");
        setTimeout(() => setCopied(false), 2000);
    }, []);

    // Handle card swipe
    const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
        const threshold = 50;
        const walletCount = wallets.length;

        if (info.offset.x < -threshold && currentCardIndex < walletCount - 1) {
            setCurrentCardIndex(currentCardIndex + 1);
        } else if (info.offset.x > threshold && currentCardIndex > 0) {
            setCurrentCardIndex(currentCardIndex - 1);
        }
    };

    // Add contact handler
    const handleAddContact = async () => {
        if (!newContactName || !newContactAccount) {
            toast.error("Please fill in all required fields");
            return;
        }

        try {
            const response = await fetch("/api/user/contacts", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: newContactName,
                    account_number: newContactAccount,
                    bank_name: newContactBank || "Bankit",
                }),
            });

            if (response.ok) {
                const result = await response.json();
                setFavoriteContacts([...favoriteContacts, result.contact]);
                setNewContactName("");
                setNewContactAccount("");
                setNewContactBank("");
                setAddContactOpen(false);
                toast.success("Contact added successfully");
            }
        } catch (error) {
            console.error("Error adding contact:", error);
            toast.error("Failed to add contact");
        }
    };

    const firstName = data?.user?.first_name || clerkUser?.firstName || "User";
    const wallets = data?.wallets || [];

    // Dynamic theme color based on active card
    const getThemeColor = () => {
        const currentCurrency = wallets[currentCardIndex]?.currency;
        switch (currentCurrency) {
            case "BTC":
                return { accent: "#f7931a", accentHover: "#c77600" };
            case "ETH":
                return { accent: "#627eea", accentHover: "#3c4f9e" };
            case "USDT":
                return { accent: "#26a17b", accentHover: "#1a7a5a" };
            default:
                return { accent: "#06b6d4", accentHover: "#0891b2" };
        }
    };

    const themeColor = getThemeColor();

    if (loading || !isLoaded) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="h-8 w-8 animate-spin text-cyan-500" />
            </div>
        );
    }

    return (
        <div className="space-y-6 pb-20 relative">
            {/* Globe Background - Bigger, offset left on mobile, centered on desktop */}
            <div className="fixed inset-0 z-0 pointer-events-none opacity-25 lg:opacity-20">
                <div className="absolute lg:inset-0 lg:flex lg:items-center lg:justify-center -left-1/4 top-0 w-[150%] h-full lg:w-full lg:left-0">
                    <AnimatedGlobe />
                </div>
            </div>

            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center justify-between"
            >
                <div>
                    <h1 className="text-2xl font-bold text-stone-900 dark:text-white">
                        Hello {firstName}!
                    </h1>
                    <p className="text-stone-500 dark:text-stone-400 text-sm">
                        Welcome back to your dashboard
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setShowBalance(!showBalance)}
                        className="rounded-full"
                    >
                        {showBalance ? (
                            <Eye className="h-5 w-5" />
                        ) : (
                            <EyeOff className="h-5 w-5" />
                        )}
                    </Button>
                </div>
            </motion.div>

            {/* Cards Section */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
            >
                {/* Mobile: Stacked Cards Design */}
                <div className="lg:hidden relative">
                    {/* Card Stack Container - ATM Card Aspect Ratio 1.586:1 (85.6mm x 53.98mm) */}
                    <div className="relative" style={{ paddingBottom: '63%' }}>
                        {/* Next card peek - slim sliver on right (6%) */}
                        {wallets.length > 1 && currentCardIndex < wallets.length - 1 && (
                            <div
                                className="absolute top-0 bottom-0 rounded-2xl overflow-hidden"
                                style={{
                                    right: 0,
                                    width: '6%',
                                    zIndex: 15,
                                    background: wallets[currentCardIndex + 1]?.currency === "USD"
                                        ? "linear-gradient(135deg, #0d0d0d 0%, #1a1a1a 100%)"
                                        : undefined,
                                }}
                            >
                                {/* Background for crypto cards */}
                                {wallets[currentCardIndex + 1]?.currency !== "USD" && (
                                    <>
                                        <div
                                            className="absolute inset-0 bg-cover bg-right"
                                            style={{
                                                backgroundImage: wallets[currentCardIndex + 1]?.currency === "BTC"
                                                    ? "url('https://images.pexels.com/photos/33045/lion-wild-africa-african.jpg?auto=compress&cs=tinysrgb&w=800')"
                                                    : wallets[currentCardIndex + 1]?.currency === "ETH"
                                                        ? "url('https://images.pexels.com/photos/1612353/pexels-photo-1612353.jpeg?auto=compress&cs=tinysrgb&w=800')"
                                                        : "url('https://images.pexels.com/photos/33109/fall-autumn-red-season.jpg?auto=compress&cs=tinysrgb&w=800')",
                                            }}
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-br from-black/60 via-black/50 to-black/70" />
                                    </>
                                )}
                            </div>
                        )}

                        {/* Main Active Card */}
                        <motion.div
                            drag="x"
                            dragConstraints={{ left: 0, right: 0 }}
                            dragElastic={0.1}
                            onDragEnd={handleDragEnd}
                            className="absolute top-0 left-0 bottom-0 cursor-grab active:cursor-grabbing"
                            style={{ zIndex: 20, width: wallets.length > 1 && currentCardIndex < wallets.length - 1 ? '93%' : '100%' }}
                        >
                            <AnimatePresence mode="wait">
                                <motion.div
                                    key={currentCardIndex}
                                    initial={{ opacity: 0, x: -50, scale: 0.95 }}
                                    animate={{ opacity: 1, x: 0, scale: 1 }}
                                    exit={{ opacity: 0, x: 50, scale: 0.95 }}
                                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                                    className="w-full h-full rounded-2xl overflow-hidden p-5 relative"
                                    style={{
                                        background: wallets[currentCardIndex]?.currency === "USD"
                                            ? "linear-gradient(135deg, #0a0a0a 0%, #151515 50%, #0a0a0a 100%)"
                                            : undefined,
                                    }}
                                >
                                    {/* Background Image for Crypto Cards */}
                                    {wallets[currentCardIndex]?.currency !== "USD" && (
                                        <>
                                            <div
                                                className="absolute inset-0 bg-cover bg-center"
                                                style={{
                                                    backgroundImage: wallets[currentCardIndex]?.currency === "BTC"
                                                        ? "url('https://images.pexels.com/photos/33045/lion-wild-africa-african.jpg?auto=compress&cs=tinysrgb&w=800')"
                                                        : wallets[currentCardIndex]?.currency === "ETH"
                                                            ? "url('https://images.pexels.com/photos/1612353/pexels-photo-1612353.jpeg?auto=compress&cs=tinysrgb&w=800')"
                                                            : "url('https://images.pexels.com/photos/33109/fall-autumn-red-season.jpg?auto=compress&cs=tinysrgb&w=800')",
                                                }}
                                            />
                                            <div className="absolute inset-0 bg-gradient-to-br from-black/60 via-black/40 to-black/70" />
                                        </>
                                    )}

                                    {/* Texture and Scratches for USD Card - Darker */}
                                    {wallets[currentCardIndex]?.currency === "USD" && (
                                        <>
                                            {/* Scratches/Texture Pattern */}
                                            <svg className="absolute inset-0 w-full h-full opacity-[0.04]" xmlns="http://www.w3.org/2000/svg">
                                                <defs>
                                                    <pattern id="scratches" x="0" y="0" width="100" height="100" patternUnits="userSpaceOnUse" patternTransform="rotate(15)">
                                                        <line x1="0" y1="20" x2="100" y2="20" stroke="white" strokeWidth="0.3" />
                                                        <line x1="0" y1="45" x2="60" y2="45" stroke="white" strokeWidth="0.2" />
                                                        <line x1="30" y1="70" x2="100" y2="70" stroke="white" strokeWidth="0.4" />
                                                        <line x1="0" y1="85" x2="45" y2="85" stroke="white" strokeWidth="0.2" />
                                                    </pattern>
                                                </defs>
                                                <rect width="100%" height="100%" fill="url(#scratches)" />
                                            </svg>
                                            {/* Subtle top shine only */}
                                            <div className="absolute top-0 left-0 right-0 h-1/4 bg-gradient-to-b from-white/10 to-transparent" />
                                        </>
                                    )}

                                    {/* Card Content - Bigger like reference */}
                                    <div className="relative z-10 h-full flex flex-col justify-between text-white">
                                        {/* Top Row */}
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <h2 className="text-4xl font-bold tracking-tight">
                                                    {showBalance
                                                        ? formatCurrency(wallets[currentCardIndex]?.balance || 0, wallets[currentCardIndex]?.currency)
                                                        : "••••••"}
                                                </h2>
                                                <p className="text-sm opacity-70 mt-1 font-mono tracking-wider">
                                                    {showBalance
                                                        ? wallets[currentCardIndex]?.account_number?.replace(/(.{4})/g, "$1-").slice(0, -1)
                                                        : "••••-••••-••••-••••"}
                                                </p>
                                            </div>
                                            {/* Mastercard Logo for USD */}
                                            {wallets[currentCardIndex]?.currency === "USD" ? (
                                                <div className="relative w-14 h-9">
                                                    <div className="absolute right-0 w-7 h-7 rounded-full bg-[#eb001b] opacity-90" />
                                                    <div className="absolute right-4 w-7 h-7 rounded-full bg-[#f79e1b] opacity-90" />
                                                </div>
                                            ) : (
                                                <div className="px-3 py-1 rounded-full bg-white/20 backdrop-blur-sm text-sm font-medium">
                                                    {wallets[currentCardIndex]?.currency}
                                                </div>
                                            )}
                                        </div>

                                        {/* Bottom Row */}
                                        <div className="flex justify-between items-end">
                                            <div className="flex items-center gap-6">
                                                <div>
                                                    <p className="text-[10px] opacity-50 uppercase tracking-wider">Owner</p>
                                                    <p className="text-sm font-medium">
                                                        {wallets[currentCardIndex]?.account_name || `${firstName} ${data?.user?.last_name || ""}`}
                                                    </p>
                                                </div>
                                                <div>
                                                    <p className="text-[10px] opacity-50 uppercase tracking-wider">Valid</p>
                                                    <p className="text-sm font-medium">12/28</p>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => handleCopy(wallets[currentCardIndex]?.account_number || "")}
                                                className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 hover:bg-white/30 transition-colors"
                                            >
                                                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                                            </button>
                                        </div>
                                    </div>
                                </motion.div>
                            </AnimatePresence>
                        </motion.div>
                    </div>

                    {/* Card indicator dots */}
                    {wallets.length > 1 && (
                        <div className="flex justify-center gap-2 mt-4">
                            {wallets.map((_, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => setCurrentCardIndex(idx)}
                                    className={`h-2 rounded-full transition-all ${idx === currentCardIndex
                                        ? "w-6 bg-stone-900 dark:bg-white"
                                        : "w-2 bg-stone-300 dark:bg-stone-600 hover:bg-stone-400 dark:hover:bg-stone-500"
                                        }`}
                                />
                            ))}
                        </div>
                    )}
                </div>

                {/* Desktop: All Cards Grid */}
                <div className="hidden lg:grid lg:grid-cols-3 gap-4">
                    {wallets.map((wallet, idx) => (
                        <motion.div
                            key={wallet.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 + (idx * 0.1) }}
                            className="relative overflow-hidden rounded-3xl p-6 min-h-[240px] group hover:scale-[1.02] transition-transform cursor-pointer"
                            style={{
                                background: wallet.currency === "USD"
                                    ? "linear-gradient(135deg, #0a0a0a 0%, #151515 50%, #0a0a0a 100%)"
                                    : undefined,
                            }}
                            onClick={() => setCurrentCardIndex(idx)}
                        >
                            {/* Background Image for Crypto Cards */}
                            {wallet.currency !== "USD" && (
                                <>
                                    <div
                                        className="absolute inset-0 bg-cover bg-center"
                                        style={{
                                            backgroundImage: wallet.currency === "BTC"
                                                ? "url('https://images.pexels.com/photos/33045/lion-wild-africa-african.jpg?auto=compress&cs=tinysrgb&w=800')"
                                                : wallet.currency === "ETH"
                                                    ? "url('https://images.pexels.com/photos/1612353/pexels-photo-1612353.jpeg?auto=compress&cs=tinysrgb&w=800')"
                                                    : "url('https://images.pexels.com/photos/33109/fall-autumn-red-season.jpg?auto=compress&cs=tinysrgb&w=800')",
                                        }}
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-br from-black/60 via-black/40 to-black/70" />
                                </>
                            )}

                            {/* USD Card Texture - Subtle scratches only */}
                            {wallet.currency === "USD" && (
                                <>
                                    <svg className="absolute inset-0 w-full h-full opacity-[0.03]" xmlns="http://www.w3.org/2000/svg">
                                        <defs>
                                            <pattern id={`desktop-scratches-${idx}`} x="0" y="0" width="100" height="100" patternUnits="userSpaceOnUse" patternTransform="rotate(15)">
                                                <line x1="0" y1="20" x2="100" y2="20" stroke="white" strokeWidth="0.3" />
                                                <line x1="0" y1="50" x2="70" y2="50" stroke="white" strokeWidth="0.2" />
                                                <line x1="30" y1="80" x2="100" y2="80" stroke="white" strokeWidth="0.3" />
                                            </pattern>
                                        </defs>
                                        <rect width="100%" height="100%" fill={`url(#desktop-scratches-${idx})`} />
                                    </svg>
                                    <div className="absolute top-0 left-0 right-0 h-1/4 bg-gradient-to-b from-white/5 to-transparent" />
                                </>
                            )}

                            {/* Inner Border */}
                            <div className="absolute inset-2 border border-white/10 rounded-[22px] pointer-events-none" />

                            {/* Card Content */}
                            <div className="relative z-10 text-white h-full flex flex-col justify-between">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="text-sm opacity-70">{wallet.currency} Balance</p>
                                        <h2 className="text-3xl font-bold mt-1 tracking-tight">
                                            {showBalance
                                                ? formatCurrency(wallet.balance, wallet.currency)
                                                : "••••••"}
                                        </h2>
                                    </div>
                                    {/* Mastercard Logo for USD */}
                                    {wallet.currency === "USD" ? (
                                        <div className="relative w-12 h-8">
                                            <div className="absolute right-0 w-6 h-6 rounded-full bg-[#eb001b] opacity-90" />
                                            <div className="absolute right-4 w-6 h-6 rounded-full bg-[#f79e1b] opacity-90" />
                                        </div>
                                    ) : (
                                        <div className="px-3 py-1 rounded-full bg-white/20 backdrop-blur-sm text-sm font-medium">
                                            {wallet.currency}
                                        </div>
                                    )}
                                </div>

                                <div className="flex justify-between items-end">
                                    <div>
                                        <p className="text-xs opacity-50">Card Holder</p>
                                        <p className="font-medium text-sm">{wallet.account_name || `${firstName} ${data?.user?.last_name || ""}`}</p>
                                    </div>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleCopy(wallet.account_number || "");
                                        }}
                                        className="flex h-9 w-9 items-center justify-center rounded-full bg-white/20 hover:bg-white/30 transition-colors"
                                    >
                                        {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </motion.div >

            {/* Quick Actions - Transparent with Themed Border */}
            < motion.div
                initial={{ opacity: 0, y: 20 }
                }
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="flex gap-3"
            >
                <Link href="/user/transfers" className="flex-1">
                    <div
                        className="flex items-center justify-center gap-2 p-3 rounded-xl bg-transparent hover:bg-white/5 transition-all border"
                        style={{
                            borderColor: themeColor.accent,
                            transition: 'border-color 0.3s ease',
                        }}
                    >
                        <Send className="h-4 w-4" style={{ color: themeColor.accent }} />
                        <span className="font-medium text-sm" style={{ color: themeColor.accent }}>Transfer</span>
                    </div>
                </Link>
                <Link href="/user/deposits" className="flex-1">
                    <div
                        className="flex items-center justify-center gap-2 p-3 rounded-xl bg-transparent hover:bg-white/5 transition-all border"
                        style={{
                            borderColor: themeColor.accent,
                            transition: 'border-color 0.3s ease',
                        }}
                    >
                        <Download className="h-4 w-4" style={{ color: themeColor.accent }} />
                        <span className="font-medium text-sm" style={{ color: themeColor.accent }}>Deposit</span>
                    </div>
                </Link>
                <Link href="/user/swap" className="flex-1">
                    <div
                        className="flex items-center justify-center gap-2 p-3 rounded-xl bg-transparent hover:bg-white/5 transition-all border"
                        style={{
                            borderColor: themeColor.accent,
                            transition: 'border-color 0.3s ease',
                        }}
                    >
                        <ArrowDownUp className="h-4 w-4" style={{ color: themeColor.accent }} />
                        <span className="font-medium text-sm" style={{ color: themeColor.accent }}>Swap</span>
                    </div>
                </Link>
            </motion.div >

            {/* Favorite Contacts */}
            < motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="space-y-4"
            >
                <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-stone-900 dark:text-white">Favorite Transfers</h2>
                    <Dialog open={addContactOpen} onOpenChange={setAddContactOpen}>
                        <DialogTrigger asChild>
                            <Button variant="ghost" size="sm" className="text-stone-500 hover:text-stone-900 dark:hover:text-white">
                                <Plus className="h-4 w-4 mr-1" />
                                Add
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Add Favorite Contact</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4 pt-4">
                                <div>
                                    <label className="text-sm font-medium mb-2 block">Name</label>
                                    <Input
                                        placeholder="Contact name"
                                        value={newContactName}
                                        onChange={(e) => setNewContactName(e.target.value)}
                                    />
                                </div>
                                <div>
                                    <label className="text-sm font-medium mb-2 block">Account Number</label>
                                    <Input
                                        placeholder="Account number"
                                        value={newContactAccount}
                                        onChange={(e) => setNewContactAccount(e.target.value)}
                                    />
                                </div>
                                <div>
                                    <label className="text-sm font-medium mb-2 block">Bank Name</label>
                                    <Input
                                        placeholder="Bank name (optional)"
                                        value={newContactBank}
                                        onChange={(e) => setNewContactBank(e.target.value)}
                                    />
                                </div>
                                <Button onClick={handleAddContact} className="w-full">
                                    Add Contact
                                </Button>
                            </div>
                        </DialogContent>
                    </Dialog>
                </div>
                <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
                    {/* Add Contact Circle */}
                    <button
                        onClick={() => setAddContactOpen(true)}
                        className="flex flex-col items-center gap-2 min-w-[72px]"
                    >
                        <div
                            className="h-14 w-14 rounded-full border-2 border-dashed flex items-center justify-center transition-colors hover:bg-white/5"
                            style={{ borderColor: themeColor.accent }}
                        >
                            <Plus className="h-6 w-6" style={{ color: themeColor.accent }} />
                        </div>
                        <span className="text-xs text-stone-600 dark:text-stone-400 text-center">Add</span>
                    </button>
                    {favoriteContacts.map((contact) => (
                        <Link
                            key={contact.id}
                            href={`/user/transfers?to=${contact.account_number}`}
                            className="flex flex-col items-center gap-2 min-w-[72px]"
                        >
                            <div className="h-14 w-14 rounded-full bg-stone-200 dark:bg-stone-700 flex items-center justify-center">
                                <User className="h-6 w-6 text-stone-500 dark:text-stone-400" />
                            </div>
                            <span className="text-xs text-stone-600 dark:text-stone-400 text-center truncate w-full">
                                {contact.name}
                            </span>
                        </Link>
                    ))}
                    {favoriteContacts.length === 0 && (
                        <p className="text-sm text-stone-500 dark:text-stone-400 ml-2">
                            No favorite contacts yet. Add one to get started!
                        </p>
                    )}
                </div>
            </motion.div >

            {/* Recent Transactions */}
            < motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="space-y-4"
            >
                <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-stone-900 dark:text-white">Recent Transactions</h2>
                    <Link href="/user/transactions" className="text-sm text-stone-500 hover:text-stone-900 dark:hover:text-white">
                        View All
                    </Link>
                </div>
                <div className="space-y-3">
                    {data?.transactions && data.transactions.length > 0 ? (
                        data.transactions.slice(0, 5).map((tx, idx) => (
                            <motion.div
                                key={tx.id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.4 + (idx * 0.05) }}
                                className="flex items-center justify-between p-4 rounded-2xl bg-stone-100 dark:bg-stone-800/50"
                            >
                                <div className="flex items-center gap-3">
                                    <div className={`h-10 w-10 rounded-full flex items-center justify-center ${tx.type === "credit" || tx.type === "deposit"
                                        ? "bg-green-100 dark:bg-green-900/30"
                                        : "bg-red-100 dark:bg-red-900/30"
                                        }`}>
                                        {tx.type === "credit" || tx.type === "deposit" ? (
                                            <ArrowDownLeft className="h-5 w-5 text-green-600 dark:text-green-400" />
                                        ) : (
                                            <ArrowUpRight className="h-5 w-5 text-red-600 dark:text-red-400" />
                                        )}
                                    </div>
                                    <div>
                                        <p className="font-medium text-stone-900 dark:text-white">
                                            {tx.description || (tx.type === "credit" ? "Received" : "Sent")}
                                        </p>
                                        <p className="text-xs text-stone-500 dark:text-stone-400">
                                            {formatDate(tx.created_at)}
                                        </p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className={`font-semibold ${tx.type === "credit" || tx.type === "deposit"
                                        ? "text-green-600 dark:text-green-400"
                                        : "text-red-600 dark:text-red-400"
                                        }`}>
                                        {tx.type === "credit" || tx.type === "deposit" ? "+" : "-"}
                                        {formatCurrency(tx.amount, tx.currency)}
                                    </p>
                                    <p className="text-xs text-stone-500 dark:text-stone-400 capitalize">
                                        {tx.status}
                                    </p>
                                </div>
                            </motion.div>
                        ))
                    ) : (
                        <div className="text-center py-8 text-stone-500 dark:text-stone-400">
                            <p>No transactions yet</p>
                        </div>
                    )}
                </div>
            </motion.div >

            {/* Quick Actions Bottom - Loans and Withdraw */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="flex gap-3"
            >
                <Link href="/user/loans" className="flex-1">
                    <div
                        className="flex items-center justify-center gap-2 p-3 rounded-xl bg-transparent hover:bg-white/5 transition-all border"
                        style={{
                            borderColor: themeColor.accent,
                            transition: 'border-color 0.3s ease',
                        }}
                    >
                        <Banknote className="h-4 w-4" style={{ color: themeColor.accent }} />
                        <span className="font-medium text-sm" style={{ color: themeColor.accent }}>Loans</span>
                    </div>
                </Link>
                <Link href="/user/withdrawals" className="flex-1">
                    <div
                        className="flex items-center justify-center gap-2 p-3 rounded-xl bg-transparent hover:bg-white/5 transition-all border"
                        style={{
                            borderColor: themeColor.accent,
                            transition: 'border-color 0.3s ease',
                        }}
                    >
                        <Wallet className="h-4 w-4" style={{ color: themeColor.accent }} />
                        <span className="font-medium text-sm" style={{ color: themeColor.accent }}>Withdraw</span>
                    </div>
                </Link>
            </motion.div>
        </div >
    );
}
