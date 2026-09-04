import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

const admin = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const json = (body: Record<string, unknown>, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);

  try {
    if (!supabaseUrl || !serviceRoleKey) return json({ error: "server_not_configured" }, 500);

    let body: Record<string, unknown>;
    try { body = await req.json(); } catch { return json({ error: "invalid_json" }, 400); }

    const username = String(body.username ?? "").trim().toLowerCase();
    const displayName = String(body.display_name ?? "").trim();
    const password = String(body.password ?? "");

    if (!/^[a-z0-9_]{3,20}$/.test(username)) return json({ error: "invalid_username" }, 400);
    if (!displayName || displayName.length > 80) return json({ error: "invalid_display_name" }, 400);
    if (password.length < 6 || password.length > 128) return json({ error: "invalid_password" }, 400);

    const { data: setting, error: settingError } = await admin
      .from("app_settings")
      .select("value")
      .eq("key", "registration_enabled")
      .maybeSingle();
    if (settingError) return json({ error: "registration_check_failed" }, 500);
    if (setting && setting.value !== true) return json({ error: "registration_disabled" }, 403);

    const email = `${username}@utino.chat`;
    const { data: existing } = await admin
      .from("profiles")
      .select("id")
      .eq("username", username)
      .maybeSingle();
    if (existing) return json({ error: "username_exists" }, 409);

    const { data: created, error: createError } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { username, display_name: displayName, public_registered: true },
    });
    if (createError || !created.user) {
      const message = String(createError?.message ?? "").toLowerCase();
      if (message.includes("already") || message.includes("unique")) return json({ error: "username_exists" }, 409);
      return json({ error: "user_create_failed" }, 500);
    }

    const userId = created.user.id;
    const { error: profileError } = await admin.from("profiles").upsert({
      id: userId,
      username,
      display_name: displayName,
    }, { onConflict: "id" });

    if (profileError) {
      await admin.auth.admin.deleteUser(userId);
      return json({ error: "profile_create_failed" }, 500);
    }

    return json({ ok: true, user_id: userId }, 201);
  } catch (error) {
    console.error("public-register", error);
    return json({ error: "internal_error" }, 500);
  }
});
