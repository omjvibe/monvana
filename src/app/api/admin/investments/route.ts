import { NextResponse } from "next/server";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { createClient, SupabaseClient } from "@supabase/supabase-js";

function getAdminSupabase(): SupabaseClient {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
        throw new Error("Server configuration error");
    }

    return createClient(supabaseUrl, supabaseServiceKey);
}

interface AdminUser {
    id: string;
    role: string;
}

async function verifyAdmin(supabase: SupabaseClient, clerkUserId: string): Promise<AdminUser | null> {
    const { data: adminUser } = await supabase
        .from("users")
        .select("id, role")
        .eq("clerk_id", clerkUserId)
        .single();

    if (adminUser && (adminUser as AdminUser).role === "admin") {
        return adminUser as AdminUser;
    }

    return null;
}

// GET - Fetch all investment plans and user investments
export async function GET(req: Request) {
    try {
        const authSupabase = await createServerClient();
        const { data: { user: authUser } } = await authSupabase.auth.getUser();
        const userId = authUser?.id;
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const supabase = getAdminSupabase();
        const admin = await verifyAdmin(supabase, userId);
        if (!admin) {
            return NextResponse.json({ error: "Admin access required" }, { status: 403 });
        }

        // Fetch all investment plans
        const { data: plans, error: plansError } = await supabase
            .from("investment_plans")
            .select("*")
            .order("created_at", { ascending: false });

        if (plansError) {
            console.error("Error fetching plans:", plansError);
            return NextResponse.json({ error: "Failed to fetch plans" }, { status: 500 });
        }

        // Fetch all user investments with user info
        const { data: investments, error: investmentsError } = await supabase
            .from("user_investments")
            .select(`
                *,
                user:users!user_id(id, first_name, last_name, email),
                plan:investment_plans!plan_id(id, name, roi_percentage, duration_days)
            `)
            .order("created_at", { ascending: false });

        if (investmentsError) {
            console.error("Error fetching investments:", investmentsError);
        }

        // Calculate stats
        const totalInvested = investments?.filter(i => i.status === "active").reduce((sum, i) => sum + Number(i.amount), 0) || 0;
        const stats = {
            totalPlans: plans?.length || 0,
            activePlans: plans?.filter(p => p.is_active).length || 0,
            totalInvestments: investments?.length || 0,
            activeInvestments: investments?.filter(i => i.status === "active").length || 0,
            totalInvested,
        };

        return NextResponse.json({
            plans: plans || [],
            investments: investments || [],
            stats
        });

    } catch (error) {
        console.error("Error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

// POST - Create new investment plan
export async function POST(req: Request) {
    try {
        const authSupabase = await createServerClient();
        const { data: { user: authUser } } = await authSupabase.auth.getUser();
        const userId = authUser?.id;
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const supabase = getAdminSupabase();
        const admin = await verifyAdmin(supabase, userId);
        if (!admin) {
            return NextResponse.json({ error: "Admin access required" }, { status: 403 });
        }

        const body = await req.json();
        const { name, description, min_amount, max_amount, roi_percentage, duration_days, features, is_active } = body;

        if (!name || !min_amount || !roi_percentage || !duration_days) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        const { data, error } = await supabase.from("investment_plans").insert({
            name,
            description: description || "",
            min_amount: parseFloat(min_amount),
            max_amount: max_amount ? parseFloat(max_amount) : null,
            roi_percentage: parseFloat(roi_percentage),
            duration_days: parseInt(duration_days),
            features: features || [],
            is_active: is_active !== false,
        }).select().single();

        if (error) {
            console.error("Error creating plan:", error);
            return NextResponse.json({ error: "Failed to create plan" }, { status: 500 });
        }

        // Audit log (optional - table may not exist)
        try {
            await supabase.from("audit_logs").insert({
                admin_id: admin.id,
                action: "createInvestmentPlan",
                details: `Created investment plan: ${name}`,
                ip_address: req.headers.get("x-forwarded-for") || "unknown",
            });
        } catch (e) {
            console.log("Audit log skipped:", e);
        }

        return NextResponse.json({ success: true, plan: data });

    } catch (error) {
        console.error("Error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

// PATCH - Update investment plan or investment status
export async function PATCH(req: Request) {
    try {
        const authSupabase = await createServerClient();
        const { data: { user: authUser } } = await authSupabase.auth.getUser();
        const userId = authUser?.id;
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const supabase = getAdminSupabase();
        const admin = await verifyAdmin(supabase, userId);
        if (!admin) {
            return NextResponse.json({ error: "Admin access required" }, { status: 403 });
        }

        const body = await req.json();
        const { action } = body;

        switch (action) {
            case "updatePlan": {
                const { planId, name, description, min_amount, max_amount, roi_percentage, duration_days, features, is_active } = body;

                const updateData: Record<string, unknown> = {
                    updated_at: new Date().toISOString(),
                };

                if (name !== undefined) updateData.name = name;
                if (description !== undefined) updateData.description = description;
                if (min_amount !== undefined) updateData.min_amount = parseFloat(min_amount);
                if (max_amount !== undefined) updateData.max_amount = max_amount ? parseFloat(max_amount) : null;
                if (roi_percentage !== undefined) updateData.roi_percentage = parseFloat(roi_percentage);
                if (duration_days !== undefined) updateData.duration_days = parseInt(duration_days);
                if (features !== undefined) updateData.features = features;
                if (is_active !== undefined) updateData.is_active = is_active;

                const { error } = await supabase
                    .from("investment_plans")
                    .update(updateData)
                    .eq("id", planId);

                if (error) throw error;

                try {
                    await supabase.from("audit_logs").insert({
                        admin_id: admin.id,
                        action: "updateInvestmentPlan",
                        details: `Updated investment plan: ${planId}`,
                        ip_address: req.headers.get("x-forwarded-for") || "unknown",
                    });
                } catch (e) {
                    console.log("Audit log skipped:", e);
                }

                return NextResponse.json({ success: true, message: "Plan updated" });
            }

            case "updateInvestmentStatus": {
                const { investmentId, status } = body;

                const validStatuses = ["active", "matured", "withdrawn", "cancelled"];
                if (!validStatuses.includes(status)) {
                    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
                }

                // Get investment to notify user
                const { data: investment } = await supabase
                    .from("user_investments")
                    .select("*, plan:investment_plans!plan_id(name)")
                    .eq("id", investmentId)
                    .single();

                const { error } = await supabase
                    .from("user_investments")
                    .update({
                        status,
                        updated_at: new Date().toISOString(),
                        ...(status === "matured" ? { maturity_date: new Date().toISOString() } : {}),
                    })
                    .eq("id", investmentId);

                if (error) throw error;

                // Notify user
                if (investment) {
                    await supabase.from("notifications").insert({
                        user_id: investment.user_id,
                        title: `Investment ${status.charAt(0).toUpperCase() + status.slice(1)}`,
                        message: `Your investment in "${investment.plan?.name}" has been marked as ${status}.`,
                        type: "investment",
                        is_read: false,
                    });
                }

                return NextResponse.json({ success: true, message: "Investment status updated" });
            }

            default:
                return NextResponse.json({ error: "Unknown action" }, { status: 400 });
        }

    } catch (error) {
        console.error("Error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

// DELETE - Delete investment plan
export async function DELETE(req: Request) {
    try {
        const authSupabase = await createServerClient();
        const { data: { user: authUser } } = await authSupabase.auth.getUser();
        const userId = authUser?.id;
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const supabase = getAdminSupabase();
        const admin = await verifyAdmin(supabase, userId);
        if (!admin) {
            return NextResponse.json({ error: "Admin access required" }, { status: 403 });
        }

        const { searchParams } = new URL(req.url);
        const planId = searchParams.get("planId");

        if (!planId) {
            return NextResponse.json({ error: "Plan ID required" }, { status: 400 });
        }

        // Check if plan has active investments
        const { data: activeInvestments } = await supabase
            .from("user_investments")
            .select("id")
            .eq("plan_id", planId)
            .eq("status", "active");

        if (activeInvestments && activeInvestments.length > 0) {
            return NextResponse.json({
                error: "Cannot delete plan with active investments"
            }, { status: 400 });
        }

        const { error } = await supabase
            .from("investment_plans")
            .delete()
            .eq("id", planId);

        if (error) throw error;

        try {
            await supabase.from("audit_logs").insert({
                admin_id: admin.id,
                action: "deleteInvestmentPlan",
                details: `Deleted investment plan: ${planId}`,
                ip_address: req.headers.get("x-forwarded-for") || "unknown",
            });
        } catch (e) {
            console.log("Audit log skipped:", e);
        }

        return NextResponse.json({ success: true, message: "Plan deleted" });

    } catch (error) {
        console.error("Error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
