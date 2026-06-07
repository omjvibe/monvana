import { NextResponse } from "next/server";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { createClient, SupabaseClient } from "@supabase/supabase-js";

function getSupabase(): SupabaseClient {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
        throw new Error("Server configuration error");
    }

    return createClient(supabaseUrl, supabaseServiceKey);
}

// POST - Verify admin PIN
export async function POST(req: Request) {
    try {
        const authSupabase = await createServerClient();
        const { data: { user: authUser } } = await authSupabase.auth.getUser();
        const clerkUserId = authUser?.id;
        if (!clerkUserId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const supabase = getSupabase();

        // Verify user is admin
        const { data: admin } = await supabase
            .from("users")
            .select("id, role")
            .eq("clerk_id", clerkUserId)
            .single();

        if (!admin || admin.role !== "admin") {
            return NextResponse.json({ error: "Admin access required" }, { status: 403 });
        }

        const body = await req.json();
        const { pin } = body;

        if (!pin) {
            return NextResponse.json({ error: "PIN is required" }, { status: 400 });
        }

        const adminPin = process.env.ADMIN_PIN;

        if (!adminPin) {
            // If no ADMIN_PIN is set, allow action (for development)
            return NextResponse.json({ valid: true, message: "PIN verification skipped (not configured)" });
        }

        if (pin !== adminPin) {
            return NextResponse.json({ valid: false, error: "Invalid PIN" }, { status: 401 });
        }

        return NextResponse.json({ valid: true });

    } catch (error) {
        console.error("Error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
