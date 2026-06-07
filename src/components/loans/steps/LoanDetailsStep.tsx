"use client";

import { LoanFormData, repaymentDurations } from "../types";
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
import { Coins, Calculator } from "lucide-react";

interface LoanDetailsStepProps {
    formData: LoanFormData;
    updateFormData: (field: keyof LoanFormData, value: string) => void;
}

export default function LoanDetailsStep({ formData, updateFormData }: LoanDetailsStepProps) {
    // Calculate estimated monthly payment
    const calculateMonthlyPayment = () => {
        const principal = parseFloat(formData.loanAmount) || 0;
        const months = parseInt(formData.repaymentDuration) || 12;
        const annualRate = 0.08; // 8% default rate
        const monthlyRate = annualRate / 12;

        if (principal <= 0 || months <= 0) return 0;

        const payment = principal * (monthlyRate * Math.pow(1 + monthlyRate, months)) / (Math.pow(1 + monthlyRate, months) - 1);
        return isNaN(payment) ? 0 : payment;
    };

    const monthlyPayment = calculateMonthlyPayment();

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-3 mb-6">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <Coins className="h-5 w-5" />
                </div>
                <div>
                    <h2 className="text-xl font-semibold">Loan Details</h2>
                    <p className="text-sm text-muted-foreground">Specify the loan amount and terms</p>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                    <Label htmlFor="loanAmount" className="required">Loan Amount</Label>
                    <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                        <Input
                            id="loanAmount"
                            type="number"
                            placeholder="Enter amount"
                            className="pl-8"
                            value={formData.loanAmount}
                            onChange={(e) => updateFormData("loanAmount", e.target.value)}
                            required
                        />
                    </div>
                    <p className="text-xs text-muted-foreground">
                        Min: $500 • Max: $500,000
                    </p>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="preferredCurrency" className="required">Preferred Currency</Label>
                    <Select
                        value={formData.preferredCurrency}
                        onValueChange={(value) => updateFormData("preferredCurrency", value)}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Select currency" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="USD">USD - US Dollar</SelectItem>
                            <SelectItem value="EUR">EUR - Euro</SelectItem>
                            <SelectItem value="GBP">GBP - British Pound</SelectItem>
                            <SelectItem value="CAD">CAD - Canadian Dollar</SelectItem>
                            <SelectItem value="AUD">AUD - Australian Dollar</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="repaymentDuration" className="required">Repayment Duration</Label>
                    <Select
                        value={formData.repaymentDuration}
                        onValueChange={(value) => updateFormData("repaymentDuration", value)}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Select duration" />
                        </SelectTrigger>
                        <SelectContent>
                            {repaymentDurations.map((duration) => (
                                <SelectItem key={duration.value} value={duration.value}>
                                    {duration.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="urgencyLevel" className="required">How Soon Do You Need The Funds?</Label>
                    <Select
                        value={formData.urgencyLevel}
                        onValueChange={(value) => updateFormData("urgencyLevel", value)}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Select urgency" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="asap">As soon as possible (1-3 days)</SelectItem>
                            <SelectItem value="week">Within 1 week</SelectItem>
                            <SelectItem value="two-weeks">Within 2 weeks</SelectItem>
                            <SelectItem value="month">Within a month</SelectItem>
                            <SelectItem value="flexible">Flexible / No rush</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="md:col-span-2 space-y-2">
                    <Label htmlFor="loanPurpose" className="required">Purpose of the Loan</Label>
                    <Textarea
                        id="loanPurpose"
                        placeholder="Please describe in detail what you intend to use the loan for..."
                        value={formData.loanPurpose}
                        onChange={(e) => updateFormData("loanPurpose", e.target.value)}
                        rows={4}
                        required
                    />
                    <p className="text-xs text-muted-foreground">
                        Providing a clear purpose helps us process your application faster
                    </p>
                </div>
            </div>

            {/* Loan Calculator Preview */}
            {formData.loanAmount && formData.repaymentDuration && (
                <div className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-lg p-6 mt-6">
                    <div className="flex items-center gap-2 mb-4">
                        <Calculator className="h-5 w-5 text-primary" />
                        <h3 className="font-semibold">Estimated Loan Summary</h3>
                    </div>
                    <div className="grid gap-4 md:grid-cols-3">
                        <div>
                            <p className="text-sm text-muted-foreground">Loan Amount</p>
                            <p className="text-2xl font-bold">
                                ${parseFloat(formData.loanAmount || "0").toLocaleString()}
                            </p>
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Est. Monthly Payment</p>
                            <p className="text-2xl font-bold text-primary">
                                ${monthlyPayment.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </p>
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Total Repayment</p>
                            <p className="text-2xl font-bold">
                                ${(monthlyPayment * parseInt(formData.repaymentDuration || "0")).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </p>
                        </div>
                    </div>
                    <p className="text-xs text-muted-foreground mt-4">
                        * This is an estimate based on an 8% annual interest rate. Actual rates may vary based on your profile and loan type.
                    </p>
                </div>
            )}
        </div>
    );
}
