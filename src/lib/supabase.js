import { createClient } from '@supabase/supabase-js';

// The URL and publishable key are safe for a browser client.
// Environment variables remain supported for local/CI builds, while these
// fallbacks prevent a production build from silently becoming "invalid.local"
// when Cloudflare does not inject Vite environment variables.
const SUPABASE_URL = 'https://jcblfgrcsgbdeamogzfc.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_9qBGewmR-UHx6Pc3_Gl36Q_7WhHCw2K';

const url = import.meta.env.VITE_SUPABASE_URL || SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || SUPABASE_PUBLISHABLE_KEY;

export const supabase = createClient(url, key, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    flowType: 'pkce'
  },
  global: {
    headers: {
      'x-client-info': 'utinochat-web'
    }
  }
});
