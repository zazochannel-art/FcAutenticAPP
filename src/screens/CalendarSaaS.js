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
  Image,
  Alert
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

export default function CalendarSaaS() {
  const { width } = useWindowDimensions();

  return (
    <View style={styles.container}>
      <View style={styles.mainWrapper}>
        <ScrollView style={styles.mainScroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

          {/* Page Header */}
          <View style={styles.pageHeader}>
            <View style={styles.pageTitleContainer}>
              <Text style={styles.pageTitle}>Calendar complet</Text>
              <Text style={styles.pageSub}>Vizualizează antrenamentele, meciurile, evenimentele și deadline-urile clubului.</Text>
            </View>
          </View>

          {/* Row 1: Stat Cards */}
          <View style={styles.statsGrid}>
             <StatCard icon="Calendar" label="Evenimente săptămâna aceasta" val="9" trend="↑ 2 față de săptămâna trecută" tColor={GREEN} iColor={GREEN} />
             <StatCard icon="Activity" label="Antrenamente" val="4" trend="↑ 1 față de săptămâna trecută" tColor={GREEN} iColor={VIOLET} />
             <StatCard icon="Trophy" label="Meciuri" val="2" trend="≈ la fel ca săptămâna trecută" tColor={TEXT_DIM} iColor={BLUE_ACCENT} />
             <StatCard icon="Bell" label="Reminder-uri" val="3" trend="↑ 1 față de săptămâna trecută" tColor={GREEN} iColor={AMBER} />
          </View>

          {/* Row 2: Quick Actions */}
          <View style={styles.actionsRow}>
             <View style={styles.actionsList}>
                <ActionBtn icon="CalendarPlus" label="Adaugă eveniment" color={CYAN} outline />
                <ActionBtn icon="UserPlus" label="Programează antrenament" color={VIOLET} outline />
                <ActionBtn icon="Trophy" label="Adaugă meci" color={BLUE_ACCENT} outline />
                <ActionBtn icon="Download" label="Exportă calendar" color={BLUE_ACCENT} outline />
             </View>
          </View>

          {/* Row 3: Main Monthly Calendar + Sidebar */}
          <View style={styles.mainGrid}>
             <View style={styles.colCalendar}>
                <View style={styles.cardMain}>
                   <View style={styles.calendarControls}>
                      <View style={styles.navRow}>
                         <Pressable style={styles.navBtn}><LucideIcons.ChevronLeft size={16} color="white" /></Pressable>
                         <Pressable style={styles.navBtn}><LucideIcons.ChevronRight size={16} color="white" /></Pressable>
                         <Pressable style={styles.todayBtn}><Text style={styles.todayText}>Azi</Text></Pressable>
                         <Text style={styles.currentMonth}>Mai 2026</Text>
                         <LucideIcons.ChevronDown size={14} color={TEXT_TH} style={{ marginLeft: 6 }} />
                      </View>
                      <View style={styles.filterTabs}>
                         {['Toate', 'U13', 'U16', 'U19', 'Seniori', 'Staff'].map(f => (
                            <View key={f} style={[styles.filterTab, f === 'Toate' && styles.filterTabActive]}><Text style={[styles.filterTabText, f === 'Toate' && styles.filterTabTextActive]}>{f}</Text></View>
                         ))}
                      </View>
                   </View>

                   <View style={styles.dayHeaders}>
                      {['LUN', 'MAR', 'MIE', 'JOI', 'VIN', 'SÂM', 'DUM'].map(d => <Text key={d} style={styles.dayH}>{d}</Text>)}
                   </View>

                   <View style={styles.calendarGrid}>
                      <CalendarRow days={[
                        { n: "27", empty: true }, { n: "28", empty: true },
                        { n: "29", events: [{ time: '18:00', label: 'U16 Antrenament', color: VIOLET }, { time: '19:30', label: 'Ședință staff', color: AMBER }] },
                        { n: "30", events: [{ time: '10:00', label: 'Evaluări medicale', color: GREEN }, { time: '16:00', label: 'U13 Antrenament', color: VIOLET }] },
                        { n: "1", events: [{ time: '19:00', label: 'Seniori Antrenament', color: VIOLET }] },
                        { n: "2", events: [{ time: '11:00', label: 'FC Autentic U17 vs ACS Progresul U17', color: BLUE_ACCENT, isMatch: true }] },
                        { n: "3" }
                      ]} />
                      <CalendarRow days={[
                        { n: "4", events: [{ time: '18:30', label: 'U13 Antrenament', color: VIOLET }] },
                        { n: "5", events: [{ time: '18:00', label: 'U16 Antrenament', color: VIOLET }, { time: '20:00', label: 'Ședință staff', color: AMBER }] },
                        { n: "6", events: [{ time: '18:00', label: 'U19 Antrenament', color: VIOLET }] },
                        { n: "7", events: [{ time: '19:00', label: 'Seniori Antrenament', color: VIOLET }, { time: '10:00', label: 'Evaluări medicale', color: GREEN }] },
                        { n: "8", events: [{ time: '18:30', label: 'U13 Antrenament', color: VIOLET }] },
                        { n: "9", events: [{ time: '12:00', label: 'FC Autentic U19 vs Real Succes U19', color: BLUE_ACCENT, isMatch: true }] },
                        { n: "10" }
                      ]} />
                      <CalendarRow days={[
                        { n: "11", events: [{ time: '18:30', label: 'U16 Antrenament', color: VIOLET }, { label: 'Factură chirie bază', color: CYAN, isBill: true }] },
                        { n: "12", events: [{ time: '18:00', label: 'U19 Antrenament', color: VIOLET }] },
                        { n: "13", events: [{ time: '19:30', label: 'Ședință staff', color: AMBER }] },
                        { n: "14", events: [{ time: '19:00', label: 'Seniori Antrenament', color: VIOLET }] },
                        { n: "15", events: [{ time: '12:00', label: 'Evaluări medicale', color: GREEN }, { label: 'Plată sponsori', color: CYAN, isBill: true }] },
                        { n: "16", events: [{ time: '10:00', label: 'FC Autentic Seniori vs Academia Nord', color: BLUE_ACCENT, isMatch: true }] },
                        { n: "17" }
                      ]} />
                      <CalendarRow days={[
                        { n: "18", events: [{ time: '18:30', label: 'U13 Antrenament', color: VIOLET }] },
                        { n: "19", events: [{ time: '18:00', label: 'U16 Antrenament', color: VIOLET }, { label: 'Plată taxe FRF', color: CYAN, isBill: true }] },
                        { n: "20", events: [{ time: '18:00', label: 'U19 Antrenament', color: VIOLET }] },
                        { n: "21", events: [{ time: '19:00', label: 'Seniori Antrenament', color: VIOLET }] },
                        { n: "22", events: [{ time: '19:00', label: 'Seniori Antrenament', color: VIOLET }, { time: '12:00', label: 'Evaluări medicale', color: GREEN }] },
                        { n: "23", events: [{ time: '11:00', label: 'FC Autentic U16 vs Viitorul Chișinău U16', color: BLUE_ACCENT, isMatch: true }] },
                        { n: "24" }
                      ]} />
                      <CalendarRow days={[
                        { n: "25", events: [{ time: '18:30', label: 'U13 Antrenament', color: VIOLET }, { label: 'Evaluări medicale', color: AMBER, isAlert: true }] },
                        { n: "26", events: [{ time: '18:00', label: 'U16 Antrenament', color: VIOLET }] },
                        { n: "27", events: [{ time: '18:00', label: 'U19 Antrenament', color: VIOLET }] },
                        { n: "28", events: [{ time: '19:00', label: 'Seniori Antrenament', color: VIOLET }, { label: 'Factură utilități', color: CYAN, isBill: true }] },
                        { n: "29", events: [{ time: '10:00', label: 'Ședință staff', color: AMBER }], active: true },
                        { n: "30", events: [{ time: '11:00', label: 'FC Autentic U13 vs Baza Sportivă Juniorul', color: BLUE_ACCENT, isMatch: true }] },
                        { n: "31" }
                      ]} />
                   </View>
                </View>

                {/* Bottom Row - Current Week View */}
                <View style={styles.cardMain}>
                   <View style={styles.cardHeader}>
                      <Text style={styles.cardTitle}>Săptămâna curentă</Text>
                      <Text style={styles.weekRange}>25 — 31 mai 2026</Text>
                      <Pressable style={styles.seeNextBtn}>
                         <Text style={styles.seeNextText}>Vezi săptămâna următoare</Text>
                         <LucideIcons.ChevronRight size={14} color={BLUE_ACCENT} />
                      </Pressable>
                   </View>
                   <View style={styles.weekGrid}>
                      <WeekDay n="LUN 25" events={[{ t: '18:30 U13 Antrenament', c: VIOLET }, { t: 'Evaluări medicale', c: AMBER }]} />
                      <WeekDay n="MAR 26" events={[{ t: '18:00 U16 Antrenament', c: VIOLET }]} />
                      <WeekDay n="MIE 27" events={[{ t: '18:00 U19 Antrenament', c: VIOLET }]} />
                      <WeekDay n="JOI 28" events={[{ t: '19:00 Seniori Antrenament', c: VIOLET }, { t: 'Factură utilități', c: CYAN }]} />
                      <WeekDay n="VIN 29" events={[{ t: '10:00 Ședință staff', c: AMBER }]} active extra="+2 alte evenimente" />
                      <WeekDay n="SÂM 30" events={[{ t: '11:00 FC Autentic U13 vs Baza Sportivă Juniorul', c: BLUE_ACCENT }]} />
                      <WeekDay n="DUM 31" empty="Nicio activitate planificată" />
                   </View>
                </View>
             </View>

             <View style={styles.colSidebar}>
                <View style={styles.cardSide}>
                   <View style={styles.cardHeader}>
                      <Text style={styles.cardTitle}>Agenda zilei</Text>
                      <Text style={styles.dateLabel}>29 mai 2026</Text>
                   </View>
                   <AgendaItem time="10:00" title="Ședință staff" loc="Sala de conferințe" color={AMBER} />
                   <AgendaItem time="18:30" title="U13 Antrenament" loc="Baza Sportivă Autentic — Teren 2" color={VIOLET} />
                   <AgendaItem time="19:00" title="U19 Antrenament" loc="Baza Sportivă Autentic — Teren 1" color={VIOLET} />
                </View>

                <View style={[styles.cardSide, { marginTop: 18 }]}>
                   <View style={styles.cardHeader}>
                      <Text style={styles.cardTitle}>Evenimente apropiate</Text>
                      <Text style={styles.sideLink}>Vezi toate</Text>
                   </View>
                   <UpcomingItem date="30 MAI" title="Evaluări medicale" time="Sâmbătă, 30 mai • 10:00" color={AMBER} />
                   <UpcomingItem date="31 MAI" title="FC Autentic U13 vs Baza Sportivă Juniorul" time="Duminică, 31 mai • 11:00" color={BLUE_ACCENT} />
                   <UpcomingItem date="02 IUN" title="FC Autentic U17 vs ACS Progresul U17" time="Marți, 2 iun. • 11:00" color={BLUE_ACCENT} />
                   <UpcomingItem date="04 IUN" title="Ședință staff" time="Joi, 4 iun. • 20:00" color={AMBER} />
                </View>

                <View style={[styles.cardSide, { marginTop: 18 }]}>
                   <Text style={[styles.cardTitle, { marginBottom: 18 }]}>Legendă evenimente</Text>
                   <LegendItem dot={VIOLET} label="Antrenamente" />
                   <LegendItem dot={BLUE_ACCENT} label="Meciuri" />
                   <LegendItem dot={AMBER} label="Ședințe staff" />
                   <LegendItem dot={GREEN} label="Evaluări medicale" />
                   <LegendItem dot={CYAN} label="Plăți / Facturi" />
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
       <Text style={styles.actionBtnText}>{label}</Text>
    </Pressable>
  );
};

const CalendarRow = ({ days }) => (
  <View style={styles.calRow}>
     {days.map((d, i) => (
       <View key={i} style={[styles.calCell, d.empty && styles.calCellEmpty, d.active && styles.calCellActive]}>
          <Text style={[styles.calDayNum, d.empty && { color: TEXT_TH }, d.active && { color: CYAN }]}>{d.n}</Text>
          <View style={styles.calEvents}>
             {d.events?.map((e, idx) => (
                <View key={idx} style={[styles.eventMarker, { backgroundColor: e.color + "15" }]}>
                   <View style={[styles.eventDot, { backgroundColor: e.color }]} />
                   <Text style={[styles.eventText, { color: e.color }]} numberOfLines={1}>
                      {e.time ? `${e.time} ` : ""}{e.label}
                   </Text>
                </View>
             ))}
          </View>
       </View>
     ))}
  </View>
);

const WeekDay = ({ n, events = [], active, extra, empty }) => (
  <View style={[styles.weekDayBlock, active && styles.weekDayActive]}>
     <Text style={[styles.weekDayName, active && { color: CYAN }]}>{n}</Text>
     {empty ? (
        <Text style={styles.emptyWeekText}>{empty}</Text>
     ) : (
        <View style={styles.weekEvents}>
           {events.map((e, i) => (
              <View key={i} style={styles.weekEventItem}>
                 <View style={[styles.weekEventDot, { backgroundColor: e.c }]} />
                 <Text style={styles.weekEventText} numberOfLines={1}>{e.t}</Text>
              </View>
           ))}
           {extra && <Text style={styles.weekExtraText}>{extra}</Text>}
        </View>
     )}
  </View>
);

const AgendaItem = ({ time, title, loc, color }) => (
  <View style={styles.agendaLine}>
     <Text style={styles.agendaTime}>{time}</Text>
     <View style={[styles.agendaMarker, { backgroundColor: color }]} />
     <View style={{ flex: 1 }}>
        <Text style={styles.agendaTitle}>{title}</Text>
        <Text style={styles.agendaLoc}>{loc}</Text>
     </View>
  </View>
);

const UpcomingItem = ({ date, title, time, color }) => (
  <View style={styles.upcomingItem}>
     <View style={styles.upDateBlock}>
        <Text style={styles.upDateNum}>{date.split(' ')[0]}</Text>
        <Text style={styles.upDateMonth}>{date.split(' ')[1]}</Text>
     </View>
     <View style={[styles.upMarker, { backgroundColor: color }]} />
     <View style={{ flex: 1, marginLeft: 12 }}>
        <Text style={styles.upTitle} numberOfLines={1}>{title}</Text>
        <Text style={styles.upTime}>{time}</Text>
     </View>
  </View>
);

const LegendItem = ({ dot, label }) => (
  <View style={styles.legendItem}>
     <View style={[styles.legendDot, { backgroundColor: dot }]} />
     <Text style={styles.legendText}>{label}</Text>
  </View>
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
  actionBtnText: { color: 'white', fontSize: 11.5, fontWeight: '800' },

  mainGrid: { flexDirection: 'row', gap: 14, marginBottom: 20 },
  colCalendar: { flex: 3 },
  colSidebar: { flex: 1.2 },

  cardMain: { backgroundColor: CARD_BG, borderRadius: 20, padding: 20, borderWidth: 1, borderColor: BORDER_COLOR, marginBottom: 18 },
  cardSide: { backgroundColor: CARD_BG, borderRadius: 20, padding: 18, borderWidth: 1, borderColor: BORDER_COLOR },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  cardTitle: { color: 'white', fontSize: 13.5, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 0.8 },
  sideLink: { color: BLUE_ACCENT, fontSize: 10.5, fontWeight: '800' },

  calendarControls: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  navRow: { flexDirection: 'row', alignItems: 'center' },
  navBtn: { width: 30, height: 30, backgroundColor: "rgba(255,255,255,0.04)", borderRadius: 8, alignItems: 'center', justifyContent: 'center', marginRight: 8 },
  todayBtn: { paddingHorizontal: 12, height: 30, backgroundColor: "rgba(255,255,255,0.04)", borderRadius: 8, alignItems: 'center', justifyContent: 'center', marginHorizontal: 8 },
  todayText: { color: 'white', fontSize: 11, fontWeight: '800' },
  currentMonth: { color: 'white', fontSize: 15, fontWeight: '900', marginLeft: 10 },

  filterTabs: { flexDirection: 'row', gap: 6, backgroundColor: "rgba(255,255,255,0.03)", padding: 3, borderRadius: 10 },
  filterTab: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 8 },
  filterTabActive: { backgroundColor: BLUE_ACCENT },
  filterTabText: { color: TEXT_DIM, fontSize: 10.5, fontWeight: '800' },
  filterTabTextActive: { color: 'white' },

  dayHeaders: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.05)", paddingBottom: 10, marginBottom: 5 },
  dayH: { flex: 1, color: TEXT_TH, fontSize: 9.5, fontWeight: '900', textAlign: 'center' },

  calendarGrid: {},
  calRow: { flexDirection: 'row', height: 110, borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.03)" },
  calCell: { flex: 1, borderRightWidth: 1, borderRightColor: "rgba(255,255,255,0.03)", padding: 6 },
  calCellEmpty: { backgroundColor: "rgba(255,255,255,0.01)" },
  calCellActive: { backgroundColor: BLUE_ACCENT + "05" },
  calDayNum: { color: TEXT_DIM, fontSize: 11.5, fontWeight: '800' },
  calEvents: { marginTop: 6, gap: 3 },
  eventMarker: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 5, paddingVertical: 2, borderRadius: 4 },
  eventDot: { width: 5, height: 5, borderRadius: 2.5, marginRight: 5 },
  eventText: { fontSize: 8.5, fontWeight: '700' },

  weekRange: { color: TEXT_TH, fontSize: 11, fontWeight: '700' },
  seeNextBtn: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  seeNextText: { color: BLUE_ACCENT, fontSize: 11, fontWeight: '900' },
  weekGrid: { flexDirection: 'row', gap: 10, marginTop: 10 },
  weekDayBlock: { flex: 1, backgroundColor: "rgba(255,255,255,0.02)", borderRadius: 14, padding: 12, borderWidth: 1, borderColor: "rgba(255,255,255,0.04)" },
  weekDayActive: { borderColor: BLUE_ACCENT + "30", backgroundColor: BLUE_ACCENT + "08" },
  weekDayName: { color: TEXT_TH, fontSize: 10, fontWeight: '900', marginBottom: 10 },
  emptyWeekText: { color: TEXT_TH, fontSize: 8.5, fontWeight: '600', lineHeight: 14 },
  weekEvents: { gap: 6 },
  weekEventItem: { flexDirection: 'row', alignItems: 'center' },
  weekEventDot: { width: 4, height: 4, borderRadius: 2, marginRight: 6 },
  weekEventText: { color: 'white', fontSize: 8.5, fontWeight: '700' },
  weekExtraText: { color: BLUE_ACCENT, fontSize: 8, fontWeight: '800', marginTop: 4 },

  dateLabel: { color: TEXT_TH, fontSize: 11, fontWeight: '800' },
  agendaLine: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.03)" },
  agendaTime: { color: TEXT_TH, fontSize: 10.5, fontWeight: '900', width: 45 },
  agendaMarker: { width: 3, height: 24, borderRadius: 2, marginHorizontal: 12 },
  agendaTitle: { color: 'white', fontSize: 11.5, fontWeight: '800' },
  agendaLoc: { color: TEXT_TH, fontSize: 9.5, fontWeight: '700', marginTop: 2 },

  upcomingItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.03)" },
  upDateBlock: { width: 36, alignItems: 'center' },
  upDateNum: { color: 'white', fontSize: 13, fontWeight: '900' },
  upDateMonth: { color: BLUE_ACCENT, fontSize: 7.5, fontWeight: '900' },
  upMarker: { width: 5, height: 5, borderRadius: 2.5, marginHorizontal: 12 },
  upTitle: { color: 'white', fontSize: 11, fontWeight: '800' },
  upTime: { color: TEXT_TH, fontSize: 9, fontWeight: '700', marginTop: 2 },

  legendItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  legendDot: { width: 8, height: 8, borderRadius: 4, marginRight: 12 },
  legendText: { color: TEXT_DIM, fontSize: 11, fontWeight: '700' }
});
