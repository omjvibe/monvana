"use client";

import { useState, useEffect } from "react";
import { useUser } from "@/hooks/useAuth";
import { createClient } from "@/lib/supabase/client";
import {
    ShieldCheck,
    Upload,
    FileText,
    Image as ImageIcon,
    CheckCircle2,
    AlertCircle,
    Loader2,
    Lock,
    Camera
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

const supabase = createClient();

export default function KYCPage() {
    const { user } = useUser();
    const [kycStatus, setKycStatus] = useState<string>("unverified");
    const [isLoading, setIsLoading] = useState(true);
    const [isUploading, setIsUploading] = useState(false);
    const [progress, setProgress] = useState(0);

    const [files, setFiles] = useState<{
        idFront: File | null;
        idBack: File | null;
        selfie: File | null;
        proofOfAddress: File | null;
    }>({
        idFront: null,
        idBack: null,
        selfie: null,
        proofOfAddress: null,
    });

    const [formDetails, setFormDetails] = useState({
        idType: "passport",
        idNumber: "",
    });

    useEffect(() => {
        if (user) {
            fetchKYCStatus();
        }
    }, [user]);

    const fetchKYCStatus = async () => {
        try {
            const { data: dbUser, error } = await supabase
                .from("users")
                .select("kyc_status")
                .eq("clerk_id", user?.id)
                .single();

            if (dbUser) {
                setKycStatus(dbUser.kyc_status || "unverified");
            }
        } catch (error) {
            console.error("Error fetching KYC status:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: keyof typeof files) => {
        if (e.target.files && e.target.files[0]) {
            setFiles(prev => ({ ...prev, [type]: e.target.files![0] }));
        }
    };

    const compressImage = async (file: File): Promise<File | Blob> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = (event) => {
                const img = new Image();
                img.src = event.target?.result as string;
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    const MAX_WIDTH = 1200;
                    const MAX_HEIGHT = 1200;
                    let width = img.width;
                    let height = img.height;

                    if (width > height) {
                        if (width > MAX_WIDTH) {
                            height *= MAX_WIDTH / width;
                            width = MAX_WIDTH;
                        }
                    } else {
                        if (height > MAX_HEIGHT) {
                            width *= MAX_HEIGHT / height;
                            height = MAX_HEIGHT;
                        }
                    }

                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    ctx?.drawImage(img, 0, 0, width, height);

                    canvas.toBlob((blob) => {
                        if (blob) {
                            resolve(new File([blob], file.name, { type: 'image/jpeg' }));
                        } else {
                            resolve(file); // Fallback to original
                        }
                    }, 'image/jpeg', 0.7); // 70% quality
                };
                img.onerror = () => resolve(file);
            };
            reader.onerror = () => resolve(file);
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!files.idFront || !files.selfie || !formDetails.idNumber) {
            toast.error("Please provide at least ID Front, Selfie, and ID Number.");
            return;
        }

        setIsUploading(true);
        setProgress(10);

        try {
            toast.loading("Compressing and preparing documents...", { id: "kyc-upload" });

            // Build FormData and send everything to the server
            const formData = new FormData();
            formData.append("idType", formDetails.idType);
            formData.append("idNumber", formDetails.idNumber);

            // Compress images before sending
            setProgress(15);
            const compressedIdFront = await compressImage(files.idFront);
            const compressedSelfie = await compressImage(files.selfie);

            formData.append("idFront", compressedIdFront);
            formData.append("selfie", compressedSelfie);

            setProgress(30);
            if (files.idBack) {
                const compressedIdBack = await compressImage(files.idBack);
                formData.append("idBack", compressedIdBack);
            }
            if (files.proofOfAddress) {
                const compressedAddress = await compressImage(files.proofOfAddress);
                formData.append("proofOfAddress", compressedAddress);
            }

            setProgress(40);
            toast.loading("Uploading encrypted identity data...", { id: "kyc-upload" });

            const response = await fetch("/api/kyc/submit", {
                method: "POST",
                body: formData,
            });

            setProgress(85);

            const contentType = response.headers.get("content-type");
            if (!response.ok) {
                if (contentType && contentType.includes("application/json")) {
                    const errorData = await response.json();
                    throw new Error(errorData.details || errorData.message || "Failed to submit KYC");
                } else if (response.status === 413) {
                    throw new Error("The uploaded files are too large. Please try again with smaller images.");
                } else {
                    throw new Error(`Server error (${response.status}). Please contact support.`);
                }
            }

            setProgress(100);
            toast.success("Identity verification submitted successfully!", { id: "kyc-upload" });
            setKycStatus("pending");
        } catch (error: any) {
            console.error("Submission error:", error);
            toast.error(error.message || "An error occurred during submission.", { id: "kyc-upload" });
        } finally {
            setIsUploading(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex h-[400px] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-stone-400" />
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto space-y-8 p-4 md:p-8">
            <header className="flex flex-col gap-2">
                <h1 className="text-3xl italic text-stone-900 dark:text-stone-100">Identity Verification</h1>
                <p className="text-stone-500 text-sm">Verify your identity to unlock full banking features and higher limits.</p>
            </header>

            <AnimatePresence mode="wait">
                {kycStatus === "approved" ? (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/50 p-8 rounded-2xl flex flex-col items-center text-center gap-4"
                    >
                        <div className="h-16 w-16 bg-emerald-100 dark:bg-emerald-900 rounded-full flex items-center justify-center">
                            <ShieldCheck className="h-8 w-8 text-emerald-600" />
                        </div>
                        <h2 className="text-2xl font-semibold text-emerald-900 dark:text-emerald-100">Identity Verified</h2>
                        <p className="max-w-md text-emerald-700 dark:text-emerald-400">Your account is fully verified. You now have unrestricted access to all Monvana Bank services.</p>
                        <Button className="mt-4 bg-emerald-600 hover:bg-emerald-700 text-white">View Verification Details</Button>
                    </motion.div>
                ) : kycStatus === "pending" ? (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 p-8 rounded-2xl flex flex-col items-center text-center gap-4"
                    >
                        <div className="h-16 w-16 bg-stone-200 dark:bg-stone-800 rounded-full flex items-center justify-center animate-pulse">
                            <Loader2 className="h-8 w-8 text-stone-600" />
                        </div>
                        <h2 className="text-2xl font-semibold text-stone-900 dark:text-stone-100">Verification in Progress</h2>
                        <p className="max-w-md text-stone-500">Our compliance team is manually reviewing your documents. This typically takes 24-48 hours. You will be notified via email.</p>
                        <div className="flex gap-4 mt-4">
                            <div className="flex flex-col items-center gap-1">
                                <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                                <span className="text-[10px] uppercase font-bold tracking-tighter">Submitted</span>
                            </div>
                            <div className="w-12 h-px bg-stone-300 self-center" />
                            <div className="flex flex-col items-center gap-1">
                                <Loader2 className="h-5 w-5 text-stone-400 animate-spin" />
                                <span className="text-[10px] uppercase font-bold tracking-tighter text-stone-400">Reviewing</span>
                            </div>
                        </div>
                    </motion.div>
                ) : (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="grid gap-8"
                    >
                        {kycStatus === "rejected" && (
                            <div className="bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/40 p-4 rounded-xl flex items-center gap-4 text-red-900 dark:text-red-400">
                                <AlertCircle className="h-5 w-5 flex-shrink-0" />
                                <div className="text-sm">
                                    <p className="font-semibold">Recent submission rejected</p>
                                    <p className="opacity-80">Documentation was blurry or invalid. Please re-submit clear photos.</p>
                                </div>
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-8">
                            {/* Step 1: ID Details */}
                            <Card className="border-stone-200 dark:border-stone-800 shadow-sm overflow-hidden">
                                <CardHeader className="bg-stone-50/50 dark:bg-stone-900/50">
                                    <CardTitle className="text-lg flex items-center gap-2">
                                        <FileText className="h-5 w-5 text-stone-400" /> Document Information
                                    </CardTitle>
                                    <CardDescription>Select your document type and enter the ID number.</CardDescription>
                                </CardHeader>
                                <CardContent className="pt-6 grid md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <Label>Document Type</Label>
                                        <Select
                                            value={formDetails.idType}
                                            onValueChange={(v) => setFormDetails({ ...formDetails, idType: v })}
                                        >
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="passport">International Passport</SelectItem>
                                                <SelectItem value="drivers_license">Driver's License</SelectItem>
                                                <SelectItem value="national_id">National ID Card</SelectItem>
                                                <SelectItem value="state_id">State ID Card</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>ID Number</Label>
                                        <Input
                                            placeholder="Enter the number as it appears on ID"
                                            value={formDetails.idNumber}
                                            onChange={(e) => setFormDetails({ ...formDetails, idNumber: e.target.value })}
                                            required
                                        />
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Step 2: Upload Files */}
                            <div className="grid md:grid-cols-2 gap-6">
                                <UploadBox
                                    title="Front of ID"
                                    description="Clear photo of the front side"
                                    file={files.idFront}
                                    onChange={(e) => handleFileChange(e, 'idFront')}
                                />
                                <UploadBox
                                    title="Back of ID (Optional)"
                                    description="Required for cards with data on back"
                                    file={files.idBack}
                                    onChange={(e) => handleFileChange(e, 'idBack')}
                                />
                                <UploadBox
                                    title="Selfie with ID"
                                    description="Hold your ID next to your face"
                                    file={files.selfie}
                                    onChange={(e) => handleFileChange(e, 'selfie')}
                                    icon={<Camera className="h-8 w-8" />}
                                />
                                <UploadBox
                                    title="Proof of Address"
                                    description="Utility bill, Bank statement (Last 3m)"
                                    file={files.proofOfAddress}
                                    onChange={(e) => handleFileChange(e, 'proofOfAddress')}
                                />
                            </div>

                            <Card className="bg-stone-900 text-stone-100 border-none">
                                <CardContent className="p-6 flex items-center justify-between gap-4">
                                    <div className="flex items-center gap-3">
                                        <Lock className="h-10 w-10 text-stone-400 p-2 bg-stone-800 rounded-lg" />
                                        <div>
                                            <p className="font-semibold text-sm">Premium Security Protocol</p>
                                            <p className="text-stone-400 text-xs text-balance">Your data is encrypted using 256-bit AES protocol and stored in sovereign isolated servers.</p>
                                        </div>
                                    </div>
                                    <div className="flex flex-col gap-2 min-w-[200px]">
                                        {isUploading && <Progress value={progress} className="h-1 bg-stone-800" />}
                                        <Button
                                            className="w-full bg-stone-100 text-stone-900 hover:bg-white"
                                            disabled={isUploading}
                                        >
                                            {isUploading ? (
                                                <>
                                                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                                    Uploading...
                                                </>
                                            ) : (
                                                "Submit for Review"
                                            )}
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        </form>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

function UploadBox({ title, description, file, onChange, icon }: {
    title: string,
    description: string,
    file: File | null,
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void,
    icon?: React.ReactNode
}) {
    return (
        <Card className="border-dashed border-2 hover:border-stone-400 transition-colors bg-stone-50/30 dark:bg-stone-900/30">
            <CardContent className="p-0">
                <label className="flex flex-col items-center justify-center p-8 cursor-pointer gap-2">
                    <input type="file" className="hidden" accept="image/*" onChange={onChange} />
                    {file ? (
                        <>
                            <div className="h-12 w-12 bg-emerald-100 dark:bg-emerald-950 rounded-full flex items-center justify-center">
                                <CheckCircle2 className="h-6 w-6 text-emerald-600" />
                            </div>
                            <p className="text-sm font-semibold truncate max-w-[200px]">{file.name}</p>
                            <Button variant="ghost" size="sm" type="button" onClick={(e) => {
                                e.preventDefault();
                                // Logic to clear file
                            }}>Remove</Button>
                        </>
                    ) : (
                        <>
                            <div className="h-16 w-16 bg-white dark:bg-stone-800 rounded-2xl shadow-sm flex items-center justify-center mb-2">
                                {icon || <Upload className="h-8 w-8 text-stone-400" />}
                            </div>
                            <p className="text-sm font-semibold">{title}</p>
                            <p className="text-xs text-stone-400 text-center">{description}</p>
                        </>
                    )}
                </label>
            </CardContent>
        </Card>
    );
}
