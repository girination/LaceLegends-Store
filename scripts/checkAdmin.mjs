import 'dotenv/config';
import { supabaseAdmin } from '../src/lib/supabaseServer';

(async () => {
  try {
    const { data, error } = await supabaseAdmin
      .from('admin_users')
      .select('*')
      .eq('email', 'admin@store.com')
      .single();

    if (error) {
      console.error('Error querying admin_users:', error);
      process.exit(1);
    }

    console.log('Admin user row:', data);
  } catch (err) {
    console.error('Unexpected error:', err);
    process.exit(1);
  }
})();