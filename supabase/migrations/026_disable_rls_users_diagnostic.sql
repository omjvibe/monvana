-- Diagnostic Migration: Disable RLS on users table temporarily
-- This will reveal if RLS is the cause of the silent deletion failure.
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
