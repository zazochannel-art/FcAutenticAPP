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
  Image,
  Alert
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

export default function FinancesSaaS() {
  const { width } = useWindowDimensions();

  return (
    <View style={styles.container}>
      <View style={styles.mainWrapper}>
        <ScrollView style={styles.mainScroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

          {/* Page Header */}
          <View style={styles.pageHeader}>
            <View style={styles.pageTitleContainer}>
              <Text style={styles.pageTitle}>Finanțe</Text>
              <Text style={styles.pageSub}>Gestionează cotizațiile, cheltuielile, sponsorii și fluxul financiar al clubului.</Text>
            </View>
          </View>

          {/* Row 1: Stat Cards */}
          <View style={styles.statsGrid}>
             <StatCard icon="Wallet" label="Încasări luna aceasta" val="8.400 lei" trend="↑ 12% față de luna trecută" tColor={GREEN} iColor={BLUE_ACCENT} />
             <StatCard icon="AlertCircle" label="Restanțe" val="2.100 lei" trend="↑ 8% față de luna trecută" tColor={RED} iColor={VIOLET} />
             <StatCard icon="ArrowDownCircle" label="Cheltuieli" val="3.600 lei" trend="↓ 5% față de luna trecută" tColor={GREEN} iColor={BLUE_ACCENT} />
             <StatCard icon="Landmark" label="Sold disponibil" val="12.900 lei" trend="↑ 16% față de luna trecută" tColor={GREEN} iColor={GREEN} />
          </View>

          {/* Row 2: Quick Actions */}
          <View style={styles.actionsRow}>
             <Text style={styles.sectionLabel}>Acțiuni rapide</Text>
             <View style={styles.actionsList}>
                <ActionBtn icon="PlusCircle" label="Înregistrează plată" color={CYAN} outline />
                <ActionBtn icon="FileMinus" label="Adaugă cheltuială" color={VIOLET} outline />
                <ActionBtn icon="BarChart3" label="Generează raport" color={BLUE_ACCENT} outline />
                <ActionBtn icon="Send" label="Trimite reminder" color={AMBER} outline />
             </View>
          </View>

          {/* Row 3: Middle Grid */}
          <View style={styles.middleGrid}>
             <View style={styles.colLeft}>
                <View style={styles.cardMain}>
                   <View style={styles.cardHeader}>
                      <Text style={styles.cardTitle}>Cotizații jucători</Text>
                      <View style={styles.tableControls}>
                         <View style={styles.smallSearch}>
                            <LucideIcons.Search size={14} color={TEXT_TH} />
                            <TextInput placeholder="Caută jucător..." placeholderTextColor={TEXT_TH} style={styles.smallSearchInput} />
                         </View>
                         <View style={styles.tabFilters}>
                            {['Toți', 'U13', 'U16', 'U19', 'Seniori'].map(f => (
                               <View key={f} style={[styles.tabF, f === 'Toți' && styles.tabFActive]}><Text style={[styles.tabFText, f === 'Toți' && styles.tabFTextActive]}>{f}</Text></View>
                            ))}
                         </View>
                      </View>
                   </View>

                   <View style={styles.tableHeader}>
                      <Text style={[styles.th, { flex: 2 }]}>Jucător</Text>
                      <Text style={[styles.th, { flex: 1 }]}>Grupa</Text>
                      <Text style={[styles.th, { flex: 1.2 }]}>Sumă</Text>
                      <Text style={[styles.th, { flex: 1.5 }]}>Scadență</Text>
                      <Text style={[styles.th, { flex: 1, textAlign: 'center' }]}>Status</Text>
                      <Text style={[styles.th, { flex: 2 }]}>Ultimele plăți</Text>
                   </View>

                   <FinanceRow name="Mihai Ionescu" group="U16" amount="200 lei" date="25 mai 2026" status="Plătit" sColor={GREEN} history="25 apr. 2026 - 200 lei" />
                   <FinanceRow name="Radu Ștefan" group="U19" amount="200 lei" date="25 mai 2026" status="Parțial" sColor={AMBER} history="10 apr. 2026 - 100 lei" />
                   <FinanceRow name="David Munteanu" group="U16" amount="200 lei" date="25 mai 2026" status="Restant" sColor={RED} history="—" />
                   <FinanceRow name="Andrei Ceban" group="U13" amount="200 lei" date="25 mai 2026" status="Plătit" sColor={GREEN} history="20 apr. 2026 - 200 lei" />
                   <FinanceRow name="Vlad Marinescu" group="Seniori" amount="250 lei" date="25 mai 2026" status="Parțial" sColor={AMBER} history="12 apr. 2026 - 150 lei" />
                   <FinanceRow name="Luca Popa" group="U13" amount="150 lei" date="25 mai 2026" status="Plătit" sColor={GREEN} history="—" />
                   <FinanceRow name="Ștefan Ioniță" group="U19" amount="200 lei" date="25 mai 2026" status="Plătit" sColor={GREEN} history="22 apr. 2026 - 200 lei" />
                   <FinanceRow name="Ionuț Vasilache" group="U19" amount="200 lei" date="25 mai 2026" status="Parțial" sColor={AMBER} history="05 apr. 2026 - 100 lei" />

                   <View style={styles.pagination}>
                      <Text style={styles.paginationInfo}>1—8 din 46 jucători</Text>
                      <View style={styles.pageDots}>
                         <LucideIcons.ChevronLeft size={16} color={TEXT_TH} />
                         <View style={styles.pageDotActive}><Text style={styles.pageTextActive}>1</Text></View>
                         <View style={styles.pageDot}><Text style={styles.pageText}>2</Text></View>
                         <View style={styles.pageDot}><Text style={styles.pageText}>3</Text></View>
                         <Text style={styles.pageText}>...</Text>
                         <View style={styles.pageDot}><Text style={styles.pageText}>6</Text></View>
                         <LucideIcons.ChevronRight size={16} color={TEXT_DIM} />
                      </View>
                   </View>
                </View>
             </View>

             <View style={styles.colRight}>
                <View style={styles.cardSide}>
                   <View style={styles.cardHeader}>
                      <Text style={styles.cardTitle}>Cheltuieli recente</Text>
                      <Text style={styles.sideLink}>Vezi toate</Text>
                   </View>
                   <View style={styles.expenseHeader}>
                      <Text style={[styles.th, { flex: 1.5 }]}>Categorie</Text>
                      <Text style={[styles.th, { flex: 2 }]}>Descriere</Text>
                      <Text style={[styles.th, { flex: 1 }]}>Sumă</Text>
                      <Text style={[styles.th, { flex: 1.2 }]}>Data</Text>
                      <Text style={[styles.th, { flex: 1.2, textAlign: 'center' }]}>Aprobare</Text>
                   </View>
                   <ExpenseRow icon="Shirt" label="Echipamente" desc="Tricouri meci (set complet)" sum="1.200 lei" date="23 mai 2026" status="Aprobat" sColor={GREEN} color={VIOLET} />
                   <ExpenseRow icon="Bus" label="Transport" desc="Deplasare meci vs ACS Progresul" sum="650 lei" date="22 mai 2026" status="Aprobat" sColor={GREEN} color={BLUE_ACCENT} />
                   <ExpenseRow icon="MapPin" label="Terenuri" desc="Închiriere teren mai 2026" sum="800 lei" date="21 mai 2026" status="Aprobat" sColor={GREEN} color={AMBER} />
                   <ExpenseRow icon="HeartPulse" label="Medical" desc="Trusă medicală & consumabile" sum="350 lei" date="19 mai 2026" status="Așteptare" sColor={AMBER} color={RED} />
                   <ExpenseRow icon="Users" label="Staff" desc="Plată antrenor (mai 2026)" sum="600 lei" date="18 mai 2026" status="Aprobat" sColor={GREEN} color={GREEN} />
                </View>

                <View style={[styles.cardSide, { marginTop: 18 }]}>
                   <View style={styles.cardHeader}>
                      <Text style={styles.cardTitle}>Surse de venit</Text>
                      <Text style={styles.sideLink}>Vezi raport</Text>
                   </View>
                   <View style={styles.donutArea}>
                      <View style={styles.donutWrapper}>
                        <SourcesDonut />
                        <View style={styles.donutLabelWrap}>
                           <Text style={styles.donutSub}>Total venituri (mai)</Text>
                           <Text style={styles.donutVal}>10.400 lei</Text>
                           <Text style={[styles.donutTrend, { color: GREEN }]}>↑ 14% față de luna trecută</Text>
                        </View>
                      </View>
                      <View style={styles.legend}>
                         <LegendItem dot={BLUE_ACCENT} label="Cotizații" count="6.200 lei" per="60%" />
                         <LegendItem dot={VIOLET} label="Sponsori" count="2.200 lei" per="22%" />
                         <LegendItem dot={CYAN} label="Evenimente" count="1.200 lei" per="12%" />
                         <LegendItem dot={AMBER} label="Donații" count="800 lei" per="8%" />
                      </View>
                   </View>
                </View>
             </View>
          </View>

          {/* Row 4: Bottom Grid */}
          <View style={styles.bottomGrid}>
             <View style={{ flex: 1.8 }}>
                <View style={styles.cardMain}>
                   <View style={styles.cardHeader}>
                      <Text style={styles.cardTitle}>Venituri vs cheltuieli</Text>
                      <View style={styles.chartTabs}>
                         <View style={styles.chartLegItem}><View style={[styles.revDot, { backgroundColor: BLUE_ACCENT }]} /><Text style={styles.revLegText}>Venituri</Text></View>
                         <View style={styles.chartLegItem}><View style={[styles.revDot, { backgroundColor: VIOLET }]} /><Text style={styles.revLegText}>Cheltuieli</Text></View>
                         <View style={styles.chartLegItem}><View style={[styles.revDot, { backgroundColor: GREEN, height: 2, borderRadius: 0 }]} /><Text style={styles.revLegText}>Sold lunar</Text></View>
                         <Text style={[styles.sideLink, { marginLeft: 16 }]}>Vezi detalii</Text>
                      </View>
                   </View>
                   <View style={styles.mainChartArea}>
                      <FinanceMixedChart />
                   </View>
                   <View style={styles.updateFooter}>
                      <LucideIcons.Clock size={12} color={TEXT_TH} />
                      <Text style={styles.updateText}>Ultima actualizare: 23 mai 2026, 10:30</Text>
                   </View>
                </View>
             </View>

             <View style={{ flex: 1 }}>
                <View style={styles.cardMain}>
                   <View style={styles.cardHeader}>
                      <Text style={styles.cardTitle}>Obligații scadente</Text>
                      <Text style={styles.sideLink}>Vezi toate</Text>
                   </View>
                   <ObligationLine date="25 MAI" title="Cotizații restante jucători" sub="14 plăți restante" sum="2.100 lei" color={RED} />
                   <ObligationLine date="27 MAI" title="Deplasare meci vs FC Juniorul" sub="Transport echipă" sum="650 lei" />
                   <ObligationLine date="31 MAI" title="Închiriere teren iunie 2026" sub="Baza Sportivă Autentic" sum="800 lei" />
                   <ObligationLine date="01 IUN" title="Plată cabinet medical" sub="Servicii medicale" sum="350 lei" countdown="în 9 zile" />
                   <ObligationLine date="05 IUN" title="Plată antrenor iunie 2026" sub="Contract staff tehnic" sum="600 lei" countdown="în 13 zile" />
                </View>
             </View>
          </View>

        </ScrollView>
      </View>
    </View>
  );
}

// --- Sub-Components ---

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

const ActionBtn = ({ icon, label, color, onPress }) => {
  const Icon = LucideIcons[icon];
  return (
    <Pressable onPress={onPress || (() => Alert.alert("În lucru", `${label} va fi conectat în următoarea etapă.`))} style={styles.actionBtn}>
       <Icon size={16} color={color} />
       <Text style={[styles.actionBtnText, { color }]}>{label}</Text>
    </Pressable>
  );
};

const FinanceRow = ({ name, group, amount, date, status, sColor, history }) => (
  <View style={styles.tableRow}>
     <View style={{ flex: 2, flexDirection: 'row', alignItems: 'center' }}>
        <View style={styles.miniAvatar}><LucideIcons.User size={14} color="white" /></View>
        <Text style={[styles.rowMainText, { marginLeft: 12 }]}>{name}</Text>
     </View>
     <Text style={[styles.rowSubText, { flex: 1 }]}>{group}</Text>
     <Text style={[styles.rowMainText, { flex: 1.2 }]}>{amount}</Text>
     <Text style={[styles.rowSubText, { flex: 1.5 }]}>{date}</Text>
     <View style={{ flex: 1, alignItems: 'center' }}>
        <View style={[styles.badge, { backgroundColor: sColor + "15" }]}><Text style={[styles.badgeText, { color: sColor }]}>{status}</Text></View>
     </View>
     <View style={{ flex: 2, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <View style={[styles.histDot, { backgroundColor: sColor }]} />
        <Text style={styles.rowSubText}>{history}</Text>
        <LucideIcons.MoreVertical size={14} color={TEXT_TH} style={{ marginLeft: 'auto' }} />
     </View>
  </View>
);

const ExpenseRow = ({ icon, label, desc, sum, date, status, sColor, color }) => {
  const Icon = LucideIcons[icon];
  return (
    <View style={styles.expenseRow}>
       <View style={{ flex: 1.5, flexDirection: 'row', alignItems: 'center' }}>
          <View style={[styles.expIconWrap, { backgroundColor: color + "15" }]}><Icon size={14} color={color} /></View>
          <Text style={[styles.rowSubText, { marginLeft: 12 }]}>{label}</Text>
       </View>
       <Text style={[styles.rowMainText, { flex: 2 }]} numberOfLines={1}>{desc}</Text>
       <Text style={[styles.rowMainText, { flex: 1 }]}>{sum}</Text>
       <Text style={[styles.rowSubText, { flex: 1.2 }]}>{date}</Text>
       <View style={{ flex: 1.2, alignItems: 'center' }}>
          <View style={[styles.badge, { backgroundColor: sColor + "10", minWidth: 55 }]}><Text style={[styles.badgeText, { color: sColor, fontSize: 7.5 }]}>{status}</Text></View>
       </View>
    </View>
  );
};

const ObligationLine = ({ date, title, sub, sum, color = TEXT_DIM, countdown }) => (
  <View style={styles.obligLine}>
     <View style={styles.dateBlock}>
        <Text style={styles.dateNum}>{date.split(' ')[0]}</Text>
        <Text style={styles.dateMonth}>{date.split(' ')[1]}</Text>
     </View>
     <View style={[styles.obligIcon, { backgroundColor: color + "15" }]}><LucideIcons.Calendar size={14} color={color} /></View>
     <View style={{ flex: 1, marginLeft: 14 }}>
        <Text style={styles.rowMainText}>{title}</Text>
        <Text style={styles.rowSubText}>{sub}</Text>
     </View>
     <View style={{ alignItems: 'flex-end' }}>
        <Text style={[styles.rowMainText, { color: color === RED ? RED : 'white' }]}>{sum}</Text>
        {countdown && <Text style={styles.countdownText}>{countdown}</Text>}
     </View>
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

// --- SVG Components ---

const SourcesDonut = () => (
  <Svg width="140" height="140" viewBox="0 0 100 100">
    <Circle cx="50" cy="50" r="40" stroke="#1e293b" strokeWidth="10" fill="none" />
    <Circle cx="50" cy="50" r="40" stroke={BLUE_ACCENT} strokeWidth="10" fill="none" strokeDasharray="251.2" strokeDashoffset="100" transform="rotate(-90 50 50)" />
    <Circle cx="50" cy="50" r="40" stroke={VIOLET} strokeWidth="10" fill="none" strokeDasharray="251.2" strokeDashoffset="190" transform="rotate(54 50 50)" />
    <Circle cx="50" cy="50" r="40" stroke={CYAN} strokeWidth="10" fill="none" strokeDasharray="251.2" strokeDashoffset="220" transform="rotate(144 50 50)" />
    <Circle cx="50" cy="50" r="40" stroke={AMBER} strokeWidth="10" fill="none" strokeDasharray="251.2" strokeDashoffset="230" transform="rotate(216 50 50)" />
  </Svg>
);

const FinanceMixedChart = () => (
  <Svg width="100%" height="220" viewBox="0 0 500 220">
     <G opacity="0.05">
        {[0, 1, 2, 3, 4].map(i => <Line key={i} x1="0" y1={i * 45 + 20} x2="500" y2={i * 45 + 20} stroke="white" strokeWidth="1" />)}
     </G>
     {[0, 1, 2, 3, 4, 5, 6].map(i => (
        <G key={i} transform={`translate(${20 + i * 70}, 0)`}>
           <Rect x="15" y={100 - i * 5} width="12" height={100 + i * 5} rx="2" fill={BLUE_ACCENT} opacity="0.8" />
           <Rect x="30" y={140 - i * 3} width="12" height={60 + i * 3} rx="2" fill={VIOLET} opacity="0.8" />
        </G>
     ))}
     <Path d="M40,160 Q110,150 180,170 T320,130 T460,90" fill="none" stroke={GREEN} strokeWidth="2" />
     {[40, 180, 320, 460].map((x, i) => <Circle key={i} cx={x} cy={160 - i * 20} r="3" fill={GREEN} />)}
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
  statTrend: { fontSize: 9.5, fontWeight: '800', marginTop: 10 },

  actionsRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 30 },
  sectionLabel: { color: TEXT_TH, fontSize: 10, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1.2, marginRight: 18 },
  actionsList: { flex: 1, flexDirection: 'row', gap: 12 },
  actionBtn: { flex: 1, height: 44, backgroundColor: "rgba(15,23,42,0.4)", borderRadius: 10, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, gap: 10, borderWidth: 1, borderColor: "rgba(255,255,255,0.06)" },
  actionBtnText: { fontSize: 12, fontWeight: '800' },

  middleGrid: { flexDirection: 'row', gap: 14, marginBottom: 20 },
  colLeft: { flex: 1.8 },
  colRight: { flex: 1 },

  cardMain: { backgroundColor: CARD_BG, borderRadius: 20, padding: 20, borderWidth: 1, borderColor: BORDER_COLOR, marginBottom: 16 },
  cardSide: { backgroundColor: CARD_BG, borderRadius: 20, padding: 18, borderWidth: 1, borderColor: BORDER_COLOR },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  cardTitle: { color: 'white', fontSize: 13.5, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 0.8 },
  sideLink: { color: BLUE_ACCENT, fontSize: 10.5, fontWeight: '800' },

  tableControls: { flexDirection: 'row', gap: 10 },
  smallSearch: { width: 150, height: 30, backgroundColor: "rgba(255,255,255,0.03)", borderRadius: 7, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, borderWidth: 1, borderColor: "rgba(255,255,255,0.05)" },
  smallSearchInput: { flex: 1, color: 'white', fontSize: 10.5, fontWeight: '600', marginLeft: 6 },
  tabFilters: { flexDirection: 'row', gap: 6, backgroundColor: "rgba(255,255,255,0.03)", padding: 3, borderRadius: 8 },
  tabF: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  tabFActive: { backgroundColor: BLUE_ACCENT },
  tabFText: { color: TEXT_TH, fontSize: 10, fontWeight: '800' },
  tabFTextActive: { color: 'white' },

  tableHeader: { flexDirection: 'row', paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.05)", marginBottom: 4 },
  th: { color: TEXT_TH, fontSize: 8.5, fontWeight: "900", textTransform: "uppercase", letterSpacing: 1 },
  tableRow: { flexDirection: 'row', alignItems: 'center', height: 52, borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.03)" },
  miniAvatar: { width: 26, height: 26, borderRadius: 13, backgroundColor: "rgba(255,255,255,0.08)", alignItems: 'center', justifyContent: 'center' },
  rowMainText: { color: 'white', fontSize: 11.5, fontWeight: '800' },
  rowSubText: { color: TEXT_TH, fontSize: 10.5, fontWeight: '600' },
  badge: { paddingHorizontal: 7, paddingVertical: 2.5, borderRadius: 4, minWidth: 50, alignItems: 'center' },
  badgeText: { fontSize: 7.5, fontWeight: '900', textTransform: 'uppercase' },
  histDot: { width: 6, height: 6, borderRadius: 3, marginRight: 2 },

  pagination: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 15 },
  paginationInfo: { color: TEXT_TH, fontSize: 10, fontWeight: '800' },
  pageDots: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  pageDotActive: { width: 20, height: 20, borderRadius: 5, backgroundColor: BLUE_ACCENT + "20", borderWidth: 1, borderColor: BLUE_ACCENT + "40", alignItems: 'center', justifyContent: 'center' },
  pageDot: { width: 20, height: 20, alignItems: 'center', justifyContent: 'center' },
  pageTextActive: { color: BLUE_ACCENT, fontSize: 9.5, fontWeight: '900' },
  pageText: { color: TEXT_TH, fontSize: 9.5, fontWeight: '900' },

  expenseHeader: { flexDirection: 'row', paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.05)", marginBottom: 6 },
  expenseRow: { flexDirection: 'row', alignItems: 'center', height: 44, borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.03)" },
  expIconWrap: { width: 26, height: 26, borderRadius: 7, alignItems: 'center', justifyContent: 'center' },

  donutArea: { flexDirection: 'row', alignItems: 'center', gap: 18 },
  donutWrapper: { width: 140, height: 140, alignItems: 'center', justifyContent: 'center' },
  donutLabelWrap: { position: 'absolute', alignItems: 'center', justifyContent: 'center' },
  donutVal: { color: 'white', fontSize: 16, fontWeight: '900' },
  donutSub: { color: TEXT_TH, fontSize: 7.5, fontWeight: '800', marginBottom: 2 },
  donutTrend: { fontSize: 8, fontWeight: '800', marginTop: 2 },
  legend: { flex: 1, gap: 8 },
  legendItem: { flexDirection: 'row', alignItems: 'center' },
  legendDot: { width: 5.5, height: 5.5, borderRadius: 2.75, marginRight: 8 },
  legendLabel: { flex: 1, color: TEXT_DIM, fontSize: 10.5, fontWeight: '700' },
  legendCount: { color: 'white', fontSize: 10.5, fontWeight: '800', marginRight: 4 },
  legendPer: { color: TEXT_TH, fontSize: 9.5, fontWeight: '700' },

  bottomGrid: { flexDirection: 'row', gap: 14, marginBottom: 20 },
  chartTabs: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  chartLegItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  revDot: { width: 7, height: 7, borderRadius: 3.5 },
  revLegText: { color: TEXT_DIM, fontSize: 9.5, fontWeight: '700' },
  mainChartArea: { height: 220, marginTop: 10, alignItems: 'center', justifyContent: 'center' },

  obligLine: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.03)" },
  dateBlock: { width: 36, alignItems: 'center' },
  dateNum: { color: 'white', fontSize: 13, fontWeight: '900' },
  dateMonth: { color: BLUE_ACCENT, fontSize: 7.5, fontWeight: '900' },
  obligIcon: { width: 26, height: 26, borderRadius: 7, alignItems: 'center', justifyContent: 'center' },
  countdownText: { color: TEXT_TH, fontSize: 8.5, fontWeight: '700', marginTop: 2 },

  updateFooter: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 12, opacity: 0.6 },
  updateText: { color: TEXT_TH, fontSize: 8.5, fontWeight: '800' }
});
