"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
    Search,
    MoreHorizontal,
    CheckCircle2,
    XCircle,
    Clock,
    DollarSign,
    Landmark,
    Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";

interface Loan {
    id: string;
    user_id: string;
    amount: number;
    term_months: number;
    interest_rate: number;
    purpose: string;
    status: string;
    monthly_payment: number;
    created_at: string;
    users?: { first_name: string; last_name: string; email: string };
}

export default function AdminLoansPage() {
    const [loading, setLoading] = useState(true);
    const [loans, setLoans] = useState<Loan[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");

    useEffect(() => {
        fetchLoans();
    }, []);

    const fetchLoans = async () => {
        try {
            const response = await fetch("/api/admin/loans");

            if (!response.ok) {
                throw new Error("Failed to fetch loans");
            }

            const data = await response.json();
            setLoans(data.loans || []);
        } catch (error) {
            console.error("Error fetching loans:", error);
            toast.error("Failed to load loans");
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: "USD",
            minimumFractionDigits: 0,
        }).format(amount);
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case "active":
            case "approved":
                return "bg-green-500/10 text-green-600 dark:text-green-400";
            case "pending":
                return "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400";
            case "rejected":
                return "bg-red-500/10 text-red-600 dark:text-red-400";
            case "paid":
                return "bg-blue-500/10 text-blue-600 dark:text-blue-400";
            default:
                return "bg-muted text-muted-foreground";
        }
    };

    const updateStatus = async (loanId: string, newStatus: string) => {
        try {
            const response = await fetch("/api/admin/loans", {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ loanId, status: newStatus }),
            });

            if (!response.ok) {
                throw new Error("Failed to update loan");
            }

            toast.success(`Loan ${newStatus}`);
            fetchLoans();
        } catch (error) {
            console.error("Error updating loan:", error);
            toast.error("Failed to update loan status");
        }
    };

    const filteredLoans = loans.filter((loan) => {
        const userName = `${loan.users?.first_name} ${loan.users?.last_name}`.toLowerCase();
        const matchesSearch =
            loan.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
            userName.includes(searchQuery.toLowerCase()) ||
            loan.purpose?.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = statusFilter === "all" || loan.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const stats = {
        total: loans.length,
        pending: loans.filter(l => l.status === "pending").length,
        active: loans.filter(l => l.status === "active").length,
        totalAmount: loans.filter(l => l.status === "active").reduce((sum, l) => sum + Number(l.amount), 0),
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-stone-400" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
            >
                <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
                    Loan Management
                </h1>
                <p className="text-muted-foreground">
                    Review and manage loan applications.
                </p>
            </motion.div>

            {/* Stats */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.1 }}
                className="grid gap-4 md:grid-cols-4"
            >
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                            <Landmark className="h-4 w-4" />
                            Total Loans
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.total}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                            <Clock className="h-4 w-4 text-yellow-500" />
                            Pending
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                            Active
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">{stats.active}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                            <DollarSign className="h-4 w-4" />
                            Total Loaned
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatCurrency(stats.totalAmount)}</div>
                    </CardContent>
                </Card>
            </motion.div>

            {/* Filters */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.2 }}
            >
                <Card>
                    <CardContent className="p-4">
                        <div className="flex flex-col gap-4 md:flex-row md:items-center">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                <Input
                                    placeholder="Search loans..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-10"
                                />
                            </div>
                            <Select value={statusFilter} onValueChange={setStatusFilter}>
                                <SelectTrigger className="w-[150px]">
                                    <SelectValue placeholder="Status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Status</SelectItem>
                                    <SelectItem value="pending">Pending</SelectItem>
                                    <SelectItem value="active">Active</SelectItem>
                                    <SelectItem value="paid">Paid</SelectItem>
                                    <SelectItem value="rejected">Rejected</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </CardContent>
                </Card>
            </motion.div>

            {/* Loans Table */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.3 }}
            >
                <Card>
                    <CardContent className="p-0">
                        {filteredLoans.length === 0 ? (
                            <div className="py-12 text-center text-muted-foreground">
                                <Landmark className="mx-auto h-12 w-12 opacity-50 mb-4" />
                                No loans found
                            </div>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Borrower</TableHead>
                                        <TableHead>Amount</TableHead>
                                        <TableHead className="hidden md:table-cell">Term</TableHead>
                                        <TableHead className="hidden lg:table-cell">Rate</TableHead>
                                        <TableHead className="hidden lg:table-cell">Purpose</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredLoans.map((loan) => (
                                        <TableRow key={loan.id}>
                                            <TableCell>
                                                <div>
                                                    <p className="font-medium">{loan.users?.first_name} {loan.users?.last_name}</p>
                                                    <p className="text-xs text-muted-foreground">{loan.users?.email}</p>
                                                </div>
                                            </TableCell>
                                            <TableCell className="font-semibold">{formatCurrency(loan.amount)}</TableCell>
                                            <TableCell className="hidden md:table-cell">{loan.term_months} months</TableCell>
                                            <TableCell className="hidden lg:table-cell">{loan.interest_rate}%</TableCell>
                                            <TableCell className="hidden lg:table-cell">{loan.purpose || "-"}</TableCell>
                                            <TableCell>
                                                <Badge variant="secondary" className={getStatusColor(loan.status)}>
                                                    {loan.status}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon">
                                                            <MoreHorizontal className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuLabel>Update Status</DropdownMenuLabel>
                                                        <DropdownMenuSeparator />
                                                        {loan.status === "pending" && (
                                                            <>
                                                                <DropdownMenuItem
                                                                    onClick={() => updateStatus(loan.id, "active")}
                                                                    className="text-green-600"
                                                                >
                                                                    <CheckCircle2 className="mr-2 h-4 w-4" />
                                                                    Approve
                                                                </DropdownMenuItem>
                                                                <DropdownMenuItem
                                                                    onClick={() => updateStatus(loan.id, "rejected")}
                                                                    className="text-red-600"
                                                                >
                                                                    <XCircle className="mr-2 h-4 w-4" />
                                                                    Reject
                                                                </DropdownMenuItem>
                                                            </>
                                                        )}
                                                        {loan.status === "active" && (
                                                            <DropdownMenuItem
                                                                onClick={() => updateStatus(loan.id, "paid")}
                                                                className="text-blue-600"
                                                            >
                                                                <CheckCircle2 className="mr-2 h-4 w-4" />
                                                                Mark as Paid
                                                            </DropdownMenuItem>
                                                        )}
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        )}
                    </CardContent>
                </Card>
            </motion.div>
        </div>
    );
}
