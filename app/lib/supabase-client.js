import {createClient} from "@supabase/supabase-js";

const SUPABASE_URL=process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_PUBLISHABLE_KEY=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

if(!SUPABASE_URL||!SUPABASE_PUBLISHABLE_KEY){
  throw new Error("Supabase public environment variables are not configured.");
}

export const db=createClient(SUPABASE_URL,SUPABASE_PUBLISHABLE_KEY,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
export const supabaseUrl=SUPABASE_URL;
