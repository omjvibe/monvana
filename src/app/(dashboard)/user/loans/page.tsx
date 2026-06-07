"use client";

import { useState, useEffect } from "react";
import { useUser } from "@/hooks/useAuth";
import { motion } from "framer-motion";
import Link from "next/link";
import { Loader2, Landmark, Clock, CheckCircle2, XCircle, ArrowRight, FileText, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
);

interface Loan {
    id: string;
    amount: number;
    term_months: number;
    interest_rate: number;
    monthly_payment: number;
    total_payable: number;
    remaining_balance: number;
    purpose: string;
    status: string;
    created_at: string;
    approved_at?: string;
}

export default function LoansPage() {
    const [loading, setLoading] = useState(true);
    const [loans, setLoans] = useState<Loan[]>([]);
    const [userId, setUserId] = useState<string | null>(null);
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

                    const { data: loanData } = await supabase
                        .from("loans")
                        .select("*")
                        .eq("user_id", userData.id)
                        .order("created_at", { ascending: false });

                    setLoans(loanData || []);
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

    const getStatusBadge = (status: string) => {
        switch (status) {
            case "approved":
            case "active":
                return (
                    <Badge className="bg-green-500/10 text-green-600 border-green-200">
                        <CheckCircle2 className="mr-1 h-3 w-3" />
                        Active
                    </Badge>
                );
            case "pending":
                return (
                    <Badge className="bg-yellow-500/10 text-yellow-600 border-yellow-200">
                        <Clock className="mr-1 h-3 w-3" />
                        Pending Review
                    </Badge>
                );
            case "rejected":
                return (
                    <Badge className="bg-red-500/10 text-red-600 border-red-200">
                        <XCircle className="mr-1 h-3 w-3" />
                        Rejected
                    </Badge>
                );
            case "paid":
            case "completed":
                return (
                    <Badge className="bg-blue-500/10 text-blue-600 border-blue-200">
                        <CheckCircle2 className="mr-1 h-3 w-3" />
                        Completed
                    </Badge>
                );
            default:
                return <Badge>{status}</Badge>;
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case "approved":
            case "active":
                return <CheckCircle2 className="h-5 w-5 text-green-600" />;
            case "pending":
                return <Clock className="h-5 w-5 text-yellow-600" />;
            case "rejected":
                return <XCircle className="h-5 w-5 text-red-600" />;
            default:
                return <FileText className="h-5 w-5 text-muted-foreground" />;
        }
    };

    if (loading || !isLoaded) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-stone-400" />
            </div>
        );
    }

    const activeLoans = loans.filter(l => ["active", "approved"].includes(l.status));
    const pendingLoans = loans.filter(l => l.status === "pending");
    const totalBorrowed = activeLoans.reduce((sum, l) => sum + Number(l.amount), 0);
    const totalMonthlyPayment = activeLoans.reduce((sum, l) => sum + Number(l.monthly_payment || 0), 0);

    return (
        <div className="space-y-8">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between"
            >
                <div>
                    <h1 className="text-2xl font-bold text-stone-900 dark:text-stone-100">
                        Loans
                    </h1>
                    <p className="text-stone-600 dark:text-stone-400">
                        Apply for loans and manage your existing loans
                    </p>
                </div>
                <Button asChild size="lg" className="gap-2">
                    <Link href="/user/loans/apply">
                        <Plus className="h-4 w-4" />
                        Apply for a Loan
                        <ArrowRight className="h-4 w-4" />
                    </Link>
                </Button>
            </motion.div>

            {/* Summary Cards */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="grid gap-4 md:grid-cols-4"
            >
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-stone-500">Active Loans</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-2xl font-bold text-stone-900 dark:text-stone-100">
                            {activeLoans.length}
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-stone-500">Total Borrowed</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-2xl font-bold text-stone-900 dark:text-stone-100">
                            {formatCurrency(totalBorrowed)}
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-stone-500">Monthly Payment</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-2xl font-bold text-primary">
                            {formatCurrency(totalMonthlyPayment)}
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-stone-500">Pending Applications</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-2xl font-bold text-yellow-600">
                            {pendingLoans.length}
                        </p>
                    </CardContent>
                </Card>
            </motion.div>

            {/* Pending Applications */}
            {pendingLoans.length > 0 && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15 }}
                >
                    <Card className="border-yellow-200 bg-yellow-50/50 dark:bg-yellow-950/10">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-yellow-700 dark:text-yellow-400">
                                <Clock className="h-5 w-5" />
                                Pending Applications
                            </CardTitle>
                            <CardDescription>
                                Your loan applications are being reviewed
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {pendingLoans.map((loan, index) => (
                                    <div key={loan.id}>
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-yellow-100 dark:bg-yellow-900/30">
                                                    <Clock className="h-5 w-5 text-yellow-600" />
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-stone-900 dark:text-stone-100">
                                                        {formatCurrency(loan.amount)}
                                                    </p>
                                                    <p className="text-sm text-stone-500">
                                                        Applied: {formatDate(loan.created_at)}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-sm text-stone-600 dark:text-stone-400">
                                                    {loan.term_months} months @ {loan.interest_rate}%
                                                </p>
                                                <p className="text-xs text-muted-foreground">
                                                    Est. monthly: {formatCurrency(loan.monthly_payment || 0)}
                                                </p>
                                            </div>
                                        </div>
                                        {loan.purpose && (
                                            <p className="mt-2 ml-13 text-sm text-stone-500 bg-white dark:bg-stone-900/50 p-2 rounded">
                                                Purpose: {loan.purpose}
                                            </p>
                                        )}
                                        {index < pendingLoans.length - 1 && <Separator className="mt-4" />}
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>
            )}

            {/* Active Loans */}
            {activeLoans.length > 0 && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                >
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <CheckCircle2 className="h-5 w-5 text-green-600" />
                                Active Loans
                            </CardTitle>
                            <CardDescription>
                                Your approved and active loans
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-6">
                                {activeLoans.map((loan, index) => {
                                    const progress = loan.remaining_balance
                                        ? ((loan.total_payable - loan.remaining_balance) / loan.total_payable) * 100
                                        : 0;

                                    return (
                                        <div key={loan.id}>
                                            <div className="flex items-start justify-between mb-3">
                                                <div>
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <p className="text-lg font-semibold text-stone-900 dark:text-stone-100">
                                                            {formatCurrency(loan.amount)}
                                                        </p>
                                                        {getStatusBadge(loan.status)}
                                                    </div>
                                                    <p className="text-sm text-stone-500">
                                                        {loan.purpose || "Personal Loan"}
                                                    </p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="font-medium text-primary">
                                                        {formatCurrency(loan.monthly_payment || 0)}/month
                                                    </p>
                                                    <p className="text-xs text-stone-500">
                                                        {loan.term_months} months @ {loan.interest_rate}%
                                                    </p>
                                                </div>
                                            </div>

                                            {loan.remaining_balance && (
                                                <div className="space-y-2">
                                                    <div className="flex justify-between text-sm">
                                                        <span className="text-stone-500">Repayment Progress</span>
                                                        <span className="font-medium">{Math.round(progress)}%</span>
                                                    </div>
                                                    <Progress value={progress} className="h-2" />
                                                    <div className="flex justify-between text-xs text-stone-500">
                                                        <span>Remaining: {formatCurrency(loan.remaining_balance)}</span>
                                                        <span>Total: {formatCurrency(loan.total_payable || loan.amount)}</span>
                                                    </div>
                                                </div>
                                            )}

                                            {index < activeLoans.length - 1 && <Separator className="mt-4" />}
                                        </div>
                                    );
                                })}
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>
            )}

            {/* All Loans / Empty State */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
            >
                <Card>
                    <CardHeader>
                        <CardTitle>Loan History</CardTitle>
                        <CardDescription>All your loan applications</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {loans.length === 0 ? (
                            <div className="py-12 text-center">
                                <div className="mx-auto w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                                    <Landmark className="h-8 w-8 text-muted-foreground" />
                                </div>
                                <h3 className="text-lg font-medium text-stone-900 dark:text-stone-100 mb-2">
                                    No loans yet
                                </h3>
                                <p className="text-stone-500 mb-6 max-w-sm mx-auto">
                                    Ready to get started? Apply for a loan with competitive rates and flexible terms.
                                </p>
                                <Button asChild>
                                    <Link href="/user/loans/apply">
                                        <Plus className="mr-2 h-4 w-4" />
                                        Apply for Your First Loan
                                    </Link>
                                </Button>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {loans.map((loan, index) => (
                                    <div key={loan.id}>
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                                                    {getStatusIcon(loan.status)}
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <p className="font-medium text-stone-900 dark:text-stone-100">
                                                            {formatCurrency(loan.amount)}
                                                        </p>
                                                        {getStatusBadge(loan.status)}
                                                    </div>
                                                    <p className="text-sm text-stone-500">
                                                        {loan.purpose || "Personal Loan"} • {formatDate(loan.created_at)}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="text-right text-sm">
                                                <p className="text-stone-500">
                                                    {loan.term_months}mo @ {loan.interest_rate}%
                                                </p>
                                                <p className="font-medium text-stone-900 dark:text-stone-100">
                                                    {formatCurrency(loan.monthly_payment || 0)}/mo
                                                </p>
                                            </div>
                                        </div>
                                        {index < loans.length - 1 && <Separator className="mt-4" />}
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </motion.div>
        </div>
    );
}
