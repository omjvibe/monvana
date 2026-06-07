import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { createClient } from '@supabase/supabase-js';
import { trackEmail } from '@/lib/email';
import { resend } from '@/lib/resend';
import crypto from 'crypto';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function verifySvixSignature(
    secret: string,
    payload: string,
    id: string,
    timestamp: string,
    signature: string
): boolean {
    try {
        const secretKey = secret.startsWith('whsec_') ? secret.substring(6) : secret;
        const secretBuffer = Buffer.from(secretKey, 'base64');
        const signedPayload = `${id}.${timestamp}.${payload}`;
        const parts = signature.split(' ');
        
        for (const part of parts) {
            const [version, sig] = part.split(',');
            if (version !== 'v1' || !sig) continue;
            
            const computedSig = crypto
                .createHmac('sha256', secretBuffer)
                .update(signedPayload)
                .digest('base64');
                
            if (crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(computedSig))) {
                return true;
            }
        }
    } catch (e) {
        console.error('[RESEND_WEBHOOK] Signature comparison error:', e);
    }
    return false;
}

// Resend Webhook handler for inbound emails
export async function POST(req: Request) {
    const WEBHOOK_SECRET = process.env.RESEND_WEBHOOK_SECRET;

    try {
        // Get the body as JSON first, then stringify - matching Clerk's pattern
        const jsonPayload = await req.json();
        const payload = JSON.stringify(jsonPayload);

        // Get headers using next/headers
        const headerPayload = await headers();
        const svix_id = headerPayload.get("svix-id");
        const svix_timestamp = headerPayload.get("svix-timestamp");
        const svix_signature = headerPayload.get("svix-signature");

        console.log('[RESEND_WEBHOOK] Incoming request:', {
            id: svix_id,
            timestamp: svix_timestamp,
            hasSignature: !!svix_signature,
            hasSecret: !!WEBHOOK_SECRET
        });

        // Verify signature if secret is provided
        if (WEBHOOK_SECRET) {
            if (!svix_id || !svix_timestamp || !svix_signature) {
                console.error('[RESEND_WEBHOOK] ❌ Missing svix headers');
                return new NextResponse('Missing signature headers', { status: 400 });
            }

            const isValid = verifySvixSignature(
                WEBHOOK_SECRET,
                payload,
                svix_id,
                svix_timestamp,
                svix_signature
            );

            if (!isValid) {
                console.error('[RESEND_WEBHOOK] ❌ Signature verification failed');
                return new NextResponse('Invalid signature', { status: 401 });
            }
            console.log('[RESEND_WEBHOOK] ✅ Signature verified');
        } else if (process.env.NODE_ENV === 'production') {
            console.warn('[RESEND_WEBHOOK] ⚠️ WARNING: RESEND_WEBHOOK_SECRET is not set in production!');
        }

        const data_payload = jsonPayload;
        console.log('[RESEND_WEBHOOK] Incoming payload type:', data_payload.type);
        console.log('[RESEND_WEBHOOK] Full payload keys:', JSON.stringify(Object.keys(data_payload.data || {})));
        const { type, data } = data_payload;

        // Resend sends 'email.received' for inbound emails
        if (type === 'email.received') {
            const resend_id = data.id || data.email_id;
            const from_email = data.from || data.envelope?.from || '';
            const to_emails = data.to || data.envelope?.to || [];
            const subject = data.subject || '';

            // ─── Robust content extraction ───
            // Resend has multiple possible payload shapes for email content
            let content_html = '';
            let content_text = '';
            let attachments: any[] = [];

            // Try direct top-level fields first
            if (data.html) content_html = data.html;
            if (data.text) content_text = data.text;

            // Try nested body structure
            if (!content_html && data.body?.html) content_html = data.body.html;
            if (!content_text && data.body?.text) content_text = data.body.text;

            // Try content field (some Resend versions use this)
            if (!content_html && data.content?.html) content_html = data.content.html;
            if (!content_text && data.content?.text) content_text = data.content.text;

            // Try raw/payload fields
            if (!content_html && data.raw) {
                // If raw is an HTML email, use it
                if (typeof data.raw === 'string' && data.raw.includes('<')) {
                    content_html = data.raw;
                }
            }

            // Try headers for plain-text fallback
            if (!content_text && !content_html && data.headers) {
                // Sometimes the text is in a decoded payload
                const textHeader = data.headers.find?.((h: any) =>
                    h.name?.toLowerCase() === 'content-type' && h.value?.includes('text/plain')
                );
                if (textHeader && data.decoded_body) {
                    content_text = data.decoded_body;
                }
            }

            // Extract attachments from data
            attachments = data.attachments || data.files || [];

            console.log(`[RESEND_WEBHOOK] Content extracted - HTML: ${content_html ? content_html.length + ' chars' : 'EMPTY'}, Text: ${content_text ? content_text.length + ' chars' : 'EMPTY'}, Attachments: ${attachments.length}`);

            // If content is STILL missing, try the Resend API as last resort
            if (!content_html && !content_text && resend_id) {
                console.log('[RESEND_WEBHOOK] 🔍 No content found in webhook. Fetching from Resend Receiving API...');
                try {
                    // Standard SDK emails.get() returns 401 for inbound emails. 
                    // We must use the direct Receiving API endpoint.
                    const response = await fetch(`https://api.resend.com/emails/receiving/${resend_id}`, {
                        method: 'GET',
                        headers: {
                            'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
                            'Content-Type': 'application/json'
                        }
                    });

                    if (response.ok) {
                        const fullEmail = await response.json();
                        console.log('[RESEND_WEBHOOK] ✅ Successfully fetched from Receiving API');

                        content_html = fullEmail.html || (fullEmail.body?.html) || '';
                        content_text = fullEmail.text || (fullEmail.body?.text) || '';

                        // If we still have no content, check nested structures
                        if (!content_html && fullEmail.data) {
                            content_html = fullEmail.data.html || '';
                            content_text = fullEmail.data.text || '';
                        }

                        if (!attachments || attachments.length === 0) {
                            attachments = fullEmail.attachments || fullEmail.data?.attachments || [];
                        }

                        console.log(`[RESEND_WEBHOOK] API fetch result - HTML: ${content_html ? content_html.length + ' chars' : 'EMPTY'}, Text: ${content_text ? content_text.length + ' chars' : 'EMPTY'}`);
                    } else {
                        const errorText = await response.text();
                        console.error(`[RESEND_WEBHOOK] ❌ Resend Receiving API error (${response.status}):`, errorText);
                    }
                } catch (err) {
                    console.error('[RESEND_WEBHOOK] 💀 Error fetching from Receiving API:', err);
                }
            }

            // Generate text fallback from HTML if we have HTML but no text
            if (content_html && !content_text) {
                content_text = content_html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim().substring(0, 2000);
            }

            // If we STILL have nothing, store a diagnostic message
            if (!content_html && !content_text) {
                content_text = `[Email received but content could not be extracted. Webhook data keys: ${Object.keys(data).join(', ')}]`;
                console.warn('[RESEND_WEBHOOK] ⚠️ No content extracted! Storing diagnostic message.');
                // Log the full data payload for debugging (truncated)
                console.log('[RESEND_WEBHOOK] Full data payload (debug):', JSON.stringify(data).substring(0, 2000));
            }

            // ─── Process attachments ───
            const processedAttachments = [];
            if (attachments && attachments.length > 0) {
                console.log(`[RESEND_WEBHOOK] 📎 Processing ${attachments.length} attachments...`);
                for (const attachment of attachments) {
                    try {
                        const fileName = attachment.name || attachment.filename || 'unnamed_attachment';
                        const filePath = `${resend_id}/${Date.now()}_${fileName}`;

                        let buffer: Buffer;
                        if (attachment.content && typeof attachment.content === 'object' && attachment.content.type === 'Buffer') {
                            buffer = Buffer.from(attachment.content.data);
                        } else if (typeof attachment.content === 'string') {
                            buffer = Buffer.from(attachment.content, 'base64');
                        } else if (attachment.data && typeof attachment.data === 'string') {
                            buffer = Buffer.from(attachment.data, 'base64');
                        } else {
                            console.warn(`[RESEND_WEBHOOK] ⚠️ Unsupported attachment format for ${fileName}`);
                            // Still record the attachment metadata even without the file
                            processedAttachments.push({
                                name: fileName,
                                size: attachment.size || 0,
                                type: attachment.content_type || attachment.contentType || attachment.type || 'application/octet-stream',
                                url: null,
                                path: null
                            });
                            continue;
                        }

                        const { data: uploadData, error: uploadError } = await supabase.storage
                            .from('email-attachments')
                            .upload(filePath, buffer, {
                                contentType: attachment.content_type || attachment.contentType || 'application/octet-stream',
                                upsert: true
                            });

                        if (uploadError) {
                            console.error(`[RESEND_WEBHOOK] ❌ Upload error for ${fileName}:`, uploadError);
                            processedAttachments.push({
                                name: fileName,
                                size: buffer.length,
                                type: attachment.content_type || attachment.contentType || 'application/octet-stream',
                                url: null,
                                path: null
                            });
                        } else {
                            const { data: { publicUrl } } = supabase.storage
                                .from('email-attachments')
                                .getPublicUrl(filePath);

                            processedAttachments.push({
                                name: fileName,
                                size: buffer.length,
                                type: attachment.content_type || attachment.contentType,
                                url: publicUrl,
                                path: filePath
                            });
                        }
                    } catch (err) {
                        console.error(`[RESEND_WEBHOOK] 💀 Error processing attachment:`, err);
                    }
                }
            }

            // Extract clean email address
            const emailMatch = from_email.match(/<([^>]+)>/) || [null, from_email];
            const cleanFromEmail = (emailMatch[1] || from_email).trim();
            const to_email = Array.isArray(to_emails) ? to_emails[0] : to_emails;

            // Try to find associated user
            const { data: user } = await supabase
                .from('users')
                .select('id')
                .eq('email', cleanFromEmail)
                .single();

            await trackEmail({
                resendId: resend_id,
                from: cleanFromEmail,
                to: to_email,
                subject: subject || 'No Subject',
                html: content_html,
                text: content_text,
                type: 'inbound',
                userId: user?.id,
                attachments: processedAttachments
            });

            console.log(`[RESEND_WEBHOOK] ✅ Inbound email logged: "${subject}" from ${cleanFromEmail}`);
        }

        return NextResponse.json({ received: true });
    } catch (error) {
        console.error('Resend Webhook error:', error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}
