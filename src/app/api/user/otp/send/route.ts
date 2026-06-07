import { NextResponse } from "next/server";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { sendOTPEmail } from "@/lib/email";

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
            .select("id, email, first_name")
            .eq("clerk_id", clerkUserId)
            .single();

        if (userError || !user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        const body = await req.json();
        const { type = 'transfer' } = body;

        // Check if OTP is enabled globally
        const { data: setting } = await supabase
            .from("bank_settings")
            .select("value")
            .eq("key", "transfer_otp")
            .single();

        if (setting?.value !== "true" && type === 'transfer') {
            return NextResponse.json({ error: "OTP not required" }, { status: 400 });
        }

        // Rate limiting: Check for recent OTPs (Last 60 seconds)
        const { count: recentCount, error: recentError } = await supabase
            .from("otps")
            .select("*", { count: "exact", head: true })
            .eq("user_id", user.id)
            .gt("created_at", new Date(Date.now() - 60 * 1000).toISOString());

        if (recentError) {
            console.error("Error checking rate limit (1m):", recentError);
        } else if (recentCount && recentCount >= 1) {
            return NextResponse.json({ 
                error: "Too many requests. Please wait 60 seconds before requesting another OTP." 
            }, { status: 429 });
        }

        // Rate limiting: Check for hourly limit (Last hour)
        const { count: hourlyCount, error: hourlyError } = await supabase
            .from("otps")
            .select("*", { count: "exact", head: true })
            .eq("user_id", user.id)
            .gt("created_at", new Date(Date.now() - 60 * 60 * 1000).toISOString());

        if (hourlyError) {
            console.error("Error checking rate limit (1h):", hourlyError);
        } else if (hourlyCount && hourlyCount >= 5) {
            return NextResponse.json({ 
                error: "Hourly OTP limit exceeded. Please try again later." 
            }, { status: 429 });
        }

        // Generate 6-7 digit code
        const code = Math.floor(100000 + Math.random() * 9000000).toString();
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // 10 minutes

        // Save to database
        const { error: otpError } = await supabase.from("otps").insert({
            user_id: user.id,
            code,
            type,
            expires_at: expiresAt,
            is_verified: false
        });

        if (otpError) {
            console.error("Error saving OTP:", otpError);
            return NextResponse.json({ error: "Failed to generate OTP" }, { status: 500 });
        }

        // Send email
        const emailResult = await sendOTPEmail(user.email, user.first_name || 'User', code, type, user.id);

        if (!emailResult.success) {
            console.error("Error sending OTP email:", emailResult.error);
            return NextResponse.json({ error: "Failed to send OTP email" }, { status: 500 });
        }

        return NextResponse.json({ success: true, message: "OTP sent successfully" });

    } catch (error) {
        console.error("OTP send error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
