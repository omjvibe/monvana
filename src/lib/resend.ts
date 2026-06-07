import { Resend } from 'resend';

const resendApiKey = process.env.RESEND_API_KEY?.trim();

export const resend = resendApiKey ? new Resend(resendApiKey) : null;

if (!resendApiKey && process.env.NODE_ENV === 'production') {
    console.warn('Warning: RESEND_API_KEY is missing. Email features will be disabled.');
}

export const BANK_DOMAIN = 'monvana.online';
export const BANK_NAME = 'Monvana Bank';
export const DEFAULT_FROM_EMAIL = `${BANK_NAME} <concierge@${BANK_DOMAIN}>`;
export const SUPPORT_FROM_EMAIL = `${BANK_NAME} Support <support@${BANK_DOMAIN}>`;
