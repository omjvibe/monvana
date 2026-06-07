# Resend Webhook Setup Instructions

This document provides instructions for setting up the Resend webhook handler to process inbound emails in the Monvana Bank application.

## Prerequisites

1.  **Resend Account**: You must have an active Resend account.
2.  **Public URL**: Your application must be accessible via a public URL (e.g., Vercel, Netlify, or a tunnel like ngrok).

## Step 1: Set Environment Variables

Ensure the following environment variables are set in your `.env` file or hosting provider's dashboard:

```bash
# Your Resend API Key (used for fetching full email content)
RESEND_API_KEY=re_...

# The secret key provided by Resend for webhook signature verification (Svix)
# Optional but highly recommended for production
RESEND_WEBHOOK_SECRET=whsec_...
```

## Step 2: Configure Webhook in Resend

1.  Log in to your [Resend Dashboard](https://resend.com).
2.  Navigate to **Webhooks** in the sidebar.
3.  Click **Add Webhook**.
4.  **Payload URL**: Enter your application's webhook endpoint:
    `https://your-domain.com/api/webhooks/resend`
5.  **Events to receive**: Select `email.received`.
6.  Click **Add**.

## Step 3: Secure the Webhook (Production)

Once the webhook is created, Resend will provide a **Signing Secret** (starting with `whsec_`).

1.  Copy this secret.
2.  Update your `RESEND_WEBHOOK_SECRET` environment variable with this value.
3.  The application will now automatically verify that incoming requests are genuinely from Resend using the `svix` library.

## Step 4: Verify Functionality

1.  Send an email to one of your verified domains/addresses in Resend.
2.  Check your application logs (e.g., Vercel Logs or local terminal).
3.  You should see log entries starting with `[RESEND_WEBHOOK]`.
4.  Attachments will be automatically uploaded to the Supabase `email-attachments` storage bucket.

## Implementation Details

- **Endpoint**: `src/app/api/webhooks/resend/route.ts`
- **Logic**:
    - Verifies Svix signatures if `RESEND_WEBHOOK_SECRET` is present.
    - Robustly extracts content from various Resend payload shapes.
    - Fallbacks to the Resend "Receiving API" if content is missing from the webhook payload.
    - Automatically processes and uploads attachments to Supabase Storage.
    - Links inbound emails to existing users in the database based on the sender's email address.
