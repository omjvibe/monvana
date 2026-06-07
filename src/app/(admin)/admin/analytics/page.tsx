"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { createClient } from "@supabase/supabase-js";
import {
    BarChart3,
    TrendingUp,
    Users,
    Receipt,
    Activity,
    ArrowUpRight,
    ArrowDownRight,
    RefreshCw,
    Loader2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
);

interface DailyVolume {
    date: string;
    total: number;
    count: number;
}

interface StatusBreakdown {
    status: string;
    count: number;
    total: number;
}

interface CategoryBreakdown {
    category: string;
    count: number;
}

interface AnalyticsData {
    totalVolume: number;
    totalTransactions: number;
    totalUsers: number;
    pendingTransactions: number;
    volumeChange: number;
    userChange: number;
    dailyVolumes: DailyVolume[];
    statusBreakdown: StatusBreakdown[];
    categoryBreakdown: CategoryBreakdown[];
    registrationsPerDay: { date: string; count: number }[];
}

// ─────────────────────────────────────────────
// SVG Mini Bar Chart
// ─────────────────────────────────────────────
function BarChartSVG({
    data,
    color = "#00DF89",
    height = 120,
}: {
    data: { label: string; value: number }[];
    color?: string;
    height?: number;
}) {
    if (!data.length) return null;
    const max = Math.max(...data.map((d) => d.value), 1);
    const barWidth = Math.floor(100 / data.length);

    return (
        <div className="relative w-full" style={{ height }}>
            <svg width="100%" height="100%" viewBox={`0 0 ${data.length * 40} ${height}`} preserveAspectRatio="none">
                <defs>
                    <linearGradient id={`grad-${color.replace("#", "")}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={color} stopOpacity="0.9" />
                        <stop offset="100%" stopColor={color} stopOpacity="0.2" />
                    </linearGradient>
                </defs>
                {data.map((d, i) => {
                    const barH = Math.max((d.value / max) * (height - 10), 2);
                    const x = i * 40 + 4;
                    const y = height - barH;
                    return (
                        <g key={i}>
                            <rect
                                x={x}
                                y={y}
                                width={32}
                                height={barH}
                                rx={4}
                                fill={`url(#grad-${color.replace("#", "")})`}
                                className="transition-all duration-500"
                            />
                        </g>
                    );
                })}
            </svg>
            {/* X labels */}
            <div className="absolute bottom-0 left-0 right-0 flex justify-around px-1">
                {data.slice(-7).map((d, i) => (
                    <span key={i} className="text-[9px] text-stone-600 truncate max-w-[40px] text-center">
                        {d.label}
                    </span>
                ))}
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────
// SVG Mini Line Chart
// ─────────────────────────────────────────────
function LineChartSVG({
    data,
    color = "#00DF89",
    height = 120,
}: {
    data: { value: number }[];
    color?: string;
    height?: number;
}) {
    if (data.length < 2) return null;
    const max = Math.max(...data.map((d) => d.value), 1);
    const w = 600;
    const h = height - 16;
    const step = w / (data.length - 1);

    const points = data.map((d, i) => ({
        x: i * step,
        y: h - (d.value / max) * h,
    }));

    const pathD = points
        .map((p, i) => (i === 0 ? `M${p.x},${p.y}` : `L${p.x},${p.y}`))
        .join(" ");

    const areaD =
        `M${points[0].x},${h} ` +
        points.map((p) => `L${p.x},${p.y}`).join(" ") +
        ` L${points[points.length - 1].x},${h} Z`;

    return (
        <svg width="100%" height={height} viewBox={`0 0 ${w} ${height}`} preserveAspectRatio="none">
            <defs>
                <linearGradient id="lineAreaGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={color} stopOpacity="0.25" />
                    <stop offset="100%" stopColor={color} stopOpacity="0.0" />
                </linearGradient>
            </defs>
            <path d={areaD} fill="url(#lineAreaGrad)" />
            <path d={pathD} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            {points.map((p, i) => (
                <circle key={i} cx={p.x} cy={p.y} r="3" fill={color} opacity={0.7} />
            ))}
        </svg>
    );
}

// ─────────────────────────────────────────────
// Donut Chart
// ─────────────────────────────────────────────
const STATUS_COLORS: Record<string, string> = {
    approved: "#00DF89",
    pending: "#f59e0b",
    processing: "#60a5fa",
    on_hold: "#818cf8",
    cancelled: "#ef4444",
    failed: "#dc2626",
};

function DonutChart({ data }: { data: StatusBreakdown[] }) {
    const total = data.reduce((s, d) => s + d.count, 0) || 1;
    const size = 120;
    const r = 48;
    const circ = 2 * Math.PI * r;
    let cumulative = 0;

    return (
        <div className="flex flex-wrap items-center gap-6">
            <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
                {data.map((d, i) => {
                    const fraction = d.count / total;
                    const dash = fraction * circ;
                    const offset = circ - cumulative * circ;
                    cumulative += fraction;
                    return (
                        <circle
                            key={i}
                            cx={size / 2}
                            cy={size / 2}
                            r={r}
                            fill="none"
                            stroke={STATUS_COLORS[d.status] || "#52525b"}
                            strokeWidth={16}
                            strokeDasharray={`${dash} ${circ - dash}`}
                            strokeDashoffset={offset}
                            style={{ transform: "rotate(-90deg)", transformOrigin: "center" }}
                        />
                    );
                })}
                <text x={size / 2} y={size / 2 + 5} textAnchor="middle" fill="#fff" fontSize="14" fontWeight="700">
                    {total}
                </text>
            </svg>
            <div className="flex flex-col gap-2">
                {data.map((d, i) => (
                    <div key={i} className="flex items-center gap-2">
                        <span
                            className="h-2.5 w-2.5 rounded-sm flex-shrink-0"
                            style={{ backgroundColor: STATUS_COLORS[d.status] || "#52525b" }}
                        />
                        <span className="text-xs text-stone-400 capitalize">{d.status.replace("_", " ")}</span>
                        <span className="ml-auto text-xs font-semibold text-white">{d.count}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────
// Stat Card
// ─────────────────────────────────────────────
function StatCard({
    icon: Icon,
    label,
    value,
    sub,
    up,
    delay = 0,
}: {
    icon: React.ComponentType<{ className?: string }>;
    label: string;
    value: string;
    sub: string;
    up?: boolean;
    delay?: number;
}) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay }}
        >
            <Card className="border-white/5 bg-white/[0.02] backdrop-blur-sm hover:border-[#00DF89]/20 transition-colors">
                <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                        <div>
                            <p className="text-xs uppercase tracking-widest text-stone-500 font-medium">{label}</p>
                            <p className="mt-2 text-2xl font-bold text-white">{value}</p>
                            <div className="flex items-center gap-1 mt-1.5">
                                {up !== undefined && (
                                    up
                                        ? <ArrowUpRight className="h-3.5 w-3.5 text-[#00DF89]" />
                                        : <ArrowDownRight className="h-3.5 w-3.5 text-red-400" />
                                )}
                                <span className={`text-xs ${up ? "text-[#00DF89]" : up === false ? "text-red-400" : "text-stone-500"}`}>{sub}</span>
                            </div>
                        </div>
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/5 bg-[#00DF89]/10">
                            <Icon className="h-5 w-5 text-[#00DF89]" />
                        </div>
                    </div>
                </CardContent>
            </Card>
        </motion.div>
    );
}

// ─────────────────────────────────────────────
// Main Analytics Page
// ─────────────────────────────────────────────
export default function AnalyticsPage() {
    const [data, setData] = useState<AnalyticsData | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    async function fetchAnalytics() {
        try {
            // Fetch all transactions
            const { data: txData } = await supabase
                .from("transactions")
                .select("id, amount, status, type, created_at");

            // Fetch all users
            const { data: usersData } = await supabase
                .from("users")
                .select("id, created_at");

            // Fetch audit logs for user behavior
            const { data: auditData } = await supabase
                .from("audit_logs")
                .select("id, category, created_at")
                .order("created_at", { ascending: false })
                .limit(500);

            const txs = txData || [];
            const users = usersData || [];
            const audits = auditData || [];

            // Compute totals
            const totalVolume = txs.reduce((s: number, t: any) => s + (t.amount || 0), 0);
            const totalTransactions = txs.length;
            const totalUsers = users.length;
            const pendingTransactions = txs.filter((t: any) => ["pending", "processing", "on_hold"].includes(t.status)).length;

            // Daily volume — last 14 days
            const now = new Date();
            const dailyMap: Record<string, { total: number; count: number }> = {};
            for (let i = 13; i >= 0; i--) {
                const d = new Date(now);
                d.setDate(d.getDate() - i);
                const key = d.toISOString().slice(0, 10);
                dailyMap[key] = { total: 0, count: 0 };
            }
            txs.forEach((t: any) => {
                const key = new Date(t.created_at).toISOString().slice(0, 10);
                if (dailyMap[key]) {
                    dailyMap[key].total += t.amount || 0;
                    dailyMap[key].count += 1;
                }
            });
            const dailyVolumes: DailyVolume[] = Object.entries(dailyMap).map(([date, v]) => ({
                date,
                ...v,
            }));

            // Status breakdown
            const statusMap: Record<string, StatusBreakdown> = {};
            txs.forEach((t: any) => {
                if (!statusMap[t.status]) statusMap[t.status] = { status: t.status, count: 0, total: 0 };
                statusMap[t.status].count += 1;
                statusMap[t.status].total += t.amount || 0;
            });
            const statusBreakdown = Object.values(statusMap).sort((a, b) => b.count - a.count);

            // Audit log category breakdown
            const catMap: Record<string, number> = {};
            audits.forEach((a: any) => {
                const cat = a.category || "other";
                catMap[cat] = (catMap[cat] || 0) + 1;
            });
            const categoryBreakdown: CategoryBreakdown[] = Object.entries(catMap)
                .map(([category, count]) => ({ category, count }))
                .sort((a, b) => b.count - a.count);

            // Registrations per day — last 14 days
            const regMap: Record<string, number> = {};
            for (let i = 13; i >= 0; i--) {
                const d = new Date(now);
                d.setDate(d.getDate() - i);
                regMap[d.toISOString().slice(0, 10)] = 0;
            }
            users.forEach((u: any) => {
                const key = new Date(u.created_at).toISOString().slice(0, 10);
                if (regMap[key] !== undefined) regMap[key] += 1;
            });
            const registrationsPerDay = Object.entries(regMap).map(([date, count]) => ({ date, count }));

            // Week-over-week volume change
            const thisWeek = txs.filter((t: any) => {
                const d = new Date(t.created_at);
                return (now.getTime() - d.getTime()) < 7 * 86400 * 1000;
            }).reduce((s: number, t: any) => s + (t.amount || 0), 0);
            const lastWeek = txs.filter((t: any) => {
                const d = new Date(t.created_at);
                const diff = now.getTime() - d.getTime();
                return diff >= 7 * 86400 * 1000 && diff < 14 * 86400 * 1000;
            }).reduce((s: number, t: any) => s + (t.amount || 0), 0);
            const volumeChange = lastWeek > 0 ? ((thisWeek - lastWeek) / lastWeek) * 100 : 0;

            // Week-over-week user registrations
            const newUsersThisWeek = users.filter((u: any) => {
                const d = new Date(u.created_at);
                return (now.getTime() - d.getTime()) < 7 * 86400 * 1000;
            }).length;
            const newUsersLastWeek = users.filter((u: any) => {
                const d = new Date(u.created_at);
                const diff = now.getTime() - d.getTime();
                return diff >= 7 * 86400 * 1000 && diff < 14 * 86400 * 1000;
            }).length;
            const userChange = newUsersLastWeek > 0 ? ((newUsersThisWeek - newUsersLastWeek) / newUsersLastWeek) * 100 : 0;

            setData({
                totalVolume,
                totalTransactions,
                totalUsers,
                pendingTransactions,
                volumeChange,
                userChange,
                dailyVolumes,
                statusBreakdown,
                categoryBreakdown,
                registrationsPerDay,
            });
        } catch (err) {
            console.error("Analytics fetch error:", err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }

    useEffect(() => { fetchAnalytics(); }, []);

    function handleRefresh() {
        setRefreshing(true);
        fetchAnalytics();
    }

    const fmt = (n: number) =>
        new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", notation: "compact", maximumFractionDigits: 1 }).format(n);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="flex flex-col items-center gap-3">
                    <Loader2 className="h-8 w-8 animate-spin text-[#00DF89]" />
                    <p className="text-sm text-stone-500">Loading analytics…</p>
                </div>
            </div>
        );
    }

    const volChartData = (data?.dailyVolumes ?? []).map((d) => ({
        label: d.date.slice(5),
        value: d.total,
    }));
    const regChartData = (data?.registrationsPerDay ?? []).map((d) => ({ value: d.count }));
    const txCountData = (data?.dailyVolumes ?? []).map((d) => ({
        label: d.date.slice(5),
        value: d.count,
    }));

    return (
        <div className="space-y-8 p-1">
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -16 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center justify-between"
            >
                <div>
                    <h1 className="text-2xl font-bold text-stone-900 dark:text-white">Platform Analytics</h1>
                    <p className="text-stone-500 text-sm mt-1">Transaction volume, user behavior & activity tracking</p>
                </div>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRefresh}
                    disabled={refreshing}
                    className="gap-2"
                >
                    <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
                    Refresh
                </Button>
            </motion.div>

            {/* KPI Cards */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <StatCard
                    icon={Receipt}
                    label="Total Volume"
                    value={fmt(data?.totalVolume ?? 0)}
                    sub={`${data?.volumeChange && data.volumeChange >= 0 ? "+" : ""}${(data?.volumeChange ?? 0).toFixed(1)}% vs last week`}
                    up={(data?.volumeChange ?? 0) >= 0}
                    delay={0}
                />
                <StatCard
                    icon={BarChart3}
                    label="Transactions"
                    value={(data?.totalTransactions ?? 0).toLocaleString()}
                    sub={`${data?.pendingTransactions ?? 0} pending`}
                    delay={0.08}
                />
                <StatCard
                    icon={Users}
                    label="Registered Users"
                    value={(data?.totalUsers ?? 0).toLocaleString()}
                    sub={`${(data?.userChange ?? 0) >= 0 ? "+" : ""}${(data?.userChange ?? 0).toFixed(1)}% vs last week`}
                    up={(data?.userChange ?? 0) >= 0}
                    delay={0.16}
                />
                <StatCard
                    icon={Activity}
                    label="Audit Events"
                    value={(data?.categoryBreakdown ?? []).reduce((s, c) => s + c.count, 0).toLocaleString()}
                    sub="Last 500 events tracked"
                    delay={0.24}
                />
            </div>

            {/* Volume Chart + Status Breakdown */}
            <div className="grid gap-6 lg:grid-cols-2">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                >
                    <Card className="border-white/5 bg-white/[0.02]">
                        <CardHeader>
                            <CardTitle className="text-base flex items-center gap-2">
                                <TrendingUp className="h-4 w-4 text-[#00DF89]" />
                                Transaction Volume — Last 14 Days
                            </CardTitle>
                            <CardDescription>Daily USD transaction amounts</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <BarChartSVG data={volChartData} height={140} />
                            <div className="mt-4 flex items-center justify-between text-xs text-stone-500">
                                <span>14 days ago</span>
                                <span>Today</span>
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.38 }}
                >
                    <Card className="border-white/5 bg-white/[0.02]">
                        <CardHeader>
                            <CardTitle className="text-base flex items-center gap-2">
                                <Receipt className="h-4 w-4 text-[#00DF89]" />
                                Status Breakdown
                            </CardTitle>
                            <CardDescription>Transaction status distribution</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {(data?.statusBreakdown?.length ?? 0) > 0 ? (
                                <DonutChart data={data!.statusBreakdown} />
                            ) : (
                                <p className="text-sm text-stone-500">No transaction data yet.</p>
                            )}
                        </CardContent>
                    </Card>
                </motion.div>
            </div>

            {/* Transaction Count Chart + Registrations */}
            <div className="grid gap-6 lg:grid-cols-2">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.44 }}
                >
                    <Card className="border-white/5 bg-white/[0.02]">
                        <CardHeader>
                            <CardTitle className="text-base flex items-center gap-2">
                                <BarChart3 className="h-4 w-4 text-[#00DF89]" />
                                Transaction Count — Last 14 Days
                            </CardTitle>
                            <CardDescription>Daily number of processed transactions</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <BarChartSVG data={txCountData} color="#60a5fa" height={140} />
                        </CardContent>
                    </Card>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.52 }}
                >
                    <Card className="border-white/5 bg-white/[0.02]">
                        <CardHeader>
                            <CardTitle className="text-base flex items-center gap-2">
                                <Users className="h-4 w-4 text-[#00DF89]" />
                                User Registrations — Last 14 Days
                            </CardTitle>
                            <CardDescription>Daily new account signups trend</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <LineChartSVG data={regChartData} height={140} />
                            <div className="mt-3 flex items-center justify-between text-xs text-stone-500">
                                <span>14 days ago</span>
                                <span>Today</span>
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>
            </div>

            {/* User Behavior — Audit Log Categories */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
            >
                <Card className="border-white/5 bg-white/[0.02]">
                    <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2">
                            <Activity className="h-4 w-4 text-[#00DF89]" />
                            User Behavior Tracking
                        </CardTitle>
                        <CardDescription>Audit log category breakdown from last 500 events</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {(data?.categoryBreakdown?.length ?? 0) === 0 ? (
                            <p className="text-sm text-stone-500">No audit log data yet.</p>
                        ) : (
                            <div className="space-y-3">
                                {data!.categoryBreakdown.map((c, i) => {
                                    const total = data!.categoryBreakdown.reduce((s, d) => s + d.count, 0);
                                    const pct = Math.round((c.count / total) * 100);
                                    const colors = ["#00DF89", "#60a5fa", "#f59e0b", "#c084fc", "#fb7185", "#34d399"];
                                    const color = colors[i % colors.length];
                                    return (
                                        <div key={c.category}>
                                            <div className="flex items-center justify-between mb-1.5">
                                                <div className="flex items-center gap-2">
                                                    <span className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} />
                                                    <span className="text-sm text-stone-300 capitalize">{c.category.replace(/_/g, " ")}</span>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <span className="text-xs text-stone-500">{c.count} events</span>
                                                    <Badge variant="outline" className="text-[10px] px-2 py-0.5">{pct}%</Badge>
                                                </div>
                                            </div>
                                            <div className="h-1.5 w-full rounded-full bg-white/5 overflow-hidden">
                                                <motion.div
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${pct}%` }}
                                                    transition={{ duration: 0.8, delay: 0.7 + i * 0.08 }}
                                                    className="h-full rounded-full"
                                                    style={{ backgroundColor: color }}
                                                />
                                            </div>
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
