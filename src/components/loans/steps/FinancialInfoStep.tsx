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
import { Briefcase, Building } from "lucide-react";
import FileUpload from "../FileUpload";

interface FinancialInfoStepProps {
    formData: LoanFormData;
    updateFormData: (field: keyof LoanFormData, value: string) => void;
}

export default function FinancialInfoStep({ formData, updateFormData }: FinancialInfoStepProps) {
    return (
        <div className="space-y-6">
            <div className="flex items-center gap-3 mb-6">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <Briefcase className="h-5 w-5" />
                </div>
                <div>
                    <h2 className="text-xl font-semibold">Financial Information</h2>
                    <p className="text-sm text-muted-foreground">Provide details about your income and employment</p>
                </div>
            </div>

            {/* Employment Status */}
            <div className="space-y-4">
                <Label className="required">Employment Status</Label>
                <RadioGroup
                    value={formData.employmentStatus}
                    onValueChange={(value) => updateFormData("employmentStatus", value)}
                    className="grid gap-3 md:grid-cols-3"
                >
                    {[
                        { value: "employed", label: "Employed" },
                        { value: "self-employed", label: "Self Employed" },
                        { value: "business-owner", label: "Business Owner" },
                        { value: "student", label: "Student" },
                        { value: "retired", label: "Retired" },
                        { value: "unemployed", label: "Unemployed" },
                    ].map((option) => (
                        <div key={option.value} className="flex items-center space-x-2">
                            <RadioGroupItem value={option.value} id={option.value} />
                            <Label htmlFor={option.value} className="cursor-pointer">{option.label}</Label>
                        </div>
                    ))}
                </RadioGroup>
            </div>

            {/* Employer Details - shown for employed */}
            {(formData.employmentStatus === "employed" || formData.employmentStatus === "self-employed") && (
                <div className="bg-muted/30 rounded-lg p-4 space-y-4">
                    <h3 className="font-medium flex items-center gap-2">
                        <Building className="h-4 w-4" />
                        Employment Details
                    </h3>
                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                            <Label htmlFor="employerName" className="required">Employer/Company Name</Label>
                            <Input
                                id="employerName"
                                placeholder="Company name"
                                value={formData.employerName}
                                onChange={(e) => updateFormData("employerName", e.target.value)}
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="jobTitle" className="required">Job Title/Position</Label>
                            <Input
                                id="jobTitle"
                                placeholder="Your role"
                                value={formData.jobTitle}
                                onChange={(e) => updateFormData("jobTitle", e.target.value)}
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="yearsEmployed" className="required">Years with Current Employer</Label>
                            <Select
                                value={formData.yearsEmployed}
                                onValueChange={(value) => updateFormData("yearsEmployed", value)}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select duration" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="less-1">Less than 1 year</SelectItem>
                                    <SelectItem value="1-2">1-2 years</SelectItem>
                                    <SelectItem value="3-5">3-5 years</SelectItem>
                                    <SelectItem value="5-10">5-10 years</SelectItem>
                                    <SelectItem value="10+">More than 10 years</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="md:col-span-2 space-y-2">
                            <Label htmlFor="employerAddress">Employer Address</Label>
                            <Textarea
                                id="employerAddress"
                                placeholder="Full address of your workplace"
                                value={formData.employerAddress}
                                onChange={(e) => updateFormData("employerAddress", e.target.value)}
                                rows={2}
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* Income Details */}
            <div className="border-t pt-6">
                <h3 className="font-medium mb-4">Income Details</h3>
                <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                        <Label htmlFor="monthlyIncome" className="required">Monthly Income (After Tax)</Label>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                            <Input
                                id="monthlyIncome"
                                type="number"
                                placeholder="Enter amount"
                                className="pl-8"
                                value={formData.monthlyIncome}
                                onChange={(e) => updateFormData("monthlyIncome", e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="otherIncomeSources">Other Income Sources</Label>
                        <Input
                            id="otherIncomeSources"
                            placeholder="e.g., Rental income, investments"
                            value={formData.otherIncomeSources}
                            onChange={(e) => updateFormData("otherIncomeSources", e.target.value)}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="monthlyExpenses" className="required">Monthly Expenses</Label>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                            <Input
                                id="monthlyExpenses"
                                type="number"
                                placeholder="Enter amount"
                                className="pl-8"
                                value={formData.monthlyExpenses}
                                onChange={(e) => updateFormData("monthlyExpenses", e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="existingDebts">Existing Debts/Obligations</Label>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                            <Input
                                id="existingDebts"
                                type="number"
                                placeholder="Monthly debt payments"
                                className="pl-8"
                                value={formData.existingDebts}
                                onChange={(e) => updateFormData("existingDebts", e.target.value)}
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Existing Loans */}
            <div className="border-t pt-6">
                <div className="space-y-4">
                    <Label className="required">Do you have any existing loans?</Label>
                    <RadioGroup
                        value={formData.hasExistingLoans}
                        onValueChange={(value) => updateFormData("hasExistingLoans", value)}
                        className="flex gap-6"
                    >
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="yes" id="loans-yes" />
                            <Label htmlFor="loans-yes" className="cursor-pointer">Yes</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="no" id="loans-no" />
                            <Label htmlFor="loans-no" className="cursor-pointer">No</Label>
                        </div>
                    </RadioGroup>

                    {formData.hasExistingLoans === "yes" && (
                        <div className="space-y-2">
                            <Label htmlFor="existingLoanDetails">Please provide details of existing loans</Label>
                            <Textarea
                                id="existingLoanDetails"
                                placeholder="Include lender name, loan amount, monthly payment, and outstanding balance"
                                value={formData.existingLoanDetails}
                                onChange={(e) => updateFormData("existingLoanDetails", e.target.value)}
                                rows={3}
                            />
                        </div>
                    )}
                </div>
            </div>

            {/* Bank Details */}
            <div className="border-t pt-6">
                <h3 className="font-medium mb-4">Bank Account Details</h3>
                <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                        <Label htmlFor="bankName" className="required">Bank Name</Label>
                        <Input
                            id="bankName"
                            placeholder="Name of your bank"
                            value={formData.bankName}
                            onChange={(e) => updateFormData("bankName", e.target.value)}
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="bankAccountNumber" className="required">Account Number</Label>
                        <Input
                            id="bankAccountNumber"
                            placeholder="Your account number"
                            value={formData.bankAccountNumber}
                            onChange={(e) => updateFormData("bankAccountNumber", e.target.value)}
                            required
                        />
                    </div>
                </div>
            </div>

            {/* Document Upload */}
            <div className="border-t pt-6">
                <h3 className="font-medium mb-4">Proof of Income</h3>
                <div className="grid gap-4 md:grid-cols-2">
                    <FileUpload
                        label="Upload Recent Pay Slips (Last 3 months)"
                        documentType="pay-slips"
                        accept=".pdf,.jpg,.png,image/*"
                        maxSize={10}
                        required
                        onUploadComplete={(file) => {
                            console.log("Pay slips uploaded:", file);
                        }}
                    />

                    <FileUpload
                        label="Bank Statement (Last 3-6 months)"
                        documentType="bank-statement"
                        accept=".pdf,.jpg,.png,image/*"
                        maxSize={10}
                        onUploadComplete={(file) => {
                            console.log("Bank statement uploaded:", file);
                        }}
                    />
                </div>
            </div>
        </div>
    );
}

