export interface LoanFormData {
    // Personal Information
    fullName: string;
    dateOfBirth: string;
    gender: string;
    maritalStatus: string;
    phoneNumber: string;
    alternativePhone: string;
    email: string;
    countryOfResidence: string;
    stateProvince: string;
    city: string;
    postalCode: string;
    residentialAddress: string;
    yearsAtAddress: string;
    residentialStatus: string;

    // Identification
    idType: string;
    idNumber: string;
    idExpiryDate: string;
    nationality: string;
    taxIdNumber: string;

    // Loan Type & Details
    loanType: string;
    loanAmount: string;
    loanPurpose: string;
    repaymentDuration: string;
    preferredCurrency: string;
    urgencyLevel: string;

    // Financial Information
    employmentStatus: string;
    employerName: string;
    employerAddress: string;
    jobTitle: string;
    yearsEmployed: string;
    monthlyIncome: string;
    otherIncomeSources: string;
    monthlyExpenses: string;
    existingDebts: string;
    hasExistingLoans: string;
    existingLoanDetails: string;
    creditScore: string;
    bankAccountNumber: string;
    bankName: string;

    // Business Loan Specifics
    businessName: string;
    businessAddress: string;
    businessType: string;
    natureOfBusiness: string;
    yearsInOperation: string;
    businessRegNumber: string;
    annualRevenue: string;
    numberOfEmployees: string;

    // Student Loan Specifics
    schoolName: string;
    schoolAddress: string;
    courseOfStudy: string;
    degreeLevel: string;
    expectedGraduation: string;
    studentId: string;

    // Car Loan Specifics
    carMake: string;
    carModel: string;
    carYear: string;
    carCondition: string;
    estimatedCarValue: string;
    dealerName: string;

    // Home Loan Specifics
    propertyAddress: string;
    propertyType: string;
    propertyValue: string;
    downPayment: string;
    isFirstHome: string;

    // International Loan Specifics
    countryApplyingFrom: string;
    internationalPurpose: string;
    foreignCurrency: string;

    // Emergency Contact
    emergencyContactName: string;
    emergencyContactPhone: string;
    emergencyContactRelation: string;

    // Collateral
    hasCollateral: string;
    collateralType: string;
    collateralValue: string;
    collateralDescription: string;

    // Guarantor
    hasGuarantor: string;
    guarantorName: string;
    guarantorPhone: string;
    guarantorAddress: string;
    guarantorRelation: string;
    guarantorOccupation: string;
    guarantorIncome: string;

    // Declaration
    agreeToTerms: boolean;
    signatureName: string;
    submissionDate: string;
}

export const initialLoanFormData: LoanFormData = {
    fullName: "",
    dateOfBirth: "",
    gender: "",
    maritalStatus: "",
    phoneNumber: "",
    alternativePhone: "",
    email: "",
    countryOfResidence: "",
    stateProvince: "",
    city: "",
    postalCode: "",
    residentialAddress: "",
    yearsAtAddress: "",
    residentialStatus: "",
    idType: "",
    idNumber: "",
    idExpiryDate: "",
    nationality: "",
    taxIdNumber: "",
    loanType: "",
    loanAmount: "",
    loanPurpose: "",
    repaymentDuration: "",
    preferredCurrency: "USD",
    urgencyLevel: "",
    employmentStatus: "",
    employerName: "",
    employerAddress: "",
    jobTitle: "",
    yearsEmployed: "",
    monthlyIncome: "",
    otherIncomeSources: "",
    monthlyExpenses: "",
    existingDebts: "",
    hasExistingLoans: "",
    existingLoanDetails: "",
    creditScore: "",
    bankAccountNumber: "",
    bankName: "",
    businessName: "",
    businessAddress: "",
    businessType: "",
    natureOfBusiness: "",
    yearsInOperation: "",
    businessRegNumber: "",
    annualRevenue: "",
    numberOfEmployees: "",
    schoolName: "",
    schoolAddress: "",
    courseOfStudy: "",
    degreeLevel: "",
    expectedGraduation: "",
    studentId: "",
    carMake: "",
    carModel: "",
    carYear: "",
    carCondition: "",
    estimatedCarValue: "",
    dealerName: "",
    propertyAddress: "",
    propertyType: "",
    propertyValue: "",
    downPayment: "",
    isFirstHome: "",
    countryApplyingFrom: "",
    internationalPurpose: "",
    foreignCurrency: "",
    emergencyContactName: "",
    emergencyContactPhone: "",
    emergencyContactRelation: "",
    hasCollateral: "",
    collateralType: "",
    collateralValue: "",
    collateralDescription: "",
    hasGuarantor: "",
    guarantorName: "",
    guarantorPhone: "",
    guarantorAddress: "",
    guarantorRelation: "",
    guarantorOccupation: "",
    guarantorIncome: "",
    agreeToTerms: false,
    signatureName: "",
    submissionDate: "",
};

export const loanTypes = [
    { value: "personal", label: "Personal Loan", description: "For personal expenses and emergencies" },
    { value: "business", label: "Business Loan", description: "For business operations and expansion" },
    { value: "salary", label: "Salary Earner Loan", description: "For employed individuals" },
    { value: "student", label: "Student Loan", description: "For educational expenses" },
    { value: "emergency", label: "Emergency Loan", description: "For urgent financial needs" },
    { value: "car", label: "Car/Auto Loan", description: "For vehicle purchase" },
    { value: "home", label: "Home/Mortgage Loan", description: "For property purchase" },
    { value: "international", label: "International Loan", description: "For cross-border needs" },
];

export const repaymentDurations = [
    { value: "3", label: "3 Months" },
    { value: "6", label: "6 Months" },
    { value: "12", label: "12 Months" },
    { value: "24", label: "24 Months" },
    { value: "36", label: "36 Months" },
    { value: "48", label: "48 Months" },
    { value: "60", label: "60 Months" },
    { value: "120", label: "120 Months (10 Years)" },
    { value: "180", label: "180 Months (15 Years)" },
    { value: "240", label: "240 Months (20 Years)" },
    { value: "360", label: "360 Months (30 Years)" },
];
