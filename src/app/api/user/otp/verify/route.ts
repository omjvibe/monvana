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

export async function POST(req: Request) {
    try {
        const authSupabase = await createServerClient();
        const { data: { user: authUser } } = await authSupabase.auth.getUser();
        const clerkUserId = authUser?.id;
        if (!clerkUserId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const supabase = getSupabase();

        // Get user
        const { data: user, error: userError } = await supabase
            .from("users")
            .select("id")
            .eq("clerk_id", clerkUserId)
            .single();

        if (userError || !user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        const body = await req.json();
        const { code, type = 'transfer' } = body;

        if (!code) {
            return NextResponse.json({ error: "Code is required" }, { status: 400 });
        }

        // Check OTP
        const { data: otp, error: otpError } = await supabase
            .from("otps")
            .select("*")
            .eq("user_id", user.id)
            .eq("code", code)
            .eq("type", type)
            .eq("is_verified", false)
            .gt("expires_at", new Date().toISOString())
            .order("created_at", { ascending: false })
            .limit(1)
            .single();

        if (otpError || !otp) {
            return NextResponse.json({ error: "Invalid or expired OTP" }, { status: 400 });
        }

        // Mark as verified
        const { error: updateError } = await supabase
            .from("otps")
            .update({ is_verified: true })
            .eq("id", otp.id);

        if (updateError) {
            console.error("Error updating OTP status:", updateError);
            return NextResponse.json({ error: "Verification failed" }, { status: 500 });
        }

        return NextResponse.json({ success: true, message: "OTP verified successfully" });

    } catch (error) {
        console.error("OTP verify error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
