"use client";

import { useState, useEffect, useRef } from "react";
import { useUser } from "@/hooks/useAuth";
import { motion, AnimatePresence } from "framer-motion";
import {
    Upload, Check, Loader2, AlertCircle, X, Copy,
    CheckCircle2, DollarSign, Bitcoin, Building2, Smartphone, QrCode, Image as ImageIcon, MessageCircle
} from "lucide-react";
import Link from "next/link";
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

interface DepositMethod {
    id: string;
    method_type: string;
    title: string;
    description: string;
    wallet_address: string | null;
    bank_name: string | null;
    account_number: string | null;
    account_name: string | null;
    routing_number: string | null;
    swift_code: string | null;
    additional_info: string | null;
    qr_code_url: string | null;
    is_active: boolean;
    priority: number;
    is_universal: boolean;
    logo_url: string | null;
}

interface Deposit {
    id: string;
    amount: number;
    status: string;
    description: string;
    proof_url: string | null;
    created_at: string;
}

export default function DepositsPage() {
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [userId, setUserId] = useState<string | null>(null);
    const [deposits, setDeposits] = useState<Deposit[]>([]);
    const [depositMethods, setDepositMethods] = useState<DepositMethod[]>([]);
    const [selectedMethod, setSelectedMethod] = useState<DepositMethod | null>(null);
    const [amount, setAmount] = useState("");
    const [proofFile, setProofFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [uploading, setUploading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [copiedText, setCopiedText] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
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

                    // Fetch deposit methods (user-specific + universal)
                    const { data: methodsData } = await supabase
                        .from("deposit_methods")
                        .select("*")
                        .or(`user_id.eq.${userData.id},is_universal.eq.true`)
                        .eq("is_active", true)
                        .order("priority", { ascending: false });

                    const methods = methodsData || [];
                    setDepositMethods(methods);
                    if (methods.length > 0) {
                        setSelectedMethod(methods[0]);
                    }

                    // Fetch deposit history
                    const { data: depositData } = await supabase
                        .from("transactions")
                        .select("*")
                        .eq("user_id", userData.id)
                        .eq("type", "deposit")
                        .order("created_at", { ascending: false })
                        .limit(10);
                    setDeposits(depositData || []);
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

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) {
                toast.error("File size must be less than 5MB");
                return;
            }
            if (!file.type.startsWith("image/")) {
                toast.error("Please upload an image file");
                return;
            }
            setProofFile(file);
            setPreviewUrl(URL.createObjectURL(file));
        }
    };

    const handleRemoveFile = () => {
        setProofFile(null);
        if (previewUrl) URL.revokeObjectURL(previewUrl);
        setPreviewUrl(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    const copyToClipboard = async (text: string) => {
        await navigator.clipboard.writeText(text);
        setCopiedText(text);
        toast.success("Copied to clipboard");
        setTimeout(() => setCopiedText(null), 2000);
    };

    const uploadProof = async (): Promise<string | null> => {
        if (!proofFile || !userId) return null;

        try {
            setUploading(true);

            // Use server-side upload API which uses service role (bypasses RLS)
            const formData = new FormData();
            formData.append("file", proofFile);
            formData.append("bucket", "deposit-proofs");
            formData.append("documentType", "proof");

            const response = await fetch("/api/upload", {
                method: "POST",
                body: formData,
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Failed to upload");
            }

            return data.url;
        } catch (error) {
            console.error("Error uploading proof:", error);
            toast.error("Failed to upload proof");
            return null;
        } finally {
            setUploading(false);
        }
    };

    const handleSubmit = async () => {
        const depositAmount = parseFloat(amount);
        if (!depositAmount || depositAmount < 10) {
            toast.error("Minimum deposit is $10");
            return;
        }

        if (!proofFile) {
            toast.error("Please upload proof of payment");
            return;
        }

        if (!selectedMethod) {
            toast.error("Please select a deposit method");
            return;
        }

        setSubmitting(true);

        try {
            const proofUrl = await uploadProof();
            if (!proofUrl) throw new Error("Failed to upload proof");

            const response = await fetch("/api/user/deposits", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    amount: depositAmount,
                    currency: "USD",
                    method: selectedMethod.method_type,
                    proof_url: proofUrl,
                    deposit_method_id: selectedMethod.id,
                }),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || "Failed to create deposit request");
            }

            setSuccess(true);
            setAmount("");
            handleRemoveFile();

        } catch (error: any) {
            console.error("Error:", error);
            toast.error(error.message || "Failed to submit deposit");
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
            case "approved": return "bg-green-500/10 text-green-600";
            case "pending": return "bg-yellow-500/10 text-yellow-600";
            case "processing": return "bg-blue-500/10 text-blue-600";
            case "cancelled":
            case "failed": return "bg-red-500/10 text-red-600";
            default: return "bg-stone-100 text-stone-600";
        }
    };

    const getMethodIcon = (method: DepositMethod) => {
        if (method.logo_url) {
            return (
                <div className="h-10 w-10 flex-shrink-0 overflow-hidden rounded-full border bg-white flex items-center justify-center p-1">
                    <img src={method.logo_url} alt={method.title} className="h-8 w-8 object-contain" />
                </div>
            );
        }

        switch (method.method_type) {
            case "crypto": return <Bitcoin className="h-5 w-5 text-orange-500" />;
            case "bank_transfer": return <Building2 className="h-5 w-5 text-blue-500" />;
            case "p2p": return <Smartphone className="h-5 w-5 text-purple-500" />;
            default: return <DollarSign className="h-5 w-5 text-green-500" />;
        }
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
                    Deposit Request Submitted
                </h2>
                <p className="mt-2 text-center text-stone-500 max-w-md">
                    Your deposit is being reviewed. You will be notified once approved.
                </p>
                <Button className="mt-6" onClick={() => setSuccess(false)}>
                    Make Another Deposit
                </Button>
            </motion.div >
        );
    }

    // No deposit methods assigned by admin
    if (depositMethods.length === 0) {
        return (
            <div className="space-y-8">
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                    <h1 className="text-2xl font-bold text-stone-900 dark:text-stone-100">
                        Deposit Funds
                    </h1>
                    <p className="text-stone-600 dark:text-stone-400">
                        Fund your account securely
                    </p>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                >
                    <Card>
                        <CardContent className="py-16">
                            <div className="text-center">
                                <div className="mx-auto h-16 w-16 rounded-full bg-stone-100 dark:bg-stone-800 flex items-center justify-center mb-4">
                                    <AlertCircle className="h-8 w-8 text-stone-400" />
                                </div>
                                <h3 className="text-lg font-medium text-stone-900 dark:text-stone-100 mb-2">
                                    No Deposit Methods Available
                                </h3>
                                <p className="text-sm text-stone-500 dark:text-stone-400 max-w-md mx-auto mb-6">
                                    Please contact your account manager to set up deposit methods for your account.
                                    Once configured, you'll see payment details and instructions here.
                                </p>
                                <Button asChild>
                                    <Link href="/user/messages">
                                        <MessageCircle className="mr-2 h-4 w-4" />
                                        Contact Support
                                    </Link>
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>

                {/* Recent Deposits */}
                {deposits.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                    >
                        <Card>
                            <CardHeader>
                                <CardTitle>Recent Deposits</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    {deposits.map((dep) => (
                                        <div key={dep.id} className="flex items-center justify-between py-3 border-b last:border-0">
                                            <div>
                                                <p className="font-medium">{formatCurrency(dep.amount)}</p>
                                                <p className="text-sm text-stone-500">{formatDate(dep.created_at)}</p>
                                            </div>
                                            <Badge className={getStatusColor(dep.status)}>{dep.status}</Badge>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>
                )}
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                <h1 className="text-2xl font-bold text-stone-900 dark:text-stone-100">
                    Deposit Funds
                </h1>
                <p className="text-stone-600 dark:text-stone-400">
                    Fund your account using the payment methods below
                </p>
            </motion.div>

            {/* Step 1: Select Method */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
            >
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-stone-900 text-white text-sm dark:bg-stone-100 dark:text-stone-900">1</span>
                            Select Payment Method
                        </CardTitle>
                        <CardDescription>Choose how you want to deposit</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid gap-3 md:grid-cols-2">
                            {depositMethods.map((method) => (
                                <button
                                    key={method.id}
                                    onClick={() => setSelectedMethod(method)}
                                    className={`p-4 rounded-lg border-2 text-left transition-all ${selectedMethod?.id === method.id
                                        ? "border-stone-900 bg-stone-50 dark:border-stone-100 dark:bg-stone-900"
                                        : "border-stone-200 hover:border-stone-300 dark:border-stone-700"
                                        }`}
                                >
                                    <div className="flex items-center gap-3">
                                        {getMethodIcon(method)}
                                        <div>
                                            <p className="font-medium text-stone-900 dark:text-stone-100">{method.title}</p>
                                            {method.description && (
                                                <p className="text-xs text-stone-500 dark:text-stone-400">{method.description}</p>
                                            )}
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </motion.div>

            {/* Step 2: Payment Details */}
            {selectedMethod && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15 }}
                >
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-stone-900 text-white text-sm dark:bg-stone-100 dark:text-stone-900">2</span>
                                Payment Details
                            </CardTitle>
                            <CardDescription>Send payment to the following details</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="bg-stone-50 dark:bg-stone-900 rounded-lg p-4 space-y-4">
                                {/* QR Code */}
                                {(selectedMethod.qr_code_url || selectedMethod.wallet_address) && (
                                    <div className="flex justify-center">
                                        <div className="bg-white p-4 rounded-lg shadow-sm">
                                            <img
                                                src={selectedMethod.qr_code_url || `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(selectedMethod.wallet_address || "")}`}
                                                alt="QR Code"
                                                className="w-48 h-48"
                                            />
                                        </div>
                                    </div>
                                )}

                                {/* Wallet Address */}
                                {selectedMethod.wallet_address && (
                                    <div className="space-y-1">
                                        <Label className="text-xs text-stone-500">Wallet Address</Label>
                                        <div className="flex items-center gap-2">
                                            <code className="flex-1 p-3 bg-white dark:bg-stone-800 rounded text-sm font-mono break-all">
                                                {selectedMethod.wallet_address}
                                            </code>
                                            <Button
                                                variant="outline"
                                                size="icon"
                                                onClick={() => copyToClipboard(selectedMethod.wallet_address!)}
                                            >
                                                {copiedText === selectedMethod.wallet_address ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                                            </Button>
                                        </div>
                                    </div>
                                )}

                                {/* Bank Details */}
                                {selectedMethod.bank_name && (
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <Label className="text-xs text-stone-500">Bank Name</Label>
                                            <p className="font-medium">{selectedMethod.bank_name}</p>
                                        </div>
                                        {selectedMethod.account_name && (
                                            <div>
                                                <Label className="text-xs text-stone-500">Account Name</Label>
                                                <p className="font-medium">{selectedMethod.account_name}</p>
                                            </div>
                                        )}
                                        {selectedMethod.account_number && (
                                            <div>
                                                <Label className="text-xs text-stone-500">Account Number</Label>
                                                <div className="flex items-center gap-2">
                                                    <p className="font-medium font-mono">{selectedMethod.account_number}</p>
                                                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => copyToClipboard(selectedMethod.account_number!)}>
                                                        {copiedText === selectedMethod.account_number ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                                                    </Button>
                                                </div>
                                            </div>
                                        )}
                                        {selectedMethod.routing_number && (
                                            <div>
                                                <Label className="text-xs text-stone-500">Routing Number</Label>
                                                <p className="font-medium font-mono">{selectedMethod.routing_number}</p>
                                            </div>
                                        )}
                                        {selectedMethod.swift_code && (
                                            <div>
                                                <Label className="text-xs text-stone-500">SWIFT Code</Label>
                                                <p className="font-medium font-mono">{selectedMethod.swift_code}</p>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Additional Info */}
                                {selectedMethod.additional_info && (
                                    <div className="pt-2 border-t">
                                        <Label className="text-xs text-stone-500">Instructions</Label>
                                        <p className="text-sm text-stone-600 dark:text-stone-400 whitespace-pre-wrap">
                                            {selectedMethod.additional_info}
                                        </p>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>
            )}

            {/* Step 3: Amount & Proof */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
            >
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-stone-900 text-white text-sm dark:bg-stone-100 dark:text-stone-900">3</span>
                            Confirm Deposit
                        </CardTitle>
                        <CardDescription>Enter amount and upload payment proof</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {/* Amount */}
                        <div className="space-y-2">
                            <Label htmlFor="amount">Amount Deposited (USD)</Label>
                            <div className="relative">
                                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
                                <Input
                                    id="amount"
                                    type="number"
                                    placeholder="0.00"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    className="pl-9 text-lg"
                                    min="10"
                                    step="0.01"
                                />
                            </div>
                        </div>

                        <Separator />

                        {/* Proof Upload */}
                        <div className="space-y-3">
                            <Label>Proof of Payment *</Label>
                            <p className="text-sm text-stone-500">
                                Upload a screenshot showing the completed payment
                            </p>

                            <AnimatePresence mode="wait">
                                {!proofFile ? (
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        className="border-2 border-dashed border-stone-300 dark:border-stone-700 rounded-lg p-8 text-center hover:border-stone-400 transition-colors cursor-pointer"
                                        onClick={() => fileInputRef.current?.click()}
                                    >
                                        <Upload className="h-10 w-10 mx-auto text-stone-400 mb-3" />
                                        <p className="font-medium text-stone-900 dark:text-stone-100 mb-1">
                                            Click to upload proof
                                        </p>
                                        <p className="text-sm text-stone-500">PNG, JPG up to 5MB</p>
                                        <input
                                            ref={fileInputRef}
                                            type="file"
                                            accept="image/*"
                                            onChange={handleFileSelect}
                                            className="hidden"
                                        />
                                    </motion.div>
                                ) : (
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        className="border rounded-lg p-4"
                                    >
                                        <div className="flex items-start gap-4">
                                            {previewUrl && (
                                                <img src={previewUrl} alt="Proof" className="w-20 h-20 object-cover rounded flex-shrink-0" />
                                            )}
                                            <div className="flex-1 min-w-0 overflow-hidden">
                                                <div className="flex items-start justify-between gap-2">
                                                    <div className="min-w-0 flex-1">
                                                        <p className="font-medium truncate max-w-[200px]" title={proofFile.name}>
                                                            {proofFile.name}
                                                        </p>
                                                        <p className="text-sm text-stone-500">{(proofFile.size / 1024 / 1024).toFixed(2)} MB</p>
                                                    </div>
                                                    <Button variant="ghost" size="icon" className="flex-shrink-0" onClick={handleRemoveFile}>
                                                        <X className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                                <Badge className="mt-2 bg-green-500/10 text-green-600">
                                                    <Check className="h-3 w-3 mr-1" /> Ready
                                                </Badge>
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        {/* Submit */}
                        <Button
                            onClick={handleSubmit}
                            disabled={submitting || uploading || !proofFile || !amount}
                            className="w-full"
                            size="lg"
                        >
                            {(submitting || uploading) ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    {uploading ? "Uploading..." : "Submitting..."}
                                </>
                            ) : (
                                "Submit Deposit Request"
                            )}
                        </Button>
                    </CardContent>
                </Card>
            </motion.div>

            {/* Recent Deposits */}
            {deposits.length > 0 && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                >
                    <Card>
                        <CardHeader>
                            <CardTitle>Recent Deposits</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                {deposits.map((dep) => (
                                    <div key={dep.id} className="flex items-center justify-between py-3 border-b last:border-0">
                                        <div className="flex items-center gap-3">
                                            <div className="h-10 w-10 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
                                                <DollarSign className="h-5 w-5 text-green-600" />
                                            </div>
                                            <div>
                                                <p className="font-medium">{formatCurrency(dep.amount)}</p>
                                                <p className="text-sm text-stone-500">{formatDate(dep.created_at)}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {dep.proof_url && (
                                                <Button variant="ghost" size="sm" onClick={() => window.open(dep.proof_url!, "_blank")}>
                                                    <ImageIcon className="h-4 w-4" />
                                                </Button>
                                            )}
                                            <Badge className={getStatusColor(dep.status)}>{dep.status}</Badge>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>
            )}
        </div>
    );
}
