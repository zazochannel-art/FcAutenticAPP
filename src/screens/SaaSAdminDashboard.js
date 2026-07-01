import React from "react";
import { View, Text, ScrollView, StyleSheet } from "react-native";
import * as LucideIcons from "lucide-react-native";
import { colors as C, spacing, radius } from "../constants/theme";
import { GlassCard, StatCard, NeonButton } from "../components/DesignSystem";

export default function SaaSAdminDashboard() {
  const stats = [
    { icon: "Building2", label: "Cluburi active", value: "24", trend: "+20%", up: true, color: C.cyan },
    { icon: "Users", label: "Utilizatori total", value: "312", trend: "+18%", up: true, color: C.purple },
    { icon: "CalendarRange", label: "Abonamente active", value: "18", trend: "3 se reînnoiesc", up: true, color: C.blue },
    { icon: "Coins", label: "MRR", value: "24.600 lei", trend: "+15%", up: true, color: C.green },
  ];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <View>
          <Text style={styles.mainTitle}>Admin SaaS</Text>
          <Text style={styles.subTitle}>Gestionează cluburile, abonamentele și performanța platformei.</Text>
        </View>
        <View style={styles.headerActions}>
           <NeonButton label="Creează club" icon="Plus" onPress={() => {}} />
        </View>
      </View>

      <View style={styles.statsGrid}>
        {stats.map((s, i) => <StatCard key={i} {...s} trendUp={s.up} />)}
      </View>

      <View style={styles.mainGrid}>
         <GlassCard style={styles.tableCol}>
            <View style={styles.cardHead}>
               <Text style={styles.cardTitle}>Cluburi în platformă</Text>
               <Text style={styles.cardAction}>Vezi toate cluburile</Text>
            </View>
            <ClubRow name="FC Autentic" owner="Andrei Popescu" plan="Pro" users="28" players="46" status="ACTIV" color={C.green} />
            <ClubRow name="ACS Progresul" owner="Marius Ionescu" plan="Elite" users="34" players="62" status="ACTIV" color={C.green} />
            <ClubRow name="Real Succes" owner="Daniel Popa" plan="Starter" users="18" players="28" status="ACTIV" color={C.green} />
            <ClubRow name="FC Juniorul" owner="Radu Mihai" plan="Free" users="6" players="12" status="TRIAL" color={C.amber} />
         </GlassCard>

         <View style={styles.sideCol}>
            <GlassCard style={styles.sideCard}>
               <Text style={styles.cardTitle}>Activitate Recentă</Text>
               <EventItem icon="Plus" title="Club creat" desc="Academia Nord a fost creată" time="Acum 12 min" />
               <EventItem icon="Mail" title="Owner invitat" desc="Elena Bălan a fost invitată" time="Acum 28 min" />
               <EventItem icon="CreditCard" title="Plată confirmată" desc="FC Autentic - 2.900 lei" time="Acum 2 ore" />
            </GlassCard>
         </View>
      </View>
    </ScrollView>
  );
}

const ClubRow = ({ name, owner, plan, users, players, status, color }) => (
  <View style={styles.clubRow}>
     <View style={styles.clubInfo}>
        <Text style={styles.rowName}>{name}</Text>
        <Text style={styles.rowOwner}>{owner}</Text>
     </View>
     <View style={[styles.planBadge, { backgroundColor: "rgba(255,255,255,0.05)" }]}><Text style={styles.planText}>{plan}</Text></View>
     <View style={styles.statInfo}><Text style={styles.statNum}>{users}</Text><Text style={styles.statLabel}>USR</Text></View>
     <View style={styles.statInfo}><Text style={styles.statNum}>{players}</Text><Text style={styles.statLabel}>PLR</Text></View>
     <View style={[styles.statusBadge, { backgroundColor: color + "15" }]}><Text style={[styles.statusText, { color }]}>{status}</Text></View>
  </View>
);

const EventItem = ({ icon, title, desc, time }) => {
  const Icon = LucideIcons[icon];
  return (
    <View style={styles.eventItem}>
       <View style={styles.eventIcon}><Icon size={14} color={C.cyan} /></View>
       <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={styles.eventTitle}>{title}</Text>
          <Text style={styles.eventDesc}>{desc}</Text>
          <Text style={styles.eventTime}>{time}</Text>
       </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  content: { padding: spacing.xl, paddingBottom: 100 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: spacing.xl },
  mainTitle: { color: "white", fontSize: 28, fontWeight: "900" },
  subTitle: { color: C.muted, fontSize: 13, marginTop: 4, fontWeight: "600" },

  statsGrid: { flexDirection: "row", flexWrap: "wrap", marginHorizontal: -spacing.xs, marginBottom: spacing.xl },

  mainGrid: { flexDirection: "row", gap: spacing.lg },
  tableCol: { flex: 2 },
  sideCol: { flex: 1 },

  cardHead: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: spacing.xl },
  cardTitle: { color: "white", fontSize: 14, fontWeight: "900", textTransform: "uppercase", letterSpacing: 0.5 },
  cardAction: { color: C.cyan, fontSize: 11, fontWeight: "800" },

  clubRow: { flexDirection: "row", alignItems: "center", paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.05)" },
  clubInfo: { flex: 1.5 },
  rowName: { color: "white", fontSize: 13, fontWeight: "800" },
  rowOwner: { color: C.dim, fontSize: 10, fontWeight: "700", marginTop: 2 },
  planBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4, marginRight: 15 },
  planText: { color: C.cyan, fontSize: 9, fontWeight: "900" },
  statInfo: { width: 35, alignItems: "center", marginRight: 10 },
  statNum: { color: "white", fontSize: 11, fontWeight: "800" },
  statLabel: { color: C.dim, fontSize: 7, fontWeight: "900" },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 },
  statusText: { fontSize: 8, fontWeight: "900" },

  eventItem: { flexDirection: "row", marginBottom: 20 },
  eventIcon: { width: 28, height: 28, borderRadius: radius.sm, backgroundColor: "rgba(0,212,255,0.08)", alignItems: "center", justifyContent: "center" },
  eventTitle: { color: "white", fontSize: 11, fontWeight: "800" },
  eventDesc: { color: C.muted, fontSize: 10, marginTop: 2, fontWeight: "600" },
  eventTime: { color: C.dim, fontSize: 8, marginTop: 4, fontWeight: "800" }
});
