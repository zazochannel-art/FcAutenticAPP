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

export default function AISaaSReport() {
  const { width } = useWindowDimensions();

  return (
    <View style={styles.container}>
      <View style={styles.mainWrapper}>
        <ScrollView style={styles.mainScroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

          {/* Page Header */}
          <View style={styles.pageHeader}>
            <View style={styles.pageTitleContainer}>
              <Text style={styles.pageTitle}>Rapoarte AI</Text>
              <Text style={styles.pageSub}>Analize inteligente pentru performanță, prezență și managementul clubului.</Text>
            </View>
          </View>

          {/* Row 1: Stat Cards */}
          <View style={styles.statsGrid}>
             <StatCard icon="FileText" label="Rapoarte generate" val="18" trend="↑ 4 față de luna trecută" tColor={GREEN} iColor={BLUE_ACCENT} />
             <StatCard icon="Users" label="Prezență club" val="82%" trend="↑ 6% față de săptămâna trecută" tColor={GREEN} iColor={VIOLET} />
             <StatCard icon="AlertTriangle" label="Jucători cu risc" val="4" trend="↑ 1 față de săptămâna trecută" tColor={GREEN} iColor={RED} />
             <StatCard icon="TrendingUp" label="Tendință lunară" val="+7%" trend="↑ Îmbunătățire performanță" tColor={GREEN} iColor={GREEN} />
          </View>

          {/* Row 2: Quick Actions */}
          <View style={styles.actionsRow}>
             <View style={styles.actionsList}>
                <ActionBtn icon="FilePlus" label="Generează raport" color="white" />
                <ActionBtn icon="Users" label="Analiză lot" color="white" />
                <ActionBtn icon="FileDown" label="Exportă PDF" color="white" />
                <ActionBtn icon="Send" label="Trimite concluzii" color={AMBER} />
             </View>
          </View>

          {/* Row 3: Middle Grid (Insights & Charts) */}
          <View style={styles.middleGrid}>
             <View style={styles.colLeft}>
                <View style={styles.cardMain}>
                   <Text style={styles.cardTitle}>Rezumat AI</Text>
                   <View style={styles.insightContent}>
                      <View style={{ flex: 1.5, gap: 18 }}>
                         <InsightItem icon="Users" val="8 jucători au prezență scăzută (< 70%)." sub="Intervenție recomandată pentru creșterea implicării." color={AMBER} />
                         <InsightItem icon="TrendingUp" val="Grupa U16 are cel mai bun progres (+12%)." sub="Continuă trendul pozitiv în dezvoltare și rezultate." color={GREEN} />
                         <InsightItem icon="AlertTriangle" val="3 meciuri cu risc ridicat de absențe (> 30%)." sub="Planifică ajustări în lot și comunicare cu părinții." color={RED} />
                         <InsightItem icon="Calendar" val="AI recomandă o încărcare optimă a programului." sub="Reducere volum săptămâna viitoare cu 8%." color={BLUE_ACCENT} />
                      </View>
                      <View style={styles.brainIllustration}>
                         <AIBrainIcon />
                      </View>
                   </View>
                </View>
             </View>

             <View style={styles.colMiddle}>
                <View style={styles.cardMain}>
                   <View style={styles.cardHeader}>
                      <Text style={styles.cardTitle}>Prezență & risc accidentare</Text>
                   </View>
                   <View style={styles.chartLegend}>
                      <View style={styles.legItem}><View style={[styles.legDot, { backgroundColor: BLUE_ACCENT }]} /><Text style={styles.legText}>Prezență medie (%)</Text></View>
                      <View style={styles.legItem}><View style={[styles.legDot, { backgroundColor: VIOLET }]} /><Text style={styles.legText}>Risc accidentare (%)</Text></View>
                   </View>
                   <AttendanceRiskChart />
                   <View style={styles.chartFooter}>
                      <LucideIcons.CheckCircle size={12} color={GREEN} />
                      <Text style={styles.chartFooterText}>AI detectează o scădere a riscului de accidentare.</Text>
                   </View>
                </View>
             </View>

             <View style={styles.colRight}>
                <View style={styles.cardMain}>
                   <View style={styles.cardHeader}>
                      <Text style={styles.cardTitle}>Progres pe grupe</Text>
                      <Text style={styles.sideLink}>Vezi detalii</Text>
                   </View>
                   <View style={styles.chartLegend}>
                      <View style={styles.legItem}><View style={[styles.legDot, { backgroundColor: BLUE_ACCENT }]} /><Text style={styles.legText}>Progres mediu (%)</Text></View>
                      <View style={styles.legItem}><View style={[styles.legDot, { borderStyle: 'dashed', borderWidth: 1, borderColor: VIOLET }]} /><Text style={styles.legText}>Obiectiv (%)</Text></View>
                   </View>
                   <ProgressGroupsChart />
                   <View style={styles.chartFooter}>
                      <LucideIcons.ArrowUpRight size={12} color={GREEN} />
                      <Text style={styles.chartFooterText}>U16 depășește obiectivul lunar cu +9%.</Text>
                   </View>
                </View>
             </View>
          </View>

          {/* Row 4: Bottom Grid (Players & Alerts) */}
          <View style={styles.bottomGrid}>
             <View style={styles.colPlayers}>
                <View style={styles.cardMain}>
                   <View style={styles.cardHeader}>
                      <Text style={styles.cardTitle}>Jucători evidențiați</Text>
                      <Text style={styles.sideLink}>Vezi toți</Text>
                   </View>
                   <View style={styles.playersGrid}>
                      <PlayerCard name="Radu Ștefan" group="U16 • Mijlocaș" score="92" trend="+ 12%" label="Formă excelentă" color={GREEN} />
                      <PlayerCard name="Andrei Ionescu" group="U19 • Atacant" score="89" trend="+ 8%" label="Progres constant" color={BLUE_ACCENT} />
                      <PlayerCard name="Vlad Marinescu" group="U16 • Fundaș" score="87" trend="+ 7%" label="Evoluție solidă" color={VIOLET} />
                      <PlayerCard name="Mihai Ionescu" group="U13 • Mijlocaș" score="85" trend="+ 6%" label="Potențial ridicat" color={GREEN} />
                   </View>
                   <View style={styles.infoFooter}>
                      <LucideIcons.Info size={14} color={TEXT_TH} />
                      <Text style={styles.infoFooterText}>Evaluarea AI se bazează pe prezență, performanță și implicare.</Text>
                   </View>
                </View>
             </View>

             <View style={styles.colAlerts}>
                <View style={styles.cardMain}>
                   <View style={styles.cardHeader}>
                      <Text style={styles.cardTitle}>Alerte & recomandări</Text>
                      <Text style={styles.sideLink}>Vezi toate</Text>
                   </View>
                   <AlertLine icon="UserCheck" title="Prezență scăzută detectată" sub="8 jucători au sub 70% prezență în ultimele 4 săptămâni." time="Acum 15m" />
                   <AlertLine icon="AlertTriangle" title="Risc de absențe la meciuri" sub="3 meciuri au risc ridicat de absențe (> 30%)." time="Acum 32m" timeColor={RED} />
                   <AlertLine icon="Calendar" title="Încărcare ridicată a programului" sub="Săptămâna 25 mai — 31 mai are volum foarte ridicat." time="Acum 1h" />
                   <AlertLine icon="TrendingUp" title="Tendință pozitivă generală" sub="Performanța clubului a crescut cu +7% față de luna trecută." time="Acum 2h" />
                   <AlertLine icon="Zap" title="Recomandare AI" sub="Planifică o zi suplimentară de recuperare pentru U19." time="Acum 3h" />
                </View>
             </View>
          </View>

          <View style={styles.finalFooter}>
             <LucideIcons.Clock size={12} color={TEXT_TH} />
             <Text style={styles.finalFooterText}>Ultima analiză: 23 mai 2026, 10:30</Text>
          </View>

        </ScrollView>
      </View>
    </View>
  );
}

// --- Specific Components ---

const StatCard = ({ icon, label, val, trend, tColor, iColor }) => {
  const Icon = LucideIcons[icon] || LucideIcons.Circle;
  return (
    <View style={styles.statCard}>
       <View style={styles.statContent}>
          <View style={[styles.statIconWrap, { backgroundColor: iColor + "10", borderColor: iColor + "30" }]}>
             <Icon size={22} color={iColor} />
          </View>
          <View style={{ marginLeft: 16 }}>
             <Text style={styles.statLabel}>{label}</Text>
             <Text style={styles.statVal}>{val}</Text>
          </View>
       </View>
       <Text style={[styles.statTrend, { color: tColor }]}>{trend}</Text>
    </View>
  );
};

const ActionBtn = ({ icon, label, color }) => {
  const Icon = LucideIcons[icon];
  return (
    <View style={styles.actionBtn}>
       <Icon size={16} color={color} />
       <Text style={[styles.actionBtnText, { color }]}>{label}</Text>
    </View>
  );
};

const InsightItem = ({ icon, val, sub, color }) => {
  const Icon = LucideIcons[icon];
  return (
    <View style={styles.insightItem}>
       <View style={[styles.insightIconWrap, { backgroundColor: color + "15" }]}><Icon size={14} color={color} /></View>
       <View style={{ marginLeft: 14, flex: 1 }}>
          <Text style={styles.insightVal}>{val}</Text>
          <Text style={styles.insightSub}>{sub}</Text>
       </View>
    </View>
  );
};

const AlertLine = ({ icon, title, sub, time, timeColor }) => {
  const Icon = LucideIcons[icon];
  return (
    <View style={styles.alertLine}>
       <View style={[styles.alertIconWrap, { backgroundColor: "rgba(255,255,255,0.03)" }]}><Icon size={14} color={AMBER} /></View>
       <View style={{ flex: 1, marginLeft: 14 }}>
          <Text style={styles.alertTitle}>{title}</Text>
          <Text style={styles.alertSub}>{sub}</Text>
       </View>
       <Text style={[styles.alertTime, timeColor && { color: timeColor }]}>{time}</Text>
    </View>
  );
};

const PlayerCard = ({ name, group, score, trend, label, color }) => (
  <View style={styles.playerCard}>
     <View style={styles.playerAvatar}><LucideIcons.User size={20} color="white" /></View>
     <Text style={styles.playerName}>{name}</Text>
     <Text style={styles.playerGroup}>{group}</Text>
     <Text style={[styles.playerScore, { color: color }]}>{score}</Text>
     <View style={styles.playerTrendRow}>
        <LucideIcons.ArrowUpRight size={10} color={GREEN} />
        <Text style={styles.playerTrendText}>{trend} față de luna trecută</Text>
     </View>
     <View style={[styles.playerBadge, { backgroundColor: color + "15" }]}>
        <Text style={[styles.playerBadgeText, { color: color }]}>{label}</Text>
     </View>
  </View>
);

// --- SVG Icons & Charts ---

const AIBrainIcon = () => (
  <Svg width="150" height="150" viewBox="0 0 100 100">
    <Circle cx="50" cy="50" r="40" stroke={CYAN + "20"} strokeWidth="1" fill="none" strokeDasharray="2,2" />
    <Circle cx="50" cy="50" r="30" stroke={CYAN + "10"} strokeWidth="1" fill="none" />
    <G opacity="0.8">
       <Path d="M40,40 Q50,30 60,40 T60,60 Q50,70 40,60 T40,40" stroke={CYAN} strokeWidth="2" fill="none" />
       <Circle cx="50" cy="50" r="8" fill={CYAN + "20"} stroke={CYAN} strokeWidth="1" />
       <Text style={{ fontSize: 8, fill: CYAN, fontWeight: '900' }} x="44" y="53">AI</Text>
    </G>
    <G opacity="0.3">
       {[0, 45, 90, 135, 180, 225, 270, 315].map(deg => (
          <Line key={deg} x1="50" y1="50" x2={50 + 40 * Math.cos(deg * Math.PI / 180)} y2={50 + 40 * Math.sin(deg * Math.PI / 180)} stroke={CYAN} strokeWidth="0.5" />
       ))}
    </G>
  </Svg>
);

const AttendanceRiskChart = () => (
  <Svg width="100%" height="160" viewBox="0 0 300 160">
     {[0, 1, 2, 3, 4].map(i => (
        <Rect key={i} x={20 + i * 60} y={40} width="20" height="80" rx="3" fill={BLUE_ACCENT} opacity={0.8 - i * 0.1} />
     ))}
     <Path d="M20,120 Q80,100 140,110 T300,80" fill="none" stroke={VIOLET} strokeWidth="2" />
     <Circle cx="20" cy="120" r="3" fill={VIOLET} />
     <Circle cx="140" cy="110" r="3" fill={VIOLET} />
     <Circle cx="280" cy="80" r="3" fill={VIOLET} />
  </Svg>
);

const ProgressGroupsChart = () => (
  <Svg width="100%" height="160" viewBox="0 0 300 160">
     {[0, 1, 2, 3].map(i => (
        <Rect key={i} x={30 + i * 70} y={40 + i * 10} width="25" height={100 - i * 10} rx="4" fill={BLUE_ACCENT} />
     ))}
     <Line x1="0" y1="60" x2="300" y2="60" stroke={VIOLET} strokeWidth="1.5" strokeDasharray="4,4" />
  </Svg>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG_DARK },
  mainWrapper: { flex: 1 },
  mainScroll: { flex: 1 },
  scrollContent: { padding: 18, paddingBottom: 60 },

  pageHeader: { marginBottom: 30 },
  pageTitle: { color: 'white', fontSize: 26, fontWeight: '900', letterSpacing: -0.5 },
  pageSub: { color: TEXT_DIM, fontSize: 13, fontWeight: '600', marginTop: 3 },

  statsGrid: { flexDirection: 'row', gap: 14, marginBottom: 25 },
  statCard: { flex: 1, backgroundColor: CARD_BG, borderRadius: 16, padding: 18, height: 100, borderWidth: 1, borderColor: BORDER_COLOR },
  statContent: { flexDirection: 'row', alignItems: 'center' },
  statIconWrap: { width: 42, height: 42, borderRadius: 12, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  statLabel: { color: TEXT_DIM, fontSize: 11, fontWeight: '700' },
  statVal: { color: 'white', fontSize: 22, fontWeight: '900', marginTop: 3 },
  statTrend: { fontSize: 10, fontWeight: '800', marginTop: 10 },

  actionsRow: { marginBottom: 30 },
  actionsList: { flexDirection: 'row', gap: 12 },
  actionBtn: { flex: 1, height: 44, backgroundColor: "rgba(15,23,42,0.4)", borderRadius: 10, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, gap: 10, borderWidth: 1, borderColor: "rgba(255,255,255,0.06)" },
  actionBtnText: { fontSize: 12, fontWeight: '800' },

  middleGrid: { flexDirection: 'row', gap: 14, marginBottom: 20 },
  colLeft: { flex: 1.2 },
  colMiddle: { flex: 1 },
  colRight: { flex: 1 },

  cardMain: { backgroundColor: CARD_BG, borderRadius: 20, padding: 20, borderWidth: 1, borderColor: BORDER_COLOR, height: '100%' },
  cardTitle: { color: 'white', fontSize: 13.5, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 18 },
  sideLink: { color: BLUE_ACCENT, fontSize: 10.5, fontWeight: '800' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },

  insightContent: { flexDirection: 'row', alignItems: 'center' },
  insightItem: { flexDirection: 'row', alignItems: 'center' },
  insightIconWrap: { width: 28, height: 28, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  insightVal: { color: 'white', fontSize: 12, fontWeight: '800' },
  insightSub: { color: TEXT_DIM, fontSize: 10, fontWeight: '600', marginTop: 2 },
  brainIllustration: { width: 150, alignItems: 'center', justifyContent: 'center' },

  chartLegend: { flexDirection: 'row', gap: 14, marginBottom: 12 },
  legItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legDot: { width: 6, height: 6, borderRadius: 3 },
  legText: { color: TEXT_DIM, fontSize: 9.5, fontWeight: '700' },
  chartFooter: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 12, borderTopWidth: 1, borderTopColor: "rgba(255,255,255,0.03)", paddingTop: 12 },
  chartFooterText: { color: TEXT_TH, fontSize: 10, fontWeight: '700' },

  bottomGrid: { flexDirection: 'row', gap: 14, marginBottom: 20 },
  colPlayers: { flex: 2 },
  colAlerts: { flex: 1 },

  playersGrid: { flexDirection: 'row', gap: 12 },
  playerCard: { flex: 1, backgroundColor: "rgba(255,255,255,0.02)", borderRadius: 16, padding: 14, alignItems: 'center', borderWidth: 1, borderColor: "rgba(255,255,255,0.04)" },
  playerAvatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: "rgba(255,255,255,0.08)", alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  playerName: { color: 'white', fontSize: 12.5, fontWeight: '800' },
  playerGroup: { color: TEXT_DIM, fontSize: 10, fontWeight: '600', marginTop: 2 },
  playerScore: { fontSize: 24, fontWeight: '900', marginVertical: 8 },
  playerTrendRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  playerTrendText: { color: TEXT_TH, fontSize: 8.5, fontWeight: '700' },
  playerBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 5, marginTop: 12, width: '100%', alignItems: 'center' },
  playerBadgeText: { fontSize: 8.5, fontWeight: '900' },

  infoFooter: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 18, opacity: 0.6 },
  infoFooterText: { color: TEXT_TH, fontSize: 10, fontWeight: '700' },

  alertLine: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.03)" },
  alertIconWrap: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  alertTitle: { color: 'white', fontSize: 11.5, fontWeight: '800' },
  alertSub: { color: TEXT_TH, fontSize: 10, fontWeight: '600', marginTop: 1 },
  alertTime: { color: TEXT_TH, fontSize: 9.5, fontWeight: '700' },

  finalFooter: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 20, paddingBottom: 40, opacity: 0.5 },
  finalFooterText: { color: TEXT_TH, fontSize: 10.5, fontWeight: '800' }
});
