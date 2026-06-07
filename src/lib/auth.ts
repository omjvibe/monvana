import { createClient } from "@/lib/supabase/server";

export async function getAuthUser() {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        return user;
    } catch (error) {
        console.error("Error getting authenticated user:", error);
        return null;
    }
}
