"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import {
    Building2,
    Palette,
    Bell,
    Shield,
    Loader2,
    Save,
    ArrowDownUp,
    Trash2,
    Plus,
    Edit,
    Check,
    X,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
);

const bankInfoSchema = z.object({
    bankName: z.string().min(1, "Bank name is required"),
    tagline: z.string().optional(),
    contactEmail: z.string().email("Invalid email").optional().or(z.literal("")),
    contactPhone: z.string().optional(),
    address: z.string().optional(),
    website: z.string().url("Invalid URL").optional().or(z.literal("")),
});

type BankInfoData = z.infer<typeof bankInfoSchema>;

interface BankSettings {
    id: string;
    key: string;
    value: string;
}

interface ExchangeRate {
    id: string;
    from_currency: string;
    to_currency: string;
    rate: number;
    is_active: boolean;
    updated_at: string;
}

const CURRENCIES = ["USD", "BTC", "ETH", "USDT", "USDC", "EUR", "GBP"];

export default function AdminSettingsPage() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [settings, setSettings] = useState<Record<string, string>>({});
    const [featureSettings, setFeatureSettings] = useState({
        maintenanceMode: false,
        allowRegistration: true,
        allowDeposits: true,
        allowWithdrawals: true,
        allowTransfers: true,
        allowLoans: true,
        allowInvestments: true,
        requireKYC: true,
        require2FA: false,
        requireTransferOTP: false,
        autoTransferApproval: false,
    });

    const [alertSettings, setAlertSettings] = useState({
        largeTransactionAlert: "10000",
        dailyWithdrawalLimit: "50000",
        lowBalanceAlert: "100",
        autoTransferThreshold: "100000",
    });

    const [securitySettings, setSecuritySettings] = useState({
        sessionTimeout: "30",
        maxLoginAttempts: "5",
    });

    // Exchange rates state
    const [rates, setRates] = useState<ExchangeRate[]>([]);
    const [ratesLoading, setRatesLoading] = useState(false);
    const [ratesSaving, setRatesSaving] = useState(false);
    const [editingRateId, setEditingRateId] = useState<string | null>(null);
    const [editingRateValue, setEditingRateValue] = useState("");
    const [newRate, setNewRate] = useState({ from: "USD", to: "BTC", rate: "" });
    const [showAddRate, setShowAddRate] = useState(false);

    const form = useForm<BankInfoData>({
        resolver: zodResolver(bankInfoSchema),
        defaultValues: {
            bankName: "Monvana Bank",
            tagline: "Your trusted financial partner",
            contactEmail: "",
            contactPhone: "",
            address: "",
            website: "",
        },
    });

    useEffect(() => {
        fetchSettings();
        fetchRates();
    }, []);

    const fetchRates = async () => {
        setRatesLoading(true);
        try {
            const res = await fetch("/api/admin/exchange-rates");
            if (res.ok) {
                const data = await res.json();
                setRates(data.rates || []);
            }
        } catch (error) {
            console.error("Error fetching rates:", error);
        } finally {
            setRatesLoading(false);
        }
    };

    const handleAddRate = async () => {
        if (!newRate.from || !newRate.to || !newRate.rate || parseFloat(newRate.rate) <= 0) {
            toast.error("Please fill in all fields with valid values");
            return;
        }
        setRatesSaving(true);
        try {
            const res = await fetch("/api/admin/exchange-rates", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ from_currency: newRate.from, to_currency: newRate.to, rate: parseFloat(newRate.rate) }),
            });
            const data = await res.json();
            if (res.ok) {
                toast.success("Exchange rate added");
                setNewRate({ from: "USD", to: "BTC", rate: "" });
                setShowAddRate(false);
                fetchRates();
            } else {
                toast.error(data.error || "Failed to add rate");
            }
        } catch { toast.error("Failed to add rate"); }
        finally { setRatesSaving(false); }
    };

    const handleUpdateRate = async (id: string) => {
        if (!editingRateValue || parseFloat(editingRateValue) <= 0) return;
        setRatesSaving(true);
        try {
            const res = await fetch("/api/admin/exchange-rates", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id, rate: parseFloat(editingRateValue) }),
            });
            if (res.ok) {
                toast.success("Rate updated");
                setEditingRateId(null);
                fetchRates();
            } else {
                toast.error("Failed to update rate");
            }
        } catch { toast.error("Failed to update rate"); }
        finally { setRatesSaving(false); }
    };

    const handleToggleRate = async (id: string, is_active: boolean) => {
        try {
            await fetch("/api/admin/exchange-rates", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id, is_active }),
            });
            setRates(prev => prev.map(r => r.id === id ? { ...r, is_active } : r));
            toast.success(is_active ? "Rate activated" : "Rate deactivated");
        } catch { toast.error("Failed to toggle rate"); }
    };

    const handleDeleteRate = async (id: string) => {
        try {
            const res = await fetch(`/api/admin/exchange-rates?id=${id}`, { method: "DELETE" });
            if (res.ok) {
                toast.success("Rate deleted");
                setRates(prev => prev.filter(r => r.id !== id));
            } else {
                toast.error("Failed to delete rate");
            }
        } catch { toast.error("Failed to delete rate"); }
    };

    const fetchSettings = async () => {
        try {
            const { data } = await supabase
                .from("bank_settings")
                .select("*");

            if (data) {
                const settingsMap: Record<string, string> = {};
                data.forEach((s: BankSettings) => {
                    settingsMap[s.key] = s.value;
                });
                setSettings(settingsMap);

                // Populate form with fetched data
                form.reset({
                    bankName: settingsMap.bank_name || "Monvana Bank",
                    tagline: settingsMap.tagline || "Your trusted financial partner",
                    contactEmail: settingsMap.contact_email || "",
                    contactPhone: settingsMap.contact_phone || "",
                    address: settingsMap.address || "",
                    website: settingsMap.website || "",
                });

                // Populate feature settings
                setFeatureSettings({
                    maintenanceMode: settingsMap.maintenance_mode === "true",
                    allowRegistration: settingsMap.allow_registration !== "false",
                    allowDeposits: settingsMap.allow_deposits !== "false",
                    allowWithdrawals: settingsMap.allow_withdrawals !== "false",
                    allowTransfers: settingsMap.allow_transfers !== "false",
                    allowLoans: settingsMap.allow_loans !== "false",
                    allowInvestments: settingsMap.allow_investments !== "false",
                    requireKYC: settingsMap.require_kyc !== "false",
                    require2FA: settingsMap.require_2fa === "true",
                    requireTransferOTP: settingsMap.transfer_otp === "true",
                    autoTransferApproval: settingsMap.auto_transfer_approval === "true",
                });

                // Populate alert settings
                setAlertSettings({
                    largeTransactionAlert: settingsMap.large_transaction_alert || "10000",
                    dailyWithdrawalLimit: settingsMap.daily_withdrawal_limit || "50000",
                    lowBalanceAlert: settingsMap.low_balance_alert || "100",
                    autoTransferThreshold: settingsMap.auto_transfer_threshold || "100000",
                });

                // Populate security settings
                setSecuritySettings({
                    sessionTimeout: settingsMap.session_timeout || "30",
                    maxLoginAttempts: settingsMap.max_login_attempts || "5",
                });
            }
        } catch (error) {
            console.error("Error fetching settings:", error);
            // Table might not exist, use defaults
        } finally {
            setLoading(false);
        }
    };
    const saveSetting = async (key: string, value: string) => {
        try {
            const res = await fetch("/api/admin/settings", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ key, value }),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || "Failed to save setting");
            }
        } catch (error) {
            console.error("Error saving setting:", error);
            throw error;
        }
    };

    const onSubmit = async (data: BankInfoData) => {
        setSaving(true);
        try {
            await saveSetting("bank_name", data.bankName);
            await saveSetting("tagline", data.tagline || "");
            await saveSetting("contact_email", data.contactEmail || "");
            await saveSetting("contact_phone", data.contactPhone || "");
            await saveSetting("address", data.address || "");
            await saveSetting("website", data.website || "");

            toast.success("Bank information updated");
        } catch (error) {
            console.error("Error saving settings:", error);
            toast.error("Failed to save settings");
        } finally {
            setSaving(false);
        }
    };

    const handleFeatureToggle = async (key: string, value: boolean) => {
        setFeatureSettings(prev => ({ ...prev, [key]: value }));

        const KEY_MAP: Record<string, string> = {
            requireTransferOTP: "transfer_otp",
            require2FA: "require_2fa",
            requireKYC: "require_kyc",
            autoTransferApproval: "auto_transfer_approval",
        };

        const dbKey = KEY_MAP[key] || key.replace(/([A-Z])/g, "_$1").toLowerCase();
        try {
            await saveSetting(dbKey, value.toString());
            toast.success(`Setting '${key}' updated`);
        } catch (error) {
            console.error("Error saving feature toggle:", error);
            toast.error("Failed to save setting");
        }
    };

    const handleSaveSecurity = async () => {
        setSaving(true);
        try {
            await saveSetting("session_timeout", securitySettings.sessionTimeout);
            await saveSetting("max_login_attempts", securitySettings.maxLoginAttempts);
            toast.success("Security settings updated");
        } catch (error) {
            console.error("Error saving security settings:", error);
            toast.error("Failed to save security settings");
        } finally {
            setSaving(false);
        }
    };

    const handleSaveAlerts = async () => {
        setSaving(true);
        try {
            await saveSetting("large_transaction_alert", alertSettings.largeTransactionAlert);
            await saveSetting("daily_withdrawal_limit", alertSettings.dailyWithdrawalLimit);
            await saveSetting("low_balance_alert", alertSettings.lowBalanceAlert);
            await saveSetting("auto_transfer_threshold", alertSettings.autoTransferThreshold);
            toast.success("Alert & Automation settings updated");
        } catch (error) {
            console.error("Error saving alert settings:", error);
            toast.error("Failed to save alert settings");
        } finally {
            setSaving(false);
        }
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
                    Bank Settings
                </h1>
                <p className="text-muted-foreground">
                    Configure your banking platform settings.
                </p>
            </motion.div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.1 }}
            >
                <Tabs defaultValue="general" className="space-y-6">
                    <TabsList className="grid w-full grid-cols-5 lg:w-[520px]">
                        <TabsTrigger value="general">
                            <Building2 className="mr-2 h-4 w-4" />
                            General
                        </TabsTrigger>
                        <TabsTrigger value="rates">
                            <ArrowDownUp className="mr-2 h-4 w-4" />
                            Rates
                        </TabsTrigger>
                        <TabsTrigger value="features">
                            <Palette className="mr-2 h-4 w-4" />
                            Features
                        </TabsTrigger>
                        <TabsTrigger value="notifications">
                            <Bell className="mr-2 h-4 w-4" />
                            Alerts
                        </TabsTrigger>
                        <TabsTrigger value="security">
                            <Shield className="mr-2 h-4 w-4" />
                            Security
                        </TabsTrigger>
                    </TabsList>

                    {/* General Settings */}
                    <TabsContent value="general">
                        <Card>
                            <CardHeader>
                                <CardTitle>Bank Information</CardTitle>
                                <CardDescription>
                                    Basic information about your banking institution.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                                    <div className="grid gap-4 md:grid-cols-2">
                                        <div className="space-y-2">
                                            <Label htmlFor="bankName">Bank Name</Label>
                                            <Input
                                                id="bankName"
                                                {...form.register("bankName")}
                                            />
                                            {form.formState.errors.bankName && (
                                                <p className="text-xs text-destructive">
                                                    {form.formState.errors.bankName.message}
                                                </p>
                                            )}
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="tagline">Tagline</Label>
                                            <Input
                                                id="tagline"
                                                {...form.register("tagline")}
                                            />
                                        </div>
                                    </div>
                                    <div className="grid gap-4 md:grid-cols-2">
                                        <div className="space-y-2">
                                            <Label htmlFor="contactEmail">Contact Email</Label>
                                            <Input
                                                id="contactEmail"
                                                type="email"
                                                {...form.register("contactEmail")}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="contactPhone">Contact Phone</Label>
                                            <Input
                                                id="contactPhone"
                                                {...form.register("contactPhone")}
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="address">Address</Label>
                                        <Input
                                            id="address"
                                            {...form.register("address")}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="website">Website</Label>
                                        <Input
                                            id="website"
                                            {...form.register("website")}
                                            placeholder="https://"
                                        />
                                    </div>
                                    <Button type="submit" disabled={saving}>
                                        {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        <Save className="mr-2 h-4 w-4" />
                                        Save Changes
                                    </Button>
                                </form>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Exchange Rates */}
                    <TabsContent value="rates">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between">
                                <div>
                                    <CardTitle>Exchange Rates</CardTitle>
                                    <CardDescription>Manage currency conversion rates for wallet swaps.</CardDescription>
                                </div>
                                <Button size="sm" onClick={() => setShowAddRate(!showAddRate)}>
                                    <Plus className="mr-2 h-4 w-4" />
                                    Add Rate
                                </Button>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {/* Add new rate form */}
                                {showAddRate && (
                                    <div className="p-4 border rounded-lg bg-stone-50 dark:bg-stone-900 space-y-3">
                                        <div className="grid grid-cols-3 gap-3">
                                            <div className="space-y-1">
                                                <Label className="text-xs">From</Label>
                                                <Select value={newRate.from} onValueChange={(v) => setNewRate({ ...newRate, from: v })}>
                                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                                    <SelectContent>
                                                        {CURRENCIES.filter(c => c !== newRate.to).map(c => (
                                                            <SelectItem key={c} value={c}>{c}</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="space-y-1">
                                                <Label className="text-xs">To</Label>
                                                <Select value={newRate.to} onValueChange={(v) => setNewRate({ ...newRate, to: v })}>
                                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                                    <SelectContent>
                                                        {CURRENCIES.filter(c => c !== newRate.from).map(c => (
                                                            <SelectItem key={c} value={c}>{c}</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="space-y-1">
                                                <Label className="text-xs">Rate</Label>
                                                <Input
                                                    type="number"
                                                    step="any"
                                                    value={newRate.rate}
                                                    onChange={(e) => setNewRate({ ...newRate, rate: e.target.value })}
                                                    placeholder="0.00"
                                                />
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <Button size="sm" onClick={handleAddRate} disabled={ratesSaving}>
                                                {ratesSaving && <Loader2 className="mr-2 h-3 w-3 animate-spin" />}
                                                Save
                                            </Button>
                                            <Button size="sm" variant="outline" onClick={() => setShowAddRate(false)}>Cancel</Button>
                                        </div>
                                    </div>
                                )}

                                {/* Rates table */}
                                {ratesLoading ? (
                                    <div className="flex justify-center py-8">
                                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                                    </div>
                                ) : rates.length === 0 ? (
                                    <p className="text-center text-muted-foreground py-8">No exchange rates configured yet.</p>
                                ) : (
                                    <div className="border rounded-lg overflow-hidden">
                                        <table className="w-full text-sm">
                                            <thead className="bg-stone-50 dark:bg-stone-900">
                                                <tr>
                                                    <th className="text-left p-3 font-medium">Pair</th>
                                                    <th className="text-left p-3 font-medium">Rate</th>
                                                    <th className="text-left p-3 font-medium">Status</th>
                                                    <th className="text-right p-3 font-medium">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y">
                                                {rates.map((rate) => (
                                                    <tr key={rate.id} className="hover:bg-stone-50 dark:hover:bg-stone-900/50">
                                                        <td className="p-3 font-medium">
                                                            {rate.from_currency} → {rate.to_currency}
                                                        </td>
                                                        <td className="p-3">
                                                            {editingRateId === rate.id ? (
                                                                <div className="flex items-center gap-1">
                                                                    <Input
                                                                        type="number"
                                                                        step="any"
                                                                        value={editingRateValue}
                                                                        onChange={(e) => setEditingRateValue(e.target.value)}
                                                                        className="h-8 w-32"
                                                                        autoFocus
                                                                    />
                                                                    <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => handleUpdateRate(rate.id)} disabled={ratesSaving}>
                                                                        <Check className="h-4 w-4 text-green-600" />
                                                                    </Button>
                                                                    <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setEditingRateId(null)}>
                                                                        <X className="h-4 w-4" />
                                                                    </Button>
                                                                </div>
                                                            ) : (
                                                                <span className="font-mono">{parseFloat(rate.rate as unknown as string).toFixed(8).replace(/0+$/, '').replace(/\.$/, '')}</span>
                                                            )}
                                                        </td>
                                                        <td className="p-3">
                                                            <Switch
                                                                checked={rate.is_active}
                                                                onCheckedChange={(v) => handleToggleRate(rate.id, v)}
                                                            />
                                                        </td>
                                                        <td className="p-3 text-right">
                                                            <div className="flex items-center justify-end gap-1">
                                                                <Button
                                                                    size="icon"
                                                                    variant="ghost"
                                                                    className="h-8 w-8"
                                                                    onClick={() => { setEditingRateId(rate.id); setEditingRateValue(rate.rate.toString()); }}
                                                                >
                                                                    <Edit className="h-4 w-4" />
                                                                </Button>
                                                                <Button
                                                                    size="icon"
                                                                    variant="ghost"
                                                                    className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                                                                    onClick={() => handleDeleteRate(rate.id)}
                                                                >
                                                                    <Trash2 className="h-4 w-4" />
                                                                </Button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Feature Settings */}
                    <TabsContent value="features">
                        <Card>
                            <CardHeader>
                                <CardTitle>Platform Features</CardTitle>
                                <CardDescription>
                                    Enable or disable platform features.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="font-medium">Maintenance Mode</p>
                                        <p className="text-sm text-muted-foreground">
                                            Temporarily disable the platform for maintenance
                                        </p>
                                    </div>
                                    <Switch
                                        checked={featureSettings.maintenanceMode}
                                        onCheckedChange={(v) => handleFeatureToggle("maintenanceMode", v)}
                                    />
                                </div>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="font-medium">Allow Registration</p>
                                        <p className="text-sm text-muted-foreground">
                                            Allow new users to register
                                        </p>
                                    </div>
                                    <Switch
                                        checked={featureSettings.allowRegistration}
                                        onCheckedChange={(v) => handleFeatureToggle("allowRegistration", v)}
                                    />
                                </div>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="font-medium">Allow Deposits</p>
                                        <p className="text-sm text-muted-foreground">
                                            Allow users to make deposits
                                        </p>
                                    </div>
                                    <Switch
                                        checked={featureSettings.allowDeposits}
                                        onCheckedChange={(v) => handleFeatureToggle("allowDeposits", v)}
                                    />
                                </div>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="font-medium">Allow Withdrawals</p>
                                        <p className="text-sm text-muted-foreground">
                                            Allow users to make withdrawals
                                        </p>
                                    </div>
                                    <Switch
                                        checked={featureSettings.allowWithdrawals}
                                        onCheckedChange={(v) => handleFeatureToggle("allowWithdrawals", v)}
                                    />
                                </div>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="font-medium">Allow Transfers</p>
                                        <p className="text-sm text-muted-foreground">
                                            Allow users to transfer funds
                                        </p>
                                    </div>
                                    <Switch
                                        checked={featureSettings.allowTransfers}
                                        onCheckedChange={(v) => handleFeatureToggle("allowTransfers", v)}
                                    />
                                </div>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="font-medium">Allow Loans</p>
                                        <p className="text-sm text-muted-foreground">
                                            Allow users to apply for loans
                                        </p>
                                    </div>
                                    <Switch
                                        checked={featureSettings.allowLoans}
                                        onCheckedChange={(v) => handleFeatureToggle("allowLoans", v)}
                                    />
                                </div>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="font-medium">Allow Investments</p>
                                        <p className="text-sm text-muted-foreground">
                                            Allow users to make investments
                                        </p>
                                    </div>
                                    <Switch
                                        checked={featureSettings.allowInvestments}
                                        onCheckedChange={(v) => handleFeatureToggle("allowInvestments", v)}
                                    />
                                </div>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="font-medium">Automated Transfer Approval</p>
                                        <p className="text-sm text-muted-foreground">
                                            Bypass admin review for transfers below threshold
                                        </p>
                                    </div>
                                    <Switch
                                        checked={featureSettings.autoTransferApproval}
                                        onCheckedChange={(v) => handleFeatureToggle("autoTransferApproval", v)}
                                    />
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Notification Settings */}
                    <TabsContent value="notifications">
                        <Card>
                            <CardHeader>
                                <CardTitle>Alert Settings</CardTitle>
                                <CardDescription>
                                    Configure notification thresholds and alerts.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label>Large Transaction Alert ($)</Label>
                                    <Input
                                        type="number"
                                        value={alertSettings.largeTransactionAlert}
                                        onChange={(e) => setAlertSettings(prev => ({ ...prev, largeTransactionAlert: e.target.value }))}
                                        placeholder="Amount that triggers alert"
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        Alert admins when a transaction exceeds this amount
                                    </p>
                                </div>
                                <div className="space-y-2">
                                    <Label>Daily Withdrawal Limit ($)</Label>
                                    <Input
                                        type="number"
                                        value={alertSettings.dailyWithdrawalLimit}
                                        onChange={(e) => setAlertSettings(prev => ({ ...prev, dailyWithdrawalLimit: e.target.value }))}
                                        placeholder="Daily limit"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Low Balance Alert ($)</Label>
                                    <Input
                                        type="number"
                                        value={alertSettings.lowBalanceAlert}
                                        onChange={(e) => setAlertSettings(prev => ({ ...prev, lowBalanceAlert: e.target.value }))}
                                        placeholder="Threshold"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Auto-Transfer Threshold ($)</Label>
                                    <Input
                                        type="number"
                                        value={alertSettings.autoTransferThreshold}
                                        onChange={(e) => setAlertSettings(prev => ({ ...prev, autoTransferThreshold: e.target.value }))}
                                        placeholder="100000"
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        Transfers below this amount will be auto-approved (if enabled)
                                    </p>
                                </div>
                                <Button onClick={handleSaveAlerts} disabled={saving}>
                                    {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    <Save className="mr-2 h-4 w-4" />
                                    Save Alert Settings
                                </Button>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Security Settings */}
                    <TabsContent value="security">
                        <Card>
                            <CardHeader>
                                <CardTitle>Security Settings</CardTitle>
                                <CardDescription>
                                    Configure security requirements.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="font-medium">Require KYC Verification</p>
                                        <p className="text-sm text-muted-foreground">
                                            Require identity verification for transactions
                                        </p>
                                    </div>
                                    <Switch
                                        checked={featureSettings.requireKYC}
                                        onCheckedChange={(v) => handleFeatureToggle("requireKYC", v)}
                                    />
                                </div>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="font-medium">Require 2FA</p>
                                        <p className="text-sm text-muted-foreground">
                                            Require two-factor authentication for all users
                                        </p>
                                    </div>
                                    <Switch
                                        checked={featureSettings.require2FA}
                                        onCheckedChange={(v) => handleFeatureToggle("require2FA", v)}
                                    />
                                </div>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="font-medium">Require OTP for Transfers</p>
                                        <p className="text-sm text-muted-foreground">
                                            Send a 6-7 digit code to user email before transfers
                                        </p>
                                    </div>
                                    <Switch
                                        checked={featureSettings.requireTransferOTP}
                                        onCheckedChange={(v) => handleFeatureToggle("requireTransferOTP", v)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Session Timeout (minutes)</Label>
                                    <Input
                                        type="number"
                                        value={securitySettings.sessionTimeout}
                                        onChange={(e) => setSecuritySettings(prev => ({ ...prev, sessionTimeout: e.target.value }))}
                                        placeholder="Minutes"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Max Login Attempts</Label>
                                    <Input
                                        type="number"
                                        value={securitySettings.maxLoginAttempts}
                                        onChange={(e) => setSecuritySettings(prev => ({ ...prev, maxLoginAttempts: e.target.value }))}
                                        placeholder="Attempts before lockout"
                                    />
                                </div>
                                <Button onClick={handleSaveSecurity} disabled={saving}>
                                    {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    <Save className="mr-2 h-4 w-4" />
                                    Save Security Settings
                                </Button>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </motion.div>
        </div>
    );
}
