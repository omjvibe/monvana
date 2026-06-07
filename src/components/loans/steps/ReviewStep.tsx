"use client";

import { LoanFormData, loanTypes, repaymentDurations } from "../types";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
    FileSearch,
    User,
    IdCard,
    HandCoins,
    Coins,
    Briefcase,
    ShieldPlus,
    Check
} from "lucide-react";

interface ReviewStepProps {
    formData: LoanFormData;
}

export default function ReviewStep({ formData }: ReviewStepProps) {
    const loanTypeLabel = loanTypes.find(t => t.value === formData.loanType)?.label || formData.loanType;
    const durationLabel = repaymentDurations.find(d => d.value === formData.repaymentDuration)?.label || formData.repaymentDuration;

    const formatCurrency = (value: string) => {
        const num = parseFloat(value);
        if (isNaN(num)) return value;
        return new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: formData.preferredCurrency || "USD",
        }).format(num);
    };

    const SectionHeader = ({ icon: Icon, title }: { icon: any; title: string }) => (
        <div className="flex items-center gap-2 mb-3">
            <Icon className="h-4 w-4 text-primary" />
            <h3 className="font-semibold">{title}</h3>
        </div>
    );

    const InfoRow = ({ label, value }: { label: string; value: string | undefined }) => (
        <div className="flex justify-between py-1">
            <span className="text-muted-foreground text-sm">{label}</span>
            <span className="text-sm font-medium text-right max-w-[60%]">{value || "-"}</span>
        </div>
    );

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-3 mb-6">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <FileSearch className="h-5 w-5" />
                </div>
                <div>
                    <h2 className="text-xl font-semibold">Review Your Application</h2>
                    <p className="text-sm text-muted-foreground">Please review all information before submitting</p>
                </div>
            </div>

            <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg p-4 mb-6">
                <div className="flex gap-3">
                    <Check className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <div className="text-sm">
                        <p className="font-medium text-green-800 dark:text-green-200">Almost Done!</p>
                        <p className="text-green-700 dark:text-green-300">
                            Review your application details below. Click "Submit Application" to complete your loan request.
                        </p>
                    </div>
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                {/* Personal Information */}
                <div className="bg-muted/30 rounded-lg p-4">
                    <SectionHeader icon={User} title="Personal Information" />
                    <div className="space-y-1">
                        <InfoRow label="Full Name" value={formData.fullName} />
                        <InfoRow label="Date of Birth" value={formData.dateOfBirth} />
                        <InfoRow label="Gender" value={formData.gender} />
                        <InfoRow label="Marital Status" value={formData.maritalStatus} />
                        <InfoRow label="Phone" value={formData.phoneNumber} />
                        <InfoRow label="Email" value={formData.email} />
                        <InfoRow label="Country" value={formData.countryOfResidence} />
                        <InfoRow label="City" value={formData.city} />
                    </div>
                </div>

                {/* Identification */}
                <div className="bg-muted/30 rounded-lg p-4">
                    <SectionHeader icon={IdCard} title="Identification" />
                    <div className="space-y-1">
                        <InfoRow label="ID Type" value={formData.idType} />
                        <InfoRow label="ID Number" value={formData.idNumber} />
                        <InfoRow label="Expiry Date" value={formData.idExpiryDate} />
                        <InfoRow label="Nationality" value={formData.nationality} />
                        {formData.taxIdNumber && <InfoRow label="Tax ID" value={formData.taxIdNumber} />}
                    </div>
                </div>

                {/* Loan Details */}
                <div className="bg-primary/5 rounded-lg p-4 md:col-span-2">
                    <SectionHeader icon={HandCoins} title="Loan Details" />
                    <div className="grid gap-4 md:grid-cols-4 mt-4">
                        <div className="text-center p-3 bg-background rounded-lg">
                            <p className="text-xs text-muted-foreground mb-1">Loan Type</p>
                            <Badge variant="secondary" className="text-sm">{loanTypeLabel}</Badge>
                        </div>
                        <div className="text-center p-3 bg-background rounded-lg">
                            <p className="text-xs text-muted-foreground mb-1">Amount</p>
                            <p className="text-xl font-bold text-primary">{formatCurrency(formData.loanAmount)}</p>
                        </div>
                        <div className="text-center p-3 bg-background rounded-lg">
                            <p className="text-xs text-muted-foreground mb-1">Duration</p>
                            <p className="font-semibold">{durationLabel}</p>
                        </div>
                        <div className="text-center p-3 bg-background rounded-lg">
                            <p className="text-xs text-muted-foreground mb-1">Currency</p>
                            <p className="font-semibold">{formData.preferredCurrency}</p>
                        </div>
                    </div>
                    {formData.loanPurpose && (
                        <div className="mt-4 p-3 bg-background rounded-lg">
                            <p className="text-xs text-muted-foreground mb-1">Purpose</p>
                            <p className="text-sm">{formData.loanPurpose}</p>
                        </div>
                    )}
                </div>

                {/* Financial Information */}
                <div className="bg-muted/30 rounded-lg p-4">
                    <SectionHeader icon={Coins} title="Financial Information" />
                    <div className="space-y-1">
                        <InfoRow label="Employment Status" value={formData.employmentStatus} />
                        {formData.employerName && <InfoRow label="Employer" value={formData.employerName} />}
                        {formData.jobTitle && <InfoRow label="Position" value={formData.jobTitle} />}
                        <InfoRow label="Monthly Income" value={formatCurrency(formData.monthlyIncome)} />
                        <InfoRow label="Monthly Expenses" value={formatCurrency(formData.monthlyExpenses)} />
                        <InfoRow label="Existing Loans" value={formData.hasExistingLoans === "yes" ? "Yes" : "No"} />
                    </div>
                </div>

                {/* Employment Details */}
                <div className="bg-muted/30 rounded-lg p-4">
                    <SectionHeader icon={Briefcase} title="Banking Details" />
                    <div className="space-y-1">
                        <InfoRow label="Bank Name" value={formData.bankName} />
                        <InfoRow label="Account Number" value={formData.bankAccountNumber ? `****${formData.bankAccountNumber.slice(-4)}` : "-"} />
                    </div>
                </div>

                {/* Collateral & Guarantor */}
                <div className="bg-muted/30 rounded-lg p-4 md:col-span-2">
                    <SectionHeader icon={ShieldPlus} title="Security" />
                    <div className="grid gap-4 md:grid-cols-2">
                        <div>
                            <p className="text-sm font-medium mb-2">Collateral</p>
                            {formData.hasCollateral === "yes" ? (
                                <div className="space-y-1">
                                    <InfoRow label="Type" value={formData.collateralType} />
                                    <InfoRow label="Value" value={formatCurrency(formData.collateralValue)} />
                                </div>
                            ) : (
                                <p className="text-sm text-muted-foreground">No collateral provided</p>
                            )}
                        </div>
                        <div>
                            <p className="text-sm font-medium mb-2">Guarantor</p>
                            {formData.hasGuarantor === "yes" ? (
                                <div className="space-y-1">
                                    <InfoRow label="Name" value={formData.guarantorName} />
                                    <InfoRow label="Relationship" value={formData.guarantorRelation} />
                                    <InfoRow label="Phone" value={formData.guarantorPhone} />
                                </div>
                            ) : (
                                <p className="text-sm text-muted-foreground">No guarantor provided</p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Emergency Contact */}
                <div className="bg-muted/30 rounded-lg p-4 md:col-span-2">
                    <p className="text-sm font-medium mb-2">Emergency Contact</p>
                    <div className="grid gap-4 md:grid-cols-3">
                        <InfoRow label="Name" value={formData.emergencyContactName} />
                        <InfoRow label="Phone" value={formData.emergencyContactPhone} />
                        <InfoRow label="Relationship" value={formData.emergencyContactRelation} />
                    </div>
                </div>
            </div>

            <Separator className="my-6" />

            <div className="text-center text-sm text-muted-foreground">
                <p>By clicking "Submit Application", you confirm that all information provided is accurate and complete.</p>
                <p className="mt-1">False information may result in application rejection or legal action.</p>
            </div>
        </div>
    );
}
