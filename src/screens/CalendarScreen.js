import React, { useState } from "react";
import { ScrollView, StyleSheet, Text, View, Pressable, useWindowDimensions } from "react-native";
import * as LucideIcons from "lucide-react-native";
import { colors as C, spacing, radius } from "../constants/theme";
import { TopBar, SectionTitle } from "../components/SharedComponents";
import { GlassCard, StatCard } from "../components/DesignSystem";
import { currentMonthLabel } from "../utils/dates";

export default function CalendarScreen({ trainings, matches, openNotifications }) {
  const { width } = useWindowDimensions();
  const isMobile = width < 768;
  const [filter, setFilter] = useState("Toate");

  const stats = [
    { icon: "CalendarCheck", label: "Evenimente", value: "9", trend: "+2", up: true, color: C.green },
    { icon: "Dumbbell", label: "Antren.", value: "4", trend: "1 azi", up: true, color: C.purple },
    { icon: "Trophy", label: "Meciuri", value: "2", trend: "egal", up: true, color: C.blue },
    { icon: "Bell", label: "Reminders", value: "3", trend: "1 urgent", up: false, color: C.red },
  ];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <TopBar title="Calendar" eyebrow="PROGRAM CLUB" openNotifications={openNotifications} />

      <View style={styles.statsGrid}>
        {stats.map((s, i) => <StatCard key={i} {...s} trendUp={s.up} />)}
      </View>

      <View style={[styles.mainGrid, isMobile && styles.mobileLayout]}>
         <GlassCard style={[styles.calendarCol, isMobile && { width: "100%" }]}>
            <View style={styles.calendarHeader}>
               <Text style={styles.monthName}>{currentMonthLabel().toUpperCase()} 2026</Text>
               <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll} contentContainerStyle={styles.filterContent}>
                  {["Toate", "U13", "U16", "U19", "Staff"].map(f => (
                    <Pressable key={f} onPress={() => setFilter(f)} style={[styles.filterPill, filter === f && styles.filterPillActive]}>
                      <Text style={[styles.filterPillText, filter === f && { color: "white" }]}>{f}</Text>
                    </Pressable>
                  ))}
               </ScrollView>
            </View>

            {isMobile ? (
              <View style={styles.agendaView}>
                 <AgendaItem date="25 MAI" title="Plată chirie teren" time="10:00" color={C.red} />
                 <AgendaItem date="26 MAI" title="Antrenament U13" time="18:30" color={C.purple} />
                 <AgendaItem date="26 MAI" title="Antrenament U19" time="19:00" color={C.purple} />
                 <AgendaItem date="29 MAI" title="Meci vs ACS Progresul" time="12:00" color={C.blue} />
              </View>
            ) : (
              <View style={styles.monthGridPlaceholder} />
            )}
         </GlassCard>
      </View>
    </ScrollView>
  );
}

const AgendaItem = ({ date, title, time, color }) => (
  <View style={styles.agendaItem}>
     <View style={styles.agendaDate}><Text style={styles.dayNum}>{date.split(' ')[0]}</Text><Text style={styles.monthLab}>{date.split(' ')[1]}</Text></View>
     <View style={[styles.agendaContent, { borderLeftColor: color }]}>
        <Text style={styles.agendaTitle}>{title}</Text>
        <Text style={styles.agendaTime}>{time}</Text>
     </View>
     <LucideIcons.ChevronRight size={16} color={C.dim} />
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#020617" },
  content: { padding: spacing.md, paddingBottom: 120 },
  statsGrid: { flexDirection: "row", flexWrap: "wrap", marginHorizontal: -spacing.xs, marginBottom: spacing.lg },
  mainGrid: { flexDirection: "row", gap: spacing.lg },
  mobileLayout: { flexDirection: "column" },
  calendarCol: { flex: 2, padding: spacing.lg },
  calendarHeader: { marginBottom: spacing.lg },
  monthName: { color: "white", fontSize: 16, fontWeight: "900", letterSpacing: 1, marginBottom: 12 },
  filterScroll: { marginHorizontal: -spacing.lg },
  filterContent: { paddingHorizontal: spacing.lg, gap: 8 },
  filterPill: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, backgroundColor: "rgba(255,255,255,0.03)", borderWidth: 1, borderColor: C.line },
  filterPillActive: { backgroundColor: C.cyan + "20", borderColor: C.cyan },
  filterPillText: { color: C.dim, fontSize: 10, fontWeight: "900" },
  agendaView: { gap: 12 },
  agendaItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.02)', padding: 12, borderRadius: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.04)' },
  agendaDate: { width: 40, alignItems: 'center' },
  dayNum: { color: 'white', fontSize: 14, fontWeight: '900' },
  monthLab: { color: C.dim, fontSize: 8, fontWeight: '900' },
  agendaContent: { flex: 1, marginLeft: 12, paddingLeft: 12, borderLeftWidth: 2 },
  agendaTitle: { color: 'white', fontSize: 12, fontWeight: '800' },
  agendaTime: { color: C.muted, fontSize: 10, marginTop: 2, fontWeight: '600' },
  monthGridPlaceholder: { height: 300, backgroundColor: 'rgba(255,255,255,0.01)', borderRadius: 12, borderStyle: 'dashed', borderWidth: 1, borderColor: C.line }
});
