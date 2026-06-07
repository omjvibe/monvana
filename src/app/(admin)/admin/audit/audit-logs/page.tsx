"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
    Search,
    Filter,
    RefreshCw,
    Loader2,
    FileText,
    User,
    Calendar,
    Shield,
    DollarSign,
    AlertTriangle,
    Clock,
    Activity,
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
import { toast } from "sonner";

interface AuditLog {
    id: string;
    admin_id: string;
    action: string;
    target_user_id: string | null;
    details: string | null;
    ip_address: string | null;
    created_at: string;
    admin?: {
        id: string;
        first_name: string;
        last_name: string;
        email: string;
    };
    target_user?: {
        id: string;
        first_name: string;
        last_name: string;
        email: string;
    };
}

interface Stats {
    total: number;
    today: number;
    byAction: { action: string; count: number }[];
}

const ACTION_ICONS: Record<string, typeof Shield> = {
    updateStatus: Shield,
    updateProfile: User,
    updateBalance: DollarSign,
    createWallet: DollarSign,
    updateDepositAddress: DollarSign,
    manageBillingCode: FileText,
    resetBillingCode: RefreshCw,
    deleteUser: AlertTriangle,
    updateTransactionStatus: Activity,
};

const ACTION_COLORS: Record<string, string> = {
    updateStatus: "bg-orange-500/10 text-orange-600",
    updateProfile: "bg-blue-500/10 text-blue-600",
    updateBalance: "bg-green-500/10 text-green-600",
    createWallet: "bg-purple-500/10 text-purple-600",
    updateDepositAddress: "bg-cyan-500/10 text-cyan-600",
    manageBillingCode: "bg-yellow-500/10 text-yellow-600",
    resetBillingCode: "bg-gray-500/10 text-gray-600",
    deleteUser: "bg-red-500/10 text-red-600",
    updateTransactionStatus: "bg-indigo-500/10 text-indigo-600",
};

const ACTION_LABELS: Record<string, string> = {
    updateStatus: "Status Change",
    updateProfile: "Profile Update",
    updateBalance: "Balance Update",
    createWallet: "Wallet Created",
    updateDepositAddress: "Deposit Address",
    manageBillingCode: "Billing Code",
    resetBillingCode: "Code Reset",
    deleteUser: "User Deleted",
    updateTransactionStatus: "Transaction Update",
};

export default function AdminAuditLogsPage() {
    const [loading, setLoading] = useState(true);
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [actions, setActions] = useState<string[]>([]);
    const [stats, setStats] = useState<Stats | null>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [actionFilter, setActionFilter] = useState("all");

    useEffect(() => {
        fetchLogs();
    }, [actionFilter]);

    const fetchLogs = async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams();
            if (actionFilter !== "all") params.append("action", actionFilter);

            const response = await fetch(`/api/admin/audit-logs?${params.toString()}`);
            if (response.ok) {
                const data = await response.json();
                setLogs(data.logs || []);
                setActions(data.actions || []);
                setStats(data.stats || null);
            } else {
                toast.error("Failed to load audit logs");
            }
        } catch (error) {
            console.error("Error fetching logs:", error);
            toast.error("Failed to load audit logs");
        } finally {
            setLoading(false);
        }
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

    const formatTimeAgo = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMins / 60);
        const diffDays = Math.floor(diffHours / 24);

        if (diffMins < 1) return "Just now";
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;
        return formatDate(dateString);
    };

    const getActionIcon = (action: string) => {
        const Icon = ACTION_ICONS[action] || Activity;
        return <Icon className="h-4 w-4" />;
    };

    const getActionColor = (action: string) => {
        return ACTION_COLORS[action] || "bg-gray-500/10 text-gray-600";
    };

    const getActionLabel = (action: string) => {
        return ACTION_LABELS[action] || action;
    };

    const filteredLogs = logs.filter((log) => {
        if (!searchQuery) return true;
        const searchLower = searchQuery.toLowerCase();
        return (
            log.details?.toLowerCase().includes(searchLower) ||
            log.admin?.first_name?.toLowerCase().includes(searchLower) ||
            log.admin?.last_name?.toLowerCase().includes(searchLower) ||
            log.target_user?.first_name?.toLowerCase().includes(searchLower) ||
            log.target_user?.last_name?.toLowerCase().includes(searchLower) ||
            log.action.toLowerCase().includes(searchLower)
        );
    });

    if (loading && logs.length === 0) {
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
                        Audit Logs
                    </h1>
                    <p className="text-muted-foreground">
                        Track all admin actions and system changes.
                    </p>
                </div>
                <Button variant="outline" onClick={fetchLogs} disabled={loading}>
                    <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                    Refresh
                </Button>
            </motion.div>

            {/* Stats */}
            <div className="grid gap-4 md:grid-cols-4">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                            <FileText className="h-4 w-4 text-muted-foreground" />
                            Total Logs
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats?.total || 0}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            Today
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-blue-600">{stats?.today || 0}</div>
                    </CardContent>
                </Card>
                <Card className="md:col-span-2">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                            <Activity className="h-4 w-4 text-muted-foreground" />
                            Top Actions
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-wrap gap-2">
                            {stats?.byAction?.slice(0, 5).map((item) => (
                                <Badge key={item.action} variant="secondary" className={getActionColor(item.action)}>
                                    {getActionLabel(item.action)}: {item.count}
                                </Badge>
                            ))}
                            {(!stats?.byAction || stats.byAction.length === 0) && (
                                <span className="text-sm text-muted-foreground">No actions recorded</span>
                            )}
                        </div>
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
                                placeholder="Search logs..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-10"
                            />
                        </div>
                        <Select value={actionFilter} onValueChange={setActionFilter}>
                            <SelectTrigger className="w-[200px]">
                                <Filter className="mr-2 h-4 w-4" />
                                <SelectValue placeholder="Filter by action" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Actions</SelectItem>
                                {actions.map((action) => (
                                    <SelectItem key={action} value={action}>
                                        {getActionLabel(action)}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>

            {/* Logs Table */}
            <Card>
                <CardContent className="p-0">
                    {filteredLogs.length === 0 ? (
                        <div className="py-12 text-center text-muted-foreground">
                            <FileText className="mx-auto h-12 w-12 opacity-50 mb-4" />
                            <p>No audit logs found</p>
                            <p className="text-sm">Admin actions will appear here once recorded.</p>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Time</TableHead>
                                    <TableHead>Admin</TableHead>
                                    <TableHead>Action</TableHead>
                                    <TableHead>Target User</TableHead>
                                    <TableHead className="hidden lg:table-cell">Details</TableHead>
                                    <TableHead className="hidden md:table-cell">IP Address</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredLogs.map((log) => (
                                    <TableRow key={log.id}>
                                        <TableCell className="whitespace-nowrap">
                                            <div className="flex flex-col">
                                                <span className="font-medium text-sm">{formatTimeAgo(log.created_at)}</span>
                                                <span className="text-xs text-muted-foreground">{formatDate(log.created_at)}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            {log.admin ? (
                                                <div className="flex items-center gap-2">
                                                    <Avatar className="h-7 w-7">
                                                        <AvatarFallback className="text-xs">
                                                            {log.admin.first_name?.[0]}{log.admin.last_name?.[0]}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <span className="text-sm font-medium">
                                                        {log.admin.first_name} {log.admin.last_name}
                                                    </span>
                                                </div>
                                            ) : (
                                                <span className="text-muted-foreground">System</span>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="secondary" className={getActionColor(log.action)}>
                                                <span className="mr-1">{getActionIcon(log.action)}</span>
                                                {getActionLabel(log.action)}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            {log.target_user ? (
                                                <div className="flex items-center gap-2">
                                                    <Avatar className="h-7 w-7">
                                                        <AvatarFallback className="text-xs">
                                                            {log.target_user.first_name?.[0]}{log.target_user.last_name?.[0]}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <div className="flex flex-col">
                                                        <span className="text-sm font-medium">
                                                            {log.target_user.first_name} {log.target_user.last_name}
                                                        </span>
                                                        <span className="text-xs text-muted-foreground">
                                                            {log.target_user.email}
                                                        </span>
                                                    </div>
                                                </div>
                                            ) : (
                                                <span className="text-muted-foreground">-</span>
                                            )}
                                        </TableCell>
                                        <TableCell className="hidden lg:table-cell max-w-xs">
                                            <p className="text-sm text-muted-foreground truncate">
                                                {log.details || "-"}
                                            </p>
                                        </TableCell>
                                        <TableCell className="hidden md:table-cell">
                                            <code className="text-xs bg-muted px-1.5 py-0.5 rounded">
                                                {log.ip_address || "N/A"}
                                            </code>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
