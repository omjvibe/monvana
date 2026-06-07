import { NextResponse } from "next/server";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { createClient, SupabaseClient } from "@supabase/supabase-js";

function getSupabase(): SupabaseClient {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) throw new Error("Server configuration error");
    return createClient(url, key);
}

async function verifyAdmin(supabase: SupabaseClient, userId: string): Promise<boolean> {
    const { data: user } = await supabase
        .from("users")
        .select("role")
        .eq("clerk_id", userId)
        .single();
    return user?.role === "admin" || user?.role === "super_admin";
}

// POST - Save or update a bank setting
export async function POST(req: Request) {
    try {
        const authSupabase = await createServerClient();
        const { data: { user: authUser } } = await authSupabase.auth.getUser();
        const userId = authUser?.id;
        if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const supabase = getSupabase();
        if (!(await verifyAdmin(supabase, userId))) return NextResponse.json({ error: "Admin access required" }, { status: 403 });

        const body = await req.json();
        const { key, value } = body;

        if (!key) {
            return NextResponse.json({ error: "Key is required" }, { status: 400 });
        }

        const { error } = await supabase
            .from("bank_settings")
            .upsert({ 
                key, 
                value: value?.toString(),
                updated_at: new Date().toISOString()
            }, { onConflict: "key" });

        if (error) {
            console.error(`Error saving setting ${key}:`, error);
            return NextResponse.json({ error: "Failed to save setting" }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Settings POST error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
