import { NextRequest, NextResponse } from "next/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
    try {
        // Check if Supabase is configured
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

        if (!supabaseUrl || !supabaseServiceKey) {
            console.warn("Supabase not configured - skipping database save");
            // Still return success so the flow continues
            return NextResponse.json(
                { success: true, message: "Profile saved (database not configured)" },
                { status: 200 }
            );
        }

        const supabase = createServiceClient(supabaseUrl, supabaseServiceKey);

        // Get authenticated user from Supabase Auth
        const authSupabase = await createClient();
        const { data: { user: authUser } } = await authSupabase.auth.getUser();

        if (!authUser) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        const userId = authUser.id;
        const email = authUser.email || "";

        const body = await request.json();
        const {
            firstName,
            lastName,
            occupation,
            country,
            kycIdType,
            kycIdNumber,
            currency,
            accountType,
            accountName,
        } = body;

        // Validate required fields
        if (!firstName || !lastName || !occupation || !country) {
            return NextResponse.json(
                { error: "Missing required fields" },
                { status: 400 }
            );
        }

        // Check if user already exists in Supabase
        const { data: existingUser, error: fetchError } = await supabase
            .from("users")
            .select("id")
            .eq("clerk_id", userId)
            .single();

        if (fetchError && fetchError.code !== "PGRST116") {
            // PGRST116 = not found, which is ok
            console.error("Error checking existing user:", fetchError);
        }

        if (existingUser) {
            // Update existing user (only user-table columns)
            const { error: updateError } = await supabase
                .from("users")
                .update({
                    first_name: firstName,
                    last_name: lastName,
                    occupation,
                    country,
                    kyc_id_type: kycIdType,
                    kyc_id_number: kycIdNumber,
                    status: "active",
                    updated_at: new Date().toISOString(),
                })
                .eq("clerk_id", userId);

            if (updateError) {
                console.error("Error updating user:", updateError);
                return NextResponse.json(
                    { error: "Failed to update user profile" },
                    { status: 500 }
                );
            }

            console.log(`User updated via onboarding: ${email}`);
        } else {
            // Create new user in Supabase (only user-table columns)
            const { data: newUser, error: userError } = await supabase
                .from("users")
                .insert({
                    clerk_id: userId,
                    email,
                    first_name: firstName,
                    last_name: lastName,
                    avatar_url: authUser.user_metadata?.avatar_url || "",
                    occupation,
                    country,
                    kyc_id_type: kycIdType,
                    kyc_id_number: kycIdNumber,
                    role: "user",
                    status: "active",
                })
                .select()
                .single();

            if (userError) {
                console.error("Error creating user:", userError);
                return NextResponse.json(
                    { error: "Failed to create user profile: " + userError.message },
                    { status: 500 }
                );
            }

            // Create default wallet for the user (wallet-table columns)
            if (newUser) {
                const accountNumber = generateAccountNumber();
                const { error: walletError } = await supabase
                    .from("wallets")
                    .insert({
                        user_id: newUser.id,
                        currency: currency || "USD",
                        balance: 0,
                        account_type: accountType || "savings",
                        account_number: accountNumber,
                        account_name: accountName || `${firstName} ${lastName}`,
                        is_primary: true,
                    });

                if (walletError) {
                    console.error("Error creating wallet:", walletError);
                    // Don't fail the request, wallet can be created later
                }

                // Log the action
                try {
                    await supabase.from("audit_logs").insert({
                        action: "user_onboarded",
                        target_type: "user",
                        target_id: newUser.id,
                        actor_id: newUser.id,
                        actor_email: email,
                        category: "auth",
                        details: {
                            country,
                            occupation,
                            kyc_id_type: kycIdType,
                            account_type: accountType,
                        },
                    });
                } catch (auditError) {
                    console.error("Audit log error:", auditError);
                }

                console.log(`User created via onboarding: ${email}`);
            }
        }

        return NextResponse.json(
            { success: true, message: "Profile created successfully" },
            { status: 200 }
        );
    } catch (error) {
        console.error("Onboarding error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

// Generate a unique 10-digit account number
function generateAccountNumber(): string {
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.floor(Math.random() * 10000)
        .toString()
        .padStart(4, "0");
    return timestamp + random;
}
