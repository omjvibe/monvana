"use client";

import { useState, useEffect } from "react";
import { useUser } from "@/hooks/useAuth";
import { motion } from "framer-motion";
import { Loader2, CreditCard, Eye, EyeOff, Lock, Unlock, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
);

interface VirtualCard {
    id: string;
    card_name?: string;
    card_number: string;
    expiry_date: string;
    cvv: string;
    card_type: string;
    balance: number;
    spending_limit: number;
    status: string;
    created_at: string;
}

export default function CardsPage() {
    const [loading, setLoading] = useState(true);
    const [cards, setCards] = useState<VirtualCard[]>([]);
    const [showDetails, setShowDetails] = useState<Record<string, boolean>>({});
    const [userId, setUserId] = useState<string | null>(null);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [cardName, setCardName] = useState("");
    const [creating, setCreating] = useState(false);
    const { user: clerkUser, isLoaded } = useUser();

    useEffect(() => {
        async function fetchData() {
            if (!clerkUser?.id) return;

            try {
                const { data: userData } = await supabase
                    .from("users")
                    .select("id")
                    .eq("clerk_id", clerkUser.id)
                    .single();

                if (userData) {
                    setUserId(userData.id);

                    const { data: cardData } = await supabase
                        .from("virtual_cards")
                        .select("*")
                        .eq("user_id", userData.id)
                        .order("created_at", { ascending: false });

                    setCards(cardData || []);
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

    const generateCardNumber = () => {
        const prefix = "4532"; // Visa prefix
        let number = prefix;
        for (let i = 0; i < 12; i++) {
            number += Math.floor(Math.random() * 10);
        }
        return number;
    };

    const generateExpiry = () => {
        const now = new Date();
        const year = now.getFullYear() + 3;
        const month = String(now.getMonth() + 1).padStart(2, "0");
        return `${month}/${year.toString().slice(-2)}`;
    };

    const generateCVV = () => {
        return String(Math.floor(Math.random() * 900) + 100);
    };

    const handleCreateCard = async () => {
        if (!userId) return;

        setCreating(true);

        try {
            const { error } = await supabase.from("virtual_cards").insert({
                user_id: userId,
                card_name: cardName || "My Card",
                card_number: generateCardNumber(),
                expiry_date: generateExpiry(),
                cvv: generateCVV(),
                card_type: "visa",
                balance: 0,
                spending_limit: 5000,
                status: "active",
            });

            if (error) throw error;

            toast.success("Virtual card created successfully!");
            setDialogOpen(false);
            setCardName("");

            // Refresh cards
            const { data: newCards } = await supabase
                .from("virtual_cards")
                .select("*")
                .eq("user_id", userId)
                .order("created_at", { ascending: false });
            setCards(newCards || []);
        } catch (error) {
            console.error("Error creating card:", error);
            toast.error("Failed to create card");
        } finally {
            setCreating(false);
        }
    };

    const toggleCardStatus = async (cardId: string, currentStatus: string) => {
        const newStatus = currentStatus === "active" ? "frozen" : "active";

        try {
            const { error } = await supabase
                .from("virtual_cards")
                .update({ status: newStatus })
                .eq("id", cardId);

            if (error) throw error;

            setCards((prev) =>
                prev.map((card) =>
                    card.id === cardId ? { ...card, status: newStatus } : card
                )
            );

            toast.success(newStatus === "frozen" ? "Card frozen" : "Card unfrozen");
        } catch (error) {
            console.error("Error updating card:", error);
            toast.error("Failed to update card");
        }
    };

    const formatCardNumber = (number: string, show: boolean) => {
        if (show) {
            return number.replace(/(.{4})/g, "$1 ").trim();
        }
        return `•••• •••• •••• ${number.slice(-4)}`;
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: "USD",
        }).format(amount);
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
                className="flex items-center justify-between"
            >
                <div>
                    <h1 className="text-2xl font-bold text-stone-900 dark:text-stone-100">
                        Virtual Cards
                    </h1>
                    <p className="text-stone-600 dark:text-stone-400">
                        Manage your virtual debit cards
                    </p>
                </div>
                <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                    <DialogTrigger asChild>
                        <Button>
                            <Plus className="mr-2 h-4 w-4" />
                            New Card
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Create Virtual Card</DialogTitle>
                            <DialogDescription>
                                Create a new virtual debit card for online purchases
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label>Card Name (Optional)</Label>
                                <Input
                                    placeholder="My Shopping Card"
                                    value={cardName}
                                    onChange={(e) => setCardName(e.target.value)}
                                />
                            </div>
                            <Button
                                className="w-full"
                                onClick={handleCreateCard}
                                disabled={creating}
                            >
                                {creating ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Creating...
                                    </>
                                ) : (
                                    "Create Card"
                                )}
                            </Button>
                        </div>
                    </DialogContent>
                </Dialog>
            </motion.div>

            {/* Cards Grid */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
            >
                {cards.length === 0 ? (
                    <Card>
                        <CardContent className="py-12 text-center">
                            <CreditCard className="mx-auto h-12 w-12 text-stone-300" />
                            <h3 className="mt-4 text-lg font-medium text-stone-900 dark:text-stone-100">
                                No virtual cards
                            </h3>
                            <p className="mt-2 text-stone-500">
                                Create your first virtual card to start shopping online
                            </p>
                            <Button className="mt-4" onClick={() => setDialogOpen(true)}>
                                <Plus className="mr-2 h-4 w-4" />
                                Create Card
                            </Button>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid gap-6 md:grid-cols-2">
                        {cards.map((card) => {
                            const isShown = showDetails[card.id];
                            const isFrozen = card.status === "frozen";

                            return (
                                <div key={card.id}>
                                    {/* Card Visual */}
                                    <div
                                        className={`relative overflow-hidden rounded-xl p-6 text-white ${isFrozen
                                            ? "bg-gradient-to-br from-stone-400 to-stone-600"
                                            : "bg-gradient-to-br from-stone-800 to-stone-900"
                                            }`}
                                    >
                                        {isFrozen && (
                                            <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                                                <Badge className="bg-white text-stone-900">FROZEN</Badge>
                                            </div>
                                        )}
                                        <div className="flex items-start justify-between">
                                            <div>
                                                <p className="text-sm text-white/70">
                                                    {card.card_name || "Virtual Card"}
                                                </p>
                                                <p className="text-xs text-white/50 uppercase mt-0.5">
                                                    {card.card_type}
                                                </p>
                                            </div>
                                            <CreditCard className="h-8 w-8 text-white/50" />
                                        </div>
                                        <p className="mt-6 font-mono text-lg tracking-wider">
                                            {formatCardNumber(card.card_number, isShown)}
                                        </p>
                                        <div className="mt-4 flex items-end justify-between">
                                            <div>
                                                <p className="text-xs text-white/50">EXPIRES</p>
                                                <p className="font-mono">
                                                    {isShown ? card.expiry_date : "••/••"}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-white/50">CVV</p>
                                                <p className="font-mono">
                                                    {isShown ? card.cvv : "•••"}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-white/50">BALANCE</p>
                                                <p className="font-semibold">
                                                    {formatCurrency(card.balance)}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Card Actions */}
                                    <div className="mt-3 flex gap-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="flex-1"
                                            onClick={() =>
                                                setShowDetails((prev) => ({
                                                    ...prev,
                                                    [card.id]: !prev[card.id],
                                                }))
                                            }
                                        >
                                            {isShown ? (
                                                <>
                                                    <EyeOff className="mr-2 h-4 w-4" />
                                                    Hide Details
                                                </>
                                            ) : (
                                                <>
                                                    <Eye className="mr-2 h-4 w-4" />
                                                    Show Details
                                                </>
                                            )}
                                        </Button>
                                        <Button
                                            variant={isFrozen ? "default" : "outline"}
                                            size="sm"
                                            className="flex-1"
                                            onClick={() => toggleCardStatus(card.id, card.status)}
                                        >
                                            {isFrozen ? (
                                                <>
                                                    <Unlock className="mr-2 h-4 w-4" />
                                                    Unfreeze
                                                </>
                                            ) : (
                                                <>
                                                    <Lock className="mr-2 h-4 w-4" />
                                                    Freeze
                                                </>
                                            )}
                                        </Button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </motion.div>
        </div>
    );
}
