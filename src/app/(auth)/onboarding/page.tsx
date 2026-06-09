"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { ArrowRight, ArrowLeft, CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { BANK_NAME, COUNTRIES, OCCUPATIONS, CURRENCIES, ACCOUNT_TYPES } from "@/lib/constants";
import { toast } from "sonner";

interface IdTypeOption {
    label: string;
    placeholder: string;
    regex?: RegExp;
    formatHint?: string;
}

const ID_TYPES_MAP: Record<string, IdTypeOption[]> = {
    "United States": [
        { label: "Social Security Number (SSN)", placeholder: "XXX-XX-XXXX", regex: /^\d{3}-?\d{2}-?\d{4}$/, formatHint: "9 digits (e.g. 123-45-6789)" },
        { label: "Individual Taxpayer ID (ITIN)", placeholder: "9XX-XX-XXXX", regex: /^9\d{2}-?\d{2}-?\d{4}$/, formatHint: "Starts with 9 (e.g. 912-34-5678)" },
    ],
    "Nigeria": [
        { label: "National Identification Number (NIN)", placeholder: "11-digit number", regex: /^\d{11}$/, formatHint: "Exactly 11 digits" },
    ],
    "United Kingdom": [
        { label: "National Insurance Number (NI)", placeholder: "QQ 12 34 56 C", regex: /^[A-Z]{2}\s?\d{2}\s?\d{2}\s?\d{2}\s?[A-D]$/i, formatHint: "e.g. AB 12 34 56 C" },
    ],
    "Canada": [
        { label: "Social Insurance Number (SIN)", placeholder: "XXX XXX XXX", regex: /^\d{3}\s?\d{3}\s?\d{3}$/, formatHint: "9 digits (e.g. 123 456 789)" },
    ],
    "Australia": [
        { label: "Tax File Number (TFN)", placeholder: "XXX XXX XXX", regex: /^\d{8,9}$/, formatHint: "8 or 9 digits" },
    ],
    "Germany": [
        { label: "Steueridentifikationsnummer", placeholder: "11-digit number", regex: /^\d{11}$/, formatHint: "Exactly 11 digits" },
    ],
    "France": [
        { label: "Num\u00e9ro de S\u00e9curit\u00e9 Sociale", placeholder: "15-digit number", regex: /^\d{13,15}$/, formatHint: "13 to 15 digits" },
    ],
    "Ghana": [
        { label: "Ghana Card Number", placeholder: "GHA-XXXXXXXXX-X", regex: /^GHA-\d{9}-\d$/, formatHint: "e.g. GHA-123456789-0" },
    ],
    "India": [
        { label: "Aadhaar Number", placeholder: "XXXX XXXX XXXX", regex: /^\d{4}\s?\d{4}\s?\d{4}$/, formatHint: "12 digits (e.g. 1234 5678 9012)" },
        { label: "PAN Card", placeholder: "ABCDE1234F", regex: /^[A-Z]{5}\d{4}[A-Z]$/i, formatHint: "e.g. ABCDE1234F" },
    ],
    "South Africa": [
        { label: "ID Number", placeholder: "13-digit number", regex: /^\d{13}$/, formatHint: "Exactly 13 digits" },
    ],
    "Kenya": [
        { label: "National ID Number", placeholder: "8-digit number", regex: /^\d{7,8}$/, formatHint: "7 or 8 digits" },
    ],
    "Brazil": [
        { label: "CPF", placeholder: "XXX.XXX.XXX-XX", regex: /^\d{3}\.?\d{3}\.?\d{3}-?\d{2}$/, formatHint: "e.g. 123.456.789-00" },
    ],
    "Mexico": [
        { label: "CURP", placeholder: "18-character CURP", regex: /^[A-Z]{4}\d{6}[HM][A-Z]{5}[A-Z0-9]\d$/, formatHint: "18-character alphanumeric" },
    ],
    "Japan": [
        { label: "My Number", placeholder: "12-digit number", regex: /^\d{12}$/, formatHint: "Exactly 12 digits" },
    ],
    "China": [
        { label: "Resident ID Number", placeholder: "18-digit number", regex: /^\d{17}[\dX]$/i, formatHint: "18 characters (digits + X)" },
    ],
    "UAE": [
        { label: "Emirates ID", placeholder: "784-XXXX-XXXXXXX-X", regex: /^784-?\d{4}-?\d{7}-?\d$/, formatHint: "e.g. 784-1234-1234567-1" },
    ],
    "Saudi Arabia": [
        { label: "National ID (Iqama)", placeholder: "10-digit number", regex: /^\d{10}$/, formatHint: "Exactly 10 digits" },
    ],
};

const onboardingSchema = z.object({
    firstName: z.string().min(2, "First name must be at least 2 characters"),
    lastName: z.string().min(2, "Last name must be at least 2 characters"),
    occupation: z.string().min(1, "Please select your occupation"),
    country: z.string().min(1, "Please select your country"),
    kycIdType: z.string().optional(),
    kycIdNumber: z.string().optional(),
    currency: z.string().min(1, "Please select your preferred currency"),
    accountType: z.string().min(1, "Please select an account type"),
    accountName: z.string().min(2, "Account name must be at least 2 characters"),
});

type OnboardingData = z.infer<typeof onboardingSchema>;

const steps = [
    { id: 1, title: "Personal Information", description: "Tell us about yourself" },
    { id: 2, title: "Identity & Location", description: "Verify your region" },
    { id: 3, title: "Account Setup", description: "Choose your account preferences" },
];

export default function OnboardingPage() {
    const [currentStep, setCurrentStep] = useState(1);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isCheckingProfile, setIsCheckingProfile] = useState(true);
    const router = useRouter();
    const [authUser, setAuthUser] = useState<any>(null);
    const [isLoaded, setIsLoaded] = useState(false);
    const supabase = createClient();

    useEffect(() => {
        async function getUser() {
            const { data: { user } } = await supabase.auth.getUser();
            setAuthUser(user);
            setIsLoaded(true);
        }
        getUser();
    }, []);

    // Client-side guard: check if user already has a profile
    // This catches edge cases where the middleware check might not fire
    useEffect(() => {
        if (!isLoaded || !authUser) return;

        async function checkExistingProfile() {
            try {
                // Use a controller to timeout the request if it takes too long
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 5000);

                const response = await fetch("/api/user/status", { signal: controller.signal });
                clearTimeout(timeoutId);

                if (response.ok) {
                    const data = await response.json();
                    if (data.isOnboarded) {
                        console.log("[ONBOARDING] Profile already onboarded, redirecting to dashboard...");
                        // User is already fully onboarded — redirect to dashboard
                        window.location.href = data.role === "admin" ? "/admin" : "/user";
                        return;
                    }
                }
            } catch (error) {
                console.error("[ONBOARDING] Error checking profile:", error);
            } finally {
                setIsCheckingProfile(false);
            }
        }

        checkExistingProfile();
    }, [isLoaded, authUser]);

    const form = useForm<OnboardingData>({
        resolver: zodResolver(onboardingSchema),
        defaultValues: {
            firstName: authUser?.user_metadata?.first_name || "",
            lastName: authUser?.user_metadata?.last_name || "",
            occupation: "",
            country: "",
            kycIdType: "",
            kycIdNumber: "",
            currency: "USD",
            accountType: "savings",
            accountName: "",
        },
    });

    const { register, handleSubmit, setValue, watch, formState: { errors } } = form;

    const selectedCountry = watch("country");
    const selectedIdType = watch("kycIdType");
    const idOptions = ID_TYPES_MAP[selectedCountry] || [];
    const activeIdConfig = idOptions.find((opt) => opt.label === selectedIdType) || idOptions[0];

    const validateStep = () => {
        const values = form.getValues();

        if (currentStep === 1) {
            if (!values.firstName || values.firstName.length < 2) {
                toast.error("Please enter a valid first name");
                return false;
            }
            if (!values.lastName || values.lastName.length < 2) {
                toast.error("Please enter a valid last name");
                return false;
            }
        }

        if (currentStep === 2) {
            if (!values.occupation) {
                toast.error("Please select your occupation");
                return false;
            }
            if (!values.country) {
                toast.error("Please select your country");
                return false;
            }
            // KYC ID is mandatory for countries with mapped ID types
            if (idOptions.length > 0) {
                if (!values.kycIdNumber || values.kycIdNumber.trim() === "") {
                    toast.error(`Please enter your ${activeIdConfig?.label || "ID number"}`);
                    return false;
                }
                // Format validation
                if (activeIdConfig?.regex && !activeIdConfig.regex.test(values.kycIdNumber.trim())) {
                    toast.error(`Invalid format for ${activeIdConfig.label}. ${activeIdConfig.formatHint || ""}`);
                    return false;
                }
            }
        }

        return true;
    };

    const nextStep = () => {
        if (validateStep()) {
            setCurrentStep((prev) => Math.min(prev + 1, 3));
        }
    };

    const prevStep = () => {
        setCurrentStep((prev) => Math.max(prev - 1, 1));
    };

    const onSubmit = async (data: OnboardingData) => {
        setIsSubmitting(true);

        try {
            // Call the onboarding API
            const response = await fetch("/api/onboarding", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(data),
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || "Failed to create profile");
            }

            // Update Supabase Auth user metadata
            await supabase.auth.updateUser({
                data: {
                    first_name: data.firstName,
                    last_name: data.lastName,
                },
            });

            toast.success("Account created successfully!");

            // Use window.location for hard redirect to ensure state is fresh
            window.location.href = "/user";
        } catch (error) {
            console.error("Onboarding error:", error);
            toast.error(error instanceof Error ? error.message : "Something went wrong. Please try again.");
            setIsSubmitting(false);
        }
    };

    // Show loading while checking if user already has a profile
    if (isCheckingProfile) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <p className="text-sm text-muted-foreground">Checking your account...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen">
            {/* Left Panel - Progress */}
            <div className="hidden w-1/3 bg-muted/30 lg:flex lg:flex-col lg:p-12">
                <div className="flex items-center gap-2">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
                        <span className="text-xl font-bold text-primary-foreground">H</span>
                    </div>
                    <span className="text-2xl font-semibold">{BANK_NAME}</span>
                </div>

                <div className="mt-16 flex-1">
                    <h2 className="text-xl font-semibold">Complete Your Profile</h2>
                    <p className="mt-2 text-muted-foreground">
                        Just a few more steps to get you started.
                    </p>

                    <div className="mt-12 space-y-8">
                        {steps.map((step) => (
                            <div key={step.id} className="flex items-start gap-4">
                                <div
                                    className={`flex h-8 w-8 items-center justify-center rounded-full border-2 transition-colors ${currentStep > step.id
                                        ? "border-primary bg-primary text-primary-foreground"
                                        : currentStep === step.id
                                            ? "border-primary text-primary"
                                            : "border-muted-foreground/30 text-muted-foreground"
                                        }`}
                                >
                                    {currentStep > step.id ? (
                                        <CheckCircle2 className="h-5 w-5" />
                                    ) : (
                                        <span className="text-sm font-medium">{step.id}</span>
                                    )}
                                </div>
                                <div>
                                    <p
                                        className={`font-medium ${currentStep >= step.id ? "text-foreground" : "text-muted-foreground"
                                            }`}
                                    >
                                        {step.title}
                                    </p>
                                    <p className="text-sm text-muted-foreground">{step.description}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <p className="text-sm text-muted-foreground">
                    Your information is secure and encrypted.
                </p>
            </div>

            {/* Right Panel - Form */}
            <div className="flex w-full flex-col items-center justify-center bg-background px-4 py-12 lg:w-2/3">
                <div className="w-full max-w-md">
                    {/* Mobile Progress */}
                    <div className="mb-8 lg:hidden">
                        <div className="flex items-center justify-between">
                            {steps.map((step, index) => (
                                <div key={step.id} className="flex items-center">
                                    <div
                                        className={`flex h-8 w-8 items-center justify-center rounded-full border-2 text-sm ${currentStep > step.id
                                            ? "border-primary bg-primary text-primary-foreground"
                                            : currentStep === step.id
                                                ? "border-primary text-primary"
                                                : "border-muted text-muted-foreground"
                                            }`}
                                    >
                                        {currentStep > step.id ? <CheckCircle2 className="h-4 w-4" /> : step.id}
                                    </div>
                                    {index < steps.length - 1 && (
                                        <div
                                            className={`h-0.5 w-12 ${currentStep > step.id ? "bg-primary" : "bg-muted"
                                                }`}
                                        />
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    <h1 className="text-2xl font-bold">{steps[currentStep - 1].title}</h1>
                    <p className="mt-2 text-muted-foreground">
                        {steps[currentStep - 1].description}
                    </p>

                    <form onSubmit={handleSubmit(onSubmit)} className="mt-8">
                        <AnimatePresence mode="wait">
                            {currentStep === 1 && (
                                <motion.div
                                    key="step1"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    className="space-y-6"
                                >
                                    <div className="space-y-2">
                                        <Label htmlFor="firstName">First Name</Label>
                                        <Input
                                            id="firstName"
                                            placeholder="Enter your first name"
                                            {...register("firstName")}
                                        />
                                        {errors.firstName && (
                                            <p className="text-sm text-destructive">{errors.firstName.message}</p>
                                        )}
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="lastName">Last Name</Label>
                                        <Input
                                            id="lastName"
                                            placeholder="Enter your last name"
                                            {...register("lastName")}
                                        />
                                        {errors.lastName && (
                                            <p className="text-sm text-destructive">{errors.lastName.message}</p>
                                        )}
                                    </div>
                                </motion.div>
                            )}

                            {currentStep === 2 && (
                                <motion.div
                                    key="step2"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    className="space-y-6"
                                >
                                    <div className="space-y-2">
                                        <Label>Occupation</Label>
                                        <Select
                                            onValueChange={(value) => setValue("occupation", value)}
                                            value={watch("occupation")}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select your occupation" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {OCCUPATIONS.map((occupation) => (
                                                    <SelectItem key={occupation} value={occupation}>
                                                        {occupation}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Country</Label>
                                        <Select
                                            onValueChange={(value) => {
                                                setValue("country", value);
                                                // Auto-set the ID type if mapped
                                                const mappedTypes = ID_TYPES_MAP[value];
                                                if (mappedTypes && mappedTypes.length > 0) {
                                                    setValue("kycIdType", mappedTypes[0].label);
                                                } else {
                                                    setValue("kycIdType", "National ID");
                                                }
                                            }}
                                            value={watch("country")}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select your country" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {COUNTRIES.map((country) => (
                                                    <SelectItem key={country} value={country}>
                                                        {country}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    {idOptions.length > 0 && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="space-y-4"
                                        >
                                            {/* ID Type selector for countries with multiple types */}
                                            {idOptions.length > 1 && (
                                                <div className="space-y-2">
                                                    <Label>ID Type</Label>
                                                    <Select
                                                        onValueChange={(value) => setValue("kycIdType", value)}
                                                        value={selectedIdType || idOptions[0]?.label}
                                                    >
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Select ID type" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {idOptions.map((opt) => (
                                                                <SelectItem key={opt.label} value={opt.label}>
                                                                    {opt.label}
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                            )}

                                            <div className="space-y-2">
                                                <Label htmlFor="kycIdNumber">
                                                    {activeIdConfig?.label || "ID Number"} <span className="text-red-500">*</span>
                                                </Label>
                                                <Input
                                                    id="kycIdNumber"
                                                    placeholder={activeIdConfig?.placeholder || "Enter your ID number"}
                                                    {...register("kycIdNumber")}
                                                    className="font-mono tracking-wider"
                                                />
                                                <p className="text-[10px] text-muted-foreground uppercase tracking-widest leading-relaxed">
                                                    Required for institutional compliance in {selectedCountry}.
                                                    {activeIdConfig?.formatHint && (
                                                        <span className="block mt-0.5 normal-case tracking-normal text-[11px]">
                                                            Format: {activeIdConfig.formatHint}
                                                        </span>
                                                    )}
                                                </p>
                                            </div>
                                        </motion.div>
                                    )}
                                </motion.div>
                            )}

                            {currentStep === 3 && (
                                <motion.div
                                    key="step3"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    className="space-y-6"
                                >
                                    <div className="space-y-2">
                                        <Label>Preferred Currency</Label>
                                        <Select
                                            onValueChange={(value) => setValue("currency", value)}
                                            value={watch("currency")}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select currency" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {CURRENCIES.map((currency) => (
                                                    <SelectItem key={currency.code} value={currency.code}>
                                                        {currency.symbol} {currency.code} - {currency.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Account Type</Label>
                                        <Select
                                            onValueChange={(value) => setValue("accountType", value)}
                                            value={watch("accountType")}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select account type" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {ACCOUNT_TYPES.map((type) => (
                                                    <SelectItem key={type.id} value={type.id}>
                                                        {type.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="accountName">Account Name</Label>
                                        <Input
                                            id="accountName"
                                            placeholder="e.g., My Savings, Business Account"
                                            {...register("accountName")}
                                        />
                                        {errors.accountName && (
                                            <p className="text-sm text-destructive">{errors.accountName.message}</p>
                                        )}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <div className="mt-8 flex justify-between">
                            {currentStep > 1 ? (
                                <Button type="button" variant="outline" onClick={prevStep}>
                                    <ArrowLeft className="mr-2 h-4 w-4" />
                                    Back
                                </Button>
                            ) : (
                                <div />
                            )}

                            {currentStep < 3 ? (
                                <Button type="button" onClick={nextStep}>
                                    Continue
                                    <ArrowRight className="ml-2 h-4 w-4" />
                                </Button>
                            ) : (
                                <Button type="submit" disabled={isSubmitting}>
                                    {isSubmitting ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Creating account...
                                        </>
                                    ) : (
                                        <>
                                            Complete Setup
                                            <ArrowRight className="ml-2 h-4 w-4" />
                                        </>
                                    )}
                                </Button>
                            )}
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
