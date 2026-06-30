import { supabase } from "./supabaseClient";

export const DEFAULT_CLUB_ID = "00000000-0000-0000-0000-000000000000";

export const supabaseService = {
  // --- PLAYERS ---
  async getPlayers(clubId) {
    const targetId = clubId || DEFAULT_CLUB_ID;
    const { data, error } = await supabase
      .from("players")
      .select("*")
      .eq("club_id", targetId)
      .order("name", { ascending: true });

    if (error) throw error;
    return (data || []).map((p) => ({
      id: p.id,
      no: p.no,
      name: p.name,
      role: p.role,
      group: p.group_name,
      clubId: p.club_id,
      status: p.status,
      birthdate: p.birthdate || "",
      foot: p.foot || "",
      parentPhone: p.parent_phone || "",
      medicalStatus: p.medical_status || "",
    }));
  },

  async insertPlayer(player) {
    const payload = {
      no: Number(player.no) || 0,
      name: player.name,
      role: player.role,
      group_name: player.group,
      status: player.status || "Activ",
      club_id: player.clubId || DEFAULT_CLUB_ID,
      birthdate: player.birthdate || null,
      foot: player.foot || null,
      parent_phone: player.parentPhone || null,
      medical_status: player.medicalStatus || null,
    };
    const { data, error } = await supabase.from("players").insert(payload).select().single();
    if (error) throw error;
    return data;
  },

  async updatePlayer(player) {
    const { data, error } = await supabase
      .from("players")
      .update({
        no: Number(player.no),
        name: player.name,
        role: player.role,
        group_name: player.group,
        status: player.status,
        birthdate: player.birthdate,
        foot: player.foot,
        parent_phone: player.parentPhone,
        medical_status: player.medicalStatus,
      })
      .eq("id", player.id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  // --- TRAININGS ---
  async getTrainings(clubId) {
    const targetId = clubId || DEFAULT_CLUB_ID;
    const { data, error } = await supabase
      .from("trainings")
      .select("*")
      .eq("club_id", targetId)
      .order("id", { ascending: false });
    if (error) throw error;
    return (data || []).map((t) => ({
      id: t.id,
      state: t.state,
      date: t.date_label,
      time: t.time_label,
      location: t.location,
      group: t.group_name,
      coach: t.coach,
      theme: t.theme || "",
      steps: t.steps || [],
      clubId: t.club_id
    }));
  },

  async insertTraining(t) {
    const payload = {
      state: t.state || "Viitor",
      date_label: t.date,
      time_label: t.time,
      location: t.location,
      group_name: t.group,
      coach: t.coach,
      theme: t.theme || null,
      club_id: t.clubId || DEFAULT_CLUB_ID,
    };
    const { data, error } = await supabase.from("trainings").insert(payload).select().single();
    if (error) throw error;
    return data;
  },

  // --- MATCHES ---
  async getMatches(clubId) {
    const targetId = clubId || DEFAULT_CLUB_ID;
    const { data, error } = await supabase
      .from("matches")
      .select("*")
      .eq("club_id", targetId)
      .order("id", { ascending: false });
    if (error) throw error;
    return (data || []).map((m) => ({
      id: m.id,
      type: m.type,
      opponent: m.opponent,
      group: m.group_name,
      date: m.date_label,
      time: m.time_label,
      location: m.location,
      status: m.status,
      score: m.score || "",
      callUps: m.call_ups || {},
      clubId: m.club_id
    }));
  },

  // --- ATTENDANCE ---
  async getAttendance(clubId) {
    const { data, error } = await supabase.from("attendance").select("*");
    if (error) throw error;
    const formatted = {};
    (data || []).forEach((row) => {
      const tId = row.training_id;
      const pId = row.player_id;
      if (!formatted[tId]) formatted[tId] = {};
      formatted[tId][pId] = row.status;
    });
    return formatted;
  },

  async saveAttendance(trainingId, playerId, status) {
    if (!status) {
      await supabase.from("attendance").delete().eq("training_id", trainingId).eq("player_id", playerId);
    } else {
      await supabase.from("attendance").upsert({
        training_id: trainingId,
        player_id: playerId,
        status: status,
        updated_at: new Date().toISOString(),
      });
    }
    return true;
  },

  // --- TRANSACTIONS ---
  async getTransactions(clubId) {
    const targetId = clubId || DEFAULT_CLUB_ID;
    const { data, error } = await supabase
      .from("transactions")
      .select("*")
      .eq("club_id", targetId)
      .order("id", { ascending: false });
    if (error) throw error;
    return (data || []).map((t) => ({
      id: t.id,
      label: t.label,
      value: Number(t.value),
      positive: t.positive,
      date: t.date_label || "",
      clubId: t.club_id
    }));
  },

  // --- SAAS MANAGEMENT ---
  async getClubs() {
    const { data, error } = await supabase.from("clubs").select("*").order("name");
    if (error) throw error;
    return data;
  },

  async getMemberships(userId) {
    if (!userId) return [];
    const { data, error } = await supabase
      .from("club_memberships")
      .select("*, clubs(*)")
      .eq("user_id", userId);
    if (error) throw error;
    return data;
  },

  async getSubscriptions() {
    const { data, error } = await supabase.from("subscriptions").select("*");
    if (error) throw error;
    return data;
  },

  async getInvitations(clubId) {
    if (!clubId) return [];
    const { data, error } = await supabase
      .from("club_invitations")
      .select("*")
      .eq("club_id", clubId);
    if (error) throw error;
    return data || [];
  },

  async createClub(userId, clubName) {
    const { data: club, error: clubErr } = await supabase
      .from("clubs")
      .insert({ name: clubName })
      .select()
      .single();
    if (clubErr) throw clubErr;

    const { error: memErr } = await supabase
      .from("club_memberships")
      .insert({ club_id: club.id, user_id: userId, role: "owner" });
    if (memErr) throw memErr;

    return club;
  }
};
