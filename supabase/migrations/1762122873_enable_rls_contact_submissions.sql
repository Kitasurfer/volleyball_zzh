-- Migration: enable_rls_contact_submissions
-- Created at: 1762122873

-- Create contact_submissions table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.contact_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL,
  message text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS on contact_submissions
ALTER TABLE public.contact_submissions ENABLE ROW LEVEL SECURITY;

-- Allow public to insert contact submissions
CREATE POLICY "Allow public to insert contacts" ON public.contact_submissions
  FOR INSERT
  WITH CHECK (auth.role() IN ('anon', 'service_role'));