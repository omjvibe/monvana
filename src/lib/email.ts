import { resend, DEFAULT_FROM_EMAIL, BANK_DOMAIN, BANK_NAME as RESEND_BANK_NAME } from './resend';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const FROM_EMAIL = DEFAULT_FROM_EMAIL;
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || `admin@${BANK_DOMAIN}`;
const BANK_NAME = RESEND_BANK_NAME;
const PRIMARY_COLOR = "#1c1917"; // Stone 900
const ACCENT_COLOR = "#78716c"; // Stone 500

interface EmailResult {
    success: boolean;
    error?: string;
}

// Track email in admin_emails table
export async function trackEmail(details: {
    resendId?: string;
    from: string;
    to: string;
    subject: string;
    html?: string;
    text?: string;
    type: 'inbound' | 'outbound';
    userId?: string;
    attachments?: any[];
}) {
    try {
        console.log(`[TRACK_EMAIL] 🏁 Starting log for ${details.type} email: "${details.subject}"`);

        // Ensure we have a Supabase client
        if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
            console.error('[TRACK_EMAIL] ❌ ERROR: Supabase environment variables are missing!');
            return;
        }

        // Validate userId is a UUID before inserting, otherwise it will crash the DB insert
        const isValidUUID = (id: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id);
        const finalUserId = details.userId && isValidUUID(details.userId) ? details.userId : null;

        if (details.userId && !isValidUUID(details.userId)) {
            console.warn(`[TRACK_EMAIL] ⚠️ Warning: Provided userId "${details.userId}" is not a valid UUID. Using null instead.`);
        }

        const payload = {
            resend_id: details.resendId || null,
            from_email: details.from,
            to_email: details.to,
            subject: details.subject || '(No Subject)',
            content_html: details.html || '',
            content_text: details.text || (details.html || '').replace(/<[^>]*>/g, '').substring(0, 1000),
            type: details.type,
            status: details.type === 'inbound' ? 'received' : 'sent',
            user_id: finalUserId,
            attachments: details.attachments || [],
            metadata: {
                logged_at: new Date().toISOString(),
                original_user_id: details.userId,
                has_attachments: (details.attachments?.length || 0) > 0
            }
        };

        const { data, error } = await supabase.from('admin_emails').insert(payload).select();

        if (error) {
            console.error('[TRACK_EMAIL] ❌ Supabase Insertion Error:', JSON.stringify(error, null, 2));
            console.error('[TRACK_EMAIL] Failed Payload:', JSON.stringify(payload, null, 2));
        } else {
            console.log(`[TRACK_EMAIL] ✅ Success! Logged to admin_emails table. ID: ${data?.[0]?.id}`);
        }
    } catch (error) {
        console.error('[TRACK_EMAIL] 💀 CRITICAL EXCEPTION during email tracking:', error);
    }
}

// Helper to format currency
const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
    }).format(amount);
};

// Base email template wrapper
const getEmailWrapper = (content: string, title: string): string => {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600&family=Playfair+Display:italic,wght@0,400;0,700;1,400&display=swap" rel="stylesheet">
    <title>${title}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #fcfcfc; font-family: 'Outfit', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #fcfcfc;">
        <tr>
            <td align="center" style="padding: 60px 20px;">
                <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="background-color: #ffffff; border-radius: 0px; box-shadow: 0 20px 50px rgba(0, 0, 0, 0.05); border: 1px solid #e7e5e4;">
                    <!-- Top Border Accent -->
                    <tr>
                        <td style="height: 4px; background: linear-gradient(to right, #1c1917, #78716c, #1c1917);"></td>
                    </tr>
                    
                    <!-- Header -->
                    <tr>
                        <td style="padding: 60px 40px 40px 40px; text-align: center;">
                            <h1 style="color: #1c1917; margin: 0; font-family: 'Playfair Display', serif; font-style: italic; font-size: 32px; font-weight: 700; letter-spacing: -0.02em;">Monvana <span style="color: #78716c; font-weight: 400;">Bank</span></h1>
                            <p style="margin: 10px 0 0 0; color: #a8a29e; font-size: 10px; font-weight: 600; text-transform: uppercase; tracking-widest: 0.2em;">Private Wealth Management</p>
                        </td>
                    </tr>
                    
                    <!-- Content Area -->
                    <tr>
                        <td style="padding: 0 60px 60px 60px; color: #44403c; line-height: 1.8; font-size: 16px;">
                            ${content}
                        </td>
                    </tr>
                    
                    <!-- Divider -->
                    <tr>
                        <td style="padding: 0 60px;">
                            <hr style="border: 0; border-top: 1px solid #f5f5f4; margin: 0;">
                        </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                        <td style="padding: 40px 60px; text-align: center;">
                            <p style="color: #a8a29e; font-size: 12px; margin: 0; font-weight: 300;">
                                12-14 High Street, Monvana Plaza, Financial District
                            </p>
                            <div style="margin: 20px 0;">
                                <a href="https://${BANK_DOMAIN}" style="color: #1c1917; font-size: 11px; text-decoration: none; font-weight: 600; text-transform: uppercase; letter-spacing: 0.1em; margin: 0 10px;">Portal</a>
                                <a href="https://${BANK_DOMAIN}/security" style="color: #1c1917; font-size: 11px; text-decoration: none; font-weight: 600; text-transform: uppercase; letter-spacing: 0.1em; margin: 0 10px;">Security</a>
                                <a href="https://${BANK_DOMAIN}/contact" style="color: #1c1917; font-size: 11px; text-decoration: none; font-weight: 600; text-transform: uppercase; letter-spacing: 0.1em; margin: 0 10px;">${BANK_NAME}</a>
                            </div>
                            <p style="color: #d6d3d1; font-size: 10px; margin: 20px 0 0 0; font-weight: 300;">
                                Confidential Communication © ${new Date().getFullYear()} ${BANK_NAME} N.A. Member FDIC. Equal Housing Lender.
                            </p>
                        </td>
                    </tr>
                    
                    <!-- Bottom Accent -->
                    <tr>
                        <td style="padding-bottom: 20px; text-align: center;">
                             <div style="display: inline-block; width: 40px; height: 1px; background-color: #e7e5e4;"></div>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
    `;
};

// Centralized send and track helper
async function sendAndTrack(options: {
    to: string;
    subject: string;
    html: string;
    title: string;
    userId?: string;
}): Promise<EmailResult> {
    if (!resend) {
        console.warn('[EMAIL] Skipping send - Resend not configured');
        return { success: false, error: 'Email service not configured' };
    }

    try {
        const fullHtml = getEmailWrapper(options.html, options.title);
        const { data, error } = await resend.emails.send({
            from: FROM_EMAIL,
            to: [options.to],
            subject: options.subject,
            html: fullHtml,
        });

        if (error) {
            console.error('Resend API Error:', error);
            return { success: false, error: error.message };
        }

        // Track email - await for reliability in serverless
        console.log('[EMAIL] Tracking outbound email...');
        await trackEmail({
            resendId: data?.id,
            from: FROM_EMAIL,
            to: options.to,
            subject: options.subject,
            html: fullHtml,
            type: 'outbound',
            userId: options.userId
        });

        return { success: true };
    } catch (err) {
        console.error('Email sending exception:', err);
        return { success: false, error: 'Internal error' };
    }
}

// ========== Email Templates ==========

export async function sendWelcomeEmail(
    to: string,
    firstName: string,
    userId?: string
): Promise<EmailResult> {
    const html = `
        <h2 style="color: ${PRIMARY_COLOR}; margin: 0 0 16px 0; font-size: 24px;">Welcome to ${BANK_NAME}!</h2>
        <p style="color: #57534e; font-size: 16px; line-height: 24px; margin: 0 0 24px 0;">
            Dear ${firstName},
        </p>
        <p style="color: #57534e; font-size: 16px; line-height: 24px; margin: 0 0 24px 0;">
            Thank you for joining ${BANK_NAME}. Your account has been successfully created and is ready to use.
        </p>
        <div style="background-color: #f5f5f4; border-radius: 8px; padding: 24px; margin: 24px 0;">
            <h3 style="color: ${PRIMARY_COLOR}; margin: 0 0 16px 0; font-size: 16px;">What you can do:</h3>
            <ul style="color: #57534e; font-size: 14px; line-height: 24px; margin: 0; padding-left: 20px;">
                <li>Make secure deposits and withdrawals</li>
                <li>Transfer funds to other accounts</li>
                <li>Apply for loans with competitive rates</li>
                <li>Track all your transactions in real-time</li>
            </ul>
        </div>
        <p style="color: #57534e; font-size: 16px; line-height: 24px; margin: 0 0 24px 0;">
            If you have any questions, please don't hesitate to contact our support team.
        </p>
        <p style="color: #57534e; font-size: 16px; line-height: 24px; margin: 0;">
            Best regards,<br>
            <strong>The ${BANK_NAME} Team</strong>
        </p>
    `;

    return sendAndTrack({
        to,
        subject: `Welcome to ${BANK_NAME}!`,
        html,
        title: 'Welcome',
        userId
    });
}

// Transaction Notification Email (to user)
export async function sendTransactionEmail(
    to: string,
    firstName: string,
    type: 'deposit' | 'withdrawal' | 'transfer' | 'bonus',
    amount: number,
    status: string,
    reference?: string,
    description?: string,
    userId?: string
): Promise<EmailResult> {
    const isCredit = type === 'deposit' || type === 'bonus';
    const statusColor = (status === 'approved' || status === 'sent') ? '#16a34a' : status === 'pending' ? '#ca8a04' : '#dc2626';
    const statusBg = (status === 'approved' || status === 'sent') ? '#f0fdf4' : status === 'pending' ? '#fefce8' : '#fef2f2';

    const typeLabels: Record<string, string> = {
        deposit: 'Deposit',
        withdrawal: 'Withdrawal',
        transfer: 'Transfer',
        bonus: 'Bonus Credit',
    };

    const html = `
        <h2 style="color: ${PRIMARY_COLOR}; margin: 0 0 16px 0; font-size: 24px;">Transaction ${status === 'approved' ? 'Successful' : status === 'pending' ? 'Submitted' : 'Update'}</h2>
        <p style="color: #57534e; font-size: 16px; line-height: 24px; margin: 0 0 24px 0;">
            Dear ${firstName},
        </p>
        <p style="color: #57534e; font-size: 16px; line-height: 24px; margin: 0 0 24px 0;">
            Your ${typeLabels[type]?.toLowerCase() || type} has been ${status === 'approved' ? 'completed' : status === 'pending' ? 'submitted for review' : 'updated'}.
        </p>
        
        <div style="background-color: #f5f5f4; border-radius: 8px; padding: 24px; margin: 24px 0;">
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                    <td style="padding: 8px 0;">
                        <span style="color: #78716c; font-size: 14px;">Type</span>
                    </td>
                    <td style="padding: 8px 0; text-align: right;">
                        <span style="color: ${PRIMARY_COLOR}; font-size: 14px; font-weight: 600;">${typeLabels[type] || type}</span>
                    </td>
                </tr>
                <tr>
                    <td style="padding: 8px 0;">
                        <span style="color: #78716c; font-size: 14px;">Amount</span>
                    </td>
                    <td style="padding: 8px 0; text-align: right;">
                        <span style="color: ${isCredit ? '#16a34a' : PRIMARY_COLOR}; font-size: 18px; font-weight: 700;">
                            ${isCredit ? '+' : '-'}${formatCurrency(amount)}
                        </span>
                    </td>
                </tr>
                <tr>
                    <td style="padding: 8px 0;">
                        <span style="color: #78716c; font-size: 14px;">Status</span>
                    </td>
                    <td style="padding: 8px 0; text-align: right;">
                        <span style="background-color: ${statusBg}; color: ${statusColor}; font-size: 12px; font-weight: 600; padding: 4px 12px; border-radius: 12px; text-transform: uppercase;">
                            ${status.replace('_', ' ')}
                        </span>
                    </td>
                </tr>
                ${reference ? `
                <tr>
                    <td style="padding: 8px 0;">
                        <span style="color: #78716c; font-size: 14px;">Reference</span>
                    </td>
                    <td style="padding: 8px 0; text-align: right;">
                        <span style="color: ${PRIMARY_COLOR}; font-size: 14px; font-family: monospace;">${reference}</span>
                    </td>
                </tr>
                ` : ''}
                ${description ? `
                <tr>
                    <td style="padding: 8px 0;">
                        <span style="color: #78716c; font-size: 14px;">Description</span>
                    </td>
                    <td style="padding: 8px 0; text-align: right;">
                        <span style="color: ${PRIMARY_COLOR}; font-size: 14px;">${description}</span>
                    </td>
                </tr>
                ` : ''}
            </table>
        </div>
        
        <p style="color: #57534e; font-size: 14px; line-height: 24px; margin: 24px 0 0 0;">
            If you did not authorize this transaction, please contact support immediately.
        </p>
    `;

    return sendAndTrack({
        to,
        subject: `${typeLabels[type] || type} ${status === 'approved' ? 'Successful' : status === 'pending' ? 'Submitted' : 'Update'} - ${formatCurrency(amount)}`,
        html,
        title: 'Transaction Notification',
        userId
    });
}


// Admin Notification Email (for new transactions, deposits, withdrawals, etc.)
export async function sendAdminNotificationEmail(
    eventType: 'new_deposit' | 'new_withdrawal' | 'new_transfer' | 'new_user' | 'new_loan' | 'transaction_pending',
    details: {
        userName?: string;
        userEmail?: string;
        amount?: number;
        transactionType?: string;
        reference?: string;
        description?: string;
        userId?: string;
    }
): Promise<EmailResult> {
    if (!ADMIN_EMAIL) {
        console.error('[EMAIL] ❌ ADMIN_EMAIL not set - cannot send admin notification');
        return { success: false, error: 'Admin email not configured' };
    }

    const eventLabels: Record<string, string> = {
        new_deposit: '💰 New Deposit Request',
        new_withdrawal: '💸 New Withdrawal Request',
        new_transfer: '🔄 New Transfer Request',
        new_user: '👤 New User Registration',
        new_loan: '🏦 New Loan Application',
        transaction_pending: '⏳ Transaction Pending Review',
    };

    const html = `
        <h2 style="color: ${PRIMARY_COLOR}; margin: 0 0 16px 0; font-size: 24px;">${eventLabels[eventType] || 'Admin Notification'}</h2>
        <p style="color: #57534e; font-size: 16px; line-height: 24px; margin: 0 0 24px 0;">
            A new action requires your attention in the admin dashboard.
        </p>
        
        <div style="background-color: #f5f5f4; border-radius: 8px; padding: 24px; margin: 24px 0;">
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                ${details.userName ? `
                <tr>
                    <td style="padding: 8px 0;">
                        <span style="color: #78716c; font-size: 14px;">User</span>
                    </td>
                    <td style="padding: 8px 0; text-align: right;">
                        <span style="color: ${PRIMARY_COLOR}; font-size: 14px; font-weight: 600;">${details.userName}</span>
                    </td>
                </tr>
                ` : ''}
                ${details.userEmail ? `
                <tr>
                    <td style="padding: 8px 0;">
                        <span style="color: #78716c; font-size: 14px;">Email</span>
                    </td>
                    <td style="padding: 8px 0; text-align: right;">
                        <span style="color: ${PRIMARY_COLOR}; font-size: 14px;">${details.userEmail}</span>
                    </td>
                </tr>
                ` : ''}
                ${details.amount ? `
                <tr>
                    <td style="padding: 8px 0;">
                        <span style="color: #78716c; font-size: 14px;">Amount</span>
                    </td>
                    <td style="padding: 8px 0; text-align: right;">
                        <span style="color: ${PRIMARY_COLOR}; font-size: 18px; font-weight: 700;">${formatCurrency(details.amount)}</span>
                    </td>
                </tr>
                ` : ''}
                ${details.transactionType ? `
                <tr>
                    <td style="padding: 8px 0;">
                        <span style="color: #78716c; font-size: 14px;">Type</span>
                    </td>
                    <td style="padding: 8px 0; text-align: right;">
                        <span style="color: ${PRIMARY_COLOR}; font-size: 14px; text-transform: capitalize;">${details.transactionType}</span>
                    </td>
                </tr>
                ` : ''}
                ${details.reference ? `
                <tr>
                    <td style="padding: 8px 0;">
                        <span style="color: #78716c; font-size: 14px;">Reference</span>
                    </td>
                    <td style="padding: 8px 0; text-align: right;">
                        <span style="color: ${PRIMARY_COLOR}; font-size: 14px; font-family: monospace;">${details.reference}</span>
                    </td>
                </tr>
                ` : ''}
                ${details.description ? `
                <tr>
                    <td style="padding: 8px 0;">
                        <span style="color: #78716c; font-size: 14px;">Details</span>
                    </td>
                    <td style="padding: 8px 0; text-align: right;">
                        <span style="color: ${PRIMARY_COLOR}; font-size: 14px;">${details.description}</span>
                    </td>
                </tr>
                ` : ''}
            </table>
        </div>
        
        <p style="color: #57534e; font-size: 14px; line-height: 24px; margin: 0;">
            Please log into the admin dashboard to review and take action.
        </p>
    `;

    return sendAndTrack({
        to: ADMIN_EMAIL,
        subject: `[${BANK_NAME} Admin] ${eventLabels[eventType] || 'Notification'}${details.amount ? ` - ${formatCurrency(details.amount)}` : ''}`,
        html,
        title: 'Admin Notification',
        userId: details.userId
    });
}

// Loan Status Email
export async function sendLoanEmail(
    to: string,
    firstName: string,
    loanAmount: number,
    status: 'approved' | 'rejected' | 'pending' | 'active',
    monthlyPayment?: number,
    term?: number,
    reason?: string,
    userId?: string
): Promise<EmailResult> {
    const statusMessages: Record<string, string> = {
        pending: 'Your loan application has been submitted and is under review.',
        approved: 'Congratulations! Your loan application has been approved.',
        rejected: 'We regret to inform you that your loan application was not approved.',
        active: 'Your loan is now active and the funds have been disbursed to your account.',
    };

    const statusColor = status === 'approved' || status === 'active' ? '#16a34a' : status === 'rejected' ? '#dc2626' : '#ca8a04';

    const html = `
        <h2 style="color: ${PRIMARY_COLOR}; margin: 0 0 16px 0; font-size: 24px;">Loan Application ${status === 'approved' || status === 'active' ? 'Approved' : status === 'pending' ? 'Received' : 'Update'}</h2>
        <p style="color: #57534e; font-size: 16px; line-height: 24px; margin: 0 0 24px 0;">
            Dear ${firstName},
        </p>
        <p style="color: #57534e; font-size: 16px; line-height: 24px; margin: 0 0 24px 0;">
            ${statusMessages[status]}
        </p>
        
        <div style="background-color: #f5f5f4; border-radius: 8px; padding: 24px; margin: 24px 0;">
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                    <td style="padding: 8px 0;">
                        <span style="color: #78716c; font-size: 14px;">Loan Amount</span>
                    </td>
                    <td style="padding: 8px 0; text-align: right;">
                        <span style="color: ${PRIMARY_COLOR}; font-size: 18px; font-weight: 700;">${formatCurrency(loanAmount)}</span>
                    </td>
                </tr>
                <tr>
                    <td style="padding: 8px 0;">
                        <span style="color: #78716c; font-size: 14px;">Status</span>
                    </td>
                    <td style="padding: 8px 0; text-align: right;">
                        <span style="color: ${statusColor}; font-size: 14px; font-weight: 600; text-transform: capitalize;">${status}</span>
                    </td>
                </tr>
                ${monthlyPayment ? `
                <tr>
                    <td style="padding: 8px 0;">
                        <span style="color: #78716c; font-size: 14px;">Monthly Payment</span>
                    </td>
                    <td style="padding: 8px 0; text-align: right;">
                        <span style="color: ${PRIMARY_COLOR}; font-size: 14px; font-weight: 600;">${formatCurrency(monthlyPayment)}</span>
                    </td>
                </tr>
                ` : ''}
                ${term ? `
                <tr>
                    <td style="padding: 8px 0;">
                        <span style="color: #78716c; font-size: 14px;">Loan Term</span>
                    </td>
                    <td style="padding: 8px 0; text-align: right;">
                        <span style="color: ${PRIMARY_COLOR}; font-size: 14px;">${term} months</span>
                    </td>
                </tr>
                ` : ''}
            </table>
        </div>
        
        ${reason ? `
        <p style="color: #57534e; font-size: 14px; line-height: 24px; margin: 0 0 24px 0;">
            <strong>Note:</strong> ${reason}
        </p>
        ` : ''}
    `;

    return sendAndTrack({
        to,
        subject: `Loan Application ${status === 'approved' || status === 'active' ? 'Approved' : status === 'pending' ? 'Received' : 'Update'} - ${formatCurrency(loanAmount)}`,
        html,
        title: 'Loan Update',
        userId
    });
}

// Account Status Change Email
export async function sendAccountStatusEmail(
    to: string,
    firstName: string,
    status: 'active' | 'suspended',
    reason?: string,
    userId?: string
): Promise<EmailResult> {
    const isSuspended = status === 'suspended';

    const html = `
        <h2 style="color: ${PRIMARY_COLOR}; margin: 0 0 16px 0; font-size: 24px;">Account ${isSuspended ? 'Suspended' : 'Activated'}</h2>
        <p style="color: #57534e; font-size: 16px; line-height: 24px; margin: 0 0 24px 0;">
            Dear ${firstName},
        </p>
        <p style="color: #57534e; font-size: 16px; line-height: 24px; margin: 0 0 24px 0;">
            ${isSuspended
            ? 'Your account has been temporarily suspended. During this time, you will not be able to perform transactions.'
            : 'Great news! Your account has been reactivated. You can now access all banking services.'}
        </p>
        
        ${reason ? `
        <div style="background-color: ${isSuspended ? '#fef2f2' : '#f0fdf4'}; border-radius: 8px; padding: 20px; margin: 24px 0; border-left: 4px solid ${isSuspended ? '#dc2626' : '#16a34a'};">
            <p style="color: ${isSuspended ? '#991b1b' : '#166534'}; font-size: 14px; margin: 0;">
                <strong>Reason:</strong> ${reason}
            </p>
        </div>
        ` : ''}
    `;

    return sendAndTrack({
        to,
        subject: `Account ${isSuspended ? 'Suspended' : 'Activated'}`,
        html,
        title: 'Account Status',
        userId
    });
}

// Generic Notification Email
export async function sendNotificationEmail(
    to: string,
    firstName: string,
    subject: string,
    message: string,
    userId?: string
): Promise<EmailResult> {
    const html = `
        <h2 style="color: ${PRIMARY_COLOR}; margin: 0 0 16px 0; font-size: 24px;">${subject}</h2>
        <p style="color: #57534e; font-size: 16px; line-height: 24px; margin: 0 0 24px 0;">
            Dear ${firstName},
        </p>
        <div style="color: #57534e; font-size: 16px; line-height: 24px; margin: 0 0 24px 0;">
            ${message.replace(/\n/g, '<br>')}
        </div>
    `;

    return sendAndTrack({
        to,
        subject: `${BANK_NAME}: ${subject}`,
        html,
        title: subject,
        userId
    });
}

// Branded Investment Template
export async function sendInvestmentEmail(
    to: string,
    firstName: string,
    opportunityTitle: string,
    details: string,
    userId?: string
): Promise<EmailResult> {
    const html = `
        <h2 style="color: #1c1917; margin: 0 0 16px 0; font-family: 'Playfair Display', serif; font-style: italic; font-size: 24px;">Exclusive Investment Opportunity</h2>
        <p style="color: #57534e; font-size: 16px; line-height: 24px; margin: 0 0 24px 0;">
            Dear ${firstName},
        </p>
        <div style="background-color: #f5f5f4; border-left: 2px solid #1c1917; padding: 32px; margin: 32px 0;">
            <p style="color: #1c1917; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.1em; margin: 0 0 12px 0;">Strategic Alert</p>
            <h3 style="color: #1c1917; margin: 0 0 16px 0; font-size: 20px; font-weight: 600;">${opportunityTitle}</h3>
            <div style="color: #57534e; font-size: 15px; line-height: 26px;">
                ${details.replace(/\n/g, '<br>')}
            </div>
        </div>
        <p style="color: #57534e; font-size: 15px; line-height: 24px; margin: 0 0 32px 0;">
            Our wealth management team has identified this positioning as particularly advantageous for your current portfolio strategy. Please contact ${BANK_NAME} to discuss execution.
        </p>
        <p style="color: #1c1917; font-size: 15px; line-height: 24px; margin: 0;">
            Yours sincerely,<br>
            <strong>The ${BANK_NAME} Investment Board</strong>
        </p>
    `;

    return sendAndTrack({
        to,
        subject: `Exclusive Intelligence: ${opportunityTitle}`,
        html,
        title: 'Investment Advisory',
        userId
    });
}

// Branded Security Template
export async function sendSecurityEmail(
    to: string,
    firstName: string,
    action: string,
    location?: string,
    device?: string,
    userId?: string
): Promise<EmailResult> {
    const html = `
        <h2 style="color: #1c1917; margin: 0 0 16px 0; font-family: 'Playfair Display', serif; font-style: italic; font-size: 24px;">Security Protocol Update</h2>
        <p style="color: #57534e; font-size: 16px; line-height: 24px; margin: 0 0 24px 0;">
            Dear ${firstName},
        </p>
        <p style="color: #57534e; font-size: 16px; line-height: 24px; margin: 0 0 24px 0;">
            A key security action was recently performed on your ${BANK_NAME} account.
        </p>
        <div style="background-color: #fef2f2; border-radius: 4px; padding: 24px; margin: 32px 0; border: 1px solid #fee2e2;">
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                    <td style="padding: 8px 0; font-size: 14px; color: #991b1b; font-weight: 600;">Action:</td>
                    <td style="padding: 8px 0; font-size: 14px; color: #1c1917; text-align: right;">${action}</td>
                </tr>
                ${location ? `
                <tr>
                    <td style="padding: 8px 0; font-size: 14px; color: #991b1b; font-weight: 600;">Location:</td>
                    <td style="padding: 8px 0; font-size: 14px; color: #1c1917; text-align: right;">${location}</td>
                </tr>
                ` : ''}
                ${device ? `
                <tr>
                    <td style="padding: 8px 0; font-size: 14px; color: #991b1b; font-weight: 600;">Device:</td>
                    <td style="padding: 8px 0; font-size: 14px; color: #1c1917; text-align: right;">${device}</td>
                </tr>
                ` : ''}
                <tr>
                    <td style="padding: 8px 0; font-size: 14px; color: #991b1b; font-weight: 600;">Time:</td>
                    <td style="padding: 8px 0; font-size: 14px; color: #1c1917; text-align: right;">${new Date().toUTCString()}</td>
                </tr>
            </table>
        </div>
        <p style="color: #57534e; font-size: 14px; line-height: 22px; margin: 0;">
            If this was not you, please immediately initiate account lockdown through our <a href="https://${BANK_DOMAIN}/security" style="color: #1c1917; text-decoration: underline;">Security Portal</a> or contact ${BANK_NAME} immediately.
        </p>
    `;

    return sendAndTrack({
        to,
        subject: `Security Alert: ${action}`,
        html,
        title: 'Security Advisory',
        userId
    });
}

// Custom HTML Email
export async function sendCustomHtmlEmail(
    to: string,
    subject: string,
    htmlContent: string,
    title: string = `${BANK_NAME} Communication`,
    userId?: string
): Promise<EmailResult> {
    return sendAndTrack({
        to,
        subject,
        html: htmlContent, // sendAndTrack will wrap this
        title,
        userId
    });
}

// OTP Email Template
export async function sendOTPEmail(
    to: string,
    firstName: string,
    code: string,
    type: 'transfer' | 'withdrawal' | 'security' = 'transfer',
    userId?: string
): Promise<EmailResult> {
    const typeLabels: Record<string, string> = {
        transfer: 'Transfer Verification',
        withdrawal: 'Withdrawal Verification',
        security: 'Security Verification',
    };

    const html = `
        <h2 style="color: ${PRIMARY_COLOR}; margin: 0 0 16px 0; font-family: 'Playfair Display', serif; font-style: italic; font-size: 24px;">Verification Code</h2>
        <p style="color: #57534e; font-size: 16px; line-height: 24px; margin: 0 0 24px 0;">
            Dear ${firstName},
        </p>
        <p style="color: #57534e; font-size: 16px; line-height: 24px; margin: 0 0 32px 0;">
            You have initiated a <strong>${typeLabels[type] || type}</strong>. Please use the following one-time password (OTP) to complete your transaction. This code will expire in 10 minutes.
        </p>
        
        <div style="background-color: #f5f5f4; border-radius: 8px; padding: 40px; text-align: center; margin: 32px 0; border: 1px solid #e7e5e4;">
            <div style="color: #a8a29e; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.2em; margin-bottom: 16px;">One-Time Password</div>
            <div style="color: ${PRIMARY_COLOR}; font-size: 42px; font-weight: 700; letter-spacing: 0.15em; font-family: 'Outfit', sans-serif;">${code}</div>
        </div>
        
        <p style="color: #78716c; font-size: 14px; line-height: 22px; margin: 32px 0 0 0; text-align: center;">
            If you did not initiate this request, please ignore this email or contact ${BANK_NAME} immediately. For your security, never share this code with anyone.
        </p>
    `;

    return sendAndTrack({
        to,
        subject: `Verification Code: ${code}`,
        html,
        title: typeLabels[type] || 'Verification',
        userId
    });
}
