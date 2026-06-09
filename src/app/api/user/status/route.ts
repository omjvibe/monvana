import { NextResponse } from "next/server";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { createClient } from "@supabase/supabase-js";

export async function GET() {
    try {
        const authSupabase = await createServerClient();
        const { data: { user: authUser } } = await authSupabase.auth.getUser();
        const userId = authUser?.id;

        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

        if (!supabaseUrl || !supabaseServiceKey) {
            return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
        }

        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        // Check user status in database
        const { data: user, error } = await supabase
            .from("users")
            .select("id, status, role, first_name, last_name, email, country, occupation")
            .eq("clerk_id", userId)
            .single();

        if (error || !user) {
            // User not found in database - might be new
            return NextResponse.json({
                status: "not_found",
                message: "User profile not found"
            });
        }

        // Return user status
        return NextResponse.json({
            id: user.id,
            status: user.status,
            role: user.role,
            firstName: user.first_name,
            lastName: user.last_name,
            email: user.email,
            isSuspended: user.status === "suspended",
            isDeleted: user.status === "deleted",
            isOnboarded: !!(user.country && user.occupation),
        });

    } catch (error) {
        console.error("Error checking user status:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
