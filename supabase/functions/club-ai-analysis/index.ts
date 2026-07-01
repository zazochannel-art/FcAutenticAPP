import OpenAI from "npm:openai";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SYSTEM_PROMPT =
  "Ești un AI Analyst pentru o aplicație SaaS de administrare a cluburilor sportive. Analizezi date despre jucători, grupe, antrenamente, prezențe și plăți. Folosește doar datele primite, nu inventa informații, răspunde în română și oferă recomandări practice pentru admin sau antrenor.";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const allowedRoles = new Set(["super_admin", "club_owner", "admin", "coach"]);

function jsonResponse(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function compactRows<T extends Record<string, unknown>>(rows: T[] | null | undefined, maxRows = 120) {
  return (rows || []).slice(0, maxRows);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return jsonResponse({ error: "Metodă nepermisă." }, 405);

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const openAiKey = Deno.env.get("OPENAI_API_KEY");

  if (!supabaseUrl || !supabaseAnonKey) {
    return jsonResponse({ error: "Configurarea Supabase lipsește pe server." }, 500);
  }

  if (!openAiKey) {
    return jsonResponse({
      error: "OPENAI_API_KEY lipsește din environment variables pentru Supabase Edge Function.",
    }, 500);
  }

  const authHeader = req.headers.get("Authorization") || "";
  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authHeader } },
  });

  const { data: userData, error: userError } = await supabase.auth.getUser();
  const user = userData?.user;
  if (userError || !user) return jsonResponse({ error: "Autentificare necesară pentru analiza AI." }, 401);

  let body: { clubId?: string; analysisType?: string; question?: string };
  try {
    body = await req.json();
  } catch {
    return jsonResponse({ error: "Request invalid." }, 400);
  }

  const clubId = body.clubId;
  const analysisType = body.analysisType || "custom";
  const question = String(body.question || "").trim();

  if (!clubId) return jsonResponse({ error: "Lipsește clubId pentru analiză." }, 400);
  if (!question) return jsonResponse({ error: "Scrie o întrebare sau alege o analiză rapidă." }, 400);

  const missingData: string[] = [];

  const { data: profile } = await supabase
    .from("profiles")
    .select("role,platform_role")
    .eq("id", user.id)
    .maybeSingle();

  const isSuperAdmin = profile?.platform_role === "super_admin" || profile?.role === "super_admin";

  const { data: membership, error: membershipError } = await supabase
    .from("club_memberships")
    .select("role")
    .eq("club_id", clubId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (membershipError) {
    return jsonResponse({ error: `Nu pot verifica rolul utilizatorului: ${membershipError.message}` }, 403);
  }

  if (!isSuperAdmin && (!membership?.role || !allowedRoles.has(membership.role))) {
    return jsonResponse({ error: "Nu ai permisiune pentru AI Analiză Club." }, 403);
  }

  async function readTable<T>(label: string, query: PromiseLike<{ data: T[] | null; error: { message: string } | null }>) {
    const { data, error } = await query;
    if (error) {
      missingData.push(`${label}: ${error.message}`);
      return [] as T[];
    }
    if (!data || data.length === 0) missingData.push(`${label}: nu există date disponibile.`);
    return data || [];
  }

  const players = await readTable("players", supabase
    .from("players")
    .select("id,no,name,role,group_name,status,medical_status,club_id")
    .eq("club_id", clubId)
    .order("name", { ascending: true }));

  const trainings = await readTable("trainings", supabase
    .from("trainings")
    .select("id,state,date_label,time_label,location,group_name,coach,theme,objectives,equipment,exercises,club_id")
    .eq("club_id", clubId)
    .order("id", { ascending: false })
    .limit(80));

  const trainingIds = trainings.map((item: any) => item.id).filter(Boolean);
  const playerIds = players.map((item: any) => item.id).filter(Boolean);

  const attendance = trainingIds.length
    ? await readTable("attendance", supabase
      .from("attendance")
      .select("training_id,player_id,status,updated_at")
      .in("training_id", trainingIds)
      .limit(300))
    : [];

  if (!trainingIds.length) missingData.push("attendance: nu poate fi analizată fără antrenamente.");

  const trainingPayments = trainingIds.length
    ? await readTable("training_payments", supabase
      .from("training_payments")
      .select("training_id,player_id,amount,paid,paid_at,updated_at,club_id")
      .eq("club_id", clubId)
      .in("training_id", trainingIds)
      .limit(300))
    : [];

  const monthlyPayments = playerIds.length
    ? await readTable("monthly_payments", supabase
      .from("monthly_payments")
      .select("month_label,group_name,player_id,amount,paid,paid_at,updated_at,club_id")
      .eq("club_id", clubId)
      .in("player_id", playerIds)
      .limit(300))
    : [];

  const groups = Array.from(new Set([
    ...players.map((item: any) => item.group_name),
    ...trainings.map((item: any) => item.group_name),
  ].filter(Boolean))).sort();

  if (!groups.length) missingData.push("groups: nu există grupe detectate în players/trainings.");

  const dataSnapshot = {
    clubId,
    analysisType,
    counts: {
      players: players.length,
      groups: groups.length,
      trainings: trainings.length,
      attendance: attendance.length,
      trainingPayments: trainingPayments.length,
      monthlyPayments: monthlyPayments.length,
    },
    groups,
    players: compactRows(players),
    trainings: compactRows(trainings),
    attendance: compactRows(attendance, 220),
    payments: {
      trainingPayments: compactRows(trainingPayments, 220),
      monthlyPayments: compactRows(monthlyPayments, 220),
    },
    missingData,
  };

  const openai = new OpenAI({ apiKey: openAiKey });

  try {
    const response = await openai.responses.create({
      model: "gpt-5.4-mini",
      input: [
        { role: "developer", content: SYSTEM_PROMPT },
        {
          role: "user",
          content:
            `Întrebarea adminului/antrenorului: ${question}\n\n` +
            "Analizează strict următorul snapshot JSON. Dacă lipsește ceva, spune clar ce lipsește. Nu inventa date.\n\n" +
            JSON.stringify(dataSnapshot),
        },
      ],
    });

    return jsonResponse({
      answer: response.output_text || "Nu am putut genera un răspuns text.",
      missingData,
      usage: response.usage || null,
    });
  } catch (error) {
    return jsonResponse({
      error: `OpenAI nu a putut genera analiza: ${error instanceof Error ? error.message : "eroare necunoscută"}`,
      missingData,
    }, 500);
  }
});
