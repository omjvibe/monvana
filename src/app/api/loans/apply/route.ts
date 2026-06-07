import { NextResponse } from "next/server";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: Request) {
    try {
        const authSupabase = await createServerClient();
        const { data: { user: authUser } } = await authSupabase.auth.getUser();
        const userId = authUser?.id;
        

        if (!userId || !authUser) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

        if (!supabaseUrl || !supabaseServiceKey) {
            return NextResponse.json(
                { error: "Server configuration error" },
                { status: 500 }
            );
        }

        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        // Get form data from request
        const formData = await req.json();

        // Get user from database
        const { data: dbUser, error: userError } = await supabase
            .from("users")
            .select("id, first_name, last_name, email")
            .eq("clerk_id", userId)
            .single();

        if (userError || !dbUser) {
            console.error("User not found:", userError);
            return NextResponse.json(
                { error: "User not found in database. Please contact support." },
                { status: 404 }
            );
        }

        // Calculate loan payment details
        const principal = parseFloat(formData.loanAmount) || 0;
        const months = parseInt(formData.repaymentDuration) || 12;
        const annualRate = 0.08;
        const monthlyRate = annualRate / 12;
        const monthlyPayment = principal * (monthlyRate * Math.pow(1 + monthlyRate, months)) / (Math.pow(1 + monthlyRate, months) - 1);
        const totalPayable = monthlyPayment * months;

        // Prepare loan application data
        const applicationData = {
            user_id: dbUser.id,
            status: "submitted",
            // Loan Type & Details
            loan_type: formData.loanType,
            loan_amount: principal,
            loan_purpose: formData.loanPurpose,
            repayment_duration: months,
            preferred_currency: formData.preferredCurrency || "USD",
            urgency_level: formData.urgencyLevel,
            // Personal Information
            full_name: formData.fullName,
            date_of_birth: formData.dateOfBirth || null,
            gender: formData.gender,
            marital_status: formData.maritalStatus,
            phone_number: formData.phoneNumber,
            alternative_phone: formData.alternativePhone,
            email: formData.email,
            // Address Information
            country_of_residence: formData.countryOfResidence,
            state_province: formData.stateProvince,
            city: formData.city,
            postal_code: formData.postalCode,
            residential_address: formData.residentialAddress,
            years_at_address: formData.yearsAtAddress,
            residential_status: formData.residentialStatus,
            // Identification
            id_type: formData.idType,
            id_number: formData.idNumber,
            id_expiry_date: formData.idExpiryDate || null,
            nationality: formData.nationality,
            tax_id_number: formData.taxIdNumber,
            // Financial Information
            employment_status: formData.employmentStatus,
            employer_name: formData.employerName,
            employer_address: formData.employerAddress,
            job_title: formData.jobTitle,
            years_employed: formData.yearsEmployed,
            monthly_income: parseFloat(formData.monthlyIncome) || 0,
            other_income_sources: formData.otherIncomeSources,
            monthly_expenses: parseFloat(formData.monthlyExpenses) || 0,
            existing_debts: parseFloat(formData.existingDebts) || 0,
            has_existing_loans: formData.hasExistingLoans === "yes",
            existing_loan_details: formData.existingLoanDetails,
            bank_account_number: formData.bankAccountNumber,
            bank_name: formData.bankName,
            // Business Loan Specifics
            business_name: formData.businessName,
            business_address: formData.businessAddress,
            business_type: formData.businessType,
            nature_of_business: formData.natureOfBusiness,
            years_in_operation: formData.yearsInOperation ? parseInt(formData.yearsInOperation) : null,
            business_reg_number: formData.businessRegNumber,
            annual_revenue: formData.annualRevenue ? parseFloat(formData.annualRevenue) : null,
            number_of_employees: formData.numberOfEmployees ? parseInt(formData.numberOfEmployees) : null,
            // Student Loan Specifics
            school_name: formData.schoolName,
            school_address: formData.schoolAddress,
            course_of_study: formData.courseOfStudy,
            degree_level: formData.degreeLevel,
            expected_graduation: formData.expectedGraduation,
            student_id: formData.studentId,
            // Car Loan Specifics
            car_make: formData.carMake,
            car_model: formData.carModel,
            car_year: formData.carYear ? parseInt(formData.carYear) : null,
            car_condition: formData.carCondition,
            estimated_car_value: formData.estimatedCarValue ? parseFloat(formData.estimatedCarValue) : null,
            dealer_name: formData.dealerName,
            // Home Loan Specifics
            property_address: formData.propertyAddress,
            property_type: formData.propertyType,
            property_value: formData.propertyValue ? parseFloat(formData.propertyValue) : null,
            down_payment: formData.downPayment ? parseFloat(formData.downPayment) : null,
            is_first_home: formData.isFirstHome === "yes",
            // International Loan Specifics
            country_applying_from: formData.countryApplyingFrom,
            international_purpose: formData.internationalPurpose,
            foreign_currency: formData.foreignCurrency,
            // Emergency Contact
            emergency_contact_name: formData.emergencyContactName,
            emergency_contact_phone: formData.emergencyContactPhone,
            emergency_contact_relation: formData.emergencyContactRelation,
            // Collateral
            has_collateral: formData.hasCollateral === "yes",
            collateral_type: formData.collateralType,
            collateral_value: formData.collateralValue ? parseFloat(formData.collateralValue) : null,
            collateral_description: formData.collateralDescription,
            // Guarantor
            has_guarantor: formData.hasGuarantor === "yes",
            guarantor_name: formData.guarantorName,
            guarantor_phone: formData.guarantorPhone,
            guarantor_address: formData.guarantorAddress,
            guarantor_relation: formData.guarantorRelation,
            guarantor_occupation: formData.guarantorOccupation,
            guarantor_income: formData.guarantorIncome ? parseFloat(formData.guarantorIncome) : null,
            // Declaration
            agree_to_terms: formData.agreeToTerms,
            signature_name: formData.signatureName,
            submission_date: formData.submissionDate || new Date().toISOString().split("T")[0],
            submitted_at: new Date().toISOString(),
            // Calculated fields
            interest_rate: annualRate * 100,
            monthly_payment: monthlyPayment || 0,
            total_payable: totalPayable || 0,
            // Document references (if any)
            documents: formData.documents || [],
        };

        // Try to insert into loan_applications first
        const { data: appData, error: appError } = await supabase
            .from("loan_applications")
            .insert(applicationData)
            .select()
            .single();

        let applicationId = appData?.id;

        if (appError) {
            console.log("loan_applications table might not exist, falling back to loans table:", appError.message);
        }

        // Also create a record in the loans table for dashboard display
        const loanRecord = {
            user_id: dbUser.id,
            application_id: applicationId || null,
            amount: principal,
            term_months: months,
            interest_rate: 8.0,
            monthly_payment: monthlyPayment || 0,
            total_payable: totalPayable || 0,
            remaining_balance: totalPayable || 0,
            purpose: formData.loanPurpose,
            loan_type: formData.loanType,
            status: "pending",
            has_guarantor: formData.hasGuarantor === "yes",
            guarantor_name: formData.guarantorName || null,
            collateral_type: formData.hasCollateral === "yes" ? formData.collateralType : null,
            collateral_value: formData.hasCollateral === "yes" && formData.collateralValue ? parseFloat(formData.collateralValue) : null,
        };

        const { error: loanError } = await supabase.from("loans").insert(loanRecord);

        if (loanError) {
            console.error("Error creating loan record:", loanError);
            // If loan_applications didn't work and loans also failed
            if (appError) {
                return NextResponse.json(
                    { error: "Failed to submit loan application. Please try again." },
                    { status: 500 }
                );
            }
        }

        // Create notification
        await supabase.from("notifications").insert({
            user_id: dbUser.id,
            content: `Your ${formData.loanType} loan application for $${principal.toLocaleString()} has been submitted and is under review.`,
            type: "loan",
            is_read: false,
        });

        return NextResponse.json({
            success: true,
            message: "Loan application submitted successfully",
            applicationNumber: appData?.application_number,
        });

    } catch (error) {
        console.error("Loan application error:", error);
        return NextResponse.json(
            { error: "Failed to process loan application" },
            { status: 500 }
        );
    }
}
