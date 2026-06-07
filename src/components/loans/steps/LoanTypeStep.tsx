"use client";

import { LoanFormData, loanTypes } from "../types";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { HandCoins, Building2, GraduationCap, Car, Home, Briefcase, AlertTriangle, Globe } from "lucide-react";
import { cn } from "@/lib/utils";

interface LoanTypeStepProps {
    formData: LoanFormData;
    updateFormData: (field: keyof LoanFormData, value: string) => void;
}

const loanTypeIcons: Record<string, React.ReactNode> = {
    personal: <HandCoins className="h-6 w-6" />,
    business: <Building2 className="h-6 w-6" />,
    salary: <Briefcase className="h-6 w-6" />,
    student: <GraduationCap className="h-6 w-6" />,
    emergency: <AlertTriangle className="h-6 w-6" />,
    car: <Car className="h-6 w-6" />,
    home: <Home className="h-6 w-6" />,
    international: <Globe className="h-6 w-6" />,
};

export default function LoanTypeStep({ formData, updateFormData }: LoanTypeStepProps) {
    return (
        <div className="space-y-6">
            <div className="flex items-center gap-3 mb-6">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <HandCoins className="h-5 w-5" />
                </div>
                <div>
                    <h2 className="text-xl font-semibold">Select Loan Type</h2>
                    <p className="text-sm text-muted-foreground">Choose the type of loan that best fits your needs</p>
                </div>
            </div>

            <RadioGroup
                value={formData.loanType}
                onValueChange={(value) => updateFormData("loanType", value)}
                className="grid gap-4 md:grid-cols-2"
            >
                {loanTypes.map((type) => (
                    <div key={type.value}>
                        <RadioGroupItem
                            value={type.value}
                            id={type.value}
                            className="peer sr-only"
                        />
                        <Label
                            htmlFor={type.value}
                            className={cn(
                                "flex items-start gap-4 rounded-lg border-2 p-4 cursor-pointer transition-all",
                                "hover:border-primary/50 hover:bg-muted/50",
                                formData.loanType === type.value
                                    ? "border-primary bg-primary/5"
                                    : "border-muted"
                            )}
                        >
                            <div className={cn(
                                "flex h-12 w-12 items-center justify-center rounded-lg flex-shrink-0",
                                formData.loanType === type.value
                                    ? "bg-primary text-primary-foreground"
                                    : "bg-muted text-muted-foreground"
                            )}>
                                {loanTypeIcons[type.value]}
                            </div>
                            <div className="flex-1">
                                <p className="font-semibold">{type.label}</p>
                                <p className="text-sm text-muted-foreground">{type.description}</p>
                            </div>
                        </Label>
                    </div>
                ))}
            </RadioGroup>

            {formData.loanType && (
                <div className="bg-muted/50 rounded-lg p-4 mt-6">
                    <h3 className="font-medium mb-2">
                        {loanTypes.find(t => t.value === formData.loanType)?.label} Selected
                    </h3>
                    <p className="text-sm text-muted-foreground">
                        {formData.loanType === "personal" && "Personal loans are versatile and can be used for various personal expenses such as medical bills, home improvements, vacations, or debt consolidation."}
                        {formData.loanType === "business" && "Business loans help entrepreneurs fund operations, expand their business, purchase equipment, or manage cash flow. Additional business documentation will be required."}
                        {formData.loanType === "salary" && "Salary earner loans are designed for employed individuals with a regular income. You'll need to provide employment verification and recent pay slips."}
                        {formData.loanType === "student" && "Student loans help cover educational expenses including tuition, books, and living expenses. You'll need to provide proof of enrollment."}
                        {formData.loanType === "emergency" && "Emergency loans provide quick access to funds for urgent situations. Faster processing with competitive rates."}
                        {formData.loanType === "car" && "Car loans help you purchase a new or used vehicle. You'll need to provide vehicle details and may require a down payment."}
                        {formData.loanType === "home" && "Home loans (mortgages) are long-term loans for purchasing property. Requires property documentation and typically has lower interest rates."}
                        {formData.loanType === "international" && "International loans cater to cross-border financial needs. Additional documentation about the purpose and destination country may be required."}
                    </p>
                </div>
            )}
        </div>
    );
}
