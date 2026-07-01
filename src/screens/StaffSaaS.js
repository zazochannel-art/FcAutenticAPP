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
import Svg, { Circle } from "react-native-svg";

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

export default function StaffSaaS({ openNotifications }) {
  const { width } = useWindowDimensions();

  return (
    <View style={styles.container}>
      <View style={styles.mainWrapper}>
        <ScrollView style={styles.mainScroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

          {/* Page Header */}
          <View style={styles.pageHeader}>
            <View style={styles.pageTitleContainer}>
              <Text style={styles.pageTitle}>Echipă / Staff</Text>
              <Text style={styles.pageSub}>Administrează antrenorii, stafful tehnic, voluntarii și rolurile clubului.</Text>
            </View>
          </View>

          {/* Row 1: Stat Cards */}
          <View style={styles.statsGrid}>
             <StatCard icon="Users" label="Staff activ" val="12" trend="↑ 2 față de luna trecută" tColor={GREEN} iColor={CYAN} />
             <StatCard icon="Sparkles" label="Antrenori" val="4" trend="↑ 1 față de luna trecută" tColor={GREEN} iColor={VIOLET} />
             <StatCard icon="UserCheck" label="Voluntari" val="3" trend="− neschimbat" tColor={TEXT_DIM} iColor={GREEN} />
             <StatCard icon="BookOpen" label="Licențe valabile" val="8" trend="↑ 1 față de luna trecută" tColor={GREEN} iColor={BLUE_ACCENT} />
          </View>

          {/* Row 2: Quick Actions */}
          <View style={styles.actionsRow}>
             <View style={styles.actionsList}>
                <ActionBtn icon="UserPlus" label="Adaugă membru" color={CYAN} outline />
                <ActionBtn icon="Send" label="Invită staff" color={VIOLET} outline />
                <ActionBtn icon="Settings" label="Atribuie rol" color={BLUE_ACCENT} outline />
                <ActionBtn icon="Download" label="Exportă contacte" color={AMBER} outline />
             </View>
          </View>

          {/* Row 3: Main Middle Grid */}
          <View style={styles.middleGrid}>
             <View style={styles.colLeft}>
                <View style={styles.cardMain}>
                   <View style={styles.cardHeader}>
                      <Text style={styles.cardTitle}>Membri staff</Text>
                      <View style={styles.tableControls}>
                         <View style={styles.smallSearch}>
                            <LucideIcons.Search size={14} color={TEXT_TH} />
                            <TextInput placeholder="Caută membru..." placeholderTextColor={TEXT_TH} style={styles.smallSearchInput} />
                         </View>
                         <View style={styles.filterBtn}><LucideIcons.SlidersHorizontal size={14} color={TEXT_DIM} /><Text style={styles.filterBtnText}>Filtre</Text></View>
                      </View>
                   </View>

                   <View style={styles.tableHeader}>
                      <Text style={[styles.th, { flex: 2 }]}>Nume</Text>
                      <Text style={[styles.th, { flex: 1.5 }]}>Rol</Text>
                      <Text style={[styles.th, { flex: 2 }]}>Grupă / Responsabilitate</Text>
                      <Text style={[styles.th, { flex: 1.5 }]}>Contact</Text>
                      <Text style={[styles.th, { flex: 1 }]}>Experiență</Text>
                      <Text style={[styles.th, { flex: 1, textAlign: 'center' }]}>Status</Text>
                   </View>

                   <StaffTableRow name="Mihai Ionescu" role="Antrenor Principal" rColor={VIOLET} group="Seniori" contact="0722 123 456" exp="12 ani" status="Activ" />
                   <StaffTableRow name="Andrei Popescu" role="Antrenor U13" rColor={BLUE_ACCENT} group="U13" contact="andrei.popescu@fca.ro" exp="6 ani" status="Activ" />
                   <StaffTableRow name="Radu Dumitrescu" role="Antrenor U19" rColor={BLUE_ACCENT} group="U19" contact="radu.d@fca.ro" exp="8 ani" status="Activ" />
                   <StaffTableRow name="Alexandru Rusu" role="Preparator Fizic" rColor={GREEN} group="Seniori, U19" contact="0726 987 654" exp="7 ani" status="Activ" />
                   <StaffTableRow name="Elena Bălan" role="Medic Club" rColor={AMBER} group="Toate grupele" contact="elena.balan@fca.ro" exp="10 ani" status="Activ" />
                   <StaffTableRow name="Vlad Marinescu" role="Team Manager" rColor={BLUE_ACCENT} group="Toate grupele" contact="vlad.marinescu@fca.ro" exp="9 ani" status="Activ" />
                   <StaffTableRow name="Ionuț Vasilache" role="Voluntar Media" rColor={TEXT_DIM} group="Media & Comunicare" contact="ionut.v@fca.ro" exp="2 ani" status="Voluntar" />

                   <View style={styles.pagination}>
                      <LucideIcons.ChevronLeft size={16} color={TEXT_TH} />
                      <View style={styles.pageDotActive}><Text style={styles.pageTextActive}>1</Text></View>
                      <View style={styles.pageDot}><Text style={styles.pageText}>2</Text></View>
                      <LucideIcons.ChevronRight size={16} color={TEXT_DIM} />
                      <Text style={styles.paginationInfo}>1—7 din 12 membri</Text>
                   </View>
                </View>

                {/* Bottom Row - Availability & Certs */}
                <View style={styles.bottomInnerGrid}>
                   <View style={styles.colAvail}>
                      <View style={styles.cardMain}>
                         <View style={styles.cardHeader}>
                            <Text style={styles.cardTitle}>Disponibilitate săptămânală</Text>
                            <Text style={styles.sideLink}>Vezi calendar</Text>
                         </View>
                         <View style={styles.availHeader}>
                            <Text style={styles.availThName}>Membru</Text>
                            {['Lun', 'Mar', 'Mie', 'Joi', 'Vin', 'Sâm', 'Dum'].map(d => <View key={d} style={styles.availThDay}><Text style={styles.availThText}>{d}</Text><Text style={styles.availThDate}>{['20/05', '21/05', '22/05', '23/05', '24/05', '25/05', '26/05'][['Lun', 'Mar', 'Mie', 'Joi', 'Vin', 'Sâm', 'Dum'].indexOf(d)]}</Text></View>)}
                         </View>
                         <AvailRow name="Mihai Ionescu" days={[1, 1, 1, 1, 1, 1, 1]} />
                         <AvailRow name="Andrei Popescu" days={[1, 1, 2, 2, 1, 1, 1]} />
                         <AvailRow name="Radu Dumitrescu" days={[1, 2, 1, 2, 1, 1, 1]} />
                         <AvailRow name="Alexandru Rusu" days={[1, 1, 1, 1, 1, 1, 1]} />
                         <AvailRow name="Elena Bălan" days={[1, 0, 0, 1, 1, 0, 1]} />

                         <View style={styles.availLegend}>
                            <View style={styles.legItem}><View style={[styles.legDot, { backgroundColor: GREEN }]} /><Text style={styles.legText}>Disponibil</Text></View>
                            <View style={styles.legItem}><View style={[styles.legDot, { backgroundColor: AMBER }]} /><Text style={styles.legText}>Parțial</Text></View>
                            <View style={styles.legItem}><View style={[styles.legDot, { backgroundColor: 'transparent', borderWidth: 1, borderColor: TEXT_TH }]} /><Text style={styles.legText}>Indisponibil</Text></View>
                         </View>
                      </View>
                   </View>

                   <View style={styles.colCerts}>
                      <View style={styles.cardMain}>
                         <View style={styles.cardHeader}>
                            <Text style={styles.cardTitle}>Licențe și certificări</Text>
                            <Text style={styles.sideLink}>Vezi toate</Text>
                         </View>
                         <CertLine icon="Shield" title="UEFA B – Mihai Ionescu" sub="Valabil până la: 30 iun 2027" color={VIOLET} />
                         <CertLine icon="Shield" title="UEFA C – Andrei Popescu" sub="Valabil până la: 15 mai 2026" color={BLUE_ACCENT} />
                         <CertLine icon="Shield" title="UEFA B – Radu Dumitrescu" sub="Valabil până la: 20 aug 2026" color={BLUE_ACCENT} />
                         <CertLine icon="Heart" title="Cert. Medical – Elena Bălan" sub="Valabil până la: 10 oct 2025" color={RED} />
                         <CertLine icon="Heart" title="Cert. Prim Ajutor – Elena Bălan" sub="Valabil până la: 10 nov 2025" color={RED} />
                      </View>
                   </View>
                </View>
             </View>

             <View style={styles.colRight}>
                <View style={styles.cardSide}>
                   <View style={styles.cardHeader}>
                      <Text style={styles.cardTitle}>Distribuție pe roluri</Text>
                   </View>
                   <View style={styles.donutArea}>
                      <View style={styles.donutWrapper}>
                        <RolesDonut />
                        <View style={styles.donutLabelWrap}>
                           <Text style={styles.donutVal}>12</Text>
                           <Text style={styles.donutSub}>TOTAL</Text>
                        </View>
                      </View>
                      <View style={styles.legend}>
                         <LegendItem dot={BLUE_ACCENT} label="Antrenori" count="4" per="33.3%" />
                         <LegendItem dot={CYAN} label="Staff tehnic" count="3" per="25.0%" />
                         <LegendItem dot={VIOLET} label="Medical" count="1" per="8.3%" />
                         <LegendItem dot={AMBER} label="Management" count="1" per="8.3%" />
                         <LegendItem dot={TEXT_DIM} label="Voluntari" count="3" per="25.0%" />
                         <Text style={styles.legendTotal}>Total: 12 membri</Text>
                      </View>
                   </View>
                </View>

                <View style={[styles.cardSide, { marginTop: 18 }]}>
                   <View style={styles.cardHeader}>
                      <Text style={styles.cardTitle}>Program staff săptămâna aceasta</Text>
                      <Text style={styles.sideLink}>Vezi toate</Text>
                   </View>
                   <ScheduleLine date="24 MAI" time="18:00 - 19:30" icon="Users" title="Ședință staff tehnic" loc="Sala de conferințe" color={VIOLET} />
                   <ScheduleLine date="25 MAI" time="17:30 - 18:30" icon="Video" title="Analiză video U19" loc="Sala video" color={BLUE_ACCENT} />
                   <ScheduleLine date="27 MAI" time="16:00 - 18:00" icon="Activity" title="Evaluare fizică U13" loc="Baza Sportivă Autentic" color={GREEN} />
                   <ScheduleLine date="31 MAI" time="10:00 - 11:00" icon="Heart" title="Ședință medicală" loc="Cabinet medical" color={VIOLET} />
                </View>

                <View style={[styles.cardSide, { marginTop: 18 }]}>
                   <View style={styles.cardHeader}>
                      <Text style={styles.cardTitle}>Permisiuni & acces</Text>
                      <Text style={styles.sideLink}>Vezi detalii</Text>
                   </View>
                   <View style={styles.permHeader}>
                      <Text style={[styles.thPerm, { flex: 1.2 }]}>Rol</Text>
                      <Text style={styles.thPerm}>Acces date</Text>
                      <Text style={styles.thPerm}>Modificare</Text>
                      <Text style={styles.thPerm}>Export</Text>
                      <Text style={styles.thPerm}>Admin</Text>
                   </View>
                   <PermRow role="Antrenor Principal" rColor={VIOLET} levels={['Complet', 'Complet', 'Da', 'Da']} />
                   <PermRow role="Antrenor" rColor={BLUE_ACCENT} levels={['Limitat', 'Limitat', 'Nu', 'Nu']} />
                   <PermRow role="Staff Tehnic" rColor={CYAN} levels={['Complet', 'Complet', 'Da', 'Da']} />
                   <PermRow role="Management" rColor={AMBER} levels={['Complet', 'Complet', 'Da', 'Da']} />
                   <PermRow role="Voluntar" rColor={TEXT_DIM} levels={['Vizualizare', 'Nu', 'Nu', 'Nu']} />

                   <View style={styles.updateFooter}>
                      <LucideIcons.Clock size={12} color={TEXT_TH} />
                      <Text style={styles.updateText}>Ultima actualizare: 23 mai 2026, 10:30</Text>
                   </View>
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
             <Icon size={24} color={iColor} />
          </View>
          <View style={{ marginLeft: 18 }}>
             <Text style={styles.statLabel}>{label}</Text>
             <Text style={styles.statVal}>{val}</Text>
          </View>
       </View>
       <Text style={[styles.statTrend, { color: tColor }]}>{trend}</Text>
    </View>
  );
};

const ActionBtn = ({ icon, label, color, outline }) => {
  const Icon = LucideIcons[icon];
  return (
    <View style={[styles.actionBtn, outline && { backgroundColor: color + "08", borderColor: color + "40" }]}>
       <View style={styles.actionIconOuter}>
          <Icon size={16} color={color} />
       </View>
       <Text style={styles.actionBtnText}>{label}</Text>
    </View>
  );
};

const StaffTableRow = ({ name, role, rColor, group, contact, exp, status }) => (
  <View style={styles.tableRow}>
     <View style={{ flex: 2, flexDirection: 'row', alignItems: 'center' }}>
        <View style={styles.miniAvatar}><LucideIcons.User size={14} color="white" /></View>
        <Text style={[styles.rowMainText, { marginLeft: 12 }]}>{name}</Text>
     </View>
     <View style={{ flex: 1.5 }}>
        <Text style={[styles.roleLabel, { color: rColor }]}>{role}</Text>
     </View>
     <Text style={[styles.rowMainText, { flex: 2 }]}>{group}</Text>
     <Text style={[styles.rowSubText, { flex: 1.5 }]}>{contact}</Text>
     <Text style={[styles.rowMainText, { flex: 1 }]}>{exp}</Text>
     <View style={{ flex: 1, alignItems: 'center' }}>
        <View style={[styles.badge, { backgroundColor: status === "Activ" ? GREEN + "15" : BLUE_ACCENT + "15" }]}><Text style={[styles.badgeText, { color: status === "Activ" ? GREEN : BLUE_ACCENT }]}>{status}</Text></View>
     </View>
  </View>
);

const AvailRow = ({ name, days }) => (
  <View style={styles.availRow}>
     <Text style={styles.availName}>{name}</Text>
     {days.map((d, i) => (
       <View key={i} style={styles.availDayCell}>
          <View style={[styles.availDot, d === 1 && { backgroundColor: GREEN }, d === 2 && { backgroundColor: AMBER }, d === 0 && { borderWidth: 1, borderColor: TEXT_TH }]} />
       </View>
     ))}
  </View>
);

const CertLine = ({ icon, title, sub, color }) => {
  const Icon = LucideIcons[icon];
  return (
    <View style={styles.certLine}>
       <View style={[styles.certIconWrap, { backgroundColor: color + "15" }]}><Icon size={14} color={color} /></View>
       <View style={{ flex: 1, marginLeft: 14 }}>
          <Text style={styles.certTitle}>{title}</Text>
          <Text style={styles.certSub}>{sub}</Text>
       </View>
       <View style={styles.statusBadgeSmall}><Text style={styles.statusBadgeText}>Valabil</Text></View>
    </View>
  );
};

const RolesDonut = () => (
  <Svg width="140" height="140" viewBox="0 0 100 100">
    <Circle cx="50" cy="50" r="40" stroke="#1e293b" strokeWidth="10" fill="none" />
    <Circle cx="50" cy="50" r="40" stroke={BLUE_ACCENT} strokeWidth="10" fill="none" strokeDasharray="251.2" strokeDashoffset="166" transform="rotate(-90 50 50)" />
    <Circle cx="50" cy="50" r="40" stroke={CYAN} strokeWidth="10" fill="none" strokeDasharray="251.2" strokeDashoffset="188" transform="rotate(30 50 50)" />
    <Circle cx="50" cy="50" r="40" stroke={VIOLET} strokeWidth="10" fill="none" strokeDasharray="251.2" strokeDashoffset="230" transform="rotate(120 50 50)" />
    <Circle cx="50" cy="50" r="40" stroke={AMBER} strokeWidth="10" fill="none" strokeDasharray="251.2" strokeDashoffset="230" transform="rotate(150 50 50)" />
    <Circle cx="50" cy="50" r="40" stroke={TEXT_DIM} strokeWidth="10" fill="none" strokeDasharray="251.2" strokeDashoffset="188" transform="rotate(180 50 50)" />
  </Svg>
);

const LegendItem = ({ dot, label, count, per }) => (
  <View style={styles.legendItem}>
     <View style={[styles.legendDot, { backgroundColor: dot }]} />
     <Text style={styles.legendLabel}>{label}</Text>
     <Text style={styles.legendCount}>{count}</Text>
     <Text style={styles.legendPer}>({per})</Text>
  </View>
);

const ScheduleLine = ({ date, time, icon, title, loc, color }) => {
  const Icon = LucideIcons[icon];
  return (
    <View style={styles.scheduleLine}>
       <View style={styles.dateBlock}>
          <Text style={styles.dateNum}>{date.split(' ')[0]}</Text>
          <Text style={styles.dateMonth}>{date.split(' ')[1]}</Text>
       </View>
       <View style={[styles.schedIcon, { backgroundColor: color + "15" }]}><Icon size={14} color={color} /></View>
       <View style={{ flex: 1, marginLeft: 14 }}>
          <Text style={styles.schedTitle}>{title}</Text>
          <Text style={styles.schedTime}>{time}</Text>
       </View>
       <View style={styles.locBlock}>
          <LucideIcons.MapPin size={10} color={TEXT_TH} />
          <Text style={styles.locText}>{loc}</Text>
       </View>
    </View>
  );
};

const PermRow = ({ role, rColor, levels }) => (
  <View style={styles.permRow}>
     <Text style={[styles.permRole, { color: rColor }]}>{role}</Text>
     {levels.map((lvl, i) => (
       <View key={i} style={styles.permCell}>
          <View style={[styles.permBadge, { backgroundColor: lvl === 'Complet' || lvl === 'Da' ? GREEN + "10" : lvl === 'Nu' ? RED + "10" : AMBER + "10" }]}>
             <Text style={[styles.permText, { color: lvl === 'Complet' || lvl === 'Da' ? GREEN : lvl === 'Nu' ? RED : AMBER }]}>{lvl}</Text>
          </View>
       </View>
     ))}
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
  statTrend: { fontSize: 9.5, fontWeight: '800', marginTop: 10 },

  actionsRow: { marginBottom: 30 },
  actionsList: { flexDirection: 'row', gap: 12 },
  actionBtn: { flex: 1, height: 44, borderRadius: 10, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, gap: 10, borderWidth: 1, borderColor: "rgba(255,255,255,0.06)" },
  actionIconOuter: { width: 26, height: 26, alignItems: 'center', justifyContent: 'center' },
  actionBtnText: { color: 'white', fontSize: 11.5, fontWeight: '800' },

  middleGrid: { flexDirection: 'row', gap: 14 },
  colLeft: { flex: 2 },
  colRight: { flex: 1 },

  cardMain: { backgroundColor: CARD_BG, borderRadius: 20, padding: 20, borderWidth: 1, borderColor: BORDER_COLOR, marginBottom: 16 },
  cardSide: { backgroundColor: CARD_BG, borderRadius: 20, padding: 18, borderWidth: 1, borderColor: BORDER_COLOR },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 },
  cardTitle: { color: 'white', fontSize: 13.5, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 0.8 },
  sideLink: { color: CYAN, fontSize: 10.5, fontWeight: '800' },

  tableControls: { flexDirection: 'row', gap: 10 },
  smallSearch: { width: 160, height: 30, backgroundColor: "rgba(255,255,255,0.03)", borderRadius: 7, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, borderWidth: 1, borderColor: "rgba(255,255,255,0.05)" },
  smallSearchInput: { flex: 1, color: 'white', fontSize: 10.5, fontWeight: '600', marginLeft: 6 },
  filterBtn: { height: 30, paddingHorizontal: 10, backgroundColor: "rgba(255,255,255,0.03)", borderRadius: 7, flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderColor: "rgba(255,255,255,0.05)" },
  filterBtnText: { color: TEXT_DIM, fontSize: 10.5, fontWeight: '700' },

  tableHeader: { flexDirection: 'row', paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.05)", marginBottom: 4 },
  th: { color: TEXT_TH, fontSize: 8.5, fontWeight: "900", textTransform: "uppercase", letterSpacing: 1 },
  tableRow: { flexDirection: 'row', alignItems: 'center', height: 52, borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.03)" },
  miniAvatar: { width: 26, height: 26, borderRadius: 13, backgroundColor: "rgba(255,255,255,0.08)", alignItems: 'center', justifyContent: 'center' },
  rowMainText: { color: 'white', fontSize: 11.5, fontWeight: '800' },
  rowSubText: { color: TEXT_TH, fontSize: 10.5, fontWeight: '600' },
  roleLabel: { fontSize: 9.5, fontWeight: '900', textTransform: 'uppercase' },
  badge: { paddingHorizontal: 7, paddingVertical: 2.5, borderRadius: 4, minWidth: 50, alignItems: 'center' },
  badgeText: { fontSize: 7.5, fontWeight: '900', textTransform: 'uppercase' },

  pagination: { flexDirection: 'row', alignItems: 'center', marginTop: 12, gap: 8 },
  pageDotActive: { width: 20, height: 20, borderRadius: 5, backgroundColor: CYAN + "20", borderWidth: 1, borderColor: CYAN + "40", alignItems: 'center', justifyContent: 'center' },
  pageDot: { width: 20, height: 20, alignItems: 'center', justifyContent: 'center' },
  pageTextActive: { color: CYAN, fontSize: 9.5, fontWeight: '900' },
  pageText: { color: TEXT_TH, fontSize: 9.5, fontWeight: '900' },
  paginationInfo: { color: TEXT_TH, fontSize: 9.5, fontWeight: '800', marginLeft: 'auto' },

  donutArea: { flexDirection: 'row', alignItems: 'center', gap: 18 },
  donutWrapper: { width: 120, height: 120, alignItems: 'center', justifyContent: 'center' },
  donutLabelWrap: { position: 'absolute', alignItems: 'center', justifyContent: 'center' },
  donutVal: { color: 'white', fontSize: 16, fontWeight: '900' },
  donutSub: { color: TEXT_TH, fontSize: 7.5, fontWeight: '800', marginTop: -2 },
  legend: { flex: 1, gap: 8 },
  legendItem: { flexDirection: 'row', alignItems: 'center' },
  legendDot: { width: 5.5, height: 5.5, borderRadius: 2.75, marginRight: 8 },
  legendLabel: { flex: 1, color: TEXT_DIM, fontSize: 10.5, fontWeight: '700' },
  legendCount: { color: 'white', fontSize: 10.5, fontWeight: '800', marginRight: 4 },
  legendPer: { color: TEXT_TH, fontSize: 9.5, fontWeight: '700' },
  legendTotal: { color: TEXT_TH, fontSize: 9.5, fontWeight: '900', textTransform: 'uppercase', marginTop: 8 },

  scheduleLine: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.04)" },
  dateBlock: { width: 36, alignItems: 'center' },
  dateNum: { color: 'white', fontSize: 13, fontWeight: '900' },
  dateMonth: { color: CYAN, fontSize: 7.5, fontWeight: '900' },
  schedIcon: { width: 26, height: 26, borderRadius: 7, alignItems: 'center', justifyContent: 'center' },
  schedTitle: { color: 'white', fontSize: 11.5, fontWeight: '800' },
  schedTime: { color: TEXT_TH, fontSize: 9.5, fontWeight: '700', marginTop: 2 },
  locBlock: { alignItems: 'flex-end' },
  locText: { color: TEXT_TH, fontSize: 8.5, fontWeight: '700', marginTop: 3 },

  bottomInnerGrid: { flexDirection: 'row', gap: 14 },
  colAvail: { flex: 1.8 },
  colCerts: { flex: 1 },

  availHeader: { flexDirection: 'row', paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.05)" },
  availThName: { flex: 1, color: TEXT_TH, fontSize: 8.5, fontWeight: '900' },
  availThDay: { width: 32, alignItems: 'center' },
  availThText: { color: TEXT_DIM, fontSize: 7.5, fontWeight: '900' },
  availThDate: { color: TEXT_TH, fontSize: 6.5, marginTop: 1 },
  availRow: { flexDirection: 'row', alignItems: 'center', height: 40, borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.03)" },
  availName: { flex: 1, color: 'white', fontSize: 10.5, fontWeight: '800' },
  availDayCell: { width: 32, alignItems: 'center' },
  availDot: { width: 7, height: 7, borderRadius: 3.5 },
  availLegend: { flexDirection: 'row', gap: 16, marginTop: 12 },
  legItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legDot: { width: 7, height: 7, borderRadius: 3.5 },
  legText: { color: TEXT_DIM, fontSize: 9.5, fontWeight: '700' },

  certLine: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.03)" },
  certIconWrap: { width: 28, height: 28, borderRadius: 7, alignItems: 'center', justifyContent: 'center' },
  certTitle: { color: 'white', fontSize: 10.5, fontWeight: '800' },
  certSub: { color: TEXT_TH, fontSize: 8.5, fontWeight: '700', marginTop: 2 },
  statusBadgeSmall: { backgroundColor: GREEN + "10", paddingHorizontal: 5, paddingVertical: 1.5, borderRadius: 3 },
  statusBadgeText: { color: GREEN, fontSize: 7.5, fontWeight: '900' },

  permHeader: { flexDirection: 'row', paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.05)", marginBottom: 6 },
  thPerm: { flex: 1, color: TEXT_TH, fontSize: 7.5, fontWeight: '900', textAlign: 'center' },
  permRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 7, borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.03)" },
  permRole: { flex: 1.2, fontSize: 9.5, fontWeight: '900' },
  permCell: { flex: 1, alignItems: 'center' },
  permBadge: { paddingHorizontal: 5, paddingVertical: 1.5, borderRadius: 3, minWidth: 40, alignItems: 'center' },
  permText: { fontSize: 7.5, fontWeight: '900' },
  updateFooter: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 12, opacity: 0.6 },
  updateText: { color: TEXT_TH, fontSize: 8.5, fontWeight: '800' }});
