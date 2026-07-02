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
  Modal,
  ActivityIndicator,
  Alert
} from "react-native";
import * as LucideIcons from "lucide-react-native";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import Svg, { Path, Circle, Rect, G } from "react-native-svg";
import { supabaseService } from "../services/supabaseService";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

// --- Pixels & Colors from Image ---
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

export default function SaasAdminScreen({ clubs = [], onCreateClub }) {
  const { width } = useWindowDimensions();
  const [inviteModal, setInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [loading, setLoading] = useState(false);
  globalThis.__fcAutenticCreateClub = onCreateClub;

  const handleInvite = async () => {
    if (!inviteEmail.includes("@")) {
      Alert.alert("Eroare", "Te rugăm să introduci o adresă de email validă.");
      return;
    }
    setLoading(true);
    try {
      // For demo, we use the first club or a default one
      const clubId = clubs[0]?.id || "00000000-0000-0000-0000-000000000000";
      await supabaseService.inviteOwner(inviteEmail, clubId);
      Alert.alert("Succes", `Invitația a fost trimisă către ${inviteEmail}`);
      setInviteEmail("");
      setInviteModal(false);
    } catch (error) {
      Alert.alert("Eroare", error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.mainWrapper}>
        <ScrollView style={styles.mainScroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

          {/* Page Header (Internal Title/Sub) */}
          <View style={styles.pageHeader}>
            <View style={styles.pageTitleContainer}>
              <Text style={styles.pageTitle}>Admin SaaS</Text>
              <Text style={styles.pageSub}>Gestionează cluburile, abonamentele și performanța platformei.</Text>
            </View>
          </View>

          {/* Row 1: 4 Large Stat Cards */}
          <View style={styles.statsGrid}>
             <StatCard icon="Users" label="Cluburi active" val="24" trend="↑ 20% față de luna trecută" tColor={GREEN} iColor={CYAN} />
             <StatCard icon="Users" label="Utilizatori total" val="312" trend="↑ 18% față de luna trecută" tColor={GREEN} iColor={VIOLET} />
             <StatCard icon="Calendar" label="Abonamente active" val="18" trend="3 se reînnoiesc în 7 zile" tColor={TEXT_DIM} iColor={BLUE_ACCENT} />
             <StatCard icon="Wallet" label="MRR" val="24.600 lei" trend="↑ 15% față de luna trecută" tColor={GREEN} iColor={GREEN} />
          </View>

          {/* Row 2: Quick Actions */}
          <View style={styles.actionsRow}>
             <Text style={styles.sectionLabel}>Acțiuni rapide</Text>
             <View style={styles.actionsList}>
                <ActionBtn icon="Plus" label="Creează club" color={CYAN} circle />
                <ActionBtn icon="UserPlus" label="Invită owner" color={VIOLET} onPress={() => setInviteModal(true)} />
                <ActionBtn icon="FileText" label="Generează factură" color={BLUE_ACCENT} />
                <ActionBtn icon="Send" label="Trimite notificare" color={AMBER} outline />
             </View>
          </View>

          {/* Row 3: Middle Grid (Table 60% / Right Cards 40%) */}
          <View style={styles.middleGrid}>
             <View style={styles.colLeft}>
                <View style={styles.cardMain}>
                   <View style={styles.cardHeader}>
                      <Text style={styles.cardTitle}>Cluburi în platformă</Text>
                   </View>
                   <View style={styles.tableHeader}>
                      <Text style={[styles.th, { flex: 1.5 }]}>Club</Text>
                      <Text style={[styles.th, { flex: 2 }]}>Owner</Text>
                      <Text style={[styles.th, { flex: 0.8 }]}>Plan</Text>
                      <Text style={[styles.th, { width: 45, textAlign: 'center' }]}>Utilizatori</Text>
                      <Text style={[styles.th, { width: 45, textAlign: 'center' }]}>Jucători</Text>
                      <Text style={[styles.th, { flex: 1.5 }]}>Reînnoire</Text>
                      <Text style={[styles.th, { flex: 1 }]}>Status</Text>
                   </View>
                   <ClubRow name="FC Autentic" sub="andrei@fcautentic.ro" owner="Andrei Popescu" plan="Pro" pColor={BLUE_ACCENT} users="28" players="46" renew="18 mai 2026" subText="în 23 zile" status="Activ" sColor={GREEN} />
                   <ClubRow name="ACS Progresul" sub="marius@acsprogresul.ro" owner="Marius Ionescu" plan="Elite" pColor={VIOLET} users="34" players="62" renew="11 iun. 2026" subText="în 47 zile" status="Activ" sColor={GREEN} />
                   <ClubRow name="Real Succes" sub="daniel@realsucces.ro" owner="Daniel Popa" plan="Starter" pColor={AMBER} users="18" players="28" renew="26 mai 2026" subText="în 31 zile" status="Activ" sColor={GREEN} />
                   <ClubRow name="FC Juniorul" sub="radu@fcjuniorul.ro" owner="Radu Mihai" plan="Free" pColor={TEXT_DIM} users="6" players="12" renew="—" subText="N/A" status="Trial" sColor={BLUE_ACCENT} />
                   <ClubRow name="Viitorul Chișinău" sub="ionut@viitorul.md" owner="Ionuț Vasilache" plan="Pro" pColor={BLUE_ACCENT} users="22" players="38" renew="02 mai 2026" subText="expirat" status="Expirat" sColor={RED} />
                   <ClubRow name="Academia Nord" sub="elena@academianord.ro" owner="Elena Bălan" plan="Starter" pColor={AMBER} users="10" players="16" renew="30 apr. 2026" subText="în 4 zile" status="Pending" sColor={AMBER} />
                   <View style={styles.viewAllFooter}><Text style={styles.viewAllText}>Vezi toate cluburile ›</Text></View>
                </View>
             </View>

             <View style={styles.colRight}>
                <View style={styles.cardSide}>
                   <View style={styles.cardHeader}>
                      <Text style={styles.cardTitle}>Plăți recente</Text>
                      <Text style={styles.sideLink}>Vezi toate</Text>
                   </View>
                   <SmallPaymentRow name="FC Autentic" plan="Pro" pColor={BLUE_ACCENT} sum="2.900 lei" date="25 apr. 2026" status="Plătit" sColor={GREEN} />
                   <SmallPaymentRow name="ACS Progresul" plan="Elite" pColor={VIOLET} sum="4.900 lei" date="24 apr. 2026" status="Plătit" sColor={GREEN} />
                   <SmallPaymentRow name="Real Succes" plan="Starter" pColor={AMBER} sum="1.290 lei" date="24 apr. 2026" status="Plătit" sColor={GREEN} />
                   <SmallPaymentRow name="Viitorul Chișinău" plan="Pro" pColor={BLUE_ACCENT} sum="2.900 lei" date="22 apr. 2026" status="În așteptare" sColor={AMBER} />
                   <SmallPaymentRow name="Academia Nord" plan="Starter" pColor={AMBER} sum="1.290 lei" date="21 apr. 2026" status="Eșuat" sColor={RED} />
                   <View style={styles.viewAllFooter}><Text style={styles.viewAllText}>Vezi toate plățile ›</Text></View>
                </View>

                <View style={[styles.cardSide, { marginTop: 18 }]}>
                   <View style={styles.cardHeader}>
                      <Text style={styles.cardTitle}>Distribuție abonamente</Text>
                      <Text style={styles.sideLink}>Vezi raport</Text>
                   </View>
                   <View style={styles.donutArea}>
                      <View style={styles.donutPlaceholder}>
                        <SubscriptionDonut />
                      </View>
                      <View style={styles.legend}>
                         <LegendItem dot="#64748B" label="Free" count="4" per="16%" />
                         <LegendItem dot={AMBER} label="Starter" count="8" per="33%" />
                         <LegendItem dot={CYAN} label="Pro" count="7" per="29%" />
                         <LegendItem dot={VIOLET} label="Elite" count="5" per="21%" />
                         <Text style={styles.legendTotal}>Total: 24 cluburi</Text>
                      </View>
                   </View>
                </View>
             </View>
          </View>

          {/* Row 4: Bottom Grid (Revenue / Activity / Health) */}
          <View style={styles.bottomGrid}>
             <View style={{ flex: 1.3 }}>
                <View style={styles.cardBottom}>
                   <View style={styles.cardHeader}>
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                         <Text style={styles.cardTitle}>Venituri platformă</Text>
                         <Text style={styles.chartSub}>MRR</Text>
                      </View>
                      <Text style={styles.sideLink}>Vezi detalii</Text>
                   </View>
                   <View style={styles.revenueLegend}>
                      <View style={styles.revLegItem}><View style={[styles.revDot, { backgroundColor: CYAN }]} /><Text style={styles.revLegText}>MRR (lei)</Text></View>
                      <View style={styles.revLegItem}><View style={[styles.revDot, { backgroundColor: VIOLET }]} /><Text style={styles.revLegText}>Creștere (%)</Text></View>
                   </View>
                   <View style={styles.chartAreaLarge}>
                      <RevenueChart />
                   </View>
                </View>
             </View>

             <View style={{ flex: 1 }}>
                <View style={styles.cardBottom}>
                   <View style={styles.cardHeader}>
                      <Text style={styles.cardTitle}>Activitate recentă</Text>
                      <Text style={styles.sideLink}>Vezi toate</Text>
                   </View>
                   <ActivityLine icon="Plus" color={GREEN} title="Club creat" sub="Academia Nord a fost creat" time="Acum 12 min" />
                   <ActivityLine icon="User" color={VIOLET} title="Owner invitat" sub="Elena Bălan a fost invitat" time="Acum 28 min" />
                   <ActivityLine icon="Calendar" color={BLUE_ACCENT} title="Abonament actualizat" sub="Real Succes a trecut la plan Starter" time="Acum 1 oră" />
                   <ActivityLine icon="Wallet" color={GREEN} title="Plată confirmată" sub="FC Autentic – 2.900 lei" time="Acum 2 ore" />
                   <ActivityLine icon="CheckCircle" color={AMBER} title="Ticket rezolvat" sub="Issue #1287 a fost rezolvat" time="Acum 3 ore" />
                </View>
             </View>

             <View style={{ flex: 1 }}>
                <View style={styles.cardBottom}>
                   <Text style={[styles.cardTitle, { marginBottom: 18 }]}>Sănătate platformă</Text>
                   <View style={styles.healthGrid}>
                      <HealthMini icon="Pulse" color={GREEN} val="99.9%" label="Uptime" sub="Ultimele 30 zile" />
                      <HealthMini icon="Ticket" color={BLUE_ACCENT} val="7" label="Tichete deschise" sub="−2 față de ieri" />
                      <HealthMini icon="Users" color={VIOLET} val="5" label="Cluburi în trial" sub="↑ 1 față de ieri" />
                      <HealthMini icon="Database" color={GREEN} val="OK" label="Backup & DB" sub="Ultimul backup: 08:20" />
                   </View>
                   <View style={styles.healthFooter}>
                      <LucideIcons.Clock size={12} color={TEXT_TH} />
                      <Text style={styles.healthFooterText}>Ultima actualizare: 25 apr. 2026, 10:30</Text>
                   </View>
                </View>
             </View>
          </View>

        </ScrollView>
      </View>

      {/* Invite Owner Modal */}
      <Modal visible={inviteModal} transparent animationType="fade">
        <BlurView intensity={20} style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Invită Owner Club</Text>
              <Pressable onPress={() => setInviteModal(false)}><LucideIcons.X size={20} color="white" /></Pressable>
            </View>
            <Text style={styles.modalSub}>Trimite o invitație pe email pentru a permite accesul unui nou administrator de club.</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Adresă Email</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="ex: owner@club.ro"
                placeholderTextColor={TEXT_TH}
                value={inviteEmail}
                onChangeText={setInviteEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <Pressable
              style={[styles.inviteSubmitBtn, loading && { opacity: 0.7 }]}
              onPress={handleInvite}
              disabled={loading}
            >
              {loading ? <ActivityIndicator color="black" /> : <Text style={styles.inviteSubmitText}>Trimite Invitația</Text>}
            </Pressable>
          </View>
        </BlurView>
      </Modal>
    </View>
  );
}

// --- SVG Charts ---

const RevenueChart = () => (
  <Svg width="100%" height="260" viewBox="0 0 500 260">
    <G opacity="0.1">
      {[0, 1, 2, 3, 4].map((i) => (
        <Rect key={i} x={0} y={i * 50 + 30} width="500" height="1" fill={TEXT_TH} />
      ))}
    </G>
    <Path
      d="M0,200 Q100,180 200,150 T400,100 T500,80"
      fill="none"
      stroke={CYAN}
      strokeWidth="4"
    />
    <Path
      d="M0,220 Q100,210 200,190 T400,160 T500,140"
      fill="none"
      stroke={VIOLET}
      strokeWidth="3"
      strokeDasharray="6,4"
    />
    <Circle cx="500" cy="80" r="6" fill={CYAN} />
    <Circle cx="500" cy="140" r="5" fill={VIOLET} />
  </Svg>
);

const SubscriptionDonut = () => (
  <Svg width="150" height="150" viewBox="0 0 100 100">
    <Circle cx="50" cy="50" r="40" stroke="#1e293b" strokeWidth="12" fill="none" />
    <Circle
      cx="50" cy="50" r="40"
      stroke={VIOLET} strokeWidth="12" fill="none"
      strokeDasharray="251.2" strokeDashoffset="200"
      strokeLinecap="round"
      transform="rotate(-90 50 50)"
    />
    <Circle
      cx="50" cy="50" r="40"
      stroke={CYAN} strokeWidth="12" fill="none"
      strokeDasharray="251.2" strokeDashoffset="150"
      strokeLinecap="round"
      transform="rotate(0 50 50)"
    />
    <Circle
      cx="50" cy="50" r="40"
      stroke={AMBER} strokeWidth="12" fill="none"
      strokeDasharray="251.2" strokeDashoffset="100"
      strokeLinecap="round"
      transform="rotate(90 50 50)"
    />
    <G transform="translate(50, 50)">
       <Rect x="-20" y="-15" width="40" height="30" fill="transparent" />
    </G>
  </Svg>
);

// --- Specific Components ---

const StatCard = ({ icon, label, val, trend, tColor, iColor, isSmall }) => {
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

const ActionBtn = ({ icon, label, color, circle, outline, onPress }) => {
  const Icon = LucideIcons[icon];
  const handlePress =
    onPress ||
    (icon === "Plus" && globalThis.__fcAutenticCreateClub
      ? globalThis.__fcAutenticCreateClub
      : () => Alert.alert("În lucru", `${label} va fi conectat în următoarea etapă.`));
  return (
    <Pressable onPress={handlePress} style={[styles.actionBtn, outline && { backgroundColor: color + "08", borderColor: color + "40" }]}>
       <View style={[styles.actionIconOuter, circle && { backgroundColor: color + "15", borderRadius: 15 }]}>
          <Icon size={16} color={color} />
       </View>
       <Text style={styles.actionBtnText}>{label}</Text>
    </Pressable>
  );
};

const ClubRow = ({ name, sub, owner, plan, pColor, users, players, renew, subText, status, sColor }) => (
  <View style={styles.tableRow}>
     <View style={{ flex: 1.5, flexDirection: 'row', alignItems: 'center' }}>
        <View style={styles.miniClubCrest}><LucideIcons.Shield size={12} color="white" /></View>
        <View style={{ marginLeft: 12 }}>
           <Text style={styles.rowMainText}>{name}</Text>
           <Text style={styles.rowSubText}>{sub}</Text>
        </View>
     </View>
     <View style={{ flex: 2 }}>
        <Text style={styles.rowMainText}>{owner}</Text>
        <Text style={styles.rowSubText}>andrei@fcautentic.ro</Text>
     </View>
     <View style={{ flex: 0.8 }}>
        <View style={[styles.badge, { backgroundColor: pColor + "15" }]}><Text style={[styles.badgeText, { color: pColor }]}>{plan}</Text></View>
     </View>
     <Text style={[styles.rowMainText, { width: 45, textAlign: 'center' }]}>{users}</Text>
     <Text style={[styles.rowMainText, { width: 45, textAlign: 'center' }]}>{players}</Text>
     <View style={{ flex: 1.5 }}>
        <Text style={styles.rowMainText}>{renew}</Text>
        <Text style={[styles.rowSubText, { color: subText === "expirat" ? RED : GREEN }]}>{subText}</Text>
     </View>
     <View style={{ flex: 1, alignItems: 'center' }}>
        <View style={[styles.badge, { backgroundColor: sColor + "15" }]}><Text style={[styles.badgeText, { color: sColor }]}>{status}</Text></View>
     </View>
  </View>
);

const SmallPaymentRow = ({ name, plan, pColor, sum, date, status, sColor }) => (
  <View style={styles.tableRowCompact}>
     <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}>
        <View style={styles.miniClubCrestSmall}><LucideIcons.Shield size={10} color="white" /></View>
        <Text style={[styles.rowMainText, { marginLeft: 10 }]}>{name}</Text>
     </View>
     <Text style={{ color: pColor, fontSize: 10, fontWeight: '900', flex: 0.5 }}>{plan}</Text>
     <Text style={[styles.rowMainText, { flex: 0.8 }]}>{sum}</Text>
     <Text style={[styles.rowSubText, { flex: 0.8 }]}>{date}</Text>
     <View style={{ flex: 0.8, alignItems: 'center' }}>
        <View style={[styles.badge, { backgroundColor: sColor + "10", minWidth: 50 }]}><Text style={[styles.badgeText, { color: sColor, fontSize: 7 }]}>{status}</Text></View>
     </View>
  </View>
);

const LegendItem = ({ dot, label, count, per }) => (
  <View style={styles.legendItem}>
     <View style={[styles.legendDot, { backgroundColor: dot }]} />
     <Text style={styles.legendLabel}>{label}</Text>
     <Text style={styles.legendCount}>{count} cluburi</Text>
     <Text style={styles.legendPer}>{per}</Text>
  </View>
);

const ActivityLine = ({ icon, color, title, sub, time }) => {
  const Icon = LucideIcons[icon];
  return (
    <View style={styles.activityLine}>
       <View style={[styles.activityIconWrap, { backgroundColor: color + "15" }]}><Icon size={14} color={color} /></View>
       <View style={{ flex: 1, marginLeft: 16 }}>
          <Text style={styles.rowMainText}>{title}</Text>
          <Text style={styles.rowSubText}>{sub}</Text>
          <Text style={styles.activityTime}>{time}</Text>
       </View>
    </View>
  );
};

const HealthMini = ({ icon, color, val, label, sub }) => {
  const Icon = LucideIcons[icon === "Pulse" ? "Activity" : icon];
  return (
    <View style={styles.healthMiniCard}>
       <View style={[styles.healthIconWrap, { backgroundColor: color + "10" }]}><Icon size={20} color={color} /></View>
       <View style={{ flex: 1 }}>
          <Text style={styles.healthVal}>{val}</Text>
          <Text style={styles.healthLabel}>{label}</Text>
          <Text style={styles.healthSub}>{sub}</Text>
       </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG_DARK },

  // --- Content Layout ---
  mainWrapper: { flex: 1 },
  mainScroll: { flex: 1 },
  scrollContent: { padding: 18, paddingBottom: 60 },

  // --- Header CSS ---
  pageHeader: { marginBottom: 30 },
  pageTitle: { color: 'white', fontSize: 26, fontWeight: '900', letterSpacing: -0.5 },
  pageSub: { color: TEXT_DIM, fontSize: 13, fontWeight: '600', marginTop: 3 },

  // --- Stats CSS ---
  statsGrid: { flexDirection: 'row', gap: 14, marginBottom: 25 },
  statCard: { flex: 1, backgroundColor: CARD_BG, borderRadius: 16, padding: 18, height: 100, borderHorizontal: 1, borderColor: BORDER_COLOR },
  statContent: { flexDirection: 'row', alignItems: 'center' },
  statIconWrap: { width: 42, height: 42, borderRadius: 12, alignItems: 'center', justifyContent: 'center', borderHorizontal: 1 },
  statLabel: { color: TEXT_DIM, fontSize: 11, fontWeight: '700' },
  statVal: { color: 'white', fontSize: 22, fontWeight: '900', marginTop: 3 },
  statTrend: { fontSize: 10, fontWeight: '800', marginTop: 10 },

  // --- Actions Row ---
  actionsRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 30 },
  sectionLabel: { color: TEXT_TH, fontSize: 10, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1.2, marginRight: 18 },
  actionsList: { flex: 1, flexDirection: 'row', gap: 12 },
  actionBtn: { flex: 1, height: 44, backgroundColor: "rgba(15,23,42,0.4)", borderRadius: 10, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, gap: 10, borderHorizontal: 1, borderColor: "rgba(255,255,255,0.06)" },
  actionIconOuter: { width: 26, height: 26, alignItems: 'center', justifyContent: 'center' },
  actionBtnText: { color: 'white', fontSize: 12, fontWeight: '800' },

  // --- Middle Grid CSS ---
  middleGrid: { flexDirection: 'row', gap: 14, marginBottom: 20 },
  colLeft: { flex: 1.5 },
  colRight: { flex: 1 },
  cardMain: { backgroundColor: CARD_BG, borderRadius: 20, padding: 20, borderHorizontal: 1, borderColor: BORDER_COLOR },
  cardSide: { backgroundColor: CARD_BG, borderRadius: 20, padding: 18, borderHorizontal: 1, borderColor: BORDER_COLOR },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  cardTitle: { color: 'white', fontSize: 13, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 0.8 },
  sideLink: { color: CYAN, fontSize: 11, fontWeight: '800' },

  tableHeader: { flexDirection: 'row', paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.05)", marginBottom: 4 },
  th: { color: TEXT_TH, fontSize: 9, fontWeight: "900", textTransform: "uppercase", letterSpacing: 1 },
  tableRow: { flexDirection: 'row', alignItems: 'center', height: 56, borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.03)" },
  miniClubCrest: { width: 28, height: 28, borderRadius: 6, backgroundColor: "rgba(255,255,255,0.03)", alignItems: 'center', justifyContent: 'center', borderHorizontal: 1, borderColor: "rgba(255,255,255,0.05)" },
  rowMainText: { color: 'white', fontSize: 12, fontWeight: '800' },
  rowSubText: { color: TEXT_TH, fontSize: 9, fontWeight: '600', marginTop: 1 },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4, minWidth: 60, alignItems: 'center' },
  badgeText: { fontSize: 8, fontWeight: '900' },
  viewAllFooter: { marginTop: 16, alignItems: 'center' },
  viewAllText: { color: CYAN, fontSize: 11, fontWeight: '900' },

  tableRowCompact: { flexDirection: 'row', alignItems: 'center', height: 48, borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.03)" },
  miniClubCrestSmall: { width: 22, height: 22, borderRadius: 4, backgroundColor: "rgba(255,255,255,0.03)", alignItems: 'center', justifyContent: 'center' },

  donutArea: { flexDirection: 'row', alignItems: 'center', gap: 24, marginTop: 8 },
  donutPlaceholder: { width: 130, height: 130, alignItems: 'center', justifyContent: 'center' },
  legend: { flex: 1, gap: 10 },
  legendItem: { flexDirection: 'row', alignItems: 'center' },
  legendDot: { width: 7, height: 7, borderRadius: 3.5, marginRight: 10 },
  legendLabel: { flex: 1, color: TEXT_DIM, fontSize: 11, fontWeight: '700' },
  legendCount: { color: 'white', fontSize: 11, fontWeight: '800', marginRight: 12 },
  legendPer: { color: TEXT_TH, fontSize: 10, fontWeight: '800', width: 35, textAlign: 'right' },
  legendTotal: { color: TEXT_TH, fontSize: 10, fontWeight: '900', textTransform: 'uppercase', marginTop: 12 },

  // --- Bottom Grid CSS ---
  bottomGrid: { flexDirection: 'row', gap: 14 },
  cardBottom: { backgroundColor: CARD_BG, borderRadius: 20, padding: 20, borderHorizontal: 1, borderColor: BORDER_COLOR },
  chartSub: { color: TEXT_TH, fontSize: 9, fontWeight: '900', marginLeft: 10 },
  revenueLegend: { flexDirection: 'row', gap: 16, marginBottom: 16 },
  revLegItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  revDot: { width: 7, height: 7, borderRadius: 3.5 },
  revLegText: { color: TEXT_DIM, fontSize: 10, fontWeight: '700' },
  chartAreaLarge: { height: 220, alignItems: 'center', justifyContent: 'center', backgroundColor: "rgba(0, 212, 255, 0.02)", borderRadius: 16, borderHorizontal: 1, borderColor: "rgba(0, 212, 255, 0.1)" },

  activityLine: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.04)" },
  activityIconWrap: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  activityTime: { color: TEXT_TH, fontSize: 9, fontWeight: '900', marginTop: 3 },

  healthGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  healthMiniCard: { width: '47%', backgroundColor: "rgba(255,255,255,0.02)", borderRadius: 14, padding: 14, borderHorizontal: 1, borderColor: "rgba(255,255,255,0.05)", flexDirection: 'row', gap: 12 },
  healthIconWrap: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  healthVal: { color: 'white', fontSize: 14, fontWeight: '900' },
  healthLabel: { color: TEXT_DIM, fontSize: 9, fontWeight: '800' },
  healthSub: { color: TEXT_TH, fontSize: 7.5, fontWeight: '700', marginTop: 2 },
  healthFooter: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 18, opacity: 0.6 },
  healthFooterText: { color: TEXT_TH, fontSize: 9, fontWeight: '800' },

  // --- Modal CSS ---
  modalOverlay: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.6)' },
  modalContent: { width: 400, backgroundColor: "#030B14", borderRadius: 24, padding: 32, borderWidth: 1, borderColor: "rgba(0,212,255,0.15)", shadowColor: CYAN, shadowRadius: 30, shadowOpacity: 0.1 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  modalTitle: { color: 'white', fontSize: 20, fontWeight: '900' },
  modalSub: { color: TEXT_DIM, fontSize: 13, lineHeight: 20, marginBottom: 24 },
  inputGroup: { marginBottom: 24 },
  inputLabel: { color: TEXT_TH, fontSize: 11, fontWeight: '900', textTransform: 'uppercase', marginBottom: 10, letterSpacing: 1 },
  modalInput: { height: 52, backgroundColor: "rgba(255,255,255,0.03)", borderRadius: 12, borderWidth: 1, borderColor: "rgba(255,255,255,0.1)", paddingHorizontal: 16, color: 'white', fontSize: 14, fontWeight: '600' },
  inviteSubmitBtn: { height: 52, backgroundColor: CYAN, borderRadius: 12, alignItems: 'center', justifyContent: 'center', shadowColor: CYAN, shadowRadius: 15, shadowOpacity: 0.4 },
  inviteSubmitText: { color: BG_DARK, fontSize: 14, fontWeight: '900' }
});
