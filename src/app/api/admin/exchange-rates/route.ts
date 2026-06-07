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

// GET - Fetch all exchange rates
export async function GET() {
    try {
        const authSupabase = await createServerClient();
        const { data: { user: authUser } } = await authSupabase.auth.getUser();
        const userId = authUser?.id;
        if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const supabase = getSupabase();
        if (!(await verifyAdmin(supabase, userId))) return NextResponse.json({ error: "Admin access required" }, { status: 403 });
        const { data, error } = await supabase
            .from("exchange_rates")
            .select("*")
            .order("from_currency")
            .order("to_currency");

        if (error) {
            console.error("Error fetching rates:", error);
            return NextResponse.json({ error: "Failed to fetch rates" }, { status: 500 });
        }

        return NextResponse.json({ rates: data || [] });
    } catch (error) {
        console.error("Exchange rates GET error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

// POST - Create a new exchange rate
export async function POST(req: Request) {
    try {
        const authSupabase = await createServerClient();
        const { data: { user: authUser } } = await authSupabase.auth.getUser();
        const userId = authUser?.id;
        if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const supabase = getSupabase();
        if (!(await verifyAdmin(supabase, userId))) return NextResponse.json({ error: "Admin access required" }, { status: 403 });

        const body = await req.json();
        const { from_currency, to_currency, rate, is_active } = body;

        if (!from_currency || !to_currency || rate === undefined || rate <= 0) {
            return NextResponse.json({ error: "from_currency, to_currency, and a positive rate are required" }, { status: 400 });
        }

        if (from_currency === to_currency) {
            return NextResponse.json({ error: "Currencies must be different" }, { status: 400 });
        }

        const { data, error } = await supabase
            .from("exchange_rates")
            .insert({
                from_currency: from_currency.toUpperCase(),
                to_currency: to_currency.toUpperCase(),
                rate: parseFloat(rate),
                is_active: is_active !== false,
            })
            .select()
            .single();

        if (error) {
            if (error.code === "23505") {
                return NextResponse.json({ error: "This currency pair already exists" }, { status: 409 });
            }
            console.error("Error creating rate:", error);
            return NextResponse.json({ error: "Failed to create rate" }, { status: 500 });
        }

        return NextResponse.json({ success: true, rate: data });
    } catch (error) {
        console.error("Exchange rates POST error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

// PATCH - Update an exchange rate
export async function PATCH(req: Request) {
    try {
        const authSupabase = await createServerClient();
        const { data: { user: authUser } } = await authSupabase.auth.getUser();
        const userId = authUser?.id;
        if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const supabase = getSupabase();
        if (!(await verifyAdmin(supabase, userId))) return NextResponse.json({ error: "Admin access required" }, { status: 403 });

        const body = await req.json();
        const { id, rate, is_active } = body;

        if (!id) {
            return NextResponse.json({ error: "Rate ID is required" }, { status: 400 });
        }

        const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() };
        if (rate !== undefined) updateData.rate = parseFloat(rate);
        if (is_active !== undefined) updateData.is_active = is_active;

        const { error } = await supabase.from("exchange_rates").update(updateData).eq("id", id);

        if (error) {
            console.error("Error updating rate:", error);
            return NextResponse.json({ error: "Failed to update rate" }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Exchange rates PATCH error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

// DELETE - Remove an exchange rate
export async function DELETE(req: Request) {
    try {
        const authSupabase = await createServerClient();
        const { data: { user: authUser } } = await authSupabase.auth.getUser();
        const userId = authUser?.id;
        if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const supabase = getSupabase();
        if (!(await verifyAdmin(supabase, userId))) return NextResponse.json({ error: "Admin access required" }, { status: 403 });

        const { searchParams } = new URL(req.url);
        const id = searchParams.get("id");

        if (!id) {
            return NextResponse.json({ error: "Rate ID is required" }, { status: 400 });
        }

        const { error } = await supabase.from("exchange_rates").delete().eq("id", id);

        if (error) {
            console.error("Error deleting rate:", error);
            return NextResponse.json({ error: "Failed to delete rate" }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Exchange rates DELETE error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
