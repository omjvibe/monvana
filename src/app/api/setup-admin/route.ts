import { NextRequest, NextResponse } from "next/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

const supabase = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// This endpoint makes the CURRENT signed-in user an admin
// Access it by navigating to: /api/setup-admin?secret=YOUR_ADMIN_SETUP_PASSWORD
// DELETE THIS FILE after you've set up your admin user!

export async function GET(request: NextRequest) {
    try {
        const authSupabase = await createClient();
        const { data: { user } } = await authSupabase.auth.getUser();

        if (!user) {
            return NextResponse.json(
                { error: "You must be signed in. Please sign in first at /sign-in" },
                { status: 401 }
            );
        }

        const userId = user.id;

        // Check secret from environment variable
        const setupPassword = process.env.ADMIN_SETUP_PASSWORD;
        const { searchParams } = new URL(request.url);
        const secret = searchParams.get("secret");

        if (!setupPassword) {
            console.error("[SETUP_ADMIN] ❌ ADMIN_SETUP_PASSWORD not set in environment variables.");
            return NextResponse.json(
                {
                    error: "Admin setup is disabled",
                    details: "ADMIN_SETUP_PASSWORD environment variable is not configured."
                },
                { status: 500 }
            );
        }

        if (secret !== setupPassword) {
            return NextResponse.json(
                {
                    error: "Invalid secret",
                    hint: "Ensure your secret matches ADMIN_SETUP_PASSWORD and is passed as ?secret=..."
                },
                { status: 403 }
            );
        }

        // Update user's public metadata to set admin role in Supabase Auth
        await authSupabase.auth.updateUser({
            data: {
                role: "admin",
            },
        });

        // ALSO update Supabase directly
        const { error: dbError } = await supabase
            .from("users")
            .update({ role: "admin" })
            .eq("clerk_id", userId);

        if (dbError) {
            console.error("[SETUP_ADMIN] Error updating Supabase role:", dbError);
        }

        return NextResponse.json({
            success: true,
            message: "You are now an admin!",
            user: {
                email: user.email,
                name: `${user.user_metadata?.first_name || ""} ${user.user_metadata?.last_name || ""}`.trim() || user.email,
            },
            nextSteps: [
                "1. Sign out from the app",
                "2. Sign back in",
                "3. Navigate to /admin",
                "4. DELETE this file (src/app/api/setup-admin/route.ts) for security!"
            ]
        });
    } catch (error) {
        console.error("Error setting admin:", error);
        return NextResponse.json(
            { error: "Failed to set admin role", details: String(error) },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        const authSupabase = await createClient();
        const { data: { user } } = await authSupabase.auth.getUser();

        if (!user) {
            return NextResponse.json(
                { error: "You must be signed in" },
                { status: 401 }
            );
        }

        const userId = user.id;
        const setupPassword = process.env.ADMIN_SETUP_PASSWORD;
        const body = await request.json();
        const { secret } = body;

        if (!setupPassword) {
            return NextResponse.json(
                { error: "Admin setup is disabled" },
                { status: 500 }
            );
        }

        if (secret !== setupPassword) {
            return NextResponse.json(
                { error: "Invalid secret" },
                { status: 403 }
            );
        }

        // Update user's public metadata to set admin role in Supabase Auth
        await authSupabase.auth.updateUser({
            data: {
                role: "admin",
            },
        });

        // Sync with Supabase
        await supabase
            .from("users")
            .update({ role: "admin" })
            .eq("clerk_id", userId);

        return NextResponse.json({
            success: true,
            message: "You are now an admin! Sign out and back in, then go to /admin",
        });
    } catch (error) {
        console.error("Error setting admin:", error);
        return NextResponse.json(
            { error: "Failed to set admin role" },
            { status: 500 }
        );
    }
}
