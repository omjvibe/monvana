-- Migration: Add is_transfer_option to deposit_methods
-- This allows admin to flag deposit methods as transfer destinations

ALTER TABLE deposit_methods ADD COLUMN IF NOT EXISTS is_transfer_option BOOLEAN DEFAULT FALSE;
