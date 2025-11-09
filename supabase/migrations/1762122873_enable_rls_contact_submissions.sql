-- Migration: enable_rls_contact_submissions
-- Created at: 1762122873

-- Enable RLS on contact_submissions
ALTER TABLE contact_submissions ENABLE ROW LEVEL SECURITY;

-- Allow public to insert contact submissions
CREATE POLICY "Allow public to insert contacts" ON contact_submissions
  FOR INSERT
  WITH CHECK (auth.role() IN ('anon', 'service_role'));;