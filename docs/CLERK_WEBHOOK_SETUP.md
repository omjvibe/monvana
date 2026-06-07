# Clerk Production Configuration

## Webhook URL

Configure the following webhook endpoint in your Clerk Dashboard:

**Production URL:**
```
https://monvana.online/api/webhooks/clerk
```

**Local Development (using ngrok):**
```
https://your-ngrok-id.ngrok.io/api/webhooks/clerk
```

## Required Events

Subscribe to the following events:

- `user.created` - Creates user in Supabase, generates wallet
- `user.updated` - Syncs profile changes
- `user.deleted` - Removes user and related data

## Setup Instructions

### 1. Create Webhook in Clerk

1. Go to [Clerk Dashboard](https://dashboard.clerk.com)
2. Select your application
3. Navigate to **Webhooks** in the sidebar
4. Click **Add Endpoint**
5. Enter your webhook URL
6. Select the events listed above
7. Click **Create**

### 2. Get Signing Secret

After creating the webhook:
1. Click on the newly created webhook
2. Copy the **Signing Secret**
3. Add to your `.env.local`:
```env
CLERK_WEBHOOK_SECRET=whsec_xxxxx
```

### 3. Test the Webhook

#### Using Clerk Dashboard:
1. Go to your webhook settings
2. Click **Testing** tab
3. Send a test event
4. Check your server logs

#### Manual Test:
```bash
curl -X POST https://your-domain.com/api/webhooks/clerk \
  -H "Content-Type: application/json" \
  -d '{"test": true}'
```

This will return an error (no valid signature), confirming the endpoint is reachable.

## Local Development with ngrok

For local testing, use ngrok to expose your local server:

```bash
# Install ngrok if not installed
npm install -g ngrok

# Start your dev server
npm run dev

# In another terminal, start ngrok
ngrok http 3000
```

Copy the ngrok URL and use it as your webhook endpoint in Clerk.

## Webhook Payload Examples

### user.created
```json
{
  "type": "user.created",
  "data": {
    "id": "user_xxxx",
    "email_addresses": [
      {
        "email_address": "user@example.com"
      }
    ],
    "first_name": "John",
    "last_name": "Doe",
    "image_url": "https://...",
    "public_metadata": {}
  }
}
```

### user.updated
```json
{
  "type": "user.updated",
  "data": {
    "id": "user_xxxx",
    "email_addresses": [...],
    "first_name": "John",
    "last_name": "Smith",
    "public_metadata": {
      "role": "admin"
    }
  }
}
```

### user.deleted
```json
{
  "type": "user.deleted",
  "data": {
    "id": "user_xxxx",
    "deleted": true
  }
}
```

## Setting Admin Role

To make a user an admin:

1. Go to Clerk Dashboard
2. Navigate to **Users**
3. Click on the user
4. Click **Edit metadata**
5. In **Public metadata**, add:
```json
{
  "role": "admin"
}
```

The webhook will sync this role to Supabase.

## Troubleshooting

### Webhook not receiving events
- Verify the URL is correct and accessible
- Check if your server is running
- Look at Clerk's webhook logs for errors

### Signature verification failing
- Ensure `CLERK_WEBHOOK_SECRET` is correctly set
- Check that you're using the latest Svix package
- Verify headers are being passed correctly

### User not created in Supabase
- Check Supabase logs for errors
- Verify `SUPABASE_SERVICE_ROLE_KEY` is set
- Ensure database tables exist (run migration)

## Security Notes

- Never expose `CLERK_WEBHOOK_SECRET` in client-side code
- Use HTTPS in production
- Monitor webhook logs for suspicious activity
- Set up alerts for failed webhook deliveries
