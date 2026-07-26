import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  TextInput,
  Modal,
  Platform,
  Alert
} from "react-native";
import * as LucideIcons from "lucide-react-native";
import Svg, { Circle, Rect, Line } from "react-native-svg";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabaseService } from "../services/supabaseService";
import { parseScore, resultOf, seasonSummary } from "../utils/matches";
import { suspendedPlayerIds } from "../utils/tactics";
import RoDateField from "../components/RoDateField";
import { colors as C } from "../constants/theme";

// --- Premium Palette ---
const BG_DARK = C.bg;
const CARD_BG = C.card;
const BORDER_COLOR = C.line;
const CYAN = C.cyan;
const VIOLET = C.purple;
const AMBER = C.amber;
const GREEN = C.green;
const RED = C.red;
const BLUE_ACCENT = C.blue;
const TEXT_DIM = C.muted;
const TEXT_TH = C.dim;

function notify(title, msg) {
  if (Platform.OS === "web") window.alert(`${title}\n\n${msg}`);
  else Alert.alert(title, msg);
}

const RESULT_COLORS = { V: GREEN, E: AMBER, "Î": RED };

export default function MatchesScreen({ players = [], matches = [], currentUser, clubId }) {
  const queryClient = useQueryClient();
  const [addOpen, setAddOpen] = useState(false);
  const [scoreFor, setScoreFor] = useState(null);
  const [callUpFor, setCallUpFor] = useState(null);

  const canManage = ["super_admin", "club_owner", "admin", "coach"].includes(currentUser?.role);

  const { data: tactics = [] } = useQuery({
    queryKey: ["tactics", clubId],
    queryFn: () => supabaseService.getTactics(clubId),
    enabled: !!clubId && canManage,
  });

  const { data: discipline = [] } = useQuery({
    queryKey: ["discipline", clubId],
    queryFn: () => supabaseService.getDiscipline(clubId),
    enabled: !!clubId && canManage,
  });
  const suspendedIds = useMemo(() => suspendedPlayerIds(discipline), [discipline]);

  const saveCallUps = async (match, callUps) => {
    try {
      const hadLot = Object.keys(match.callUps || {}).length > 0;
      const hasLot = Object.keys(callUps || {}).length > 0;
      await supabaseService.updateMatch({ ...match, callUps });
      setCallUpFor(null);
      queryClient.invalidateQueries({ queryKey: ["matches"] });
      // Notificare in-app când lotul e anunțat prima dată.
      if (!hadLot && hasLot) {
        try {
          await supabaseService.insertChatMessage({
            audience: "club",
            authorId: currentUser?.id,
            authorName: currentUser?.name || "Staff",
            text: `📋 Lot anunțat pentru meciul cu ${match.opponent}${match.group ? ` (${match.group})` : ""}.`,
            clubId,
          });
          queryClient.invalidateQueries({ queryKey: ["announcements"] });
        } catch (_) { /* anunțul e opțional */ }
      }
    } catch (e) {
      notify("Eroare", e.message);
    }
  };

  const saveMatch = async (form) => {
    if (!form.opponent.trim() || !form.date.trim()) {
      notify("Date incomplete", "Completează cel puțin adversarul și data meciului.");
      return;
    }
    try {
      await supabaseService.insertMatch({
        type: form.type.trim() || "Meci oficial",
        opponent: form.opponent.trim(),
        group: form.group.trim() || "Seniori",
        date: form.date.trim(),
        time: form.time.trim() || "—",
        location: form.location.trim() || "—",
        status: "Programat",
        clubId,
      });
      setAddOpen(false);
      queryClient.invalidateQueries({ queryKey: ["matches"] });
    } catch (e) {
      notify("Eroare", e.message);
    }
  };

  const saveScore = async (match, score, postNotes, scorers) => {
    if (!parseScore(score)) {
      notify("Scor invalid", "Folosește formatul „2 - 1” (golurile noastre primele).");
      return;
    }
    try {
      await supabaseService.updateMatch({ ...match, score: score.trim(), postNotes: postNotes.trim() || match.postNotes, status: "Jucat", scorers: scorers || match.scorers || {} });
      setScoreFor(null);
      queryClient.invalidateQueries({ queryKey: ["matches"] });
    } catch (e) {
      notify("Eroare", e.message);
    }
  };

  const upcoming = useMemo(
    () => matches.filter((m) => !parseScore(m.score)),
    [matches]
  );
  const played = useMemo(
    () => matches.filter((m) => parseScore(m.score)),
    [matches]
  );

  const nextMatch = upcoming[0];

  const seasonStats = useMemo(() => seasonSummary(played), [played]);

  const form = played.slice(0, 5).map((m) => resultOf(m.score));
  const lastFivePoints = form.reduce((sum, r) => sum + (r === "V" ? 3 : r === "E" ? 1 : 0), 0);

  const availability = useMemo(() => {
    const buckets = { "Disponibili": 0, "Accidentați": 0, "În recuperare": 0, "Indisponibili": 0 };
    players.forEach((p) => {
      const value = (p.status || "").toLowerCase();
      if (value.includes("accident")) buckets["Accidentați"] += 1;
      else if (value.includes("recuper")) buckets["În recuperare"] += 1;
      else if (value.includes("inactiv") || value.includes("suspend")) buckets["Indisponibili"] += 1;
      else buckets["Disponibili"] += 1;
    });
    return buckets;
  }, [players]);

  const lastMatch = played[0];

  return (
    <View style={styles.container}>
      <View style={styles.mainWrapper}>
        <ScrollView style={styles.mainScroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

          {/* Page Header */}
          <View style={styles.pageHeader}>
            <Text style={styles.pageTitle}>Meciuri</Text>
            <Text style={styles.pageSub}>Pregătește fiecare detaliu. Controlează fiecare moment.</Text>
          </View>

          {/* Row 1: Stat Cards */}
          <View style={styles.statsGrid}>
             <StatCard
               icon="Calendar"
               label="URMĂTORUL MECI"
               val={nextMatch ? `${nextMatch.date} • ${nextMatch.time}` : "—"}
               sub={nextMatch ? `${nextMatch.opponent} (${nextMatch.group})` : "Niciun meci programat"}
               competition={nextMatch?.location}
               iColor={BLUE_ACCENT}
             />
             <StatCard
               icon="LineChart"
               label={`PUNCTE ÎN ULTIMELE ${Math.max(form.length, 1)}`}
               val={form.length ? `${lastFivePoints} / ${form.length * 3}` : "—"}
               sub={form.length ? `${seasonStats.wins} Victorii • ${seasonStats.draws} Egaluri • ${seasonStats.losses} Înfrângeri` : "Fără meciuri jucate"}
               iColor={VIOLET}
             />
             <StatCard
               icon="Trophy"
               label="GOLAVERAJ"
               val={played.length ? (seasonStats.diff >= 0 ? `+${seasonStats.diff}` : String(seasonStats.diff)) : "—"}
               sub={played.length ? `${seasonStats.goalsFor} marcate • ${seasonStats.goalsAgainst} primite` : "Fără meciuri jucate"}
               iColor={CYAN}
             />
             <StatCard
               icon="Activity"
               label="FORMĂ"
               form={form.length ? form : null}
               val={form.length ? undefined : "—"}
               sub={form.length ? `Ultimele ${form.length} meciuri` : "Fără meciuri jucate"}
               iColor={GREEN}
             />
          </View>

          {/* Row 2: Quick Actions */}
          {canManage && (
            <View style={styles.actionsRow}>
               <View style={styles.actionsList}>
                  <ActionBtn icon="Plus" label="Adaugă meci" color={BLUE_ACCENT} onPress={() => setAddOpen(true)} />
               </View>
            </View>
          )}

          {/* Row 3: Main Grid */}
          <View style={styles.mainGrid}>

             {/* Left Column */}
             <View style={styles.colLeft}>
                <View style={styles.cardMain}>
                   <View style={styles.cardHeader}>
                      <Text style={styles.cardTitle}>Următoarele meciuri</Text>
                   </View>
                   {upcoming.length === 0 && (
                     <View style={styles.emptyBox}>
                        <LucideIcons.CalendarOff size={26} color={TEXT_TH} />
                        <Text style={styles.emptyText}>Niciun meci programat momentan.</Text>
                     </View>
                   )}
                   {upcoming.slice(0, 6).map((m, index) => {
                     const callCount = Object.keys(m.callUps || {}).length;
                     return (
                       <View key={m.id}>
                         <MatchLine
                           date={m.date}
                           opponent={m.opponent}
                           league={`${m.type || "Meci"} • ${m.group}`}
                           location={m.location}
                           time={m.time}
                           active={index === 0}
                         />
                         {canManage && (
                           <View style={styles.matchActions}>
                             <Pressable onPress={() => setCallUpFor(m)} style={[styles.matchActionBtn, callCount > 0 && { borderColor: CYAN + "40", backgroundColor: CYAN + "10" }]}>
                               <LucideIcons.ClipboardCheck size={12} color={callCount > 0 ? CYAN : TEXT_DIM} />
                               <Text style={[styles.matchActionText, callCount > 0 && { color: CYAN }]}>
                                 {callCount > 0 ? `Lot: ${callCount} convocați` : "Setează lotul"}
                               </Text>
                             </Pressable>
                             <Pressable onPress={() => setScoreFor(m)} style={styles.matchActionBtn}>
                               <LucideIcons.Trophy size={12} color={TEXT_DIM} />
                               <Text style={styles.matchActionText}>Scor final</Text>
                             </Pressable>
                           </View>
                         )}
                       </View>
                     );
                   })}
                </View>

                <View style={[styles.cardMain, { marginTop: 18 }]}>
                   <View style={styles.cardHeader}>
                      <Text style={styles.cardTitle}>Disponibilitate jucători</Text>
                   </View>
                   <View style={styles.availGrid}>
                      <AvailSquare label="Disponibili" count={String(availability["Disponibili"])} color={GREEN} />
                      <AvailSquare label="Accidentați" count={String(availability["Accidentați"])} color={RED} />
                      <AvailSquare label="În recuperare" count={String(availability["În recuperare"])} color={AMBER} />
                      <AvailSquare label="Indisponibili" count={String(availability["Indisponibili"])} color={VIOLET} />
                   </View>
                   <Text style={styles.availFooter}>
                     {players.length
                       ? `${availability["Disponibili"]} din ${players.length} jucători disponibili pentru următorul meci.`
                       : "Adaugă jucători în tab-ul Echipă pentru a vedea disponibilitatea."}
                   </Text>
                </View>
             </View>

             {/* Center Column */}
             <View style={styles.colCenter}>
                <View style={styles.cardMain}>
                   <View style={styles.cardHeader}>
                      <Text style={styles.cardTitle}>TEREN — VIZUALIZARE TACTICĂ</Text>
                   </View>
                   <View style={styles.pitchVisual}>
                      <FootballPitchSVG />
                   </View>
                   <Text style={styles.pitchHint}>Editorul de tactică va fi conectat într-o etapă viitoare.</Text>
                </View>

                <View style={[styles.cardMain, { marginTop: 12 }]}>
                   <View style={styles.cardHeader}>
                      <Text style={styles.cardTitle}>ULTIMUL MECI JUCAT</Text>
                   </View>
                   {lastMatch ? (
                     <>
                       <View style={styles.lastMatchHeader}>
                          <Text style={styles.teamName}>FC Autentic</Text>
                          <Text style={styles.lastScore}>{lastMatch.score}</Text>
                          <Text style={styles.teamName}>{lastMatch.opponent}</Text>
                       </View>
                       <Text style={styles.lastMatchMeta}>
                         {lastMatch.date} • {lastMatch.time} • {lastMatch.location} • {lastMatch.group}
                       </Text>
                       {!!lastMatch.postNotes && <Text style={styles.lastMatchNotes}>{lastMatch.postNotes}</Text>}
                       {!!lastMatch.stats && <Text style={styles.lastMatchNotes}>{lastMatch.stats}</Text>}
                     </>
                   ) : (
                     <View style={styles.emptyBox}>
                        <LucideIcons.Trophy size={26} color={TEXT_TH} />
                        <Text style={styles.emptyText}>Încă nu există meciuri jucate cu scor înregistrat.</Text>
                     </View>
                   )}
                </View>
             </View>

             {/* Right Column */}
             <View style={styles.colRight}>
                <View style={styles.cardSide}>
                   <View style={styles.cardHeader}>
                      <Text style={styles.cardTitle}>Rezultate recente</Text>
                   </View>
                   {played.length === 0 && (
                     <View style={styles.emptyBox}>
                        <LucideIcons.ClipboardList size={24} color={TEXT_TH} />
                        <Text style={styles.emptyText}>Rezultatele apar aici după primul meci jucat.</Text>
                     </View>
                   )}
                   {played.slice(0, 6).map((m) => {
                     const r = resultOf(m.score);
                     return (
                       <ResultRow
                         key={m.id}
                         date={m.date}
                         opponent={m.opponent}
                         score={m.score}
                         result={r}
                         color={RESULT_COLORS[r]}
                       />
                     );
                   })}
                </View>

                <View style={[styles.cardSide, { marginTop: 18 }]}>
                   <View style={styles.cardHeader}>
                      <Text style={styles.cardTitle}>BILANȚ SEZON</Text>
                   </View>
                   <SeasonLine label="Meciuri jucate" value={String(played.length)} />
                   <SeasonLine label="Victorii" value={String(seasonStats.wins)} color={GREEN} />
                   <SeasonLine label="Egaluri" value={String(seasonStats.draws)} color={AMBER} />
                   <SeasonLine label="Înfrângeri" value={String(seasonStats.losses)} color={RED} />
                   <SeasonLine label="Goluri marcate" value={String(seasonStats.goalsFor)} />
                   <SeasonLine label="Goluri primite" value={String(seasonStats.goalsAgainst)} />
                   <SeasonLine label="Golaveraj" value={played.length ? (seasonStats.diff >= 0 ? `+${seasonStats.diff}` : String(seasonStats.diff)) : "—"} color={seasonStats.diff >= 0 ? GREEN : RED} />
                </View>
             </View>
          </View>

        </ScrollView>
      </View>

      <AddMatchModal visible={addOpen} onClose={() => setAddOpen(false)} onSave={saveMatch} />
      <ScoreModal match={scoreFor} players={players} onClose={() => setScoreFor(null)} onSave={saveScore} />
      <CallUpModal match={callUpFor} players={players} tactics={tactics} suspendedIds={suspendedIds} onClose={() => setCallUpFor(null)} onSave={saveCallUps} />
    </View>
  );
}

// Convocarea la meci: statusul fiecărui jucător e „titular”, „rezerva” sau
// neconvocat (absent din obiectul callUps). Cheile sunt id-uri de jucător.
const CALLUP_CYCLE = { none: "titular", titular: "rezerva", rezerva: "none" };
const CALLUP_LABEL = { titular: "Titular", rezerva: "Rezervă", none: "—" };
const CALLUP_COLOR = { titular: GREEN, rezerva: AMBER, none: TEXT_TH };

function CallUpModal({ match, players, tactics = [], suspendedIds, onClose, onSave }) {
  const [callUps, setCallUps] = useState({});
  const [tacticsOpen, setTacticsOpen] = useState(false);
  const susp = suspendedIds || new Set();

  React.useEffect(() => {
    if (match) { setCallUps({ ...(match.callUps || {}) }); setTacticsOpen(false); }
  }, [match]);

  if (!match) return null;

  // Jucătorii din grupa meciului; dacă niciunul nu se potrivește, îi arătăm pe toți.
  const groupPlayers = players.filter((p) => p.group === match.group);
  const list = groupPlayers.length ? groupPlayers : players;

  // Preia lotul dintr-o tactică salvată: titularii din primul 11 + rezervele.
  const applyTactic = (t) => {
    const next = {};
    Object.values(t.assignments || {}).forEach((pid) => { if (pid != null && !susp.has(Number(pid))) next[String(pid)] = "titular"; });
    (t.subs || []).forEach((pid) => { if (pid != null && !susp.has(Number(pid)) && !next[String(pid)]) next[String(pid)] = "rezerva"; });
    setCallUps(next);
    setTacticsOpen(false);
  };

  const statusOf = (id) => callUps[String(id)] || "none";
  const cycle = (id) => {
    if (susp.has(Number(id))) { notify("Jucător suspendat", "Acest jucător e suspendat și nu poate fi convocat."); return; }
    const key = String(id);
    const next = CALLUP_CYCLE[statusOf(id)];
    setCallUps((prev) => {
      const copy = { ...prev };
      if (next === "none") delete copy[key];
      else copy[key] = next;
      return copy;
    });
  };

  const titulari = Object.values(callUps).filter((v) => v === "titular").length;
  const rezerve = Object.values(callUps).filter((v) => v === "rezerva").length;

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={[styles.modalCard, { maxHeight: "85%" }]}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Lot: vs {match.opponent}</Text>
            <Pressable onPress={onClose}><LucideIcons.X size={18} color={TEXT_DIM} /></Pressable>
          </View>

          <Text style={styles.callSummary}>
            {titulari} titulari • {rezerve} rezerve • grupa {match.group}
          </Text>

          {tactics.length > 0 && (
            <Pressable style={styles.importTacticBtn} onPress={() => setTacticsOpen((v) => !v)}>
              <LucideIcons.ClipboardList size={15} color={CYAN} />
              <Text style={styles.importTacticText}>Importă lotul dintr-o tactică</Text>
              <LucideIcons.ChevronDown size={15} color={CYAN} style={{ transform: [{ rotate: tacticsOpen ? "180deg" : "0deg" }] }} />
            </Pressable>
          )}
          {tacticsOpen && (
            <View style={styles.tacticsList}>
              {tactics.map((t) => (
                <Pressable key={t.id} style={styles.tacticRow} onPress={() => applyTactic(t)}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.tacticName} numberOfLines={1}>{t.name}</Text>
                    <Text style={styles.tacticMeta}>{t.formation} • {Object.keys(t.assignments || {}).length} titulari • {(t.subs || []).length} rezerve</Text>
                  </View>
                  <LucideIcons.Download size={15} color={CYAN} />
                </Pressable>
              ))}
            </View>
          )}

          {list.length === 0 ? (
            <View style={styles.emptyBox}>
              <LucideIcons.Users size={24} color={TEXT_TH} />
              <Text style={styles.emptyText}>Niciun jucător disponibil. Adaugă jucători în tab-ul Echipă.</Text>
            </View>
          ) : (
            <ScrollView style={{ maxHeight: 360 }} showsVerticalScrollIndicator={false}>
              {list.map((p) => {
                const st = statusOf(p.id);
                const isSusp = susp.has(Number(p.id));
                return (
                  <Pressable key={p.id} onPress={() => cycle(p.id)} style={[styles.callRow, isSusp && { opacity: 0.6 }]}>
                    <View style={styles.callNo}><Text style={styles.callNoText}>{p.no || "—"}</Text></View>
                    <Text style={styles.callName} numberOfLines={1}>{p.name}</Text>
                    {isSusp ? (
                      <View style={[styles.callBadge, { backgroundColor: RED + "18", borderColor: RED + "40" }]}>
                        <Text style={[styles.callBadgeText, { color: RED }]}>Suspendat</Text>
                      </View>
                    ) : (
                      <View style={[styles.callBadge, { backgroundColor: CALLUP_COLOR[st] + "18", borderColor: CALLUP_COLOR[st] + "40" }]}>
                        <Text style={[styles.callBadgeText, { color: CALLUP_COLOR[st] }]}>{CALLUP_LABEL[st]}</Text>
                      </View>
                    )}
                  </Pressable>
                );
              })}
            </ScrollView>
          )}

          <Text style={styles.callHint}>Apasă un jucător pentru a comuta: Titular → Rezervă → Neconvocat.</Text>

          <Pressable style={styles.modalSaveBtn} onPress={() => onSave(match, callUps)}>
            <LucideIcons.ClipboardCheck size={16} color="white" />
            <Text style={styles.modalSaveText}>Salvează lotul</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

function AddMatchModal({ visible, onClose, onSave }) {
  const [form, setForm] = useState({ opponent: "", group: "", date: "", time: "", location: "", type: "Meci oficial" });
  const update = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalCard}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Meci nou</Text>
            <Pressable onPress={onClose}><LucideIcons.X size={18} color={TEXT_DIM} /></Pressable>
          </View>

          <Text style={styles.modalLabel}>ADVERSAR</Text>
          <TextInput style={styles.modalInput} value={form.opponent} onChangeText={(v) => update("opponent", v)} placeholder="Ex: ACS Progresul" placeholderTextColor={TEXT_TH} />

          <View style={{ flexDirection: "row", gap: 10 }}>
            <View style={{ flex: 1 }}>
              <Text style={styles.modalLabel}>DATA</Text>
              <RoDateField value={form.date} onChange={(v) => update("date", v)} placeholder="Alege data" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.modalLabel}>ORA</Text>
              <TextInput style={styles.modalInput} value={form.time} onChangeText={(v) => update("time", v)} placeholder="11:00" placeholderTextColor={TEXT_TH} />
            </View>
          </View>

          <View style={{ flexDirection: "row", gap: 10 }}>
            <View style={{ flex: 1 }}>
              <Text style={styles.modalLabel}>GRUPA</Text>
              <TextInput style={styles.modalInput} value={form.group} onChangeText={(v) => update("group", v)} placeholder="U16" placeholderTextColor={TEXT_TH} />
            </View>
            <View style={{ flex: 2 }}>
              <Text style={styles.modalLabel}>LOCAȚIE</Text>
              <TextInput style={styles.modalInput} value={form.location} onChangeText={(v) => update("location", v)} placeholder="Stadionul Central" placeholderTextColor={TEXT_TH} />
            </View>
          </View>

          <Text style={styles.modalLabel}>TIP MECI</Text>
          <View style={{ flexDirection: "row", gap: 8, marginBottom: 16 }}>
            {["Meci oficial", "Amical", "Turneu"].map((t) => (
              <Pressable key={t} onPress={() => update("type", t)} style={[styles.smallChip, form.type === t && { borderColor: CYAN, backgroundColor: CYAN + "10" }]}>
                <Text style={[styles.smallChipText, form.type === t && { color: CYAN }]}>{t}</Text>
              </Pressable>
            ))}
          </View>

          <Pressable style={styles.modalSaveBtn} onPress={() => onSave(form)}>
            <LucideIcons.Plus size={16} color="white" />
            <Text style={styles.modalSaveText}>Salvează meciul</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

function ScoreModal({ match, players = [], onClose, onSave }) {
  const [score, setScore] = useState("");
  const [notes, setNotes] = useState("");
  const [scorers, setScorers] = useState({});

  React.useEffect(() => {
    if (match) { setScore(match.score || ""); setNotes(""); setScorers({ ...(match.scorers || {}) }); }
  }, [match]);

  if (!match) return null;

  // Jucătorii convocați la meci (titulari + rezerve), pentru marcarea golurilor.
  const calledUp = players.filter((p) => {
    const st = (match.callUps || {})[String(p.id)];
    return st === "titular" || st === "rezerva";
  });
  const goalsOf = (id) => Number(scorers[String(id)] || 0);
  const bump = (id, delta) => {
    setScorers((prev) => {
      const key = String(id);
      const val = Math.max(0, (Number(prev[key]) || 0) + delta);
      const copy = { ...prev };
      if (val === 0) delete copy[key]; else copy[key] = val;
      return copy;
    });
  };
  const totalGoals = Object.values(scorers).reduce((s, v) => s + Number(v || 0), 0);

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={[styles.modalCard, { maxHeight: "88%" }]}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Scor final: vs {match.opponent}</Text>
            <Pressable onPress={onClose}><LucideIcons.X size={18} color={TEXT_DIM} /></Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            <Text style={styles.modalLabel}>SCOR (NOI - EI)</Text>
            <TextInput style={styles.modalInput} value={score} onChangeText={setScore} placeholder="2 - 1" placeholderTextColor={TEXT_TH} />

            <View style={styles.scorersHead}>
              <Text style={styles.modalLabel}>MARCATORI</Text>
              <Text style={styles.scorersTotal}>{totalGoals} {totalGoals === 1 ? "gol" : "goluri"}</Text>
            </View>
            {calledUp.length === 0 ? (
              <Text style={styles.scorersHint}>Setează întâi lotul (butonul „Lot”) ca să poți marca golurile pe jucători.</Text>
            ) : (
              calledUp.map((p) => {
                const g = goalsOf(p.id);
                return (
                  <View key={p.id} style={styles.scorerRow}>
                    <View style={styles.callNo}><Text style={styles.callNoText}>{p.no || "—"}</Text></View>
                    <Text style={styles.callName} numberOfLines={1}>{p.name}</Text>
                    <View style={styles.stepper}>
                      <Pressable onPress={() => bump(p.id, -1)} style={styles.stepBtn}><Text style={styles.stepTxt}>−</Text></Pressable>
                      <Text style={[styles.stepVal, g > 0 && { color: CYAN }]}>{g}</Text>
                      <Pressable onPress={() => bump(p.id, 1)} style={styles.stepBtn}><Text style={styles.stepTxt}>+</Text></Pressable>
                    </View>
                  </View>
                );
              })
            )}

            <Text style={[styles.modalLabel, { marginTop: 12 }]}>OBSERVAȚII (OPȚIONAL)</Text>
            <TextInput
              style={[styles.modalInput, { height: 70, textAlignVertical: "top", paddingTop: 10 }]}
              value={notes}
              onChangeText={setNotes}
              placeholder="Cum a decurs meciul..."
              placeholderTextColor={TEXT_TH}
              multiline
            />

            <Pressable style={styles.modalSaveBtn} onPress={() => onSave(match, score, notes, scorers)}>
              <LucideIcons.Trophy size={16} color="white" />
              <Text style={styles.modalSaveText}>Înregistrează rezultatul</Text>
            </Pressable>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

// --- Sub-Components ---

const StatCard = ({ icon, label, val, sub, competition, form, iColor }) => {
  const Icon = LucideIcons[icon] || LucideIcons.Circle;
  return (
    <View style={styles.statCard}>
       <View style={styles.statContent}>
          <View style={[styles.statIconWrap, { backgroundColor: iColor + "10", borderColor: iColor + "30" }]}>
             <Icon size={18} color={iColor} />
          </View>
          <View style={{ marginLeft: 14, flex: 1 }}>
             <Text style={styles.statLabel}>{label}</Text>
             {val !== undefined && <Text style={styles.statVal} numberOfLines={1}>{val}</Text>}
          </View>
       </View>
       <View style={styles.statFooter}>
          <View style={{ flex: 1 }}>
             <Text style={styles.statSub} numberOfLines={1}>{sub}</Text>
             {!!competition && <Text style={styles.statComp} numberOfLines={1}>{competition}</Text>}
          </View>
          {form && (
             <View style={styles.formRow}>
                {form.map((res, i) => (
                   <View key={i} style={[styles.formCircle, { backgroundColor: RESULT_COLORS[res] }]}>
                     <Text style={styles.formText}>{res}</Text>
                   </View>
                ))}
             </View>
          )}
       </View>
    </View>
  );
};

const ActionBtn = ({ icon, label, color, onPress }) => {
  const Icon = LucideIcons[icon] || LucideIcons.Circle;
  return (
    <Pressable onPress={onPress || (() => notify("În lucru", `${label} va fi conectat în următoarea etapă.`))} style={styles.actionBtn}>
       <Icon size={14} color={color} />
       <Text style={styles.actionBtnText}>{label}</Text>
    </Pressable>
  );
};

const MatchLine = ({ date, opponent, league, location, time, active }) => (
  <View style={[styles.matchLine, active && styles.matchLineActive]}>
     <View style={styles.miniLogo}><LucideIcons.Shield size={12} color="white" /></View>
     <View style={{ flex: 1, marginLeft: 10 }}>
        <Text style={[styles.matchOpponent, active && { color: 'white' }]} numberOfLines={1}>{opponent}</Text>
        <Text style={styles.matchLeague} numberOfLines={1}>{league}</Text>
     </View>
     <View style={{ alignItems: 'flex-end' }}>
        <Text style={[styles.matchLoc, active && { color: CYAN }]} numberOfLines={1}>{date}</Text>
        <Text style={[styles.matchTime, active && { color: 'white' }]}>{time} • {location}</Text>
     </View>
  </View>
);

const AvailSquare = ({ label, count, color }) => (
  <View style={[styles.availSquare, { backgroundColor: color + "08", borderColor: color + "20" }]}>
     <Text style={[styles.availCount, { color }]}>{count}</Text>
     <Text style={styles.availLabel}>{label}</Text>
     <View style={styles.availIcon}><LucideIcons.User size={10} color={color} /></View>
  </View>
);

const ResultRow = ({ date, opponent, score, result, color }) => (
  <View style={styles.resultRow}>
     <Text style={styles.resultDate} numberOfLines={1}>{date}</Text>
     <View style={styles.teamsRow}>
        <Text style={styles.teamRes} numberOfLines={1}>{opponent}</Text>
        <Text style={styles.scoreRes}>{score}</Text>
     </View>
     <View style={[styles.resCircle, { backgroundColor: color }]}><Text style={styles.resCircleText}>{result}</Text></View>
  </View>
);

const SeasonLine = ({ label, value, color }) => (
  <View style={styles.seasonLine}>
     <Text style={styles.seasonLabel}>{label}</Text>
     <Text style={[styles.seasonValue, color && { color }]}>{value}</Text>
  </View>
);

// --- SVG ---

const FootballPitchSVG = () => (
  <Svg width="100%" height="220" viewBox="0 0 400 240">
     <Rect x="0" y="0" width="400" height="240" fill="#0B3A2B" rx="10" />
     <Rect x="0" y="0" width="400" height="240" fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="1" />
     <Line x1="200" y1="0" x2="200" y2="240" stroke="rgba(255,255,255,0.12)" strokeWidth="1" />
     <Circle cx="200" cy="120" r="40" stroke="rgba(255,255,255,0.12)" strokeWidth="1" fill="none" />
     <Rect x="0" y="60" width="60" height="120" stroke="rgba(255,255,255,0.12)" strokeWidth="1" fill="none" />
     <Rect x="340" y="60" width="60" height="120" stroke="rgba(255,255,255,0.12)" strokeWidth="1" fill="none" />

     {/* Formație generică 4-3-3 */}
     <Circle cx="30" cy="120" r="8" fill={GREEN} />
     {[45, 95, 145, 195].map((y) => <Circle key={`d${y}`} cx="100" cy={y + 25} r="8" fill={BLUE_ACCENT} />)}
     {[70, 120, 170].map((y) => <Circle key={`m${y}`} cx="200" cy={y} r="8" fill={BLUE_ACCENT} />)}
     {[60, 120, 180].map((y) => <Circle key={`a${y}`} cx="310" cy={y} r="8" fill={VIOLET} />)}
  </Svg>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG_DARK },
  mainWrapper: { flex: 1 },
  mainScroll: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 50 },

  pageHeader: { marginBottom: 25 },
  pageTitle: { color: 'white', fontSize: 24, fontWeight: '900', letterSpacing: -0.5 },
  pageSub: { color: TEXT_DIM, fontSize: 12, fontWeight: '600', marginTop: 3 },

  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 20 },
  statCard: { flexBasis: 220, flexGrow: 1, backgroundColor: CARD_BG, borderRadius: 14, padding: 12, minHeight: 95, borderWidth: 1, borderColor: BORDER_COLOR },
  statContent: { flexDirection: 'row', alignItems: 'center' },
  statIconWrap: { width: 32, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  statLabel: { color: TEXT_DIM, fontSize: 8.5, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 0.8 },
  statVal: { color: 'white', fontSize: 12, fontWeight: '900', marginTop: 3 },
  statFooter: { marginTop: 10, flex: 1, justifyContent: 'flex-end', flexDirection: 'row', alignItems: 'flex-end' },
  statSub: { color: TEXT_TH, fontSize: 8.5, fontWeight: '700' },
  statComp: { color: TEXT_TH, fontSize: 8, fontWeight: '600', marginTop: 1 },
  formRow: { flexDirection: 'row', gap: 3 },
  formCircle: { width: 16, height: 16, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  formText: { color: BG_DARK, fontSize: 8, fontWeight: '900' },

  actionsRow: { marginBottom: 25 },
  actionsList: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, alignItems: 'center' },
  actionBtn: { flexGrow: 1, height: 38, borderRadius: 9, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 12, gap: 8, borderWidth: 1, borderColor: "rgba(0, 212, 255, 0.12)" },
  actionBtnText: { color: 'white', fontSize: 10.5, fontWeight: '800' },

  mainGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 16 },
  colLeft: { flexBasis: 260, flexGrow: 1.2 },
  colCenter: { flexBasis: 340, flexGrow: 2.2 },
  colRight: { flexBasis: 260, flexGrow: 1.5 },

  cardMain: { backgroundColor: CARD_BG, borderRadius: 18, padding: 16, borderWidth: 1, borderColor: BORDER_COLOR, marginBottom: 12 },
  cardSide: { backgroundColor: CARD_BG, borderRadius: 18, padding: 16, borderWidth: 1, borderColor: BORDER_COLOR },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  cardTitle: { color: 'white', fontSize: 12.5, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 0.8 },

  emptyBox: { alignItems: 'center', gap: 10, paddingVertical: 24, paddingHorizontal: 10 },
  emptyText: { color: TEXT_DIM, fontSize: 11, fontWeight: '600', textAlign: 'center', lineHeight: 17 },

  matchLine: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.03)" },
  matchLineActive: { backgroundColor: BLUE_ACCENT + "08", borderBottomColor: BLUE_ACCENT + "15" },
  miniLogo: { width: 20, height: 20, backgroundColor: "rgba(255,255,255,0.05)", borderRadius: 5, alignItems: 'center', justifyContent: 'center' },
  matchOpponent: { color: TEXT_DIM, fontSize: 10.5, fontWeight: '800' },
  matchLeague: { color: TEXT_TH, fontSize: 8.5, fontWeight: '600', marginTop: 1 },
  matchLoc: { color: TEXT_TH, fontSize: 8.5, fontWeight: '800' },
  matchTime: { color: TEXT_TH, fontSize: 9, fontWeight: '700', marginTop: 1 },

  availGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 },
  availSquare: { flexBasis: '45%', flexGrow: 1, padding: 10, borderRadius: 12, borderWidth: 1, position: 'relative' },
  availCount: { fontSize: 16, fontWeight: '900' },
  availLabel: { fontSize: 9, fontWeight: '700', color: TEXT_DIM, marginTop: 1 },
  availIcon: { position: 'absolute', top: 10, right: 10, opacity: 0.3 },
  availFooter: { color: TEXT_TH, fontSize: 8.5, fontWeight: '600', marginTop: 12 },

  pitchVisual: { borderRadius: 8, overflow: 'hidden' },
  pitchHint: { color: TEXT_TH, fontSize: 8.5, fontWeight: '600', marginTop: 10 },

  lastMatchHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  teamName: { flex: 1, color: TEXT_DIM, fontSize: 10, fontWeight: '800', textAlign: 'center' },
  lastScore: { color: 'white', fontSize: 16, fontWeight: '900' },
  lastMatchMeta: { color: TEXT_TH, fontSize: 9, fontWeight: '700', textAlign: 'center', marginBottom: 8 },
  lastMatchNotes: { color: TEXT_DIM, fontSize: 10, fontWeight: '600', lineHeight: 15, marginTop: 4 },

  resultRow: { flexDirection: 'row', alignItems: 'center', minHeight: 44, borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.03)" },
  resultDate: { color: TEXT_TH, fontSize: 8.5, fontWeight: '700', width: 55 },
  teamsRow: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6 },
  teamRes: { flex: 1, color: TEXT_DIM, fontSize: 9.5, fontWeight: '800' },
  scoreRes: { color: 'white', fontSize: 10, fontWeight: '900', minWidth: 34, textAlign: 'center' },
  resCircle: { width: 16, height: 16, borderRadius: 8, alignItems: 'center', justifyContent: 'center', marginLeft: 8 },
  resCircleText: { color: BG_DARK, fontSize: 8, fontWeight: '900' },

  seasonLine: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.03)" },
  seasonLabel: { color: TEXT_DIM, fontSize: 10, fontWeight: '700' },
  seasonValue: { color: 'white', fontSize: 11, fontWeight: '900' },
  tapHint: { color: TEXT_TH, fontSize: 8.5, fontWeight: '600', marginTop: 10 },

  matchActions: { flexDirection: 'row', gap: 8, paddingVertical: 8, paddingLeft: 30, borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.03)" },
  matchActionBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, height: 28, borderRadius: 8, borderWidth: 1, borderColor: "rgba(255,255,255,0.08)" },
  matchActionText: { color: TEXT_DIM, fontSize: 9.5, fontWeight: '800' },

  callSummary: { color: TEXT_DIM, fontSize: 10.5, fontWeight: '700', marginBottom: 12 },
  importTacticBtn: { flexDirection: "row", alignItems: "center", gap: 8, height: 42, paddingHorizontal: 12, borderRadius: 12, borderWidth: 1, borderColor: CYAN + "35", backgroundColor: CYAN + "0E", marginBottom: 10 },
  importTacticText: { color: CYAN, fontSize: 12, fontWeight: "900", flex: 1 },
  tacticsList: { marginBottom: 12, gap: 6 },
  tacticRow: { flexDirection: "row", alignItems: "center", gap: 10, padding: 12, borderRadius: 10, borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", backgroundColor: C.bgSecondary },
  tacticName: { color: "white", fontSize: 12.5, fontWeight: "800" },
  tacticMeta: { color: TEXT_DIM, fontSize: 10, fontWeight: "700", marginTop: 2 },
  callRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 9, borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.03)" },
  callNo: { width: 26, height: 26, borderRadius: 8, backgroundColor: "rgba(255,255,255,0.05)", alignItems: 'center', justifyContent: 'center' },
  callNoText: { color: TEXT_DIM, fontSize: 10, fontWeight: '900' },
  callName: { flex: 1, marginLeft: 10, color: 'white', fontSize: 12, fontWeight: '700' },
  callBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, borderWidth: 1, minWidth: 68, alignItems: 'center' },
  callBadgeText: { fontSize: 9.5, fontWeight: '900' },
  scorersHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  scorersTotal: { color: CYAN, fontSize: 10.5, fontWeight: '900' },
  scorersHint: { color: TEXT_TH, fontSize: 11, fontWeight: '600', marginBottom: 8, lineHeight: 15 },
  scorerRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 7, borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.03)" },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  stepBtn: { width: 28, height: 28, borderRadius: 8, backgroundColor: "rgba(255,255,255,0.06)", alignItems: 'center', justifyContent: 'center' },
  stepTxt: { color: 'white', fontSize: 17, fontWeight: '900' },
  stepVal: { color: TEXT_DIM, fontSize: 14, fontWeight: '900', width: 20, textAlign: 'center' },
  callHint: { color: TEXT_TH, fontSize: 8.5, fontWeight: '600', marginTop: 10, marginBottom: 12 },

  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.72)", alignItems: 'center', justifyContent: 'center', padding: 20 },
  modalCard: { width: '100%', maxWidth: 460, backgroundColor: C.card, borderRadius: 18, padding: 20, borderWidth: 1, borderColor: BORDER_COLOR },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  modalTitle: { color: 'white', fontSize: 15, fontWeight: '900' },
  modalLabel: { color: TEXT_DIM, fontSize: 9, fontWeight: '900', letterSpacing: 1, marginBottom: 6, marginTop: 4 },
  modalInput: { backgroundColor: C.bgSecondary, borderWidth: 1, borderColor: C.line, color: 'white', borderRadius: 10, paddingHorizontal: 12, height: 42, fontSize: 12, fontWeight: '600', marginBottom: 12 },
  smallChip: { flex: 1, height: 36, borderRadius: 10, borderWidth: 1, borderColor: "rgba(255,255,255,0.1)", alignItems: 'center', justifyContent: 'center' },
  smallChipText: { color: TEXT_DIM, fontSize: 9.5, fontWeight: '900' },
  modalSaveBtn: { height: 46, borderRadius: 12, backgroundColor: BLUE_ACCENT, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  modalSaveText: { color: 'white', fontSize: 12, fontWeight: '900' },
});
