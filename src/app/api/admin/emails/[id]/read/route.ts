import { NextResponse } from 'next/server';
import { createClient as createServerClient } from "@/lib/supabase/server";
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const authSupabase = await createServerClient();
        const { data: { user: authUser } } = await authSupabase.auth.getUser();
        const userId = authUser?.id;
        if (!userId) return new NextResponse('Unauthorized', { status: 401 });

        const { id: emailId } = await params;

        // Verify admin
        const { data: user } = await supabase
            .from('users')
            .select('role')
            .eq('clerk_id', userId)
            .single();

        if (user?.role !== 'admin') {
            return new NextResponse('Forbidden', { status: 403 });
        }

        const { error } = await supabase
            .from('admin_emails')
            .update({ is_read: true })
            .eq('id', emailId);

        if (error) {
            console.error('Error marking email as read:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Mark as read error:', error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}
