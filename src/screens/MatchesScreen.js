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
import { colors as C, themedStyles, layout } from "../constants/theme";
import { useTopClearance } from "../hooks/useTopClearance";
import { useTranslation } from "../i18n";

// Tipul meciului se salvează mereu cu eticheta românească, ca datele să rămână
// aceleași indiferent de limba în care a fost creat meciul. Afișarea trece prin
// dicționar; valorile vechi sau scrise de mână se arată așa cum sunt.
const MATCH_TYPES = [["Meci oficial", "official"], ["Amical", "friendly"], ["Turneu", "tournament"]];
const matchTypeKey = (value) => (MATCH_TYPES.find(([ro]) => ro === value) || [])[1];

// --- Premium Palette ---

function notify(title, msg) {
  if (Platform.OS === "web") window.alert(`${title}\n\n${msg}`);
  else Alert.alert(title, msg);
}

const RESULT_COLORS_ = () => ({ V: C.green, E: C.amber, "Î": C.red });

export default function MatchesScreen({ players = [], matches = [], currentUser, clubId, selectedClub }) {
  const { t } = useTranslation();
  const topClearance = useTopClearance();
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
      notify(t('common.error'), e.message);
    }
  };

  const saveMatch = async (form) => {
    if (!form.opponent.trim() || !form.date.trim()) {
      notify(t('common.incompleteData'), t('match.add.required'));
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
      notify(t('common.error'), e.message);
    }
  };

  const saveScore = async (match, score, postNotes, scorers) => {
    if (!parseScore(score)) {
      notify(t('match.score.invalidTitle'), t('match.score.invalidMsg'));
      return;
    }
    try {
      await supabaseService.updateMatch({ ...match, score: score.trim(), postNotes: postNotes.trim() || match.postNotes, status: "Jucat", scorers: scorers || match.scorers || {} });
      setScoreFor(null);
      queryClient.invalidateQueries({ queryKey: ["matches"] });
    } catch (e) {
      notify(t('common.error'), e.message);
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
        <ScrollView style={styles.mainScroll} contentContainerStyle={[styles.scrollContent, topClearance]} showsVerticalScrollIndicator={false}>

          {/* Page Header */}
          <View style={styles.pageHeader}>
            <Text style={styles.pageTitle}>{t('match.title')}</Text>
            <Text style={styles.pageSub}>{t('match.subtitle')}</Text>
          </View>

          {/* Row 1: Stat Cards */}
          <View style={styles.statsGrid}>
             <StatCard
               icon="Calendar"
               label={t('match.stat.next')}
               val={nextMatch ? `${nextMatch.date} • ${nextMatch.time}` : "—"}
               sub={nextMatch ? `${nextMatch.opponent} (${nextMatch.group})` : t('match.stat.noneScheduled')}
               competition={nextMatch?.location}
               iColor={C.blue}
             />
             <StatCard
               icon="LineChart"
               label={t('match.stat.pointsLast', { n: Math.max(form.length, 1) })}
               val={form.length ? `${lastFivePoints} / ${form.length * 3}` : "—"}
               sub={form.length ? t('match.stat.record', { wins: seasonStats.wins, draws: seasonStats.draws, losses: seasonStats.losses }) : t('match.stat.noPlayed')}
               iColor={C.purple}
             />
             <StatCard
               icon="Trophy"
               label={t('match.stat.goalDiff')}
               val={played.length ? (seasonStats.diff >= 0 ? `+${seasonStats.diff}` : String(seasonStats.diff)) : "—"}
               sub={played.length ? t('match.stat.goals', { scored: seasonStats.goalsFor, conceded: seasonStats.goalsAgainst }) : t('match.stat.noPlayed')}
               iColor={C.cyan}
             />
             <StatCard
               icon="Activity"
               label={t('match.stat.form')}
               form={form.length ? form : null}
               val={form.length ? undefined : "—"}
               sub={form.length ? t('match.stat.lastN', { n: form.length }) : t('match.stat.noPlayed')}
               iColor={C.green}
             />
          </View>

          {/* Row 2: Quick Actions */}
          {canManage && (
            <View style={styles.actionsRow}>
               <View style={styles.actionsList}>
                  <ActionBtn icon="Plus" label={t('match.action.add')} color={C.blue} onPress={() => setAddOpen(true)} />
               </View>
            </View>
          )}

          {/* Row 3: Main Grid */}
          <View style={styles.mainGrid}>

             {/* Left Column */}
             <View style={styles.colLeft}>
                <View style={styles.cardMain}>
                   <View style={styles.cardHeader}>
                      <Text style={styles.cardTitle}>{t('match.upcoming')}</Text>
                   </View>
                   {upcoming.length === 0 && (
                     <View style={styles.emptyBox}>
                        <LucideIcons.CalendarOff size={26} color={C.dim} />
                        <Text style={styles.emptyText}>{t('match.empty.upcoming')}</Text>
                     </View>
                   )}
                   {upcoming.slice(0, 6).map((m, index) => {
                     const callCount = Object.keys(m.callUps || {}).length;
                     return (
                       <View key={m.id}>
                         <MatchLine
                           date={m.date}
                           opponent={m.opponent}
                           league={`${matchTypeKey(m.type) ? t(`match.type.${matchTypeKey(m.type)}`) : (m.type || t('match.defaultType'))} • ${m.group}`}
                           location={m.location}
                           time={m.time}
                           active={index === 0}
                         />
                         {canManage && (
                           <View style={styles.matchActions}>
                             <Pressable onPress={() => setCallUpFor(m)} style={[styles.matchActionBtn, callCount > 0 && { borderColor: C.cyan + "40", backgroundColor: C.cyan + "10" }]}>
                               <LucideIcons.ClipboardCheck size={12} color={callCount > 0 ? C.cyan : C.muted} />
                               <Text style={[styles.matchActionText, callCount > 0 && { color: C.cyan }]}>
                                 {callCount > 0 ? t('match.squadSet', { count: callCount }) : t('match.setSquad')}
                               </Text>
                             </Pressable>
                             <Pressable onPress={() => setScoreFor(m)} style={styles.matchActionBtn}>
                               <LucideIcons.Trophy size={12} color={C.muted} />
                               <Text style={styles.matchActionText}>{t('match.finalScore')}</Text>
                             </Pressable>
                           </View>
                         )}
                       </View>
                     );
                   })}
                </View>

                <View style={[styles.cardMain, { marginTop: 18 }]}>
                   <View style={styles.cardHeader}>
                      <Text style={styles.cardTitle}>{t('match.availability')}</Text>
                   </View>
                   <View style={styles.availGrid}>
                      <AvailSquare label={t('match.avail.available')} count={String(availability["Disponibili"])} color={C.green} />
                      <AvailSquare label={t('match.avail.injured')} count={String(availability["Accidentați"])} color={C.red} />
                      <AvailSquare label={t('match.avail.recovering')} count={String(availability["În recuperare"])} color={C.amber} />
                      <AvailSquare label={t('match.avail.unavailable')} count={String(availability["Indisponibili"])} color={C.purple} />
                   </View>
                   <Text style={styles.availFooter}>
                     {players.length
                       ? t('match.availFooter', { count: availability["Disponibili"], total: players.length })
                       : t('match.availEmpty')}
                   </Text>
                </View>
             </View>

             {/* Center Column */}
             <View style={styles.colCenter}>
                <View style={styles.cardMain}>
                   <View style={styles.cardHeader}>
                      <Text style={styles.cardTitle}>{t('match.pitch')}</Text>
                   </View>
                   <View style={styles.pitchVisual}>
                      <FootballPitchSVG />
                   </View>
                   <Text style={styles.pitchHint}>{t('match.pitchHint')}</Text>
                </View>

                <View style={[styles.cardMain, { marginTop: 12 }]}>
                   <View style={styles.cardHeader}>
                      <Text style={styles.cardTitle}>{t('match.lastPlayed')}</Text>
                   </View>
                   {lastMatch ? (
                     <>
                       <View style={styles.lastMatchHeader}>
                          <Text style={styles.teamName}>{selectedClub?.name || "—"}</Text>
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
                        <LucideIcons.Trophy size={26} color={C.dim} />
                        <Text style={styles.emptyText}>{t('match.empty.lastPlayed')}</Text>
                     </View>
                   )}
                </View>
             </View>

             {/* Right Column */}
             <View style={styles.colRight}>
                <View style={styles.cardSide}>
                   <View style={styles.cardHeader}>
                      <Text style={styles.cardTitle}>{t('match.recentResults')}</Text>
                   </View>
                   {played.length === 0 && (
                     <View style={styles.emptyBox}>
                        <LucideIcons.ClipboardList size={24} color={C.dim} />
                        <Text style={styles.emptyText}>{t('match.empty.results')}</Text>
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
                         result={t(`match.res.${r}`)}
                         color={RESULT_COLORS_()[r]}
                       />
                     );
                   })}
                </View>

                <View style={[styles.cardSide, { marginTop: 18 }]}>
                   <View style={styles.cardHeader}>
                      <Text style={styles.cardTitle}>{t('match.season')}</Text>
                   </View>
                   <SeasonLine label={t('match.season.played')} value={String(played.length)} />
                   <SeasonLine label={t('match.season.wins')} value={String(seasonStats.wins)} color={C.green} />
                   <SeasonLine label={t('match.season.draws')} value={String(seasonStats.draws)} color={C.amber} />
                   <SeasonLine label={t('match.season.losses')} value={String(seasonStats.losses)} color={C.red} />
                   <SeasonLine label={t('match.season.goalsFor')} value={String(seasonStats.goalsFor)} />
                   <SeasonLine label={t('match.season.goalsAgainst')} value={String(seasonStats.goalsAgainst)} />
                   <SeasonLine label={t('match.season.diff')} value={played.length ? (seasonStats.diff >= 0 ? `+${seasonStats.diff}` : String(seasonStats.diff)) : "—"} color={seasonStats.diff >= 0 ? C.green : C.red} />
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
const CALLUP_LABEL_KEY = { titular: "match.callup.starter", rezerva: "match.callup.sub" };
const CALLUP_COLOR_ = () => ({ titular: C.green, rezerva: C.amber, none: C.dim });

function CallUpModal({ match, players, tactics = [], suspendedIds, onClose, onSave }) {
  const { t } = useTranslation();
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
    if (susp.has(Number(id))) { notify(t('match.callup.suspendedTitle'), t('match.callup.suspendedMsg')); return; }
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
            <Text style={styles.modalTitle}>{t('match.callup.title', { opponent: match.opponent })}</Text>
            <Pressable onPress={onClose}><LucideIcons.X size={18} color={C.muted} /></Pressable>
          </View>

          <Text style={styles.callSummary}>
            {t('match.callup.summary', { starters: titulari, subs: rezerve, group: match.group })}
          </Text>

          {tactics.length > 0 && (
            <Pressable style={styles.importTacticBtn} onPress={() => setTacticsOpen((v) => !v)}>
              <LucideIcons.ClipboardList size={15} color={C.cyan} />
              <Text style={styles.importTacticText}>{t('match.callup.import')}</Text>
              <LucideIcons.ChevronDown size={15} color={C.cyan} style={{ transform: [{ rotate: tacticsOpen ? "180deg" : "0deg" }] }} />
            </Pressable>
          )}
          {tacticsOpen && (
            <View style={styles.tacticsList}>
              {/* `tx`, nu `t`: altfel ar umbri funcția de traducere. */}
              {tactics.map((tx) => (
                <Pressable key={tx.id} style={styles.tacticRow} onPress={() => applyTactic(tx)}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.tacticName} numberOfLines={1}>{tx.name}</Text>
                    <Text style={styles.tacticMeta}>
                      {t('match.callup.tacticMeta', {
                        formation: tx.formation,
                        starters: Object.keys(tx.assignments || {}).length,
                        subs: (tx.subs || []).length,
                      })}
                    </Text>
                  </View>
                  <LucideIcons.Download size={15} color={C.cyan} />
                </Pressable>
              ))}
            </View>
          )}

          {list.length === 0 ? (
            <View style={styles.emptyBox}>
              <LucideIcons.Users size={24} color={C.dim} />
              <Text style={styles.emptyText}>{t('match.callup.empty')}</Text>
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
                      <View style={[styles.callBadge, { backgroundColor: C.red + "18", borderColor: C.red + "40" }]}>
                        <Text style={[styles.callBadgeText, { color: C.red }]}>{t('match.callup.suspended')}</Text>
                      </View>
                    ) : (
                      <View style={[styles.callBadge, { backgroundColor: CALLUP_COLOR_()[st] + "18", borderColor: CALLUP_COLOR_()[st] + "40" }]}>
                        <Text style={[styles.callBadgeText, { color: CALLUP_COLOR_()[st] }]}>{CALLUP_LABEL_KEY[st] ? t(CALLUP_LABEL_KEY[st]) : "—"}</Text>
                      </View>
                    )}
                  </Pressable>
                );
              })}
            </ScrollView>
          )}

          <Text style={styles.callHint}>{t('match.callup.hint')}</Text>

          <Pressable style={styles.modalSaveBtn} onPress={() => onSave(match, callUps)}>
            <LucideIcons.ClipboardCheck size={16} color="white" />
            <Text style={styles.modalSaveText}>{t('match.callup.save')}</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

function AddMatchModal({ visible, onClose, onSave }) {
  const { t } = useTranslation();
  const [form, setForm] = useState({ opponent: "", group: "", date: "", time: "", location: "", type: "Meci oficial" });
  const update = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalCard}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{t('match.add.title')}</Text>
            <Pressable onPress={onClose}><LucideIcons.X size={18} color={C.muted} /></Pressable>
          </View>

          <Text style={styles.modalLabel}>{t('match.add.opponent')}</Text>
          <TextInput style={styles.modalInput} value={form.opponent} onChangeText={(v) => update("opponent", v)} placeholder={t('match.add.opponentHint')} placeholderTextColor={C.dim} />

          <View style={{ flexDirection: "row", gap: 10 }}>
            <View style={{ flex: 1 }}>
              <Text style={styles.modalLabel}>{t('match.add.date')}</Text>
              <RoDateField value={form.date} onChange={(v) => update("date", v)} placeholder={t('match.add.dateHint')} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.modalLabel}>{t('match.add.time')}</Text>
              <TextInput style={styles.modalInput} value={form.time} onChangeText={(v) => update("time", v)} placeholder="11:00" placeholderTextColor={C.dim} />
            </View>
          </View>

          <View style={{ flexDirection: "row", gap: 10 }}>
            <View style={{ flex: 1 }}>
              <Text style={styles.modalLabel}>{t('match.add.group')}</Text>
              <TextInput style={styles.modalInput} value={form.group} onChangeText={(v) => update("group", v)} placeholder="U16" placeholderTextColor={C.dim} />
            </View>
            <View style={{ flex: 2 }}>
              <Text style={styles.modalLabel}>{t('match.add.location')}</Text>
              <TextInput style={styles.modalInput} value={form.location} onChangeText={(v) => update("location", v)} placeholder={t('match.add.locationHint')} placeholderTextColor={C.dim} />
            </View>
          </View>

          <Text style={styles.modalLabel}>{t('match.add.type')}</Text>
          <View style={{ flexDirection: "row", gap: 8, marginBottom: 16 }}>
            {MATCH_TYPES.map(([value, key]) => (
              <Pressable key={key} onPress={() => update("type", value)} style={[styles.smallChip, form.type === value && { borderColor: C.cyan, backgroundColor: C.cyan + "10" }]}>
                <Text style={[styles.smallChipText, form.type === value && { color: C.cyan }]}>{t(`match.type.${key}`)}</Text>
              </Pressable>
            ))}
          </View>

          <Pressable style={styles.modalSaveBtn} onPress={() => onSave(form)}>
            <LucideIcons.Plus size={16} color="white" />
            <Text style={styles.modalSaveText}>{t('match.add.save')}</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

function ScoreModal({ match, players = [], onClose, onSave }) {
  const { t } = useTranslation();
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
            <Text style={styles.modalTitle}>{t('match.score.title', { opponent: match.opponent })}</Text>
            <Pressable onPress={onClose}><LucideIcons.X size={18} color={C.muted} /></Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            <Text style={styles.modalLabel}>{t('match.score.label')}</Text>
            <TextInput style={styles.modalInput} value={score} onChangeText={setScore} placeholder="2 - 1" placeholderTextColor={C.dim} />

            <View style={styles.scorersHead}>
              <Text style={styles.modalLabel}>{t('match.score.scorers')}</Text>
              <Text style={styles.scorersTotal}>{totalGoals} {totalGoals === 1 ? t('match.score.goal') : t('match.score.goals')}</Text>
            </View>
            {calledUp.length === 0 ? (
              <Text style={styles.scorersHint}>{t('match.score.hint')}</Text>
            ) : (
              calledUp.map((p) => {
                const g = goalsOf(p.id);
                return (
                  <View key={p.id} style={styles.scorerRow}>
                    <View style={styles.callNo}><Text style={styles.callNoText}>{p.no || "—"}</Text></View>
                    <Text style={styles.callName} numberOfLines={1}>{p.name}</Text>
                    <View style={styles.stepper}>
                      <Pressable onPress={() => bump(p.id, -1)} style={styles.stepBtn}><Text style={styles.stepTxt}>−</Text></Pressable>
                      <Text style={[styles.stepVal, g > 0 && { color: C.cyan }]}>{g}</Text>
                      <Pressable onPress={() => bump(p.id, 1)} style={styles.stepBtn}><Text style={styles.stepTxt}>+</Text></Pressable>
                    </View>
                  </View>
                );
              })
            )}

            <Text style={[styles.modalLabel, { marginTop: 12 }]}>{t('match.score.notes')}</Text>
            <TextInput
              style={[styles.modalInput, { height: 70, textAlignVertical: "top", paddingTop: 10 }]}
              value={notes}
              onChangeText={setNotes}
              placeholder={t('match.score.notesHint')}
              placeholderTextColor={C.dim}
              multiline
            />

            <Pressable style={styles.modalSaveBtn} onPress={() => onSave(match, score, notes, scorers)}>
              <LucideIcons.Trophy size={16} color="white" />
              <Text style={styles.modalSaveText}>{t('match.score.save')}</Text>
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
                   <View key={i} style={[styles.formCircle, { backgroundColor: RESULT_COLORS_()[res] }]}>
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
  const { t } = useTranslation();
  const Icon = LucideIcons[icon] || LucideIcons.Circle;
  return (
    <Pressable onPress={onPress || (() => notify(t('common.wip'), t('common.wipMsg', { label })))} style={styles.actionBtn}>
       <Icon size={14} color={color} />
       <Text style={styles.actionBtnText}>{label}</Text>
    </Pressable>
  );
};

const MatchLine = ({ date, opponent, league, location, time, active }) => (
  <View style={[styles.matchLine, active && styles.matchLineActive]}>
     <View style={styles.miniLogo}><LucideIcons.Shield size={12} color="white" /></View>
     <View style={{ flex: 1, marginLeft: 10 }}>
        <Text style={[styles.matchOpponent, active && { color: C.text }]} numberOfLines={1}>{opponent}</Text>
        <Text style={styles.matchLeague} numberOfLines={1}>{league}</Text>
     </View>
     <View style={{ alignItems: 'flex-end' }}>
        <Text style={[styles.matchLoc, active && { color: C.cyan }]} numberOfLines={1}>{date}</Text>
        <Text style={[styles.matchTime, active && { color: C.text }]}>{time} • {location}</Text>
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
     <Circle cx="30" cy="120" r="8" fill={C.green} />
     {[45, 95, 145, 195].map((y) => <Circle key={`d${y}`} cx="100" cy={y + 25} r="8" fill={C.blue} />)}
     {[70, 120, 170].map((y) => <Circle key={`m${y}`} cx="200" cy={y} r="8" fill={C.blue} />)}
     {[60, 120, 180].map((y) => <Circle key={`a${y}`} cx="310" cy={y} r="8" fill={C.purple} />)}
  </Svg>
);

const styles = themedStyles((C) => StyleSheet.create({
  container: { flex: 1, backgroundColor: "transparent" },
  mainWrapper: { flex: 1 },
  mainScroll: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: layout.navClearance },

  pageHeader: { marginBottom: 25 },
  pageTitle: { color: C.text, fontSize: 24, fontWeight: '900', letterSpacing: -0.5 },
  pageSub: { color: C.muted, fontSize: 12, fontWeight: '600', marginTop: 3 },

  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 20 },
  // Vezi nota din TeamScreen: la 220 intra un singur card pe rând pe telefon.
  statCard: { flexBasis: 150, flexGrow: 1, backgroundColor: C.card, borderRadius: 14, padding: 11, minHeight: 88, borderWidth: 1, borderColor: C.line },
  statContent: { flexDirection: 'row', alignItems: 'center' },
  statIconWrap: { width: 32, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  statLabel: { color: C.muted, fontSize: 8.5, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 0.8 },
  statVal: { color: C.text, fontSize: 12, fontWeight: '900', marginTop: 3 },
  statFooter: { marginTop: 10, flex: 1, justifyContent: 'flex-end', flexDirection: 'row', alignItems: 'flex-end' },
  statSub: { color: C.dim, fontSize: 8.5, fontWeight: '700' },
  statComp: { color: C.dim, fontSize: 8, fontWeight: '600', marginTop: 1 },
  formRow: { flexDirection: 'row', gap: 3 },
  formCircle: { width: 16, height: 16, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  formText: { color: C.bg, fontSize: 8, fontWeight: '900' },

  actionsRow: { marginBottom: 25 },
  actionsList: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, alignItems: 'center' },
  actionBtn: { flexGrow: 1, height: 38, borderRadius: 9, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 12, gap: 8, borderWidth: 1, borderColor: C.cyan + "1F" },
  actionBtnText: { color: C.text, fontSize: 10.5, fontWeight: '800' },

  mainGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 16 },
  colLeft: { flexBasis: 260, flexGrow: 1.2 },
  colCenter: { flexBasis: 340, flexGrow: 2.2 },
  colRight: { flexBasis: 260, flexGrow: 1.5 },

  cardMain: { backgroundColor: C.card, borderRadius: 18, padding: 16, borderWidth: 1, borderColor: C.line, marginBottom: 12 },
  cardSide: { backgroundColor: C.card, borderRadius: 18, padding: 16, borderWidth: 1, borderColor: C.line },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  cardTitle: { color: C.text, fontSize: 12.5, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 0.8 },

  emptyBox: { alignItems: 'center', gap: 10, paddingVertical: 24, paddingHorizontal: 10 },
  emptyText: { color: C.muted, fontSize: 11, fontWeight: '600', textAlign: 'center', lineHeight: 17 },

  matchLine: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: C.line },
  matchLineActive: { backgroundColor: C.blue + "08", borderBottomColor: C.blue + "15" },
  miniLogo: { width: 20, height: 20, backgroundColor: C.fill3, borderRadius: 5, alignItems: 'center', justifyContent: 'center' },
  matchOpponent: { color: C.muted, fontSize: 10.5, fontWeight: '800' },
  matchLeague: { color: C.dim, fontSize: 8.5, fontWeight: '600', marginTop: 1 },
  matchLoc: { color: C.dim, fontSize: 8.5, fontWeight: '800' },
  matchTime: { color: C.dim, fontSize: 9, fontWeight: '700', marginTop: 1 },

  availGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 },
  availSquare: { flexBasis: '45%', flexGrow: 1, padding: 10, borderRadius: 12, borderWidth: 1, position: 'relative' },
  availCount: { fontSize: 16, fontWeight: '900' },
  availLabel: { fontSize: 9, fontWeight: '700', color: C.muted, marginTop: 1 },
  availIcon: { position: 'absolute', top: 10, right: 10, opacity: 0.3 },
  availFooter: { color: C.dim, fontSize: 8.5, fontWeight: '600', marginTop: 12 },

  pitchVisual: { borderRadius: 8, overflow: 'hidden' },
  pitchHint: { color: C.dim, fontSize: 8.5, fontWeight: '600', marginTop: 10 },

  lastMatchHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  teamName: { flex: 1, color: C.muted, fontSize: 10, fontWeight: '800', textAlign: 'center' },
  lastScore: { color: C.text, fontSize: 16, fontWeight: '900' },
  lastMatchMeta: { color: C.dim, fontSize: 9, fontWeight: '700', textAlign: 'center', marginBottom: 8 },
  lastMatchNotes: { color: C.muted, fontSize: 10, fontWeight: '600', lineHeight: 15, marginTop: 4 },

  resultRow: { flexDirection: 'row', alignItems: 'center', minHeight: 58, paddingHorizontal: 12, marginBottom: 6, borderRadius: 14, backgroundColor: C.fill1, borderWidth: 1, borderColor: C.line },
  resultDate: { color: C.dim, fontSize: 8.5, fontWeight: '700', width: 55 },
  teamsRow: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6 },
  teamRes: { flex: 1, color: C.muted, fontSize: 9.5, fontWeight: '800' },
  scoreRes: { color: C.text, fontSize: 10, fontWeight: '900', minWidth: 34, textAlign: 'center' },
  resCircle: { width: 16, height: 16, borderRadius: 8, alignItems: 'center', justifyContent: 'center', marginLeft: 8 },
  resCircleText: { color: C.bg, fontSize: 8, fontWeight: '900' },

  seasonLine: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: C.line },
  seasonLabel: { color: C.muted, fontSize: 10, fontWeight: '700' },
  seasonValue: { color: C.text, fontSize: 11, fontWeight: '900' },
  tapHint: { color: C.dim, fontSize: 8.5, fontWeight: '600', marginTop: 10 },

  matchActions: { flexDirection: 'row', gap: 8, paddingVertical: 8, paddingLeft: 30, borderBottomWidth: 1, borderBottomColor: C.line },
  matchActionBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, height: 28, borderRadius: 8, borderWidth: 1, borderColor: C.line },
  matchActionText: { color: C.muted, fontSize: 9.5, fontWeight: '800' },

  callSummary: { color: C.muted, fontSize: 10.5, fontWeight: '700', marginBottom: 12 },
  importTacticBtn: { flexDirection: "row", alignItems: "center", gap: 8, height: 42, paddingHorizontal: 12, borderRadius: 12, borderWidth: 1, borderColor: C.cyan + "35", backgroundColor: C.cyan + "0E", marginBottom: 10 },
  importTacticText: { color: C.cyan, fontSize: 12, fontWeight: "900", flex: 1 },
  tacticsList: { marginBottom: 12, gap: 6 },
  tacticRow: { flexDirection: "row", alignItems: "center", gap: 10, padding: 12, borderRadius: 10, borderWidth: 1, borderColor: C.line, backgroundColor: C.bgSecondary },
  tacticName: { color: C.text, fontSize: 12.5, fontWeight: "800" },
  tacticMeta: { color: C.muted, fontSize: 10, fontWeight: "700", marginTop: 2 },
  callRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 11, paddingHorizontal: 4, borderBottomWidth: 1, borderBottomColor: C.line },
  callNo: { width: 26, height: 26, borderRadius: 8, backgroundColor: C.fill3, alignItems: 'center', justifyContent: 'center' },
  callNoText: { color: C.muted, fontSize: 10, fontWeight: '900' },
  callName: { flex: 1, marginLeft: 10, color: C.text, fontSize: 12, fontWeight: '700' },
  callBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, borderWidth: 1, minWidth: 68, alignItems: 'center' },
  callBadgeText: { fontSize: 9.5, fontWeight: '900' },
  scorersHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  scorersTotal: { color: C.cyan, fontSize: 10.5, fontWeight: '900' },
  scorersHint: { color: C.dim, fontSize: 11, fontWeight: '600', marginBottom: 8, lineHeight: 15 },
  scorerRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 9, paddingHorizontal: 4, borderBottomWidth: 1, borderBottomColor: C.line },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  stepBtn: { width: 28, height: 28, borderRadius: 8, backgroundColor: C.fill2, alignItems: 'center', justifyContent: 'center' },
  stepTxt: { color: C.text, fontSize: 17, fontWeight: '900' },
  stepVal: { color: C.muted, fontSize: 14, fontWeight: '900', width: 20, textAlign: 'center' },
  callHint: { color: C.dim, fontSize: 8.5, fontWeight: '600', marginTop: 10, marginBottom: 12 },

  modalOverlay: { flex: 1, backgroundColor: C.isDark ? "rgba(0,0,0,0.72)" : "rgba(9,9,11,0.45)", alignItems: 'center', justifyContent: 'center', padding: 20 },
  modalCard: { width: '100%', maxWidth: 460, backgroundColor: C.card, borderRadius: 18, padding: 20, borderWidth: 1, borderColor: C.line },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  modalTitle: { color: C.text, fontSize: 15, fontWeight: '900' },
  modalLabel: { color: C.muted, fontSize: 9, fontWeight: '900', letterSpacing: 1, marginBottom: 6, marginTop: 4 },
  modalInput: { backgroundColor: C.bgSecondary, borderWidth: 1, borderColor: C.line, color: C.text, borderRadius: 10, paddingHorizontal: 12, height: 42, fontSize: 12, fontWeight: '600', marginBottom: 12 },
  smallChip: { flex: 1, height: 36, borderRadius: 10, borderWidth: 1, borderColor: C.lineStrong, alignItems: 'center', justifyContent: 'center' },
  smallChipText: { color: C.muted, fontSize: 9.5, fontWeight: '900' },
  modalSaveBtn: { height: 46, borderRadius: 12, backgroundColor: C.blue, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  modalSaveText: { color: C.text, fontSize: 12, fontWeight: '900' },
}));
