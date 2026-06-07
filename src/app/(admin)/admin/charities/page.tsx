"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
    Plus,
    MoreHorizontal,
    Heart,
    DollarSign,
    Users,
    Edit,
    Trash2,
    Loader2,
    RefreshCw,
    Eye,
    Image,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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

interface Charity {
    id: string;
    name: string;
    description: string;
    category: string;
    image_url: string;
    goal_amount: number | null;
    total_donations: number;
    donor_count: number;
    is_active: boolean;
    created_at: string;
}

interface Donation {
    id: string;
    user_id: string;
    charity_id: string;
    amount: number;
    message: string;
    is_anonymous: boolean;
    created_at: string;
    user?: { id: string; first_name: string; last_name: string; email: string };
    charity?: { id: string; name: string; category: string };
}

interface Stats {
    totalCharities: number;
    activeCharities: number;
    totalDonations: number;
    totalDonated: number;
    uniqueDonors: number;
}

const CHARITY_CATEGORIES = [
    "Education",
    "Healthcare",
    "Environment",
    "Poverty Relief",
    "Disaster Relief",
    "Children",
    "Animals",
    "Arts & Culture",
    "Community",
    "Other",
];

export default function AdminCharitiesPage() {
    const [loading, setLoading] = useState(true);
    const [charities, setCharities] = useState<Charity[]>([]);
    const [donations, setDonations] = useState<Donation[]>([]);
    const [stats, setStats] = useState<Stats | null>(null);
    const [showCreateDialog, setShowCreateDialog] = useState(false);
    const [editingCharity, setEditingCharity] = useState<Charity | null>(null);
    const [submitting, setSubmitting] = useState(false);

    // Form state
    const [formData, setFormData] = useState({
        name: "",
        description: "",
        category: "",
        image_url: "",
        goal_amount: "",
        is_active: true,
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const response = await fetch("/api/admin/charities");
            if (response.ok) {
                const data = await response.json();
                setCharities(data.charities || []);
                setDonations(data.donations || []);
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
            category: "",
            image_url: "",
            goal_amount: "",
            is_active: true,
        });
    };

    const handleOpenEdit = (charity: Charity) => {
        setEditingCharity(charity);
        setFormData({
            name: charity.name,
            description: charity.description || "",
            category: charity.category,
            image_url: charity.image_url || "",
            goal_amount: charity.goal_amount?.toString() || "",
            is_active: charity.is_active,
        });
    };

    const handleSubmit = async () => {
        if (!formData.name || !formData.category) {
            toast.error("Please fill in name and category");
            return;
        }

        setSubmitting(true);
        try {
            if (editingCharity) {
                // Update existing charity
                const response = await fetch("/api/admin/charities", {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        charityId: editingCharity.id,
                        ...formData,
                    }),
                });

                if (response.ok) {
                    toast.success("Charity updated successfully");
                } else {
                    throw new Error("Failed to update");
                }
            } else {
                // Create new charity
                const response = await fetch("/api/admin/charities", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(formData),
                });

                if (response.ok) {
                    toast.success("Charity created successfully");
                } else {
                    throw new Error("Failed to create");
                }
            }

            setShowCreateDialog(false);
            setEditingCharity(null);
            resetForm();
            fetchData();
        } catch (error) {
            console.error("Error:", error);
            toast.error("Failed to save charity");
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (charityId: string) => {
        if (!confirm("Are you sure you want to delete this charity?")) return;

        try {
            const response = await fetch(`/api/admin/charities?charityId=${charityId}`, {
                method: "DELETE",
            });

            if (response.ok) {
                const data = await response.json();
                toast.success(data.message);
                fetchData();
            } else {
                const data = await response.json();
                toast.error(data.error || "Failed to delete");
            }
        } catch (error) {
            console.error("Error:", error);
            toast.error("Failed to delete charity");
        }
    };

    const toggleActive = async (charity: Charity) => {
        try {
            const response = await fetch("/api/admin/charities", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    charityId: charity.id,
                    is_active: !charity.is_active,
                }),
            });

            if (response.ok) {
                toast.success(`Charity ${!charity.is_active ? "activated" : "deactivated"}`);
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
                        Charities
                    </h1>
                    <p className="text-muted-foreground">
                        Manage charities and view donations.
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={fetchData}>
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Refresh
                    </Button>
                    <Button onClick={() => { resetForm(); setShowCreateDialog(true); }}>
                        <Plus className="mr-2 h-4 w-4" />
                        New Charity
                    </Button>
                </div>
            </motion.div>

            {/* Stats */}
            <div className="grid gap-4 md:grid-cols-5">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                            <Heart className="h-4 w-4 text-red-500" />
                            Total Charities
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats?.totalCharities || 0}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                            <Heart className="h-4 w-4 text-green-500" />
                            Active
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">{stats?.activeCharities || 0}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                            <DollarSign className="h-4 w-4 text-muted-foreground" />
                            Total Donations
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats?.totalDonations || 0}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                            <DollarSign className="h-4 w-4 text-green-500" />
                            Amount Donated
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatCurrency(stats?.totalDonated || 0)}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                            <Users className="h-4 w-4 text-blue-500" />
                            Unique Donors
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-blue-600">{stats?.uniqueDonors || 0}</div>
                    </CardContent>
                </Card>
            </div>

            {/* Tabs */}
            <Tabs defaultValue="charities" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="charities">Charities</TabsTrigger>
                    <TabsTrigger value="donations">Donations</TabsTrigger>
                </TabsList>

                <TabsContent value="charities">
                    <Card>
                        <CardContent className="p-0">
                            {charities.length === 0 ? (
                                <div className="py-12 text-center text-muted-foreground">
                                    <Heart className="mx-auto h-12 w-12 opacity-50 mb-4" />
                                    <p>No charities yet</p>
                                    <Button variant="outline" className="mt-4" onClick={() => setShowCreateDialog(true)}>
                                        Create First Charity
                                    </Button>
                                </div>
                            ) : (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Charity</TableHead>
                                            <TableHead>Category</TableHead>
                                            <TableHead>Goal</TableHead>
                                            <TableHead>Raised</TableHead>
                                            <TableHead>Donors</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead className="text-right">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {charities.map((charity) => (
                                            <TableRow key={charity.id}>
                                                <TableCell>
                                                    <div className="flex items-center gap-3">
                                                        {charity.image_url ? (
                                                            <img
                                                                src={charity.image_url}
                                                                alt={charity.name}
                                                                className="h-10 w-10 rounded-lg object-cover"
                                                            />
                                                        ) : (
                                                            <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
                                                                <Image className="h-5 w-5 text-muted-foreground" />
                                                            </div>
                                                        )}
                                                        <div>
                                                            <p className="font-medium">{charity.name}</p>
                                                            <p className="text-xs text-muted-foreground line-clamp-1">
                                                                {charity.description || "No description"}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant="outline">{charity.category}</Badge>
                                                </TableCell>
                                                <TableCell>
                                                    {charity.goal_amount ? formatCurrency(charity.goal_amount) : "-"}
                                                </TableCell>
                                                <TableCell className="font-semibold text-green-600">
                                                    {formatCurrency(charity.total_donations || 0)}
                                                </TableCell>
                                                <TableCell>{charity.donor_count || 0}</TableCell>
                                                <TableCell>
                                                    <Badge variant={charity.is_active ? "default" : "secondary"}>
                                                        {charity.is_active ? "Active" : "Inactive"}
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
                                                            <DropdownMenuItem onClick={() => handleOpenEdit(charity)}>
                                                                <Edit className="mr-2 h-4 w-4" />
                                                                Edit
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem onClick={() => toggleActive(charity)}>
                                                                {charity.is_active ? "Deactivate" : "Activate"}
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem
                                                                onClick={() => handleDelete(charity.id)}
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

                <TabsContent value="donations">
                    <Card>
                        <CardContent className="p-0">
                            {donations.length === 0 ? (
                                <div className="py-12 text-center text-muted-foreground">
                                    <DollarSign className="mx-auto h-12 w-12 opacity-50 mb-4" />
                                    <p>No donations yet</p>
                                </div>
                            ) : (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Donor</TableHead>
                                            <TableHead>Charity</TableHead>
                                            <TableHead>Amount</TableHead>
                                            <TableHead>Message</TableHead>
                                            <TableHead>Date</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {donations.map((donation) => (
                                            <TableRow key={donation.id}>
                                                <TableCell>
                                                    {donation.is_anonymous ? (
                                                        <span className="text-muted-foreground italic">Anonymous</span>
                                                    ) : (
                                                        <div className="flex items-center gap-2">
                                                            <Avatar className="h-7 w-7">
                                                                <AvatarFallback className="text-xs">
                                                                    {donation.user?.first_name?.[0]}{donation.user?.last_name?.[0]}
                                                                </AvatarFallback>
                                                            </Avatar>
                                                            <div>
                                                                <p className="font-medium text-sm">
                                                                    {donation.user?.first_name} {donation.user?.last_name}
                                                                </p>
                                                                <p className="text-xs text-muted-foreground">{donation.user?.email}</p>
                                                            </div>
                                                        </div>
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    <p className="font-medium">{donation.charity?.name}</p>
                                                    <p className="text-xs text-muted-foreground">{donation.charity?.category}</p>
                                                </TableCell>
                                                <TableCell className="font-semibold text-green-600">
                                                    {formatCurrency(donation.amount)}
                                                </TableCell>
                                                <TableCell className="max-w-xs">
                                                    <p className="text-sm text-muted-foreground truncate">
                                                        {donation.message || "-"}
                                                    </p>
                                                </TableCell>
                                                <TableCell>{new Date(donation.created_at).toLocaleDateString()}</TableCell>
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
            <Dialog open={showCreateDialog || !!editingCharity} onOpenChange={(open) => {
                if (!open) {
                    setShowCreateDialog(false);
                    setEditingCharity(null);
                    resetForm();
                }
            }}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{editingCharity ? "Edit Charity" : "Create Charity"}</DialogTitle>
                        <DialogDescription>
                            {editingCharity ? "Update charity details." : "Add a new charity for donations."}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="space-y-2">
                            <Label>Name *</Label>
                            <Input
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                placeholder="Red Cross"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Description</Label>
                            <Textarea
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                placeholder="Helping communities worldwide..."
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Category *</Label>
                                <Select
                                    value={formData.category}
                                    onValueChange={(value) => setFormData({ ...formData, category: value })}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select category" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {CHARITY_CATEGORIES.map((cat) => (
                                            <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Goal Amount ($)</Label>
                                <Input
                                    type="number"
                                    value={formData.goal_amount}
                                    onChange={(e) => setFormData({ ...formData, goal_amount: e.target.value })}
                                    placeholder="100000"
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>Image URL</Label>
                            <Input
                                value={formData.image_url}
                                onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                                placeholder="https://example.com/image.jpg"
                            />
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
                        <Button variant="outline" onClick={() => { setShowCreateDialog(false); setEditingCharity(null); }}>
                            Cancel
                        </Button>
                        <Button onClick={handleSubmit} disabled={submitting}>
                            {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {editingCharity ? "Update" : "Create"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
