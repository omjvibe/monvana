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
import { User } from "lucide-react";
import { COUNTRIES } from "@/lib/constants";

interface PersonalInfoStepProps {
    formData: LoanFormData;
    updateFormData: (field: keyof LoanFormData, value: string) => void;
}

export default function PersonalInfoStep({ formData, updateFormData }: PersonalInfoStepProps) {
    return (
        <div className="space-y-6">
            <div className="flex items-center gap-3 mb-6">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <User className="h-5 w-5" />
                </div>
                <div>
                    <h2 className="text-xl font-semibold">Personal Information</h2>
                    <p className="text-sm text-muted-foreground">Please provide your personal details</p>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                    <Label htmlFor="fullName" className="required">Full Legal Name</Label>
                    <Input
                        id="fullName"
                        placeholder="As it appears on your ID"
                        value={formData.fullName}
                        onChange={(e) => updateFormData("fullName", e.target.value)}
                        required
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="dateOfBirth" className="required">Date of Birth</Label>
                    <Input
                        id="dateOfBirth"
                        type="date"
                        value={formData.dateOfBirth}
                        onChange={(e) => updateFormData("dateOfBirth", e.target.value)}
                        required
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="gender" className="required">Gender</Label>
                    <Select
                        value={formData.gender}
                        onValueChange={(value) => updateFormData("gender", value)}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Select gender" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="male">Male</SelectItem>
                            <SelectItem value="female">Female</SelectItem>
                            <SelectItem value="other">Prefer not to say</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="maritalStatus" className="required">Marital Status</Label>
                    <Select
                        value={formData.maritalStatus}
                        onValueChange={(value) => updateFormData("maritalStatus", value)}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="single">Single</SelectItem>
                            <SelectItem value="married">Married</SelectItem>
                            <SelectItem value="divorced">Divorced</SelectItem>
                            <SelectItem value="widowed">Widowed</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="phoneNumber" className="required">Phone Number</Label>
                    <Input
                        id="phoneNumber"
                        type="tel"
                        placeholder="+1 234 567 8900"
                        value={formData.phoneNumber}
                        onChange={(e) => updateFormData("phoneNumber", e.target.value)}
                        required
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="alternativePhone">Alternative Phone (Optional)</Label>
                    <Input
                        id="alternativePhone"
                        type="tel"
                        placeholder="+1 234 567 8900"
                        value={formData.alternativePhone}
                        onChange={(e) => updateFormData("alternativePhone", e.target.value)}
                    />
                </div>

                <div className="md:col-span-2 space-y-2">
                    <Label htmlFor="email" className="required">Email Address</Label>
                    <Input
                        id="email"
                        type="email"
                        placeholder="your.email@example.com"
                        value={formData.email}
                        onChange={(e) => updateFormData("email", e.target.value)}
                        required
                    />
                </div>
            </div>

            <div className="border-t pt-6 mt-6">
                <h3 className="font-medium mb-4">Residential Address</h3>
                <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                        <Label htmlFor="countryOfResidence" className="required">Country of Residence</Label>
                        <Select
                            value={formData.countryOfResidence}
                            onValueChange={(value) => updateFormData("countryOfResidence", value)}
                        >
                            <SelectTrigger id="countryOfResidence">
                                <SelectValue placeholder="Select country" />
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

                    <div className="space-y-2">
                        <Label htmlFor="stateProvince" className="required">State/Province</Label>
                        <Input
                            id="stateProvince"
                            placeholder="e.g., California"
                            value={formData.stateProvince}
                            onChange={(e) => updateFormData("stateProvince", e.target.value)}
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="city" className="required">City</Label>
                        <Input
                            id="city"
                            placeholder="e.g., Los Angeles"
                            value={formData.city}
                            onChange={(e) => updateFormData("city", e.target.value)}
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="postalCode" className="required">Postal/ZIP Code</Label>
                        <Input
                            id="postalCode"
                            placeholder="e.g., 90001"
                            value={formData.postalCode}
                            onChange={(e) => updateFormData("postalCode", e.target.value)}
                            required
                        />
                    </div>

                    <div className="md:col-span-2 space-y-2">
                        <Label htmlFor="residentialAddress" className="required">Full Residential Address</Label>
                        <Textarea
                            id="residentialAddress"
                            placeholder="Street address, apartment, building, etc."
                            value={formData.residentialAddress}
                            onChange={(e) => updateFormData("residentialAddress", e.target.value)}
                            rows={2}
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="yearsAtAddress" className="required">Years at Current Address</Label>
                        <Select
                            value={formData.yearsAtAddress}
                            onValueChange={(value) => updateFormData("yearsAtAddress", value)}
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

                    <div className="space-y-2">
                        <Label htmlFor="residentialStatus" className="required">Residential Status</Label>
                        <Select
                            value={formData.residentialStatus}
                            onValueChange={(value) => updateFormData("residentialStatus", value)}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="owner">Home Owner</SelectItem>
                                <SelectItem value="renter">Renting</SelectItem>
                                <SelectItem value="family">Living with Family</SelectItem>
                                <SelectItem value="other">Other</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </div>
        </div>
    );
}
