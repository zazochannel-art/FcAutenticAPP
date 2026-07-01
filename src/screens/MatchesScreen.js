import React from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  TextInput,
  useWindowDimensions,
  Platform,
  Dimensions,
  Image
} from "react-native";
import * as LucideIcons from "lucide-react-native";
import Svg, { Path, Circle, Rect, G, Line, Defs, LinearGradient, Stop } from "react-native-svg";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

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

export default function MatchesScreen() {
  const { width } = useWindowDimensions();

  return (
    <View style={styles.container}>
      <View style={styles.mainWrapper}>
        <ScrollView style={styles.mainScroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

          {/* Page Header */}
          <View style={styles.pageHeader}>
            <View style={styles.pageTitleContainer}>
              <Text style={styles.pageTitle}>Meciuri</Text>
              <Text style={styles.pageSub}>Pregătește fiecare detaliu. Controlează fiecare moment.</Text>
            </View>
          </View>

          {/* Row 1: Stat Cards */}
          <View style={styles.statsGrid}>
             <StatCard icon="Calendar" label="URMĂTORUL MECI" val="Sâm. 31 Mai • 18:00" sub="ACS Mediaș (A)" competition="Liga 3, Seria 4 — Etapa 25" iColor={BLUE_ACCENT} />
             <StatCard icon="LineChart" label="PUNCTE ÎN ULTIMELE 5" val="10 / 15" sub="3 Victorii • 1 Egal • 1 Înfrângere" chart iColor={VIOLET} />
             <StatCard icon="Trophy" label="GOLAVERAJ" val="+18" sub="48 marcate • 30 primite" iColor={CYAN} />
             <StatCard icon="Activity" label="FORMĂ" form={['V', 'V', 'E', 'V', 'Î']} sub="Ultimele 5 meciuri" iColor={GREEN} />
             <StatCard icon="ShieldAlert" label="DISCIPLINĂ" val="14" val2="1" sub="Cartonașe galbene" sub2="Cartonaș roșu" iColor={RED} />
          </View>

          {/* Row 2: Quick Actions */}
          <View style={styles.actionsRow}>
             <View style={styles.actionsList}>
                <ActionBtn icon="Plus" label="Adaugă meci" color={BLUE_ACCENT} outline />
                <ActionBtn icon="Users" label="Setează lot" color={BLUE_ACCENT} outline />
                <ActionBtn icon="Send" label="Trimite convocare" color={BLUE_ACCENT} outline />
                <ActionBtn icon="Dumbbell" label="Pregătește tactica" color={BLUE_ACCENT} outline />
                <Pressable style={styles.moreBtn}><LucideIcons.MoreHorizontal size={20} color={TEXT_TH} /></Pressable>
             </View>
          </View>

          {/* Row 3: Main Grid (3 Columns) */}
          <View style={styles.mainGrid}>

             {/* Left Column */}
             <View style={styles.colLeft}>
                <View style={styles.cardMain}>
                   <View style={styles.cardHeader}>
                      <Text style={styles.cardTitle}>Următoarele meciuri</Text>
                      <Text style={styles.sideLink}>Vezi calendar</Text>
                   </View>
                   <MatchLine date="31 MAI" opponent="ACS Mediaș" league="Liga 3, Seria 4" location="(A)" time="18:00" active />
                   <MatchLine date="07 IUN" opponent="Unirea Bistrița" league="Liga 3, Seria 4" location="(H)" time="11:00" />
                   <MatchLine date="14 IUN" opponent="Viitorul Dăești" league="Liga 3, Seria 4" location="(A)" time="17:00" />
                   <MatchLine date="21 IUN" opponent="CSM Rm. Sărat" league="Liga 3, Seria 4" location="(H)" time="18:00" />
                   <MatchLine date="28 IUN" opponent="Flacăra Moreni" league="Liga 3, Seria 4" location="(A)" time="17:30" />
                </View>

                <View style={[styles.cardMain, { marginTop: 18 }]}>
                   <View style={styles.cardHeader}>
                      <Text style={styles.cardTitle}>Disponibilitate jucători</Text>
                      <Text style={styles.sideLink}>Vezi detalii</Text>
                   </View>
                   <View style={styles.availGrid}>
                      <AvailSquare label="Disponibili" count="18" color={GREEN} />
                      <AvailSquare label="Ușoară" count="2" color={AMBER} />
                      <AvailSquare label="Indisponibili" count="1" color={RED} />
                      <AvailSquare label="Suspendați" count="1" color={VIOLET} />
                   </View>
                   <Text style={styles.availFooter}>Lot aproape complet pentru următorul meci.</Text>
                </View>
             </View>

             {/* Center Column */}
             <View style={styles.colCenter}>
                <View style={styles.cardMain}>
                   <View style={styles.cardHeader}>
                      <Text style={styles.cardTitle}>TACTICĂ: 4-2-3-1 LAȚĂ — POSESIE</Text>
                      <Text style={styles.sideLink}>Editare tactică</Text>
                   </View>
                   <View style={styles.pitchArea}>
                      <View style={styles.pitchVisual}>
                         <FootballPitchSVG />
                      </View>
                      <View style={styles.pitchSidebar}>
                         <Text style={styles.sidebarLabel}>STIL DE JOC</Text>
                         <Text style={styles.sidebarVal}>Posesie</Text>
                         <Text style={[styles.sidebarLabel, { marginTop: 14 }]}>MENTALITATE</Text>
                         <Text style={styles.sidebarVal}>Echilibrată</Text>

                         <View style={styles.tacticalInstructions}>
                            <View style={styles.instrHeader}><LucideIcons.ArrowUp size={12} color={BLUE_ACCENT} /><Text style={styles.instrTitle}>CU FAZĂ</Text></View>
                            <Text style={styles.instrText}>• Construcție din spate</Text>
                            <Text style={styles.instrText}>• Pase scurte</Text>
                            <Text style={styles.instrText}>• Lățime mare</Text>

                            <View style={[styles.instrHeader, { marginTop: 12 }]}><LucideIcons.ArrowDown size={12} color={VIOLET} /><Text style={styles.instrTitle}>FĂRĂ FAZĂ</Text></View>
                            <Text style={styles.instrText}>• Presiune medie</Text>
                            <Text style={styles.instrText}>• Bloc mediu</Text>
                            <Text style={styles.instrText}>• Acoperire pe flancuri</Text>
                         </View>
                         <Pressable style={styles.detailBtn}><Text style={styles.detailBtnText}>Instrucțiuni detaliate</Text></Pressable>
                      </View>
                   </View>
                </View>

                <View style={styles.bottomInnerRow}>
                   <View style={styles.cardMainHalf}>
                      <Text style={[styles.cardTitle, { marginBottom: 16 }]}>Obiective meci</Text>
                      <ObjectiveLine label="Câștigă meciul" done />
                      <ObjectiveLine label="Nu primi gol" done />
                      <ObjectiveLine label="Peste 55% posesie" done />
                      <ObjectiveLine label="Minim 10 șuturi" />
                      <View style={styles.targetIconWrap}><LucideIcons.Target size={44} color={TEXT_TH + "20"} /></View>
                   </View>
                   <View style={styles.cardMainHalf}>
                      <View style={styles.cardHeader}>
                         <Text style={styles.cardTitle}>Analiză rapidă — ULTIMUL MECI</Text>
                      </View>
                      <View style={styles.lastMatchHeader}>
                         <Text style={styles.teamName}>FC Autentic</Text>
                         <Text style={styles.lastScore}>2 - 1</Text>
                         <Text style={styles.teamName}>Unirea Alba Iulia</Text>
                      </View>
                      <StatComparison label="Posesie" p1="57%" p2="43%" per={0.57} />
                      <StatComparison label="Șuturi" p1="13" p2="8" per={0.62} />
                      <StatComparison label="Șuturi pe poartă" p1="5" p2="3" per={0.6} />
                      <StatComparison label="xG" p1="2.1" p2="1.3" per={0.61} />
                      <Pressable style={styles.fullAnalysisLink}><Text style={styles.fullAnalysisText}>Vezi analiza completă</Text></Pressable>
                   </View>
                </View>
             </View>

             {/* Right Column */}
             <View style={styles.colRight}>
                <View style={styles.cardSide}>
                   <View style={styles.cardHeader}>
                      <Text style={styles.cardTitle}>Lot convocat (20)</Text>
                      <Text style={styles.sideLink}>Vezi tot</Text>
                   </View>
                   <SquadRow num="1" pos="GK" name="C. Stroie" status="Disponibil" sColor={GREEN} />
                   <SquadRow num="2" pos="RB" name="A. Pascu" status="Disponibil" sColor={GREEN} />
                   <SquadRow num="4" pos="CB" name="M. Enache" status="Disponibil" sColor={GREEN} />
                   <SquadRow num="5" pos="CB" name="R. Ionescu" status="Disponibil" sColor={GREEN} />
                   <SquadRow num="3" pos="LB" name="D. Rusu" status="Ușoară" sColor={AMBER} />
                   <SquadRow num="6" pos="DM" name="A. Măcel" status="Disponibil" sColor={GREEN} />

                   <View style={styles.squadLegend}>
                      <View style={styles.legItem}><View style={[styles.legDot, { backgroundColor: GREEN }]} /><Text style={styles.legText}>Disponibil</Text></View>
                      <View style={styles.legItem}><View style={[styles.legDot, { backgroundColor: AMBER }]} /><Text style={styles.legText}>Ușoară</Text></View>
                      <View style={styles.legItem}><View style={[styles.legDot, { backgroundColor: RED }]} /><Text style={styles.legText}>Indisponibil</Text></View>
                      <Text style={styles.fullSquadLink}>Vezi lotul complet ›</Text>
                   </View>
                </View>

                <View style={[styles.cardSide, { marginTop: 18 }]}>
                   <View style={styles.cardHeader}>
                      <Text style={styles.cardTitle}>CLASAMENT LIGA 3, SERIA 4</Text>
                      <Text style={styles.sideLink}>Vezi tot</Text>
                   </View>
                   <View style={styles.leagueHeader}>
                      <Text style={[styles.th, { width: 25 }]}>#</Text>
                      <Text style={[styles.th, { flex: 1, textAlign: 'left' }]}>ECHIPĂ</Text>
                      <Text style={[styles.th, { width: 20 }]}>M</Text>
                      <Text style={[styles.th, { width: 20 }]}>V</Text>
                      <Text style={[styles.th, { width: 20 }]}>E</Text>
                      <Text style={[styles.th, { width: 20 }]}>Î</Text>
                      <Text style={[styles.th, { width: 25 }]}>DG</Text>
                      <Text style={[styles.th, { width: 25 }]}>PCT</Text>
                   </View>
                   <LeagueRow pos="1" name="CSM Slatina" m="24" v="17" e="4" i="3" dg="+26" pct="55" />
                   <LeagueRow pos="2" name="Unirea Alba Iulia" m="24" v="15" e="5" i="4" dg="+20" pct="50" />
                   <LeagueRow pos="3" name="FC Autentic" m="24" v="14" e="6" i="4" dg="+18" pct="48" active />
                   <LeagueRow pos="4" name="ACS Mediaș" m="24" v="13" e="5" i="6" dg="+8" pct="44" />
                   <LeagueRow pos="5" name="Flacăra Moreni" m="24" v="12" e="6" i="6" dg="+7" pct="42" />
                   <Pressable style={styles.fullLeagueBtn}><LucideIcons.Plus size={14} color={BLUE_ACCENT} /><Text style={styles.fullLeagueText}>Vezi clasamentul complet</Text></Pressable>
                </View>

                <View style={[styles.cardSide, { marginTop: 18 }]}>
                   <View style={styles.cardHeader}>
                      <Text style={styles.cardTitle}>Rezultate recente</Text>
                      <Text style={styles.sideLink}>Vezi tot</Text>
                   </View>
                   <ResultRow date="24/05" home="FC Autentic" score="2 - 1" away="Unirea Alba Iulia" result="V" color={GREEN} />
                   <ResultRow date="17/05" home="CSM Slatina" score="1 - 2" away="FC Autentic" result="V" color={GREEN} />
                   <ResultRow date="10/05" home="Flacăra Moreni" score="2 - 2" away="FC Autentic" result="E" color={AMBER} />
                   <ResultRow date="03/05" home="Viitorul Dăești" score="1 - 0" away="FC Autentic" result="Î" color={RED} />
                   <ResultRow date="26/04" home="ACS Mediaș" score="1 - 1" away="FC Autentic" result="E" color={AMBER} />
                </View>
             </View>
          </View>

          <View style={styles.updateFooter}>
             <LucideIcons.Clock size={12} color={TEXT_TH} />
             <Text style={styles.updateText}>Ultima actualizare: 23 mai 2026, 10:30</Text>
          </View>

        </ScrollView>
      </View>
    </View>
  );
}

// --- Sub-Components ---

const StatCard = ({ icon, label, val, val2, sub, sub2, competition, trend, chart, form, iColor }) => {
  const Icon = LucideIcons[icon] || LucideIcons.Circle;
  return (
    <View style={styles.statCard}>
       <View style={styles.statContent}>
          <View style={[styles.statIconWrap, { backgroundColor: iColor + "10", borderColor: iColor + "30" }]}>
             <Icon size={18} color={iColor} />
          </View>
          <View style={{ marginLeft: 14, flex: 1 }}>
             <Text style={styles.statLabel}>{label}</Text>
             <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 10 }}>
                <Text style={styles.statVal}>{val}</Text>
                {val2 && <Text style={styles.statVal}>{val2}</Text>}
             </View>
          </View>
       </View>
       <View style={styles.statFooter}>
          <View style={{ flex: 1 }}>
             <Text style={styles.statSub}>{sub}</Text>
             {sub2 && <Text style={[styles.statSub, { marginTop: 1 }]}>{sub2}</Text>}
             {competition && <Text style={styles.statComp}>{competition}</Text>}
          </View>
          {trend && <Text style={styles.statTrend}>{trend}</Text>}
          {chart && <View style={styles.miniChart}><MiniLineChart color={VIOLET} /></View>}
          {form && (
             <View style={styles.formRow}>
                {form.map((res, i) => (
                   <View key={i} style={[styles.formCircle, { backgroundColor: res === 'V' ? GREEN : res === 'E' ? AMBER : RED }]}><Text style={styles.formText}>{res}</Text></View>
                ))}
             </View>
          )}
       </View>
    </View>
  );
};

const ActionBtn = ({ icon, label, color }) => {
  const Icon = LucideIcons[icon];
  return (
    <View style={styles.actionBtn}>
       <Icon size={14} color={color} />
       <Text style={styles.actionBtnText}>{label}</Text>
    </View>
  );
};

const MatchLine = ({ date, opponent, league, location, time, active }) => (
  <View style={[styles.matchLine, active && styles.matchLineActive]}>
     <View style={styles.matchDateBox}>
        <Text style={[styles.matchDayNum, active && { color: 'white' }]}>{date.split(' ')[0]}</Text>
        <Text style={[styles.matchMonth, active && { color: CYAN }]}>{date.split(' ')[1]}</Text>
     </View>
     <View style={styles.miniLogo}><LucideIcons.Shield size={12} color="white" /></View>
     <View style={{ flex: 1, marginLeft: 10 }}>
        <Text style={[styles.matchOpponent, active && { color: 'white' }]}>{opponent}</Text>
        <Text style={styles.matchLeague}>{league}</Text>
     </View>
     <View style={{ alignItems: 'flex-end' }}>
        <Text style={[styles.matchLoc, active && { color: CYAN }]}>{location}</Text>
        <Text style={[styles.matchTime, active && { color: 'white' }]}>{time}</Text>
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

const ObjectiveLine = ({ label, done }) => (
  <View style={styles.objLine}>
     {done ? <LucideIcons.CheckCircle2 size={14} color={GREEN} /> : <LucideIcons.Circle size={14} color={TEXT_TH} />}
     <Text style={[styles.objText, done && { color: 'white' }]}>{label}</Text>
  </View>
);

const StatComparison = ({ label, p1, p2, per }) => (
  <View style={styles.compRow}>
     <View style={styles.compLabels}>
        <Text style={styles.compVal}>{p1}</Text>
        <Text style={styles.compTitle}>{label}</Text>
        <Text style={styles.compVal}>{p2}</Text>
     </View>
     <View style={styles.compBarBg}>
        <View style={[styles.compBarFill, { width: `${per * 100}%`, backgroundColor: BLUE_ACCENT }]} />
     </View>
  </View>
);

const SquadRow = ({ num, pos, name, status, sColor }) => (
  <View style={styles.squadRow}>
     <Text style={styles.squadNum}>{num}</Text>
     <View style={styles.miniAvatarSquad}><LucideIcons.User size={10} color="white" /></View>
     <Text style={styles.squadName}>{name}</Text>
     <Text style={styles.squadPos}>{pos}</Text>
     <View style={[styles.legDot, { backgroundColor: sColor, marginLeft: 12 }]} />
     <Text style={[styles.squadStatus, { color: sColor }]}>{status}</Text>
  </View>
);

const LeagueRow = ({ pos, name, m, v, e, i, dg, pct, active }) => (
  <View style={[styles.leagueRow, active && styles.leagueRowActive]}>
     <Text style={[styles.rowMainText, { width: 25, textAlign: 'center' }]}>{pos}</Text>
     <View style={styles.miniLogoLeague}><LucideIcons.Shield size={10} color="white" /></View>
     <Text style={[styles.rowMainText, { flex: 1, marginLeft: 8 }, active && { color: CYAN }]}>{name}</Text>
     <Text style={[styles.rowSubText, { width: 20, textAlign: 'center' }]}>{m}</Text>
     <Text style={[styles.rowSubText, { width: 20, textAlign: 'center' }]}>{v}</Text>
     <Text style={[styles.rowSubText, { width: 20, textAlign: 'center' }]}>{e}</Text>
     <Text style={[styles.rowSubText, { width: 20, textAlign: 'center' }]}>{i}</Text>
     <Text style={[styles.rowMainText, { width: 25, textAlign: 'center' }]}>{dg}</Text>
     <Text style={[styles.rowMainText, { width: 25, textAlign: 'center', fontWeight: '900' }]}>{pct}</Text>
  </View>
);

const ResultRow = ({ date, home, score, away, result, color }) => (
  <View style={styles.resultRow}>
     <Text style={styles.resultDate}>{date}</Text>
     <View style={styles.miniLogoRes}><LucideIcons.Shield size={10} color="white" /></View>
     <View style={styles.teamsRow}>
        <Text style={[styles.teamRes, home === 'FC Autentic' && { color: BLUE_ACCENT }]}>{home}</Text>
        <Text style={styles.scoreRes}>{score}</Text>
        <Text style={[styles.teamRes, away === 'FC Autentic' && { color: BLUE_ACCENT }]}>{away}</Text>
     </View>
     <View style={[styles.resCircle, { backgroundColor: color }]}><Text style={styles.resCircleText}>{result}</Text></View>
  </View>
);

// --- SVG Components ---

const MiniLineChart = ({ color }) => (
  <Svg width="50" height="20" viewBox="0 0 60 25">
     <Path d="M0,20 L15,10 L30,15 L45,5 L60,8" fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
     <Circle cx="60" cy="8" r="3" fill={color} />
  </Svg>
);

const FootballPitchSVG = () => (
  <Svg width="100%" height="220" viewBox="0 0 400 240">
     <Rect x="0" y="0" width="400" height="240" fill="#0B3A2B" rx="10" />
     <Rect x="0" y="0" width="400" height="240" fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="1" />
     <Line x1="200" y1="0" x2="200" y2="240" stroke="rgba(255,255,255,0.12)" strokeWidth="1" />
     <Circle cx="200" cy="120" r="40" stroke="rgba(255,255,255,0.12)" strokeWidth="1" fill="none" />
     <Rect x="0" y="60" width="60" height="120" stroke="rgba(255,255,255,0.12)" strokeWidth="1" fill="none" />
     <Rect x="340" y="60" width="60" height="120" stroke="rgba(255,255,255,0.12)" strokeWidth="1" fill="none" />

     {/* Players */}
     <G transform="translate(30, 120)"><Circle r="8" fill={GREEN} /><Text style={{ fontSize: 6, fill: 'white', fontWeight: '800' }} x="-8" y="14">Stroie</Text></G>
     <G transform="translate(90, 45)"><Circle r="8" fill={BLUE_ACCENT} /><Text style={{ fontSize: 6, fill: 'white' }} x="-6" y="14">Rusu</Text></G>
     <G transform="translate(90, 95)"><Circle r="8" fill={BLUE_ACCENT} /><Text style={{ fontSize: 6, fill: 'white' }} x="-10" y="14">Ionescu(C)</Text></G>
     <G transform="translate(90, 145)"><Circle r="8" fill={BLUE_ACCENT} /><Text style={{ fontSize: 6, fill: 'white' }} x="-8" y="14">Enache</Text></G>
     <G transform="translate(90, 195)"><Circle r="8" fill={BLUE_ACCENT} /><Text style={{ fontSize: 6, fill: 'white' }} x="-8" y="14">Pascu</Text></G>

     <G transform="translate(170, 85)"><Circle r="8" fill={BLUE_ACCENT} /><Text style={{ fontSize: 6, fill: 'white' }} x="-6" y="14">Rus</Text></G>
     <G transform="translate(170, 155)"><Circle r="8" fill={BLUE_ACCENT} /><Text style={{ fontSize: 6, fill: 'white' }} x="-8" y="14">Măcel</Text></G>

     <G transform="translate(250, 45)"><Circle r="8" fill={BLUE_ACCENT} /><Text style={{ fontSize: 6, fill: 'white' }} x="-8" y="14">Sârbu</Text></G>
     <G transform="translate(250, 120)"><Circle r="8" fill={BLUE_ACCENT} /><Text style={{ fontSize: 6, fill: 'white' }} x="-8" y="14">Oprea</Text></G>
     <G transform="translate(250, 195)"><Circle r="8" fill={BLUE_ACCENT} /><Text style={{ fontSize: 6, fill: 'white' }} x="-6" y="14">Popa</Text></G>

     <G transform="translate(320, 120)"><Circle r="8" fill={BLUE_ACCENT} /><Text style={{ fontSize: 6, fill: 'white' }} x="-10" y="14">Dumitru</Text></G>
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

  statsGrid: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  statCard: { flex: 1, backgroundColor: CARD_BG, borderRadius: 14, padding: 12, height: 95, borderWidth: 1, borderColor: BORDER_COLOR },
  statContent: { flexDirection: 'row', alignItems: 'center' },
  statIconWrap: { width: 32, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  statLabel: { color: TEXT_DIM, fontSize: 8.5, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 0.8 },
  statVal: { color: 'white', fontSize: 12, fontWeight: '900', marginTop: 3 },
  statFooter: { marginTop: 10, flex: 1, justifyContent: 'flex-end' },
  statSub: { color: TEXT_TH, fontSize: 8.5, fontWeight: '700' },
  statComp: { color: TEXT_TH, fontSize: 8, fontWeight: '600', marginTop: 1 },
  statTrend: { color: GREEN, fontSize: 9, fontWeight: '800', alignSelf: 'flex-end' },
  miniChart: { width: 50, height: 20, alignSelf: 'flex-end' },
  formRow: { flexDirection: 'row', gap: 3, alignSelf: 'flex-end' },
  formCircle: { width: 16, height: 16, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  formText: { color: BG_DARK, fontSize: 8, fontWeight: '900' },

  actionsRow: { marginBottom: 25 },
  actionsList: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  actionBtn: { flex: 1, height: 38, borderRadius: 9, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, gap: 8, borderWidth: 1, borderColor: "rgba(0, 212, 255, 0.12)" },
  actionBtnText: { color: 'white', fontSize: 10.5, fontWeight: '800' },
  moreBtn: { width: 38, height: 38, backgroundColor: "rgba(255,255,255,0.03)", borderRadius: 9, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: "rgba(255,255,255,0.05)" },

  mainGrid: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  colLeft: { flex: 1.2 },
  colCenter: { flex: 2.2 },
  colRight: { flex: 1.5 },

  cardMain: { backgroundColor: CARD_BG, borderRadius: 18, padding: 16, borderWidth: 1, borderColor: BORDER_COLOR, marginBottom: 12 },
  cardSide: { backgroundColor: CARD_BG, borderRadius: 18, padding: 16, borderWidth: 1, borderColor: BORDER_COLOR },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  cardTitle: { color: 'white', fontSize: 12.5, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 0.8 },
  sideLink: { color: BLUE_ACCENT, fontSize: 9.5, fontWeight: '800' },

  matchLine: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.03)" },
  matchLineActive: { backgroundColor: BLUE_ACCENT + "08", borderBottomColor: BLUE_ACCENT + "15" },
  matchDateBox: { width: 30, alignItems: 'center' },
  matchDayNum: { color: TEXT_DIM, fontSize: 11, fontWeight: '900' },
  matchMonth: { color: TEXT_TH, fontSize: 7.5, fontWeight: '900' },
  miniLogo: { width: 20, height: 20, backgroundColor: "rgba(255,255,255,0.05)", borderRadius: 5, alignItems: 'center', justifyContent: 'center', marginLeft: 8 },
  matchOpponent: { color: TEXT_DIM, fontSize: 10.5, fontWeight: '800' },
  matchLeague: { color: TEXT_TH, fontSize: 8.5, fontWeight: '600', marginTop: 1 },
  matchLoc: { color: TEXT_TH, fontSize: 8.5, fontWeight: '800' },
  matchTime: { color: TEXT_TH, fontSize: 9, fontWeight: '700', marginTop: 1 },

  availGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 },
  availSquare: { width: '48%', padding: 10, borderRadius: 12, borderWidth: 1, position: 'relative' },
  availCount: { fontSize: 16, fontWeight: '900' },
  availLabel: { fontSize: 9, fontWeight: '700', color: TEXT_DIM, marginTop: 1 },
  availIcon: { position: 'absolute', top: 10, right: 10, opacity: 0.3 },
  availFooter: { color: TEXT_TH, fontSize: 8.5, fontWeight: '600', marginTop: 12 },

  pitchArea: { flexDirection: 'row', gap: 14 },
  pitchVisual: { flex: 2.2, height: 220, borderRadius: 8, overflow: 'hidden' },
  pitchSidebar: { flex: 1 },
  sidebarLabel: { color: TEXT_TH, fontSize: 8, fontWeight: '900', letterSpacing: 0.5 },
  sidebarVal: { color: 'white', fontSize: 10.5, fontWeight: '800', marginTop: 1 },
  tacticalInstructions: { marginTop: 14, paddingLeft: 10, borderLeftWidth: 1, borderLeftColor: "rgba(255,255,255,0.05)" },
  instrHeader: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 6 },
  instrTitle: { color: 'white', fontSize: 8.5, fontWeight: '900' },
  instrText: { color: TEXT_DIM, fontSize: 8.5, fontWeight: '600', marginBottom: 3 },
  detailBtn: { height: 28, backgroundColor: BLUE_ACCENT + "15", borderRadius: 7, alignItems: 'center', justifyContent: 'center', marginTop: 12 },
  detailBtnText: { color: BLUE_ACCENT, fontSize: 8.5, fontWeight: '900' },

  bottomInnerRow: { flexDirection: 'row', gap: 12 },
  cardMainHalf: { flex: 1, backgroundColor: CARD_BG, borderRadius: 18, padding: 16, borderWidth: 1, borderColor: BORDER_COLOR, position: 'relative', overflow: 'hidden' },
  objLine: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  objText: { color: TEXT_DIM, fontSize: 9.5, fontWeight: '700' },
  targetIconWrap: { position: 'absolute', bottom: -8, right: -8 },

  lastMatchHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 15 },
  teamName: { flex: 1, color: TEXT_DIM, fontSize: 9, fontWeight: '800', textAlign: 'center' },
  lastScore: { color: 'white', fontSize: 14, fontWeight: '900' },
  compRow: { marginBottom: 12 },
  compLabels: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 },
  compTitle: { color: TEXT_TH, fontSize: 8.5, fontWeight: '800' },
  compVal: { color: 'white', fontSize: 9.5, fontWeight: '800' },
  compBarBg: { height: 4, backgroundColor: "rgba(255,255,255,0.05)", borderRadius: 2 },
  compBarFill: { height: '100%', borderRadius: 2 },
  fullAnalysisLink: { marginTop: 8, alignItems: 'center' },
  fullAnalysisText: { color: BLUE_ACCENT, fontSize: 9.5, fontWeight: '800' },

  squadRow: { flexDirection: 'row', alignItems: 'center', height: 40, borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.03)" },
  squadNum: { color: TEXT_TH, fontSize: 9, fontWeight: '800', width: 18 },
  miniAvatarSquad: { width: 20, height: 20, borderRadius: 10, backgroundColor: "rgba(255,255,255,0.05)", alignItems: 'center', justifyContent: 'center', marginHorizontal: 6 },
  squadName: { flex: 1, color: 'white', fontSize: 10, fontWeight: '800' },
  squadPos: { color: TEXT_TH, fontSize: 8.5, fontWeight: '800', width: 25 },
  squadStatus: { fontSize: 8.5, fontWeight: '700', marginLeft: 8, width: 60 },
  legDot: { width: 5, height: 5, borderRadius: 2.5 },
  squadLegend: { marginTop: 12, borderTopWidth: 1, borderTopColor: "rgba(255,255,255,0.05)", paddingTop: 10, gap: 8 },
  legItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  legText: { color: TEXT_DIM, fontSize: 8.5, fontWeight: '700' },
  fullSquadLink: { color: TEXT_TH, fontSize: 9, fontWeight: '800', marginTop: 8 },

  leagueHeader: { flexDirection: 'row', paddingBottom: 6, borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.05)", marginBottom: 4 },
  th: { color: TEXT_TH, fontSize: 7.5, fontWeight: "900", textTransform: "uppercase", letterSpacing: 1, textAlign: 'center' },
  leagueRow: { flexDirection: 'row', alignItems: 'center', height: 38, borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.03)" },
  leagueRowActive: { backgroundColor: BLUE_ACCENT + "08", borderBottomColor: BLUE_ACCENT + "15" },
  miniLogoLeague: { width: 16, height: 16, backgroundColor: "rgba(255,255,255,0.03)", borderRadius: 4, alignItems: 'center', justifyContent: 'center' },
  rowMainText: { color: 'white', fontSize: 10, fontWeight: '800' },
  rowSubText: { color: TEXT_TH, fontSize: 9, fontWeight: '600' },
  fullLeagueBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 10, justifyContent: 'center' },
  fullLeagueText: { color: BLUE_ACCENT, fontSize: 9, fontWeight: '800' },

  resultRow: { flexDirection: 'row', alignItems: 'center', height: 44, borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.03)" },
  resultDate: { color: TEXT_TH, fontSize: 8.5, fontWeight: '700', width: 35 },
  miniLogoRes: { width: 18, height: 18, backgroundColor: "rgba(255,255,255,0.03)", borderRadius: 4, alignItems: 'center', justifyContent: 'center', marginHorizontal: 6 },
  teamsRow: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6 },
  teamRes: { flex: 1, color: TEXT_DIM, fontSize: 9, fontWeight: '800' },
  scoreRes: { color: 'white', fontSize: 10, fontWeight: '900', width: 30, textAlign: 'center' },
  resCircle: { width: 16, height: 16, borderRadius: 8, alignItems: 'center', justifyContent: 'center', marginLeft: 8 },
  resCircleText: { color: BG_DARK, fontSize: 8, fontWeight: '900' },

  updateFooter: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 15, opacity: 0.5 },
  updateText: { color: TEXT_TH, fontSize: 9, fontWeight: '800' }
});
