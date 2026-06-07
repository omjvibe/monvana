"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
    Search,
    MoreHorizontal,
    Shield,
    Ban,
    DollarSign,
    Eye,
    Loader2,
    MessageCircle,
    Wallet,
    Plus,
    Edit,
    Key,
    FileCode,
    Trash2,
    Bitcoin,
    Copy,
    Check,
    CheckCircle2,
    ShieldCheck,
    XCircle,
    RefreshCw,
    Lock,
    FileText,
    ChevronLeft,
    ChevronRight,
} from "lucide-react";
import Link from "next/link";
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
import { Switch } from "@/components/ui/switch";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";

interface BillingCode {
    id: string;
    code_type: string;
    code: string;
    amount: number;
    is_paid: boolean;
    is_active: boolean;
}

interface Wallet {
    id: string;
    currency: string;
    balance: number;
    account_number?: string;
    account_name?: string;
    account_type?: string;
    is_primary?: boolean;
    deposit_address?: string;
}

interface User {
    id: string;
    clerk_id: string;
    first_name: string;
    last_name: string;
    email: string;
    country: string;
    status: string;
    account_type?: string;
    daily_limit?: number;
    monthly_limit?: number;
    created_at: string;
    totalBalance?: number;
    kyc_status?: string;
    wallets?: Wallet[];
    billing_codes?: BillingCode[];
}

const BILLING_CODE_TYPES = [
    { value: "imf", label: "IMF Code", description: "International Monetary Fund clearance" },
    { value: "vat", label: "VAT Code", description: "Value Added Tax verification" },
    { value: "lbt", label: "LBT Code", description: "Local Bank Transfer code" },
    { value: "upgrade_fee", label: "Upgrade Fee", description: "Account upgrade fee" },
    { value: "withdrawal_fee", label: "Withdrawal Fee", description: "Withdrawal processing fee" },
];

export default function AdminUsersPage() {
    const [loading, setLoading] = useState(true);
    const [users, setUsers] = useState<User[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [page, setPage] = useState(1);
    const ITEMS_PER_PAGE = 15;
    const [updating, setUpdating] = useState(false);
    const [copied, setCopied] = useState(false);

    // Dialog states
    const [showUserDialog, setShowUserDialog] = useState(false);
    const [showEditDialog, setShowEditDialog] = useState(false);
    const [showBalanceDialog, setShowBalanceDialog] = useState(false);
    const [showAddWalletDialog, setShowAddWalletDialog] = useState(false);
    const [showBillingDialog, setShowBillingDialog] = useState(false);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [showDepositMethodsDialog, setShowDepositMethodsDialog] = useState(false);
    const [showPinDialog, setShowPinDialog] = useState(false);
    const [pendingAction, setPendingAction] = useState<(() => Promise<void>) | null>(null);
    const [adminPin, setAdminPin] = useState("");

    // User's existing deposit methods
    const [userDepositMethods, setUserDepositMethods] = useState<Array<{
        id: string;
        method_type: string;
        title: string;
        description: string;
        wallet_address: string | null;
        bank_name: string | null;
        account_number: string | null;
        account_name: string | null;
        routing_number: string | null;
        is_active: boolean;
        is_universal: boolean;
        logo_url: string | null;
        is_transfer_option: boolean;
    }>>([]);

    const [editingMethodId, setEditingMethodId] = useState<string | null>(null);

    // PIN reset
    const [showPinResetDialog, setShowPinResetDialog] = useState(false);
    const [newUserPin, setNewUserPin] = useState("");

    // Form states
    const [editForm, setEditForm] = useState({
        firstName: "",
        lastName: "",
        email: "",
        country: "",
        accountType: "standard",
        dailyLimit: "10000",
        monthlyLimit: "100000",
    });
    const [selectedWallet, setSelectedWallet] = useState<string>("");
    const [newBalance, setNewBalance] = useState("");
    const [depositAmount, setDepositAmount] = useState("");
    const [senderName, setSenderName] = useState("");
    const [senderAccount, setSenderAccount] = useState("");
    const [senderBank, setSenderBank] = useState("");
    const [depositDate, setDepositDate] = useState(new Date().toISOString().slice(0, 16));
    const [depositReference, setDepositReference] = useState("");
    const [balanceReason, setBalanceReason] = useState("");
    const [txType, setTxType] = useState<"credit" | "debit" | "charge">("credit");
    const [txSubtype, setTxSubtype] = useState("Deposit");
    const [newWalletCurrency, setNewWalletCurrency] = useState("BTC");
    const [newWalletBalance, setNewWalletBalance] = useState("0");
    const [newDepositAddress, setNewDepositAddress] = useState("");
    const [billingCodes, setBillingCodes] = useState<Record<string, { code: string; amount: string; isActive: boolean }>>({});

    // Deposit method form
    const [depositMethodForm, setDepositMethodForm] = useState({
        method_type: "crypto",
        title: "",
        description: "",
        wallet_address: "",
        bank_name: "",
        account_number: "",
        account_name: "",
        routing_number: "",
        swift_code: "",
        additional_info: "",
        is_universal: false,
        logo_url: "",
        is_transfer_option: false,
    });


    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const response = await fetch("/api/admin/users", { cache: 'no-store' });
            if (response.ok) {
                const data = await response.json();
                setUsers(data.users || []);
            } else {
                toast.error("Failed to load users");
            }
        } catch (error) {
            console.error("Error fetching users:", error);
            toast.error("Failed to load users");
        } finally {
            setLoading(false);
        }
    };

    const handleApiAction = async (action: string, data: Record<string, unknown>) => {
        setUpdating(true);
        try {
            const response = await fetch("/api/admin/users", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action, ...data }),
            });

            const result = await response.json();

            if (response.ok) {
                toast.success(result.message || "Action completed");
                fetchUsers();
                return true;
            } else {
                toast.error(result.error || "Action failed");
                return false;
            }
        } catch (error) {
            console.error("Error:", error);
            toast.error("Action failed");
            return false;
        } finally {
            setUpdating(false);
        }
    };

    // PIN verification for sensitive actions
    const verifyPin = async (pin: string): Promise<boolean> => {
        try {
            const response = await fetch("/api/admin/verify-pin", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ pin }),
            });
            const result = await response.json();
            return result.valid === true;
        } catch {
            return false;
        }
    };

    const requirePin = (action: () => Promise<void>) => {
        setPendingAction(() => action);
        setAdminPin("");
        setShowPinDialog(true);
    };

    const executePendingAction = async () => {
        if (!adminPin) {
            toast.error("Please enter PIN");
            return;
        }

        setUpdating(true);
        const valid = await verifyPin(adminPin);

        if (!valid) {
            toast.error("Invalid PIN");
            setUpdating(false);
            return;
        }

        setShowPinDialog(false);
        setAdminPin("");

        if (pendingAction) {
            await pendingAction();
        }

        setPendingAction(null);
        setUpdating(false);
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: "USD",
            minimumFractionDigits: 2,
        }).format(amount);
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case "active":
                return "bg-green-500/10 text-green-600 dark:text-green-400";
            case "suspended":
                return "bg-red-500/10 text-red-600 dark:text-red-400";
            case "pending":
                return "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400";
            default:
                return "bg-muted text-muted-foreground";
        }
    };

    const filteredUsers = users.filter((user) => {
        const fullName = `${user.first_name} ${user.last_name}`.toLowerCase();
        const matchesSearch =
            fullName.includes(searchQuery.toLowerCase()) ||
            user.email?.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = statusFilter === "all" || user.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    // Pagination
    const totalPages = Math.ceil(filteredUsers.length / ITEMS_PER_PAGE);
    const paginatedUsers = filteredUsers.slice(
        (page - 1) * ITEMS_PER_PAGE,
        page * ITEMS_PER_PAGE
    );

    // Reset page when filters change
    useEffect(() => {
        setPage(1);
    }, [searchQuery, statusFilter]);

    // View user details
    const handleViewUser = (user: User) => {
        setSelectedUser(user);
        setShowUserDialog(true);
    };

    // Edit user profile
    const handleEditUser = (user: User) => {
        setSelectedUser(user);
        setEditForm({
            firstName: user.first_name || "",
            lastName: user.last_name || "",
            email: user.email || "",
            country: user.country || "",
            accountType: user.account_type || "standard",
            dailyLimit: (user.daily_limit || 10000).toString(),
            monthlyLimit: (user.monthly_limit || 100000).toString(),
        });
        setShowEditDialog(true);
    };

    const confirmEditUser = async () => {
        if (!selectedUser) return;
        const success = await handleApiAction("updateProfile", {
            targetUserId: selectedUser.id,
            firstName: editForm.firstName,
            lastName: editForm.lastName,
            email: editForm.email,
            country: editForm.country,
            accountType: editForm.accountType,
            dailyLimit: parseFloat(editForm.dailyLimit),
            monthlyLimit: parseFloat(editForm.monthlyLimit),
        });
        if (success) {
            setShowEditDialog(false);
            setSelectedUser(null);
        }
    };

    // Admin Deposit
    const handleAdminDeposit = (user: User) => {
        setSelectedUser(user);
        if (user.wallets && user.wallets.length > 0) {
            setSelectedWallet(user.wallets[0].id);
        }
        setTxType("credit");
        setTxSubtype("Deposit");
        setDepositAmount("");
        setSenderName("");
        setSenderAccount("");
        setSenderBank("");
        setDepositDate(new Date().toISOString().slice(0, 16));
        setDepositReference(""); // Will be auto-generated if empty
        setBalanceReason("");
        setShowBalanceDialog(true);
    };

    const confirmAdminDeposit = async () => {
        if (!selectedUser || !selectedWallet || !depositAmount) return;
        const success = await handleApiAction("adminDeposit", {
            targetUserId: selectedUser.id,
            walletId: selectedWallet,
            amount: parseFloat(depositAmount),
            txType,
            txSubtype,
            senderName,
            senderAccount,
            senderBank,
            date: depositDate,
            reference: depositReference,
            reason: balanceReason,
        });
        if (success) {
            setShowBalanceDialog(false);
            setSelectedUser(null);
        }
    };

    // Add wallet
    const handleAddWallet = (user: User) => {
        setSelectedUser(user);
        setNewWalletCurrency("BTC");
        setNewWalletBalance("0");
        setNewDepositAddress("");
        setShowAddWalletDialog(true);
    };

    const confirmAddWallet = async () => {
        if (!selectedUser) return;
        const success = await handleApiAction("createWallet", {
            targetUserId: selectedUser.id,
            currency: newWalletCurrency,
            initialBalance: parseFloat(newWalletBalance) || 0,
            depositAddress: newDepositAddress || null,
        });
        if (success) {
            setShowAddWalletDialog(false);
            setSelectedUser(null);
        }
    };

    // Toggle status
    const handleToggleStatus = async (user: User) => {
        const newStatus = user.status === "suspended" ? "active" : "suspended";
        await handleApiAction("updateStatus", {
            targetUserId: user.id,
            status: newStatus,
        });
    };

    // Billing codes
    const handleManageBilling = (user: User) => {
        setSelectedUser(user);
        // Initialize billing codes form
        const codes: Record<string, { code: string; amount: string; isActive: boolean }> = {};
        BILLING_CODE_TYPES.forEach(type => {
            const existing = user.billing_codes?.find(c => c.code_type === type.value);
            codes[type.value] = {
                code: existing?.code || "",
                amount: existing?.amount?.toString() || "0",
                isActive: existing?.is_active ?? false,
            };
        });
        setBillingCodes(codes);
        setShowBillingDialog(true);
    };

    const saveBillingCode = async (codeType: string) => {
        if (!selectedUser) return;
        const codeData = billingCodes[codeType];
        await handleApiAction("manageBillingCode", {
            targetUserId: selectedUser.id,
            codeType,
            code: codeData.code,
            amount: parseFloat(codeData.amount) || 0,
            isActive: codeData.isActive,
        });
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
        toast.success("Copied to clipboard");
    };

    // Update deposit address for wallet
    const updateDepositAddress = async (walletId: string, address: string) => {
        if (!selectedUser) return;
        await handleApiAction("updateDepositAddress", {
            targetUserId: selectedUser.id,
            walletId,
            depositAddress: address,
        });
    };

    // Manage deposit methods
    const handleManageDepositMethods = async (user: User) => {
        setSelectedUser(user);
        setEditingMethodId(null);
        setDepositMethodForm({
            method_type: "crypto",
            title: "",
            description: "",
            wallet_address: "",
            bank_name: "",
            account_number: "",
            account_name: "",
            routing_number: "",
            swift_code: "",
            additional_info: "",
            is_universal: false,
            logo_url: "",
            is_transfer_option: false,
        });

        // Fetch existing deposit methods
        try {
            const response = await fetch(`/api/admin/deposit-methods?userId=${user.id}`);
            if (response.ok) {
                const data = await response.json();
                setUserDepositMethods(data.depositMethods || []);
            }
        } catch (error) {
            console.error("Error fetching deposit methods:", error);
        }

        setShowDepositMethodsDialog(true);
    };

    const handleEditDepositMethod = (method: any) => {
        setEditingMethodId(method.id);
        setDepositMethodForm({
            method_type: method.method_type || "crypto",
            title: method.title || "",
            description: method.description || "",
            wallet_address: method.wallet_address || "",
            bank_name: method.bank_name || "",
            account_number: method.account_number || "",
            account_name: method.account_name || "",
            routing_number: method.routing_number || "",
            swift_code: method.swift_code || "",
            additional_info: method.additional_info || "",
            is_universal: method.is_universal || false,
            logo_url: method.logo_url || "",
            is_transfer_option: method.is_transfer_option || false,
        });
    };

    const saveDepositMethod = async () => {
        if (!selectedUser) return;
        if (!depositMethodForm.title) {
            toast.error("Title is required");
            return;
        }

        setUpdating(true);
        try {
            const methodId = editingMethodId;
            const response = await fetch("/api/admin/deposit-methods", {
                method: methodId ? "PATCH" : "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    depositMethodId: methodId,
                    userId: selectedUser.id,
                    ...depositMethodForm,
                }),
            });

            if (response.ok) {
                toast.success(editingMethodId ? "Deposit method updated" : "Deposit method added");
                setEditingMethodId(null);
                setDepositMethodForm({
                    method_type: "crypto",
                    title: "",
                    description: "",
                    wallet_address: "",
                    bank_name: "",
                    account_number: "",
                    account_name: "",
                    routing_number: "",
                    swift_code: "",
                    additional_info: "",
                    is_universal: false,
                    logo_url: "",
                    is_transfer_option: false,
                });

                // Refresh the list
                const refreshResponse = await fetch(`/api/admin/deposit-methods?userId=${selectedUser.id}`);
                if (refreshResponse.ok) {
                    const data = await refreshResponse.json();
                    setUserDepositMethods(data.depositMethods || []);
                }
            } else {
                const error = await response.json();
                toast.error(error.error || "Failed to add deposit method");
            }
        } catch (error) {
            toast.error("Failed to add deposit method");
        } finally {
            setUpdating(false);
        }
    };

    const deleteDepositMethod = async (methodId: string) => {
        if (!selectedUser) return;

        setUpdating(true);
        try {
            const response = await fetch(`/api/admin/deposit-methods?id=${methodId}`, {
                method: "DELETE",
            });

            if (response.ok) {
                toast.success("Deposit method deleted");
                setUserDepositMethods(prev => prev.filter(m => m.id !== methodId));
            } else {
                const error = await response.json();
                toast.error(error.error || "Failed to delete deposit method");
            }
        } catch (error) {
            toast.error("Failed to delete deposit method");
        } finally {
            setUpdating(false);
        }
    };

    // Delete user
    const handleDeleteUser = (user: User) => {
        setSelectedUser(user);
        setShowDeleteDialog(true);
    };

    const confirmDeleteUser = async () => {
        if (!selectedUser) return;

        // Require PIN for delete action
        requirePin(async () => {
            try {
                const response = await fetch("/api/admin/users", {
                    method: "DELETE",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ targetUserId: selectedUser.id }),
                });

                const result = await response.json();
                console.log("Delete API result:", result);

                if (response.ok) {
                    toast.success(result.message || "User deleted successfully");
                    setShowDeleteDialog(false);
                    setSelectedUser(null);
                    fetchUsers();
                } else {
                    toast.error(result.error || "Failed to delete user");
                }
            } catch (error) {
                toast.error("Failed to delete user");
            }
        });
    };

    // Reset user transaction PIN
    const handleResetPin = (user: User) => {
        setSelectedUser(user);
        setNewUserPin("");
        setShowPinResetDialog(true);
    };

    const confirmResetPin = async () => {
        if (!selectedUser) return;
        if (newUserPin.length !== 4 || !/^\d{4}$/.test(newUserPin)) {
            toast.error("PIN must be exactly 4 digits");
            return;
        }

        requirePin(async () => {
            try {
                const response = await fetch("/api/admin/users", {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        action: "updatePin",
                        targetUserId: selectedUser.id,
                        newPin: newUserPin,
                    }),
                });

                if (response.ok) {
                    toast.success("User PIN reset successfully");
                    setShowPinResetDialog(false);
                    setSelectedUser(null);
                    setNewUserPin("");
                } else {
                    const error = await response.json();
                    toast.error(error.error || "Failed to reset PIN");
                }
            } catch (error) {
                toast.error("Failed to reset PIN");
            }
        });
    };


    const stats = {
        total: users.length,
        active: users.filter((u) => u.status === "active").length,
        suspended: users.filter((u) => u.status === "suspended").length,
        totalBalance: users.reduce((sum, u) => sum + (u.totalBalance || 0), 0),
    };

    if (loading) {
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
                        User Management
                    </h1>
                    <p className="text-muted-foreground">
                        Manage users, wallets, balances, and billing codes.
                    </p>
                </div>
                <Button variant="outline" onClick={fetchUsers}>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Refresh
                </Button>
            </motion.div>

            {/* Stats */}
            <div className="grid gap-4 md:grid-cols-4">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.total}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Active Users</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">{stats.active}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Suspended</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-red-600">{stats.suspended}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Total Balance</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatCurrency(stats.totalBalance)}</div>
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
                                placeholder="Search users..."
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
                                <SelectItem value="active">Active</SelectItem>
                                <SelectItem value="suspended">Suspended</SelectItem>
                                <SelectItem value="pending">Pending</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>

            {/* Users Table */}
            <Card>
                <CardContent className="p-0">
                    {filteredUsers.length === 0 ? (
                        <div className="py-12 text-center text-muted-foreground">
                            No users found
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>User</TableHead>
                                    <TableHead className="hidden lg:table-cell">Country</TableHead>
                                    <TableHead>Balance</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>KYC</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {paginatedUsers.map((user) => (
                                    <TableRow key={user.id}>
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <Avatar className="h-8 w-8">
                                                    <AvatarFallback>
                                                        {user.first_name?.[0]}{user.last_name?.[0]}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div>
                                                    <p className="font-medium">{user.first_name} {user.last_name}</p>
                                                    <p className="text-sm text-muted-foreground">{user.email}</p>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell className="hidden lg:table-cell">{user.country || "-"}</TableCell>
                                        <TableCell className="font-medium">{formatCurrency(user.totalBalance || 0)}</TableCell>
                                        <TableCell>
                                            <Badge variant="secondary" className={getStatusColor(user.status)}>
                                                {user.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <Badge
                                                variant="outline"
                                                className={
                                                    user.kyc_status === "approved" ? "bg-green-500/10 text-green-600 border-green-200" :
                                                        user.kyc_status === "pending" ? "bg-yellow-500/10 text-yellow-600 border-yellow-200" :
                                                            user.kyc_status === "rejected" ? "bg-red-500/10 text-red-600 border-red-200" :
                                                                "bg-slate-500/10 text-slate-600 border-slate-200"
                                                }
                                            >
                                                {user.kyc_status || "unverified"}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon">
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="w-56">
                                                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem onClick={() => handleViewUser(user)}>
                                                        <Eye className="mr-2 h-4 w-4" />
                                                        View Details
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => handleEditUser(user)}>
                                                        <Edit className="mr-2 h-4 w-4" />
                                                        Edit Profile
                                                    </DropdownMenuItem>
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem onClick={() => handleAdminDeposit(user)}>
                                                        <DollarSign className="mr-2 h-4 w-4" />
                                                        Admin Deposit
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => handleAddWallet(user)}>
                                                        <Wallet className="mr-2 h-4 w-4" />
                                                        Add Wallet
                                                    </DropdownMenuItem>
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem onClick={() => handleManageBilling(user)}>
                                                        <FileCode className="mr-2 h-4 w-4" />
                                                        Billing Codes
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => handleManageDepositMethods(user)}>
                                                        <Plus className="mr-2 h-4 w-4" />
                                                        Deposit Methods
                                                    </DropdownMenuItem>
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuLabel className="text-[10px] uppercase text-muted-foreground font-black px-2 py-1">Identity Verification</DropdownMenuLabel>
                                                    <DropdownMenuItem
                                                        onClick={() => handleApiAction("updateKycStatus", { targetUserId: user.id, kycStatus: "approved" })}
                                                        disabled={user.kyc_status === "approved"}
                                                    >
                                                        <CheckCircle2 className="mr-2 h-4 w-4 text-green-600" />
                                                        Approve KYC
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem
                                                        onClick={() => handleApiAction("updateKycStatus", { targetUserId: user.id, kycStatus: "unverified" })}
                                                    >
                                                        <ShieldCheck className="mr-2 h-4 w-4 text-blue-600" />
                                                        Mandate KYC
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem
                                                        onClick={() => handleApiAction("updateKycStatus", { targetUserId: user.id, kycStatus: "rejected" })}
                                                        disabled={user.kyc_status === "rejected"}
                                                        className="text-red-600"
                                                    >
                                                        <XCircle className="mr-2 h-4 w-4" />
                                                        Reject KYC
                                                    </DropdownMenuItem>
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem
                                                        onClick={() => handleToggleStatus(user)}
                                                        className={user.status === "suspended" ? "text-green-600" : "text-orange-600"}
                                                    >
                                                        {user.status === "suspended" ? (
                                                            <>
                                                                <Shield className="mr-2 h-4 w-4" />
                                                                Activate
                                                            </>
                                                        ) : (
                                                            <>
                                                                <Ban className="mr-2 h-4 w-4" />
                                                                Suspend
                                                            </>
                                                        )}
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem
                                                        onClick={() => handleDeleteUser(user)}
                                                        className="text-red-600"
                                                    >
                                                        <Trash2 className="mr-2 h-4 w-4" />
                                                        Delete User
                                                    </DropdownMenuItem>
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

            {/* Pagination Controls */}
            {totalPages > 1 && (
                <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">
                        Showing {((page - 1) * ITEMS_PER_PAGE) + 1} to {Math.min(page * ITEMS_PER_PAGE, filteredUsers.length)} of {filteredUsers.length} users
                    </p>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            disabled={page === 1}
                        >
                            <ChevronLeft className="h-4 w-4" />
                            Previous
                        </Button>
                        <span className="text-sm font-medium">
                            Page {page} of {totalPages}
                        </span>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                            disabled={page === totalPages}
                        >
                            Next
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            )}

            {/* View User Dialog */}
            <Dialog open={showUserDialog} onOpenChange={setShowUserDialog}>
                <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>User Details</DialogTitle>
                    </DialogHeader>
                    {selectedUser && (
                        <Tabs defaultValue="overview" className="mt-4">
                            <TabsList className="grid w-full grid-cols-4">
                                <TabsTrigger value="overview">Overview</TabsTrigger>
                                <TabsTrigger value="wallets">Wallets</TabsTrigger>
                                <TabsTrigger value="billing">Billing</TabsTrigger>
                                <TabsTrigger value="actions">Actions</TabsTrigger>
                            </TabsList>

                            <TabsContent value="overview" className="space-y-4 mt-4">
                                <div className="flex items-center gap-4">
                                    <Avatar className="h-16 w-16">
                                        <AvatarFallback className="text-lg">
                                            {selectedUser.first_name?.[0]}{selectedUser.last_name?.[0]}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <h3 className="text-lg font-semibold">{selectedUser.first_name} {selectedUser.last_name}</h3>
                                        <p className="text-muted-foreground">{selectedUser.email}</p>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <p className="text-muted-foreground">Country</p>
                                        <p className="font-medium">{selectedUser.country || "-"}</p>
                                    </div>
                                    <div>
                                        <p className="text-muted-foreground">Status</p>
                                        <Badge variant="secondary" className={getStatusColor(selectedUser.status)}>
                                            {selectedUser.status}
                                        </Badge>
                                    </div>
                                    <div>
                                        <p className="text-muted-foreground">Account Type</p>
                                        <p className="font-medium capitalize">{selectedUser.account_type || "Standard"}</p>
                                    </div>
                                    <div>
                                        <p className="text-muted-foreground">Total Balance</p>
                                        <p className="font-medium">{formatCurrency(selectedUser.totalBalance || 0)}</p>
                                    </div>
                                    <div>
                                        <p className="text-muted-foreground">Daily Limit</p>
                                        <p className="font-medium">{formatCurrency(selectedUser.daily_limit || 10000)}</p>
                                    </div>
                                    <div>
                                        <p className="text-muted-foreground">Monthly Limit</p>
                                        <p className="font-medium">{formatCurrency(selectedUser.monthly_limit || 100000)}</p>
                                    </div>
                                    <div>
                                        <p className="text-muted-foreground">Joined</p>
                                        <p className="font-medium">{new Date(selectedUser.created_at).toLocaleDateString()}</p>
                                    </div>
                                </div>
                            </TabsContent>

                            <TabsContent value="wallets" className="space-y-4 mt-4">
                                {selectedUser.wallets && selectedUser.wallets.length > 0 ? (
                                    <div className="space-y-3">
                                        {selectedUser.wallets.map((wallet) => (
                                            <div key={wallet.id} className="p-4 border rounded-lg space-y-3">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-2">
                                                        <Bitcoin className="h-5 w-5" />
                                                        <span className="font-semibold">{wallet.currency}</span>
                                                        {wallet.is_primary && (
                                                            <Badge variant="outline" className="text-xs">Primary</Badge>
                                                        )}
                                                    </div>
                                                    <span className="font-bold">
                                                        {wallet.currency === "USD" ? formatCurrency(wallet.balance) : wallet.balance}
                                                    </span>
                                                </div>
                                                {wallet.account_number && (
                                                    <div className="text-sm text-muted-foreground">
                                                        Account: {wallet.account_number}
                                                    </div>
                                                )}
                                                {["BTC", "ETH", "USDT", "USDC"].includes(wallet.currency) && (
                                                    <div className="space-y-2">
                                                        <Label className="text-xs">Deposit Address</Label>
                                                        <div className="flex gap-2">
                                                            <Input
                                                                value={wallet.deposit_address || ""}
                                                                placeholder="Enter deposit address..."
                                                                className="text-xs"
                                                                onChange={(e) => {
                                                                    const newWallets = selectedUser.wallets?.map(w =>
                                                                        w.id === wallet.id ? { ...w, deposit_address: e.target.value } : w
                                                                    );
                                                                    setSelectedUser({ ...selectedUser, wallets: newWallets });
                                                                }}
                                                            />
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                onClick={() => updateDepositAddress(wallet.id, wallet.deposit_address || "")}
                                                            >
                                                                Save
                                                            </Button>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-center text-muted-foreground py-8">No wallets found</p>
                                )}
                            </TabsContent>

                            <TabsContent value="billing" className="space-y-4 mt-4">
                                {selectedUser.billing_codes && selectedUser.billing_codes.length > 0 ? (
                                    <div className="space-y-3">
                                        {selectedUser.billing_codes.map((code) => (
                                            <div key={code.id} className="flex items-center justify-between p-3 border rounded-lg">
                                                <div>
                                                    <p className="font-medium uppercase">{code.code_type.replace("_", " ")}</p>
                                                    <p className="text-sm text-muted-foreground font-mono">{code.code}</p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="font-bold">{formatCurrency(code.amount)}</p>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <Badge variant={code.is_paid ? "default" : "secondary"}>
                                                            {code.is_paid ? "Paid" : "Unpaid"}
                                                        </Badge>
                                                        <Badge variant={code.is_active ? "default" : "outline"}>
                                                            {code.is_active ? "Active" : "Inactive"}
                                                        </Badge>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-center text-muted-foreground py-8">No billing codes configured</p>
                                )}
                            </TabsContent>

                            <TabsContent value="actions" className="space-y-4 mt-4">
                                <div className="grid gap-3">
                                    <Button
                                        variant="outline"
                                        className="justify-start"
                                        onClick={() => {
                                            setShowUserDialog(false);
                                            handleResetPin(selectedUser);
                                        }}
                                    >
                                        <Lock className="mr-2 h-4 w-4" />
                                        Reset Transaction PIN
                                    </Button>
                                    <Button
                                        variant="outline"
                                        className="justify-start"
                                        onClick={() => {
                                            setShowUserDialog(false);
                                            handleManageDepositMethods(selectedUser);
                                        }}
                                    >
                                        <Plus className="mr-2 h-4 w-4" />
                                        Manage Deposit Methods
                                    </Button>
                                    <Button
                                        variant="outline"
                                        className="justify-start"
                                        onClick={() => {
                                            setShowUserDialog(false);
                                            handleEditUser(selectedUser);
                                        }}
                                    >
                                        <Edit className="mr-2 h-4 w-4" />
                                        Edit User Details
                                    </Button>
                                    <Button
                                        variant="outline"
                                        className="justify-start"
                                        onClick={() => {
                                            setShowUserDialog(false);
                                            handleAdminDeposit(selectedUser);
                                        }}
                                    >
                                        <DollarSign className="mr-2 h-4 w-4" />
                                        Admin Deposit
                                    </Button>
                                    <Button
                                        variant="outline"
                                        className="justify-start"
                                        onClick={() => {
                                            setShowUserDialog(false);
                                            handleManageBilling(selectedUser);
                                        }}
                                    >
                                        <FileText className="mr-2 h-4 w-4" />
                                        Add Billing Code
                                    </Button>
                                    <Separator />
                                    <Button
                                        variant="destructive"
                                        className="justify-start"
                                        onClick={() => {
                                            setShowUserDialog(false);
                                            handleDeleteUser(selectedUser);
                                        }}
                                    >
                                        <Trash2 className="mr-2 h-4 w-4" />
                                        Delete User
                                    </Button>
                                </div>
                            </TabsContent>
                        </Tabs>
                    )}
                </DialogContent>
            </Dialog>

            {/* Edit User Dialog */}
            <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit User Profile</DialogTitle>
                        <DialogDescription>
                            Update profile for {selectedUser?.first_name} {selectedUser?.last_name}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>First Name</Label>
                                <Input
                                    value={editForm.firstName}
                                    onChange={(e) => setEditForm({ ...editForm, firstName: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Last Name</Label>
                                <Input
                                    value={editForm.lastName}
                                    onChange={(e) => setEditForm({ ...editForm, lastName: e.target.value })}
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>Email</Label>
                            <Input
                                value={editForm.email}
                                onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Country</Label>
                            <Input
                                value={editForm.country}
                                onChange={(e) => setEditForm({ ...editForm, country: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Account Type</Label>
                            <Select
                                value={editForm.accountType}
                                onValueChange={(val) => setEditForm({ ...editForm, accountType: val })}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="standard">Standard</SelectItem>
                                    <SelectItem value="premium">Premium</SelectItem>
                                    <SelectItem value="business">Business</SelectItem>
                                    <SelectItem value="vip">VIP</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Daily Limit ($)</Label>
                                <Input
                                    type="number"
                                    value={editForm.dailyLimit}
                                    onChange={(e) => setEditForm({ ...editForm, dailyLimit: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Monthly Limit ($)</Label>
                                <Input
                                    type="number"
                                    value={editForm.monthlyLimit}
                                    onChange={(e) => setEditForm({ ...editForm, monthlyLimit: e.target.value })}
                                />
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowEditDialog(false)}>Cancel</Button>
                        <Button onClick={confirmEditUser} disabled={updating}>
                            {updating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Save Changes
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Admin Manual Transaction Dialog */}
            <Dialog open={showBalanceDialog} onOpenChange={setShowBalanceDialog}>
                <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Manual Transaction</DialogTitle>
                        <DialogDescription>
                            Record a manual {txType} for {selectedUser?.first_name} {selectedUser?.last_name}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Transaction Group</Label>
                                <Select value={txType} onValueChange={(val: any) => setTxType(val)}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="credit">Credit (+)</SelectItem>
                                        <SelectItem value="debit">Debit (-)</SelectItem>
                                        <SelectItem value="charge">Charge (-)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Transaction Type</Label>
                                <Select value={txSubtype} onValueChange={setTxSubtype}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {txType === "credit" && (
                                            <>
                                                <SelectItem value="Deposit">Deposit</SelectItem>
                                                <SelectItem value="Incoming Transfer">Incoming Transfer</SelectItem>
                                                <SelectItem value="Bonus Credit">Bonus Credit</SelectItem>
                                            </>
                                        )}
                                        {txType === "debit" && (
                                            <>
                                                <SelectItem value="Withdrawal">Withdrawal</SelectItem>
                                                <SelectItem value="Manual Debit">Manual Debit</SelectItem>
                                            </>
                                        )}
                                        {txType === "charge" && (
                                            <>
                                                <SelectItem value="System Maintenance Fee">Maintenance Fee</SelectItem>
                                                <SelectItem value="Service Charge">Service Charge</SelectItem>
                                                <SelectItem value="Verification Fee">Verification Fee</SelectItem>
                                            </>
                                        )}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {selectedUser?.wallets && selectedUser.wallets.length > 0 && (
                            <div className="space-y-2">
                                <Label>Select Wallet</Label>
                                <Select
                                    value={selectedWallet}
                                    onValueChange={(val) => setSelectedWallet(val)}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {selectedUser.wallets.map((wallet) => (
                                            <SelectItem key={wallet.id} value={wallet.id}>
                                                {wallet.currency} - Current: {wallet.currency === "USD" ? formatCurrency(wallet.balance) : wallet.balance}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}

                        <div className="space-y-2">
                            <Label>Amount</Label>
                            <Input
                                type="number"
                                step="0.01"
                                value={depositAmount}
                                onChange={(e) => setDepositAmount(e.target.value)}
                                placeholder="0.00"
                            />
                        </div>

                        {txType === "credit" && (
                            <>
                                <Separator />
                                <div className="space-y-4">
                                    <h4 className="font-medium text-sm">Depositor Information</h4>
                                    <div className="space-y-2">
                                        <Label>Sender Name</Label>
                                        <Input
                                            value={senderName}
                                            onChange={(e) => setSenderName(e.target.value)}
                                            placeholder="Full name of depositor"
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label>Sender Account</Label>
                                            <Input
                                                value={senderAccount}
                                                onChange={(e) => setSenderAccount(e.target.value)}
                                                placeholder="Account number"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Sender Bank</Label>
                                            <Input
                                                value={senderBank}
                                                onChange={(e) => setSenderBank(e.target.value)}
                                                placeholder="Bank name"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </>
                        )}

                        <Separator />
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Reference Number (Optional)</Label>
                                <Input
                                    value={depositReference}
                                    onChange={(e) => setDepositReference(e.target.value)}
                                    placeholder="Auto-generated if empty"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Transaction Date</Label>
                                <Input
                                    type="datetime-local"
                                    value={depositDate}
                                    onChange={(e) => setDepositDate(e.target.value)}
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>Description / Note</Label>
                            <Input
                                value={balanceReason}
                                onChange={(e) => setBalanceReason(e.target.value)}
                                placeholder={`Reason for this ${txType}`}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowBalanceDialog(false)}>Cancel</Button>
                        <Button onClick={confirmAdminDeposit} disabled={updating}>
                            {updating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Process {txType.charAt(0).toUpperCase() + txType.slice(1)}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Add Wallet Dialog */}
            <Dialog open={showAddWalletDialog} onOpenChange={setShowAddWalletDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Add New Wallet</DialogTitle>
                        <DialogDescription>
                            Create a new wallet for {selectedUser?.first_name} {selectedUser?.last_name}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Currency</Label>
                            <Select value={newWalletCurrency} onValueChange={setNewWalletCurrency}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="USD">USD (US Dollar)</SelectItem>
                                    <SelectItem value="EUR">EUR (Euro)</SelectItem>
                                    <SelectItem value="GBP">GBP (British Pound)</SelectItem>
                                    <SelectItem value="BTC">BTC (Bitcoin)</SelectItem>
                                    <SelectItem value="ETH">ETH (Ethereum)</SelectItem>
                                    <SelectItem value="USDT">USDT (Tether)</SelectItem>
                                    <SelectItem value="USDC">USDC (USD Coin)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Initial Balance</Label>
                            <Input
                                type="number"
                                step="0.01"
                                value={newWalletBalance}
                                onChange={(e) => setNewWalletBalance(e.target.value)}
                            />
                        </div>
                        {["BTC", "ETH", "USDT", "USDC"].includes(newWalletCurrency) && (
                            <div className="space-y-2">
                                <Label>Deposit Address (optional)</Label>
                                <Input
                                    value={newDepositAddress}
                                    onChange={(e) => setNewDepositAddress(e.target.value)}
                                    placeholder="Enter crypto deposit address..."
                                />
                            </div>
                        )}
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowAddWalletDialog(false)}>Cancel</Button>
                        <Button onClick={confirmAddWallet} disabled={updating}>
                            {updating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            <Plus className="mr-2 h-4 w-4" />
                            Create Wallet
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Billing Codes Dialog */}
            <Dialog open={showBillingDialog} onOpenChange={setShowBillingDialog}>
                <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Manage Billing Codes</DialogTitle>
                        <DialogDescription>
                            Configure withdrawal verification codes for {selectedUser?.first_name} {selectedUser?.last_name}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        {BILLING_CODE_TYPES.map((type) => (
                            <div key={type.value} className="p-4 border rounded-lg space-y-3">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="font-medium">{type.label}</p>
                                        <p className="text-xs text-muted-foreground">{type.description}</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Label className="text-xs">Active</Label>
                                        <Switch
                                            checked={billingCodes[type.value]?.isActive || false}
                                            onCheckedChange={(checked) => {
                                                setBillingCodes({
                                                    ...billingCodes,
                                                    [type.value]: {
                                                        ...billingCodes[type.value],
                                                        isActive: checked,
                                                    },
                                                });
                                            }}
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1">
                                        <Label className="text-xs">Code</Label>
                                        <Input
                                            value={billingCodes[type.value]?.code || ""}
                                            onChange={(e) => {
                                                setBillingCodes({
                                                    ...billingCodes,
                                                    [type.value]: {
                                                        ...billingCodes[type.value],
                                                        code: e.target.value,
                                                    },
                                                });
                                            }}
                                            placeholder="Auto-generated if empty"
                                            className="font-mono text-sm"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <Label className="text-xs">Amount ($)</Label>
                                        <Input
                                            type="number"
                                            value={billingCodes[type.value]?.amount || "0"}
                                            onChange={(e) => {
                                                setBillingCodes({
                                                    ...billingCodes,
                                                    [type.value]: {
                                                        ...billingCodes[type.value],
                                                        amount: e.target.value,
                                                    },
                                                });
                                            }}
                                        />
                                    </div>
                                </div>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => saveBillingCode(type.value)}
                                    disabled={updating}
                                >
                                    {updating && <Loader2 className="mr-2 h-3 w-3 animate-spin" />}
                                    Save {type.label}
                                </Button>
                            </div>
                        ))}
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowBillingDialog(false)}>
                            Close
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Deposit Methods Dialog */}
            <Dialog open={showDepositMethodsDialog} onOpenChange={setShowDepositMethodsDialog}>
                <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Manage Deposit Methods</DialogTitle>
                        <DialogDescription>
                            Manage deposit methods for {selectedUser?.first_name} {selectedUser?.last_name}
                        </DialogDescription>
                    </DialogHeader>

                    {/* Existing Methods */}
                    {userDepositMethods.length > 0 && (
                        <div className="space-y-3 mb-6">
                            <h4 className="font-medium text-sm">Current Methods</h4>
                            {userDepositMethods.map((method) => (
                                <div
                                    key={method.id}
                                    className="flex items-center justify-between p-3 bg-stone-50 dark:bg-stone-900 rounded-lg"
                                >
                                    <div className="flex items-center gap-3">
                                        {method.logo_url && (
                                            <div className="h-8 w-8 shrink-0 overflow-hidden rounded bg-white flex items-center justify-center p-1 border">
                                                <img src={method.logo_url} alt="Logo" className="h-6 w-6 object-contain" />
                                            </div>
                                        )}
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <p className="font-medium">{method.title}</p>
                                                {method.is_universal && (
                                                    <Badge variant="outline" className="text-[10px] h-4 px-1 bg-blue-50 text-blue-600 border-blue-200">
                                                        Universal
                                                    </Badge>
                                                )}
                                                {method.is_transfer_option && (
                                                    <Badge variant="outline" className="text-[10px] h-4 px-1 bg-green-50 text-green-600 border-green-200">
                                                        Transfer
                                                    </Badge>
                                                )}
                                            </div>
                                            <p className="text-xs text-muted-foreground">
                                                {method.method_type}
                                                {method.wallet_address && ` • ${method.wallet_address.slice(0, 10)}...`}
                                                {method.bank_name && ` • ${method.bank_name}`}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 text-stone-500 hover:text-stone-900"
                                            onClick={() => handleEditDepositMethod(method)}
                                            disabled={updating}
                                        >
                                            <Edit className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                                            onClick={() => deleteDepositMethod(method.id)}
                                            disabled={updating}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Add New Method Form */}
                    <div className="space-y-4 border-t pt-4">
                        <h4 className="font-medium text-sm">
                            {editingMethodId ? "Edit Method" : "Add New Method"}
                        </h4>
                        <div className="space-y-2">
                            <Label>Method Type</Label>
                            <Select
                                value={depositMethodForm.method_type}
                                onValueChange={(value) => setDepositMethodForm({ ...depositMethodForm, method_type: value })}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="crypto">Cryptocurrency</SelectItem>
                                    <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                                    <SelectItem value="p2p">P2P Transfer</SelectItem>
                                    <SelectItem value="mobile_money">Mobile Money</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Title *</Label>
                            <Input
                                value={depositMethodForm.title}
                                onChange={(e) => setDepositMethodForm({ ...depositMethodForm, title: e.target.value })}
                                placeholder="e.g., Bitcoin BTC, Chase Bank, etc."
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Description</Label>
                            <Input
                                value={depositMethodForm.description}
                                onChange={(e) => setDepositMethodForm({ ...depositMethodForm, description: e.target.value })}
                                placeholder="Optional description"
                            />
                        </div>

                        {depositMethodForm.method_type === "crypto" && (
                            <div className="space-y-2">
                                <Label>Wallet Address</Label>
                                <Input
                                    value={depositMethodForm.wallet_address}
                                    onChange={(e) => setDepositMethodForm({ ...depositMethodForm, wallet_address: e.target.value })}
                                    placeholder="Crypto wallet address"
                                />
                            </div>
                        )}

                        {(depositMethodForm.method_type === "bank_transfer" || depositMethodForm.method_type === "p2p") && (
                            <>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Bank Name</Label>
                                        <Input
                                            value={depositMethodForm.bank_name}
                                            onChange={(e) => setDepositMethodForm({ ...depositMethodForm, bank_name: e.target.value })}
                                            placeholder="Bank name"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Account Name</Label>
                                        <Input
                                            value={depositMethodForm.account_name}
                                            onChange={(e) => setDepositMethodForm({ ...depositMethodForm, account_name: e.target.value })}
                                            placeholder="Account holder name"
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Account Number</Label>
                                        <Input
                                            value={depositMethodForm.account_number}
                                            onChange={(e) => setDepositMethodForm({ ...depositMethodForm, account_number: e.target.value })}
                                            placeholder="Account number"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Routing Number</Label>
                                        <Input
                                            value={depositMethodForm.routing_number}
                                            onChange={(e) => setDepositMethodForm({ ...depositMethodForm, routing_number: e.target.value })}
                                            placeholder="Routing number"
                                        />
                                    </div>
                                </div>
                            </>
                        )}

                        <div className="space-y-2">
                            <Label>Additional Instructions</Label>
                            <Input
                                value={depositMethodForm.additional_info}
                                onChange={(e) => setDepositMethodForm({ ...depositMethodForm, additional_info: e.target.value })}
                                placeholder="Any additional info for the user"
                            />
                        </div>

                        <div className="space-y-4 rounded-lg border p-4">
                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <Label>Mark as Universal</Label>
                                    <p className="text-xs text-muted-foreground">
                                        Universal methods are visible to ALL users.
                                    </p>
                                </div>
                                <Switch
                                    checked={depositMethodForm.is_universal}
                                    onCheckedChange={(checked) => setDepositMethodForm({ ...depositMethodForm, is_universal: checked })}
                                />
                            </div>

                            <Separator />

                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <Label>Transfer Option</Label>
                                    <p className="text-xs text-muted-foreground">
                                        Allow users to select this for Wire Transfers.
                                    </p>
                                </div>
                                <Switch
                                    checked={depositMethodForm.is_transfer_option}
                                    onCheckedChange={(checked) => setDepositMethodForm({ ...depositMethodForm, is_transfer_option: checked })}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>Method Logo URL</Label>
                            <div className="flex gap-2">
                                <Input
                                    value={depositMethodForm.logo_url}
                                    onChange={(e) => setDepositMethodForm({ ...depositMethodForm, logo_url: e.target.value })}
                                    placeholder="https://example.com/logo.png"
                                />
                                {depositMethodForm.logo_url && (
                                    <div className="h-10 w-10 shrink-0 overflow-hidden rounded border bg-white flex items-center justify-center">
                                        <img src={depositMethodForm.logo_url} alt="Logo Preview" className="h-8 w-8 object-contain" />
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => {
                                if (editingMethodId) {
                                    setEditingMethodId(null);
                                    setDepositMethodForm({
                                        method_type: "crypto",
                                        title: "",
                                        description: "",
                                        wallet_address: "",
                                        bank_name: "",
                                        account_number: "",
                                        account_name: "",
                                        routing_number: "",
                                        swift_code: "",
                                        additional_info: "",
                                        is_universal: false,
                                        logo_url: "",
                                        is_transfer_option: false,
                                    });
                                } else {
                                    setShowDepositMethodsDialog(false);
                                }
                            }}
                        >
                            {editingMethodId ? "Cancel Edit" : "Close"}
                        </Button>
                        <Button onClick={saveDepositMethod} disabled={updating}>
                            {updating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {editingMethodId ? "Save Changes" : "Add Method"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete User Confirmation Dialog */}
            <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle className="text-red-600">Delete User</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete this user? This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    {selectedUser && (
                        <div className="py-4">
                            <div className="flex items-center gap-4 p-4 bg-red-50 dark:bg-red-950/20 rounded-lg border border-red-200 dark:border-red-900">
                                <Avatar className="h-12 w-12">
                                    <AvatarFallback className="bg-red-100 text-red-600">
                                        {selectedUser.first_name?.[0]}{selectedUser.last_name?.[0]}
                                    </AvatarFallback>
                                </Avatar>
                                <div>
                                    <p className="font-medium">{selectedUser.first_name} {selectedUser.last_name}</p>
                                    <p className="text-sm text-muted-foreground">{selectedUser.email}</p>
                                </div>
                            </div>
                            <p className="mt-4 text-sm text-muted-foreground">
                                This will permanently delete the user account, all wallets, transactions, and associated data.
                            </p>
                        </div>
                    )}
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
                            Cancel
                        </Button>
                        <Button variant="destructive" onClick={confirmDeleteUser} disabled={updating}>
                            {updating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Delete User
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Admin PIN Verification Dialog */}
            <Dialog open={showPinDialog} onOpenChange={setShowPinDialog}>
                <DialogContent className="max-w-sm">
                    <DialogHeader>
                        <DialogTitle>Admin Verification</DialogTitle>
                        <DialogDescription>
                            Enter admin PIN to confirm this action
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                        <div className="space-y-2">
                            <Label>Admin PIN</Label>
                            <Input
                                type="password"
                                value={adminPin}
                                onChange={(e) => setAdminPin(e.target.value)}
                                placeholder="Enter PIN"
                                autoFocus
                                onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                        executePendingAction();
                                    }
                                }}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => {
                            setShowPinDialog(false);
                            setAdminPin("");
                            setPendingAction(null);
                        }}>
                            Cancel
                        </Button>
                        <Button onClick={executePendingAction} disabled={updating}>
                            {updating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Confirm
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Reset User PIN Dialog */}
            <Dialog open={showPinResetDialog} onOpenChange={setShowPinResetDialog}>
                <DialogContent className="max-w-sm">
                    <DialogHeader>
                        <DialogTitle>Reset User PIN</DialogTitle>
                        <DialogDescription>
                            Set a new 4-digit transaction PIN for {selectedUser?.first_name} {selectedUser?.last_name}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                        <div className="space-y-2">
                            <Label>New PIN (4 digits)</Label>
                            <Input
                                type="text"
                                inputMode="numeric"
                                value={newUserPin}
                                onChange={(e) => setNewUserPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
                                placeholder="Enter 4-digit PIN"
                                maxLength={4}
                                className="text-center text-2xl tracking-widest"
                            />
                            <p className="text-xs text-muted-foreground">
                                The user will need to use this new PIN for all transactions.
                            </p>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => {
                            setShowPinResetDialog(false);
                            setNewUserPin("");
                        }}>
                            Cancel
                        </Button>
                        <Button onClick={confirmResetPin} disabled={updating || newUserPin.length !== 4}>
                            {updating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Reset PIN
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
