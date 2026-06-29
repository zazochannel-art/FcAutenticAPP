import { supabase } from "./supabaseClient";

const DEFAULT_CLUB_ID = "club-fc-autentic";
const getClubId = (item) => item?.clubId || item?.club_id || DEFAULT_CLUB_ID;
const toIsoDateOrNull = (value) => {
  if (!value) return null;
  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? null : new Date(parsed).toISOString();
};

export const supabaseService = {
  // --- PLAYERS ---
  async getPlayers() {
    const { data, error } = await supabase.from("players").select("*").order("name", { ascending: true });
    if (error) throw error;
    return (data || []).map((p) => ({
      id: Number(p.id),
      no: p.no,
      name: p.name,
      role: p.role,
      group: p.group_name,
      clubId: getClubId(p),
      status: p.status,
      birthdate: p.birthdate || "",
      foot: p.foot || "",
      parentPhone: p.parent_phone || "",
      medicalStatus: p.medical_status || "",
      present: true,
    }));
  },
  async insertPlayer(player) {
    const { data, error } = await supabase
      .from("players")
      .insert({
        no: Number(player.no) || 0,
        name: player.name,
        role: player.role,
        group_name: player.group,
        club_id: getClubId(player),
        status: player.status || "Activ",
        birthdate: player.birthdate || null,
        foot: player.foot || null,
        parent_phone: player.parentPhone || null,
        medical_status: player.medicalStatus || null,
      })
      .select()
      .single();
    if (error) throw error;
    return {
      id: Number(data.id),
      no: data.no,
      name: data.name,
      role: data.role,
      group: data.group_name,
      clubId: getClubId(data),
      status: data.status,
      birthdate: data.birthdate || "",
      foot: data.foot || "",
      parentPhone: data.parent_phone || "",
      medicalStatus: data.medical_status || "",
      present: true,
    };
  },
  async updatePlayer(player) {
    const { data, error } = await supabase
      .from("players")
      .update({
        no: Number(player.no) || 0,
        name: player.name,
        role: player.role,
        group_name: player.group,
        club_id: getClubId(player),
        status: player.status,
        birthdate: player.birthdate || null,
        foot: player.foot || null,
        parent_phone: player.parentPhone || null,
        medical_status: player.medicalStatus || null,
      })
      .eq("id", player.id)
      .select()
      .single();
    if (error) throw error;
    return {
      id: Number(data.id),
      no: data.no,
      name: data.name,
      role: data.role,
      group: data.group_name,
      clubId: getClubId(data),
      status: data.status,
      birthdate: data.birthdate || "",
      foot: data.foot || "",
      parentPhone: data.parent_phone || "",
      medicalStatus: data.medical_status || "",
      present: true,
    };
  },
  async deletePlayer(id) {
    const { error } = await supabase.from("players").delete().eq("id", id);
    if (error) throw error;
    return true;
  },

  // --- TRAININGS ---
  async getTrainings() {
    const { data, error } = await supabase.from("trainings").select("*").order("id", { ascending: false });
    if (error) throw error;
    return (data || []).map((t) => ({
      id: Number(t.id),
      state: t.state,
      date: t.date_label,
      time: t.time_label,
      location: t.location,
      group: t.group_name,
      clubId: getClubId(t),
      coach: t.coach,
      theme: t.theme || "",
      objectives: t.objectives || "",
      equipment: t.equipment || "",
      exercises: t.exercises || "",
      steps: t.steps || [],
    }));
  },
  async insertTraining(t) {
    const { data, error } = await supabase
      .from("trainings")
      .insert({
        state: t.state || "Viitor",
        date_label: t.date,
        time_label: t.time,
        location: t.location,
        group_name: t.group,
        club_id: getClubId(t),
        coach: t.coach,
        theme: t.theme || null,
        objectives: t.objectives || null,
        equipment: t.equipment || null,
        exercises: t.exercises || null,
        steps: t.steps || [],
      })
      .select()
      .single();
    if (error) throw error;
    return {
      id: Number(data.id),
      state: data.state,
      date: data.date_label,
      time: data.time_label,
      location: data.location,
      group: data.group_name,
      clubId: getClubId(data),
      coach: data.coach,
      theme: data.theme || "",
      objectives: data.objectives || "",
      equipment: data.equipment || "",
      exercises: data.exercises || "",
      steps: data.steps || [],
    };
  },
  async updateTraining(t) {
    const { data, error } = await supabase
      .from("trainings")
      .update({
        state: t.state,
        date_label: t.date,
        time_label: t.time,
        location: t.location,
        group_name: t.group,
        club_id: getClubId(t),
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
    return {
      id: Number(data.id),
      state: data.state,
      date: data.date_label,
      time: data.time_label,
      location: data.location,
      group: data.group_name,
      clubId: getClubId(data),
      coach: data.coach,
      theme: data.theme || "",
      objectives: data.objectives || "",
      equipment: data.equipment || "",
      exercises: data.exercises || "",
      steps: data.steps || [],
    };
  },
  async deleteTraining(id) {
    const { error } = await supabase.from("trainings").delete().eq("id", id);
    if (error) throw error;
    return true;
  },

  // --- ATTENDANCE ---
  async getAttendance() {
    const { data, error } = await supabase.from("attendance").select("*");
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
      const { error } = await supabase.from("attendance").delete().eq("training_id", trainingId).eq("player_id", playerId);
      if (error) throw error;
    } else {
      const { error } = await supabase.from("attendance").upsert({
        training_id: trainingId,
        player_id: playerId,
        status: status,
        updated_at: new Date().toISOString(),
      });
      if (error) throw error;
    }
    return true;
  },

  // --- MATCHES ---
  async getMatches() {
    const { data, error } = await supabase.from("matches").select("*").order("id", { ascending: false });
    if (error) throw error;
    return (data || []).map((m) => ({
      id: Number(m.id),
      type: m.type,
      opponent: m.opponent,
      group: m.group_name,
      clubId: getClubId(m),
      date: m.date_label,
      time: m.time_label,
      location: m.location,
      status: m.status,
      score: m.score || "",
      notes: m.notes || "",
      callUps: m.call_ups || {},
      scorers: m.scorers || {},
      playerStats: m.player_stats || {},
    }));
  },
  async insertMatch(m) {
    const { data, error } = await supabase
      .from("matches")
      .insert({
        type: m.type,
        opponent: m.opponent,
        group_name: m.group,
        club_id: getClubId(m),
        date_label: m.date,
        time_label: m.time,
        location: m.location,
        status: m.status || "Programat",
        score: m.score || null,
        notes: m.notes || null,
        call_ups: m.callUps || {},
        scorers: m.scorers || {},
        player_stats: m.playerStats || {},
      })
      .select()
      .single();
    if (error) throw error;
    return {
      id: Number(data.id),
      type: data.type,
      opponent: data.opponent,
      group: data.group_name,
      clubId: getClubId(data),
      date: data.date_label,
      time: data.time_label,
      location: data.location,
      status: data.status,
      score: data.score || "",
      notes: data.notes || "",
      callUps: data.call_ups || {},
      scorers: data.scorers || {},
      playerStats: data.player_stats || {},
    };
  },
  async updateMatch(m) {
    const { data, error } = await supabase
      .from("matches")
      .update({
        type: m.type,
        opponent: m.opponent,
        group_name: m.group,
        club_id: getClubId(m),
        date_label: m.date,
        time_label: m.time,
        location: m.location,
        status: m.status,
        score: m.score || null,
        notes: m.notes || null,
        call_ups: m.callUps || {},
        scorers: m.scorers || {},
        player_stats: m.playerStats || {},
      })
      .eq("id", m.id)
      .select()
      .single();
    if (error) throw error;
    return {
      id: Number(data.id),
      type: data.type,
      opponent: data.opponent,
      group: data.group_name,
      clubId: getClubId(data),
      date: data.date_label,
      time: data.time_label,
      location: data.location,
      status: data.status,
      score: data.score || "",
      notes: data.notes || "",
      callUps: data.call_ups || {},
      scorers: data.scorers || {},
      playerStats: data.player_stats || {},
    };
  },
  async deleteMatch(id) {
    const { error } = await supabase.from("matches").delete().eq("id", id);
    if (error) throw error;
    return true;
  },

  // --- PLAYER OBSERVATIONS ---
  async getObservations() {
    const { data, error } = await supabase.from("player_observations").select("*").order("id", { ascending: false });
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
    const { data, error } = await supabase
      .from("player_observations")
      .insert({
        player_id: playerId,
        type: obs.type,
        source: obs.source || null,
        date_label: obs.date || null,
        author_name: obs.author || null,
        note: obs.text,
      })
      .select()
      .single();
    if (error) throw error;
    return {
      id: Number(data.id),
      type: data.type,
      source: data.source || "",
      date: data.date_label || "",
      author: data.author_name || "",
      text: data.note,
    };
  },
  async deleteObservation(id) {
    const { error } = await supabase.from("player_observations").delete().eq("id", id);
    if (error) throw error;
    return true;
  },

  // --- TRAINING PAYMENTS (payments) ---
  async getTrainingPayments() {
    const { data, error } = await supabase.from("training_payments").select("*");
    if (error) throw error;
    const formatted = {};
    (data || []).forEach((row) => {
      const tId = Number(row.training_id);
      const pId = Number(row.player_id);
      if (!formatted[tId]) formatted[tId] = {};
      formatted[tId][pId] = {
        paid: row.paid,
        amount: String(row.amount),
        paidAt: row.paid_at || "",
      };
    });
    return formatted;
  },
  async saveTrainingPayment(trainingId, playerId, paymentInfo) {
    if (!paymentInfo) {
      const { error } = await supabase.from("training_payments").delete().eq("training_id", trainingId).eq("player_id", playerId);
      if (error) throw error;
    } else {
      const { error } = await supabase.from("training_payments").upsert({
        training_id: trainingId,
        player_id: playerId,
        amount: Number(paymentInfo.amount) || 0,
        paid: Boolean(paymentInfo.paid),
        paid_at: paymentInfo.paidAt || null,
        updated_at: new Date().toISOString(),
      });
      if (error) throw error;
    }
    return true;
  },

  // --- MONTHLY PAYMENTS ---
  async getMonthlyPayments() {
    const { data, error } = await supabase.from("monthly_payments").select("*");
    if (error) throw error;
    const formatted = {};
    (data || []).forEach((row) => {
      const key = `${row.month_label}-${row.group_name}`;
      const pId = Number(row.player_id);
      if (!formatted[key]) formatted[key] = {};
      formatted[key][pId] = {
        paid: row.paid,
        amount: String(row.amount),
        paidAt: row.paid_at || "",
      };
    });
    return formatted;
  },
  async saveMonthlyPayment(monthLabel, groupName, playerId, paymentInfo) {
    if (!paymentInfo) {
      const { error } = await supabase.from("monthly_payments").delete().eq("month_label", monthLabel).eq("group_name", groupName).eq("player_id", playerId);
      if (error) throw error;
    } else {
      const { error } = await supabase.from("monthly_payments").upsert({
        month_label: monthLabel,
        group_name: groupName,
        player_id: playerId,
        amount: Number(paymentInfo.amount) || 0,
        paid: Boolean(paymentInfo.paid),
        paid_at: paymentInfo.paidAt || null,
        updated_at: new Date().toISOString(),
      });
      if (error) throw error;
    }
    return true;
  },

  // --- TRANSACTIONS ---
  async getTransactions() {
    const { data, error } = await supabase.from("transactions").select("*").order("id", { ascending: false });
    if (error) throw error;
    return (data || []).map((t) => ({
      id: Number(t.id),
      label: t.label,
      value: Number(t.value),
      positive: t.positive,
      date: t.date_label || "",
      clubId: getClubId(t),
    }));
  },
  async insertTransaction(tx) {
    const { data, error } = await supabase
      .from("transactions")
      .insert({
        label: tx.label,
        value: Number(tx.value) || 0,
        positive: tx.positive,
        date_label: tx.date || null,
        club_id: getClubId(tx),
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
      clubId: getClubId(data),
    };
  },
  async deleteTransaction(id) {
    const { error } = await supabase.from("transactions").delete().eq("id", id);
    if (error) throw error;
    return true;
  },

  // --- CLUB EVENTS (events) ---
  async getEvents() {
    const { data, error } = await supabase.from("club_events").select("*").order("id", { ascending: false });
    if (error) throw error;
    return (data || []).map((e) => ({
      id: Number(e.id),
      type: e.type,
      date: e.date_label,
      time: e.time_label || "",
      notes: e.detail || "",
      group: e.group_name || "",
      clubId: getClubId(e),
    }));
  },
  async insertEvent(event) {
    const { data, error } = await supabase
      .from("club_events")
      .insert({
        type: event.type,
        date_label: event.date,
        time_label: event.time || null,
        detail: event.notes || null,
        group_name: event.group || null,
        club_id: getClubId(event),
      })
      .select()
      .single();
    if (error) throw error;
    return {
      id: Number(data.id),
      type: data.type,
      date: data.date_label,
      time: data.time_label || "",
      notes: data.detail || "",
      group: data.group_name || "",
    };
  },
  async deleteEvent(id) {
    const { error } = await supabase.from("club_events").delete().eq("id", id);
    if (error) throw error;
    return true;
  },

  // --- DOCUMENTS ---
  async getDocuments() {
    const { data, error } = await supabase.from("documents").select("*").order("id", { ascending: false });
    if (error) throw error;
    return (data || []).map((d) => ({
      id: Number(d.id),
      title: d.title,
      owner: d.owner || "",
      audience: d.audience || "staff",
      group: d.group_name || "",
      playerId: d.player_id ? Number(d.player_id) : null,
      type: d.type || "",
      status: d.status || "",
      expires: d.expires || "",
      fileUrl: d.file_url || "",
      clubId: getClubId(d),
    }));
  },
  async insertDocument(doc) {
    const { data, error } = await supabase
      .from("documents")
      .insert({
        title: doc.title,
        owner: doc.owner || null,
        audience: doc.audience || "staff",
        group_name: doc.group || null,
        player_id: doc.playerId || null,
        type: doc.type || null,
        status: doc.status || null,
        expires: doc.expires || null,
        file_url: doc.fileUrl || null,
        club_id: getClubId(doc),
      })
      .select()
      .single();
    if (error) throw error;
    return {
      id: Number(data.id),
      title: data.title,
      owner: data.owner || "",
      audience: data.audience || "staff",
      group: data.group_name || "",
      clubId: getClubId(data),
      playerId: data.player_id ? Number(data.player_id) : null,
      type: data.type || "",
      status: data.status || "",
      expires: data.expires || "",
      fileUrl: data.file_url || "",
      clubId: getClubId(data),
    };
  },
  async updateDocument(doc) {
    const { data, error } = await supabase
      .from("documents")
      .update({
        title: doc.title,
        owner: doc.owner || null,
        audience: doc.audience || "staff",
        group_name: doc.group || null,
        player_id: doc.playerId || null,
        type: doc.type || null,
        status: doc.status || null,
        expires: doc.expires || null,
        file_url: doc.fileUrl || null,
        club_id: getClubId(doc),
      })
      .eq("id", doc.id)
      .select()
      .single();
    if (error) throw error;
    return {
      id: Number(data.id),
      title: data.title,
      owner: data.owner || "",
      audience: data.audience || "staff",
      group: data.group_name || "",
      playerId: data.player_id ? Number(data.player_id) : null,
      type: data.type || "",
      status: data.status || "",
      expires: data.expires || "",
      fileUrl: data.file_url || "",
      clubId: getClubId(data),
    };
  },
  async deleteDocument(id) {
    const { error } = await supabase.from("documents").delete().eq("id", id);
    if (error) throw error;
    return true;
  },

  // --- EQUIPMENT ---
  async getEquipment() {
    const { data, error } = await supabase.from("equipment").select("*").order("id", { ascending: true });
    if (error) throw error;
    return (data || []).map((e) => ({
      id: Number(e.id),
      name: e.name,
      category: e.category || "",
      total: e.total,
      assigned: e.assigned || "",
      missing: e.missing,
      clubId: getClubId(e),
    }));
  },
  async insertEquipment(eq) {
    const { data, error } = await supabase
      .from("equipment")
      .insert({
        name: eq.name,
        category: eq.category || null,
        total: Number(eq.total) || 0,
        assigned: eq.assigned || null,
        missing: Number(eq.missing) || 0,
        club_id: getClubId(eq),
      })
      .select()
      .single();
    if (error) throw error;
    return {
      id: Number(data.id),
      name: data.name,
      category: data.category || "",
      total: data.total,
      assigned: data.assigned || "",
      missing: data.missing,
      clubId: getClubId(data),
    };
  },
  async updateEquipment(eq) {
    const { data, error } = await supabase
      .from("equipment")
      .update({
        name: eq.name,
        category: eq.category || null,
        total: Number(eq.total) || 0,
        assigned: eq.assigned || null,
        missing: Number(eq.missing) || 0,
        club_id: getClubId(eq),
      })
      .eq("id", eq.id)
      .select()
      .single();
    if (error) throw error;
    return {
      id: Number(data.id),
      name: data.name,
      category: data.category || "",
      total: data.total,
      assigned: data.assigned || "",
      missing: data.missing,
      clubId: getClubId(data),
    };
  },
  async deleteEquipment(id) {
    const { error } = await supabase.from("equipment").delete().eq("id", id);
    if (error) throw error;
    return true;
  },

  // --- PLAYER EVALUATIONS (evaluations) ---
  async getEvaluations() {
    const { data, error } = await supabase.from("player_evaluations").select("*");
    if (error) throw error;
    const formatted = {};
    (data || []).forEach((row) => {
      const pId = Number(row.player_id);
      formatted[pId] = {
        month: row.month_label,
        technique: row.technique,
        speed: row.speed,
        discipline: row.discipline,
        attitude: row.attitude,
        tactics: row.tactics,
        physical: row.physical,
      };
    });
    return formatted;
  },
  async saveEvaluation(playerId, ev) {
    if (!ev) {
      const { error } = await supabase.from("player_evaluations").delete().eq("player_id", playerId);
      if (error) throw error;
    } else {
      const { error } = await supabase.from("player_evaluations").upsert({
        player_id: playerId,
        month_label: ev.month,
        technique: Number(ev.technique) || 0,
        speed: Number(ev.speed) || 0,
        discipline: Number(ev.discipline) || 0,
        attitude: Number(ev.attitude) || 0,
        tactics: Number(ev.tactics) || 0,
        physical: Number(ev.physical) || 0,
        updated_at: new Date().toISOString(),
      });
      if (error) throw error;
    }
    return true;
  },

  // --- DEVELOPMENT PLANS ---
  async getDevelopmentPlans() {
    const { data, error } = await supabase.from("development_plans").select("*");
    if (error) throw error;
    const formatted = {};
    (data || []).forEach((row) => {
      const pId = Number(row.player_id);
      formatted[pId] = {
        focus: row.focus || "",
        objective: row.objective || "",
        exercises: row.exercises || "",
        status: row.status || "",
      };
    });
    return formatted;
  },
  async saveDevelopmentPlan(playerId, plan) {
    if (!plan) {
      const { error } = await supabase.from("development_plans").delete().eq("player_id", playerId);
      if (error) throw error;
    } else {
      const { error } = await supabase.from("development_plans").upsert({
        player_id: playerId,
        focus: plan.focus || null,
        objective: plan.objective || null,
        exercises: plan.exercises || null,
        status: plan.status || null,
        updated_at: new Date().toISOString(),
      });
      if (error) throw error;
    }
    return true;
  },

  // --- DISCIPLINE RECORDS (discipline) ---
  async getDiscipline() {
    const { data, error } = await supabase.from("discipline_records").select("*").order("id", { ascending: false });
    if (error) throw error;
    return (data || []).map((d) => ({
      id: Number(d.id),
      playerId: Number(d.player_id),
      type: d.type,
      note: d.note || "",
      date: d.date_label || "",
      clubId: getClubId(d),
    }));
  },
  async insertDiscipline(d) {
    const { data, error } = await supabase
      .from("discipline_records")
      .insert({
        player_id: d.playerId,
        type: d.type,
        note: d.note || null,
        date_label: d.date || null,
        club_id: getClubId(d),
      })
      .select()
      .single();
    if (error) throw error;
    return {
      id: Number(data.id),
      playerId: Number(data.player_id),
      type: data.type,
      note: data.note || "",
      date: data.date_label || "",
      clubId: getClubId(data),
    };
  },
  async deleteDiscipline(id) {
    const { error } = await supabase.from("discipline_records").delete().eq("id", id);
    if (error) throw error;
    return true;
  },

  // --- CHAT MESSAGES ---
  async getChatMessages() {
    const { data, error } = await supabase.from("chat_messages").select("*").order("id", { ascending: true });
    if (error) throw error;
    return (data || []).map((msg) => ({
      id: Number(msg.id),
      audience: msg.audience,
      author: msg.author_name || "Membru",
      text: msg.text,
      date: new Date(msg.created_at).toLocaleDateString("ro-RO", { hour: "2-digit", minute: "2-digit" }),
      clubId: getClubId(msg),
    }));
  },
  async insertChatMessage(msg) {
    const { data, error } = await supabase
      .from("chat_messages")
      .insert({
        audience: msg.audience,
        author_name: msg.author,
        text: msg.text,
        club_id: getClubId(msg),
      })
      .select()
      .single();
    if (error) throw error;
    return {
      id: Number(data.id),
      audience: data.audience,
      author: data.author_name || "Membru",
      text: data.text,
      date: new Date(data.created_at).toLocaleDateString("ro-RO", { hour: "2-digit", minute: "2-digit" }),
      clubId: getClubId(data),
    };
  },

  // --- MEDIA GALLERY ---
  async getMedia() {
    const { data, error } = await supabase.from("media_gallery").select("*").order("id", { ascending: false });
    if (error) throw error;
    return (data || []).map((m) => ({
      id: Number(m.id),
      type: m.type || "Meci",
      title: m.title,
      url: m.url || "",
      audience: m.audience || "all",
      group: m.group_name || "",
      date: m.date_label || "",
      clubId: getClubId(m),
    }));
  },
  async insertMedia(m) {
    const { data, error } = await supabase
      .from("media_gallery")
      .insert({
        type: m.type || "Meci",
        title: m.title,
        url: m.url || null,
        audience: m.audience || "all",
        group_name: m.group || null,
        date_label: m.date || null,
        club_id: getClubId(m),
      })
      .select()
      .single();
    if (error) throw error;
    return {
      id: Number(data.id),
      type: data.type || "Meci",
      title: data.title,
      url: data.url || "",
      audience: data.audience || "all",
      group: data.group_name || "",
      date: data.date_label || "",
      clubId: getClubId(data),
    };
  },
  async deleteMedia(id) {
    const { error } = await supabase.from("media_gallery").delete().eq("id", id);
    if (error) throw error;
    return true;
  },

  // --- SCOUTING PLAYERS (scouting) ---
  async getScouting() {
    const { data, error } = await supabase.from("scouting_players").select("*").order("id", { ascending: false });
    if (error) throw error;
    return (data || []).map((s) => ({
      id: Number(s.id),
      name: s.name,
      age: s.age || "",
      role: s.role || "",
      notes: s.notes || "",
      decision: s.decision || "",
      clubId: getClubId(s),
    }));
  },
  async insertScouting(s) {
    const { data, error } = await supabase
      .from("scouting_players")
      .insert({
        name: s.name,
        age: s.age || null,
        role: s.role || null,
        notes: s.notes || null,
        decision: s.decision || null,
        club_id: getClubId(s),
      })
      .select()
      .single();
    if (error) throw error;
    return {
      id: Number(data.id),
      name: data.name,
      age: data.age || "",
      role: data.role || "",
      notes: data.notes || "",
      decision: data.decision || "",
      clubId: getClubId(data),
    };
  },
  async updateScouting(s) {
    const { data, error } = await supabase
      .from("scouting_players")
      .update({
        name: s.name,
        age: s.age || null,
        role: s.role || null,
        notes: s.notes || null,
        decision: s.decision || null,
        club_id: getClubId(s),
      })
      .eq("id", s.id)
      .select()
      .single();
    if (error) throw error;
    return {
      id: Number(data.id),
      name: data.name,
      age: data.age || "",
      role: data.role || "",
      notes: data.notes || "",
      decision: data.decision || "",
      clubId: getClubId(data),
    };
  },
  async deleteScouting(id) {
    const { error } = await supabase.from("scouting_players").delete().eq("id", id);
    if (error) throw error;
    return true;
  },

  // --- SAAS MULTI-CLUB ---
  async getClubs() {
    const { data, error } = await supabase.from("clubs").select("*").order("created_at", { ascending: false });
    if (error) throw error;
    return (data || []).map((club) => ({
      id: club.id,
      name: club.name,
      logo: club.logo_url || "",
      city: club.city || "",
      country: club.country || "",
      email: club.email_contact || "",
      phone: club.phone || "",
      description: club.description || "",
      groups: club.groups || [],
      status: club.status || "active",
      blocked: Boolean(club.blocked),
      plan: club.plan_name || "Free",
      createdAt: club.created_at || "",
    }));
  },
  async insertClub(club) {
    const { data, error } = await supabase
      .from("clubs")
      .insert({
        id: club.id,
        name: club.name,
        logo_url: club.logo || null,
        city: club.city || null,
        country: club.country || null,
        email_contact: club.email || null,
        phone: club.phone || null,
        description: club.description || null,
        groups: club.groups || [],
        status: club.status || "active",
        blocked: Boolean(club.blocked),
        plan_name: club.plan || "Free",
      })
      .select()
      .single();
    if (error) throw error;
    return {
      id: data.id,
      name: data.name,
      logo: data.logo_url || "",
      city: data.city || "",
      country: data.country || "",
      email: data.email_contact || "",
      phone: data.phone || "",
      description: data.description || "",
      groups: data.groups || [],
      status: data.status || "active",
      blocked: Boolean(data.blocked),
      plan: data.plan_name || "Free",
      createdAt: data.created_at || "",
    };
  },
  async updateClub(club) {
    const { data, error } = await supabase
      .from("clubs")
      .update({
        name: club.name,
        logo_url: club.logo || null,
        city: club.city || null,
        country: club.country || null,
        email_contact: club.email || null,
        phone: club.phone || null,
        description: club.description || null,
        groups: club.groups || [],
        status: club.status || "active",
        blocked: Boolean(club.blocked),
        plan_name: club.plan || "Free",
      })
      .eq("id", club.id)
      .select()
      .single();
    if (error) throw error;
    return {
      id: data.id,
      name: data.name,
      logo: data.logo_url || "",
      city: data.city || "",
      country: data.country || "",
      email: data.email_contact || "",
      phone: data.phone || "",
      description: data.description || "",
      groups: data.groups || [],
      status: data.status || "active",
      blocked: Boolean(data.blocked),
      plan: data.plan_name || "Free",
      createdAt: data.created_at || "",
    };
  },
  async getMemberships() {
    const { data, error } = await supabase.from("club_memberships").select("*");
    if (error) throw error;
    return (data || []).map((row) => ({
      id: row.id,
      userId: row.user_id,
      clubId: row.club_id,
      role: row.role,
      assignedGroups: row.assigned_groups || [],
      playerId: row.player_id ? Number(row.player_id) : null,
      childPlayerIds: row.child_player_ids || [],
      createdAt: row.created_at || "",
    }));
  },
  async insertMembership(membership) {
    const { data, error } = await supabase
      .from("club_memberships")
      .insert({
        id: membership.id,
        user_id: membership.userId,
        club_id: membership.clubId,
        role: membership.role,
        assigned_groups: membership.assignedGroups || [],
        player_id: membership.playerId || null,
        child_player_ids: membership.childPlayerIds || [],
      })
      .select()
      .single();
    if (error) throw error;
    return {
      id: data.id,
      userId: data.user_id,
      clubId: data.club_id,
      role: data.role,
      assignedGroups: data.assigned_groups || [],
      playerId: data.player_id ? Number(data.player_id) : null,
      childPlayerIds: data.child_player_ids || [],
      createdAt: data.created_at || "",
    };
  },
  async getSubscriptions() {
    const { data, error } = await supabase.from("subscriptions").select("*").order("created_at", { ascending: false });
    if (error) throw error;
    return (data || []).map((row) => ({
      id: row.id,
      clubId: row.club_id,
      planName: row.plan_name,
      status: row.status,
      maxPlayers: row.max_players,
      startedAt: row.started_at || "",
      expiresAt: row.expires_at || "",
      createdAt: row.created_at || "",
    }));
  },
  async insertSubscription(subscription) {
    const { data, error } = await supabase
      .from("subscriptions")
      .upsert({
        id: subscription.id,
        club_id: subscription.clubId,
        plan_name: subscription.planName,
        status: subscription.status || "active",
        max_players: subscription.maxPlayers,
        started_at: toIsoDateOrNull(subscription.startedAt),
        expires_at: toIsoDateOrNull(subscription.expiresAt),
      })
      .select()
      .single();
    if (error) throw error;
    return {
      id: data.id,
      clubId: data.club_id,
      planName: data.plan_name,
      status: data.status,
      maxPlayers: data.max_players,
      startedAt: data.started_at || "",
      expiresAt: data.expires_at || "",
      createdAt: data.created_at || "",
    };
  },
  async getInvitations() {
    const { data, error } = await supabase.from("club_invitations").select("*").order("created_at", { ascending: false });
    if (error) throw error;
    return (data || []).map((row) => ({
      id: row.id,
      email: row.email,
      role: row.role,
      clubId: row.club_id,
      status: row.status,
      token: row.token,
      createdAt: row.created_at || "",
      acceptedAt: row.accepted_at || "",
    }));
  },
  async insertInvitation(invite) {
    const { data, error } = await supabase
      .from("club_invitations")
      .insert({
        id: invite.id,
        email: invite.email,
        role: invite.role,
        club_id: invite.clubId,
        status: invite.status || "pending",
        token: invite.token,
      })
      .select()
      .single();
    if (error) throw error;
    return {
      id: data.id,
      email: data.email,
      role: data.role,
      clubId: data.club_id,
      status: data.status,
      token: data.token,
      createdAt: data.created_at || "",
      acceptedAt: data.accepted_at || "",
    };
  },
  async acceptInvitation(token, membership) {
    await this.insertMembership(membership);
    const { error } = await supabase
      .from("club_invitations")
      .update({ status: "accepted", accepted_at: new Date().toISOString() })
      .eq("token", token);
    if (error) throw error;
    return true;
  },
};
