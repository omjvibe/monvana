"use client";

import { useState, useEffect, useMemo } from "react";
import { useUser } from "@/hooks/useAuth";
import { motion, AnimatePresence } from "framer-motion";
import {
    ArrowDownUp, Loader2, RefreshCw, ChevronDown, AlertCircle, CheckCircle2, ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
    Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

interface WalletInfo {
    id: string;
    currency: string;
    balance: number;
    account_name: string;
}

interface ExchangeRate {
    id: string;
    from_currency: string;
    to_currency: string;
    rate: number;
    is_active: boolean;
}

const currencyIcons: Record<string, string> = {
    USD: "$", BTC: "₿", ETH: "Ξ", USDT: "₮", USDC: "◎", EUR: "€", GBP: "£",
};

const formatAmount = (amount: number, currency: string) => {
    if (currency === "BTC" || currency === "ETH") return amount.toFixed(8);
    return amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

export default function SwapPage() {
    const [loading, setLoading] = useState(true);
    const [swapping, setSwapping] = useState(false);
    const [wallets, setWallets] = useState<WalletInfo[]>([]);
    const [rates, setRates] = useState<ExchangeRate[]>([]);
    const [fromWalletId, setFromWalletId] = useState("");
    const [toWalletId, setToWalletId] = useState("");
    const [amount, setAmount] = useState("");
    const [pin, setPin] = useState("");
    const [showConfirm, setShowConfirm] = useState(false);
    const [success, setSuccess] = useState(false);
    const [swapResult, setSwapResult] = useState<{
        from: { currency: string; amount: number; newBalance: number };
        to: { currency: string; amount: number; newBalance: number };
        rate: number;
        reference: string;
    } | null>(null);

    const { user: clerkUser, isLoaded } = useUser();

    useEffect(() => {
        async function fetchData() {
            try {
                const res = await fetch("/api/user/swap");
                if (res.ok) {
                    const data = await res.json();
                    setWallets(data.wallets || []);
                    setRates(data.rates || []);
                    if (data.wallets?.length >= 2) {
                        setFromWalletId(data.wallets[0].id);
                        setToWalletId(data.wallets[1].id);
                    }
                }
            } catch (error) {
                console.error("Error fetching swap data:", error);
                toast.error("Failed to load swap data");
            } finally {
                setLoading(false);
            }
        }
        if (isLoaded && clerkUser) fetchData();
    }, [isLoaded, clerkUser]);

    const fromWallet = useMemo(() => wallets.find((w) => w.id === fromWalletId), [wallets, fromWalletId]);
    const toWallet = useMemo(() => wallets.find((w) => w.id === toWalletId), [wallets, toWalletId]);

    const currentRate = useMemo(() => {
        if (!fromWallet || !toWallet) return null;
        return rates.find(
            (r) => r.from_currency === fromWallet.currency && r.to_currency === toWallet.currency
        );
    }, [fromWallet, toWallet, rates]);

    const convertedAmount = useMemo(() => {
        if (!currentRate || !amount || parseFloat(amount) <= 0) return 0;
        return parseFloat(amount) * currentRate.rate;
    }, [currentRate, amount]);

    const canSwap = fromWallet && toWallet && currentRate && parseFloat(amount) > 0 && parseFloat(amount) <= (fromWallet?.balance || 0);

    const handleFlip = () => {
        setFromWalletId(toWalletId);
        setToWalletId(fromWalletId);
        setAmount("");
    };

    const handleSwap = async () => {
        if (!canSwap) return;
        setSwapping(true);
        try {
            const res = await fetch("/api/user/swap", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ fromWalletId, toWalletId, amount: parseFloat(amount), pin }),
            });
            const data = await res.json();
            if (res.ok && data.success) {
                setSwapResult(data.swap);
                setSuccess(true);
                setShowConfirm(false);
                setPin("");
                // Update local wallet balances
                setWallets((prev) =>
                    prev.map((w) => {
                        if (w.id === fromWalletId) return { ...w, balance: data.swap.from.newBalance };
                        if (w.id === toWalletId) return { ...w, balance: data.swap.to.newBalance };
                        return w;
                    })
                );
                toast.success("Swap completed successfully!");
            } else {
                toast.error(data.error || "Swap failed");
            }
        } catch {
            toast.error("Failed to execute swap");
        } finally {
            setSwapping(false);
        }
    };

    if (loading || !isLoaded) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (wallets.length < 2) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
                <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
                <h2 className="text-xl font-semibold mb-2">Multiple Wallets Required</h2>
                <p className="text-muted-foreground">You need at least two wallets to perform a swap. Contact support to add more wallets.</p>
            </div>
        );
    }

    return (
        <div className="max-w-lg mx-auto space-y-6 pb-20">
            {/* Header */}
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
                <h1 className="text-2xl font-bold">Swap</h1>
                <p className="text-muted-foreground text-sm">Convert between your wallets instantly</p>
            </motion.div>

            {/* Swap Card */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                <Card className="overflow-hidden border-0 shadow-xl bg-gradient-to-br from-stone-50 to-stone-100 dark:from-stone-900 dark:to-stone-950">
                    <CardContent className="p-6 space-y-4">
                        {/* From */}
                        <div className="space-y-2">
                            <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">From</Label>
                            <div className="flex gap-3">
                                <Select value={fromWalletId} onValueChange={(val) => { setFromWalletId(val); setAmount(""); }}>
                                    <SelectTrigger className="w-[140px] bg-white dark:bg-stone-800 border-stone-200 dark:border-stone-700">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {wallets.filter((w) => w.id !== toWalletId).map((w) => (
                                            <SelectItem key={w.id} value={w.id}>
                                                <span className="flex items-center gap-2">
                                                    <span className="text-lg">{currencyIcons[w.currency] || w.currency}</span>
                                                    <span>{w.currency}</span>
                                                </span>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <div className="flex-1 relative">
                                    <Input
                                        type="number"
                                        step="any"
                                        placeholder="0.00"
                                        value={amount}
                                        onChange={(e) => setAmount(e.target.value)}
                                        className="text-right text-lg font-semibold bg-white dark:bg-stone-800 border-stone-200 dark:border-stone-700 pr-3"
                                    />
                                </div>
                            </div>
                            {fromWallet && (
                                <div className="flex items-center justify-between">
                                    <p className="text-xs text-muted-foreground">
                                        Balance: {currencyIcons[fromWallet.currency]}{formatAmount(fromWallet.balance, fromWallet.currency)}
                                    </p>
                                    <button
                                        onClick={() => setAmount(fromWallet.balance.toString())}
                                        className="text-xs font-medium text-primary hover:underline"
                                    >
                                        MAX
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Flip Button */}
                        <div className="flex justify-center -my-1">
                            <button
                                onClick={handleFlip}
                                className="h-10 w-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg hover:scale-110 transition-transform active:scale-95"
                            >
                                <ArrowDownUp className="h-5 w-5" />
                            </button>
                        </div>

                        {/* To */}
                        <div className="space-y-2">
                            <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">To</Label>
                            <div className="flex gap-3">
                                <Select value={toWalletId} onValueChange={setToWalletId}>
                                    <SelectTrigger className="w-[140px] bg-white dark:bg-stone-800 border-stone-200 dark:border-stone-700">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {wallets.filter((w) => w.id !== fromWalletId).map((w) => (
                                            <SelectItem key={w.id} value={w.id}>
                                                <span className="flex items-center gap-2">
                                                    <span className="text-lg">{currencyIcons[w.currency] || w.currency}</span>
                                                    <span>{w.currency}</span>
                                                </span>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <div className="flex-1">
                                    <Input
                                        readOnly
                                        value={convertedAmount > 0 ? formatAmount(convertedAmount, toWallet?.currency || "USD") : "0.00"}
                                        className="text-right text-lg font-semibold bg-stone-100 dark:bg-stone-800/50 border-stone-200 dark:border-stone-700 pr-3 text-muted-foreground"
                                    />
                                </div>
                            </div>
                            {toWallet && (
                                <p className="text-xs text-muted-foreground">
                                    Balance: {currencyIcons[toWallet.currency]}{formatAmount(toWallet.balance, toWallet.currency)}
                                </p>
                            )}
                        </div>

                        {/* Rate Display */}
                        {currentRate && fromWallet && toWallet && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="flex items-center justify-between p-3 rounded-xl bg-primary/5 border border-primary/10"
                            >
                                <div className="flex items-center gap-2 text-sm">
                                    <RefreshCw className="h-3.5 w-3.5 text-primary" />
                                    <span className="text-muted-foreground">Rate</span>
                                </div>
                                <span className="text-sm font-medium">
                                    1 {fromWallet.currency} = {formatAmount(currentRate.rate, toWallet.currency)} {toWallet.currency}
                                </span>
                            </motion.div>
                        )}

                        {!currentRate && fromWallet && toWallet && (
                            <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900 text-sm text-red-600">
                                <AlertCircle className="h-4 w-4 shrink-0" />
                                No exchange rate available for {fromWallet.currency} → {toWallet.currency}
                            </div>
                        )}

                        {/* Insufficient Balance Warning */}
                        {fromWallet && parseFloat(amount) > fromWallet.balance && (
                            <div className="flex items-center gap-2 p-3 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 text-sm text-amber-700 dark:text-amber-400">
                                <AlertCircle className="h-4 w-4 shrink-0" />
                                Insufficient balance
                            </div>
                        )}

                        {/* Swap Button */}
                        <Button
                            size="lg"
                            className="w-full text-base font-semibold h-12"
                            disabled={!canSwap}
                            onClick={() => setShowConfirm(true)}
                        >
                            <ArrowDownUp className="mr-2 h-5 w-5" />
                            {canSwap
                                ? `Swap ${parseFloat(amount).toFixed(2)} ${fromWallet?.currency}`
                                : "Enter swap details"}
                        </Button>
                    </CardContent>
                </Card>
            </motion.div>

            {/* Rates Overview */}
            {rates.length > 0 && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base">Live Rates</CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="divide-y">
                                {rates.slice(0, 8).map((rate) => (
                                    <div key={rate.id} className="flex items-center justify-between px-6 py-3">
                                        <div className="flex items-center gap-2 text-sm">
                                            <span className="font-medium">{rate.from_currency}</span>
                                            <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
                                            <span className="font-medium">{rate.to_currency}</span>
                                        </div>
                                        <Badge variant="secondary" className="font-mono text-xs">
                                            {formatAmount(rate.rate, rate.to_currency)}
                                        </Badge>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>
            )}

            {/* Confirmation Dialog */}
            <Dialog open={showConfirm} onOpenChange={setShowConfirm}>
                <DialogContent className="max-w-sm">
                    <DialogHeader>
                        <DialogTitle>Confirm Swap</DialogTitle>
                        <DialogDescription>Review your swap details before confirming</DialogDescription>
                    </DialogHeader>
                    {fromWallet && toWallet && currentRate && (
                        <div className="space-y-4 py-4">
                            <div className="p-4 rounded-xl bg-stone-50 dark:bg-stone-900 space-y-3">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-muted-foreground">You send</span>
                                    <span className="font-semibold">
                                        {currencyIcons[fromWallet.currency]}{parseFloat(amount).toFixed(2)} {fromWallet.currency}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-muted-foreground">You receive</span>
                                    <span className="font-semibold text-green-600">
                                        {currencyIcons[toWallet.currency]}{formatAmount(convertedAmount, toWallet.currency)} {toWallet.currency}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between border-t pt-2">
                                    <span className="text-xs text-muted-foreground">Rate</span>
                                    <span className="text-xs font-mono">
                                        1 {fromWallet.currency} = {formatAmount(currentRate.rate, toWallet.currency)} {toWallet.currency}
                                    </span>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label>Transaction PIN</Label>
                                <Input
                                    type="password"
                                    inputMode="numeric"
                                    value={pin}
                                    onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
                                    placeholder="Enter 4-digit PIN"
                                    maxLength={4}
                                    className="text-center text-xl tracking-widest"
                                    autoFocus
                                />
                            </div>
                        </div>
                    )}
                    <DialogFooter>
                        <Button variant="outline" onClick={() => { setShowConfirm(false); setPin(""); }}>Cancel</Button>
                        <Button onClick={handleSwap} disabled={swapping || pin.length < 4}>
                            {swapping && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Confirm Swap
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Success Dialog */}
            <Dialog open={success} onOpenChange={(open) => { setSuccess(open); if (!open) { setAmount(""); setSwapResult(null); } }}>
                <DialogContent className="max-w-sm text-center">
                    <div className="flex flex-col items-center py-6">
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: "spring", stiffness: 200, damping: 15 }}
                            className="h-16 w-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-4"
                        >
                            <CheckCircle2 className="h-8 w-8 text-green-600" />
                        </motion.div>
                        <h3 className="text-xl font-bold mb-2">Swap Successful!</h3>
                        {swapResult && (
                            <div className="space-y-1 text-sm text-muted-foreground">
                                <p>
                                    {currencyIcons[swapResult.from.currency]}{formatAmount(swapResult.from.amount, swapResult.from.currency)} {swapResult.from.currency}
                                    {" → "}
                                    {currencyIcons[swapResult.to.currency]}{formatAmount(swapResult.to.amount, swapResult.to.currency)} {swapResult.to.currency}
                                </p>
                                <p className="text-xs font-mono mt-2">Ref: {swapResult.reference}</p>
                            </div>
                        )}
                    </div>
                    <Button className="w-full" onClick={() => { setSuccess(false); setAmount(""); setSwapResult(null); }}>
                        Done
                    </Button>
                </DialogContent>
            </Dialog>
        </div>
    );
}
