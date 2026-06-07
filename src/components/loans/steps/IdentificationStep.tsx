"use client";

import { LoanFormData } from "../types";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { IdCard, AlertCircle } from "lucide-react";
import FileUpload from "../FileUpload";

interface IdentificationStepProps {
    formData: LoanFormData;
    updateFormData: (field: keyof LoanFormData, value: string) => void;
}

export default function IdentificationStep({ formData, updateFormData }: IdentificationStepProps) {
    return (
        <div className="space-y-6">
            <div className="flex items-center gap-3 mb-6">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <IdCard className="h-5 w-5" />
                </div>
                <div>
                    <h2 className="text-xl font-semibold">Identification Details</h2>
                    <p className="text-sm text-muted-foreground">Provide your identification information for verification</p>
                </div>
            </div>

            <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4 mb-6">
                <div className="flex gap-3">
                    <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div className="text-sm">
                        <p className="font-medium text-amber-800 dark:text-amber-200">Important</p>
                        <p className="text-amber-700 dark:text-amber-300">
                            Please ensure all identification details match exactly as they appear on your official documents.
                            Discrepancies may delay your application.
                        </p>
                    </div>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                    <Label htmlFor="idType" className="required">Type of Identification</Label>
                    <Select
                        value={formData.idType}
                        onValueChange={(value) => updateFormData("idType", value)}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Select ID type" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="passport">International Passport</SelectItem>
                            <SelectItem value="national-id">National ID Card</SelectItem>
                            <SelectItem value="drivers-license">Driver&apos;s License</SelectItem>
                            <SelectItem value="voters-card">Voter&apos;s Card</SelectItem>
                            <SelectItem value="residence-permit">Residence Permit</SelectItem>
                            <SelectItem value="other">Other Government ID</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="idNumber" className="required">ID Number</Label>
                    <Input
                        id="idNumber"
                        placeholder="Enter your ID number"
                        value={formData.idNumber}
                        onChange={(e) => updateFormData("idNumber", e.target.value)}
                        required
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="idExpiryDate" className="required">ID Expiry Date</Label>
                    <Input
                        id="idExpiryDate"
                        type="date"
                        value={formData.idExpiryDate}
                        onChange={(e) => updateFormData("idExpiryDate", e.target.value)}
                        required
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="nationality" className="required">Nationality</Label>
                    <Input
                        id="nationality"
                        placeholder="e.g., American, British"
                        value={formData.nationality}
                        onChange={(e) => updateFormData("nationality", e.target.value)}
                        required
                    />
                </div>

                <div className="md:col-span-2 space-y-2">
                    <Label htmlFor="taxIdNumber">Tax Identification Number (Optional)</Label>
                    <Input
                        id="taxIdNumber"
                        placeholder="e.g., SSN, TIN, NIN"
                        value={formData.taxIdNumber}
                        onChange={(e) => updateFormData("taxIdNumber", e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">
                        This may be required for certain loan types and amounts
                    </p>
                </div>
            </div>

            <div className="border-t pt-6 mt-6">
                <h3 className="font-medium mb-4">Document Upload</h3>
                <div className="grid gap-4 md:grid-cols-2">
                    <FileUpload
                        label="Upload ID Document (Front)"
                        documentType="id-front"
                        accept="image/*,.pdf"
                        maxSize={5}
                        required
                        onUploadComplete={(file) => {
                            console.log("ID Front uploaded:", file);
                        }}
                    />

                    <FileUpload
                        label="Upload ID Document (Back) - If applicable"
                        documentType="id-back"
                        accept="image/*,.pdf"
                        maxSize={5}
                        onUploadComplete={(file) => {
                            console.log("ID Back uploaded:", file);
                        }}
                    />
                </div>
            </div>
        </div>
    );
}

