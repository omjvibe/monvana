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

// GET - Fetch deposit methods for a user
export async function GET(req: Request) {
    try {
        const authSupabase = await createServerClient();
        const { data: { user: authUser } } = await authSupabase.auth.getUser();
        const clerkUserId = authUser?.id;
        if (!clerkUserId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const supabase = getAdminSupabase();
        const admin = await verifyAdmin(supabase, clerkUserId);
        if (!admin) {
            return NextResponse.json({ error: "Admin access required" }, { status: 403 });
        }

        const { searchParams } = new URL(req.url);
        const userId = searchParams.get("userId");

        let query = supabase.from("deposit_methods").select("*");

        if (userId === "universal") {
            query = query.eq("is_universal", true);
        } else if (userId) {
            query = query.or(`user_id.eq.${userId},is_universal.eq.true`);
        } else {
            return NextResponse.json({ error: "User ID or 'universal' keyword required" }, { status: 400 });
        }

        const { data, error } = await query.order("priority", { ascending: false });

        if (error) {
            console.error("Error fetching deposit methods:", error);
            return NextResponse.json({ error: "Failed to fetch deposit methods" }, { status: 500 });
        }

        return NextResponse.json({ depositMethods: data || [] });

    } catch (error) {
        console.error("Error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

// POST - Create a new deposit method for a user
export async function POST(req: Request) {
    try {
        const authSupabase = await createServerClient();
        const { data: { user: authUser } } = await authSupabase.auth.getUser();
        const clerkUserId = authUser?.id;
        if (!clerkUserId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const supabase = getAdminSupabase();
        const admin = await verifyAdmin(supabase, clerkUserId);
        if (!admin) {
            return NextResponse.json({ error: "Admin access required" }, { status: 403 });
        }

        const body = await req.json();
        const {
            userId,
            method_type,
            title,
            description,
            wallet_address,
            bank_name,
            account_number,
            account_name,
            routing_number,
            swift_code,
            additional_info,
            qr_code_url,
            is_active,
            priority,
            is_universal,
            logo_url,
            is_transfer_option
        } = body;

        if ((!userId && !is_universal) || !method_type || !title) {
            return NextResponse.json({ error: "User ID (or Universal toggle), method type, and title are required" }, { status: 400 });
        }

        const { data, error } = await supabase.from("deposit_methods").insert({
            user_id: is_universal ? null : userId,
            method_type,
            title,
            description: description || "",
            wallet_address: wallet_address || null,
            bank_name: bank_name || null,
            account_number: account_number || null,
            account_name: account_name || null,
            routing_number: routing_number || null,
            swift_code: swift_code || null,
            additional_info: additional_info || null,
            qr_code_url: qr_code_url || null,
            is_active: is_active !== false,
            priority: priority || 0,
            is_universal: !!is_universal,
            logo_url: logo_url || null,
            is_transfer_option: !!is_transfer_option,
        }).select().single();

        if (error) {
            console.error("Error creating deposit method:", error);
            return NextResponse.json({ error: "Failed to create deposit method" }, { status: 500 });
        }

        // Log audit
        try {
            await supabase.from("audit_logs").insert({
                admin_id: admin.id,
                action: "CREATE_DEPOSIT_METHOD",
                target_user_id: userId,
                details: `Created deposit method: ${title} (${method_type})`,
            });
        } catch (e) {
            // Audit logging is optional
        }

        return NextResponse.json({ success: true, depositMethod: data });

    } catch (error) {
        console.error("Error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

// PATCH - Update a deposit method
export async function PATCH(req: Request) {
    try {
        const authSupabase = await createServerClient();
        const { data: { user: authUser } } = await authSupabase.auth.getUser();
        const clerkUserId = authUser?.id;
        if (!clerkUserId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const supabase = getAdminSupabase();
        const admin = await verifyAdmin(supabase, clerkUserId);
        if (!admin) {
            return NextResponse.json({ error: "Admin access required" }, { status: 403 });
        }

        const body = await req.json();
        const { depositMethodId, ...updates } = body;

        if (!depositMethodId) {
            return NextResponse.json({ error: "Deposit method ID required" }, { status: 400 });
        }

        const updateData: Record<string, unknown> = {
            updated_at: new Date().toISOString(),
        };

        const allowedFields = [
            "method_type", "title", "description", "wallet_address",
            "bank_name", "account_number", "account_name", "routing_number",
            "swift_code", "additional_info", "qr_code_url", "is_active", "priority",
            "is_universal", "logo_url", "is_transfer_option"
        ];

        for (const field of allowedFields) {
            if (updates[field] !== undefined) {
                updateData[field] = updates[field];
            }
        }

        const { error } = await supabase
            .from("deposit_methods")
            .update(updateData)
            .eq("id", depositMethodId);

        if (error) {
            console.error("Error updating deposit method:", error);
            return NextResponse.json({ error: "Failed to update deposit method" }, { status: 500 });
        }

        // Log audit
        try {
            await supabase.from("audit_logs").insert({
                admin_id: admin.id,
                action: "UPDATE_DEPOSIT_METHOD",
                details: `Updated deposit method: ${depositMethodId}`,
            });
        } catch (e) {
            // Audit logging is optional
        }

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error("Error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

// DELETE - Delete a deposit method
export async function DELETE(req: Request) {
    try {
        const authSupabase = await createServerClient();
        const { data: { user: authUser } } = await authSupabase.auth.getUser();
        const clerkUserId = authUser?.id;
        if (!clerkUserId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const supabase = getAdminSupabase();
        const admin = await verifyAdmin(supabase, clerkUserId);
        if (!admin) {
            return NextResponse.json({ error: "Admin access required" }, { status: 403 });
        }

        const { searchParams } = new URL(req.url);
        const depositMethodId = searchParams.get("id");

        if (!depositMethodId) {
            return NextResponse.json({ error: "Deposit method ID required" }, { status: 400 });
        }

        const { error } = await supabase
            .from("deposit_methods")
            .delete()
            .eq("id", depositMethodId);

        if (error) {
            console.error("Error deleting deposit method:", error);
            return NextResponse.json({ error: "Failed to delete deposit method" }, { status: 500 });
        }

        // Log audit
        try {
            await supabase.from("audit_logs").insert({
                admin_id: admin.id,
                action: "DELETE_DEPOSIT_METHOD",
                details: `Deleted deposit method: ${depositMethodId}`,
            });
        } catch (e) {
            // Audit logging is optional
        }

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error("Error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
