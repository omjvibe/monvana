# 🏛️ Monvana Bank - Comprehensive Setup Guide

This guide provides step-by-step instructions to set up the Monvana Bank project from scratch, including database configuration, authentication, email systems, and admin account creation.

---

## 📋 Prerequisites

Ensure you have the following installed:
- **Node.js** (v18.0 or higher)
- **pnpm** (recommended) or npm
- **Git**

You will also need accounts with:
2. [Supabase](https://supabase.com/) (for the PostgreSQL database)
3. [Resend](https://resend.com/) (for transactional and inbound emails)

---

## 🔧 Step-by-Step Setup

### 1. Clone & Install
```bash
git clone https://github.com/omjvibe/monvana.git
cd monvana
pnpm install
```

### 2. Environment Variables
Copy the example environment file:
```bash
cp env.example.txt .env.local
```
Fill in the following keys in your `.env.local`:

#### **Clerk Keys**
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
- `CLERK_SECRET_KEY`
- `NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL`
- `NEXT_PUBLIC_CLERK_SIGN_UP_FORCE_REDIRECT_URL`

#### **Supabase Keys**
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (Required for admin operations)

#### **Resend Keys**
- `RESEND_API_KEY` (Get this from Resend Settings → API Keys)

#### **Admin Setup**
- `ADMIN_SETUP_PASSWORD` (A secure password for the one-time admin promotion)
- `ADMIN_EMAIL` (The email that will receive system notifications)

---

### 3. Database Schema Setup
You can set up the database schema in two ways:

**Option A: Automated Migration**
1. Ensure your Supabase project is set up.
2. Run migrations in order: `001` through `015`.

**Option B: Manual SQL Execution**
1. Go to your **Supabase Dashboard → SQL Editor**.
2. Run `supabase/full_legacy_schema.sql` (Consolidated 001-012).
3. Then run migrations `013_universal_deposit_methods.sql`, `014_wallet_swap.sql`, and `015_email_system.sql`.

---

### 4. Admin Account Creation

The project includes a secure specialized route to promote a standard user to an Admin.

1. **Start the development server**:
   ```bash
   pnpm dev
   ```
2. **Sign Up**: Navigate to `http://localhost:3000/sign-up` and create a new account.
3. **Verify Admin Role**: While logged in, navigate to the following URL in your browser:  
   `http://localhost:3000/api/setup-admin?secret=YOUR_ADMIN_SETUP_PASSWORD`
4. **Complete the Loop**:
   - You should see a success message: `"You are now an admin!"`.
   - **Important**: Sign out and sign back in to refresh your session.
   - You can now access the admin dashboard at `http://localhost:3000/admin`.
5. **Security Cleanup**:
   - Once your admin account is confirmed, we recommend deleting `src/app/api/setup-admin/route.ts`.

---

## 🛠 Available Scripts

| Command | Action |
|---------|--------|
| `pnpm dev` | Starts the development server |
| `pnpm build` | Builds the application for production |
| `pnpm start` | Starts the production server |
| `pnpm lint` | Runs ESLint to check for code issues |

---

## 🆘 Troubleshooting

- **Production Google Auth Error (401: invalid_client)**: Follow the [Clerk Production Auth Fix Guide](./CLERK_PROD_AUTH_FIX.md).
- **Inbound Emails not appearing**: Ensure your Resend Webhook is correctly configured and the and the `SUPABASE_SERVICE_ROLE_KEY` is present in your production environment.

For any additional issues, contact support at **support@monvana.online**.
