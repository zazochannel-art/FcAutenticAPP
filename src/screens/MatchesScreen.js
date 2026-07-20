import React, { useMemo } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  Platform,
  Alert
} from "react-native";
import * as LucideIcons from "lucide-react-native";
import Svg, { Circle, Rect, Line } from "react-native-svg";

// --- Premium Palette ---
const BG_DARK = "#020812";
const CARD_BG = "rgba(4, 18, 32, 0.78)";
const BORDER_COLOR = "rgba(0, 212, 255, 0.12)";
const CYAN = "#00D4FF";
const VIOLET = "#7C3AED";
const AMBER = "#FACC15";
const GREEN = "#22C55E";
const RED = "#EF4444";
const BLUE_ACCENT = "#0D8BFF";
const TEXT_DIM = "#94A3B8";
const TEXT_TH = "#475569";

function notify(title, msg) {
  if (Platform.OS === "web") window.alert(`${title}\n\n${msg}`);
  else Alert.alert(title, msg);
}

// Scorul este text liber ("2 - 1"); îl interpretăm ca "noi - ei".
function parseScore(score) {
  const match = String(score || "").match(/(\d+)\s*[-:]\s*(\d+)/);
  if (!match) return null;
  return { ours: Number(match[1]), theirs: Number(match[2]) };
}

function resultOf(score) {
  const parsed = parseScore(score);
  if (!parsed) return null;
  if (parsed.ours > parsed.theirs) return "V";
  if (parsed.ours < parsed.theirs) return "Î";
  return "E";
}

const RESULT_COLORS = { V: GREEN, E: AMBER, "Î": RED };

export default function MatchesScreen({ players = [], matches = [], currentUser, openNotifications }) {
  const upcoming = useMemo(
    () => matches.filter((m) => !parseScore(m.score)),
    [matches]
  );
  const played = useMemo(
    () => matches.filter((m) => parseScore(m.score)),
    [matches]
  );

  const nextMatch = upcoming[0];

  const seasonStats = useMemo(() => {
    let wins = 0, draws = 0, losses = 0, goalsFor = 0, goalsAgainst = 0;
    played.forEach((m) => {
      const s = parseScore(m.score);
      goalsFor += s.ours;
      goalsAgainst += s.theirs;
      if (s.ours > s.theirs) wins += 1;
      else if (s.ours < s.theirs) losses += 1;
      else draws += 1;
    });
    return { wins, draws, losses, goalsFor, goalsAgainst, diff: goalsFor - goalsAgainst };
  }, [played]);

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
          <View style={styles.actionsRow}>
             <View style={styles.actionsList}>
                <ActionBtn icon="Plus" label="Adaugă meci" color={BLUE_ACCENT} />
                <ActionBtn icon="Users" label="Setează lot" color={BLUE_ACCENT} />
                <ActionBtn icon="Send" label="Trimite convocare" color={BLUE_ACCENT} />
             </View>
          </View>

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
                   {upcoming.slice(0, 6).map((m, index) => (
                     <MatchLine
                       key={m.id}
                       date={m.date}
                       opponent={m.opponent}
                       league={`${m.type || "Meci"} • ${m.group}`}
                       location={m.location}
                       time={m.time}
                       active={index === 0}
                     />
                   ))}
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
    </View>
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
});
