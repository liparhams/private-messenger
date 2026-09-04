import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const url = Deno.env.get("SUPABASE_URL") ?? "";
const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const admin = createClient(url, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } });
const cors = {
  "access-control-allow-origin": "*",
  "access-control-allow-methods": "POST, OPTIONS",
  "access-control-allow-headers": "authorization, x-client-info, apikey, content-type, x-retry-count, traceparent, tracestate, baggage",
  "access-control-max-age": "86400",
  "content-type": "application/json",
};
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: cors });
const emailFor = (username: string) => `${username}@utino.chat`;
const usernameRe = /^[a-z0-9_]{3,20}$/;
const uuidRe = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const roles = new Set(["user", "support", "admin"]);
const verifications = new Set(["none", "blue", "green", "orange", "red"]);
const banDurations = new Set(["1h", "24h", "7d", "30d", "permanent"]);

async function readJson(req: Request) {
  const length = Number(req.headers.get("content-length") || 0);
  if (length > 64 * 1024) return null;
  return await req.json().catch(() => null) as Record<string, unknown> | null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);

  try {
    if (!url || !serviceKey) return json({ error: "server_not_configured" }, 500);

    const authorization = req.headers.get("authorization") || "";
    const token = authorization.startsWith("Bearer ") ? authorization.slice(7).trim() : "";
    if (!token) return json({ error: "unauthorized" }, 401);

    const { data: { user: caller }, error: callerError } = await admin.auth.getUser(token);
    if (callerError || !caller) return json({ error: "unauthorized" }, 401);

    const { data: callerProfile, error: callerProfileError } = await admin
      .from("profiles")
      .select("id,role")
      .eq("id", caller.id)
      .single();
    if (callerProfileError || callerProfile?.role !== "admin") return json({ error: "forbidden" }, 403);

    const body = await readJson(req);
    if (!body) return json({ error: "invalid_json" }, 400);

    const action = String(body.action || "");
    const targetId = String(body.user_id || "").trim();

    if (action === "create_user") {
      const username = String(body.username || "").trim().toLowerCase();
      const displayName = String(body.display_name || "").trim();
      const password = String(body.password || "");
      const requestedRole = String(body.role || "user");
      const requestedVerification = String(body.verification || "none");

      if (!usernameRe.test(username)) return json({ error: "invalid_username" }, 400);
      if (displayName.length < 1 || displayName.length > 80) return json({ error: "invalid_display_name" }, 400);
      if (password.length < 6 || password.length > 128) return json({ error: "weak_password" }, 400);
      if (!roles.has(requestedRole)) return json({ error: "invalid_role" }, 400);
      if (!verifications.has(requestedVerification)) return json({ error: "invalid_verification" }, 400);

      const { data: existing, error: lookupError } = await admin
        .from("profiles")
        .select("id")
        .eq("username", username)
        .maybeSingle();
      if (lookupError) return json({ error: "profile_lookup_failed" }, 500);
      if (existing) return json({ error: "username_exists" }, 409);

      const { data: created, error: createError } = await admin.auth.admin.createUser({
        email: emailFor(username),
        password,
        email_confirm: true,
        user_metadata: { username, display_name: displayName },
      });
      if (createError || !created.user) {
        const message = String(createError?.message || "").toLowerCase();
        return json({ error: /already|exists|duplicate|unique/.test(message) ? "username_exists" : "user_create_failed" }, 400);
      }

      const userId = created.user.id;
      const { error: profileError } = await admin.from("profiles").upsert({
        id: userId,
        username,
        display_name: displayName,
        role: requestedRole,
        is_verified: requestedVerification !== "none",
        verification: requestedVerification,
        is_banned: false,
        banned_until: null,
      }, { onConflict: "id" });
      if (profileError) {
        await admin.auth.admin.deleteUser(userId);
        return json({ error: profileError.code === "23505" ? "username_exists" : "profile_create_failed" }, 400);
      }

      const { error: logError } = await admin.from("admin_logs").insert({
        admin_id: caller.id,
        action: "create_user",
        target_user_id: userId,
        details: { username, role: requestedRole, verification: requestedVerification },
      });
      if (logError) {
        await admin.auth.admin.deleteUser(userId);
        return json({ error: "audit_log_failed" }, 500);
      }
      return json({ ok: true, user_id: userId }, 201);
    }

    if (!uuidRe.test(targetId)) return json({ error: "user_not_found" }, 404);

    const { data: targetProfile, error: targetLookupError } = await admin
      .from("profiles")
      .select("id,username,role,is_banned,banned_until,verification,is_verified")
      .eq("id", targetId)
      .maybeSingle();
    if (targetLookupError) return json({ error: "profile_lookup_failed" }, 500);
    if (!targetProfile) return json({ error: "user_not_found" }, 404);

    if (action === "set_verification") {
      const verification = String(body.verification || "");
      if (!verifications.has(verification)) return json({ error: "invalid_verification" }, 400);
      const { error } = await admin.from("profiles").update({
        verification,
        is_verified: verification !== "none",
      }).eq("id", targetId);
      if (error) return json({ error: "profile_update_failed" }, 400);
      const { error: logError } = await admin.from("admin_logs").insert({
        admin_id: caller.id,
        action: "set_verification",
        target_user_id: targetId,
        details: { verification },
      });
      if (logError) return json({ error: "audit_log_failed" }, 500);
      return json({ ok: true });
    }

    if (action === "reset_password") {
      const password = String(body.password || "");
      if (password.length < 6 || password.length > 128) return json({ error: "weak_password" }, 400);
      const { error } = await admin.auth.admin.updateUserById(targetId, { password });
      if (error) return json({ error: "password_update_failed" }, 400);
      const { error: logError } = await admin.from("admin_logs").insert({
        admin_id: caller.id,
        action: "reset_password",
        target_user_id: targetId,
      });
      if (logError) return json({ error: "audit_log_failed" }, 500);
      return json({ ok: true });
    }

    if (action === "set_role") {
      const role = String(body.role || "");
      if (!roles.has(role)) return json({ error: "invalid_role" }, 400);
      if (targetId === caller.id && role !== "admin") return json({ error: "cannot_remove_own_admin" }, 400);
      if (targetProfile.role === "admin" && role !== "admin") {
        const { count, error: countError } = await admin.from("profiles").select("id", { count: "exact", head: true }).eq("role", "admin");
        if (countError) return json({ error: "profile_lookup_failed" }, 500);
        if ((count || 0) <= 1) return json({ error: "last_admin_required" }, 400);
      }
      const { error } = await admin.from("profiles").update({ role }).eq("id", targetId);
      if (error) return json({ error: "profile_update_failed" }, 400);
      const { error: logError } = await admin.from("admin_logs").insert({
        admin_id: caller.id,
        action: "set_role",
        target_user_id: targetId,
        details: { role },
      });
      if (logError) return json({ error: "audit_log_failed" }, 500);
      return json({ ok: true });
    }

    if (action === "ban" || action === "unban") {
      if (targetId === caller.id && action === "ban") return json({ error: "cannot_ban_self" }, 400);
      let until: string | null = null;
      let duration = "none";
      if (action === "ban") {
        duration = String(body.duration || "permanent");
        if (!banDurations.has(duration)) return json({ error: "invalid_ban_duration" }, 400);
        const hours = duration === "1h" ? 1 : duration === "24h" ? 24 : duration === "7d" ? 168 : duration === "30d" ? 720 : 0;
        until = hours ? new Date(Date.now() + hours * 3600000).toISOString() : null;
      }
      const banDuration = action === "ban" ? (until ? `${Math.max(1, Math.ceil((new Date(until).getTime() - Date.now()) / 3600000))}h` : "876000h") : "none";
      const { error: authError } = await admin.auth.admin.updateUserById(targetId, { ban_duration: banDuration });
      if (authError) return json({ error: "ban_update_failed" }, 400);
      const { error: profileError } = await admin.from("profiles").update({
        is_banned: action === "ban",
        banned_until: until,
      }).eq("id", targetId);
      if (profileError) {
        await admin.auth.admin.updateUserById(targetId, { ban_duration: targetProfile.is_banned ? "876000h" : "none" });
        return json({ error: "profile_update_failed" }, 400);
      }
      const { error: logError } = await admin.from("admin_logs").insert({
        admin_id: caller.id,
        action: action === "ban" ? "ban_user" : "unban_user",
        target_user_id: targetId,
        details: { duration, banned_until: until },
      });
      if (logError) return json({ error: "audit_log_failed" }, 500);
      return json({ ok: true, banned_until: until });
    }

    if (action === "delete_user") {
      if (targetId === caller.id) return json({ error: "cannot_delete_self" }, 400);
      const { error: logError } = await admin.from("admin_logs").insert({
        admin_id: caller.id,
        action: "delete_user",
        target_user_id: targetId,
        details: { username: targetProfile.username },
      });
      if (logError) return json({ error: "audit_log_failed" }, 500);
      const { error } = await admin.auth.admin.deleteUser(targetId);
      if (error) return json({ error: "user_delete_failed" }, 400);
      return json({ ok: true });
    }

    return json({ error: "unknown_action" }, 400);
  } catch (error) {
    console.error("admin-user-actions", error);
    return json({ error: "internal_error" }, 500);
  }
});
