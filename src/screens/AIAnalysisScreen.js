import React from "react";
import { View, Text, ScrollView, StyleSheet, useWindowDimensions } from "react-native";
import * as LucideIcons from "lucide-react-native";
import { colors as C, spacing, radius } from "../constants/theme";
import { GlassCard, StatCard } from "../components/DesignSystem";
import { TopBar } from "../components/SharedComponents";

export default function AIAnalysisScreen({ openNotifications }) {
  const { width } = useWindowDimensions();
  const isMobile = width < 768;

  const stats = [
    { icon: "Zap", label: "Rapoarte", value: "18", trend: "+4", up: true, color: C.cyan },
    { icon: "UserCheck", label: "Prezență", value: "82%", trend: "+6%", up: true, color: C.purple },
    { icon: "AlertTriangle", label: "Risc", value: "4", trend: "1", up: false, color: C.red },
    { icon: "TrendingUp", label: "Tendință", value: "+7%", trend: "Excelent", up: true, color: C.green },
  ];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <TopBar title="Rapoarte AI" eyebrow="ANALIZĂ PERFORMANTĂ" openNotifications={openNotifications} />

      <View style={styles.statsGrid}>
        {stats.map((s, i) => <StatCard key={i} {...s} trendUp={s.up} />)}
      </View>

      <GlassCard style={styles.aiBox}>
         <View style={styles.aiHeader}>
            <View style={styles.aiIconWrap}><LucideIcons.BrainCircuit size={24} color={C.cyan} /></View>
            <View>
               <Text style={styles.aiLabel}>Insight-uri AI</Text>
               <Text style={styles.aiTime}>Ultima analiză: Azi, 10:30</Text>
            </View>
         </View>
         <View style={styles.insightList}>
            <InsightRow icon="UserMinus" color={C.amber} text="8 jucători sub 70% prezență" detail="Intervenție recomandată pentru creșterea implicării." isMobile={isMobile} />
            <InsightRow icon="TrendingUp" color={C.green} text="Grupa U16: cel mai bun progres" detail="Continuă trendul pozitiv în dezvoltare." isMobile={isMobile} />
            <InsightRow icon="AlertCircle" color={C.red} text="Risc de accidentări ridicat" detail="Scade intensitatea antrenamentelor cu 15%." isMobile={isMobile} />
         </View>
      </GlassCard>
    </ScrollView>
  );
}

const InsightRow = ({ icon, color, text, detail, isMobile }) => {
  const Icon = LucideIcons[icon];
  return (
    <View style={styles.insightRow}>
       <View style={[styles.insIcon, { backgroundColor: color + "15" }]}><Icon size={16} color={color} /></View>
       <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={styles.insText}>{text}</Text>
          <Text style={styles.insDetail} numberOfLines={2}>{detail}</Text>
       </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#020617" },
  content: { padding: spacing.md, paddingBottom: 120 },
  statsGrid: { flexDirection: "row", flexWrap: "wrap", marginHorizontal: -spacing.xs, marginBottom: spacing.lg },
  aiBox: { padding: spacing.lg },
  aiHeader: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: spacing.lg },
  aiIconWrap: { width: 44, height: 44, borderRadius: 12, backgroundColor: C.cyan + "10", alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: C.cyan + "20" },
  aiLabel: { color: "white", fontSize: 14, fontWeight: "900", textTransform: "uppercase" },
  aiTime: { color: C.dim, fontSize: 9, fontWeight: "800", marginTop: 2 },
  insightList: { gap: 12 },
  insightRow: { flexDirection: "row", alignItems: "flex-start", backgroundColor: "rgba(255,255,255,0.02)", padding: 12, borderRadius: 14, borderWidth: 1, borderColor: "rgba(255,255,255,0.04)" },
  insIcon: { width: 32, height: 32, borderRadius: radius.sm, alignItems: "center", justifyContent: "center" },
  insText: { color: "white", fontSize: 12, fontWeight: "800" },
  insDetail: { color: C.muted, fontSize: 10, marginTop: 4, fontWeight: "600", lineHeight: 14 }
});
