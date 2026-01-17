# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

---

## Supabase setup 🔧

This project uses Supabase. Follow these steps to connect your Supabase project:

1. In the Supabase dashboard, rotate any leaked keys immediately (the repo previously contained a key).
2. Create environment variables locally in an `.env.local` file (do NOT commit this file). Use the `.env.example` as a template.
   - `VITE_SUPABASE_URL=https://your-project-ref.supabase.co`
   - `VITE_SUPABASE_ANON_KEY=your-anon-key`
   - `SUPABASE_SERVICE_ROLE_KEY=your-service-role-key` (server-only; never expose to the browser)
3. Start the dev server: `npm run dev`
4. For deployments, add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` to your hosting provider's secret/env settings.

> **Note:** Service Role keys should only be used on secure server-side code (API route, server functions). Do not expose them in client-side bundles.

### Server-side usage (service role key) ⚠️

Example (Node API route):

```js
// server-side code (API route or server function)
import { supabaseAdmin } from './src/lib/supabaseServer';

export async function handler(req, res) {
  const { data, error } = await supabaseAdmin.from('orders').select('*');
  if (error) return res.status(500).json({ error });
  return res.status(200).json({ data });
}
```

---

## Admin login fix & migration ✅

The admin login UI queries an `admin_users` table and compares the `password_hash` column to the provided password (simple equality). If you don't have an `admin_users` table in your database, or an admin row for the demo credentials, login will always fail.

To add the table and a demo admin user, run the migration SQL in `migrations/20260110_create_admin_users.sql` in the Supabase SQL editor (or via psql). This inserts a demo admin with credentials:

- Email: `admin@store.com`
- Password: `admin123`

**Important:** After you confirm the admin login works, immediately:
- Change the admin password to a strong one via an UPDATE in SQL or the Supabase UI.
- Preferably, replace the simple equality check and store hashed passwords (bcrypt) or use Supabase Auth for admin accounts.

### How to run the migration & verify ✅
1. Open the Supabase SQL editor and run `migrations/20260110_create_admin_users.sql` (it creates `admin_users`, inserts a demo admin and adds `verify_admin_user` RPC).
2. Make sure the migration ran successfully. The `verify_admin_user` function is created with `SECURITY DEFINER` so it can be called from the client for verification. If you prefer, you can remove this and instead call the function via a server-side endpoint that uses the service role key.
3. Run the seed migration to add default categories:

```sql
-- migrations/20260110_seed_categories.sql
INSERT INTO categories (name) VALUES ('clothing') ON CONFLICT (name) DO NOTHING;
INSERT INTO categories (name) VALUES ('shoes') ON CONFLICT (name) DO NOTHING;
```

4. To verify from your local environment (server-side), copy your env values into `.env.local` and run:

```bash
npm run check:admin
```

This uses the `SUPABASE_SERVICE_ROLE_KEY` to query `admin_users` and print the admin row.

---

## Migrate to Supabase Auth + Admin Roles (recommended)

I added migrations and scripts to integrate Supabase Auth for admin accounts and role-based RLS.

Steps to complete:

1. Create an admin user in Supabase Auth (Dashboard → Authentication → Users). You can create a user with email `admin@store.com` and password `admin123` for testing.
2. Run the migrations in the SQL editor (in order):
   - `migrations/20260110_create_admin_users.sql` (adds app-based admin table & verify RPC, optional)
   - `migrations/20260110_seed_categories.sql` (adds default categories)
   - `migrations/20260110_admin_roles_and_policies.sql` (creates `admin_roles` and RLS policies)
3. **That's it!** The first Auth user who logs in will automatically be promoted to admin (bootstrap pattern). Subsequent users won't have admin access unless manually promoted via:
   ```bash
   npm run promote:admin -- user@example.com
   ```
   Or via SQL in the Supabase editor:
   ```sql
   INSERT INTO admin_roles (user_id, role)
   SELECT id, 'admin' FROM auth.users WHERE email = 'user@example.com' LIMIT 1
   ON CONFLICT (user_id) DO NOTHING;
   ```

4. Start the app and log in:
   ```bash
   npm run dev
   ```
   Use the Auth credentials (email/password) you created in step 1. The login will auto-promote you as the first admin if no admins exist yet.

Security notes:
- Use `SUPABASE_SERVICE_ROLE_KEY` only in server-side scripts or CI/deploy environment; do not add the service key to client `.env` files.
- You can revoke admin rights by deleting the row from `admin_roles`.

