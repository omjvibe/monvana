import { NextResponse } from "next/server";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { createClient } from "@supabase/supabase-js";

export async function GET() {
    try {
        const authSupabase = await createServerClient();
        const { data: { user: authUser } } = await authSupabase.auth.getUser();
        const userId = authUser?.id;

        if (!userId) {
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

        // Verify user is admin
        const { data: user } = await supabase
            .from("users")
            .select("role")
            .eq("clerk_id", userId)
            .single();

        if (!user || user.role !== "admin") {
            return NextResponse.json(
                { error: "Unauthorized - Admin access required" },
                { status: 403 }
            );
        }

        // Fetch all loans with user info - specify the correct FK relationship
        const { data: loans, error } = await supabase
            .from("loans")
            .select("*, users!loans_user_id_fkey(first_name, last_name, email)")
            .order("created_at", { ascending: false });

        if (error) {
            console.error("Error fetching loans:", error);
            return NextResponse.json(
                { error: "Failed to fetch loans" },
                { status: 500 }
            );
        }

        // Also try to get loan_applications if the table exists
        let loanApplications = [];
        try {
            const { data: applications } = await supabase
                .from("loan_applications")
                .select("*, users!loan_applications_user_id_fkey(first_name, last_name, email)")
                .order("created_at", { ascending: false });

            loanApplications = applications || [];
        } catch (e) {
            console.log("loan_applications table may not exist");
        }

        return NextResponse.json({
            loans: loans || [],
            applications: loanApplications,
        });

    } catch (error) {
        console.error("Error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

export async function PATCH(req: Request) {
    try {
        const authSupabase = await createServerClient();
        const { data: { user: authUser } } = await authSupabase.auth.getUser();
        const userId = authUser?.id;

        if (!userId) {
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

        // Verify user is admin
        const { data: adminUser } = await supabase
            .from("users")
            .select("id, role")
            .eq("clerk_id", userId)
            .single();

        if (!adminUser || adminUser.role !== "admin") {
            return NextResponse.json(
                { error: "Unauthorized - Admin access required" },
                { status: 403 }
            );
        }

        const { loanId, status, adminNote } = await req.json();

        if (!loanId || !status) {
            return NextResponse.json(
                { error: "Loan ID and status are required" },
                { status: 400 }
            );
        }

        // First, get the current loan details
        const { data: currentLoan, error: loanFetchError } = await supabase
            .from("loans")
            .select("*")
            .eq("id", loanId)
            .single();

        if (loanFetchError || !currentLoan) {
            return NextResponse.json(
                { error: "Loan not found" },
                { status: 404 }
            );
        }

        // Update loan status
        const updateData: Record<string, unknown> = {
            status,
            updated_at: new Date().toISOString(),
        };

        if (status === "approved" || status === "active") {
            updateData.approved_by = adminUser.id;
            updateData.approved_at = new Date().toISOString();
        }

        if (adminNote) {
            updateData.admin_note = adminNote;
        }

        const { data: loan, error } = await supabase
            .from("loans")
            .update(updateData)
            .eq("id", loanId)
            .select("*, users!loans_user_id_fkey(first_name, last_name, email)")
            .single();

        if (error) {
            console.error("Error updating loan:", error);
            return NextResponse.json(
                { error: "Failed to update loan" },
                { status: 500 }
            );
        }

        // If loan is approved/active, credit user's wallet and create transaction
        if ((status === "approved" || status === "active") && currentLoan.status === "pending") {
            // Get user's primary USD wallet
            const { data: wallet } = await supabase
                .from("wallets")
                .select("*")
                .eq("user_id", loan.user_id)
                .eq("currency", "USD")
                .eq("is_primary", true)
                .single();

            if (wallet) {
                // Credit the loan amount to wallet
                const newBalance = parseFloat(wallet.balance) + parseFloat(loan.amount);

                const { error: walletError } = await supabase
                    .from("wallets")
                    .update({
                        balance: newBalance,
                        updated_at: new Date().toISOString()
                    })
                    .eq("id", wallet.id);

                if (walletError) {
                    console.error("Error updating wallet:", walletError);
                }

                // Create transaction record for the loan disbursement
                const transactionRef = `LOAN-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

                const { error: txError } = await supabase
                    .from("transactions")
                    .insert({
                        user_id: loan.user_id,
                        wallet_id: wallet.id,
                        type: "loan",
                        amount: loan.amount,
                        currency: "USD",
                        status: "approved",
                        description: `Loan disbursement - ${loan.purpose || "Personal Loan"}`,
                        reference: transactionRef,
                        processed_by: adminUser.id,
                        processed_at: new Date().toISOString(),
                    });

                if (txError) {
                    console.error("Error creating transaction:", txError);
                }

                console.log(`Loan approved: Credited $${loan.amount} to user ${loan.user_id}`);
            } else {
                console.error("Primary USD wallet not found for user:", loan.user_id);
            }
        }

        // Create notification for user
        if (loan) {
            let notificationTitle = "";
            let notificationContent = "";

            const formattedAmount = new Intl.NumberFormat("en-US", {
                style: "currency",
                currency: "USD",
            }).format(loan.amount);

            if (status === "active" || status === "approved") {
                notificationTitle = "Loan Approved! 🎉";
                notificationContent = `Great news! Your loan application for ${formattedAmount} has been approved and the funds have been credited to your account.`;
            } else if (status === "rejected") {
                notificationTitle = "Loan Application Update";
                notificationContent = `We regret to inform you that your loan application for ${formattedAmount} has been declined. Please contact support for more information.`;
            } else {
                notificationTitle = "Loan Status Update";
                notificationContent = `Your loan status has been updated to: ${status}`;
            }

            const { error: notifError } = await supabase.from("notifications").insert({
                user_id: loan.user_id,
                title: notificationTitle,
                message: notificationContent,
                type: "loan",
                is_read: false,
            });

            if (notifError) {
                console.error("Error creating notification:", notifError);
            }
        }

        return NextResponse.json({
            success: true,
            loan,
            message: status === "active" || status === "approved"
                ? "Loan approved and funds credited to user wallet"
                : `Loan status updated to ${status}`,
        });

    } catch (error) {
        console.error("Error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

