import 'dotenv/config';
import { supabaseAdmin } from '../src/lib/supabaseServer';

const email = process.argv[2] || process.env.EMAIL;
if (!email) {
  console.error('Usage: node scripts/checkAuthUser.mjs <email>');
  process.exit(1);
}

(async () => {
  try {
    // Try admin API first
    if (supabaseAdmin.auth?.admin?.getUserByEmail) {
      const { data, error } = await supabaseAdmin.auth.admin.getUserByEmail(email);
      if (error) throw error;
      console.log('Found user via admin.getUserByEmail:', data?.user || data);
      process.exit(0);
    }

    // Fallback: query auth.users via PostgREST
    const { data, error } = await supabaseAdmin
      .from('auth.users')
      .select('id, email, raw_user_meta_data, created_at')
      .eq('email', email)
      .limit(1)
      .maybeSingle();

    if (error) throw error;
    if (!data) {
      console.log(`No user found with email ${email}`);
      process.exit(0);
    }

    console.log('Found user:', data);
    process.exit(0);
  } catch (err) {
    console.error('Error checking auth user:', err);
    process.exit(1);
  }
})();