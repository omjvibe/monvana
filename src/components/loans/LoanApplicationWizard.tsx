"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { useUser } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
    ChevronLeft,
    ChevronRight,
    Landmark,
    Loader2,
    Check,
    User,
    IdCard,
    HandCoins,
    Coins,
    Briefcase,
    FileText,
    ShieldPlus,
    FileSearch,
} from "lucide-react";
import { LoanFormData, initialLoanFormData, loanTypes } from "./types";

// Import steps
import PersonalInfoStep from "./steps/PersonalInfoStep";
import IdentificationStep from "./steps/IdentificationStep";
import LoanTypeStep from "./steps/LoanTypeStep";
import LoanDetailsStep from "./steps/LoanDetailsStep";
import FinancialInfoStep from "./steps/FinancialInfoStep";
import AdditionalRequirementsStep from "./steps/AdditionalRequirementsStep";
import CollateralGuarantorStep from "./steps/CollateralGuarantorStep";
import ReviewStep from "./steps/ReviewStep";


const steps = [
    { id: 1, name: "Personal Info", icon: User },
    { id: 2, name: "Identification", icon: IdCard },
    { id: 3, name: "Loan Type", icon: HandCoins },
    { id: 4, name: "Loan Details", icon: Coins },
    { id: 5, name: "Financial", icon: Briefcase },
    { id: 6, name: "Requirements", icon: FileText },
    { id: 7, name: "Security", icon: ShieldPlus },
    { id: 8, name: "Review", icon: FileSearch },
];

export default function LoanApplicationWizard() {
    const router = useRouter();
    const { user } = useUser();
    const [currentStep, setCurrentStep] = useState(1);
    const [formData, setFormData] = useState<LoanFormData>(initialLoanFormData);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        // Pre-fill user data from Clerk
        if (user) {
            setFormData((prev) => ({
                ...prev,
                fullName: `${user.firstName || ""} ${user.lastName || ""}`.trim(),
                email: user.emailAddresses[0]?.emailAddress || "",
            }));
        }
    }, [user]);

    const updateFormData = (field: keyof LoanFormData, value: string | boolean) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
    };

    const progress = (currentStep / steps.length) * 100;

    const validateStep = (step: number): boolean => {
        switch (step) {
            case 1: // Personal Info
                return !!(
                    formData.fullName &&
                    formData.dateOfBirth &&
                    formData.gender &&
                    formData.phoneNumber &&
                    formData.email &&
                    formData.countryOfResidence
                );
            case 2: // Identification
                return !!(formData.idType && formData.idNumber && formData.idExpiryDate);
            case 3: // Loan Type
                return !!formData.loanType;
            case 4: // Loan Details
                return !!(formData.loanAmount && formData.repaymentDuration && formData.loanPurpose);
            case 5: // Financial Info
                return !!(formData.employmentStatus && formData.monthlyIncome);
            case 6: // Additional Requirements
                return true; // Conditional fields handled within component
            case 7: // Collateral & Guarantor
                return !!(formData.emergencyContactName && formData.emergencyContactPhone);
            case 8: // Review
                return formData.agreeToTerms && !!formData.signatureName;
            default:
                return true;
        }
    };

    const goToNextStep = () => {
        if (!validateStep(currentStep)) {
            toast.error("Please fill in all required fields");
            return;
        }
        if (currentStep < steps.length) {
            setCurrentStep(currentStep + 1);
            window.scrollTo({ top: 0, behavior: "smooth" });
        }
    };

    const goToPrevStep = () => {
        if (currentStep > 1) {
            setCurrentStep(currentStep - 1);
            window.scrollTo({ top: 0, behavior: "smooth" });
        }
    };

    const handleSubmit = async () => {
        if (!validateStep(currentStep)) {
            toast.error("Please agree to the terms and sign the application");
            return;
        }

        setIsSubmitting(true);

        try {
            // Submit loan application via server API (handles user lookup and RLS)
            const response = await fetch("/api/loans/apply", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(formData),
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || "Failed to submit application");
            }

            toast.success("Loan application submitted successfully!");
            router.push("/user/loans");
        } catch (error) {
            console.error("Error submitting loan:", error);
            toast.error(error instanceof Error ? error.message : "Failed to submit loan application. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const renderStep = () => {
        switch (currentStep) {
            case 1:
                return <PersonalInfoStep formData={formData} updateFormData={updateFormData} />;
            case 2:
                return <IdentificationStep formData={formData} updateFormData={updateFormData} />;
            case 3:
                return <LoanTypeStep formData={formData} updateFormData={updateFormData} />;
            case 4:
                return <LoanDetailsStep formData={formData} updateFormData={updateFormData} />;
            case 5:
                return <FinancialInfoStep formData={formData} updateFormData={updateFormData} />;
            case 6:
                return <AdditionalRequirementsStep formData={formData} updateFormData={updateFormData} />;
            case 7:
                return <CollateralGuarantorStep formData={formData} updateFormData={updateFormData} />;
            case 8:
                return (
                    <div className="space-y-6">
                        <ReviewStep formData={formData} />
                        {/* Declaration */}
                        <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
                            <div className="flex items-start space-x-3 mb-4">
                                <Checkbox
                                    id="terms"
                                    checked={formData.agreeToTerms}
                                    onCheckedChange={(checked) => updateFormData("agreeToTerms", checked as boolean)}
                                />
                                <Label htmlFor="terms" className="text-sm leading-relaxed cursor-pointer">
                                    I confirm that all information provided is accurate and true. I understand that providing
                                    false information may result in the rejection of my application and potential legal action.
                                    I agree to Monvana Bank's terms and conditions for loan services.
                                </Label>
                            </div>
                        </div>

                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="signatureName" className="required">
                                    Digital Signature (Type Your Full Name)
                                </Label>
                                <Input
                                    id="signatureName"
                                    placeholder="Type your full legal name"
                                    value={formData.signatureName}
                                    onChange={(e) => updateFormData("signatureName", e.target.value)}
                                    className="font-cursive text-lg"
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="submissionDate" className="required">
                                    Date of Submission
                                </Label>
                                <Input
                                    id="submissionDate"
                                    type="date"
                                    value={formData.submissionDate || new Date().toISOString().split("T")[0]}
                                    onChange={(e) => updateFormData("submissionDate", e.target.value)}
                                    required
                                />
                            </div>
                        </div>
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <div className="min-h-screen bg-background pb-20">
            {/* Header */}
            <div className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground py-8 px-4 mb-8">
                <div className="max-w-4xl mx-auto text-center">
                    <div className="flex items-center justify-center gap-3 mb-2">
                        <Landmark className="h-8 w-8" />
                        <h1 className="text-2xl md:text-3xl font-bold">Monvana Bank</h1>
                    </div>
                    <p className="text-primary-foreground/80">Loan Application</p>
                </div>
            </div>

            <div className="max-w-4xl mx-auto px-4">
                {/* Progress Indicator */}
                <div className="mb-8">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">Step {currentStep} of {steps.length}</span>
                        <span className="text-sm text-muted-foreground">{Math.round(progress)}% Complete</span>
                    </div>
                    <Progress value={progress} className="h-2" />

                    {/* Step indicators - Desktop */}
                    <div className="hidden md:flex justify-between mt-4">
                        {steps.map((step) => {
                            const Icon = step.icon;
                            const isCompleted = currentStep > step.id;
                            const isCurrent = currentStep === step.id;

                            return (
                                <div
                                    key={step.id}
                                    className={`flex flex-col items-center gap-1 ${isCurrent
                                        ? "text-primary"
                                        : isCompleted
                                            ? "text-green-600"
                                            : "text-muted-foreground"
                                        }`}
                                >
                                    <div
                                        className={`flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all ${isCurrent
                                            ? "border-primary bg-primary text-primary-foreground"
                                            : isCompleted
                                                ? "border-green-600 bg-green-600 text-white"
                                                : "border-muted-foreground/30 bg-muted"
                                            }`}
                                    >
                                        {isCompleted ? <Check className="h-5 w-5" /> : <Icon className="h-5 w-5" />}
                                    </div>
                                    <span className="text-xs font-medium text-center">{step.name}</span>
                                </div>
                            );
                        })}
                    </div>

                    {/* Step indicator - Mobile */}
                    <div className="flex md:hidden items-center justify-center gap-1 mt-4">
                        {steps.map((step) => (
                            <div
                                key={step.id}
                                className={`h-2 w-8 rounded-full transition-all ${currentStep === step.id
                                    ? "bg-primary"
                                    : currentStep > step.id
                                        ? "bg-green-600"
                                        : "bg-muted"
                                    }`}
                            />
                        ))}
                    </div>
                </div>

                {/* Form Content */}
                <Card className="shadow-lg">
                    <CardContent className="p-6 md:p-8">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={currentStep}
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                transition={{ duration: 0.3 }}
                            >
                                {renderStep()}
                            </motion.div>
                        </AnimatePresence>
                    </CardContent>
                </Card>

                {/* Navigation Buttons */}
                <div className="flex justify-between mt-6">
                    <Button
                        variant="outline"
                        onClick={goToPrevStep}
                        disabled={currentStep === 1}
                        className="gap-2"
                    >
                        <ChevronLeft className="h-4 w-4" />
                        Previous
                    </Button>

                    {currentStep < steps.length ? (
                        <Button onClick={goToNextStep} className="gap-2">
                            Next
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    ) : (
                        <Button
                            onClick={handleSubmit}
                            disabled={isSubmitting || !formData.agreeToTerms || !formData.signatureName}
                            className="gap-2 bg-green-600 hover:bg-green-700"
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Submitting...
                                </>
                            ) : (
                                <>
                                    <Check className="h-4 w-4" />
                                    Submit Application
                                </>
                            )}
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
}
