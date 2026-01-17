import { createClient } from '@supabase/supabase-js';

// IMPORTANT: Do NOT commit your Supabase keys. Rotate the existing key in the Supabase dashboard immediately
// and add values to your local and deployment environment variables.

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY in environment');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
