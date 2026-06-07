"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
    Users,
    DollarSign,
    TrendingUp,
    Clock,
    ArrowUpRight,
    ArrowDownRight,
    Loader2,
    MessageCircle,
    Activity,
    CreditCard,
    PiggyBank,
    AlertCircle,
    CheckCircle2,
    RefreshCw,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
);

interface Transaction {
    id: string;
    user_id: string;
    type: string;
    amount: number;
    status: string;
    description: string;
    created_at: string;
    users?: { first_name: string; last_name: string };
}

interface User {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    status: string;
    created_at: string;
}

interface DailyVolume {
    date: string;
    deposits: number;
    withdrawals: number;
}

export default function AdminDashboard() {
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        totalUsers: 0,
        totalBalance: 0,
        activeLoans: 0,
        pendingTransactions: 0,
        pendingLoans: 0,
        unreadMessages: 0,
        todayDeposits: 0,
        todayWithdrawals: 0,
        activeUsers: 0,
        suspendedUsers: 0,
    });
    const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
    const [recentUsers, setRecentUsers] = useState<User[]>([]);
    const [weeklyVolume, setWeeklyVolume] = useState<DailyVolume[]>([]);

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            // Fetch total users count
            const { count: userCount } = await supabase
                .from("users")
                .select("*", { count: "exact", head: true });

            // Fetch active users
            const { count: activeCount } = await supabase
                .from("users")
                .select("*", { count: "exact", head: true })
                .eq("status", "active");

            // Fetch suspended users
            const { count: suspendedCount } = await supabase
                .from("users")
                .select("*", { count: "exact", head: true })
                .eq("status", "suspended");

            // Fetch total balance from all wallets
            const { data: wallets } = await supabase
                .from("wallets")
                .select("balance");
            const totalBalance = wallets?.reduce((sum, w) => sum + Number(w.balance), 0) || 0;

            // Fetch active loans total
            const { data: loans } = await supabase
                .from("loans")
                .select("amount")
                .eq("status", "active");
            const activeLoansTotal = loans?.reduce((sum, l) => sum + Number(l.amount), 0) || 0;

            // Fetch pending transactions count
            const { count: pendingTxCount } = await supabase
                .from("transactions")
                .select("*", { count: "exact", head: true })
                .eq("status", "pending");

            // Fetch pending loans count
            const { count: pendingLoanCount } = await supabase
                .from("loans")
                .select("*", { count: "exact", head: true })
                .eq("status", "pending");

            // Fetch unread messages count
            const { count: unreadMsgCount } = await supabase
                .from("messages")
                .select("*", { count: "exact", head: true })
                .eq("sender_type", "user")
                .eq("is_read", false);

            // Today's deposits
            const today = new Date().toISOString().split("T")[0];
            const { data: todayDepositsData } = await supabase
                .from("transactions")
                .select("amount")
                .eq("type", "deposit")
                .gte("created_at", today);
            const todayDeposits = todayDepositsData?.reduce((sum, t) => sum + Number(t.amount), 0) || 0;

            // Today's withdrawals
            const { data: todayWithdrawalsData } = await supabase
                .from("transactions")
                .select("amount")
                .in("type", ["withdrawal", "transfer"])
                .gte("created_at", today);
            const todayWithdrawals = todayWithdrawalsData?.reduce((sum, t) => sum + Number(t.amount), 0) || 0;

            // Fetch recent transactions with user info
            const { data: txData } = await supabase
                .from("transactions")
                .select("*, users(first_name, last_name)")
                .order("created_at", { ascending: false })
                .limit(6);

            // Fetch recent users
            const { data: userData } = await supabase
                .from("users")
                .select("*")
                .order("created_at", { ascending: false })
                .limit(5);

            // Generate weekly volume data (last 7 days)
            const weekData: DailyVolume[] = [];
            for (let i = 6; i >= 0; i--) {
                const date = new Date();
                date.setDate(date.getDate() - i);
                const dateStr = date.toISOString().split("T")[0];
                const nextDate = new Date(date);
                nextDate.setDate(nextDate.getDate() + 1);

                const { data: dayDeposits } = await supabase
                    .from("transactions")
                    .select("amount")
                    .eq("type", "deposit")
                    .gte("created_at", dateStr)
                    .lt("created_at", nextDate.toISOString().split("T")[0]);

                const { data: dayWithdrawals } = await supabase
                    .from("transactions")
                    .select("amount")
                    .in("type", ["withdrawal", "transfer"])
                    .gte("created_at", dateStr)
                    .lt("created_at", nextDate.toISOString().split("T")[0]);

                weekData.push({
                    date: date.toLocaleDateString("en-US", { weekday: "short" }),
                    deposits: dayDeposits?.reduce((sum, t) => sum + Number(t.amount), 0) || 0,
                    withdrawals: dayWithdrawals?.reduce((sum, t) => sum + Number(t.amount), 0) || 0,
                });
            }
            setWeeklyVolume(weekData);

            setStats({
                totalUsers: userCount || 0,
                totalBalance,
                activeLoans: activeLoansTotal,
                pendingTransactions: pendingTxCount || 0,
                pendingLoans: pendingLoanCount || 0,
                unreadMessages: unreadMsgCount || 0,
                todayDeposits,
                todayWithdrawals,
                activeUsers: activeCount || 0,
                suspendedUsers: suspendedCount || 0,
            });
            setRecentTransactions(txData || []);
            setRecentUsers(userData || []);
        } catch (error) {
            console.error("Error fetching dashboard data:", error);
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (amount: number) => {
        if (amount >= 1000000) {
            return `$${(amount / 1000000).toFixed(1)}M`;
        }
        if (amount >= 1000) {
            return `$${(amount / 1000).toFixed(1)}K`;
        }
        return new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: "USD",
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(amount);
    };

    const formatFullCurrency = (amount: number) => {
        return new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: "USD",
            minimumFractionDigits: 2,
        }).format(amount);
    };

    const formatTimeAgo = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diff = Math.floor((now.getTime() - date.getTime()) / 1000);

        if (diff < 60) return "Just now";
        if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
        if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
        return `${Math.floor(diff / 86400)}d ago`;
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case "approved":
            case "active":
                return "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400";
            case "processing":
                return "bg-blue-500/10 text-blue-600 dark:text-blue-400";
            case "pending":
                return "bg-amber-500/10 text-amber-600 dark:text-amber-400";
            case "on_hold":
                return "bg-orange-500/10 text-orange-600 dark:text-orange-400";
            default:
                return "bg-muted text-muted-foreground";
        }
    };

    const maxVolume = Math.max(
        ...weeklyVolume.map((d) => Math.max(d.deposits, d.withdrawals)),
        1
    );

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between"
            >
                <div>
                    <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
                        Dashboard
                    </h1>
                    <p className="text-muted-foreground">
                        Welcome back! Here&apos;s what&apos;s happening today.
                    </p>
                </div>
                <Button variant="outline" onClick={fetchDashboardData}>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Refresh
                </Button>
            </motion.div>

            {/* Main Stats Grid */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="grid gap-4 md:grid-cols-2 lg:grid-cols-4"
            >
                <Card className="relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-indigo-500/10" />
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                        <div className="h-8 w-8 rounded-full bg-blue-500/10 flex items-center justify-center">
                            <Users className="h-4 w-4 text-blue-600" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">{stats.totalUsers}</div>
                        <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs text-emerald-600">{stats.activeUsers} active</span>
                            <span className="text-xs text-muted-foreground">•</span>
                            <span className="text-xs text-amber-600">{stats.suspendedUsers} suspended</span>
                        </div>
                    </CardContent>
                </Card>

                <Card className="relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-green-500/10" />
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Balance</CardTitle>
                        <div className="h-8 w-8 rounded-full bg-emerald-500/10 flex items-center justify-center">
                            <DollarSign className="h-4 w-4 text-emerald-600" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">{formatCurrency(stats.totalBalance)}</div>
                        <p className="text-xs text-muted-foreground mt-1">Across all user wallets</p>
                    </CardContent>
                </Card>

                <Card className="relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-violet-500/10" />
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Active Loans</CardTitle>
                        <div className="h-8 w-8 rounded-full bg-purple-500/10 flex items-center justify-center">
                            <PiggyBank className="h-4 w-4 text-purple-600" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">{formatCurrency(stats.activeLoans)}</div>
                        <p className="text-xs text-muted-foreground mt-1">Total outstanding loans</p>
                    </CardContent>
                </Card>

                <Card className="relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-orange-500/10" />
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Pending Actions</CardTitle>
                        <div className="h-8 w-8 rounded-full bg-amber-500/10 flex items-center justify-center">
                            <Clock className="h-4 w-4 text-amber-600" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">{stats.pendingTransactions}</div>
                        <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs text-muted-foreground">{stats.pendingLoans} loans</span>
                            <span className="text-xs text-muted-foreground">•</span>
                            <span className="text-xs text-muted-foreground">{stats.unreadMessages} messages</span>
                        </div>
                    </CardContent>
                </Card>
            </motion.div>

            {/* Today's Activity & Chart Row */}
            <div className="grid gap-6 lg:grid-cols-3">
                {/* Today's Activity */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                >
                    <Card className="h-full">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Activity className="h-5 w-5 text-muted-foreground" />
                                Today&apos;s Activity
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className="h-8 w-8 rounded-full bg-emerald-500/10 flex items-center justify-center">
                                            <ArrowDownRight className="h-4 w-4 text-emerald-600" />
                                        </div>
                                        <span className="text-sm font-medium">Deposits</span>
                                    </div>
                                    <span className="font-semibold text-emerald-600">
                                        +{formatFullCurrency(stats.todayDeposits)}
                                    </span>
                                </div>
                                <Progress
                                    value={stats.todayDeposits > 0 ? 100 : 0}
                                    className="h-2 [&>div]:bg-emerald-500"
                                />
                            </div>

                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className="h-8 w-8 rounded-full bg-red-500/10 flex items-center justify-center">
                                            <ArrowUpRight className="h-4 w-4 text-red-600" />
                                        </div>
                                        <span className="text-sm font-medium">Withdrawals</span>
                                    </div>
                                    <span className="font-semibold text-red-600">
                                        -{formatFullCurrency(stats.todayWithdrawals)}
                                    </span>
                                </div>
                                <Progress
                                    value={stats.todayWithdrawals > 0 ? 100 : 0}
                                    className="h-2 [&>div]:bg-red-500"
                                />
                            </div>

                            <div className="pt-4 border-t">
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-muted-foreground">Net Flow</span>
                                    <span className={`font-bold ${stats.todayDeposits - stats.todayWithdrawals >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                                        {stats.todayDeposits - stats.todayWithdrawals >= 0 ? "+" : ""}
                                        {formatFullCurrency(stats.todayDeposits - stats.todayWithdrawals)}
                                    </span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>

                {/* Weekly Volume Chart */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.25 }}
                    className="lg:col-span-2"
                >
                    <Card className="h-full">
                        <CardHeader>
                            <CardTitle>Weekly Transaction Volume</CardTitle>
                            <CardDescription>Deposits vs Withdrawals over the last 7 days</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-end justify-between gap-2 h-48">
                                {weeklyVolume.map((day, index) => (
                                    <div key={index} className="flex-1 flex flex-col items-center gap-1">
                                        <div className="w-full flex gap-1 h-40 items-end justify-center">
                                            {/* Deposit bar */}
                                            <div
                                                className="w-3 bg-emerald-500 rounded-t transition-all duration-500"
                                                style={{ height: `${(day.deposits / maxVolume) * 100}%`, minHeight: day.deposits > 0 ? "4px" : "0" }}
                                                title={`Deposits: ${formatFullCurrency(day.deposits)}`}
                                            />
                                            {/* Withdrawal bar */}
                                            <div
                                                className="w-3 bg-red-400 rounded-t transition-all duration-500"
                                                style={{ height: `${(day.withdrawals / maxVolume) * 100}%`, minHeight: day.withdrawals > 0 ? "4px" : "0" }}
                                                title={`Withdrawals: ${formatFullCurrency(day.withdrawals)}`}
                                            />
                                        </div>
                                        <span className="text-xs text-muted-foreground">{day.date}</span>
                                    </div>
                                ))}
                            </div>
                            <div className="flex items-center justify-center gap-6 mt-4 pt-4 border-t">
                                <div className="flex items-center gap-2">
                                    <div className="h-3 w-3 rounded bg-emerald-500" />
                                    <span className="text-xs text-muted-foreground">Deposits</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="h-3 w-3 rounded bg-red-400" />
                                    <span className="text-xs text-muted-foreground">Withdrawals</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>
            </div>

            {/* Recent Activity Row */}
            <div className="grid gap-6 lg:grid-cols-3">
                {/* Recent Transactions */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="lg:col-span-2"
                >
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div>
                                <CardTitle>Recent Transactions</CardTitle>
                                <CardDescription>Latest financial activities</CardDescription>
                            </div>
                            <Button variant="outline" size="sm" asChild>
                                <Link href="/admin/transactions">View All</Link>
                            </Button>
                        </CardHeader>
                        <CardContent>
                            {recentTransactions.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                                    <CreditCard className="h-10 w-10 mb-2 opacity-50" />
                                    <p>No transactions yet</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {recentTransactions.map((tx) => {
                                        const isDeposit = tx.type === "deposit" || tx.type === "bonus";
                                        return (
                                            <div key={tx.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                                                <div className="flex items-center gap-3">
                                                    <div
                                                        className={`flex h-10 w-10 items-center justify-center rounded-full ${isDeposit
                                                            ? "bg-emerald-500/10 text-emerald-600"
                                                            : "bg-red-500/10 text-red-600"
                                                            }`}
                                                    >
                                                        {isDeposit ? (
                                                            <ArrowDownRight className="h-5 w-5" />
                                                        ) : (
                                                            <ArrowUpRight className="h-5 w-5" />
                                                        )}
                                                    </div>
                                                    <div>
                                                        <p className="font-medium">
                                                            {tx.users?.first_name} {tx.users?.last_name}
                                                        </p>
                                                        <p className="text-xs text-muted-foreground capitalize">
                                                            {tx.type} • {formatTimeAgo(tx.created_at)}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className={`font-semibold ${isDeposit ? "text-emerald-600" : ""}`}>
                                                        {isDeposit ? "+" : "-"}{formatFullCurrency(tx.amount)}
                                                    </p>
                                                    <Badge variant="secondary" className={`text-xs ${getStatusColor(tx.status)}`}>
                                                        {tx.status.replace("_", " ")}
                                                    </Badge>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </motion.div>

                {/* Quick Actions & New Users */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.35 }}
                    className="space-y-6"
                >
                    {/* Quick Actions */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Quick Actions</CardTitle>
                        </CardHeader>
                        <CardContent className="grid gap-2">
                            {stats.pendingTransactions > 0 && (
                                <Link href="/admin/transactions" className="flex items-center gap-3 p-3 rounded-lg bg-amber-500/10 hover:bg-amber-500/15 transition-colors">
                                    <AlertCircle className="h-5 w-5 text-amber-600" />
                                    <div className="flex-1">
                                        <p className="text-sm font-medium">Pending Transactions</p>
                                        <p className="text-xs text-muted-foreground">{stats.pendingTransactions} awaiting approval</p>
                                    </div>
                                </Link>
                            )}
                            {stats.unreadMessages > 0 && (
                                <Link href="/admin/messages" className="flex items-center gap-3 p-3 rounded-lg bg-blue-500/10 hover:bg-blue-500/15 transition-colors">
                                    <MessageCircle className="h-5 w-5 text-blue-600" />
                                    <div className="flex-1">
                                        <p className="text-sm font-medium">Unread Messages</p>
                                        <p className="text-xs text-muted-foreground">{stats.unreadMessages} new messages</p>
                                    </div>
                                </Link>
                            )}
                            {stats.pendingLoans > 0 && (
                                <Link href="/admin/loans" className="flex items-center gap-3 p-3 rounded-lg bg-purple-500/10 hover:bg-purple-500/15 transition-colors">
                                    <PiggyBank className="h-5 w-5 text-purple-600" />
                                    <div className="flex-1">
                                        <p className="text-sm font-medium">Loan Applications</p>
                                        <p className="text-xs text-muted-foreground">{stats.pendingLoans} pending review</p>
                                    </div>
                                </Link>
                            )}
                            {stats.pendingTransactions === 0 && stats.unreadMessages === 0 && stats.pendingLoans === 0 && (
                                <div className="flex items-center gap-3 p-3 rounded-lg bg-emerald-500/10">
                                    <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                                    <p className="text-sm text-emerald-700 dark:text-emerald-400">All caught up!</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* New Users */}
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle className="text-base">New Users</CardTitle>
                            <Button variant="ghost" size="sm" asChild>
                                <Link href="/admin/users">View All</Link>
                            </Button>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                {recentUsers.slice(0, 4).map((user) => (
                                    <div key={user.id} className="flex items-center gap-3">
                                        <Avatar className="h-8 w-8">
                                            <AvatarFallback className="text-xs bg-primary/10 text-primary">
                                                {user.first_name?.[0]}{user.last_name?.[0]}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium truncate">
                                                {user.first_name} {user.last_name}
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                {formatTimeAgo(user.created_at)}
                                            </p>
                                        </div>
                                        <Badge variant="secondary" className={`text-xs ${getStatusColor(user.status)}`}>
                                            {user.status}
                                        </Badge>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>
            </div>
        </div>
    );
}
