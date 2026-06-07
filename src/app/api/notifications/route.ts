import { NextResponse } from "next/server";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { createClient } from "@supabase/supabase-js";

export async function GET() {
    try {
        const authSupabase = await createServerClient();
        const { data: { user: authUser } } = await authSupabase.auth.getUser();
        const userId = authUser?.id;

        if (!userId) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

        if (!supabaseUrl || !supabaseServiceKey) {
            return NextResponse.json(
                { error: "Server configuration error" },
                { status: 500 }
            );
        }

        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        // Get user from database
        const { data: user } = await supabase
            .from("users")
            .select("id, role")
            .eq("clerk_id", userId)
            .single();

        if (!user) {
            return NextResponse.json(
                { error: "User not found" },
                { status: 404 }
            );
        }

        // Fetch notifications for user
        let query = supabase
            .from("notifications")
            .select("*")
            .order("created_at", { ascending: false })
            .limit(20);

        // If admin, show their own notifications (including transaction notifications sent to admin)
        if (user.role === "admin") {
            // Admin sees their own notifications (all types)
            query = supabase
                .from("notifications")
                .select("*")
                .eq("user_id", user.id)
                .order("created_at", { ascending: false })
                .limit(30);
        } else {
            // Regular user only sees their own notifications
            query = query.eq("user_id", user.id);
        }

        const { data: notifications, error } = await query;

        if (error) {
            console.error("Error fetching notifications:", error);
            return NextResponse.json(
                { error: "Failed to fetch notifications" },
                { status: 500 }
            );
        }

        // Get unread count
        const { count } = await supabase
            .from("notifications")
            .select("*", { count: "exact", head: true })
            .eq("user_id", user.id)
            .eq("is_read", false);

        return NextResponse.json({
            notifications: notifications || [],
            unreadCount: count || 0,
        });

    } catch (error) {
        console.error("Error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

// Mark notifications as read
export async function PATCH(req: Request) {
    try {
        const authSupabase = await createServerClient();
        const { data: { user: authUser } } = await authSupabase.auth.getUser();
        const userId = authUser?.id;

        if (!userId) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

        if (!supabaseUrl || !supabaseServiceKey) {
            return NextResponse.json(
                { error: "Server configuration error" },
                { status: 500 }
            );
        }

        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        // Get user from database
        const { data: user } = await supabase
            .from("users")
            .select("id")
            .eq("clerk_id", userId)
            .single();

        if (!user) {
            return NextResponse.json(
                { error: "User not found" },
                { status: 404 }
            );
        }

        const body = await req.json();
        const { notificationId, markAllRead } = body;

        if (markAllRead) {
            // Mark all notifications as read for this user
            await supabase
                .from("notifications")
                .update({ is_read: true, read_at: new Date().toISOString() })
                .eq("user_id", user.id)
                .eq("is_read", false);
        } else if (notificationId) {
            // Mark single notification as read
            await supabase
                .from("notifications")
                .update({ is_read: true, read_at: new Date().toISOString() })
                .eq("id", notificationId)
                .eq("user_id", user.id);
        }

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error("Error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
