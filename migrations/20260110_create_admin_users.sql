-- Create admin_users table for app-level admin authentication
-- Run this in the Supabase SQL editor (or via psql) to add a demo admin user.

-- Ensure `pgcrypto` is available for hashing
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS admin_users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role VARCHAR(50) DEFAULT 'admin',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert demo admin (change the password immediately!). Password will be stored hashed using pgcrypto.
INSERT INTO admin_users (email, password_hash, role)
VALUES ('admin@store.com', crypt('admin123', gen_salt('bf')), 'admin')
ON CONFLICT (email) DO NOTHING;

-- Create a helper function to verify admin credentials server-side using crypt()</-->
CREATE OR REPLACE FUNCTION verify_admin_user(p_email text, p_password text)
RETURNS SETOF admin_users AS $$
  SELECT * FROM admin_users WHERE email = p_email AND password_hash = crypt(p_password, password_hash);
$$ LANGUAGE SQL STABLE SECURITY DEFINER;
