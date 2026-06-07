"use client";

import { LoanFormData } from "../types";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ShieldPlus, UserCheck } from "lucide-react";
import FileUpload from "../FileUpload";

interface CollateralGuarantorStepProps {
    formData: LoanFormData;
    updateFormData: (field: keyof LoanFormData, value: string) => void;
}

export default function CollateralGuarantorStep({ formData, updateFormData }: CollateralGuarantorStepProps) {
    return (
        <div className="space-y-8">
            {/* Collateral Section */}
            <div className="space-y-6">
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                        <ShieldPlus className="h-5 w-5" />
                    </div>
                    <div>
                        <h2 className="text-xl font-semibold">Collateral Information</h2>
                        <p className="text-sm text-muted-foreground">Providing collateral may improve your loan terms</p>
                    </div>
                </div>

                <div className="space-y-4">
                    <Label className="required">Do you have collateral to offer?</Label>
                    <RadioGroup
                        value={formData.hasCollateral}
                        onValueChange={(value) => updateFormData("hasCollateral", value)}
                        className="flex gap-6"
                    >
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="yes" id="collateral-yes" />
                            <Label htmlFor="collateral-yes" className="cursor-pointer">Yes</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="no" id="collateral-no" />
                            <Label htmlFor="collateral-no" className="cursor-pointer">No</Label>
                        </div>
                    </RadioGroup>

                    {formData.hasCollateral === "yes" && (
                        <div className="bg-muted/30 rounded-lg p-4 space-y-4 mt-4">
                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="collateralType" className="required">Type of Collateral</Label>
                                    <Select
                                        value={formData.collateralType}
                                        onValueChange={(value) => updateFormData("collateralType", value)}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select type" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="real-estate">Real Estate/Property</SelectItem>
                                            <SelectItem value="vehicle">Vehicle</SelectItem>
                                            <SelectItem value="equipment">Equipment/Machinery</SelectItem>
                                            <SelectItem value="investments">Investments/Securities</SelectItem>
                                            <SelectItem value="savings">Savings/Fixed Deposits</SelectItem>
                                            <SelectItem value="jewelry">Jewelry/Valuables</SelectItem>
                                            <SelectItem value="other">Other</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="collateralValue" className="required">Estimated Value</Label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                                        <Input
                                            id="collateralValue"
                                            type="number"
                                            placeholder="Collateral value"
                                            className="pl-8"
                                            value={formData.collateralValue}
                                            onChange={(e) => updateFormData("collateralValue", e.target.value)}
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="md:col-span-2 space-y-2">
                                    <Label htmlFor="collateralDescription" className="required">Description</Label>
                                    <Textarea
                                        id="collateralDescription"
                                        placeholder="Provide details about the collateral (location, condition, ownership status, etc.)"
                                        value={formData.collateralDescription}
                                        onChange={(e) => updateFormData("collateralDescription", e.target.value)}
                                        rows={3}
                                        required
                                    />
                                </div>
                            </div>

                            <FileUpload
                                label="Upload Collateral Documents"
                                documentType="collateral-docs"
                                accept=".pdf,.jpg,.png,image/*"
                                maxSize={10}
                                onUploadComplete={(file) => {
                                    console.log("Collateral docs uploaded:", file);
                                }}
                            />
                        </div>
                    )}
                </div>
            </div>

            {/* Guarantor Section */}
            <div className="border-t pt-8 space-y-6">
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                        <UserCheck className="h-5 w-5" />
                    </div>
                    <div>
                        <h2 className="text-xl font-semibold">Guarantor Information</h2>
                        <p className="text-sm text-muted-foreground">A guarantor may be required for certain loan amounts</p>
                    </div>
                </div>

                <div className="space-y-4">
                    <Label className="required">Do you have a guarantor?</Label>
                    <RadioGroup
                        value={formData.hasGuarantor}
                        onValueChange={(value) => updateFormData("hasGuarantor", value)}
                        className="flex gap-6"
                    >
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="yes" id="guarantor-yes" />
                            <Label htmlFor="guarantor-yes" className="cursor-pointer">Yes</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="no" id="guarantor-no" />
                            <Label htmlFor="guarantor-no" className="cursor-pointer">No</Label>
                        </div>
                    </RadioGroup>

                    {formData.hasGuarantor === "yes" && (
                        <div className="bg-muted/30 rounded-lg p-4 space-y-4 mt-4">
                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="guarantorName" className="required">Guarantor Full Name</Label>
                                    <Input
                                        id="guarantorName"
                                        placeholder="Full legal name"
                                        value={formData.guarantorName}
                                        onChange={(e) => updateFormData("guarantorName", e.target.value)}
                                        required
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="guarantorPhone" className="required">Phone Number</Label>
                                    <Input
                                        id="guarantorPhone"
                                        type="tel"
                                        placeholder="+1 234 567 8900"
                                        value={formData.guarantorPhone}
                                        onChange={(e) => updateFormData("guarantorPhone", e.target.value)}
                                        required
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="guarantorRelation" className="required">Relationship to You</Label>
                                    <Select
                                        value={formData.guarantorRelation}
                                        onValueChange={(value) => updateFormData("guarantorRelation", value)}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select relationship" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="spouse">Spouse</SelectItem>
                                            <SelectItem value="parent">Parent</SelectItem>
                                            <SelectItem value="sibling">Sibling</SelectItem>
                                            <SelectItem value="relative">Other Relative</SelectItem>
                                            <SelectItem value="friend">Friend</SelectItem>
                                            <SelectItem value="colleague">Colleague</SelectItem>
                                            <SelectItem value="business-partner">Business Partner</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="guarantorOccupation" className="required">Occupation</Label>
                                    <Input
                                        id="guarantorOccupation"
                                        placeholder="Their occupation"
                                        value={formData.guarantorOccupation}
                                        onChange={(e) => updateFormData("guarantorOccupation", e.target.value)}
                                        required
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="guarantorIncome" className="required">Monthly Income</Label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                                        <Input
                                            id="guarantorIncome"
                                            type="number"
                                            placeholder="Their income"
                                            className="pl-8"
                                            value={formData.guarantorIncome}
                                            onChange={(e) => updateFormData("guarantorIncome", e.target.value)}
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="md:col-span-2 space-y-2">
                                    <Label htmlFor="guarantorAddress" className="required">Residential Address</Label>
                                    <Textarea
                                        id="guarantorAddress"
                                        placeholder="Full residential address"
                                        value={formData.guarantorAddress}
                                        onChange={(e) => updateFormData("guarantorAddress", e.target.value)}
                                        rows={2}
                                        required
                                    />
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Emergency Contact */}
            <div className="border-t pt-8 space-y-6">
                <h3 className="font-medium">Emergency Contact (Required)</h3>
                <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                        <Label htmlFor="emergencyContactName" className="required">Contact Name</Label>
                        <Input
                            id="emergencyContactName"
                            placeholder="Full name"
                            value={formData.emergencyContactName}
                            onChange={(e) => updateFormData("emergencyContactName", e.target.value)}
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="emergencyContactPhone" className="required">Contact Phone</Label>
                        <Input
                            id="emergencyContactPhone"
                            type="tel"
                            placeholder="+1 234 567 8900"
                            value={formData.emergencyContactPhone}
                            onChange={(e) => updateFormData("emergencyContactPhone", e.target.value)}
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="emergencyContactRelation" className="required">Relationship</Label>
                        <Select
                            value={formData.emergencyContactRelation}
                            onValueChange={(value) => updateFormData("emergencyContactRelation", value)}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select relationship" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="spouse">Spouse</SelectItem>
                                <SelectItem value="parent">Parent</SelectItem>
                                <SelectItem value="sibling">Sibling</SelectItem>
                                <SelectItem value="relative">Other Relative</SelectItem>
                                <SelectItem value="friend">Friend</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </div>
        </div>
    );
}
