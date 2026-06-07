"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
    Plus,
    MoreHorizontal,
    Bitcoin,
    Copy,
    Check,
    Edit,
    Trash2,
    Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
);

interface CryptoAddress {
    id: string;
    user_id: string;
    network: string;
    address: string;
    created_at: string;
    users?: { first_name: string; last_name: string; email: string };
}

interface CryptoWallet {
    id: string;
    user_id: string;
    currency: string;
    balance: number;
    users?: { first_name: string; last_name: string };
}

export default function AdminCryptoPage() {
    const [loading, setLoading] = useState(true);
    const [addresses, setAddresses] = useState<CryptoAddress[]>([]);
    const [wallets, setWallets] = useState<CryptoWallet[]>([]);
    const [copiedId, setCopiedId] = useState<string | null>(null);
    const [showAddDialog, setShowAddDialog] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const [formData, setFormData] = useState({
        network: "BTC",
        address: "",
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            // Fetch crypto addresses
            const { data: addressData } = await supabase
                .from("crypto_addresses")
                .select("*, users(first_name, last_name, email)")
                .order("created_at", { ascending: false });

            // Fetch crypto wallets (non-USD)
            const { data: walletData } = await supabase
                .from("wallets")
                .select("*, users(first_name, last_name)")
                .neq("currency", "USD")
                .order("created_at", { ascending: false });

            setAddresses(addressData || []);
            setWallets(walletData || []);
        } catch (error) {
            console.error("Error fetching data:", error);
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat("en-US", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 8,
        }).format(amount);
    };

    const copyAddress = (address: string, id: string) => {
        navigator.clipboard.writeText(address);
        setCopiedId(id);
        toast.success("Address copied!");
        setTimeout(() => setCopiedId(null), 2000);
    };

    const truncateAddress = (address: string) => {
        return `${address.slice(0, 10)}...${address.slice(-8)}`;
    };

    const getNetworkColor = (network: string) => {
        switch (network.toUpperCase()) {
            case "BTC":
            case "BITCOIN":
                return "bg-orange-500/10 text-orange-600";
            case "ETH":
            case "ETHEREUM":
                return "bg-blue-500/10 text-blue-600";
            case "USDT":
            case "USDC":
                return "bg-green-500/10 text-green-600";
            default:
                return "bg-purple-500/10 text-purple-600";
        }
    };

    const handleAddAddress = async () => {
        if (!formData.address) {
            toast.error("Please enter an address");
            return;
        }

        setSubmitting(true);
        // This would typically be for the bank's addresses
        toast.success("Crypto address functionality coming soon");
        setShowAddDialog(false);
        setSubmitting(false);
    };

    const handleDeleteAddress = async (id: string) => {
        if (!confirm("Are you sure you want to delete this address?")) return;

        try {
            const { error } = await supabase
                .from("crypto_addresses")
                .delete()
                .eq("id", id);

            if (error) throw error;
            toast.success("Address deleted");
            fetchData();
        } catch (error) {
            console.error("Error deleting address:", error);
            toast.error("Failed to delete address");
        }
    };

    const stats = {
        totalAddresses: addresses.length,
        networks: new Set(addresses.map(a => a.network)).size,
        totalCryptoWallets: wallets.length,
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
                        Crypto Management
                    </h1>
                    <p className="text-muted-foreground">
                        Manage cryptocurrency addresses and wallets.
                    </p>
                </div>
                <Button onClick={() => setShowAddDialog(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Address
                </Button>
            </motion.div>

            {/* Stats */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.1 }}
                className="grid gap-4 md:grid-cols-3"
            >
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                            <Bitcoin className="h-4 w-4" />
                            Total Addresses
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.totalAddresses}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Networks</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.networks}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Crypto Wallets</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.totalCryptoWallets}</div>
                    </CardContent>
                </Card>
            </motion.div>

            {/* Crypto Wallets */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.2 }}
            >
                <Card>
                    <CardHeader>
                        <CardTitle>User Crypto Wallets</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        {wallets.length === 0 ? (
                            <div className="py-12 text-center text-muted-foreground">
                                No crypto wallets found
                            </div>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>User</TableHead>
                                        <TableHead>Currency</TableHead>
                                        <TableHead>Balance</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {wallets.map((wallet) => (
                                        <TableRow key={wallet.id}>
                                            <TableCell className="font-medium">
                                                {wallet.users?.first_name} {wallet.users?.last_name}
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="secondary" className={getNetworkColor(wallet.currency)}>
                                                    {wallet.currency}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="font-mono">
                                                {formatCurrency(wallet.balance)} {wallet.currency}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        )}
                    </CardContent>
                </Card>
            </motion.div>

            {/* Crypto Addresses */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.3 }}
            >
                <Card>
                    <CardHeader>
                        <CardTitle>Deposit Addresses</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        {addresses.length === 0 ? (
                            <div className="py-12 text-center text-muted-foreground">
                                <Bitcoin className="mx-auto h-12 w-12 opacity-50 mb-4" />
                                No crypto addresses found
                            </div>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>User</TableHead>
                                        <TableHead>Network</TableHead>
                                        <TableHead>Address</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {addresses.map((addr) => (
                                        <TableRow key={addr.id}>
                                            <TableCell>
                                                <div>
                                                    <p className="font-medium">{addr.users?.first_name} {addr.users?.last_name}</p>
                                                    <p className="text-xs text-muted-foreground">{addr.users?.email}</p>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="secondary" className={getNetworkColor(addr.network)}>
                                                    {addr.network}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <code className="text-xs bg-muted px-2 py-1 rounded">
                                                        {truncateAddress(addr.address)}
                                                    </code>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8"
                                                        onClick={() => copyAddress(addr.address, addr.id)}
                                                    >
                                                        {copiedId === addr.id ? (
                                                            <Check className="h-4 w-4 text-green-500" />
                                                        ) : (
                                                            <Copy className="h-4 w-4" />
                                                        )}
                                                    </Button>
                                                </div>
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
                                                        <DropdownMenuItem
                                                            onClick={() => handleDeleteAddress(addr.id)}
                                                            className="text-destructive"
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
            </motion.div>

            {/* Add Address Dialog */}
            <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Add Crypto Address</DialogTitle>
                        <DialogDescription>
                            Add a new cryptocurrency deposit address.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Network</Label>
                            <Select
                                value={formData.network}
                                onValueChange={(val) => setFormData({ ...formData, network: val })}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="BTC">Bitcoin (BTC)</SelectItem>
                                    <SelectItem value="ETH">Ethereum (ETH)</SelectItem>
                                    <SelectItem value="USDT">Tether (USDT)</SelectItem>
                                    <SelectItem value="USDC">USD Coin (USDC)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Address</Label>
                            <Input
                                placeholder="Enter wallet address"
                                value={formData.address}
                                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleAddAddress} disabled={submitting}>
                            {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Add Address
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
