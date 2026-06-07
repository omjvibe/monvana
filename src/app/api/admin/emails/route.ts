import { NextResponse } from 'next/server';
import { createClient as createServerClient } from "@/lib/supabase/server";
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
    try {
        const authSupabase = await createServerClient();
        const { data: { user: authUser } } = await authSupabase.auth.getUser();
        const userId = authUser?.id;
        if (!userId) return new NextResponse('Unauthorized', { status: 401 });

        // Verify admin
        const { data: user } = await supabase
            .from('users')
            .select('role')
            .eq('clerk_id', userId)
            .single();

        if (user?.role !== 'admin') {
            return new NextResponse('Forbidden', { status: 403 });
        }

        const { data: emails, error } = await supabase
            .from('admin_emails')
            .select(`
                *,
                user:users(first_name, last_name)
            `)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching admin emails:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json(emails);
    } catch (error) {
        console.error('Admin emails GET error:', error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}
