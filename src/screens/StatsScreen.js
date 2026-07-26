import React, { useMemo, useState } from "react";
import { View, Text, ScrollView, StyleSheet, Pressable } from "react-native";
import * as LucideIcons from "lucide-react-native";
import { colors as C } from "../constants/theme";
import { TopBar } from "../components/SharedComponents";
import { computePlayerStats } from "../utils/stats";
import { AreaChart, FadeInView } from "../components/ui/visuals";

const SORTS = [
  { key: "goals", label: "Goluri", icon: "Goal" },
  { key: "matches", label: "Meciuri", icon: "Trophy" },
  { key: "attendance", label: "Prezență", icon: "CalendarCheck" },
  { key: "rating", label: "Rating", icon: "Star" },
];

export default function StatsScreen({ players = [], matches = [], attendance = {}, selectedClub, openNotifications }) {
  const [sortBy, setSortBy] = useState("goals");
  const [groupFilter, setGroupFilter] = useState("Toate");

  const groups = useMemo(() => Array.from(new Set(players.map((p) => p.group).filter(Boolean))), [players]);

  const rows = useMemo(() => {
    const scoped = players.filter((p) => groupFilter === "Toate" || p.group === groupFilter);
    const list = computePlayerStats(scoped, matches, attendance);
    list.sort((a, b) => {
      if (sortBy === "matches") return b.convocat - a.convocat || b.titular - a.titular;
      if (sortBy === "attendance") return (b.att ?? -1) - (a.att ?? -1);
      if (sortBy === "rating") return (b.rating ?? -1) - (a.rating ?? -1);
      return b.goals - a.goals || b.convocat - a.convocat; // goals
    });
    return list;
  }, [players, matches, attendance, sortBy, groupFilter]);

  const totalGoals = rows.reduce((s, r) => s + r.goals, 0);
  const avgAtt = (() => {
    const withAtt = rows.filter((r) => r.att != null);
    if (!withAtt.length) return null;
    return Math.round(withAtt.reduce((s, r) => s + r.att, 0) / withAtt.length);
  })();
  const topScorer = rows.reduce((best, r) => (r.goals > (best?.goals || 0) ? r : best), null);

  const metricValue = (r) => {
    if (sortBy === "matches") return `${r.convocat}`;
    if (sortBy === "attendance") return r.att == null ? "—" : `${r.att}%`;
    if (sortBy === "rating") return r.rating == null ? "—" : `${r.rating}`;
    return `${r.goals}`;
  };
  const metricColor = sortBy === "attendance" ? C.green : sortBy === "rating" ? C.cyan : sortBy === "matches" ? C.blue : C.amber;

  // Goluri marcate de echipă pe meci (cronologic), pentru graficul de evoluție.
  const goalsSeries = [...matches].reverse()
    .map((m) => Object.values(m.scorers || {}).reduce((s, v) => s + Number(v || 0), 0));

  // Prezența pe fiecare antrenament (cronologic).
  const attendanceSeries = Object.keys(attendance).sort((a, b) => Number(a) - Number(b))
    .map((tid) => {
      const vals = Object.values(attendance[tid] || {});
      const pres = vals.filter((s) => s === "present" || s === "late").length;
      return vals.length ? Math.round((pres / vals.length) * 100) : 0;
    });

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <TopBar title="Statistici" eyebrow={selectedClub?.name || "FOOTBAL MANAGER 99"} openNotifications={openNotifications} />

      <FadeInView style={styles.summaryRow}>
        <SummaryCard icon="Trophy" color={C.blue} value={String(matches.length)} label="Meciuri" />
        <SummaryCard icon="Goal" color={C.amber} value={String(totalGoals)} label="Goluri" />
        <SummaryCard icon="CalendarCheck" color={C.green} value={avgAtt == null ? "—" : `${avgAtt}%`} label="Prezență" />
      </FadeInView>

      <FadeInView delay={80} style={styles.chartCard}>
        <Text style={styles.chartTitle}>Goluri pe meci</Text>
        <AreaChart
          data={goalsSeries}
          color={C.amber}
          height={90}
          emptyLabel="Încă niciun gol înregistrat — apare aici după ce completezi marcatorii la meciuri."
        />
      </FadeInView>

      <FadeInView delay={120} style={styles.chartCard}>
        <Text style={styles.chartTitle}>Prezență la antrenamente</Text>
        <AreaChart
          data={attendanceSeries}
          color={C.green}
          height={90}
          emptyLabel="Marchează prezența la antrenamente ca să vezi evoluția aici."
        />
      </FadeInView>

      {topScorer && topScorer.goals > 0 && (
        <View style={styles.topScorer}>
          <View style={styles.topScorerIcon}><LucideIcons.Crown size={18} color={C.amber} /></View>
          <View style={{ flex: 1 }}>
            <Text style={styles.topScorerLabel}>GOLGHETER</Text>
            <Text style={styles.topScorerName}>{topScorer.name}</Text>
          </View>
          <Text style={styles.topScorerVal}>{topScorer.goals} <Text style={styles.topScorerValSub}>goluri</Text></Text>
        </View>
      )}

      {groups.length > 0 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
          {["Toate", ...groups].map((g) => (
            <Pressable key={g} onPress={() => setGroupFilter(g)} style={[styles.chip, groupFilter === g && styles.chipOn]}>
              <Text style={[styles.chipText, groupFilter === g && styles.chipTextOn]}>{g}</Text>
            </Pressable>
          ))}
        </ScrollView>
      )}

      <View style={styles.sortRow}>
        {SORTS.map((s) => {
          const Icon = LucideIcons[s.icon] || LucideIcons.Circle;
          const on = sortBy === s.key;
          return (
            <Pressable key={s.key} onPress={() => setSortBy(s.key)} style={[styles.sortChip, on && styles.sortChipOn]}>
              <Icon size={13} color={on ? C.bg : C.muted} />
              <Text style={[styles.sortChipText, on && styles.sortChipTextOn]}>{s.label}</Text>
            </Pressable>
          );
        })}
      </View>

      {rows.length === 0 && (
        <View style={styles.emptyState}>
          <LucideIcons.ChartColumn size={38} color={C.muted} />
          <Text style={styles.emptyText}>Niciun jucător de afișat. Adaugă jucători și convocări la meciuri.</Text>
        </View>
      )}

      {rows.map((r, i) => (
        <View key={r.id} style={styles.row}>
          <Text style={[styles.rank, i < 3 && { color: C.amber }]}>{i + 1}</Text>
          <View style={styles.rowAvatar}><Text style={styles.rowAvatarText}>{r.no ? r.no : (r.name || "?").slice(0, 1)}</Text></View>
          <View style={{ flex: 1, marginLeft: 10 }}>
            <Text style={styles.rowName} numberOfLines={1}>{r.name}</Text>
            <Text style={styles.rowMeta} numberOfLines={1}>
              {[r.role, r.group].filter(Boolean).join(" · ")} · {r.titular} tit. / {r.convocat} conv.
            </Text>
            {sortBy === "attendance" && r.att != null && (
              <View style={styles.attBar}><View style={[styles.attFill, { width: `${r.att}%` }]} /></View>
            )}
          </View>
          <View style={[styles.metric, { backgroundColor: metricColor + "18" }]}>
            <Text style={[styles.metricVal, { color: metricColor }]}>{metricValue(r)}</Text>
          </View>
        </View>
      ))}
    </ScrollView>
  );
}

function SummaryCard({ icon, color, value, label }) {
  const Icon = LucideIcons[icon] || LucideIcons.Circle;
  return (
    <View style={styles.summaryCard}>
      <View style={[styles.summaryIcon, { backgroundColor: color + "18" }]}><Icon size={18} color={color} /></View>
      <Text style={styles.summaryValue}>{value}</Text>
      <Text style={styles.summaryLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "transparent" },
  content: { padding: 18, paddingBottom: 120 },

  summaryRow: { flexDirection: "row", gap: 10, marginBottom: 12 },
  chartCard: { backgroundColor: C.card, borderRadius: 16, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: "rgba(255,255,255,0.05)" },
  chartTitle: { color: "white", fontSize: 12, fontWeight: "900", marginBottom: 10, textTransform: "uppercase", letterSpacing: 0.5 },
  summaryCard: { flex: 1, backgroundColor: C.card, borderRadius: 16, padding: 14, borderWidth: 1, borderColor: "rgba(255,255,255,0.05)", alignItems: "flex-start" },
  summaryIcon: { width: 34, height: 34, borderRadius: 10, alignItems: "center", justifyContent: "center", marginBottom: 8 },
  summaryValue: { color: "white", fontSize: 20, fontWeight: "900" },
  summaryLabel: { color: C.dim, fontSize: 9.5, fontWeight: "800", marginTop: 2, textTransform: "uppercase", letterSpacing: 0.5 },

  topScorer: { flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: C.amber + "10", borderColor: C.amber + "35", borderWidth: 1, borderRadius: 16, padding: 14, marginBottom: 14 },
  topScorerIcon: { width: 38, height: 38, borderRadius: 12, backgroundColor: C.amber + "18", alignItems: "center", justifyContent: "center" },
  topScorerLabel: { color: C.amber, fontSize: 9, fontWeight: "900", letterSpacing: 1 },
  topScorerName: { color: "white", fontSize: 14, fontWeight: "900", marginTop: 2 },
  topScorerVal: { color: C.amber, fontSize: 20, fontWeight: "900" },
  topScorerValSub: { color: C.dim, fontSize: 10, fontWeight: "700" },

  chipRow: { gap: 8, paddingBottom: 4, marginBottom: 8 },
  chip: { paddingHorizontal: 14, height: 34, borderRadius: 10, borderWidth: 1, borderColor: "rgba(255,255,255,0.1)", alignItems: "center", justifyContent: "center" },
  chipOn: { borderColor: C.purple, backgroundColor: C.purple + "16" },
  chipText: { color: C.muted, fontSize: 11.5, fontWeight: "800" },
  chipTextOn: { color: C.purple },

  sortRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 14 },
  sortChip: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 12, height: 36, borderRadius: 10, borderWidth: 1, borderColor: "rgba(255,255,255,0.12)" },
  sortChipOn: { backgroundColor: C.cyan, borderColor: C.cyan },
  sortChipText: { color: C.muted, fontSize: 11, fontWeight: "800" },
  sortChipTextOn: { color: C.bg },

  emptyState: { alignItems: "center", justifyContent: "center", paddingVertical: 50, gap: 12 },
  emptyText: { color: C.muted, fontSize: 12.5, fontWeight: "600", textAlign: "center", lineHeight: 18, paddingHorizontal: 20 },

  row: { flexDirection: "row", alignItems: "center", backgroundColor: C.card, borderRadius: 14, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: "rgba(255,255,255,0.05)" },
  rank: { color: C.dim, fontSize: 13, fontWeight: "900", width: 22, textAlign: "center" },
  rowAvatar: { width: 34, height: 34, borderRadius: 17, backgroundColor: "rgba(0,212,255,0.12)", alignItems: "center", justifyContent: "center", marginLeft: 4 },
  rowAvatarText: { color: C.cyan, fontSize: 12, fontWeight: "900" },
  rowName: { color: "white", fontSize: 13, fontWeight: "800" },
  rowMeta: { color: C.dim, fontSize: 10, fontWeight: "700", marginTop: 2 },
  attBar: { height: 5, borderRadius: 3, backgroundColor: "rgba(255,255,255,0.06)", marginTop: 6, overflow: "hidden" },
  attFill: { height: "100%", borderRadius: 3, backgroundColor: C.green },
  metric: { minWidth: 46, height: 38, borderRadius: 11, alignItems: "center", justifyContent: "center", paddingHorizontal: 10, marginLeft: 8 },
  metricVal: { fontSize: 16, fontWeight: "900" },
});
