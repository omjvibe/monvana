import { NextResponse } from "next/server";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { createClient } from "@supabase/supabase-js";

export async function GET() {
    try {
        const authSupabase = await createServerClient();
        const { data: { user: authUser } } = await authSupabase.auth.getUser();
        const userId = authUser?.id;
        

        if (!userId || !authUser) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        // Use service role key for server-side operations
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

        if (!supabaseUrl || !supabaseServiceKey) {
            // Return default data if Supabase is not configured
            return NextResponse.json({
                user: {
                    id: null,
                    first_name: (authUser?.user_metadata?.first_name || "User") || "User",
                    last_name: (authUser?.user_metadata?.last_name || "") || "",
                    email: (authUser?.email || "") || "",
                },
                balance: 0,
                transactions: [],
                loansCount: 0,
                loansTotal: 0,
                investmentsCount: 0,
                investmentsTotal: 0,
                cardsCount: 0,
            });
        }

        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        // Fetch user from Supabase
        const { data: userData, error: userError } = await supabase
            .from("users")
            .select("*")
            .eq("clerk_id", userId)
            .single();

        if (userError || !userData) {
            console.log("User not found in Supabase, using Clerk data");
            return NextResponse.json({
                user: {
                    id: null,
                    first_name: (authUser?.user_metadata?.first_name || "User") || "User",
                    last_name: (authUser?.user_metadata?.last_name || "") || "",
                    email: (authUser?.email || "") || "",
                },
                balance: 0,
                transactions: [],
                loansCount: 0,
                loansTotal: 0,
                investmentsCount: 0,
                investmentsTotal: 0,
                cardsCount: 0,
            });
        }

        // Fetch all wallets (USD + Crypto)
        const { data: walletsData } = await supabase
            .from("wallets")
            .select("*")
            .eq("user_id", userData.id)
            .order("is_primary", { ascending: false });

        // Fetch recent transactions
        const { data: txData } = await supabase
            .from("transactions")
            .select("id, type, description, amount, status, created_at, recipient_name")
            .eq("user_id", userData.id)
            .order("created_at", { ascending: false })
            .limit(5);

        // Fetch loans summary
        const { data: loansData } = await supabase
            .from("loans")
            .select("id, amount, status")
            .eq("user_id", userData.id)
            .in("status", ["active", "approved"]);

        // Fetch investments summary
        const { data: investData } = await supabase
            .from("investments")
            .select("id, amount, expected_return, status")
            .eq("user_id", userData.id)
            .eq("status", "active");

        // Fetch cards count
        const { data: cardsData } = await supabase
            .from("virtual_cards")
            .select("id")
            .eq("user_id", userData.id);

        // Calculate primary balance
        const primaryWallet = walletsData?.find(w => w.is_primary) || walletsData?.[0];

        return NextResponse.json({
            user: {
                id: userData.id,
                first_name: userData.first_name || (authUser?.user_metadata?.first_name || "User") || "User",
                last_name: userData.last_name || (authUser?.user_metadata?.last_name || "") || "",
                email: userData.email || (authUser?.email || "") || "",
                avatar_url: userData.avatar_url || (authUser?.user_metadata?.avatar_url || ""),
            },
            wallets: walletsData || [],
            balance: primaryWallet?.balance || 0,
            accountNumber: primaryWallet?.account_number || "",
            accountName: primaryWallet?.account_name || `${userData.first_name} ${userData.last_name}`,
            transactions: txData || [],
            loansCount: loansData?.length || 0,
            loansTotal: loansData?.reduce((sum, l) => sum + Number(l.amount), 0) || 0,
            investmentsCount: investData?.length || 0,
            investmentsTotal: investData?.reduce((sum, i) => sum + Number(i.expected_return || i.amount), 0) || 0,
            cardsCount: cardsData?.length || 0,
        });
    } catch (error) {
        console.error("Dashboard API error:", error);
        return NextResponse.json(
            { error: "Failed to fetch dashboard data" },
            { status: 500 }
        );
    }
}
