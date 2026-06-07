# Fixing Clerk Production Google Auth (Error 401: invalid_client)

The `401: invalid_client` error in Production typically means your Google OAuth application does not recognize the request coming from your production domain or Clerk's production instance.

## Action Plan

### 1. Update Google Cloud Console
1.  Go to the [Google Cloud Console](https://console.cloud.google.com/).
2.  Select the project you are using for authentication.
3.  Navigate to **APIs & Services > Credentials**.
4.  Find your **OAuth 2.0 Client ID** (used for Clerk) and click the **Edit** (pencil) icon.
5.  **Authorized Javascript Origins**:
    - Add your production domain: `https://your-production-domain.com`
    - Add your Clerk frontend API domain (found in Clerk Dashboard > API Keys).
6.  **Authorized Redirect URIs**:
    - Add the redirect URI provided by Clerk for production. It usually looks like:
      - `https://clerk.your-production-domain.com/v1/oauth_callback`
      - OR `https://your-app-id.clerk.accounts.dev/v1/oauth_callback`
    - **Crucial**: Copy the EXACT redirect URI from your Clerk Dashboard under **User & Authentication > Social Connections > Google > Settings**.

### 2. Update Clerk Dashboard
1.  Go to your [Clerk Dashboard](https://dashboard.clerk.com/).
2.  Select your application and switch to **Production Instance** (if you haven't already).
3.  Navigate to **User & Authentication > Social Connections**.
4.  Click on **Google**.
5.  Ensure **"Use custom credentials"** is toggled ON.
6.  Paste the **Client ID** and **Client Secret** exactly as they appear in the Google Cloud Console.
7.  Check the **Redirect URI** shown in this settings panel and ensure it is EXACTLY what you added to step 1.6 above.

### 3. Google OAuth Consent Screen
1.  In Google Cloud Console, go to **OAuth consent screen**.
2.  Ensure your **Publishing status** is set to **Production**. 
3.  If it is in "Testing", only added test users can sign in, and you might get various errors. Click **"Push to Production"**.
4.  Ensure all scopes requested by Clerk are listed.

### 4. Wait for Propagation
Google OAuth changes can take **5-10 minutes** to propagate. Refresh your production site and try again.

---

**Note**: If you are using a custom domain (e.g., `account.yourdomain.com`), ensure your DNS records (CNAME) provided by Clerk are correctly configured and verified in the Clerk Dashboard.
