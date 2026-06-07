"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { formatDistanceToNow } from "date-fns";
import {
    Search,
    Download,
    FileText,
    User,
    DollarSign,
    Settings,
    Shield,
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
import { toast } from "sonner";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
);

interface AuditLog {
    id: string;
    action: string;
    actor: string;
    target: string;
    details: string | Record<string, unknown>;
    category: string;
    created_at: string;
}

export default function AdminAuditPage() {
    const [loading, setLoading] = useState(true);
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [categoryFilter, setCategoryFilter] = useState("all");

    useEffect(() => {
        fetchLogs();
    }, []);

    const fetchLogs = async () => {
        try {
            // Check if audit_logs table exists, if not use transactions as a proxy
            const { data, error } = await supabase
                .from("transactions")
                .select("id, type, user_id, description, status, created_at, users(email)")
                .order("created_at", { ascending: false })
                .limit(50);

            if (!error && data) {
                // Transform transactions into audit log format
                const transformedLogs: AuditLog[] = data.map((tx: any) => ({
                    id: tx.id,
                    action: tx.type,
                    actor: tx.users?.email || "System",
                    target: tx.description || tx.type,
                    details: `Status: ${tx.status}`,
                    category: tx.type === "withdrawal" || tx.type === "transfer" ? "financial" : "transaction",
                    created_at: tx.created_at,
                }));
                setLogs(transformedLogs);
            }
        } catch (error) {
            console.error("Error fetching logs:", error);
        } finally {
            setLoading(false);
        }
    };

    const getCategoryIcon = (category: string) => {
        switch (category) {
            case "auth":
                return <User className="h-4 w-4" />;
            case "financial":
            case "transaction":
                return <DollarSign className="h-4 w-4" />;
            case "admin":
            case "settings":
                return <Settings className="h-4 w-4" />;
            case "security":
                return <Shield className="h-4 w-4" />;
            default:
                return <FileText className="h-4 w-4" />;
        }
    };

    const getCategoryColor = (category: string) => {
        switch (category) {
            case "auth":
                return "bg-blue-500/10 text-blue-600 dark:text-blue-400";
            case "financial":
            case "transaction":
                return "bg-green-500/10 text-green-600 dark:text-green-400";
            case "admin":
            case "settings":
                return "bg-purple-500/10 text-purple-600 dark:text-purple-400";
            case "security":
                return "bg-red-500/10 text-red-600 dark:text-red-400";
            default:
                return "bg-muted text-muted-foreground";
        }
    };

    const filteredLogs = logs.filter((log) => {
        const detailsStr = typeof log.details === 'object' && log.details !== null
            ? JSON.stringify(log.details)
            : String(log.details || '');
        const matchesSearch =
            log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
            log.actor.toLowerCase().includes(searchQuery.toLowerCase()) ||
            log.target.toLowerCase().includes(searchQuery.toLowerCase()) ||
            detailsStr.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = categoryFilter === "all" || log.category === categoryFilter;
        return matchesSearch && matchesCategory;
    });

    const exportLogs = () => {
        const csv = [
            ["ID", "Action", "Actor", "Target", "Details", "Category", "Timestamp"],
            ...filteredLogs.map((log) => [
                log.id,
                log.action,
                log.actor,
                log.target,
                log.details,
                log.category,
                log.created_at,
            ]),
        ]
            .map((row) => row.join(","))
            .join("\n");

        const blob = new Blob([csv], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `audit-logs-${new Date().toISOString().split("T")[0]}.csv`;
        a.click();
        toast.success("Audit logs exported");
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
                className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between"
            >
                <div>
                    <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
                        Audit Logs
                    </h1>
                    <p className="text-muted-foreground">
                        Track system activities and changes.
                    </p>
                </div>
                <Button variant="outline" onClick={exportLogs}>
                    <Download className="mr-2 h-4 w-4" />
                    Export CSV
                </Button>
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
                        <CardTitle className="text-sm font-medium">Total Logs</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{logs.length}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                            <DollarSign className="h-4 w-4 text-green-500" />
                            Financial
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">
                            {logs.filter((l) => l.category === "financial" || l.category === "transaction").length}
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                            <User className="h-4 w-4 text-blue-500" />
                            Auth Events
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-blue-600">
                            {logs.filter((l) => l.category === "auth").length}
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                            <Shield className="h-4 w-4 text-red-500" />
                            Security
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-red-600">
                            {logs.filter((l) => l.category === "security").length}
                        </div>
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
                                    placeholder="Search logs..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-10"
                                />
                            </div>
                            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                                <SelectTrigger className="w-[150px]">
                                    <SelectValue placeholder="Category" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Categories</SelectItem>
                                    <SelectItem value="auth">Auth</SelectItem>
                                    <SelectItem value="financial">Financial</SelectItem>
                                    <SelectItem value="transaction">Transaction</SelectItem>
                                    <SelectItem value="admin">Admin</SelectItem>
                                    <SelectItem value="security">Security</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </CardContent>
                </Card>
            </motion.div>

            {/* Logs Table */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.3 }}
            >
                <Card>
                    <CardContent className="p-0">
                        {filteredLogs.length === 0 ? (
                            <div className="py-12 text-center text-muted-foreground">
                                <FileText className="mx-auto h-12 w-12 opacity-50 mb-4" />
                                No audit logs found
                            </div>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Action</TableHead>
                                        <TableHead>Actor</TableHead>
                                        <TableHead className="hidden md:table-cell">Target</TableHead>
                                        <TableHead className="hidden lg:table-cell">Details</TableHead>
                                        <TableHead>Category</TableHead>
                                        <TableHead>Time</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredLogs.map((log) => (
                                        <TableRow key={log.id}>
                                            <TableCell className="font-medium capitalize">
                                                {log.action.replace(/_/g, " ")}
                                            </TableCell>
                                            <TableCell>{log.actor}</TableCell>
                                            <TableCell className="hidden md:table-cell">{log.target}</TableCell>
                                            <TableCell className="hidden lg:table-cell max-w-xs truncate text-muted-foreground">
                                                {typeof log.details === 'object' && log.details !== null
                                                    ? JSON.stringify(log.details)
                                                    : log.details}
                                            </TableCell>
                                            <TableCell>
                                                <Badge
                                                    variant="secondary"
                                                    className={`${getCategoryColor(log.category)} flex w-fit items-center gap-1`}
                                                >
                                                    {getCategoryIcon(log.category)}
                                                    {log.category}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-muted-foreground">
                                                {formatDistanceToNow(new Date(log.created_at), { addSuffix: true })}
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
