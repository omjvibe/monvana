"use client";

import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";
import {
    ShieldCheck,
    Search,
    Filter,
    Eye,
    CheckCircle2,
    XCircle,
    Clock,
    ExternalLink,
    Loader2,
    ArrowUpDown,
    FileSearch,
    User,
    Image as ImageIcon
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
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
    TableRow
} from "@/components/ui/table";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { format } from "date-fns";

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function AdminKYCPage() {
    const [submissions, setSubmissions] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [filterStatus, setFilterStatus] = useState("all");
    const [selectedSubmission, setSelectedSubmission] = useState<any>(null);
    const [isActionLoading, setIsActionLoading] = useState(false);
    const [adminNote, setAdminNote] = useState("");

    useEffect(() => {
        fetchSubmissions();
    }, [filterStatus]);

    const fetchSubmissions = async () => {
        setIsLoading(true);
        try {
            let query = supabase
                .from("kyc_submissions")
                .select("*, users!inner(email, first_name, last_name, avatar_url)")
                .order("created_at", { ascending: false });

            if (filterStatus !== "all") {
                query = query.eq("status", filterStatus);
            }

            const { data, error } = await query;
            if (error) throw error;
            setSubmissions(data || []);
        } catch (error) {
            console.error("Error fetching submissions:", error);
            toast.error("Failed to load KYC submissions");
        } finally {
            setIsLoading(false);
        }
    };

    const handleAction = async (status: "approved" | "rejected") => {
        if (!selectedSubmission) return;

        setIsActionLoading(true);
        try {
            // 1. Update submission record
            const { error: subError } = await supabase
                .from("kyc_submissions")
                .update({
                    status,
                    admin_note: adminNote,
                    updated_at: new Date().toISOString()
                })
                .eq("id", selectedSubmission.id);

            if (subError) throw subError;

            // 2. Update user status
            const { error: userError } = await supabase
                .from("users")
                .update({ kyc_status: status })
                .eq("id", selectedSubmission.user_id);

            if (userError) throw userError;

            // 3. Create notification for user
            await supabase.from("notifications").insert({
                user_id: selectedSubmission.user_id,
                title: status === "approved" ? "Verification Complete" : "Verification Update Required",
                message: status === "approved"
                    ? "Congratulations! Your account has been fully verified."
                    : `Identity verification update required: ${adminNote}`,
                type: status === "approved" ? "success" : "warning"
            });

            toast.success(`Submission ${status} successfully`);
            setSelectedSubmission(null);
            setAdminNote("");
            fetchSubmissions();
        } catch (error) {
            console.error("Error updating KYC:", error);
            toast.error("Failed to update verification status");
        } finally {
            setIsActionLoading(false);
        }
    };

    const filteredSubmissions = submissions.filter(sub =>
        sub.users.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        `${sub.users.first_name} ${sub.users.last_name}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
        sub.id_number.includes(searchQuery)
    );

    return (
        <div className="space-y-6">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <ShieldCheck className="h-6 w-6 text-stone-600" />
                        Verification Requests
                    </h1>
                    <p className="text-stone-500 text-sm italic">Monvana Compliance Protocol — Bank Review</p>
                </div>
                <div className="flex items-center gap-2">
                    <Badge variant="outline" className="bg-stone-50 px-3 py-1 text-xs text-stone-600 border-stone-200">
                        {submissions.filter(s => s.status === 'pending').length} PENDING
                    </Badge>
                </div>
            </header>

            <Card className="border-stone-200 dark:border-stone-800 shadow-sm">
                <CardHeader className="pb-3 border-b border-stone-100 dark:border-stone-900">
                    <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                        <div className="relative w-full md:w-96">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
                            <Input
                                placeholder="Search by name, email, or ID number..."
                                className="pl-9 bg-stone-50 dark:bg-stone-900 border-stone-200"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <div className="flex items-center gap-2 w-full md:w-auto">
                            <Select value={filterStatus} onValueChange={setFilterStatus}>
                                <SelectTrigger className="w-[150px] bg-stone-50 dark:bg-stone-900">
                                    <SelectValue placeholder="Status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Submissions</SelectItem>
                                    <SelectItem value="pending">Pending</SelectItem>
                                    <SelectItem value="approved">Approved</SelectItem>
                                    <SelectItem value="rejected">Rejected</SelectItem>
                                </SelectContent>
                            </Select>
                            <Button variant="outline" size="icon" onClick={fetchSubmissions} className="bg-stone-50 dark:bg-stone-900">
                                <ArrowUpDown className="h-4 w-4 text-stone-500" />
                            </Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-stone-50/50 dark:bg-stone-900/50 hover:bg-stone-50/50">
                                <TableHead className="w-[250px]">Client</TableHead>
                                <TableHead>ID Type</TableHead>
                                <TableHead>ID Number</TableHead>
                                <TableHead>Submitted</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Action</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-64 text-center">
                                        <Loader2 className="h-8 w-8 animate-spin mx-auto text-stone-400" />
                                        <p className="mt-2 text-stone-500 text-sm">Decrypting verification data...</p>
                                    </TableCell>
                                </TableRow>
                            ) : filteredSubmissions.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-64 text-center">
                                        <FileSearch className="h-10 w-10 mx-auto text-stone-300 mb-2" />
                                        <p className="text-stone-500">No verification requests found matching your filter.</p>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredSubmissions.map((sub) => (
                                    <TableRow key={sub.id} className="group hover:bg-stone-50/50 transition-colors">
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <div className="h-9 w-9 bg-stone-100 dark:bg-stone-800 rounded-full flex items-center justify-center overflow-hidden border border-stone-200 dark:border-stone-700">
                                                    {sub.users.avatar_url ? (
                                                        <img src={sub.users.avatar_url} alt="" className="h-full w-full object-cover" />
                                                    ) : (
                                                        <User className="h-5 w-5 text-stone-400" />
                                                    )}
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-stone-900 dark:text-stone-100 text-sm">
                                                        {sub.users.first_name} {sub.users.last_name}
                                                    </p>
                                                    <p className="text-[10px] text-stone-500 font-mono tracking-tight">{sub.users.email}</p>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <span className="text-xs uppercase font-bold tracking-widest text-stone-500">{sub.id_type.replace('_', ' ')}</span>
                                        </TableCell>
                                        <TableCell>
                                            <code className="text-[11px] font-mono bg-stone-100 dark:bg-stone-900 px-1.5 py-0.5 rounded text-stone-700 dark:text-stone-300">
                                                {sub.id_number}
                                            </code>
                                        </TableCell>
                                        <TableCell className="text-xs text-stone-500">
                                            {format(new Date(sub.created_at), 'MMM dd, yyyy HH:mm')}
                                        </TableCell>
                                        <TableCell>
                                            <StatusBadge status={sub.status} />
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => setSelectedSubmission(sub)}
                                                className="hover:bg-stone-200 dark:hover:bg-stone-800"
                                            >
                                                <Eye className="h-4 w-4 mr-2" />
                                                Review
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <Dialog open={!!selectedSubmission} onOpenChange={(open) => !open && setSelectedSubmission(null)}>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                    {selectedSubmission && (
                        <>
                            <DialogHeader>
                                <DialogTitle className="text-xl flex items-center gap-2">
                                    Review Verification: {selectedSubmission.users.first_name} {selectedSubmission.users.last_name}
                                </DialogTitle>
                                <DialogDescription>
                                    Verify document authenticity and compare with user profile details.
                                </DialogDescription>
                            </DialogHeader>

                            <div className="grid md:grid-cols-2 gap-8 py-4">
                                <div className="space-y-6">
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-bold uppercase tracking-widest text-stone-400">Identity Documents</Label>
                                        <DocumentPreview
                                            label="ID Front"
                                            path={selectedSubmission.id_front_url}
                                        />
                                        <DocumentPreview
                                            label="ID Back"
                                            path={selectedSubmission.id_back_url}
                                        />
                                        <DocumentPreview
                                            label="Face / Selfie"
                                            path={selectedSubmission.selfie_url}
                                        />
                                        <DocumentPreview
                                            label="Proof of Address"
                                            path={selectedSubmission.address_proof_url}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    <div className="bg-stone-50 dark:bg-stone-900 p-6 rounded-xl border border-stone-100 dark:border-stone-800 space-y-4">
                                        <h3 className="italic text-lg pb-2 border-b">Verification Verdict</h3>

                                        <div className="space-y-2 text-sm">
                                            <div className="flex justify-between">
                                                <span className="text-stone-500">Document Type</span>
                                                <span className="font-semibold uppercase tracking-wider">{selectedSubmission.id_type}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-stone-500">Document Number</span>
                                                <span className="font-mono text-xs">{selectedSubmission.id_number}</span>
                                            </div>
                                        </div>

                                        <div className="space-y-2 pt-4">
                                            <Label>Admin Feedback / Note</Label>
                                            <Textarea
                                                placeholder="Explain reason for rejection or add internal notes..."
                                                className="min-h-[120px] bg-white border-stone-200"
                                                value={adminNote}
                                                onChange={(e) => setAdminNote(e.target.value)}
                                            />
                                        </div>

                                        <div className="flex gap-3 pt-4">
                                            <Button
                                                variant="outline"
                                                className="flex-1 border-red-200 text-red-600 hover:bg-red-50"
                                                onClick={() => handleAction("rejected")}
                                                disabled={isActionLoading}
                                            >
                                                <XCircle className="h-4 w-4 mr-2" />
                                                Reject
                                            </Button>
                                            <Button
                                                className="flex-1 bg-emerald-700 hover:bg-emerald-800 text-white"
                                                onClick={() => handleAction("approved")}
                                                disabled={isActionLoading}
                                            >
                                                <CheckCircle2 className="h-4 w-4 mr-2" />
                                                Approve
                                            </Button>
                                        </div>
                                    </div>

                                    <div className="p-4 rounded-lg bg-stone-100 dark:bg-stone-950 border border-stone-200 dark:border-stone-900">
                                        <p className="text-[10px] text-stone-500 text-center uppercase tracking-widest font-bold">
                                            Compliance Log: IP {selectedSubmission.users?.last_ip || 'Hidden'} • {format(new Date(selectedSubmission.created_at), 'PPP HH:mm')}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}

function StatusBadge({ status }: { status: string }) {
    switch (status) {
        case 'approved':
            return <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-none px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest">Approved</Badge>;
        case 'rejected':
            return <Badge className="bg-red-100 text-red-700 hover:bg-red-100 border-none px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest">Rejected</Badge>;
        case 'pending':
            return <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 border-none px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest flex items-center gap-1 w-fit"><Clock className="h-3 w-3" /> Reviewing</Badge>;
        default:
            return <Badge variant="outline">{status}</Badge>;
    }
}

function DocumentPreview({ label, path }: { label: string, path: string | null }) {
    if (!path) return (
        <div className="flex items-center justify-between p-3 rounded-lg border border-stone-200 dark:border-stone-800 bg-stone-50/50 grayscale opacity-40">
            <span className="text-xs font-semibold text-stone-400">{label}</span>
            <span className="text-[10px] font-bold text-stone-300">MISSING</span>
        </div>
    );

    // Get public URL or signing logic here
    const publicUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/kyc/${path}`;

    return (
        <a
            href={publicUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between p-3 rounded-lg border border-stone-200 dark:border-stone-800 bg-white hover:bg-stone-50 transition-colors group"
        >
            <div className="flex items-center gap-3">
                <div className="h-8 w-8 bg-stone-100 rounded-lg flex items-center justify-center">
                    <ImageIcon className="h-4 w-4 text-stone-400" />
                </div>
                <span className="text-xs font-semibold text-stone-700">{label}</span>
            </div>
            <ExternalLink className="h-4 w-4 text-stone-300 group-hover:text-stone-900 transition-colors" />
        </a>
    );
}
