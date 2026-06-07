"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
    Plus,
    MoreHorizontal,
    TrendingUp,
    DollarSign,
    Users,
    Edit,
    Trash2,
    Percent,
    Loader2,
    RefreshCw,
    Eye,
    CheckCircle2,
    XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardTitle, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";

interface InvestmentPlan {
    id: string;
    name: string;
    description: string;
    min_amount: number;
    max_amount: number;
    roi_percentage: number;
    duration_days: number;
    features: string[];
    is_active: boolean;
    created_at: string;
}

interface UserInvestment {
    id: string;
    user_id: string;
    plan_id: string;
    amount: number;
    status: string;
    start_date: string;
    maturity_date: string;
    expected_return: number;
    created_at: string;
    user?: { id: string; first_name: string; last_name: string; email: string };
    plan?: { id: string; name: string; roi_percentage: number; duration_days: number };
}

interface Stats {
    totalPlans: number;
    activePlans: number;
    totalInvestments: number;
    activeInvestments: number;
    totalInvested: number;
}

export default function AdminInvestmentsPage() {
    const [loading, setLoading] = useState(true);
    const [plans, setPlans] = useState<InvestmentPlan[]>([]);
    const [investments, setInvestments] = useState<UserInvestment[]>([]);
    const [stats, setStats] = useState<Stats | null>(null);
    const [showCreateDialog, setShowCreateDialog] = useState(false);
    const [editingPlan, setEditingPlan] = useState<InvestmentPlan | null>(null);
    const [submitting, setSubmitting] = useState(false);

    // Form state
    const [formData, setFormData] = useState({
        name: "",
        description: "",
        min_amount: "",
        max_amount: "",
        roi_percentage: "",
        duration_days: "",
        is_active: true,
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const response = await fetch("/api/admin/investments");
            if (response.ok) {
                const data = await response.json();
                setPlans(data.plans || []);
                setInvestments(data.investments || []);
                setStats(data.stats || null);
            } else {
                toast.error("Failed to load data");
            }
        } catch (error) {
            console.error("Error fetching data:", error);
            toast.error("Failed to load data");
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setFormData({
            name: "",
            description: "",
            min_amount: "",
            max_amount: "",
            roi_percentage: "",
            duration_days: "",
            is_active: true,
        });
    };

    const handleOpenEdit = (plan: InvestmentPlan) => {
        setEditingPlan(plan);
        setFormData({
            name: plan.name,
            description: plan.description || "",
            min_amount: plan.min_amount.toString(),
            max_amount: plan.max_amount?.toString() || "",
            roi_percentage: plan.roi_percentage.toString(),
            duration_days: plan.duration_days.toString(),
            is_active: plan.is_active,
        });
    };

    const handleSubmit = async () => {
        if (!formData.name || !formData.min_amount || !formData.roi_percentage || !formData.duration_days) {
            toast.error("Please fill in all required fields");
            return;
        }

        setSubmitting(true);
        try {
            if (editingPlan) {
                // Update existing plan
                const response = await fetch("/api/admin/investments", {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        action: "updatePlan",
                        planId: editingPlan.id,
                        ...formData,
                    }),
                });

                if (response.ok) {
                    toast.success("Plan updated successfully");
                } else {
                    throw new Error("Failed to update");
                }
            } else {
                // Create new plan
                const response = await fetch("/api/admin/investments", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(formData),
                });

                if (response.ok) {
                    toast.success("Plan created successfully");
                } else {
                    throw new Error("Failed to create");
                }
            }

            setShowCreateDialog(false);
            setEditingPlan(null);
            resetForm();
            fetchData();
        } catch (error) {
            console.error("Error:", error);
            toast.error("Failed to save plan");
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (planId: string) => {
        if (!confirm("Are you sure you want to delete this plan?")) return;

        try {
            const response = await fetch(`/api/admin/investments?planId=${planId}`, {
                method: "DELETE",
            });

            if (response.ok) {
                toast.success("Plan deleted");
                fetchData();
            } else {
                const data = await response.json();
                toast.error(data.error || "Failed to delete");
            }
        } catch (error) {
            console.error("Error:", error);
            toast.error("Failed to delete plan");
        }
    };

    const updateInvestmentStatus = async (investmentId: string, status: string) => {
        try {
            const response = await fetch("/api/admin/investments", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    action: "updateInvestmentStatus",
                    investmentId,
                    status,
                }),
            });

            if (response.ok) {
                toast.success(`Investment marked as ${status}`);
                fetchData();
            } else {
                toast.error("Failed to update status");
            }
        } catch (error) {
            console.error("Error:", error);
            toast.error("Failed to update status");
        }
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: "USD",
        }).format(amount);
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
                        Investments
                    </h1>
                    <p className="text-muted-foreground">
                        Manage investment plans and user investments.
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={fetchData}>
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Refresh
                    </Button>
                    <Button onClick={() => { resetForm(); setShowCreateDialog(true); }}>
                        <Plus className="mr-2 h-4 w-4" />
                        New Plan
                    </Button>
                </div>
            </motion.div>

            {/* Stats */}
            <div className="grid gap-4 md:grid-cols-5">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                            <TrendingUp className="h-4 w-4 text-muted-foreground" />
                            Total Plans
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats?.totalPlans || 0}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                            Active Plans
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">{stats?.activePlans || 0}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                            <Users className="h-4 w-4 text-muted-foreground" />
                            Investments
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats?.totalInvestments || 0}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                            <Percent className="h-4 w-4 text-blue-500" />
                            Active
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-blue-600">{stats?.activeInvestments || 0}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                            <DollarSign className="h-4 w-4 text-green-500" />
                            Total Invested
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatCurrency(stats?.totalInvested || 0)}</div>
                    </CardContent>
                </Card>
            </div>

            {/* Tabs */}
            <Tabs defaultValue="plans" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="plans">Investment Plans</TabsTrigger>
                    <TabsTrigger value="investments">User Investments</TabsTrigger>
                </TabsList>

                <TabsContent value="plans">
                    <Card>
                        <CardContent className="p-0">
                            {plans.length === 0 ? (
                                <div className="py-12 text-center text-muted-foreground">
                                    <TrendingUp className="mx-auto h-12 w-12 opacity-50 mb-4" />
                                    <p>No investment plans yet</p>
                                    <Button variant="outline" className="mt-4" onClick={() => setShowCreateDialog(true)}>
                                        Create First Plan
                                    </Button>
                                </div>
                            ) : (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Plan</TableHead>
                                            <TableHead>Min/Max</TableHead>
                                            <TableHead>ROI</TableHead>
                                            <TableHead>Duration</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead className="text-right">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {plans.map((plan) => (
                                            <TableRow key={plan.id}>
                                                <TableCell>
                                                    <div>
                                                        <p className="font-medium">{plan.name}</p>
                                                        <p className="text-xs text-muted-foreground line-clamp-1">
                                                            {plan.description || "No description"}
                                                        </p>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="text-sm">
                                                        <p>{formatCurrency(plan.min_amount)}</p>
                                                        {plan.max_amount && (
                                                            <p className="text-muted-foreground">to {formatCurrency(plan.max_amount)}</p>
                                                        )}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant="secondary" className="bg-green-500/10 text-green-600">
                                                        {plan.roi_percentage}%
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>{plan.duration_days} days</TableCell>
                                                <TableCell>
                                                    <Badge variant={plan.is_active ? "default" : "secondary"}>
                                                        {plan.is_active ? "Active" : "Inactive"}
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
                                                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                            <DropdownMenuSeparator />
                                                            <DropdownMenuItem onClick={() => handleOpenEdit(plan)}>
                                                                <Edit className="mr-2 h-4 w-4" />
                                                                Edit
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem
                                                                onClick={() => handleDelete(plan.id)}
                                                                className="text-red-600"
                                                            >
                                                                <Trash2 className="mr-2 h-4 w-4" />
                                                                Delete
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
                </TabsContent>

                <TabsContent value="investments">
                    <Card>
                        <CardContent className="p-0">
                            {investments.length === 0 ? (
                                <div className="py-12 text-center text-muted-foreground">
                                    <Users className="mx-auto h-12 w-12 opacity-50 mb-4" />
                                    <p>No user investments yet</p>
                                </div>
                            ) : (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>User</TableHead>
                                            <TableHead>Plan</TableHead>
                                            <TableHead>Amount</TableHead>
                                            <TableHead>Expected Return</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead>Date</TableHead>
                                            <TableHead className="text-right">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {investments.map((inv) => (
                                            <TableRow key={inv.id}>
                                                <TableCell>
                                                    <div className="flex items-center gap-2">
                                                        <Avatar className="h-7 w-7">
                                                            <AvatarFallback className="text-xs">
                                                                {inv.user?.first_name?.[0]}{inv.user?.last_name?.[0]}
                                                            </AvatarFallback>
                                                        </Avatar>
                                                        <div>
                                                            <p className="font-medium text-sm">
                                                                {inv.user?.first_name} {inv.user?.last_name}
                                                            </p>
                                                            <p className="text-xs text-muted-foreground">{inv.user?.email}</p>
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <p className="font-medium">{inv.plan?.name}</p>
                                                    <p className="text-xs text-muted-foreground">{inv.plan?.roi_percentage}% ROI</p>
                                                </TableCell>
                                                <TableCell className="font-semibold">{formatCurrency(inv.amount)}</TableCell>
                                                <TableCell className="text-green-600">{formatCurrency(inv.expected_return)}</TableCell>
                                                <TableCell>
                                                    <Badge variant={inv.status === "active" ? "default" : "secondary"}>
                                                        {inv.status}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>{new Date(inv.created_at).toLocaleDateString()}</TableCell>
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
                                                            <DropdownMenuItem onClick={() => updateInvestmentStatus(inv.id, "matured")} className="text-green-600">
                                                                <CheckCircle2 className="mr-2 h-4 w-4" />
                                                                Mark as Matured
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem onClick={() => updateInvestmentStatus(inv.id, "withdrawn")}>
                                                                <DollarSign className="mr-2 h-4 w-4" />
                                                                Mark as Withdrawn
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem onClick={() => updateInvestmentStatus(inv.id, "cancelled")} className="text-red-600">
                                                                <XCircle className="mr-2 h-4 w-4" />
                                                                Cancel
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
                </TabsContent>
            </Tabs>

            {/* Create/Edit Dialog */}
            <Dialog open={showCreateDialog || !!editingPlan} onOpenChange={(open) => {
                if (!open) {
                    setShowCreateDialog(false);
                    setEditingPlan(null);
                    resetForm();
                }
            }}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{editingPlan ? "Edit Plan" : "Create Investment Plan"}</DialogTitle>
                        <DialogDescription>
                            {editingPlan ? "Update the investment plan details." : "Create a new investment plan for users."}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="space-y-2">
                            <Label>Plan Name *</Label>
                            <Input
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                placeholder="Gold Plan"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Description</Label>
                            <Textarea
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                placeholder="Plan description..."
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Min Amount ($) *</Label>
                                <Input
                                    type="number"
                                    value={formData.min_amount}
                                    onChange={(e) => setFormData({ ...formData, min_amount: e.target.value })}
                                    placeholder="1000"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Max Amount ($)</Label>
                                <Input
                                    type="number"
                                    value={formData.max_amount}
                                    onChange={(e) => setFormData({ ...formData, max_amount: e.target.value })}
                                    placeholder="50000"
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>ROI Percentage *</Label>
                                <Input
                                    type="number"
                                    value={formData.roi_percentage}
                                    onChange={(e) => setFormData({ ...formData, roi_percentage: e.target.value })}
                                    placeholder="15"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Duration (days) *</Label>
                                <Input
                                    type="number"
                                    value={formData.duration_days}
                                    onChange={(e) => setFormData({ ...formData, duration_days: e.target.value })}
                                    placeholder="30"
                                />
                            </div>
                        </div>
                        <div className="flex items-center space-x-2">
                            <Switch
                                checked={formData.is_active}
                                onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                            />
                            <Label>Active</Label>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => { setShowCreateDialog(false); setEditingPlan(null); }}>
                            Cancel
                        </Button>
                        <Button onClick={handleSubmit} disabled={submitting}>
                            {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {editingPlan ? "Update" : "Create"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
