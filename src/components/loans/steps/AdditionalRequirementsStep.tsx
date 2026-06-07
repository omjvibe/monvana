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
import { Building2, GraduationCap, Car, Home, Globe } from "lucide-react";
import FileUpload from "../FileUpload";

interface AdditionalRequirementsStepProps {
    formData: LoanFormData;
    updateFormData: (field: keyof LoanFormData, value: string) => void;
}

export default function AdditionalRequirementsStep({ formData, updateFormData }: AdditionalRequirementsStepProps) {
    const loanType = formData.loanType;

    return (
        <div className="space-y-6">
            {/* Business Loan Requirements */}
            {loanType === "business" && (
                <div className="space-y-6">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-500/10 text-blue-600">
                            <Building2 className="h-5 w-5" />
                        </div>
                        <div>
                            <h2 className="text-xl font-semibold">Business Information</h2>
                            <p className="text-sm text-muted-foreground">Details about your business</p>
                        </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                            <Label htmlFor="businessName" className="required">Business Name</Label>
                            <Input
                                id="businessName"
                                placeholder="Legal business name"
                                value={formData.businessName}
                                onChange={(e) => updateFormData("businessName", e.target.value)}
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="businessType" className="required">Business Type</Label>
                            <Select
                                value={formData.businessType}
                                onValueChange={(value) => updateFormData("businessType", value)}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select type" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="sole-proprietorship">Sole Proprietorship</SelectItem>
                                    <SelectItem value="partnership">Partnership</SelectItem>
                                    <SelectItem value="llc">Limited Liability Company (LLC)</SelectItem>
                                    <SelectItem value="corporation">Corporation</SelectItem>
                                    <SelectItem value="non-profit">Non-Profit Organization</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="natureOfBusiness" className="required">Nature of Business</Label>
                            <Input
                                id="natureOfBusiness"
                                placeholder="e.g., Retail, Manufacturing, Services"
                                value={formData.natureOfBusiness}
                                onChange={(e) => updateFormData("natureOfBusiness", e.target.value)}
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="yearsInOperation" className="required">Years in Operation</Label>
                            <Input
                                id="yearsInOperation"
                                type="number"
                                placeholder="How many years"
                                value={formData.yearsInOperation}
                                onChange={(e) => updateFormData("yearsInOperation", e.target.value)}
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="businessRegNumber" className="required">Registration Number</Label>
                            <Input
                                id="businessRegNumber"
                                placeholder="Business registration number"
                                value={formData.businessRegNumber}
                                onChange={(e) => updateFormData("businessRegNumber", e.target.value)}
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="numberOfEmployees">Number of Employees</Label>
                            <Input
                                id="numberOfEmployees"
                                type="number"
                                placeholder="Total employees"
                                value={formData.numberOfEmployees}
                                onChange={(e) => updateFormData("numberOfEmployees", e.target.value)}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="annualRevenue" className="required">Annual Revenue</Label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                                <Input
                                    id="annualRevenue"
                                    type="number"
                                    placeholder="Last year's revenue"
                                    className="pl-8"
                                    value={formData.annualRevenue}
                                    onChange={(e) => updateFormData("annualRevenue", e.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        <div className="md:col-span-2 space-y-2">
                            <Label htmlFor="businessAddress" className="required">Business Address</Label>
                            <Textarea
                                id="businessAddress"
                                placeholder="Full business address"
                                value={formData.businessAddress}
                                onChange={(e) => updateFormData("businessAddress", e.target.value)}
                                rows={2}
                                required
                            />
                        </div>
                    </div>

                    <div className="border-t pt-6">
                        <h3 className="font-medium mb-4">Business Documents</h3>
                        <div className="grid gap-4 md:grid-cols-2">
                            <FileUpload
                                label="Business Registration Certificate"
                                documentType="business-reg"
                                accept=".pdf,.jpg,.png,image/*"
                                maxSize={10}
                                required
                                onUploadComplete={(file) => console.log("Business reg uploaded:", file)}
                            />
                            <FileUpload
                                label="Financial Statements"
                                documentType="financial-statements"
                                accept=".pdf,.jpg,.png,image/*"
                                maxSize={10}
                                required
                                onUploadComplete={(file) => console.log("Financial statements uploaded:", file)}
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* Student Loan Requirements */}
            {loanType === "student" && (
                <div className="space-y-6">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-500/10 text-purple-600">
                            <GraduationCap className="h-5 w-5" />
                        </div>
                        <div>
                            <h2 className="text-xl font-semibold">Educational Information</h2>
                            <p className="text-sm text-muted-foreground">Details about your education</p>
                        </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                            <Label htmlFor="schoolName" className="required">School/University Name</Label>
                            <Input
                                id="schoolName"
                                placeholder="Name of institution"
                                value={formData.schoolName}
                                onChange={(e) => updateFormData("schoolName", e.target.value)}
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="courseOfStudy" className="required">Course of Study</Label>
                            <Input
                                id="courseOfStudy"
                                placeholder="e.g., Computer Science"
                                value={formData.courseOfStudy}
                                onChange={(e) => updateFormData("courseOfStudy", e.target.value)}
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="degreeLevel" className="required">Degree Level</Label>
                            <Select
                                value={formData.degreeLevel}
                                onValueChange={(value) => updateFormData("degreeLevel", value)}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select level" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="certificate">Certificate</SelectItem>
                                    <SelectItem value="diploma">Diploma</SelectItem>
                                    <SelectItem value="bachelors">Bachelor's Degree</SelectItem>
                                    <SelectItem value="masters">Master's Degree</SelectItem>
                                    <SelectItem value="doctorate">Doctorate/PhD</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="expectedGraduation" className="required">Expected Graduation</Label>
                            <Input
                                id="expectedGraduation"
                                type="month"
                                value={formData.expectedGraduation}
                                onChange={(e) => updateFormData("expectedGraduation", e.target.value)}
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="studentId" className="required">Student ID Number</Label>
                            <Input
                                id="studentId"
                                placeholder="Your student ID"
                                value={formData.studentId}
                                onChange={(e) => updateFormData("studentId", e.target.value)}
                                required
                            />
                        </div>

                        <div className="md:col-span-2 space-y-2">
                            <Label htmlFor="schoolAddress">School Address</Label>
                            <Textarea
                                id="schoolAddress"
                                placeholder="Full address of your institution"
                                value={formData.schoolAddress}
                                onChange={(e) => updateFormData("schoolAddress", e.target.value)}
                                rows={2}
                            />
                        </div>
                    </div>

                    <div className="border-t pt-6">
                        <h3 className="font-medium mb-4">Student Documents</h3>
                        <div className="grid gap-4 md:grid-cols-2">
                            <FileUpload
                                label="Student ID Card"
                                documentType="student-id"
                                accept=".pdf,.jpg,.png,image/*"
                                maxSize={10}
                                required
                                onUploadComplete={(file) => console.log("Student ID uploaded:", file)}
                            />
                            <FileUpload
                                label="Enrollment Letter"
                                documentType="enrollment-letter"
                                accept=".pdf,.jpg,.png,image/*"
                                maxSize={10}
                                required
                                onUploadComplete={(file) => console.log("Enrollment letter uploaded:", file)}
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* Car Loan Requirements */}
            {loanType === "car" && (
                <div className="space-y-6">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-500/10 text-green-600">
                            <Car className="h-5 w-5" />
                        </div>
                        <div>
                            <h2 className="text-xl font-semibold">Vehicle Information</h2>
                            <p className="text-sm text-muted-foreground">Details about the vehicle</p>
                        </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                            <Label htmlFor="carMake" className="required">Vehicle Make</Label>
                            <Input
                                id="carMake"
                                placeholder="e.g., Toyota, BMW"
                                value={formData.carMake}
                                onChange={(e) => updateFormData("carMake", e.target.value)}
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="carModel" className="required">Vehicle Model</Label>
                            <Input
                                id="carModel"
                                placeholder="e.g., Camry, X5"
                                value={formData.carModel}
                                onChange={(e) => updateFormData("carModel", e.target.value)}
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="carYear" className="required">Year</Label>
                            <Input
                                id="carYear"
                                type="number"
                                placeholder="e.g., 2024"
                                value={formData.carYear}
                                onChange={(e) => updateFormData("carYear", e.target.value)}
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="carCondition" className="required">Condition</Label>
                            <Select
                                value={formData.carCondition}
                                onValueChange={(value) => updateFormData("carCondition", value)}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select condition" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="new">Brand New</SelectItem>
                                    <SelectItem value="certified-used">Certified Pre-Owned</SelectItem>
                                    <SelectItem value="used">Used</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="estimatedCarValue" className="required">Estimated Value</Label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                                <Input
                                    id="estimatedCarValue"
                                    type="number"
                                    placeholder="Vehicle price"
                                    className="pl-8"
                                    value={formData.estimatedCarValue}
                                    onChange={(e) => updateFormData("estimatedCarValue", e.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="dealerName">Dealer Name (if applicable)</Label>
                            <Input
                                id="dealerName"
                                placeholder="Name of car dealer"
                                value={formData.dealerName}
                                onChange={(e) => updateFormData("dealerName", e.target.value)}
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* Home Loan Requirements */}
            {loanType === "home" && (
                <div className="space-y-6">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-500/10 text-orange-600">
                            <Home className="h-5 w-5" />
                        </div>
                        <div>
                            <h2 className="text-xl font-semibold">Property Information</h2>
                            <p className="text-sm text-muted-foreground">Details about the property</p>
                        </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="md:col-span-2 space-y-2">
                            <Label htmlFor="propertyAddress" className="required">Property Address</Label>
                            <Textarea
                                id="propertyAddress"
                                placeholder="Full address of the property"
                                value={formData.propertyAddress}
                                onChange={(e) => updateFormData("propertyAddress", e.target.value)}
                                rows={2}
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="propertyType" className="required">Property Type</Label>
                            <Select
                                value={formData.propertyType}
                                onValueChange={(value) => updateFormData("propertyType", value)}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select type" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="single-family">Single Family Home</SelectItem>
                                    <SelectItem value="condo">Condominium</SelectItem>
                                    <SelectItem value="townhouse">Townhouse</SelectItem>
                                    <SelectItem value="multi-family">Multi-Family</SelectItem>
                                    <SelectItem value="land">Land/Lot</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="isFirstHome" className="required">Is this your first home?</Label>
                            <Select
                                value={formData.isFirstHome}
                                onValueChange={(value) => updateFormData("isFirstHome", value)}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="yes">Yes, first home</SelectItem>
                                    <SelectItem value="no">No, I already own property</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="propertyValue" className="required">Property Value</Label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                                <Input
                                    id="propertyValue"
                                    type="number"
                                    placeholder="Estimated value"
                                    className="pl-8"
                                    value={formData.propertyValue}
                                    onChange={(e) => updateFormData("propertyValue", e.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="downPayment" className="required">Down Payment Amount</Label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                                <Input
                                    id="downPayment"
                                    type="number"
                                    placeholder="Amount you'll pay upfront"
                                    className="pl-8"
                                    value={formData.downPayment}
                                    onChange={(e) => updateFormData("downPayment", e.target.value)}
                                    required
                                />
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* International Loan Requirements */}
            {loanType === "international" && (
                <div className="space-y-6">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-cyan-500/10 text-cyan-600">
                            <Globe className="h-5 w-5" />
                        </div>
                        <div>
                            <h2 className="text-xl font-semibold">International Loan Details</h2>
                            <p className="text-sm text-muted-foreground">Additional information for international loans</p>
                        </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                            <Label htmlFor="countryApplyingFrom" className="required">Country Applying From</Label>
                            <Input
                                id="countryApplyingFrom"
                                placeholder="Your current country"
                                value={formData.countryApplyingFrom}
                                onChange={(e) => updateFormData("countryApplyingFrom", e.target.value)}
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="foreignCurrency">Preferred Currency for Disbursement</Label>
                            <Select
                                value={formData.foreignCurrency}
                                onValueChange={(value) => updateFormData("foreignCurrency", value)}
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

                        <div className="md:col-span-2 space-y-2">
                            <Label htmlFor="internationalPurpose" className="required">Purpose for International Loan</Label>
                            <Textarea
                                id="internationalPurpose"
                                placeholder="Explain why you need an international loan..."
                                value={formData.internationalPurpose}
                                onChange={(e) => updateFormData("internationalPurpose", e.target.value)}
                                rows={4}
                                required
                            />
                        </div>
                    </div>

                    <div className="border-t pt-6">
                        <h3 className="font-medium mb-4">Additional Documents</h3>
                        <div className="grid gap-4 md:grid-cols-2">
                            <FileUpload
                                label="Proof of Address (Current Country)"
                                documentType="address-proof"
                                accept=".pdf,.jpg,.png,image/*"
                                maxSize={10}
                                required
                                onUploadComplete={(file) => console.log("Address proof uploaded:", file)}
                            />
                            <FileUpload
                                label="Visa/Immigration Status"
                                documentType="visa-doc"
                                accept=".pdf,.jpg,.png,image/*"
                                maxSize={10}
                                onUploadComplete={(file) => console.log("Visa doc uploaded:", file)}
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* For loan types that don't have additional requirements */}
            {(loanType === "personal" || loanType === "emergency" || loanType === "salary") && (
                <div className="text-center py-8">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-500/10 text-green-600 mx-auto mb-4">
                        <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                    <h3 className="font-semibold text-lg mb-2">No Additional Requirements</h3>
                    <p className="text-muted-foreground max-w-md mx-auto">
                        Based on your selected loan type, no additional documents are required at this stage.
                        Please proceed to the next step.
                    </p>
                </div>
            )}
        </div>
    );
}
