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

// Optional audit logging - won't fail if table doesn't exist
async function logAudit(supabase: SupabaseClient, adminId: string, action: string, details: string, ip: string) {
    try {
        await supabase.from("audit_logs").insert({
            admin_id: adminId,
            action,
            details,
            ip_address: ip,
        });
    } catch (e) {
        console.log("Audit log skipped (table may not exist):", e);
    }
}

// GET - Fetch all charities and donations
export async function GET() {
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

        // Fetch all charities
        const { data: charities, error: charitiesError } = await supabase
            .from("charities")
            .select("*")
            .order("created_at", { ascending: false });

        if (charitiesError) {
            console.error("Error fetching charities:", charitiesError);
            return NextResponse.json({ error: "Failed to fetch charities" }, { status: 500 });
        }

        // Fetch all donations with user info
        const { data: donations, error: donationsError } = await supabase
            .from("donations")
            .select(`
                *,
                user:users!user_id(id, first_name, last_name, email),
                charity:charities!charity_id(id, name, category)
            `)
            .order("created_at", { ascending: false });

        if (donationsError) {
            console.error("Error fetching donations:", donationsError);
        }

        // Calculate stats
        const totalDonations = donations?.reduce((sum, d) => sum + Number(d.amount), 0) || 0;
        const stats = {
            totalCharities: charities?.length || 0,
            activeCharities: charities?.filter(c => c.is_active).length || 0,
            totalDonations: donations?.length || 0,
            totalDonated: totalDonations,
            uniqueDonors: new Set(donations?.map(d => d.user_id)).size,
        };

        return NextResponse.json({
            charities: charities || [],
            donations: donations || [],
            stats
        });

    } catch (error) {
        console.error("Error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

// POST - Create new charity
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
        const { name, description, category, image_url, goal_amount, is_active } = body;

        if (!name || !category) {
            return NextResponse.json({ error: "Name and category are required" }, { status: 400 });
        }

        const { data, error } = await supabase.from("charities").insert({
            name,
            description: description || "",
            category,
            image_url: image_url || null,
            goal_amount: goal_amount ? parseFloat(goal_amount) : null,
            is_active: is_active !== false,
            total_donations: 0,
            donor_count: 0,
        }).select().single();

        if (error) {
            console.error("Error creating charity:", error);
            return NextResponse.json({ error: "Failed to create charity: " + error.message }, { status: 500 });
        }

        await logAudit(supabase, admin.id, "createCharity", `Created charity: ${name}`, req.headers.get("x-forwarded-for") || "unknown");

        return NextResponse.json({ success: true, charity: data });

    } catch (error) {
        console.error("Error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

// PATCH - Update charity
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
        const { charityId, name, description, category, image_url, goal_amount, is_active } = body;

        if (!charityId) {
            return NextResponse.json({ error: "Charity ID required" }, { status: 400 });
        }

        const updateData: Record<string, unknown> = {
            updated_at: new Date().toISOString(),
        };

        if (name !== undefined) updateData.name = name;
        if (description !== undefined) updateData.description = description;
        if (category !== undefined) updateData.category = category;
        if (image_url !== undefined) updateData.image_url = image_url;
        if (goal_amount !== undefined) updateData.goal_amount = goal_amount ? parseFloat(goal_amount) : null;
        if (is_active !== undefined) updateData.is_active = is_active;

        const { error } = await supabase
            .from("charities")
            .update(updateData)
            .eq("id", charityId);

        if (error) {
            console.error("Error updating charity:", error);
            return NextResponse.json({ error: "Failed to update charity: " + error.message }, { status: 500 });
        }

        await logAudit(supabase, admin.id, "updateCharity", `Updated charity: ${charityId}`, req.headers.get("x-forwarded-for") || "unknown");

        return NextResponse.json({ success: true, message: "Charity updated" });

    } catch (error) {
        console.error("Error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

// DELETE - Delete charity
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
        const charityId = searchParams.get("charityId");

        if (!charityId) {
            return NextResponse.json({ error: "Charity ID required" }, { status: 400 });
        }

        // Check if charity has donations
        const { data: donations } = await supabase
            .from("donations")
            .select("id")
            .eq("charity_id", charityId)
            .limit(1);

        if (donations && donations.length > 0) {
            // Soft delete by deactivating
            await supabase
                .from("charities")
                .update({ is_active: false, updated_at: new Date().toISOString() })
                .eq("id", charityId);

            return NextResponse.json({
                success: true,
                message: "Charity deactivated (has existing donations)"
            });
        }

        const { error } = await supabase
            .from("charities")
            .delete()
            .eq("id", charityId);

        if (error) {
            console.error("Error deleting charity:", error);
            return NextResponse.json({ error: "Failed to delete charity: " + error.message }, { status: 500 });
        }

        await logAudit(supabase, admin.id, "deleteCharity", `Deleted charity: ${charityId}`, req.headers.get("x-forwarded-for") || "unknown");

        return NextResponse.json({ success: true, message: "Charity deleted" });

    } catch (error) {
        console.error("Error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
