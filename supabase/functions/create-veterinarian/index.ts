
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const respond = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  try {
    if (req.method !== "POST") {
      return respond({ error: "Método não permitido." }, 405);
    }

    const url = Deno.env.get("SUPABASE_URL");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY");

    if (!url || !serviceKey || !anonKey) {
      return respond({ error: "Configuração do servidor incompleta." }, 500);
    }

    const authorization = req.headers.get("Authorization");
    if (!authorization) {
      return respond({ error: "Usuário não autenticado." }, 401);
    }

    const userClient = createClient(url, anonKey, {
      global: { headers: { Authorization: authorization } },
    });

    const adminClient = createClient(url, serviceKey);

    const { data: auth, error: authError } = await userClient.auth.getUser();

    if (authError || !auth.user) {
      return respond({ error: "Sessão inválida." }, 401);
    }

    const body = await req.json();
    const {
      organization_id,
      full_name,
      email,
      password,
      phone,
      crm_number,
      crm_state,
      specialties,
      commission_rate,
    } = body;

    if (!organization_id || !full_name || !email || !password) {
      return respond({ error: "Preencha nome, email, senha e organização." }, 400);
    }

    if (typeof password !== "string" || password.length < 8) {
      return respond({ error: "A senha deve ter pelo menos 8 caracteres." }, 400);
    }

    const rate = commission_rate ?? 0;
    if (typeof rate !== "number" || rate < 0 || rate > 100) {
      return respond({ error: "Comissão deve estar entre 0 e 100." }, 400);
    }

    const { data: membership, error: membershipError } = await adminClient
      .from("organization_members")
      .select("role")
      .eq("organization_id", organization_id)
      .eq("user_id", auth.user.id)
      .maybeSingle();

    if (
      membershipError ||
      !membership ||
      !["owner", "admin"].includes(membership.role)
    ) {
      return respond({ error: "Sem permissão para cadastrar veterinários." }, 403);
    }

    const { data: created, error: createError } =
      await adminClient.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { full_name },
      });

    if (createError || !created.user) {
      return respond({ error: createError?.message || "Falha ao criar usuário." }, 400);
    }

    const userId = created.user.id;

    const cleanup = async () => {
      await adminClient.from("veterinarian_profiles")
        .delete().eq("organization_id", organization_id).eq("user_id", userId);
      await adminClient.from("organization_members")
        .delete().eq("organization_id", organization_id).eq("user_id", userId);
      await adminClient.from("profiles").delete().eq("id", userId);
      await adminClient.auth.admin.deleteUser(userId);
    };

    const { error: profileError } = await adminClient.from("profiles").insert({
      id: userId,
      full_name,
      phone: phone || null,
    });

    if (profileError) {
      await cleanup();
      return respond({ error: "Falha ao criar perfil." }, 400);
    }

    const { error: memberError } = await adminClient
      .from("organization_members")
      .insert({
        organization_id,
        user_id: userId,
        role: "veterinarian",
      });

    if (memberError) {
      await cleanup();
      return respond({ error: "Falha ao vincular veterinário à empresa." }, 400);
    }

    const { error: vetError } = await adminClient
      .from("veterinarian_profiles")
      .insert({
        organization_id,
        user_id: userId,
        crm_number: crm_number || null,
        crm_state: crm_state || null,
        specialties: Array.isArray(specialties) ? specialties : [],
        commission_rate: rate,
        active: true,
      });

    if (vetError) {
      await cleanup();
      return respond({ error: "Falha ao criar cadastro veterinário." }, 400);
    }

    return respond({
      success: true,
      message: "Veterinário cadastrado com sucesso!",
      user_id: userId,
    }, 201);
  } catch (error) {
    console.error("Erro ao cadastrar veterinário:", error);
    return respond({ error: "Erro interno ao cadastrar veterinário." }, 500);
  }
});
