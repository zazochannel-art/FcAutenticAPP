import { supabase } from "./supabaseClient";

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
      type: d.type || "",
      status: d.status || "",
      expires: d.expires || "",
      fileUrl: d.file_url || "",
    }));
  },
  async insertDocument(doc) {
    const { data, error } = await supabase
      .from("documents")
      .insert({
        title: doc.title,
        owner: doc.owner || null,
        type: doc.type || null,
        status: doc.status || null,
        expires: doc.expires || null,
        file_url: doc.fileUrl || null,
      })
      .select()
      .single();
    if (error) throw error;
    return {
      id: Number(data.id),
      title: data.title,
      owner: data.owner || "",
      type: data.type || "",
      status: data.status || "",
      expires: data.expires || "",
      fileUrl: data.file_url || "",
    };
  },
  async updateDocument(doc) {
    const { data, error } = await supabase
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
    return {
      id: Number(data.id),
      title: data.title,
      owner: data.owner || "",
      type: data.type || "",
      status: data.status || "",
      expires: data.expires || "",
      fileUrl: data.file_url || "",
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
    }));
  },
  async insertChatMessage(msg) {
    const { data, error } = await supabase
      .from("chat_messages")
      .insert({
        audience: msg.audience,
        author_name: msg.author,
        text: msg.text,
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
      date: m.date_label || "",
    }));
  },
  async insertMedia(m) {
    const { data, error } = await supabase
      .from("media_gallery")
      .insert({
        type: m.type || "Meci",
        title: m.title,
        url: m.url || null,
        date_label: m.date || null,
      })
      .select()
      .single();
    if (error) throw error;
    return {
      id: Number(data.id),
      type: data.type || "Meci",
      title: data.title,
      url: data.url || "",
      date: data.date_label || "",
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
    };
  },
  async deleteScouting(id) {
    const { error } = await supabase.from("scouting_players").delete().eq("id", id);
    if (error) throw error;
    return true;
  },
};
