import {createClient} from "@supabase/supabase-js";

// These are public browser credentials. Prefer build-time environment variables;
// the fallback keeps a static Cloudflare export bootable when the dashboard
// build environment has not been configured yet. Never place a service-role or
// secret key here.
const DEFAULT_SUPABASE_URL="https://jcblfgrcsgbdeamogzfc.supabase.co";
const DEFAULT_SUPABASE_PUBLISHABLE_KEY="sb_publishable_9qBGewmR-UHx6Pc3_Gl36Q_7WhHCw2K";

const SUPABASE_URL=process.env.NEXT_PUBLIC_SUPABASE_URL||DEFAULT_SUPABASE_URL;
const SUPABASE_PUBLISHABLE_KEY=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY||DEFAULT_SUPABASE_PUBLISHABLE_KEY;

export const db=createClient(SUPABASE_URL,SUPABASE_PUBLISHABLE_KEY,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
export const supabaseUrl=SUPABASE_URL;
