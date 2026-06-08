-- DevSnips Database Schema for Neon PostgreSQL
-- Run this in the Neon SQL Editor to create the database tables

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Snippets table
CREATE TABLE IF NOT EXISTS snippets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  code TEXT NOT NULL,
  language TEXT NOT NULL DEFAULT 'text',
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for faster queries by user
CREATE INDEX IF NOT EXISTS idx_snippets_user_id ON snippets(user_id);
CREATE INDEX IF NOT EXISTS idx_snippets_language ON snippets(language);
CREATE INDEX IF NOT EXISTS idx_snippets_updated_at ON snippets(updated_at DESC);

-- Enable Row Level Security (Neon Auth)
ALTER TABLE snippets ENABLE ROW LEVEL SECURITY;

-- Policy: users can only see their own snippets
CREATE POLICY user_snippets_policy ON snippets
  USING (user_id = current_setting('neon_auth.user_id', true))
  WITH CHECK (user_id = current_setting('neon_auth.user_id', true));
