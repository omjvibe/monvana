"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
    Search,
    MoreHorizontal,
    ArrowUpRight,
    ArrowDownRight,
    CheckCircle2,
    XCircle,
    Clock,
    AlertTriangle,
    Loader2,
    RefreshCw,
    Eye,
    FileText,
    ChevronLeft,
    ChevronRight,
    Pencil,
    Send,
    Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { downloadReceipt } from "@/lib/receipt";

interface Transaction {
    id: string;
    user_id: string;
    wallet_id: string;
    type: string;
    amount: number;
    currency: string;
    status: string;
    description: string;
    reference: string;
    recipient_name: string;
    recipient_account: string;
    recipient_bank: string;
    swift_code: string;
    routing_number: string;
    admin_note: string;
    proof_url: string | null;
    sender_name?: string;
    sender_account?: string;
    sender_bank?: string;
    created_at: string;
    user?: { id: string; first_name: string; last_name: string; email: string };
    wallet?: { id: string; currency: string; account_number: string };
}

interface Stats {
    total: number;
    pending: number;
    processing: number;
    onHold: number;
    approved: number;
    totalAmount: number;
}

export default function AdminTransactionsPage() {
    const [loading, setLoading] = useState(true);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [stats, setStats] = useState<Stats | null>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [typeFilter, setTypeFilter] = useState("all");
    const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
    const [showDetailDialog, setShowDetailDialog] = useState(false);
    const [showUpdateDialog, setShowUpdateDialog] = useState(false);
    const [showEditDialog, setShowEditDialog] = useState(false);
    const [newStatus, setNewStatus] = useState("");
    const [adminNote, setAdminNote] = useState("");
    const [updating, setUpdating] = useState(false);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [deleting, setDeleting] = useState(false);

    // Edit form state
    const [editAmount, setEditAmount] = useState("");
    const [editDescription, setEditDescription] = useState("");
    const [editType, setEditType] = useState("");
    const [editDate, setEditDate] = useState("");
    const [editRecipientName, setEditRecipientName] = useState("");
    const [editRecipientAccount, setEditRecipientAccount] = useState("");
    const [editRecipientBank, setEditRecipientBank] = useState("");
    const [editSwiftCode, setEditSwiftCode] = useState("");
    const [editRoutingNumber, setEditRoutingNumber] = useState("");
    const [editNote, setEditNote] = useState("");

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 15;

    useEffect(() => {
        fetchTransactions();
    }, [statusFilter, typeFilter]);

    const fetchTransactions = async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams();
            if (statusFilter !== "all") params.append("status", statusFilter);
            if (typeFilter !== "all") params.append("type", typeFilter);

            const response = await fetch(`/api/admin/transactions?${params.toString()}`);
            if (response.ok) {
                const data = await response.json();
                setTransactions(data.transactions || []);
                setStats(data.stats || null);
            } else {
                toast.error("Failed to load transactions");
            }
        } catch (error) {
            console.error("Error fetching transactions:", error);
            toast.error("Failed to load transactions");
        } finally {
            setLoading(false);
        }
    };

    const updateTransactionStatus = async () => {
        if (!selectedTransaction || !newStatus) return;

        setUpdating(true);
        try {
            const response = await fetch("/api/admin/transactions", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    transactionId: selectedTransaction.id,
                    status: newStatus,
                    adminNote: adminNote || undefined,
                }),
            });

            if (response.ok) {
                toast.success(`Transaction ${newStatus}`);
                setShowUpdateDialog(false);
                setSelectedTransaction(null);
                setAdminNote("");
                fetchTransactions();
            } else {
                const data = await response.json();
                toast.error(data.error || "Failed to update status");
            }
        } catch (error) {
            console.error("Error updating status:", error);
            toast.error("Failed to update status");
        } finally {
            setUpdating(false);
        }
    };

    const deleteTransaction = async () => {
        if (!selectedTransaction) return;

        setDeleting(true);
        try {
            const response = await fetch("/api/admin/transactions", {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    transactionId: selectedTransaction.id,
                }),
            });

            if (response.ok) {
                toast.success("Transaction deleted permanently");
                setShowDeleteDialog(false);
                setSelectedTransaction(null);
                fetchTransactions();
            } else {
                const data = await response.json();
                toast.error(data.error || "Failed to delete transaction");
            }
        } catch (error) {
            console.error("Error deleting transaction:", error);
            toast.error("Failed to delete transaction");
        } finally {
            setDeleting(false);
        }
    };

    const formatCurrency = (amount: number, currency = "USD") => {
        if (["BTC", "ETH"].includes(currency)) {
            return `${amount.toFixed(8)} ${currency}`;
        }
        return new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: "USD",
            minimumFractionDigits: 2,
        }).format(amount);
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case "approved":
            case "sent":
                return "bg-green-500/10 text-green-600 dark:text-green-400";
            case "processing":
                return "bg-blue-500/10 text-blue-600 dark:text-blue-400";
            case "pending":
                return "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400";
            case "on_hold":
                return "bg-orange-500/10 text-orange-600 dark:text-orange-400";
            case "cancelled":
            case "failed":
                return "bg-red-500/10 text-red-600 dark:text-red-400";
            default:
                return "bg-muted text-muted-foreground";
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case "approved":
                return <CheckCircle2 className="h-4 w-4" />;
            case "sent":
                return <Send className="h-4 w-4" />;
            case "pending":
            case "processing":
                return <Clock className="h-4 w-4" />;
            case "on_hold":
                return <AlertTriangle className="h-4 w-4" />;
            case "cancelled":
            case "failed":
                return <XCircle className="h-4 w-4" />;
            default:
                return null;
        }
    };

    const handleOpenUpdateDialog = (tx: Transaction, status: string) => {
        setSelectedTransaction(tx);
        setNewStatus(status);
        setAdminNote("");
        setShowUpdateDialog(true);
    };

    const handleOpenEditDialog = (tx: Transaction) => {
        setSelectedTransaction(tx);
        setEditAmount(tx.amount.toString());
        setEditDescription(tx.description || "");
        setEditType(tx.type);
        setEditDate(new Date(tx.created_at).toISOString().slice(0, 16));
        setEditRecipientName(tx.recipient_name || "");
        setEditRecipientAccount(tx.recipient_account || "");
        setEditRecipientBank(tx.recipient_bank || "");
        setEditSwiftCode(tx.swift_code || "");
        setEditRoutingNumber(tx.routing_number || "");
        setEditNote("");
        setShowEditDialog(true);
    };

    const handleSaveEdit = async () => {
        if (!selectedTransaction) return;
        setUpdating(true);
        try {
            const response = await fetch("/api/admin/transactions", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    transactionId: selectedTransaction.id,
                    adminNote: editNote || undefined,
                    editDetails: {
                        amount: parseFloat(editAmount),
                        description: editDescription,
                        type: editType,
                        created_at: editDate,
                        recipient_name: editRecipientName || undefined,
                        recipient_account: editRecipientAccount || undefined,
                        recipient_bank: editRecipientBank || undefined,
                        swift_code: editSwiftCode || undefined,
                        routing_number: editRoutingNumber || undefined,
                    },
                }),
            });

            if (response.ok) {
                toast.success("Transaction details updated");
                setShowEditDialog(false);
                setSelectedTransaction(null);
                fetchTransactions();
            } else {
                const data = await response.json();
                toast.error(data.error || "Failed to update");
            }
        } catch (error) {
            console.error("Error editing transaction:", error);
            toast.error("Failed to update transaction");
        } finally {
            setUpdating(false);
        }
    };

    const filteredTransactions = transactions.filter((tx) => {
        const userName = `${tx.user?.first_name} ${tx.user?.last_name}`.toLowerCase();
        const matchesSearch =
            tx.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
            userName.includes(searchQuery.toLowerCase()) ||
            tx.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            tx.recipient_name?.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesSearch;
    });

    // Pagination calculations
    const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedTransactions = filteredTransactions.slice(startIndex, endIndex);

    // Reset to page 1 when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery, statusFilter, typeFilter]);

    if (loading && transactions.length === 0) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between"
            >
                <div>
                    <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
                        Transactions
                    </h1>
                    <p className="text-muted-foreground">
                        Review and manage all financial transactions.
                    </p>
                </div>
                <Button variant="outline" onClick={fetchTransactions} disabled={loading}>
                    <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                    Refresh
                </Button>
            </motion.div>

            {/* Stats */}
            <div className="grid gap-4 md:grid-cols-5">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Total</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats?.total || 0}</div>
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
                        <div className="text-2xl font-bold text-yellow-600">{stats?.pending || 0}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                            <Loader2 className="h-4 w-4 text-blue-500" />
                            Processing
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-blue-600">{stats?.processing || 0}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                            <AlertTriangle className="h-4 w-4 text-orange-500" />
                            On Hold
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-orange-600">{stats?.onHold || 0}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                            Approved
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">{stats?.approved || 0}</div>
                    </CardContent>
                </Card>
            </div>

            {/* Filters */}
            <Card>
                <CardContent className="p-4">
                    <div className="flex flex-col gap-4 md:flex-row md:items-center">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                placeholder="Search transactions..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-10"
                            />
                        </div>
                        <Select value={typeFilter} onValueChange={setTypeFilter}>
                            <SelectTrigger className="w-[150px]">
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
                            <SelectTrigger className="w-[150px]">
                                <SelectValue placeholder="Status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Status</SelectItem>
                                <SelectItem value="pending">Pending</SelectItem>
                                <SelectItem value="processing">Processing</SelectItem>
                                <SelectItem value="approved">Approved</SelectItem>
                                <SelectItem value="sent">Sent</SelectItem>
                                <SelectItem value="on_hold">On Hold</SelectItem>
                                <SelectItem value="cancelled">Cancelled</SelectItem>
                                <SelectItem value="failed">Failed</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>

            {/* Transactions Table */}
            <Card>
                <CardContent className="p-0">
                    {filteredTransactions.length === 0 ? (
                        <div className="py-12 text-center text-muted-foreground">
                            <FileText className="mx-auto h-12 w-12 opacity-50 mb-4" />
                            <p>No transactions found</p>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Transaction</TableHead>
                                    <TableHead>User</TableHead>
                                    <TableHead>Type</TableHead>
                                    <TableHead>Amount</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="hidden md:table-cell">Date</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {paginatedTransactions.map((tx) => {
                                    const isCredit = tx.type === "deposit" || tx.type === "bonus" || tx.type === "loan";
                                    return (
                                        <TableRow key={tx.id}>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <div
                                                        className={`flex h-8 w-8 items-center justify-center rounded-full ${isCredit
                                                            ? "bg-green-500/10 text-green-600"
                                                            : "bg-red-500/10 text-red-600"
                                                            }`}
                                                    >
                                                        {isCredit ? (
                                                            <ArrowDownRight className="h-4 w-4" />
                                                        ) : (
                                                            <ArrowUpRight className="h-4 w-4" />
                                                        )}
                                                    </div>
                                                    <div>
                                                        <span className="font-mono text-sm">{tx.id.slice(0, 8)}...</span>
                                                        {tx.reference && (
                                                            <p className="text-xs text-muted-foreground">{tx.reference}</p>
                                                        )}
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <Avatar className="h-7 w-7">
                                                        <AvatarFallback className="text-xs">
                                                            {tx.user?.first_name?.[0]}{tx.user?.last_name?.[0]}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <div>
                                                        <p className="font-medium text-sm">{tx.user?.first_name} {tx.user?.last_name}</p>
                                                        <p className="text-xs text-muted-foreground">{tx.user?.email}</p>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className="capitalize">
                                                    {tx.type}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className={`font-semibold ${isCredit ? "text-green-600" : ""}`}>
                                                {isCredit ? "+" : "-"}{formatCurrency(tx.amount, tx.currency)}
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="secondary" className={`${getStatusColor(tx.status)} flex w-fit items-center gap-1`}>
                                                    {getStatusIcon(tx.status)}
                                                    {tx.status.replace("_", " ")}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="hidden md:table-cell">
                                                {new Date(tx.created_at).toLocaleDateString()}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon">
                                                            <MoreHorizontal className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem onClick={() => {
                                                            setSelectedTransaction(tx);
                                                            setShowDetailDialog(true);
                                                        }}>
                                                            <Eye className="mr-2 h-4 w-4" />
                                                            View Details
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => downloadReceipt(tx)}>
                                                            <FileText className="mr-2 h-4 w-4" />
                                                            Print Receipt
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => handleOpenEditDialog(tx)}>
                                                            <Pencil className="mr-2 h-4 w-4" />
                                                            Edit Details
                                                        </DropdownMenuItem>
                                                        {tx.proof_url && (
                                                            <DropdownMenuItem onClick={() => window.open(tx.proof_url!, "_blank")}>
                                                                <FileText className="mr-2 h-4 w-4" />
                                                                View Proof
                                                            </DropdownMenuItem>
                                                        )}
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuLabel>Update Status</DropdownMenuLabel>
                                                        <DropdownMenuItem
                                                            onClick={() => handleOpenUpdateDialog(tx, "approved")}
                                                            className="text-green-600"
                                                        >
                                                            <CheckCircle2 className="mr-2 h-4 w-4" />
                                                            Approve
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem
                                                            onClick={() => handleOpenUpdateDialog(tx, "sent")}
                                                            className="text-green-600"
                                                        >
                                                            <Send className="mr-2 h-4 w-4" />
                                                            Mark as Sent
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem
                                                            onClick={() => handleOpenUpdateDialog(tx, "processing")}
                                                            className="text-blue-600"
                                                        >
                                                            <Loader2 className="mr-2 h-4 w-4" />
                                                            Processing
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem
                                                            onClick={() => handleOpenUpdateDialog(tx, "on_hold")}
                                                            className="text-orange-600"
                                                        >
                                                            <AlertTriangle className="mr-2 h-4 w-4" />
                                                            Put On Hold
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem
                                                            onClick={() => {
                                                                setSelectedTransaction(tx);
                                                                setShowDeleteDialog(true);
                                                            }}
                                                            className="text-red-600 focus:text-red-600 focus:bg-red-50"
                                                        >
                                                            <Trash2 className="mr-2 h-4 w-4" />
                                                            Delete Transaction
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    )}

                    {/* Pagination */}
                    {filteredTransactions.length > itemsPerPage && (
                        <div className="flex items-center justify-between border-t px-4 py-4">
                            <p className="text-sm text-muted-foreground">
                                Showing {startIndex + 1} to {Math.min(endIndex, filteredTransactions.length)} of {filteredTransactions.length} transactions
                            </p>
                            <div className="flex items-center gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                                    disabled={currentPage === 1}
                                >
                                    <ChevronLeft className="h-4 w-4" />
                                    Previous
                                </Button>
                                <div className="flex items-center gap-1">
                                    {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                                        let pageNum;
                                        if (totalPages <= 5) {
                                            pageNum = i + 1;
                                        } else if (currentPage <= 3) {
                                            pageNum = i + 1;
                                        } else if (currentPage >= totalPages - 2) {
                                            pageNum = totalPages - 4 + i;
                                        } else {
                                            pageNum = currentPage - 2 + i;
                                        }
                                        return (
                                            <Button
                                                key={pageNum}
                                                variant={currentPage === pageNum ? "default" : "outline"}
                                                size="sm"
                                                className="w-8 h-8 p-0"
                                                onClick={() => setCurrentPage(pageNum)}
                                            >
                                                {pageNum}
                                            </Button>
                                        );
                                    })}
                                </div>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                                    disabled={currentPage === totalPages}
                                >
                                    Next
                                    <ChevronRight className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Transaction Details Dialog */}
            <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Transaction Details</DialogTitle>
                    </DialogHeader>
                    {selectedTransaction && (
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <p className="text-muted-foreground">ID</p>
                                    <p className="font-mono">{selectedTransaction.id.slice(0, 16)}...</p>
                                </div>
                                <div>
                                    <p className="text-muted-foreground">Reference</p>
                                    <p className="font-mono">{selectedTransaction.reference || "-"}</p>
                                </div>
                                <div>
                                    <p className="text-muted-foreground">Type</p>
                                    <p className="font-medium capitalize">{selectedTransaction.type}</p>
                                </div>
                                <div>
                                    <p className="text-muted-foreground">Amount</p>
                                    <p className="font-bold">{formatCurrency(selectedTransaction.amount, selectedTransaction.currency)}</p>
                                </div>
                                <div>
                                    <p className="text-muted-foreground">Status</p>
                                    <Badge variant="secondary" className={getStatusColor(selectedTransaction.status)}>
                                        {selectedTransaction.status.replace("_", " ")}
                                    </Badge>
                                </div>
                                <div>
                                    <p className="text-muted-foreground">Date</p>
                                    <p>{new Date(selectedTransaction.created_at).toLocaleString()}</p>
                                </div>
                            </div>

                            {selectedTransaction.type === "transfer" && (
                                <div className="border-t pt-4 space-y-2">
                                    <p className="font-medium">Transfer Details</p>
                                    <div className="grid grid-cols-2 gap-3 text-sm">
                                        {selectedTransaction.sender_name ? (
                                            <>
                                                <div>
                                                    <p className="text-muted-foreground">Sender</p>
                                                    <p>{selectedTransaction.sender_name || "-"}</p>
                                                </div>
                                                <div>
                                                    <p className="text-muted-foreground">Sender Account</p>
                                                    <p>{selectedTransaction.sender_account || "-"}</p>
                                                </div>
                                                {selectedTransaction.sender_bank && (
                                                    <div className="col-span-2">
                                                        <p className="text-muted-foreground">Sender Bank</p>
                                                        <p>{selectedTransaction.sender_bank || "-"}</p>
                                                    </div>
                                                )}
                                            </>
                                        ) : (
                                            <>
                                                <div>
                                                    <p className="text-muted-foreground">Recipient</p>
                                                    <p>{selectedTransaction.recipient_name || "-"}</p>
                                                </div>
                                                <div>
                                                    <p className="text-muted-foreground">Account</p>
                                                    <p>{selectedTransaction.recipient_account || "-"}</p>
                                                </div>
                                                <div>
                                                    <p className="text-muted-foreground">Bank</p>
                                                    <p>{selectedTransaction.recipient_bank || "-"}</p>
                                                </div>
                                                <div>
                                                    <p className="text-muted-foreground">SWIFT</p>
                                                    <p>{selectedTransaction.swift_code || "-"}</p>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </div>
                            )}

                            {selectedTransaction.description && (
                                <div className="border-t pt-4">
                                    <p className="text-muted-foreground text-sm">Description</p>
                                    <p className="text-sm">{selectedTransaction.description}</p>
                                </div>
                            )}

                            {selectedTransaction.proof_url && (
                                <div className="border-t pt-4 space-y-3">
                                    <p className="font-medium">Proof of Payment</p>
                                    <div className="bg-stone-50 dark:bg-stone-900 rounded-lg p-4">
                                        <img
                                            src={selectedTransaction.proof_url}
                                            alt="Payment proof"
                                            className="w-full h-auto max-h-96 object-contain rounded-lg cursor-pointer hover:opacity-90 transition"
                                            onClick={() => window.open(selectedTransaction.proof_url!, "_blank")}
                                        />
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="mt-3 w-full"
                                            onClick={() => window.open(selectedTransaction.proof_url!, "_blank")}
                                        >
                                            <FileText className="mr-2 h-4 w-4" />
                                            Open in new tab
                                        </Button>
                                    </div>
                                </div>
                            )}

                            {selectedTransaction.admin_note && (
                                <div className="border-t pt-4">
                                    <p className="text-muted-foreground text-sm">Admin Note</p>
                                    <p className="text-sm">{selectedTransaction.admin_note}</p>
                                </div>
                            )}
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* Update Status Dialog */}
            <Dialog open={showUpdateDialog} onOpenChange={setShowUpdateDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Update Transaction Status</DialogTitle>
                        <DialogDescription>
                            Change status to: <span className="font-semibold capitalize">{newStatus.replace("_", " ")}</span>
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        {selectedTransaction && (
                            <div className="rounded-lg bg-muted p-4 space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Amount:</span>
                                    <span className="font-bold">{formatCurrency(selectedTransaction.amount, selectedTransaction.currency)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Type:</span>
                                    <span className="capitalize">{selectedTransaction.type}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Current Status:</span>
                                    <span className="capitalize">{selectedTransaction.status.replace("_", " ")}</span>
                                </div>
                            </div>
                        )}
                        <div className="space-y-2">
                            <Label>Admin Note (optional)</Label>
                            <Textarea
                                value={adminNote}
                                onChange={(e) => setAdminNote(e.target.value)}
                                placeholder="Add a note explaining this status change..."
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowUpdateDialog(false)}>Cancel</Button>
                        <Button onClick={updateTransactionStatus} disabled={updating}>
                            {updating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Update Status
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Edit Transaction Dialog */}
            <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
                <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Edit Transaction Details</DialogTitle>
                        <DialogDescription>
                            Modify transaction data. Changes are audited.
                        </DialogDescription>
                    </DialogHeader>
                    {selectedTransaction && (
                        <div className="space-y-4 py-2">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Amount</Label>
                                    <Input
                                        type="number"
                                        value={editAmount}
                                        onChange={(e) => setEditAmount(e.target.value)}
                                        step="0.01"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Type</Label>
                                    <Select value={editType} onValueChange={setEditType}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="deposit">Deposit</SelectItem>
                                            <SelectItem value="withdrawal">Withdrawal</SelectItem>
                                            <SelectItem value="transfer">Transfer</SelectItem>
                                            <SelectItem value="loan">Loan</SelectItem>
                                            <SelectItem value="investment">Investment</SelectItem>
                                            <SelectItem value="bonus">Bonus</SelectItem>
                                            <SelectItem value="donation">Donation</SelectItem>
                                            <SelectItem value="fee">Financial Fee</SelectItem>
                                            <SelectItem value="charge">Platform Charge</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label>Transaction Date</Label>
                                <Input
                                    type="datetime-local"
                                    value={editDate}
                                    onChange={(e) => setEditDate(e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Description</Label>
                                <Textarea
                                    value={editDescription}
                                    onChange={(e) => setEditDescription(e.target.value)}
                                    placeholder="Transaction description..."
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Recipient Name</Label>
                                    <Input
                                        value={editRecipientName}
                                        onChange={(e) => setEditRecipientName(e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Recipient Account</Label>
                                    <Input
                                        value={editRecipientAccount}
                                        onChange={(e) => setEditRecipientAccount(e.target.value)}
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label>Recipient Bank</Label>
                                <Input
                                    value={editRecipientBank}
                                    onChange={(e) => setEditRecipientBank(e.target.value)}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>SWIFT Code</Label>
                                    <Input
                                        value={editSwiftCode}
                                        onChange={(e) => setEditSwiftCode(e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Routing Number</Label>
                                    <Input
                                        value={editRoutingNumber}
                                        onChange={(e) => setEditRoutingNumber(e.target.value)}
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label>Admin Note (optional)</Label>
                                <Textarea
                                    value={editNote}
                                    onChange={(e) => setEditNote(e.target.value)}
                                    placeholder="Reason for editing..."
                                />
                            </div>
                        </div>
                    )}
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowEditDialog(false)}>Cancel</Button>
                        <Button onClick={handleSaveEdit} disabled={updating}>
                            {updating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Save Changes
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="text-red-600 flex items-center gap-2">
                            <AlertTriangle className="h-5 w-5" />
                            Delete Transaction Record
                        </DialogTitle>
                        <DialogDescription>
                            Are you sure you want to permanently delete this transaction record? This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    {selectedTransaction && (
                        <div className="rounded-lg bg-red-50 dark:bg-red-950/20 p-4 space-y-2 text-sm border border-red-100 dark:border-red-900/50">
                            <div className="flex justify-between">
                                <span className="text-red-700 dark:text-red-400">Reference:</span>
                                <span className="font-mono font-bold text-red-900 dark:text-red-200">{selectedTransaction.reference || selectedTransaction.id}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-red-700 dark:text-red-400">Amount:</span>
                                <span className="font-bold text-red-900 dark:text-red-200">{formatCurrency(selectedTransaction.amount, selectedTransaction.currency)}</span>
                            </div>
                            <p className="text-xs text-red-600/80 mt-2 italic">
                                Note: Deleting the record will NOT revert any wallet balance changes.
                            </p>
                        </div>
                    )}
                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button variant="outline" onClick={() => setShowDeleteDialog(false)} disabled={deleting}>
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={deleteTransaction}
                            disabled={deleting}
                        >
                            {deleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Permanently Delete
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
