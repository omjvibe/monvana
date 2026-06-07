"use client";

import { useState, useEffect } from "react";
import { useUser } from "@/hooks/useAuth";
import { motion } from "framer-motion";
import { Loader2, Search, ArrowUpRight, ArrowDownRight, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
);

interface Transaction {
    id: string;
    type: string;
    amount: number;
    status: string;
    description?: string;
    reference?: string;
    recipient_name?: string;
    sender_name?: string;
    sender_account?: string;
    sender_bank?: string;
    created_at: string;
}

const hashSender = (name?: string, account?: string) => {
    if (!name) return { hashedName: "", hashedAccount: "" };

    const hashedName = name.split(' ').map(part => {
        if (part.length <= 2) return part;
        return part.slice(0, 1) + '***' + part.slice(-1);
    }).join(' ');

    const hashedAccount = account ? (account.length <= 4
        ? "****"
        : account.slice(0, 2) + "****" + account.slice(-2)) : "";

    return { hashedName, hashedAccount };
};

export default function TransactionsPage() {
    const [loading, setLoading] = useState(true);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [typeFilter, setTypeFilter] = useState("all");
    const [statusFilter, setStatusFilter] = useState("all");
    const { user: clerkUser, isLoaded } = useUser();
    // ... inside return ...
    // (replacing the tx map part)

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
                    const { data: txData } = await supabase
                        .from("transactions")
                        .select("*")
                        .eq("user_id", userData.id)
                        .order("created_at", { ascending: false });

                    setTransactions(txData || []);
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

    const getStatusColor = (status: string) => {
        switch (status) {
            case "approved":
                return "bg-green-500/10 text-green-600";
            case "pending":
                return "bg-yellow-500/10 text-yellow-600";
            case "processing":
            case "on_hold":
                return "bg-blue-500/10 text-blue-600";
            case "cancelled":
            case "failed":
                return "bg-red-500/10 text-red-600";
            default:
                return "bg-stone-100 text-stone-600";
        }
    };

    const isCredit = (tx: Transaction) => {
        if (["deposit", "bonus", "refund"].includes(tx.type)) return true;
        // If it's a transfer and has a sender_name, it's an incoming transfer (credit)
        if (tx.type === "transfer" && tx.sender_name) return true;
        return false;
    };

    const filteredTransactions = transactions.filter((tx) => {
        const matchesSearch =
            (tx.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                tx.reference?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                tx.recipient_name?.toLowerCase().includes(searchQuery.toLowerCase()));

        const matchesType = typeFilter === "all" || tx.type === typeFilter;
        const matchesStatus = statusFilter === "all" || tx.status === statusFilter;

        return (searchQuery === "" || matchesSearch) && matchesType && matchesStatus;
    }).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    if (loading || !isLoaded) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-stone-400" />
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
            >
                <h1 className="text-2xl font-bold text-stone-900 dark:text-stone-100">
                    Transaction History
                </h1>
                <p className="text-stone-600 dark:text-stone-400">
                    View all your financial activities
                </p>
            </motion.div>

            {/* Filters */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
            >
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex flex-col gap-4 md:flex-row">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
                                <Input
                                    placeholder="Search transactions..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-10"
                                />
                            </div>
                            <Select value={typeFilter} onValueChange={setTypeFilter}>
                                <SelectTrigger className="w-full md:w-40">
                                    <SelectValue placeholder="Type" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Types</SelectItem>
                                    <SelectItem value="deposit">Deposit</SelectItem>
                                    <SelectItem value="withdrawal">Withdrawal</SelectItem>
                                    <SelectItem value="transfer">Transfer</SelectItem>
                                    <SelectItem value="loan">Loan</SelectItem>
                                    <SelectItem value="investment">Investment</SelectItem>
                                    <SelectItem value="donation">Donation</SelectItem>
                                </SelectContent>
                            </Select>
                            <Select value={statusFilter} onValueChange={setStatusFilter}>
                                <SelectTrigger className="w-full md:w-40">
                                    <SelectValue placeholder="Status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Status</SelectItem>
                                    <SelectItem value="approved">Approved</SelectItem>
                                    <SelectItem value="pending">Pending</SelectItem>
                                    <SelectItem value="processing">Processing</SelectItem>
                                    <SelectItem value="on_hold">On Hold</SelectItem>
                                    <SelectItem value="cancelled">Cancelled</SelectItem>
                                    <SelectItem value="failed">Failed</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </CardContent>
                </Card>
            </motion.div>

            {/* Transactions */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
            >
                <Card>
                    <CardHeader>
                        <CardTitle>Transactions</CardTitle>
                        <CardDescription>
                            {filteredTransactions.length} transaction{filteredTransactions.length !== 1 && "s"} found
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {filteredTransactions.length === 0 ? (
                            <div className="py-12 text-center">
                                <Filter className="mx-auto h-12 w-12 text-stone-300" />
                                <p className="mt-4 text-stone-500">
                                    {transactions.length === 0
                                        ? "No transactions yet"
                                        : "No transactions match your filters"}
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {filteredTransactions.map((tx, index) => {
                                    const credit = isCredit(tx);
                                    const { hashedName, hashedAccount } = hashSender(tx.sender_name, tx.sender_account);

                                    return (
                                        <div key={tx.id}>
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <div
                                                        className={`flex h-10 w-10 items-center justify-center rounded-full ${credit
                                                            ? "bg-green-500/10 text-green-600"
                                                            : "bg-red-500/10 text-red-600"
                                                            }`}
                                                    >
                                                        {credit ? (
                                                            <ArrowDownRight className="h-5 w-5" />
                                                        ) : (
                                                            <ArrowUpRight className="h-5 w-5" />
                                                        )}
                                                    </div>
                                                    <div>
                                                        <p className="font-medium text-stone-900 dark:text-stone-100">
                                                            {tx.sender_name ? `From: ${hashedName}` : (tx.description || tx.type.charAt(0).toUpperCase() + tx.type.slice(1))}
                                                        </p>
                                                        <div className="flex flex-col">
                                                            {tx.sender_name && tx.description && !tx.description.includes("Incoming Transfer from") && (
                                                                <p className="text-sm text-stone-600 dark:text-stone-400">
                                                                    {tx.description}
                                                                </p>
                                                            )}
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-xs text-stone-500">
                                                                    {formatDate(tx.created_at)}
                                                                </span>
                                                                {tx.reference && (
                                                                    <span className="text-xs text-stone-400 font-mono">
                                                                        #{tx.reference}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p
                                                        className={`font-semibold ${credit ? "text-green-600" : "text-stone-900 dark:text-stone-100"
                                                            }`}
                                                    >
                                                        {credit ? "+" : "-"}{formatCurrency(tx.amount)}
                                                    </p>
                                                    <Badge className={getStatusColor(tx.status)}>
                                                        {tx.status}
                                                    </Badge>
                                                </div>
                                            </div>
                                            {index < filteredTransactions.length - 1 && (
                                                <Separator className="mt-4" />
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </motion.div>
        </div>
    );
}
