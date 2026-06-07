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

// GET - Fetch audit logs
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

        const url = new URL(req.url);
        const action = url.searchParams.get("action");
        const adminFilter = url.searchParams.get("admin");
        const limit = parseInt(url.searchParams.get("limit") || "100");
        const offset = parseInt(url.searchParams.get("offset") || "0");

        let query = supabase
            .from("audit_logs")
            .select(`
                *,
                admin:users!admin_id(id, first_name, last_name, email),
                target_user:users!target_user_id(id, first_name, last_name, email)
            `)
            .order("created_at", { ascending: false })
            .range(offset, offset + limit - 1);

        if (action && action !== "all") {
            query = query.eq("action", action);
        }

        if (adminFilter && adminFilter !== "all") {
            query = query.eq("admin_id", adminFilter);
        }

        const { data: logs, error, count } = await query;

        if (error) {
            console.error("Error fetching audit logs:", error);
            return NextResponse.json({ error: "Failed to fetch audit logs" }, { status: 500 });
        }

        // Get unique actions for filter dropdown
        const { data: actions } = await supabase
            .from("audit_logs")
            .select("action")
            .limit(1000);

        const uniqueActions = [...new Set(actions?.map(a => a.action) || [])];

        // Get stats
        const { data: allLogs } = await supabase
            .from("audit_logs")
            .select("action, created_at");

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const stats = {
            total: allLogs?.length || 0,
            today: allLogs?.filter(l => new Date(l.created_at) >= today).length || 0,
            byAction: uniqueActions.map(action => ({
                action,
                count: allLogs?.filter(l => l.action === action).length || 0
            }))
        };

        return NextResponse.json({
            logs: logs || [],
            total: count || logs?.length || 0,
            actions: uniqueActions,
            stats
        });

    } catch (error) {
        console.error("Error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
