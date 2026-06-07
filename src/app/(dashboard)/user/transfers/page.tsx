"use client";

import { useState, useEffect } from "react";
import { useUser } from "@/hooks/useAuth";
import { motion } from "framer-motion";
import { Loader2, Send, AlertCircle, CheckCircle2, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
);

interface TransferMethod {
    id: string;
    title: string;
    method_type: string;
    description: string;
    bank_name: string;
    account_number: string;
    account_name: string;
    wallet_address: string;
    routing_number: string;
    swift_code: string;
    additional_info: string;
}

export default function TransfersPage() {
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [userId, setUserId] = useState<string | null>(null);
    const [balance, setBalance] = useState(0);
    const [pinDialogOpen, setPinDialogOpen] = useState(false);
    const [pin, setPin] = useState("");
    const [success, setSuccess] = useState(false);
    const [billingCodeInput, setBillingCodeInput] = useState("");
    const [requiresBillingCode, setRequiresBillingCode] = useState(false);
    const [billingCodes, setBillingCodes] = useState<Array<{ id: string; code_type: string; amount: number }>>([]);
    const [globalOtpRequired, setGlobalOtpRequired] = useState(false);
    const [txStatus, setTxStatus] = useState<string>("pending");

    // OTP state
    const [otpDialogOpen, setOtpDialogOpen] = useState(false);
    const [otpCode, setOtpCode] = useState("");
    const [isSendingOtp, setIsSendingOtp] = useState(false);
    const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);

    // Transfer methods
    const [transferMethods, setTransferMethods] = useState<TransferMethod[]>([]);
    const [selectedMethod, setSelectedMethod] = useState<string>("wire_transfer");

    // Transfer form
    const [recipientName, setRecipientName] = useState("");
    const [recipientAccount, setRecipientAccount] = useState("");
    const [recipientBank, setRecipientBank] = useState("");
    const [swiftCode, setSwiftCode] = useState("");
    const [routingNumber, setRoutingNumber] = useState("");
    const [amount, setAmount] = useState("");
    const [description, setDescription] = useState("");

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

                    const { data: walletData } = await supabase
                        .from("wallets")
                        .select("balance")
                        .eq("user_id", userData.id)
                        .eq("is_primary", true)
                        .single();

                    setBalance(walletData?.balance || 0);

                    // Check for active billing codes
                    const { data: codeData } = await supabase
                        .from("billing_codes")
                        .select("*")
                        .eq("user_id", userData.id)
                        .eq("is_active", true)
                        .eq("is_paid", false);
                    setBillingCodes(codeData || []);
                    setRequiresBillingCode((codeData || []).length > 0);

                    // Fetch transfer methods
                    const { data: methodsData } = await supabase
                        .from("deposit_methods")
                        .select("*")
                        .eq("is_transfer_option", true)
                        .eq("is_active", true)
                        .or(`user_id.eq.${userData.id},is_universal.eq.true`);

                    setTransferMethods(methodsData || []);

                    // Fetch global OTP setting
                    const { data: otpSetting } = await supabase
                        .from("bank_settings")
                        .select("value")
                        .eq("key", "transfer_otp")
                        .single();
                    setGlobalOtpRequired(otpSetting?.value === "true");
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
        if (selectedMethod !== "wire_transfer") {
            // For non-wire methods, only amount is mandatory
            const transferAmount = parseFloat(amount);
            if (!transferAmount || transferAmount < 1) {
                toast.error("Please enter a valid amount");
                return false;
            }
            if (transferAmount > balance) {
                toast.error("Insufficient balance");
                return false;
            }
            return true;
        }

        if (!recipientName) {
            toast.error("Please enter recipient name");
            return false;
        }
        if (!recipientAccount) {
            toast.error("Please enter recipient account number");
            return false;
        }
        if (!recipientBank) {
            toast.error("Please enter recipient bank name");
            return false;
        }
        const transferAmount = parseFloat(amount);
        if (!transferAmount || transferAmount < 1) {
            toast.error("Please enter a valid amount");
            return false;
        }
        if (transferAmount > balance) {
            toast.error("Insufficient balance");
            return false;
        }
        return true;
    };

    const handleInitiateTransfer = async () => {
        if (validateForm()) {
            if (globalOtpRequired) {
                await handleSendOtp();
                setOtpDialogOpen(true);
            } else {
                setPinDialogOpen(true);
            }
        }
    };

    const handleSendOtp = async () => {
        setIsSendingOtp(true);
        try {
            const res = await fetch("/api/user/otp/send", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ type: "transfer" }),
            });
            if (res.ok) {
                toast.success("Verification code sent to your email");
            } else {
                toast.error("Failed to send verification code");
            }
        } catch (error) {
            console.error("OTP send error:", error);
            toast.error("Failed to send verification code");
        } finally {
            setIsSendingOtp(false);
        }
    };

    const handleVerifyOtp = async () => {
        if (otpCode.length < 6) {
            toast.error("Please enter the 6-7 digit code");
            return;
        }

        setIsVerifyingOtp(true);
        try {
            const res = await fetch("/api/user/otp/verify", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ code: otpCode, type: "transfer" }),
            });

            if (res.ok) {
                setOtpDialogOpen(false);
                setPinDialogOpen(true);
                toast.success("Email verified successfully");
            } else {
                const data = await res.json();
                toast.error(data.error || "Invalid verification code");
            }
        } catch (error) {
            console.error("OTP verify error:", error);
            toast.error("Verification failed");
        } finally {
            setIsVerifyingOtp(false);
        }
    };

    const handleConfirmTransfer = async () => {
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
                    type: "transfer",
                    amount: parseFloat(amount),
                    pin,
                    otp: otpCode || undefined, // Include OTP if verified
                    billingCode: billingCodeInput || undefined,
                    recipientName,
                    recipientAccount,
                    recipientBank,
                    swiftCode: swiftCode || undefined,
                    routingNumber: routingNumber || undefined,
                    description: description || `Transfer to ${recipientName}`,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                if (data.requiresBillingCode) {
                    setRequiresBillingCode(true);
                }
                toast.error(data.error || "Failed to initiate transfer");
                setSubmitting(false);
                return;
            }

            if (data.newBalance !== undefined) {
                setBalance(data.newBalance);
            }

            if (data.transaction?.status) {
                setTxStatus(data.transaction.status);
            }

            setSuccess(true);
            setPinDialogOpen(false);
            if (data.transaction?.status === "approved") {
                toast.success("Transfer processed successfully!");
            } else {
                toast.success("Transfer initiated successfully!");
            }

            setRecipientName("");
            setRecipientAccount("");
            setRecipientBank("");
            setSwiftCode("");
            setRoutingNumber("");
            setAmount("");
            setDescription("");
            setPin("");
            setOtpCode("");
            setBillingCodeInput("");
            setRequiresBillingCode(false);
        } catch (error) {
            console.error("Error creating transfer:", error);
            toast.error("Failed to initiate transfer");
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

    if (loading || !isLoaded) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-stone-400" />
            </div>
        );
    }

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
                    {txStatus === "approved" ? "Transfer Successful" : "Transfer Initiated"}
                </h2>
                <p className="mt-2 text-center text-stone-500 max-w-md">
                    {txStatus === "approved" 
                        ? "Your wire transfer has been processed successfully. The funds have been deducted and the recipient will receive them shortly."
                        : "Your wire transfer request has been submitted and is pending review. You will be notified once it's processed."
                    }
                </p>
                <Button
                    className="mt-6"
                    onClick={() => setSuccess(false)}
                >
                    Make Another Transfer
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
                    Fund Transfer
                </h1>
                <p className="text-stone-600 dark:text-stone-400">
                    Send money to any bank account or supported method
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

            {/* Transfer Form */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
            >
                <Card>
                    <CardHeader>
                        <CardTitle>Transfer Details</CardTitle>
                        <CardDescription>Select a method and enter transfer details</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {/* Transfer Method Selector */}
                        {transferMethods.length > 0 && (
                            <div className="space-y-2">
                                <Label>Transfer Method</Label>
                                <Select value={selectedMethod} onValueChange={setSelectedMethod}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select transfer method" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="wire_transfer">Wire Transfer</SelectItem>
                                        {transferMethods.map((method) => (
                                            <SelectItem key={method.id} value={method.id}>
                                                {method.title}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}

                        {/* Selected Method Info */}
                        {selectedMethod !== "wire_transfer" && (() => {
                            const method = transferMethods.find(m => m.id === selectedMethod);
                            return method ? (
                                <Card className="bg-stone-50 dark:bg-stone-900 border-stone-200 dark:border-stone-800">
                                    <CardContent className="pt-4 space-y-2 text-sm">
                                        <p className="font-medium text-stone-700 dark:text-stone-300">{method.title}</p>
                                        {method.description && (
                                            <p className="text-stone-500 dark:text-stone-400">{method.description}</p>
                                        )}
                                        {method.bank_name && (
                                            <div className="flex justify-between">
                                                <span className="text-stone-500">Bank:</span>
                                                <span className="font-medium text-stone-900 dark:text-stone-100">{method.bank_name}</span>
                                            </div>
                                        )}
                                        {method.account_number && (
                                            <div className="flex justify-between">
                                                <span className="text-stone-500">Account:</span>
                                                <span className="font-mono text-stone-900 dark:text-stone-100">{method.account_number}</span>
                                            </div>
                                        )}
                                        {method.account_name && (
                                            <div className="flex justify-between">
                                                <span className="text-stone-500">Account Name:</span>
                                                <span className="font-medium text-stone-900 dark:text-stone-100">{method.account_name}</span>
                                            </div>
                                        )}
                                        {method.wallet_address && (
                                            <div className="flex justify-between">
                                                <span className="text-stone-500">Address:</span>
                                                <span className="font-mono text-xs text-stone-900 dark:text-stone-100 break-all">{method.wallet_address}</span>
                                            </div>
                                        )}
                                        {method.additional_info && (
                                            <p className="text-xs text-stone-400 mt-2 italic">{method.additional_info}</p>
                                        )}
                                    </CardContent>
                                </Card>
                            ) : null;
                        })()}

                        {/* Wire Transfer Fields */}
                        {selectedMethod === "wire_transfer" && (
                            <>
                                <div className="grid gap-4 md:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label>Recipient Name *</Label>
                                        <Input
                                            placeholder="John Doe"
                                            value={recipientName}
                                            onChange={(e) => setRecipientName(e.target.value)}
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
                                </div>
                                <div className="space-y-2">
                                    <Label>Bank Name *</Label>
                                    <Input
                                        placeholder="Bank of America"
                                        value={recipientBank}
                                        onChange={(e) => setRecipientBank(e.target.value)}
                                    />
                                </div>
                                <div className="grid gap-4 md:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label>SWIFT/BIC Code</Label>
                                        <Input
                                            placeholder="BOFAUS3N"
                                            value={swiftCode}
                                            onChange={(e) => setSwiftCode(e.target.value)}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Routing Number</Label>
                                        <Input
                                            placeholder="026009593"
                                            value={routingNumber}
                                            onChange={(e) => setRoutingNumber(e.target.value)}
                                        />
                                    </div>
                                </div>
                            </>
                        )}

                        <div className="space-y-2">
                            <Label>Amount (USD) *</Label>
                            <Input
                                type="number"
                                placeholder="1000"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                min="1"
                                max={balance}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Description / Memo</Label>
                            <Textarea
                                placeholder="Payment for services..."
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                            />
                        </div>

                        {parseFloat(amount) > 0 && (
                            <Card className="bg-stone-50 dark:bg-stone-900">
                                <CardContent className="pt-4">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-stone-500">Transfer Amount</span>
                                        <span className="font-medium text-stone-900 dark:text-stone-100">
                                            {formatCurrency(parseFloat(amount))}
                                        </span>
                                    </div>
                                    <div className="flex justify-between text-sm mt-2">
                                        <span className="text-stone-500">Transfer Fee</span>
                                        <span className="font-medium text-stone-900 dark:text-stone-100">
                                            $0.00
                                        </span>
                                    </div>
                                    <div className="flex justify-between text-sm mt-2 pt-2 border-t">
                                        <span className="font-medium text-stone-900 dark:text-stone-100">Total</span>
                                        <span className="font-bold text-stone-900 dark:text-stone-100">
                                            {formatCurrency(parseFloat(amount))}
                                        </span>
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        <Button
                            className="w-full"
                            size="lg"
                            onClick={handleInitiateTransfer}
                            disabled={!amount || parseFloat(amount) < 1}
                        >
                            <Send className="mr-2 h-4 w-4" />
                            Initiate Transfer
                        </Button>
                    </CardContent>
                </Card>
            </motion.div>

            {/* PIN Dialog */}
            <Dialog open={pinDialogOpen} onOpenChange={setPinDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Confirm Transfer</DialogTitle>
                        <DialogDescription>
                            Enter your 4-digit transaction PIN to confirm
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="rounded-lg bg-stone-50 p-4 dark:bg-stone-900">
                            <div className="flex justify-between text-sm">
                                <span className="text-stone-500">To:</span>
                                <span className="font-medium text-stone-900 dark:text-stone-100">
                                    {recipientName}
                                </span>
                            </div>
                            <div className="flex justify-between text-sm mt-1">
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
                            <p className="text-xs text-stone-500">
                                Default PIN is 1234. Change it in Settings.
                            </p>
                        </div>

                        {/* Billing Code Field */}
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
                                    placeholder={`Enter ${billingCodes[0].code_type.replace("_", " ").toUpperCase()} code`}
                                    value={billingCodeInput}
                                    onChange={(e) => setBillingCodeInput(e.target.value.toUpperCase())}
                                    className="text-center font-mono tracking-wider"
                                />
                                <div className="text-xs text-amber-600 dark:text-amber-500 space-y-1">
                                    <p className="font-medium">Current requirement:</p>
                                    <div className="flex justify-between items-center bg-white/50 dark:bg-stone-900/30 p-2 rounded border border-amber-200/50">
                                        <span>{billingCodes[0].code_type.replace("_", " ").toUpperCase()}</span>
                                        <span className="font-bold">${billingCodes[0].amount.toFixed(2)}</span>
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
                            onClick={handleConfirmTransfer}
                            disabled={submitting || pin.length !== 4 || (requiresBillingCode && !billingCodeInput)}
                        >
                            {submitting ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Processing...
                                </>
                            ) : (
                                "Confirm Transfer"
                            )}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* OTP Verification Dialog */}
            <Dialog open={otpDialogOpen} onOpenChange={setOtpDialogOpen}>
                <DialogContent className="sm:max-w-[420px]">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Shield className="h-5 w-5 text-stone-900 dark:text-stone-100" />
                            Email Verification
                        </DialogTitle>
                        <DialogDescription>
                            We've sent a 6-7 digit verification code to your email. Please enter it below to proceed with your transfer.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-6 py-6">
                        <div className="flex flex-col items-center justify-center space-y-4">
                            <div className="w-full space-y-2">
                                <Label htmlFor="otp" className="text-center block">Verification Code</Label>
                                <Input
                                    id="otp"
                                    type="text"
                                    placeholder="000000"
                                    value={otpCode}
                                    onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, "").slice(0, 7))}
                                    className="text-center text-3xl font-bold tracking-[0.5em] h-16"
                                />
                            </div>
                            <p className="text-sm text-stone-500 text-center">
                                If you don't see the email, check your spam folder or resend the code.
                            </p>
                        </div>

                        <div className="flex flex-col gap-3">
                            <Button 
                                className="w-full h-12 text-lg" 
                                onClick={handleVerifyOtp}
                                disabled={isVerifyingOtp || otpCode.length < 6}
                            >
                                {isVerifyingOtp ? (
                                    <>
                                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                        Verifying...
                                    </>
                                ) : (
                                    "Verify & Continue"
                                )}
                            </Button>
                            <Button 
                                variant="ghost" 
                                className="text-stone-500" 
                                onClick={handleSendOtp}
                                disabled={isSendingOtp}
                            >
                                {isSendingOtp ? "Sending..." : "Resend Code"}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
