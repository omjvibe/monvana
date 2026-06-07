"use client";

import { useState, useEffect } from "react";
import { useUser } from "@/hooks/useAuth";
import { motion } from "framer-motion";
import { Loader2, TrendingUp, Clock, DollarSign, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
);

interface InvestmentPlan {
    id: string;
    name: string;
    description?: string;
    min_amount: number;
    max_amount: number;
    roi_percentage: number;
    duration_days: number;
    features?: string[];
}

interface Investment {
    id: string;
    amount: number;
    expected_return: number;
    actual_return?: number;
    status: string;
    start_date: string;
    maturity_date: string;
    plan: InvestmentPlan;
}

export default function InvestmentsPage() {
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [plans, setPlans] = useState<InvestmentPlan[]>([]);
    const [investments, setInvestments] = useState<Investment[]>([]);
    const [selectedPlan, setSelectedPlan] = useState<InvestmentPlan | null>(null);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [userId, setUserId] = useState<string | null>(null);
    const [investAmount, setInvestAmount] = useState("");

    const { user: clerkUser, isLoaded } = useUser();

    useEffect(() => {
        async function fetchData() {
            if (!clerkUser?.id) return;

            try {
                // Get user
                const { data: userData } = await supabase
                    .from("users")
                    .select("id")
                    .eq("clerk_id", clerkUser.id)
                    .single();

                if (userData) {
                    setUserId(userData.id);

                    // Fetch user's investments
                    const { data: investData } = await supabase
                        .from("investments")
                        .select("*, plan:investment_plans(*)")
                        .eq("user_id", userData.id)
                        .order("created_at", { ascending: false });

                    setInvestments(investData || []);
                }

                // Fetch all active plans
                const { data: planData } = await supabase
                    .from("investment_plans")
                    .select("*")
                    .eq("is_active", true)
                    .order("min_amount");

                setPlans(planData || []);
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

    const handleInvest = async () => {
        if (!userId || !selectedPlan) return;

        const amount = parseFloat(investAmount);
        if (!amount || amount < selectedPlan.min_amount) {
            toast.error(`Minimum investment is ${formatCurrency(selectedPlan.min_amount)}`);
            return;
        }
        if (amount > selectedPlan.max_amount) {
            toast.error(`Maximum investment is ${formatCurrency(selectedPlan.max_amount)}`);
            return;
        }

        setSubmitting(true);

        const expectedReturn = amount * (1 + selectedPlan.roi_percentage / 100);
        const maturityDate = new Date();
        maturityDate.setDate(maturityDate.getDate() + selectedPlan.duration_days);

        try {
            const { error } = await supabase.from("investments").insert({
                user_id: userId,
                plan_id: selectedPlan.id,
                amount,
                expected_return: expectedReturn,
                status: "active",
                start_date: new Date().toISOString(),
                maturity_date: maturityDate.toISOString(),
            });

            if (error) throw error;

            // Create transaction
            await supabase.from("transactions").insert({
                user_id: userId,
                type: "investment",
                amount,
                status: "approved",
                description: `Investment in ${selectedPlan.name}`,
            });

            toast.success("Investment created successfully!");
            setDialogOpen(false);
            setInvestAmount("");
            setSelectedPlan(null);

            // Refresh investments
            const { data: newInvestments } = await supabase
                .from("investments")
                .select("*, plan:investment_plans(*)")
                .eq("user_id", userId)
                .order("created_at", { ascending: false });
            setInvestments(newInvestments || []);
        } catch (error) {
            console.error("Error creating investment:", error);
            toast.error("Failed to create investment");
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

    const getStatusBadge = (status: string) => {
        switch (status) {
            case "active":
                return <Badge className="bg-green-500/10 text-green-600">Active</Badge>;
            case "matured":
                return <Badge className="bg-blue-500/10 text-blue-600">Matured</Badge>;
            case "withdrawn":
                return <Badge className="bg-stone-500/10 text-stone-600">Withdrawn</Badge>;
            default:
                return <Badge>{status}</Badge>;
        }
    };

    if (loading || !isLoaded) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-stone-400" />
            </div>
        );
    }

    const activeInvestments = investments.filter(i => i.status === "active");
    const totalInvested = activeInvestments.reduce((sum, i) => sum + Number(i.amount), 0);
    const totalExpectedReturn = activeInvestments.reduce((sum, i) => sum + Number(i.expected_return), 0);

    return (
        <div className="space-y-8">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
            >
                <h1 className="text-2xl font-bold text-stone-900 dark:text-stone-100">
                    Investments
                </h1>
                <p className="text-stone-600 dark:text-stone-400">
                    Grow your wealth with our investment plans
                </p>
            </motion.div>

            {/* Stats */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="grid gap-4 md:grid-cols-3"
            >
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-stone-500">Total Invested</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-2xl font-bold text-stone-900 dark:text-stone-100">
                            {formatCurrency(totalInvested)}
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-stone-500">Expected Returns</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-2xl font-bold text-green-600">
                            {formatCurrency(totalExpectedReturn)}
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-stone-500">Active Investments</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-2xl font-bold text-stone-900 dark:text-stone-100">
                            {activeInvestments.length}
                        </p>
                    </CardContent>
                </Card>
            </motion.div>

            {/* Investment Plans */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
            >
                <Card>
                    <CardHeader>
                        <CardTitle>Investment Plans</CardTitle>
                        <CardDescription>Choose a plan that suits your goals</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {plans.length === 0 ? (
                            <div className="py-12 text-center">
                                <BarChart3 className="mx-auto h-12 w-12 text-stone-300" />
                                <p className="mt-4 text-stone-500">
                                    No investment plans available at the moment
                                </p>
                            </div>
                        ) : (
                            <div className="grid gap-4 md:grid-cols-3">
                                {plans.map((plan) => (
                                    <div
                                        key={plan.id}
                                        className="rounded-lg border border-stone-200 p-4 dark:border-stone-800"
                                    >
                                        <h3 className="font-semibold text-stone-900 dark:text-stone-100">
                                            {plan.name}
                                        </h3>
                                        <div className="mt-2 flex items-baseline gap-1">
                                            <span className="text-3xl font-bold text-green-600">
                                                {plan.roi_percentage}%
                                            </span>
                                            <span className="text-stone-500">ROI</span>
                                        </div>
                                        <p className="mt-2 text-sm text-stone-500">
                                            {plan.description || `${plan.duration_days} day investment term`}
                                        </p>
                                        <div className="mt-4 space-y-1 text-sm">
                                            <div className="flex justify-between">
                                                <span className="text-stone-500">Minimum</span>
                                                <span className="font-medium text-stone-900 dark:text-stone-100">
                                                    {formatCurrency(plan.min_amount)}
                                                </span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-stone-500">Maximum</span>
                                                <span className="font-medium text-stone-900 dark:text-stone-100">
                                                    {formatCurrency(plan.max_amount)}
                                                </span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-stone-500">Duration</span>
                                                <span className="font-medium text-stone-900 dark:text-stone-100">
                                                    {plan.duration_days} days
                                                </span>
                                            </div>
                                        </div>
                                        <Dialog open={dialogOpen && selectedPlan?.id === plan.id} onOpenChange={(open) => {
                                            setDialogOpen(open);
                                            if (!open) setSelectedPlan(null);
                                        }}>
                                            <DialogTrigger asChild>
                                                <Button
                                                    className="mt-4 w-full"
                                                    onClick={() => setSelectedPlan(plan)}
                                                >
                                                    <TrendingUp className="mr-2 h-4 w-4" />
                                                    Invest Now
                                                </Button>
                                            </DialogTrigger>
                                            <DialogContent>
                                                <DialogHeader>
                                                    <DialogTitle>Invest in {plan.name}</DialogTitle>
                                                    <DialogDescription>
                                                        {plan.roi_percentage}% ROI over {plan.duration_days} days
                                                    </DialogDescription>
                                                </DialogHeader>
                                                <div className="space-y-4 py-4">
                                                    <div className="space-y-2">
                                                        <Label>Investment Amount (USD)</Label>
                                                        <div className="relative">
                                                            <DollarSign className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
                                                            <Input
                                                                type="number"
                                                                placeholder={plan.min_amount.toString()}
                                                                value={investAmount}
                                                                onChange={(e) => setInvestAmount(e.target.value)}
                                                                className="pl-10"
                                                                min={plan.min_amount}
                                                                max={plan.max_amount}
                                                            />
                                                        </div>
                                                        <p className="text-xs text-stone-500">
                                                            Min: {formatCurrency(plan.min_amount)} - Max: {formatCurrency(plan.max_amount)}
                                                        </p>
                                                    </div>

                                                    {parseFloat(investAmount) > 0 && (
                                                        <Card className="bg-stone-50 dark:bg-stone-900">
                                                            <CardContent className="pt-4">
                                                                <div className="grid grid-cols-2 gap-4 text-sm">
                                                                    <div>
                                                                        <p className="text-stone-500">Your Investment</p>
                                                                        <p className="font-medium text-stone-900 dark:text-stone-100">
                                                                            {formatCurrency(parseFloat(investAmount))}
                                                                        </p>
                                                                    </div>
                                                                    <div>
                                                                        <p className="text-stone-500">Expected Return</p>
                                                                        <p className="font-medium text-green-600">
                                                                            {formatCurrency(parseFloat(investAmount) * (1 + plan.roi_percentage / 100))}
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                            </CardContent>
                                                        </Card>
                                                    )}

                                                    <Button
                                                        onClick={handleInvest}
                                                        className="w-full"
                                                        disabled={submitting}
                                                    >
                                                        {submitting ? (
                                                            <>
                                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                                Processing...
                                                            </>
                                                        ) : (
                                                            "Confirm Investment"
                                                        )}
                                                    </Button>
                                                </div>
                                            </DialogContent>
                                        </Dialog>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </motion.div>

            {/* Your Investments */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
            >
                <Card>
                    <CardHeader>
                        <CardTitle>Your Investments</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {investments.length === 0 ? (
                            <p className="py-8 text-center text-stone-500">
                                No investments yet. Start investing to grow your wealth!
                            </p>
                        ) : (
                            <div className="space-y-4">
                                {investments.map((investment, index) => (
                                    <div key={investment.id}>
                                        <div className="flex items-start justify-between">
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <p className="font-medium text-stone-900 dark:text-stone-100">
                                                        {investment.plan?.name || "Investment"}
                                                    </p>
                                                    {getStatusBadge(investment.status)}
                                                </div>
                                                <p className="text-sm text-stone-500">
                                                    {formatCurrency(investment.amount)} invested
                                                </p>
                                                <p className="text-xs text-stone-400 flex items-center gap-1 mt-1">
                                                    <Clock className="h-3 w-3" />
                                                    Matures: {formatDate(investment.maturity_date)}
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-sm text-stone-500">Expected Return</p>
                                                <p className="font-semibold text-green-600">
                                                    {formatCurrency(investment.expected_return)}
                                                </p>
                                            </div>
                                        </div>
                                        {index < investments.length - 1 && <Separator className="mt-4" />}
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
