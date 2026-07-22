import { requireSupabase } from "../config/supabaseClient";

export const DEFAULT_CLUB_ID = "00000000-0000-0000-0000-000000000000";

const DEFAULT_GROUPS = ["U13", "U16", "U19", "Juniori", "Seniori"];

function activeClubId(clubId) {
  return clubId || DEFAULT_CLUB_ID;
}

function normalizeRole(role) {
  if (role === "owner") return "club_owner";
  return role || "viewer";
}

function mapClub(row) {
  return {
    id: row.id,
    name: row.name,
    logo: row.logo_url || "",
    city: row.city || "",
    country: row.country || "",
    email: row.contact_email || "",
    phone: row.phone || "",
    description: row.description || "",
    groups: row.groups || DEFAULT_GROUPS,
    status: row.status || "active",
    blocked: Boolean(row.blocked),
    plan: row.plan || "Free",
    plan_name: row.plan || "Free",
    createdAt: row.created_at || "",
    primaryColor: row.primary_color || "",
    secondaryColor: row.secondary_color || "",
    joinCode: row.join_code || "",
  };
}

function mapMembership(row) {
  return {
    id: row.id,
    clubId: row.club_id,
    club_id: row.club_id,
    userId: row.user_id,
    user_id: row.user_id,
    role: normalizeRole(row.role),
    assignedGroups: row.assigned_groups || [],
    assigned_groups: row.assigned_groups || [],
    status: row.status || "active",
  };
}

function mapSubscription(row) {
  return {
    id: row.id,
    clubId: row.club_id,
    club_id: row.club_id,
    planName: row.plan_name || "Free",
    plan_name: row.plan_name || "Free",
    status: row.status || "active",
    maxPlayers: row.max_players,
    max_players: row.max_players,
    startedAt: row.started_at || "",
    expiresAt: row.expires_at || "",
    createdAt: row.created_at || "",
  };
}

function mapPlayer(p) {
  return {
    id: Number(p.id),
    no: p.no,
    name: p.name,
    role: p.role,
    group: p.group_name,
    status: p.status,
    birthdate: p.birthdate || "",
    foot: p.foot || "",
    parentPhone: p.parent_phone || "",
    medicalStatus: p.medical_status || "",
    allergies: p.allergies || "",
    emergencyContact: p.emergency_contact || "",
    medicalExpires: p.medical_expires || "",
    clubId: p.club_id,
    present: true,
  };
}

function mapTraining(t) {
  return {
    id: Number(t.id),
    state: t.state,
    date: t.date_label,
    time: t.time_label,
    location: t.location,
    group: t.group_name,
    coach: t.coach,
    theme: t.theme || "",
    objectives: t.objectives || "",
    equipment: t.equipment || "",
    exercises: t.exercises || "",
    steps: t.steps || [],
    clubId: t.club_id,
  };
}

function mapMatch(m) {
  return {
    id: Number(m.id),
    type: m.type,
    opponent: m.opponent,
    group: m.group_name,
    date: m.date_label,
    time: m.time_label,
    location: m.location,
    status: m.status,
    score: m.score || "",
    notes: m.notes || "",
    postNotes: m.post_notes || "",
    stats: m.stats || "",
    callUps: m.call_ups || {},
    scorers: m.scorers || {},
    playerStats: m.player_stats || {},
    clubId: m.club_id,
  };
}

export const supabaseService = {
  async getClubs() {
    const { data, error } = await requireSupabase()
      .from("clubs")
      .select("*")
      .order("created_at", { ascending: true });
    if (error) throw error;
    return (data || []).map(mapClub);
  },

  async getMemberships(userId) {
    if (!userId) return [];
    const { data, error } = await requireSupabase()
      .from("club_memberships")
      .select("*")
      .eq("user_id", userId)
      .order("joined_at", { ascending: true });
    if (error) throw error;
    return (data || []).map(mapMembership);
  },

  async getInvitations(clubId) {
    if (!clubId) return [];
    const { data, error } = await requireSupabase()
      .from("club_invitations")
      .select("*")
      .eq("club_id", clubId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data || [];
  },

  async getSubscriptions() {
    const { data, error } = await requireSupabase()
      .from("subscriptions")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data || []).map(mapSubscription);
  },

  async getPlayers(clubId) {
    const { data, error } = await requireSupabase()
      .from("players")
      .select("*")
      .eq("club_id", activeClubId(clubId))
      .order("name", { ascending: true });
    if (error) throw error;
    return (data || []).map(mapPlayer);
  },

  async insertPlayer(player) {
    const { data, error } = await requireSupabase()
      .from("players")
      .insert({
        no: Number(player.no) || 0,
        name: player.name,
        role: player.role || "Jucător",
        group_name: player.group || player.group_name || "U13",
        status: player.status || "Activ",
        birthdate: player.birthdate || null,
        foot: player.foot || null,
        parent_phone: player.parentPhone || null,
        medical_status: player.medicalStatus || null,
        allergies: player.allergies || null,
        emergency_contact: player.emergencyContact || null,
        medical_expires: player.medicalExpires || null,
        club_id: activeClubId(player.clubId || player.club_id),
      })
      .select()
      .single();
    if (error) throw error;
    return mapPlayer(data);
  },

  async updatePlayer(player) {
    const { data, error } = await requireSupabase()
      .from("players")
      .update({
        no: Number(player.no) || 0,
        name: player.name,
        role: player.role,
        group_name: player.group || player.group_name,
        status: player.status,
        birthdate: player.birthdate || null,
        foot: player.foot || null,
        parent_phone: player.parentPhone || null,
        medical_status: player.medicalStatus || null,
        allergies: player.allergies || null,
        emergency_contact: player.emergencyContact || null,
        medical_expires: player.medicalExpires || null,
      })
      .eq("id", player.id)
      .select()
      .single();
    if (error) throw error;
    return mapPlayer(data);
  },

  async deletePlayer(id) {
    const { error } = await requireSupabase().from("players").delete().eq("id", id);
    if (error) throw error;
    return true;
  },

  async getTrainings(clubId) {
    const { data, error } = await requireSupabase()
      .from("trainings")
      .select("*")
      .eq("club_id", activeClubId(clubId))
      .order("id", { ascending: false });
    if (error) throw error;
    return (data || []).map(mapTraining);
  },

  async insertTraining(t) {
    const { data, error } = await requireSupabase()
      .from("trainings")
      .insert({
        state: t.state || "Viitor",
        date_label: t.date,
        time_label: t.time,
        location: t.location,
        group_name: t.group,
        coach: t.coach,
        theme: t.theme || null,
        objectives: t.objectives || null,
        equipment: t.equipment || null,
        exercises: t.exercises || null,
        steps: t.steps || [],
        club_id: activeClubId(t.clubId || t.club_id),
      })
      .select()
      .single();
    if (error) throw error;
    return mapTraining(data);
  },

  async updateTraining(t) {
    const { data, error } = await requireSupabase()
      .from("trainings")
      .update({
        state: t.state,
        date_label: t.date,
        time_label: t.time,
        location: t.location,
        group_name: t.group,
        coach: t.coach,
        theme: t.theme || null,
        objectives: t.objectives || null,
        equipment: t.equipment || null,
        exercises: t.exercises || null,
        steps: t.steps || [],
      })
      .eq("id", t.id)
      .select()
      .single();
    if (error) throw error;
    return mapTraining(data);
  },

  async deleteTraining(id) {
    const { error } = await requireSupabase().from("trainings").delete().eq("id", id);
    if (error) throw error;
    return true;
  },

  async getAttendance(clubId) {
    const trainingQuery = requireSupabase().from("trainings").select("id").eq("club_id", activeClubId(clubId));
    const { data: trainings, error: trainingError } = await trainingQuery;
    if (trainingError) throw trainingError;
    const trainingIds = (trainings || []).map((t) => t.id);
    if (!trainingIds.length) return {};

    const { data, error } = await requireSupabase().from("attendance").select("*").in("training_id", trainingIds);
    if (error) throw error;
    const formatted = {};
    (data || []).forEach((row) => {
      const tId = Number(row.training_id);
      const pId = Number(row.player_id);
      if (!formatted[tId]) formatted[tId] = {};
      formatted[tId][pId] = row.status;
    });
    return formatted;
  },

  async saveAttendance(trainingId, playerId, status) {
    if (!status) {
      const { error } = await requireSupabase()
        .from("attendance")
        .delete()
        .eq("training_id", trainingId)
        .eq("player_id", playerId);
      if (error) throw error;
      return true;
    }

    const { error } = await requireSupabase().from("attendance").upsert({
      training_id: trainingId,
      player_id: playerId,
      status,
      updated_at: new Date().toISOString(),
    });
    if (error) throw error;
    return true;
  },

  async getMatches(clubId) {
    const { data, error } = await requireSupabase()
      .from("matches")
      .select("*")
      .eq("club_id", activeClubId(clubId))
      .order("id", { ascending: false });
    if (error) throw error;
    return (data || []).map(mapMatch);
  },

  async insertMatch(m) {
    const { data, error } = await requireSupabase()
      .from("matches")
      .insert({
        type: m.type,
        opponent: m.opponent,
        group_name: m.group,
        date_label: m.date,
        time_label: m.time,
        location: m.location,
        status: m.status || "Programat",
        score: m.score || null,
        notes: m.notes || null,
        post_notes: m.postNotes || null,
        stats: m.stats || null,
        call_ups: m.callUps || {},
        scorers: m.scorers || {},
        player_stats: m.playerStats || {},
        club_id: activeClubId(m.clubId || m.club_id),
      })
      .select()
      .single();
    if (error) throw error;
    return mapMatch(data);
  },

  async updateMatch(m) {
    const { data, error } = await requireSupabase()
      .from("matches")
      .update({
        type: m.type,
        opponent: m.opponent,
        group_name: m.group,
        date_label: m.date,
        time_label: m.time,
        location: m.location,
        status: m.status,
        score: m.score || null,
        notes: m.notes || null,
        post_notes: m.postNotes || null,
        stats: m.stats || null,
        call_ups: m.callUps || {},
        scorers: m.scorers || {},
        player_stats: m.playerStats || {},
      })
      .eq("id", m.id)
      .select()
      .single();
    if (error) throw error;
    return mapMatch(data);
  },

  async deleteMatch(id) {
    const { error } = await requireSupabase().from("matches").delete().eq("id", id);
    if (error) throw error;
    return true;
  },

  async getObservations(clubId) {
    const { data, error } = await requireSupabase()
      .from("player_observations")
      .select("*")
      .eq("club_id", activeClubId(clubId))
      .order("id", { ascending: false });
    if (error) throw error;
    const formatted = {};
    (data || []).forEach((row) => {
      const pId = Number(row.player_id);
      if (!formatted[pId]) formatted[pId] = [];
      formatted[pId].push({
        id: Number(row.id),
        type: row.type,
        source: row.source || "",
        date: row.date_label || "",
        author: row.author_name || "",
        text: row.note,
      });
    });
    return formatted;
  },

  async insertObservation(playerId, obs) {
    const { data, error } = await requireSupabase()
      .from("player_observations")
      .insert({
        player_id: playerId,
        type: obs.type,
        source: obs.source || null,
        date_label: obs.date || null,
        author_name: obs.author || null,
        note: obs.text,
        club_id: activeClubId(obs.clubId || obs.club_id),
      })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async deleteObservation(id) {
    const { error } = await requireSupabase().from("player_observations").delete().eq("id", id);
    if (error) throw error;
    return true;
  },

  async getTrainingPayments(clubId) {
    const { data, error } = await requireSupabase()
      .from("training_payments")
      .select("*")
      .eq("club_id", activeClubId(clubId));
    if (error) throw error;
    const formatted = {};
    (data || []).forEach((row) => {
      const tId = Number(row.training_id);
      const pId = Number(row.player_id);
      if (!formatted[tId]) formatted[tId] = {};
      formatted[tId][pId] = { paid: row.paid, amount: String(row.amount), paidAt: row.paid_at || "" };
    });
    return formatted;
  },

  async saveTrainingPayment(trainingId, playerId, paymentInfo) {
    if (!paymentInfo) {
      const { error } = await requireSupabase()
        .from("training_payments")
        .delete()
        .eq("training_id", trainingId)
        .eq("player_id", playerId);
      if (error) throw error;
      return true;
    }

    const { data: training, error: trainingError } = await requireSupabase()
      .from("trainings")
      .select("club_id")
      .eq("id", trainingId)
      .single();
    if (trainingError) throw trainingError;

    const { error } = await requireSupabase().from("training_payments").upsert({
      training_id: trainingId,
      player_id: playerId,
      amount: Number(paymentInfo.amount) || 0,
      paid: Boolean(paymentInfo.paid),
      paid_at: paymentInfo.paidAt || null,
      updated_at: new Date().toISOString(),
      club_id: training.club_id,
    });
    if (error) throw error;
    return true;
  },

  async getMonthlyPayments(clubId) {
    const { data, error } = await requireSupabase()
      .from("monthly_payments")
      .select("*")
      .eq("club_id", activeClubId(clubId));
    if (error) throw error;
    const formatted = {};
    (data || []).forEach((row) => {
      const key = `${row.month_label}-${row.group_name}`;
      const pId = Number(row.player_id);
      if (!formatted[key]) formatted[key] = {};
      formatted[key][pId] = { paid: row.paid, amount: String(row.amount), paidAt: row.paid_at || "" };
    });
    return formatted;
  },

  async saveMonthlyPayment(monthLabel, groupName, playerId, paymentInfo) {
    if (!paymentInfo) {
      const { error } = await requireSupabase()
        .from("monthly_payments")
        .delete()
        .eq("month_label", monthLabel)
        .eq("group_name", groupName)
        .eq("player_id", playerId);
      if (error) throw error;
      return true;
    }

    const { data: player, error: playerError } = await requireSupabase()
      .from("players")
      .select("club_id")
      .eq("id", playerId)
      .single();
    if (playerError) throw playerError;

    const { error } = await requireSupabase().from("monthly_payments").upsert({
      month_label: monthLabel,
      group_name: groupName,
      player_id: playerId,
      amount: Number(paymentInfo.amount) || 0,
      paid: Boolean(paymentInfo.paid),
      paid_at: paymentInfo.paidAt || null,
      updated_at: new Date().toISOString(),
      club_id: player.club_id,
    });
    if (error) throw error;
    return true;
  },

  async getTransactions(clubId) {
    const { data, error } = await requireSupabase()
      .from("transactions")
      .select("*")
      .eq("club_id", activeClubId(clubId))
      .order("id", { ascending: false });
    if (error) throw error;
    return (data || []).map((t) => ({
      id: Number(t.id),
      label: t.label,
      value: Number(t.value),
      positive: t.positive,
      date: t.date_label || "",
      clubId: t.club_id,
    }));
  },

  async insertTransaction(tx) {
    const { data, error } = await requireSupabase()
      .from("transactions")
      .insert({
        label: tx.label,
        value: Number(tx.value) || 0,
        positive: tx.positive,
        date_label: tx.date || null,
        club_id: activeClubId(tx.clubId || tx.club_id),
      })
      .select()
      .single();
    if (error) throw error;
    return {
      id: Number(data.id),
      label: data.label,
      value: Number(data.value),
      positive: data.positive,
      date: data.date_label || "",
      clubId: data.club_id,
    };
  },

  async deleteTransaction(id) {
    const { error } = await requireSupabase().from("transactions").delete().eq("id", id);
    if (error) throw error;
    return true;
  },

  async getEvents(clubId) {
    const { data, error } = await requireSupabase()
      .from("club_events")
      .select("*")
      .eq("club_id", activeClubId(clubId))
      .order("id", { ascending: false });
    if (error) throw error;
    return (data || []).map((e) => ({
      id: Number(e.id),
      type: e.type,
      date: e.date_label,
      time: e.time_label || "",
      notes: e.detail || "",
      group: e.group_name || "",
    }));
  },

  async insertEvent(event) {
    const { data, error } = await requireSupabase()
      .from("club_events")
      .insert({
        type: event.type,
        date_label: event.date,
        time_label: event.time || null,
        detail: event.notes || null,
        group_name: event.group || null,
        club_id: activeClubId(event.clubId || event.club_id),
      })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async deleteEvent(id) {
    const { error } = await requireSupabase().from("club_events").delete().eq("id", id);
    if (error) throw error;
    return true;
  },

  async getDocuments(clubId) {
    const { data, error } = await requireSupabase()
      .from("documents")
      .select("*")
      .eq("club_id", activeClubId(clubId))
      .order("id", { ascending: false });
    if (error) throw error;
    return (data || []).map((d) => ({
      id: Number(d.id),
      title: d.title,
      owner: d.owner || "",
      type: d.type || "",
      status: d.status || "",
      expires: d.expires || "",
      fileUrl: d.file_url || "",
    }));
  },

  async insertDocument(doc) {
    const { data, error } = await requireSupabase()
      .from("documents")
      .insert({
        title: doc.title,
        owner: doc.owner || null,
        type: doc.type || null,
        status: doc.status || null,
        expires: doc.expires || null,
        file_url: doc.fileUrl || null,
        club_id: activeClubId(doc.clubId || doc.club_id),
      })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async updateDocument(doc) {
    const { data, error } = await requireSupabase()
      .from("documents")
      .update({
        title: doc.title,
        owner: doc.owner || null,
        type: doc.type || null,
        status: doc.status || null,
        expires: doc.expires || null,
        file_url: doc.fileUrl || null,
      })
      .eq("id", doc.id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async deleteDocument(id) {
    const { error } = await requireSupabase().from("documents").delete().eq("id", id);
    if (error) throw error;
    return true;
  },

  async getEquipment(clubId) {
    const { data, error } = await requireSupabase()
      .from("equipment")
      .select("*")
      .eq("club_id", activeClubId(clubId))
      .order("id", { ascending: true });
    if (error) throw error;
    return data || [];
  },

  async insertEquipment(eq) {
    const { data, error } = await requireSupabase()
      .from("equipment")
      .insert({
        name: eq.name,
        category: eq.category || null,
        total: Number(eq.total) || 0,
        assigned: eq.assigned || null,
        missing: Number(eq.missing) || 0,
        club_id: activeClubId(eq.clubId || eq.club_id),
      })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async updateEquipment(eq) {
    const { data, error } = await requireSupabase()
      .from("equipment")
      .update({
        name: eq.name,
        category: eq.category || null,
        total: Number(eq.total) || 0,
        assigned: eq.assigned || null,
        missing: Number(eq.missing) || 0,
      })
      .eq("id", eq.id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async deleteEquipment(id) {
    const { error } = await requireSupabase().from("equipment").delete().eq("id", id);
    if (error) throw error;
    return true;
  },

  async getEvaluations(clubId) {
    const { data, error } = await requireSupabase()
      .from("player_evaluations")
      .select("*")
      .eq("club_id", activeClubId(clubId));
    if (error) throw error;
    const formatted = {};
    (data || []).forEach((row) => {
      formatted[Number(row.player_id)] = row;
    });
    return formatted;
  },

  async saveEvaluation(playerId, ev) {
    const { data: player, error: playerError } = await requireSupabase()
      .from("players")
      .select("club_id")
      .eq("id", playerId)
      .single();
    if (playerError) throw playerError;
    const { error } = await requireSupabase().from("player_evaluations").upsert({
      player_id: playerId,
      month_label: ev.month || ev.monthLabel || "Curent",
      technique: Number(ev.technique) || 0,
      speed: Number(ev.speed) || 0,
      discipline: Number(ev.discipline) || 0,
      attitude: Number(ev.attitude) || 0,
      tactics: Number(ev.tactics) || 0,
      physical: Number(ev.physical) || 0,
      updated_at: new Date().toISOString(),
      club_id: player.club_id,
    });
    if (error) throw error;
    return true;
  },

  async getDevelopmentPlans(clubId) {
    const { data, error } = await requireSupabase()
      .from("development_plans")
      .select("*")
      .eq("club_id", activeClubId(clubId));
    if (error) throw error;
    return data || [];
  },

  async saveDevelopmentPlan(playerId, plan) {
    const { data: player, error: playerError } = await requireSupabase()
      .from("players")
      .select("club_id")
      .eq("id", playerId)
      .single();
    if (playerError) throw playerError;
    const { error } = await requireSupabase().from("development_plans").upsert({
      player_id: playerId,
      focus: plan.focus || "",
      objective: plan.objective || "",
      exercises: plan.exercises || "",
      status: plan.status || "Activ",
      updated_at: new Date().toISOString(),
      club_id: player.club_id,
    });
    if (error) throw error;
    return true;
  },

  async getDiscipline(clubId) {
    const { data, error } = await requireSupabase()
      .from("discipline_records")
      .select("*")
      .eq("club_id", activeClubId(clubId))
      .order("id", { ascending: false });
    if (error) throw error;
    return data || [];
  },

  async insertDiscipline(d) {
    const { data: player, error: playerError } = await requireSupabase()
      .from("players")
      .select("club_id")
      .eq("id", d.playerId || d.player_id)
      .single();
    if (playerError) throw playerError;
    const { data, error } = await requireSupabase()
      .from("discipline_records")
      .insert({
        player_id: d.playerId || d.player_id,
        type: d.type,
        note: d.note,
        date_label: d.date || d.date_label || null,
        club_id: player.club_id,
      })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async deleteDiscipline(id) {
    const { error } = await requireSupabase().from("discipline_records").delete().eq("id", id);
    if (error) throw error;
    return true;
  },

  async getChatMessages(clubId) {
    const { data, error } = await requireSupabase()
      .from("chat_messages")
      .select("*")
      .eq("club_id", activeClubId(clubId))
      .order("id", { ascending: true });
    if (error) throw error;
    return data || [];
  },

  async insertChatMessage(msg) {
    const { data, error } = await requireSupabase()
      .from("chat_messages")
      .insert({
        audience: msg.audience || "club",
        author_id: msg.authorId || null,
        author_name: msg.author || msg.authorName || null,
        text: msg.text,
        club_id: activeClubId(msg.clubId || msg.club_id),
      })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async getMedia(clubId) {
    const { data, error } = await requireSupabase()
      .from("media_gallery")
      .select("*")
      .eq("club_id", activeClubId(clubId))
      .order("id", { ascending: false });
    if (error) throw error;
    return data || [];
  },

  async insertMedia(m) {
    const { data, error } = await requireSupabase()
      .from("media_gallery")
      .insert({
        type: m.type || "image",
        title: m.title,
        url: m.url,
        date_label: m.date || null,
        club_id: activeClubId(m.clubId || m.club_id),
      })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async deleteMedia(id) {
    const { error } = await requireSupabase().from("media_gallery").delete().eq("id", id);
    if (error) throw error;
    return true;
  },

  async getScouting(clubId) {
    const { data, error } = await requireSupabase()
      .from("scouting_players")
      .select("*")
      .eq("club_id", activeClubId(clubId))
      .order("id", { ascending: false });
    if (error) throw error;
    return data || [];
  },

  async insertScouting(s) {
    const { data, error } = await requireSupabase()
      .from("scouting_players")
      .insert({
        name: s.name,
        age: s.age || null,
        role: s.role || null,
        notes: s.notes || null,
        decision: s.decision || null,
        club_id: activeClubId(s.clubId || s.club_id),
      })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async updateScouting(s) {
    const { data, error } = await requireSupabase()
      .from("scouting_players")
      .update({
        name: s.name,
        age: s.age || null,
        role: s.role || null,
        notes: s.notes || null,
        decision: s.decision || null,
      })
      .eq("id", s.id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async deleteScouting(id) {
    const { error } = await requireSupabase().from("scouting_players").delete().eq("id", id);
    if (error) throw error;
    return true;
  },

  async createClub(userId, clubData) {
    const sb = requireSupabase();
    const groups = clubData.ageGroups || clubData.groups || DEFAULT_GROUPS;

    // Politica RLS de INSERT pe clubs cere created_by = auth.uid(). Îl setăm
    // explicit (nu ne bazăm pe default-ul coloanei, care poate lipsi în DB),
    // rezolvând id-ul din sesiune dacă nu a fost transmis.
    let ownerId = userId;
    if (!ownerId) {
      const { data: authData } = await sb.auth.getUser();
      ownerId = authData?.user?.id || null;
    }

    const { data, error } = await sb
      .from("clubs")
      .insert({
        name: clubData.name,
        logo_url: clubData.logo || clubData.logoUrl || null,
        city: clubData.city || null,
        country: clubData.country || null,
        contact_email: clubData.email || clubData.adminEmail || null,
        phone: clubData.phone || null,
        description: clubData.description || null,
        groups,
        primary_color: clubData.primaryColor || null,
        secondary_color: clubData.secondaryColor || null,
        status: "active",
        blocked: false,
        plan: "Free",
        created_by: ownerId,
      })
      .select()
      .single();
    if (error) throw error;

    const { error: membershipError } = await requireSupabase()
      .from("club_memberships")
      .insert({
        user_id: userId,
        club_id: data.id,
        role: "club_owner",
        assigned_groups: groups,
        status: "active",
      });
    if (membershipError) throw membershipError;

    const { error: subscriptionError } = await requireSupabase()
      .from("subscriptions")
      .insert({
        club_id: data.id,
        plan_name: "Free",
        status: "active",
        max_players: 20,
      });
    if (subscriptionError) throw subscriptionError;

    return mapClub(data);
  },

  async getTasks(clubId) {
    const { data, error } = await requireSupabase()
      .from("club_tasks")
      .select("*")
      .eq("club_id", activeClubId(clubId))
      .order("done", { ascending: true })
      .order("id", { ascending: false });
    if (error) throw error;
    return (data || []).map((t) => ({
      id: Number(t.id),
      title: t.title,
      detail: t.detail || "",
      priority: t.priority || "NORMAL",
      meta: t.due_label ? `Termen: ${t.due_label}` : (t.assignee ? `Responsabil: ${t.assignee}` : ""),
      dueLabel: t.due_label || "",
      assignee: t.assignee || "",
      done: Boolean(t.done),
      clubId: t.club_id,
    }));
  },

  async insertTask(task) {
    const { data, error } = await requireSupabase()
      .from("club_tasks")
      .insert({
        title: task.title,
        detail: task.detail || null,
        priority: task.priority || "NORMAL",
        due_label: task.dueLabel || null,
        assignee: task.assignee || null,
        club_id: activeClubId(task.clubId || task.club_id),
      })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async setTaskDone(id, done) {
    const { error } = await requireSupabase().from("club_tasks").update({ done }).eq("id", id);
    if (error) throw error;
    return true;
  },

  async deleteTask(id) {
    const { error } = await requireSupabase().from("club_tasks").delete().eq("id", id);
    if (error) throw error;
    return true;
  },

  // Imagine de ansamblu a platformei (ecranul Admin SaaS, doar super admin —
  // RLS limitează oricum rândurile vizibile pentru alte roluri).
  async getPlatformOverview() {
    const sb = requireSupabase();
    const [profilesRes, membershipsRes, playersRes] = await Promise.all([
      sb.from("profiles").select("id", { count: "exact", head: true }),
      sb.from("club_memberships").select("club_id,status,role"),
      sb.from("players").select("club_id"),
    ]);
    if (membershipsRes.error) throw membershipsRes.error;
    if (playersRes.error) throw playersRes.error;
    return {
      usersCount: profilesRes.count ?? 0,
      memberships: membershipsRes.data || [],
      players: playersRes.data || [],
    };
  },

  async getClubMembers(clubId) {
    if (!clubId) return [];
    const { data, error } = await requireSupabase().rpc("get_club_members", {
      target_club_id: clubId,
    });
    if (error) throw error;
    return (data || []).map((m) => ({
      membershipId: m.membership_id,
      userId: m.user_id,
      name: m.full_name || m.email || "Utilizator",
      email: m.email || "",
      role: normalizeRole(m.role),
      status: m.status || "active",
      assignedGroups: m.assigned_groups || [],
      joinedAt: m.joined_at,
    }));
  },

  async setMembershipStatus(membershipId, status) {
    const { error } = await requireSupabase()
      .from("club_memberships")
      .update({ status })
      .eq("id", membershipId);
    if (error) throw error;
    return true;
  },

  // Aprobă un membru: activează membership-ul și, pentru jucători, îl creează în lot.
  async approveMember(membershipId) {
    const { data, error } = await requireSupabase().rpc("approve_club_member", {
      target_membership_id: membershipId,
    });
    if (error) throw error;
    return data;
  },

  async removeMembership(membershipId) {
    const { error } = await requireSupabase()
      .from("club_memberships")
      .delete()
      .eq("id", membershipId);
    if (error) throw error;
    return true;
  },

  async updateSubscriptionPlan(clubId, planName, maxPlayers) {
    const { data, error } = await requireSupabase()
      .from("subscriptions")
      .upsert(
        {
          club_id: clubId,
          plan_name: planName,
          status: "active",
          max_players: maxPlayers ?? null,
        },
        { onConflict: "club_id" }
      )
      .select()
      .single();
    if (error) throw error;

    // Ține și clubs.plan sincronizat, pentru afișare.
    await requireSupabase().from("clubs").update({ plan: planName }).eq("id", clubId);
    return mapSubscription(data);
  },

  // Blochează/deblochează un club (doar super-admin, prin RLS).
  async setClubBlocked(clubId, blocked) {
    const { data, error } = await requireSupabase()
      .from("clubs")
      .update({ blocked })
      .eq("id", clubId)
      .select()
      .single();
    if (error) throw error;
    return mapClub(data);
  },

  // Editarea datelor clubului (nume, oraș, culori, grupe etc.). Permisă
  // owner-ilor/super-adminilor prin politica clubs_update_saas.
  async updateClub(clubId, data) {
    const payload = {};
    if (data.name !== undefined) payload.name = data.name;
    if (data.city !== undefined) payload.city = data.city || null;
    if (data.country !== undefined) payload.country = data.country || null;
    if (data.email !== undefined) payload.contact_email = data.email || null;
    if (data.phone !== undefined) payload.phone = data.phone || null;
    if (data.description !== undefined) payload.description = data.description || null;
    if (data.logoUrl !== undefined) payload.logo_url = data.logoUrl || null;
    if (data.primaryColor !== undefined) payload.primary_color = data.primaryColor || null;
    if (data.secondaryColor !== undefined) payload.secondary_color = data.secondaryColor || null;
    if (data.groups !== undefined) payload.groups = data.groups;

    const { data: row, error } = await requireSupabase()
      .from("clubs")
      .update(payload)
      .eq("id", clubId)
      .select()
      .single();
    if (error) throw error;
    return mapClub(row);
  },

  async runAiAnalysis({ clubId, analysisType, question }) {
    const { data, error } = await requireSupabase().functions.invoke("club-ai-analysis", {
      body: { clubId, analysisType, question },
    });
    if (error) {
      // Eroarea de la functions.invoke are corpul răspunsului în context.
      let message = error.message || "AI indisponibil.";
      try {
        const body = await error.context?.json?.();
        if (body?.error) message = body.error;
      } catch (_) { /* păstrăm mesajul generic */ }
      throw new Error(message);
    }
    if (data?.error) throw new Error(data.error);
    return data;
  },

  async acceptInvitation(inviteToken) {
    const { data, error } = await requireSupabase().rpc("accept_club_invitation", {
      invite_token: inviteToken,
    });
    if (error) throw error;
    return data;
  },

  async requestMembership(clubName, desiredRole = "player") {
    const { data, error } = await requireSupabase().rpc("request_club_membership", {
      target_club_name: clubName,
      desired_role: desiredRole,
    });
    if (error) throw error;
    return data;
  },

  async inviteOwner(email, clubId, role = "club_owner") {
    // Token-ul e generat de baza de date (default gen_random_bytes) — sigur criptografic.
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const { data, error } = await requireSupabase()
      .from("club_invitations")
      .insert({
        club_id: clubId,
        email: email.toLowerCase().trim(),
        role: role,
        status: "pending",
        expires_at: expiresAt.toISOString(),
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },
};
