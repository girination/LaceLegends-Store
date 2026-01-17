import 'dotenv/config';
import { supabaseAdmin } from '../src/lib/supabaseServer';

const email = process.argv[2] || process.env.EMAIL;
if (!email) {
  console.error('Usage: node scripts/promoteAdmin.mjs <email>');
  process.exit(1);
}

(async () => {
  try {
    // Try admin API first (if supported)
    let userId = null;

    if (supabaseAdmin.auth?.admin?.getUserByEmail) {
      const { data, error } = await supabaseAdmin.auth.admin.getUserByEmail(email);
      if (error) throw error;
      userId = data?.user?.id;
    }

    // Fallback: look up in auth.users via PostgREST (service role key should allow this)
    if (!userId) {
      const { data: users, error: usersError } = await supabaseAdmin
        .from('auth.users')
        .select('id, email')
        .eq('email', email)
        .limit(1)
        .maybeSingle();

      if (usersError) throw usersError;
      userId = users?.id;
    }

    if (!userId) {
      console.error('User not found. Create the user in Supabase Auth first (dashboard -> Authentication -> Users).');
      process.exit(1);
    }

    const { data, error } = await supabaseAdmin
      .from('admin_roles')
      .insert({ user_id: userId, role: 'admin' })
      .select()
      .single();

    if (error) throw error;
    console.log(`Promoted user ${email} to admin (user_id=${userId})`);
    process.exit(0);
  } catch (err) {
    console.error('Error promoting admin:', err);
    process.exit(1);
  }
})();