"use client";

import { useState, useEffect } from "react";
import { useUser } from "@/hooks/useAuth";
import { motion } from "framer-motion";
import { Loader2, Heart, Search, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
);

interface Charity {
    id: string;
    name: string;
    description?: string;
    category?: string;
    image_url?: string;
    total_donations: number;
    donor_count: number;
}

interface Donation {
    id: string;
    amount: number;
    message?: string;
    created_at: string;
    charity: Charity;
}

export default function CharitiesPage() {
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [charities, setCharities] = useState<Charity[]>([]);
    const [donations, setDonations] = useState<Donation[]>([]);
    const [selectedCharity, setSelectedCharity] = useState<Charity | null>(null);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [userId, setUserId] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState("");

    // Donation form
    const [donationAmount, setDonationAmount] = useState("");
    const [donationMessage, setDonationMessage] = useState("");

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

                    // Fetch user's donations
                    const { data: donationData } = await supabase
                        .from("donations")
                        .select("*, charity:charities(*)")
                        .eq("user_id", userData.id)
                        .order("created_at", { ascending: false });

                    setDonations(donationData || []);
                }

                // Fetch all active charities
                const { data: charityData } = await supabase
                    .from("charities")
                    .select("*")
                    .eq("is_active", true)
                    .order("name");

                setCharities(charityData || []);
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

    const handleDonate = async () => {
        if (!userId || !selectedCharity) return;

        const amount = parseFloat(donationAmount);
        if (!amount || amount < 1) {
            toast.error("Please enter a valid amount");
            return;
        }

        setSubmitting(true);

        try {
            // Create donation record
            const { error: donationError } = await supabase.from("donations").insert({
                user_id: userId,
                charity_id: selectedCharity.id,
                amount,
                message: donationMessage || null,
                is_anonymous: false,
            });

            if (donationError) throw donationError;

            // Create transaction record
            await supabase.from("transactions").insert({
                user_id: userId,
                type: "donation",
                amount,
                status: "pending",
                description: `Donation to ${selectedCharity.name}`,
            });

            toast.success("Donation submitted successfully!");
            setDialogOpen(false);
            setDonationAmount("");
            setDonationMessage("");
            setSelectedCharity(null);

            // Refresh donations
            const { data: newDonations } = await supabase
                .from("donations")
                .select("*, charity:charities(*)")
                .eq("user_id", userId)
                .order("created_at", { ascending: false });
            setDonations(newDonations || []);
        } catch (error) {
            console.error("Error making donation:", error);
            toast.error("Failed to process donation");
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

    const filteredCharities = charities.filter(c =>
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.category?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (loading || !isLoaded) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-stone-400" />
            </div>
        );
    }

    const totalDonated = donations.reduce((sum, d) => sum + Number(d.amount), 0);

    return (
        <div className="space-y-8">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
            >
                <h1 className="text-2xl font-bold text-stone-900 dark:text-stone-100">
                    Charitable Giving
                </h1>
                <p className="text-stone-600 dark:text-stone-400">
                    Support verified charitable organizations
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
                        <CardTitle className="text-sm font-medium text-stone-500">Total Donated</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-2xl font-bold text-green-600">{formatCurrency(totalDonated)}</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-stone-500">Donations Made</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-2xl font-bold text-stone-900 dark:text-stone-100">{donations.length}</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-stone-500">Charities Supported</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-2xl font-bold text-stone-900 dark:text-stone-100">
                            {new Set(donations.map(d => d.charity?.id)).size}
                        </p>
                    </CardContent>
                </Card>
            </motion.div>

            {/* Charities */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
            >
                <Card>
                    <CardHeader>
                        <CardTitle>Browse Charities</CardTitle>
                        <CardDescription>Choose an organization to support</CardDescription>
                        <div className="relative mt-4">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
                            <Input
                                placeholder="Search charities..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-10"
                            />
                        </div>
                    </CardHeader>
                    <CardContent>
                        {filteredCharities.length === 0 ? (
                            <div className="py-12 text-center">
                                <Heart className="mx-auto h-12 w-12 text-stone-300" />
                                <p className="mt-4 text-stone-500">
                                    No charities available at the moment
                                </p>
                            </div>
                        ) : (
                            <div className="grid gap-4 md:grid-cols-2">
                                {filteredCharities.map((charity) => (
                                    <div
                                        key={charity.id}
                                        className="rounded-lg border border-stone-200 p-4 dark:border-stone-800"
                                    >
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <h3 className="font-medium text-stone-900 dark:text-stone-100">
                                                    {charity.name}
                                                </h3>
                                                {charity.category && (
                                                    <Badge variant="secondary" className="mt-1">
                                                        {charity.category}
                                                    </Badge>
                                                )}
                                                <p className="mt-2 text-sm text-stone-500 line-clamp-2">
                                                    {charity.description || "Supporting those in need"}
                                                </p>
                                                <p className="mt-2 text-xs text-stone-400">
                                                    {formatCurrency(charity.total_donations || 0)} raised
                                                </p>
                                            </div>
                                        </div>
                                        <Dialog open={dialogOpen && selectedCharity?.id === charity.id} onOpenChange={(open) => {
                                            setDialogOpen(open);
                                            if (!open) setSelectedCharity(null);
                                        }}>
                                            <DialogTrigger asChild>
                                                <Button
                                                    size="sm"
                                                    className="mt-4 w-full"
                                                    onClick={() => setSelectedCharity(charity)}
                                                >
                                                    <Heart className="mr-2 h-4 w-4" />
                                                    Donate
                                                </Button>
                                            </DialogTrigger>
                                            <DialogContent>
                                                <DialogHeader>
                                                    <DialogTitle>Donate to {charity.name}</DialogTitle>
                                                    <DialogDescription>
                                                        Your donation will make a difference
                                                    </DialogDescription>
                                                </DialogHeader>
                                                <div className="space-y-4 py-4">
                                                    <div className="space-y-2">
                                                        <Label>Donation Amount (USD)</Label>
                                                        <div className="relative">
                                                            <DollarSign className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
                                                            <Input
                                                                type="number"
                                                                placeholder="50"
                                                                value={donationAmount}
                                                                onChange={(e) => setDonationAmount(e.target.value)}
                                                                className="pl-10"
                                                                min="1"
                                                            />
                                                        </div>
                                                    </div>
                                                    <div className="flex gap-2">
                                                        {[10, 25, 50, 100].map((amount) => (
                                                            <Button
                                                                key={amount}
                                                                variant="outline"
                                                                size="sm"
                                                                onClick={() => setDonationAmount(amount.toString())}
                                                            >
                                                                ${amount}
                                                            </Button>
                                                        ))}
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label>Message (Optional)</Label>
                                                        <Textarea
                                                            placeholder="Leave a message of support..."
                                                            value={donationMessage}
                                                            onChange={(e) => setDonationMessage(e.target.value)}
                                                        />
                                                    </div>
                                                    <Button
                                                        onClick={handleDonate}
                                                        className="w-full"
                                                        disabled={submitting}
                                                    >
                                                        {submitting ? (
                                                            <>
                                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                                Processing...
                                                            </>
                                                        ) : (
                                                            <>
                                                                Donate {donationAmount && formatCurrency(parseFloat(donationAmount))}
                                                            </>
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

            {/* Donation History */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
            >
                <Card>
                    <CardHeader>
                        <CardTitle>Your Donation History</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {donations.length === 0 ? (
                            <p className="py-8 text-center text-stone-500">
                                No donations yet. Start making a difference today!
                            </p>
                        ) : (
                            <div className="space-y-4">
                                {donations.map((donation, index) => (
                                    <div key={donation.id}>
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="font-medium text-stone-900 dark:text-stone-100">
                                                    {donation.charity?.name || "Charity"}
                                                </p>
                                                <p className="text-sm text-stone-500">
                                                    {formatDate(donation.created_at)}
                                                </p>
                                            </div>
                                            <p className="font-semibold text-green-600">
                                                {formatCurrency(donation.amount)}
                                            </p>
                                        </div>
                                        {index < donations.length - 1 && <Separator className="mt-4" />}
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
