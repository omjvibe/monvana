"use client";

import { useState, useEffect } from "react";
import { useUser } from "@/hooks/useAuth";
import { motion } from "framer-motion";
import { Loader2, User, Lock, Bell, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
);

interface UserProfile {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    phone?: string;
    country?: string;
    occupation?: string;
}

export default function SettingsPage() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [userId, setUserId] = useState<string | null>(null);

    // Profile form
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [phone, setPhone] = useState("");

    // PIN form
    const [currentPin, setCurrentPin] = useState("");
    const [newPin, setNewPin] = useState("");
    const [confirmPin, setConfirmPin] = useState("");

    const { user: clerkUser, isLoaded } = useUser();

    useEffect(() => {
        async function fetchData() {
            if (!clerkUser?.id) return;

            try {
                const { data: userData } = await supabase
                    .from("users")
                    .select("*")
                    .eq("clerk_id", clerkUser.id)
                    .single();

                if (userData) {
                    setUserId(userData.id);
                    setProfile(userData);
                    setFirstName(userData.first_name || "");
                    setLastName(userData.last_name || "");
                    setPhone(userData.phone || "");
                }
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

    const handleSaveProfile = async () => {
        if (!userId) return;

        setSaving(true);

        try {
            const { error } = await supabase
                .from("users")
                .update({
                    first_name: firstName,
                    last_name: lastName,
                    phone: phone || null,
                })
                .eq("id", userId);

            if (error) throw error;

            toast.success("Profile updated successfully!");
        } catch (error) {
            console.error("Error updating profile:", error);
            toast.error("Failed to update profile");
        } finally {
            setSaving(false);
        }
    };

    const handleChangePin = async () => {
        if (!userId) return;

        if (newPin.length !== 4 || !/^\d{4}$/.test(newPin)) {
            toast.error("PIN must be exactly 4 digits");
            return;
        }

        if (newPin !== confirmPin) {
            toast.error("PINs do not match");
            return;
        }

        setSaving(true);

        try {
            // Verify current PIN
            const { data: userData } = await supabase
                .from("users")
                .select("transaction_pin")
                .eq("id", userId)
                .single();

            if (userData?.transaction_pin !== currentPin) {
                toast.error("Current PIN is incorrect");
                setSaving(false);
                return;
            }

            // Update PIN
            const { error } = await supabase
                .from("users")
                .update({ transaction_pin: newPin })
                .eq("id", userId);

            if (error) throw error;

            toast.success("PIN changed successfully!");
            setCurrentPin("");
            setNewPin("");
            setConfirmPin("");
        } catch (error) {
            console.error("Error changing PIN:", error);
            toast.error("Failed to change PIN");
        } finally {
            setSaving(false);
        }
    };

    if (loading || !isLoaded) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-stone-400" />
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
            >
                <h1 className="text-2xl font-bold text-stone-900 dark:text-stone-100">
                    Settings
                </h1>
                <p className="text-stone-600 dark:text-stone-400">
                    Manage your account settings and preferences
                </p>
            </motion.div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
            >
                <Tabs defaultValue="profile" className="space-y-6">
                    <TabsList className="grid w-full grid-cols-3 lg:w-auto lg:inline-grid">
                        <TabsTrigger value="profile" className="gap-2">
                            <User className="h-4 w-4" />
                            <span className="hidden sm:inline">Profile</span>
                        </TabsTrigger>
                        <TabsTrigger value="security" className="gap-2">
                            <Lock className="h-4 w-4" />
                            <span className="hidden sm:inline">Security</span>
                        </TabsTrigger>
                        <TabsTrigger value="notifications" className="gap-2">
                            <Bell className="h-4 w-4" />
                            <span className="hidden sm:inline">Notifications</span>
                        </TabsTrigger>
                    </TabsList>

                    {/* Profile Tab */}
                    <TabsContent value="profile">
                        <Card>
                            <CardHeader>
                                <CardTitle>Profile Information</CardTitle>
                                <CardDescription>
                                    Update your personal details
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid gap-4 md:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label>First Name</Label>
                                        <Input
                                            value={firstName}
                                            disabled
                                            className="bg-stone-50 dark:bg-stone-900 opacity-70 cursor-not-allowed"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Last Name</Label>
                                        <Input
                                            value={lastName}
                                            disabled
                                            className="bg-stone-50 dark:bg-stone-900 opacity-70 cursor-not-allowed"
                                        />
                                    </div>
                                </div>
                                <p className="text-xs text-stone-500 -mt-2">
                                    Legal names cannot be changed after registration for security and compliance.
                                </p>
                                <div className="space-y-2">
                                    <Label>Email</Label>
                                    <Input
                                        value={profile?.email || ""}
                                        disabled
                                        className="bg-stone-50 dark:bg-stone-900"
                                    />
                                    <p className="text-xs text-stone-500">
                                        Email cannot be changed here. Contact support if needed.
                                    </p>
                                </div>
                                <div className="space-y-2">
                                    <Label>Phone Number</Label>
                                    <Input
                                        value={phone}
                                        onChange={(e) => setPhone(e.target.value)}
                                        placeholder="+1 (555) 123-4567"
                                    />
                                </div>
                                <div className="grid gap-4 md:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label>Country</Label>
                                        <Input
                                            value={profile?.country || ""}
                                            disabled
                                            className="bg-stone-50 dark:bg-stone-900"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Occupation</Label>
                                        <Input
                                            value={profile?.occupation || ""}
                                            disabled
                                            className="bg-stone-50 dark:bg-stone-900"
                                        />
                                    </div>
                                </div>
                                <Button onClick={handleSaveProfile} disabled={saving}>
                                    {saving ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Saving...
                                        </>
                                    ) : (
                                        "Save Changes"
                                    )}
                                </Button>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Security Tab */}
                    <TabsContent value="security">
                        <Card>
                            <CardHeader>
                                <CardTitle>Transaction PIN</CardTitle>
                                <CardDescription>
                                    Change your 4-digit transaction PIN
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label>Current PIN</Label>
                                    <Input
                                        type="password"
                                        placeholder="••••"
                                        value={currentPin}
                                        onChange={(e) => setCurrentPin(e.target.value.slice(0, 4))}
                                        maxLength={4}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>New PIN</Label>
                                    <Input
                                        type="password"
                                        placeholder="••••"
                                        value={newPin}
                                        onChange={(e) => setNewPin(e.target.value.slice(0, 4))}
                                        maxLength={4}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Confirm New PIN</Label>
                                    <Input
                                        type="password"
                                        placeholder="••••"
                                        value={confirmPin}
                                        onChange={(e) => setConfirmPin(e.target.value.slice(0, 4))}
                                        maxLength={4}
                                    />
                                </div>
                                <Button onClick={handleChangePin} disabled={saving}>
                                    {saving ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Changing...
                                        </>
                                    ) : (
                                        "Change PIN"
                                    )}
                                </Button>
                            </CardContent>
                        </Card>

                        <Card className="mt-6">
                            <CardHeader>
                                <CardTitle>Two-Factor Authentication</CardTitle>
                                <CardDescription>
                                    Add an extra layer of security to your account
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="font-medium text-stone-900 dark:text-stone-100">
                                            Email Authentication
                                        </p>
                                        <p className="text-sm text-stone-500">
                                            Receive verification codes via email
                                        </p>
                                    </div>
                                    <Switch checked disabled />
                                </div>
                                <p className="mt-4 text-xs text-stone-500">
                                    Two-factor authentication is enabled for your account by default.
                                </p>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Notifications Tab */}
                    <TabsContent value="notifications">
                        <Card>
                            <CardHeader>
                                <CardTitle>Email Notifications</CardTitle>
                                <CardDescription>
                                    Choose what emails you receive
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="font-medium text-stone-900 dark:text-stone-100">
                                            Transaction Alerts
                                        </p>
                                        <p className="text-sm text-stone-500">
                                            Get notified for all transactions
                                        </p>
                                    </div>
                                    <Switch defaultChecked />
                                </div>
                                <Separator />
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="font-medium text-stone-900 dark:text-stone-100">
                                            Security Alerts
                                        </p>
                                        <p className="text-sm text-stone-500">
                                            Login attempts and password changes
                                        </p>
                                    </div>
                                    <Switch defaultChecked />
                                </div>
                                <Separator />
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="font-medium text-stone-900 dark:text-stone-100">
                                            Marketing Emails
                                        </p>
                                        <p className="text-sm text-stone-500">
                                            News, offers, and promotions
                                        </p>
                                    </div>
                                    <Switch />
                                </div>
                                <Separator />
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="font-medium text-stone-900 dark:text-stone-100">
                                            Weekly Summary
                                        </p>
                                        <p className="text-sm text-stone-500">
                                            Weekly account activity summary
                                        </p>
                                    </div>
                                    <Switch defaultChecked />
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </motion.div>
        </div>
    );
}
