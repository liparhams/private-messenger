import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const url = Deno.env.get("SUPABASE_URL") ?? "";
const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const admin = createClient(url, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } });
const cors = { "access-control-allow-origin": "*", "access-control-allow-methods": "POST, OPTIONS", "access-control-allow-headers": "authorization, x-client-info, apikey, content-type, x-retry-count, traceparent, tracestate, baggage", "access-control-max-age": "86400", "content-type": "application/json" };
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: cors });

Deno.serve(async req => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);
  try {
    if (!url || !serviceKey) return json({ error: "server_not_configured" }, 500);
    const body = await req.json().catch(() => null) as Record<string, unknown> | null;
    if (!body) return json({ error: "invalid_json" }, 400);
    const username = String(body.username ?? "").trim().toLowerCase();
    const displayName = String(body.display_name ?? "").trim();
    const password = String(body.password ?? "");
    if (!/^[a-z0-9_]{3,20}$/.test(username)) return json({ error: "invalid_username" }, 400);
    if (displayName.length < 1 || displayName.length > 80) return json({ error: "invalid_display_name" }, 400);
    if (password.length < 6 || password.length > 128) return json({ error: "invalid_password" }, 400);

    const { data: setting, error: settingError } = await admin.from("app_settings").select("value").eq("key", "registration_enabled").maybeSingle();
    if (settingError) return json({ error: "registration_check_failed" }, 500);
    if (!setting || setting.value !== true) return json({ error: "registration_disabled" }, 403);

    const email = `${username}@utino.chat`;
    const { data: existing, error: lookupError } = await admin.from("profiles").select("id").eq("username", username).maybeSingle();
    if (lookupError) return json({ error: "username_check_failed" }, 500);
    if (existing) return json({ error: "username_exists" }, 409);

    const { data: created, error: createError } = await admin.auth.admin.createUser({ email, password, email_confirm: true, user_metadata: { username, display_name: displayName, public_registered: true } });
    if (createError || !created.user) {
      const message = String(createError?.message ?? "").toLowerCase();
      if (message.includes("already") || message.includes("exists") || message.includes("unique") || message.includes("duplicate")) return json({ error: "username_exists" }, 409);
      return json({ error: "user_create_failed" }, 400);
    }

    const userId = created.user.id;
    const { error: profileError } = await admin.from("profiles").upsert({ id: userId, username, display_name: displayName }, { onConflict: "id" });
    if (profileError) {
      await admin.auth.admin.deleteUser(userId);
      return json({ error: profileError.code === "23505" ? "username_exists" : "profile_create_failed" }, 500);
    }
    return json({ ok: true, user_id: userId }, 201);
  } catch (error) {
    console.error("public-register", error);
    return json({ error: "internal_error" }, 500);
  }
});
