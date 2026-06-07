-- 🏦 Monvana Bank - Manual Admin Promotion SQL
-- 
-- If you are still seeing a "403 Forbidden" error after using the setup route, 
-- you can run this SQL script in your Supabase SQL Editor to manually promote your account.

-- Replace 'YOUR_EMAIL_HERE' with the email address you used to sign up.
UPDATE users 
SET role = 'admin' 
WHERE email = 'YOUR_EMAIL_HERE';

-- To verify the change:
SELECT id, email, role FROM users WHERE email = 'YOUR_EMAIL_HERE';
