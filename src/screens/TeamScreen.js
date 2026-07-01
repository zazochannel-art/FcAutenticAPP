import React, { useState } from "react";
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
import Svg, { Path, Circle, Rect, G, Line } from "react-native-svg";

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

export default function TeamScreen() {
  const { width } = useWindowDimensions();

  return (
    <View style={styles.container}>
      <View style={styles.mainWrapper}>
        <ScrollView style={styles.mainScroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

          {/* Page Header */}
          <View style={styles.pageHeader}>
            <View style={styles.pageTitleContainer}>
              <Text style={styles.pageTitle}>Echipă</Text>
              <Text style={styles.pageSub}>Gestionează lotul, monitorizează prezența și pregătește echipa pentru următoarele provocări.</Text>
            </View>
          </View>

          {/* Row 1: Stat Cards */}
          <View style={styles.statsGrid}>
             <StatCard icon="Users" label="JUCĂTORI ACTIVI" val="26" valSub="din 28 înregistrați" iColor={BLUE_ACCENT} />
             <StatCard icon="TrendingUp" label="PREZENȚĂ MEDIE" val="84%" valSub="această săptămână" iColor={GREEN} />
             <StatCard icon="ShieldAlert" label="JUCĂTORI ACCIDENTAȚI" val="2" valSub="momentan indisponibili" iColor={AMBER} />
             <StatCard icon="LayoutGrid" label="GRUPE ACTIVE" val="3" valSub="Seniori, U19, U17" iColor={VIOLET} />
          </View>

          {/* Row 2: Quick Actions */}
          <View style={styles.actionsRow}>
             <View style={styles.actionsList}>
                <ActionBtn icon="UserPlus" label="Adaugă jucător" color={BLUE_ACCENT} outline />
                <ActionBtn icon="Users" label="Setează lot" color={BLUE_ACCENT} outline />
                <ActionBtn icon="MessageSquare" label="Trimite mesaj" color={BLUE_ACCENT} outline />
                <ActionBtn icon="CheckCircle" label="Marchează prezență" color={BLUE_ACCENT} outline />
             </View>
          </View>

          {/* Row 3: Main Grid (Two Columns: Table & Sidebar) */}
          <View style={styles.mainGrid}>

             {/* Left Column: Squad Table */}
             <View style={styles.colLeft}>
                <View style={styles.cardMain}>
                   <View style={styles.cardHeader}>
                      <Text style={styles.cardTitle}>LOTUL ECHIPEI (26)</Text>
                      <View style={styles.tableControls}>
                         <View style={styles.filterBtn}><LucideIcons.SlidersHorizontal size={14} color={TEXT_DIM} /><Text style={styles.filterBtnText}>Filtre</Text><LucideIcons.ChevronDown size={12} color={TEXT_DIM} /></View>
                         <View style={styles.filterBtn}><LucideIcons.Layout size={14} color={TEXT_DIM} /><Text style={styles.filterBtnText}>Coloane</Text></View>
                         <View style={styles.smallSearch}>
                            <LucideIcons.Search size={14} color={TEXT_TH} />
                            <TextInput placeholder="Caută în lot..." placeholderTextColor={TEXT_TH} style={styles.smallSearchInput} />
                         </View>
                      </View>
                   </View>

                   <View style={styles.tableHeader}>
                      <Text style={[styles.th, { width: 30 }]}>NR.</Text>
                      <Text style={[styles.th, { flex: 2.5 }]}>JUCĂTOR</Text>
                      <Text style={[styles.th, { flex: 1.5 }]}>POZIȚIE</Text>
                      <Text style={[styles.th, { width: 50, textAlign: 'center' }]}>VÂRSTĂ</Text>
                      <Text style={[styles.th, { flex: 1.5 }]}>STATUS</Text>
                      <Text style={[styles.th, { flex: 2 }]}>FORMĂ</Text>
                      <View style={{ width: 40 }} />
                   </View>

                   <SquadRow num="1" name="R. Stanca" pos="GK" pColor={AMBER} age="24" status="Apt" sColor={GREEN} rating="7.3" rPer={0.8} />
                   <SquadRow num="4" name="A. Ionescu" pos="CB" pColor={BLUE_ACCENT} age="26" status="Apt" sColor={GREEN} rating="7.1" rPer={0.75} />
                   <SquadRow num="5" name="D. Matei" pos="CB" pColor={BLUE_ACCENT} age="23" status="Apt" sColor={GREEN} rating="6.9" rPer={0.7} />
                   <SquadRow num="14" name="M. Enache" pos="RB" pColor={BLUE_ACCENT} age="22" status="Apt" sColor={GREEN} rating="7.2" rPer={0.78} />
                   <SquadRow num="6" name="C. Rusu" pos="LB" pColor={BLUE_ACCENT} age="25" status="În recuperare" sColor={AMBER} rating="6.2" rPer={0.5} />
                   <SquadRow num="8" name="A. Popa" pos="CM" pColor={GREEN} age="24" status="Apt" sColor={GREEN} rating="7.0" rPer={0.72} />
                   <SquadRow num="10" name="V. Petre" pos="CM" pColor={GREEN} age="21" status="Apt" sColor={GREEN} rating="6.8" rPer={0.68} />
                   <SquadRow num="11" name="S. Grigore" pos="CAM" pColor={GREEN} age="22" status="Apt" sColor={GREEN} rating="7.4" rPer={0.82} />
                   <SquadRow num="7" name="D. Popa" pos="RW" pColor={RED} age="23" status="Accidentat" sColor={RED} rating="—" rPer={0} empty />
                   <SquadRow num="9" name="L. Sandu" pos="LW" pColor={RED} age="24" status="Apt" sColor={GREEN} rating="7.1" rPer={0.74} />
                   <SquadRow num="19" name="M. Dumitru" pos="ST" pColor={RED} age="25" status="Absent" sColor={TEXT_TH} rating="—" rPer={0} empty />

                </View>
             </View>

             {/* Right Column: Sidebar */}
             <View style={styles.colRight}>
                <View style={styles.cardSide}>
                   <View style={styles.cardHeader}>
                      <Text style={styles.cardTitle}>GRUPE & LOTURI</Text>
                   </View>
                   <GroupItem name="Seniori" sub="Lot principal" count="26" color={BLUE_ACCENT} />
                   <GroupItem name="U19" sub="Juniori Under 19" count="22" color={VIOLET} />
                   <GroupItem name="U17" sub="Juniori Under 17" count="20" color={AMBER} />

                   <View style={styles.sidebarDivider} />
                   <Text style={[styles.cardTitle, { marginBottom: 16 }]}>STAFF TEHNIC</Text>
                   <StaffItem name="Andrei Popescu" role="Antrenor principal" rLabel="ANTRENOR" rColor={BLUE_ACCENT} />
                   <StaffItem name="Mihai Rădulescu" role="Antrenor secund" rLabel="SECUND" rColor={BLUE_ACCENT} />
                   <StaffItem name="Ciprian Marin" role="Preparator fizic" rLabel="FIZIC" rColor={GREEN} />
                   <StaffItem name="Dr. Gabriel Ionescu" role="Medic" rLabel="MEDIC" rColor={RED} />
                   <StaffItem name="Alexandru Stoica" role="Analist video" rLabel="ANALIST" rColor={VIOLET} />

                   <Pressable style={styles.manageGroupsBtn}>
                      <Text style={styles.manageGroupsText}>Gestionează grupele</Text>
                      <LucideIcons.ArrowRight size={14} color={TEXT_TH} />
                   </Pressable>
                </View>

                <View style={[styles.cardSide, { marginTop: 18 }]}>
                   <View style={styles.cardHeader}>
                      <Text style={styles.cardTitle}>PREZENȚĂ SĂPTĂMÂNALĂ</Text>
                   </View>
                   <AttendanceBarChart />
                   <View style={styles.attendanceFooter}>
                      <View style={styles.footerTrend}>
                         <LucideIcons.CheckCircle2 size={12} color={GREEN} />
                         <Text style={styles.footerTrendText}>Medie săptămânală: <Text style={{ color: GREEN }}>84%</Text></Text>
                      </View>
                      <Text style={styles.sideLink}>Detalii prezență ›</Text>
                   </View>
                </View>
             </View>
          </View>

          {/* Row 4: Bottom Grid */}
          <View style={styles.bottomGrid}>
             {/* Position Distribution */}
             <View style={styles.colWidget}>
                <View style={styles.cardMain}>
                   <Text style={styles.cardTitle}>DISTRIBUȚIA PE POZIȚII</Text>
                   <View style={styles.donutArea}>
                      <View style={styles.donutWrapper}>
                        <PositionsDonut />
                        <View style={styles.donutLabelWrap}>
                           <Text style={styles.donutVal}>26</Text>
                           <Text style={styles.donutSub}>jucători</Text>
                        </View>
                      </View>
                      <View style={styles.legend}>
                         <LegendItem dot={CYAN} label="Portari" count="2" per="8%" />
                         <LegendItem dot={BLUE_ACCENT} label="Fundași" count="9" per="35%" />
                         <LegendItem dot={GREEN} label="Mijlocași" count="9" per="35%" />
                         <LegendItem dot={RED} label="Atacanți" count="6" per="22%" />
                      </View>
                   </View>
                   <Pressable style={styles.fullAnalysisBtn}>
                      <Text style={styles.fullAnalysisText}>Vezi analiza completă</Text>
                      <LucideIcons.ArrowRight size={14} color={TEXT_TH} />
                   </Pressable>
                </View>
             </View>

             {/* Coach Observations */}
             <View style={styles.colWidget}>
                <View style={styles.cardMain}>
                   <Text style={styles.cardTitle}>OBSERVAȚIILE ANTRENORULUI</Text>
                   <View style={styles.observationsList}>
                      <ObsItem icon="CheckCircle" name="V. Petre" desc="Evoluții constante la antrenamente, în formă bună." time="2z" color={GREEN} />
                      <ObsItem icon="Clock" name="C. Rusu" desc="În recuperare, avans bun. Revenire estimată: 10 zile." time="1z" color={AMBER} />
                      <ObsItem icon="AlertCircle" name="D. Popa" desc="Accidentare musculară. Revenire estimată: 2 săpt." time="3z" color={RED} />
                      <ObsItem icon="MessageSquare" name="M. Enache" desc="Necesită mai multă comunicare în faza defensivă." time="3z" color={BLUE_ACCENT} />
                   </View>
                   <Text style={styles.sideLink}>Vezi toate observațiile ›</Text>
                </View>
             </View>

             {/* Squad Availability */}
             <View style={styles.colWidget}>
                <View style={styles.cardMain}>
                   <Text style={styles.cardTitle}>DISPONIBILITATEA LOTULUI</Text>
                   <View style={styles.availSummaryGrid}>
                      <AvailMini label="Apt" count="22" per="84%" color={GREEN} />
                      <AvailMini label="Accidentați" count="2" per="8%" color={RED} />
                      <AvailMini label="În recuperare" count="1" per="4%" color={AMBER} />
                      <AvailMini label="Indisponibili" count="1" per="4%" color={BLUE_ACCENT} />
                   </View>
                   <Pressable style={styles.fullAnalysisBtn}>
                      <Text style={styles.fullAnalysisText}>Raport disponibilitate</Text>
                      <LucideIcons.ArrowRight size={14} color={TEXT_TH} />
                   </Pressable>
                </View>
             </View>

             {/* Next Activity */}
             <View style={styles.colWidget}>
                <View style={styles.cardMain}>
                   <Text style={styles.cardTitle}>URMĂTOAREA ACTIVITATE</Text>
                   <View style={styles.nextActivities}>
                      <View style={styles.activityRow}>
                         <View style={styles.activityIconWrap}><LucideIcons.Barbell size={16} color={GREEN} /></View>
                         <View style={{ flex: 1, marginLeft: 14 }}>
                            <Text style={styles.activityLabel}>ANTRENAMENT</Text>
                            <Text style={styles.activityTitle}>Antrenament echipă</Text>
                            <Text style={styles.activityMeta}>27 Mai 2024 • 18:30</Text>
                            <Text style={styles.activityLoc}>Baza FC Autentic</Text>
                         </View>
                         <Pressable style={styles.accessBtn}><Text style={styles.accessBtnText}>Sesiune tactică</Text></Pressable>
                      </View>
                      <View style={styles.activityRow}>
                         <View style={[styles.activityIconWrap, { backgroundColor: VIOLET + "15" }]}><LucideIcons.Trophy size={16} color={VIOLET} /></View>
                         <View style={{ flex: 1, marginLeft: 14 }}>
                            <Text style={[styles.activityLabel, { color: VIOLET }]}>MECI URMĂTOR</Text>
                            <Text style={styles.activityTitle}>FC Autentic — CSM Reșița</Text>
                            <Text style={styles.activityMeta}>30 mai 2024 • 17:30</Text>
                            <Text style={styles.activityLoc}>Stadion Mircea Chivu</Text>
                         </View>
                         <Pressable style={[styles.accessBtn, { backgroundColor: "rgba(255,255,255,0.03)" }]}><Text style={styles.accessBtnText}>Acces</Text></Pressable>
                      </View>
                   </View>
                   <Text style={styles.sideLink}>Vezi calendarul complet ›</Text>
                </View>
             </View>
          </View>

          <View style={styles.updateFooter}>
             <LucideIcons.Clock size={12} color={TEXT_TH} />
             <Text style={styles.updateText}>Ultima analiză: 23 mai 2026, 10:30</Text>
          </View>

        </ScrollView>
      </View>
    </View>
  );
}

// --- Sub-Components ---

const StatCard = ({ icon, label, val, valSub, iColor }) => {
  const Icon = LucideIcons[icon] || LucideIcons.Circle;
  return (
    <View style={styles.statCard}>
       <View style={styles.statContent}>
          <View style={[styles.statIconWrap, { backgroundColor: iColor + "10", borderColor: iColor + "30" }]}>
             <Icon size={20} color={iColor} />
          </View>
          <View style={{ marginLeft: 14, flex: 1 }}>
             <Text style={styles.statLabel}>{label}</Text>
             <Text style={styles.statVal}>{val}</Text>
             <Text style={styles.statValSub}>{valSub}</Text>
          </View>
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

const SquadRow = ({ num, name, pos, pColor, age, status, sColor, rating, rPer, empty }) => (
  <View style={styles.tableRow}>
     <Text style={styles.rowNum}>{num}</Text>
     <View style={{ flex: 2.5, flexDirection: 'row', alignItems: 'center' }}>
        <View style={styles.miniAvatar}><LucideIcons.User size={12} color="white" /></View>
        <Text style={[styles.rowMainText, { marginLeft: 10 }]}>{name}</Text>
     </View>
     <Text style={[styles.posLabel, { color: pColor, flex: 1.5 }]}>{pos}</Text>
     <Text style={[styles.rowSubText, { width: 50, textAlign: 'center' }]}>{age}</Text>
     <View style={{ flex: 1.5, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        <View style={[styles.statusDot, { backgroundColor: sColor }]} />
        <Text style={[styles.rowSubText, { color: sColor === GREEN ? TEXT_DIM : sColor }]}>{status}</Text>
     </View>
     <View style={{ flex: 2, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <View style={styles.ratingBarBg}>
           {!empty && <View style={[styles.ratingBarFill, { width: `${rPer * 100}%`, backgroundColor: GREEN }]} />}
           {empty && <View style={[styles.ratingBarEmpty]} />}
        </View>
        <Text style={[styles.ratingVal, empty && { color: TEXT_TH }]}>{rating}</Text>
     </View>
     <Pressable style={{ width: 40, alignItems: 'center' }}><LucideIcons.MoreHorizontal size={14} color={TEXT_TH} /></Pressable>
  </View>
);

const GroupItem = ({ name, sub, count, color }) => (
  <View style={styles.groupItem}>
     <View style={[styles.groupIndicator, { backgroundColor: color }]} />
     <View style={{ flex: 1, marginLeft: 12 }}>
        <Text style={styles.rowMainText}>{name}</Text>
        <Text style={styles.rowSubText}>{sub}</Text>
     </View>
     <View style={styles.groupCount}><Text style={[styles.countText, { color }]}>{count}</Text></View>
  </View>
);

const StaffItem = ({ name, role, rLabel, rColor }) => (
  <View style={styles.staffItem}>
     <View style={styles.miniAvatarStaff}><LucideIcons.User size={12} color="white" /></View>
     <View style={{ flex: 1, marginLeft: 10 }}>
        <Text style={styles.rowMainText}>{name}</Text>
        <Text style={styles.rowSubText}>{role}</Text>
     </View>
     <Text style={[styles.staffRoleLabel, { color: rColor }]}>{rLabel}</Text>
  </View>
);

const LegendItem = ({ dot, label, count, per }) => (
  <View style={styles.legendItem}>
     <View style={[styles.legendDot, { backgroundColor: dot }]} />
     <Text style={styles.legendLabel}>{label}</Text>
     <Text style={styles.legendCount}>{count}</Text>
     <Text style={styles.legendPer}>({per})</Text>
  </View>
);

const ObsItem = ({ icon, name, desc, time, color }) => {
  const Icon = LucideIcons[icon];
  return (
    <View style={styles.obsItem}>
       <View style={[styles.obsIconWrap, { borderColor: color + "30" }]}><Icon size={12} color={color} /></View>
       <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={styles.rowMainText}>{name}</Text>
          <Text style={styles.rowSubText} numberOfLines={1}>{desc}</Text>
       </View>
       <Text style={styles.obsTime}>{time}</Text>
    </View>
  );
};

const AvailMini = ({ label, count, per, color }) => (
  <View style={[styles.availMiniCard, { borderColor: color + "20" }]}>
     <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <View style={[styles.miniCheck, { backgroundColor: color + "15", borderColor: color + "30" }]}>
           <LucideIcons.Check size={10} color={color} />
        </View>
        <Text style={[styles.availMiniVal, { color }]}>{count}</Text>
     </View>
     <Text style={styles.availMiniLabel}>{label}</Text>
     <Text style={[styles.availMiniPer, { color }]}>{per}</Text>
  </View>
);

// --- SVG Components ---

const AttendanceBarChart = () => (
  <Svg width="100%" height="150" viewBox="0 0 300 150">
     {[88, 80, 84, 83, 80, 85, 78].map((per, i) => (
        <G key={i} transform={`translate(${15 + i * 40}, 0)`}>
           <Rect x="5" y={150 - per} width="20" height={per} rx="3" fill={BLUE_ACCENT} opacity="0.8" />
           <Text style={{ fontSize: 6, fill: TEXT_DIM }} x="5" y="145">{['Lun', 'Mar', 'Mie', 'Joi', 'Vin', 'Sâm', 'Dum'][i]}</Text>
           <Text style={{ fontSize: 7, fill: 'white', fontWeight: '800' }} x="7" y={140 - per}>{per}%</Text>
        </G>
     ))}
  </Svg>
);

const PositionsDonut = () => (
  <Svg width="120" height="120" viewBox="0 0 100 100">
    <Circle cx="50" cy="50" r="40" stroke="#1e293b" strokeWidth="10" fill="none" />
    <Circle cx="50" cy="50" r="40" stroke={CYAN} strokeWidth="10" fill="none" strokeDasharray="251.2" strokeDashoffset="230" transform="rotate(-90 50 50)" />
    <Circle cx="50" cy="50" r="40" stroke={BLUE_ACCENT} strokeWidth="10" fill="none" strokeDasharray="251.2" strokeDashoffset="160" transform="rotate(30 50 50)" />
    <Circle cx="50" cy="50" r="40" stroke={GREEN} strokeWidth="10" fill="none" strokeDasharray="251.2" strokeDashoffset="160" transform="rotate(160 50 50)" />
    <Circle cx="50" cy="50" r="40" stroke={RED} strokeWidth="10" fill="none" strokeDasharray="251.2" strokeDashoffset="195" transform="rotate(290 50 50)" />
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
  statLabel: { color: TEXT_DIM, fontSize: 8, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 0.8 },
  statVal: { color: 'white', fontSize: 18, fontWeight: '900', marginTop: 4 },
  statValSub: { color: TEXT_TH, fontSize: 8.5, fontWeight: '700', marginTop: 1 },

  actionsRow: { marginBottom: 25 },
  actionsList: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  actionBtn: { flex: 1, height: 38, borderRadius: 9, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, gap: 8, borderWidth: 1, borderColor: "rgba(0, 212, 255, 0.12)" },
  actionBtnText: { color: 'white', fontSize: 10.5, fontWeight: '800' },

  mainGrid: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  colLeft: { flex: 3 },
  colRight: { flex: 1 },

  cardMain: { backgroundColor: CARD_BG, borderRadius: 18, padding: 16, borderWidth: 1, borderColor: BORDER_COLOR, marginBottom: 12 },
  cardSide: { backgroundColor: CARD_BG, borderRadius: 18, padding: 16, borderWidth: 1, borderColor: BORDER_COLOR },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  cardTitle: { color: 'white', fontSize: 12.5, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 0.8 },
  sideLink: { color: BLUE_ACCENT, fontSize: 9.5, fontWeight: '800' },

  tableControls: { flexDirection: 'row', gap: 10 },
  smallSearch: { width: 150, height: 28, backgroundColor: "rgba(255,255,255,0.03)", borderRadius: 7, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, borderWidth: 1, borderColor: "rgba(255,255,255,0.05)" },
  smallSearchInput: { flex: 1, color: 'white', fontSize: 10, fontWeight: '600', marginLeft: 6 },
  filterBtn: { height: 28, paddingHorizontal: 10, backgroundColor: "rgba(255,255,255,0.03)", borderRadius: 7, flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderColor: "rgba(255,255,255,0.05)" },
  filterBtnText: { color: TEXT_DIM, fontSize: 10, fontWeight: '700' },

  tableHeader: { flexDirection: 'row', paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.05)", marginBottom: 4 },
  th: { color: TEXT_TH, fontSize: 8, fontWeight: "900", textTransform: "uppercase", letterSpacing: 1 },
  tableRow: { flexDirection: 'row', alignItems: 'center', height: 48, borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.03)" },
  rowNum: { color: TEXT_TH, fontSize: 9.5, fontWeight: '800', width: 30 },
  miniAvatar: { width: 24, height: 24, borderRadius: 12, backgroundColor: "rgba(255,255,255,0.08)", alignItems: 'center', justifyContent: 'center' },
  rowMainText: { color: 'white', fontSize: 11, fontWeight: '800' },
  rowSubText: { color: TEXT_TH, fontSize: 9.5, fontWeight: '600' },
  posLabel: { fontSize: 10, fontWeight: '900' },
  statusDot: { width: 5, height: 5, borderRadius: 2.5 },
  ratingBarBg: { flex: 1, height: 5, backgroundColor: "rgba(255,255,255,0.05)", borderRadius: 2.5, overflow: 'hidden' },
  ratingBarFill: { height: '100%', borderRadius: 2.5 },
  ratingBarEmpty: { height: '100%', backgroundColor: "rgba(255,255,255,0.02)" },
  ratingVal: { color: 'white', fontSize: 10, fontWeight: '900', width: 30, textAlign: 'right' },

  groupItem: { flexDirection: 'row', alignItems: 'center', height: 44, borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.03)" },
  groupIndicator: { width: 3, height: 18, borderRadius: 2 },
  groupCount: { width: 24, height: 18, borderRadius: 6, backgroundColor: "rgba(255,255,255,0.03)", alignItems: 'center', justifyContent: 'center' },
  countText: { fontSize: 9, fontWeight: '900' },
  sidebarDivider: { height: 1, backgroundColor: "rgba(255,255,255,0.05)", marginVertical: 18 },
  staffItem: { flexDirection: 'row', alignItems: 'center', height: 40, borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.02)" },
  miniAvatarStaff: { width: 22, height: 22, borderRadius: 11, backgroundColor: "rgba(255,255,255,0.05)", alignItems: 'center', justifyContent: 'center' },
  staffRoleLabel: { fontSize: 8, fontWeight: '900', width: 55, textAlign: 'right' },
  manageGroupsBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 15, justifyContent: 'center' },
  manageGroupsText: { color: TEXT_TH, fontSize: 10, fontWeight: '800' },

  attendanceFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 15 },
  footerTrend: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  footerTrendText: { color: TEXT_TH, fontSize: 9.5, fontWeight: '700' },

  bottomGrid: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  colWidget: { flex: 1 },
  donutArea: { flexDirection: 'row', alignItems: 'center', gap: 16, marginTop: 8 },
  donutWrapper: { width: 100, height: 100, alignItems: 'center', justifyContent: 'center' },
  donutLabelWrap: { position: 'absolute', alignItems: 'center', justifyContent: 'center' },
  donutVal: { color: 'white', fontSize: 16, fontWeight: '900' },
  donutSub: { color: TEXT_TH, fontSize: 8, fontWeight: '700', marginTop: -2 },
  legend: { flex: 1, gap: 8 },
  legendItem: { flexDirection: 'row', alignItems: 'center' },
  legendDot: { width: 6, height: 6, borderRadius: 3, marginRight: 8 },
  legendLabel: { flex: 1, color: TEXT_DIM, fontSize: 10, fontWeight: '700' },
  legendCount: { color: 'white', fontSize: 10, fontWeight: '800', marginRight: 4 },
  legendPer: { color: TEXT_TH, fontSize: 9, fontWeight: '700' },
  fullAnalysisBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 14 },
  fullAnalysisText: { color: TEXT_TH, fontSize: 10.5, fontWeight: '800' },

  observationsList: { gap: 12, marginTop: 10, marginBottom: 15 },
  obsItem: { flexDirection: 'row', alignItems: 'center' },
  obsIconWrap: { width: 26, height: 26, borderRadius: 13, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  obsTime: { color: TEXT_TH, fontSize: 9.5, fontWeight: '800' },

  availSummaryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 10, marginBottom: 15 },
  availMiniCard: { width: '47%', padding: 10, borderRadius: 12, borderWidth: 1 },
  miniCheck: { width: 18, height: 18, borderRadius: 5, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  availMiniVal: { fontSize: 14, fontWeight: '900' },
  availMiniLabel: { color: TEXT_TH, fontSize: 8.5, fontWeight: '800', marginTop: 4 },
  availMiniPer: { fontSize: 8.5, fontWeight: '900', marginTop: 2 },

  nextActivities: { gap: 14, marginTop: 10, marginBottom: 15 },
  activityRow: { flexDirection: 'row', alignItems: 'center' },
  activityIconWrap: { width: 32, height: 32, borderRadius: 8, backgroundColor: GREEN + "15", alignItems: 'center', justifyContent: 'center' },
  activityLabel: { color: GREEN, fontSize: 7.5, fontWeight: '900', letterSpacing: 0.5 },
  activityTitle: { color: 'white', fontSize: 11, fontWeight: '800', marginTop: 1 },
  activityMeta: { color: TEXT_TH, fontSize: 9.5, fontWeight: '700', marginTop: 2 },
  activityLoc: { color: TEXT_TH, fontSize: 8.5, fontWeight: '600' },
  accessBtn: { paddingHorizontal: 12, height: 26, backgroundColor: GREEN + "15", borderRadius: 6, alignItems: 'center', justifyContent: 'center' },
  accessBtnText: { color: GREEN, fontSize: 8.5, fontWeight: '900' },

  updateFooter: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 15, opacity: 0.5 },
  updateText: { color: TEXT_TH, fontSize: 10, fontWeight: '800' }
});
