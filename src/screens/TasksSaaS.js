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

export default function TasksSaaS() {
  const { width } = useWindowDimensions();

  return (
    <View style={styles.container}>
      <View style={styles.mainWrapper}>
        <ScrollView style={styles.mainScroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

          {/* Page Header */}
          <View style={styles.pageHeader}>
            <View style={styles.pageTitleContainer}>
              <Text style={styles.pageTitle}>Sarcini</Text>
              <Text style={styles.pageSub}>Organizează activitățile clubului și urmărește progresul echipei.</Text>
            </View>
          </View>

          {/* Row 1: Stat Cards with Progress Rings */}
          <View style={styles.statsGrid}>
             <TaskStatCard icon="ListChecks" label="Total sarcini" val="24" trend="↑ 9 față de luna trecută" per={100} color={BLUE_ACCENT} />
             <TaskStatCard icon="AlertCircle" label="Urgente" val="5" trend="↓ 2 scad azi" per={20} color={RED} />
             <TaskStatCard icon="Clock" label="În progres" val="7" trend="↑ 1 față de luna trecută" per={30} color={AMBER} />
             <TaskStatCard icon="CheckCircle" label="Finalizate" val="12" trend="↑ 4 față de luna trecută" per={50} color={GREEN} />
          </View>

          {/* Row 2: Quick Actions */}
          <View style={styles.actionsRow}>
             <View style={styles.actionsList}>
                <ActionBtn icon="PlusCircle" label="Creează sarcină" color={CYAN} outline />
                <ActionBtn icon="UserPlus" label="Atribuie responsabil" color={VIOLET} outline />
                <ActionBtn icon="Calendar" label="Setează termen" color={BLUE_ACCENT} outline />
                <ActionBtn icon="Send" label="Trimite update" color={AMBER} outline />
             </View>
          </View>

          {/* Row 3: Kanban Layout + Sidebar */}
          <View style={styles.mainGrid}>
             <View style={styles.colKanban}>
                <View style={styles.kanbanContainer}>
                   {/* Column 1: De făcut */}
                   <KanbanCol title="De făcut" count={7} color={CYAN}>
                      <TaskCard
                        title="Confirmare lot pentru meci cu ACS Progresul"
                        priority="RIDICATĂ" pColor={RED}
                        date="25 mai 2026"
                        group="U19" gColor={VIOLET}
                      />
                      <TaskCard
                        title="Plată chirie teren Baza Sportivă Nord"
                        priority="MEDIE" pColor={AMBER}
                        date="26 mai 2026"
                        group="Finanțe" gColor={BLUE_ACCENT}
                      />
                      <TaskCard
                        title="Comandă echipament de prezentare staff"
                        priority="SCĂZUTĂ" pColor={GREEN}
                        date="27 mai 2026"
                        group="Staff" gColor={BLUE_ACCENT}
                      />
                      <TaskCard
                        title="Verificare acte medicale lot U16"
                        priority="SCĂZUTĂ" pColor={GREEN}
                        date="28 mai 2026"
                        group="U16" gColor={VIOLET}
                      />
                   </KanbanCol>

                   {/* Column 2: În progres */}
                   <KanbanCol title="În progres" count={5} color={AMBER}>
                      <TaskCard
                        title="Organizare transport deplasare la Turneul Cluj"
                        priority="MEDIE" pColor={AMBER}
                        date="25 mai 2026"
                        group="U16" gColor={VIOLET}
                      />
                      <TaskCard
                        title="Actualizare plan antrenament săptămânal"
                        priority="SCĂZUTĂ" pColor={GREEN}
                        date="26 mai 2026"
                        group="Staff" gColor={BLUE_ACCENT}
                      />
                      <TaskCard
                        title="Convocare staff pentru ședința tehnică de luni"
                        priority="RIDICATĂ" pColor={RED}
                        date="26 mai 2026"
                        group="Staff" gColor={BLUE_ACCENT}
                      />
                      <TaskCard
                        title="Plată prime de performanță luna aprilie"
                        priority="MEDIE" pColor={AMBER}
                        date="28 mai 2026"
                        group="Finanțe" gColor={BLUE_ACCENT}
                      />
                   </KanbanCol>

                   {/* Column 3: În așteptare */}
                   <KanbanCol title="În așteptare" count={4} color={VIOLET}>
                      <TaskCard
                        title="Aprobare buget suplimentar pentru cantonament"
                        priority="MEDIE" pColor={AMBER}
                        date="29 mai 2026"
                        group="Finanțe" gColor={BLUE_ACCENT}
                      />
                      <TaskCard
                        title="Livrare echipament sportiv (comanda 1247)"
                        priority="SCĂZUTĂ" pColor={GREEN}
                        date="30 mai 2026"
                        group="Staff" gColor={BLUE_ACCENT}
                      />
                      <TaskCard
                        title="Răspuns la oferte parteneriat locali"
                        priority="SCĂZUTĂ" pColor={GREEN}
                        date="31 mai 2026"
                        group="Staff" gColor={BLUE_ACCENT}
                      />
                      <TaskCard
                        title="Definitivare program meciuri amicale vară"
                        priority="SCĂZUTĂ" pColor={GREEN}
                        date="1 iun 2026"
                        group="Seniori" gColor={VIOLET}
                      />
                   </KanbanCol>

                   {/* Column 4: Finalizate */}
                   <KanbanCol title="Finalizate" count={8} color={GREEN}>
                      <TaskCard
                        title="Înscriere la turneul Elite Cup U17"
                        date="18 mai 2026"
                        group="U17" gColor={VIOLET}
                        isDone
                      />
                      <TaskCard
                        title="Actualizare contracte jucători"
                        date="19 mai 2026"
                        group="Finanțe" gColor={BLUE_ACCENT}
                        isDone
                      />
                      <TaskCard
                        title="Reparație instalație nocturnă teren 2"
                        date="20 mai 2026"
                        group="Staff" gColor={BLUE_ACCENT}
                        isDone
                      />
                      <TaskCard
                        title="Confirmare cazare cantonament"
                        date="21 mai 2026"
                        group="U19" gColor={VIOLET}
                        isDone
                      />
                   </KanbanCol>
                </View>
             </View>

             {/* Right Sidebar */}
             <View style={styles.colSidebar}>
                <View style={styles.cardSide}>
                   <View style={styles.cardHeader}>
                      <Text style={styles.cardTitle}>Termene apropiate</Text>
                      <Text style={styles.sideLink}>Vezi toate</Text>
                   </View>
                   <DeadlineItem title="Confirmare lot U19 vs ACS Progresul" sub="R. Dumitrescu • U19" time="Azi" date="25 mai" color={RED} />
                   <DeadlineItem title="Plată chirie teren Baza Sportivă Nord" sub="A. Popescu • Finanțe" time="Mâine" date="26 mai" color={AMBER} />
                   <DeadlineItem title="Organizare transport Turneul Cluj" sub="M. Ionescu • U16" time="25 mai" date="25 mai" color={AMBER} />
                   <DeadlineItem title="Verificare acte medicale lot U16" sub="A. Ceban • U16" time="Miercuri" date="28 mai" color={VIOLET} />
                   <DeadlineItem title="Plată prime performanță aprilie" sub="V. Marinescu • Finanțe" time="Miercuri" date="28 mai" color={AMBER} />

                   <Pressable style={styles.addDeadlineBtn}>
                      <LucideIcons.Plus size={14} color={TEXT_TH} />
                      <Text style={styles.addDeadlineText}>Adaugă termen</Text>
                   </Pressable>
                </View>

                <View style={[styles.cardSide, { marginTop: 18 }]}>
                   <View style={styles.cardHeader}>
                      <Text style={styles.cardTitle}>Sarcini pe categorii</Text>
                      <Text style={styles.sideLink}>Vezi raport</Text>
                   </View>
                   <View style={styles.donutArea}>
                      <View style={styles.donutWrapper}>
                        <CategoriesDonut />
                      </View>
                      <View style={styles.legend}>
                         <LegendItem dot={BLUE_ACCENT} label="Finanțe" count="7" per="29%" />
                         <LegendItem dot={VIOLET} label="Antrenamente" count="6" per="25%" />
                         <LegendItem dot={GREEN} label="Staff" count="5" per="21%" />
                         <LegendItem dot={AMBER} label="Deplasări" count="3" per="13%" />
                         <LegendItem dot={TEXT_DIM} label="Altele" count="3" per="12%" />
                         <Text style={styles.legendTotal}>Total: 24 sarcini</Text>
                      </View>
                   </View>
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

const TaskStatCard = ({ icon, label, val, trend, per, color }) => {
  const Icon = LucideIcons[icon] || LucideIcons.Circle;
  return (
    <View style={styles.statCard}>
       <View style={styles.statContent}>
          <View style={styles.donutWrap}>
             <Svg width="48" height="48" viewBox="0 0 100 100">
                <Circle cx="50" cy="50" r="40" stroke={color + "15"} strokeWidth="10" fill="none" />
                <Circle
                  cx="50" cy="50" r="40"
                  stroke={color} strokeWidth="10" fill="none"
                  strokeDasharray="251.2" strokeDashoffset={251.2 * (1 - per / 100)}
                  strokeLinecap="round"
                  transform="rotate(-90 50 50)"
                />
             </Svg>
             <View style={styles.statIconInDonut}>
                <Icon size={18} color={color} />
             </View>
          </View>
          <View style={{ marginLeft: 16 }}>
             <Text style={styles.statLabel}>{label}</Text>
             <Text style={styles.statVal}>{val}</Text>
          </View>
       </View>
       <Text style={[styles.statTrend, { color: trend.includes('↑') ? GREEN : RED }]}>{trend}</Text>
    </View>
  );
};

const ActionBtn = ({ icon, label, color, onPress }) => {
  const Icon = LucideIcons[icon];
  return (
    <Pressable onPress={onPress || (() => Alert.alert("În lucru", `${label} va fi conectat în următoarea etapă.`))} style={styles.actionBtn}>
       <Icon size={16} color={color} />
       <Text style={[styles.actionBtnText, { color: 'white' }]}>{label}</Text>
    </Pressable>
  );
};

const KanbanCol = ({ title, count, color, children }) => (
  <View style={styles.kanbanCol}>
     <View style={styles.colHeader}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
           <View style={[styles.colIcon, { backgroundColor: color + "15" }]}>
              {title === 'Finalizate' ? <LucideIcons.CheckCircle size={14} color={color} /> : title === 'În progres' ? <LucideIcons.Clock size={14} color={color} /> : title === 'În așteptare' ? <LucideIcons.PauseCircle size={14} color={color} /> : <LucideIcons.Layout size={14} color={color} />}
           </View>
           <Text style={styles.colTitle}>{title}</Text>
           <View style={[styles.countBadge, { backgroundColor: color + "15" }]}><Text style={[styles.countText, { color }]}>{count}</Text></View>
        </View>
        <LucideIcons.MoreHorizontal size={14} color={TEXT_TH} />
     </View>
     <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>
        {children}
        <Pressable style={styles.addTaskBtn}>
           <LucideIcons.Plus size={14} color={TEXT_TH} />
           <Text style={styles.addTaskText}>Adaugă sarcină</Text>
        </Pressable>
     </ScrollView>
  </View>
);

const TaskCard = ({ title, priority, pColor, date, group, gColor, isDone }) => (
  <View style={styles.taskCard}>
     <View style={styles.taskRow}>
        <View style={[styles.checkbox, isDone && { backgroundColor: GREEN, borderColor: GREEN }]}>
           {isDone && <LucideIcons.Check size={10} color="white" />}
        </View>
        <View style={{ flex: 1, marginLeft: 12 }}>
           <Text style={[styles.taskTitle, isDone && { textDecorationLine: 'line-through', opacity: 0.5 }]}>{title}</Text>
           {priority && (
              <View style={[styles.priorityTag, { backgroundColor: pColor + "15" }]}><Text style={[styles.priorityText, { color: pColor }]}>{priority}</Text></View>
           )}
           <View style={styles.taskMeta}>
              <View style={styles.dateMeta}>
                 <LucideIcons.Calendar size={10} color={TEXT_TH} />
                 <Text style={styles.metaText}>{date}</Text>
              </View>
              <View style={styles.responsibleRow}>
                 <View style={styles.miniAvatar}><LucideIcons.User size={10} color="white" /></View>
                 <View style={[styles.groupTag, { backgroundColor: gColor + "15" }]}><Text style={[styles.groupText, { color: gColor }]}>{group}</Text></View>
              </View>
           </View>
        </View>
     </View>
  </View>
);

const DeadlineItem = ({ title, sub, time, date, color }) => (
  <View style={styles.deadlineItem}>
     <View style={[styles.deadlineIconWrap, { borderColor: color + "30" }]}>
        <LucideIcons.AlertCircle size={14} color={color} />
     </View>
     <View style={{ flex: 1, marginLeft: 12 }}>
        <Text style={styles.deadlineTitle} numberOfLines={1}>{title}</Text>
        <Text style={styles.deadlineSub}>{sub}</Text>
     </View>
     <View style={{ alignItems: 'flex-end' }}>
        <Text style={[styles.deadlineTime, { color: color }]}>{time}</Text>
        <Text style={styles.deadlineDate}>{date}</Text>
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

const CategoriesDonut = () => (
  <Svg width="130" height="130" viewBox="0 0 100 100">
    <Circle cx="50" cy="50" r="40" stroke="#1e293b" strokeWidth="10" fill="none" />
    <Circle cx="50" cy="50" r="40" stroke={BLUE_ACCENT} strokeWidth="10" fill="none" strokeDasharray="251.2" strokeDashoffset="180" transform="rotate(-90 50 50)" />
    <Circle cx="50" cy="50" r="40" stroke={VIOLET} strokeWidth="10" fill="none" strokeDasharray="251.2" strokeDashoffset="190" transform="rotate(10 50 50)" />
    <Circle cx="50" cy="50" r="40" stroke={GREEN} strokeWidth="10" fill="none" strokeDasharray="251.2" strokeDashoffset="200" transform="rotate(100 50 50)" />
    <Circle cx="50" cy="50" r="40" stroke={AMBER} strokeWidth="10" fill="none" strokeDasharray="251.2" strokeDashoffset="220" transform="rotate(170 50 50)" />
    <Circle cx="50" cy="50" r="40" stroke={TEXT_DIM} strokeWidth="10" fill="none" strokeDasharray="251.2" strokeDashoffset="220" transform="rotate(220 50 50)" />
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
  donutWrap: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center' },
  statIconInDonut: { position: 'absolute' },
  statLabel: { color: TEXT_DIM, fontSize: 11, fontWeight: '700' },
  statVal: { color: 'white', fontSize: 22, fontWeight: '900', marginTop: 3 },
  statTrend: { fontSize: 10, fontWeight: '800', marginTop: 10 },

  actionsRow: { marginBottom: 30 },
  actionsList: { flexDirection: 'row', gap: 12 },
  actionBtn: { flex: 1, height: 44, backgroundColor: "rgba(15,23,42,0.4)", borderRadius: 10, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, gap: 10, borderWidth: 1, borderColor: "rgba(255,255,255,0.06)" },
  actionBtnText: { fontSize: 12, fontWeight: '800' },

  mainGrid: { flexDirection: 'row', gap: 14, marginBottom: 20 },
  colKanban: { flex: 3.5 },
  colSidebar: { flex: 1.2 },

  kanbanContainer: { flexDirection: 'row', gap: 14 },
  kanbanCol: { flex: 1, height: 600, backgroundColor: "rgba(15,23,42,0.2)", borderRadius: 20, padding: 12 },
  colHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18, paddingHorizontal: 4 },
  colIcon: { width: 26, height: 26, borderRadius: 8, alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  colTitle: { color: 'white', fontSize: 13, fontWeight: '900' },
  countBadge: { paddingHorizontal: 6, paddingVertical: 1.5, borderRadius: 6, marginLeft: 10 },
  countText: { fontSize: 10, fontWeight: '900' },

  taskCard: { backgroundColor: CARD_BG, borderRadius: 16, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: BORDER_COLOR },
  taskRow: { flexDirection: 'row' },
  checkbox: { width: 16, height: 16, borderRadius: 4, borderWidth: 1.5, borderColor: "rgba(255,255,255,0.15)", marginTop: 2 },
  taskTitle: { color: 'white', fontSize: 12, fontWeight: '700', lineHeight: 18 },
  priorityTag: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4, marginTop: 8, alignSelf: 'flex-start' },
  priorityText: { fontSize: 8, fontWeight: '900' },
  taskMeta: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 },
  dateMeta: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  metaText: { color: TEXT_TH, fontSize: 10, fontWeight: '700' },
  responsibleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  miniAvatar: { width: 20, height: 20, borderRadius: 10, backgroundColor: "rgba(255,255,255,0.1)", alignItems: 'center', justifyContent: 'center' },
  groupTag: { paddingHorizontal: 6, paddingVertical: 1.5, borderRadius: 4 },
  groupText: { fontSize: 8, fontWeight: '900' },

  addTaskBtn: { height: 36, backgroundColor: "rgba(255,255,255,0.03)", borderRadius: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 4 },
  addTaskText: { color: TEXT_TH, fontSize: 11, fontWeight: '800' },

  cardSide: { backgroundColor: CARD_BG, borderRadius: 20, padding: 18, borderWidth: 1, borderColor: BORDER_COLOR },
  cardTitle: { color: 'white', fontSize: 13.5, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 0.8 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  sideLink: { color: BLUE_ACCENT, fontSize: 10.5, fontWeight: '800' },

  deadlineItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.03)" },
  deadlineIconWrap: { width: 28, height: 28, borderRadius: 14, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  deadlineTitle: { color: 'white', fontSize: 11.5, fontWeight: '800' },
  deadlineSub: { color: TEXT_TH, fontSize: 9.5, fontWeight: '600', marginTop: 1 },
  deadlineTime: { fontSize: 10, fontWeight: '900' },
  deadlineDate: { color: TEXT_TH, fontSize: 9.5, fontWeight: '700', marginTop: 1 },
  addDeadlineBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 15, justifyContent: 'center' },
  addDeadlineText: { color: TEXT_TH, fontSize: 11, fontWeight: '800' },

  donutArea: { flexDirection: 'row', alignItems: 'center', gap: 18 },
  donutWrapper: { width: 130, height: 130, alignItems: 'center', justifyContent: 'center' },
  legend: { flex: 1, gap: 8 },
  legendItem: { flexDirection: 'row', alignItems: 'center' },
  legendDot: { width: 6, height: 6, borderRadius: 3, marginRight: 8 },
  legendLabel: { flex: 1, color: TEXT_DIM, fontSize: 10.5, fontWeight: '700' },
  legendCount: { color: 'white', fontSize: 10.5, fontWeight: '800', marginRight: 4 },
  legendPer: { color: TEXT_TH, fontSize: 9.5, fontWeight: '700' },
  legendTotal: { color: TEXT_TH, fontSize: 9.5, fontWeight: '900', textTransform: 'uppercase', marginTop: 12 },

  updateFooter: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 20, opacity: 0.5 },
  updateText: { color: TEXT_TH, fontSize: 10, fontWeight: '800' }
});
