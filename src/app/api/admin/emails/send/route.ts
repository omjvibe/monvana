import { NextResponse } from 'next/server';
import { createClient as createServerClient } from "@/lib/supabase/server";
import { resend } from '@/lib/resend';
import { sendCustomHtmlEmail } from '@/lib/email';
import { createClient } from '@supabase/supabase-js';
import { BANK_NAME } from '@/lib/constants';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
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

        const { to, subject, html, text, from_name, recipient_user_id } = await req.json();

        if (!to || !subject || (!html && !text)) {
            return new NextResponse('Missing required fields', { status: 400 });
        }

        if (!resend) {
            console.error('Email sending failed: RESEND_API_KEY is not configured');
            return NextResponse.json({ error: 'Email service is currently unavailable' }, { status: 503 });
        }

        // Use the unified email service
        const result = await sendCustomHtmlEmail(to, subject, html || text || '', BANK_NAME, recipient_user_id);

        if (!result.success) {
            return NextResponse.json({ error: result.error }, { status: 400 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Email send error:', error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}
