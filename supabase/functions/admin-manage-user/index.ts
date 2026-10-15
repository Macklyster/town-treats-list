// Admin-only user management: read/change owner email, send password reset, set roles.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
const json = (b: unknown, status = 200) =>
  new Response(JSON.stringify(b), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

const UUID = /^[0-9a-f-]{36}$/i;
const ROLES = ["admin", "lojista", "consumer"];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const token = (req.headers.get("Authorization") ?? "").replace("Bearer ", "");
    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data: u } = await admin.auth.getUser(token);
    if (!u?.user) return json({ error: "unauthorized" }, 401);
    const { data: isAdm } = await admin.from("user_roles").select("role").eq("user_id", u.user.id).eq("role", "admin").limit(1);
    if (!isAdm?.length) return json({ error: "forbidden" }, 403);

    const body = await req.json().catch(() => ({}));
    const { action, user_id, store_id } = body ?? {};
    if (typeof user_id !== "string" || !UUID.test(user_id)) return json({ error: "user_id inválido" }, 400);
    const audit = (section: string, changes: unknown) =>
      admin.from("admin_audit_log").insert({ admin_id: u.user!.id, store_id: UUID.test(store_id ?? "") ? store_id : null, section, changes });

    if (action === "get") {
      const { data, error } = await admin.auth.admin.getUserById(user_id);
      if (error) return json({ error: error.message }, 400);
      const { data: roles } = await admin.from("user_roles").select("role").eq("user_id", user_id);
      return json({
        email: data.user.email, created_at: data.user.created_at, last_sign_in_at: data.user.last_sign_in_at,
        roles: (roles ?? []).map((r) => r.role),
      });
    }
    if (action === "update_email") {
      const email = String(body.email ?? "").trim().toLowerCase();
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email) || email.length > 255) return json({ error: "E-mail inválido" }, 400);
      const { error } = await admin.auth.admin.updateUserById(user_id, { email, email_confirm: true });
      if (error) return json({ error: error.message }, 400);
      await audit("email", { email });
      return json({ ok: true });
    }
    if (action === "reset_password") {
      const { data } = await admin.auth.admin.getUserById(user_id);
      if (!data?.user?.email) return json({ error: "Usuário sem e-mail" }, 400);
      const redirectTo = typeof body.redirect_to === "string" ? body.redirect_to : undefined;
      const anon = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!);
      const { error } = await anon.auth.resetPasswordForEmail(data.user.email, { redirectTo });
      if (error) return json({ error: error.message }, 400);
      await audit("password_reset", { email: data.user.email });
      return json({ ok: true });
    }
    if (action === "set_roles") {
      const roles: string[] = Array.isArray(body.roles) ? body.roles.filter((r: string) => ROLES.includes(r)) : [];
      if (user_id === u.user.id && !roles.includes("admin")) return json({ error: "Você não pode remover seu próprio acesso admin" }, 400);
      await admin.from("user_roles").delete().eq("user_id", user_id).not("role", "in", `(${roles.join(",") || "x"})`);
      if (roles.length) await admin.from("user_roles").upsert(roles.map((role) => ({ user_id, role })), { onConflict: "user_id,role", ignoreDuplicates: true });
      await audit("roles", { roles });
      return json({ ok: true });
    }
    return json({ error: "ação inválida" }, 400);
  } catch (e) {
    return json({ error: String(e) }, 500);
  }
});
