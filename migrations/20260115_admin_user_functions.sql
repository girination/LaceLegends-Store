-- Create helper RPCs for admin_users management
-- 1) `create_admin_user` allows creating the first admin user (bootstrap).
-- 2) Keep `verify_admin_user` in earlier migration for credential checks.

-- This function will only allow creating an admin if no admin_user exists yet.
-- Run this in Supabase SQL editor or via psql.

CREATE OR REPLACE FUNCTION create_admin_user(p_email text, p_password text)
RETURNS SETOF admin_users AS $$
DECLARE
  cnt INTEGER;
  new_row admin_users%ROWTYPE;
BEGIN
  SELECT COUNT(*) INTO cnt FROM admin_users;
  IF cnt > 0 THEN
    RAISE EXCEPTION 'Admin already exists';
  END IF;

  INSERT INTO admin_users (email, password_hash, role)
  VALUES (p_email, crypt(p_password, gen_salt('bf')), 'admin')
  RETURNING * INTO new_row;

  RETURN QUERY SELECT new_row.*;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
