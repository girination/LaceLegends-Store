-- Create admin_roles table and add RLS policies to enforce role-based access
-- Run this in Supabase SQL editor (or via psql). Add admin users using the promote script below or manually via the dashboard.

CREATE TABLE IF NOT EXISTS admin_roles (
  user_id UUID PRIMARY KEY,
  role VARCHAR(50) DEFAULT 'admin',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ensure admin_roles has RLS enabled
ALTER TABLE admin_roles ENABLE ROW LEVEL SECURITY;

-- Allow a user to read their own role
CREATE POLICY "Users can read their role" ON admin_roles FOR SELECT
  USING (user_id = auth.uid());

-- Allow authenticated users to insert their own role (for bootstrap/first admin)
CREATE POLICY "Users can insert their own role" ON admin_roles FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Make products readable by the public (SELECT allowed)
CREATE POLICY "Public products are viewable by everyone" ON products FOR SELECT
  USING (true);

-- Allow admins (those in admin_roles with role='admin') to manage products
CREATE POLICY "Admins can manage products" ON products FOR ALL
  USING (EXISTS (SELECT 1 FROM admin_roles ar WHERE ar.user_id = auth.uid() AND ar.role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM admin_roles ar WHERE ar.user_id = auth.uid() AND ar.role = 'admin'));

-- Helper function to check if any admins exist (callable from client via RPC with SECURITY DEFINER)
CREATE OR REPLACE FUNCTION admin_count()
RETURNS INTEGER AS $$
  SELECT COUNT(*)::INTEGER FROM admin_roles WHERE role = 'admin';
$$ LANGUAGE SQL STABLE SECURITY DEFINER;

-- Convenience: helper SQL to promote a user by email (run with service role privileges):
-- INSERT INTO admin_roles (user_id, role)
-- SELECT id, 'admin' FROM auth.users WHERE email = 'admin@store.com' LIMIT 1
-- ON CONFLICT (user_id) DO NOTHING;
