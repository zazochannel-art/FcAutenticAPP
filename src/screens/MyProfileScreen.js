import React, { useMemo } from "react";
import { View, Text, ScrollView, StyleSheet, Platform, Alert } from "react-native";
import * as LucideIcons from "lucide-react-native";
import Svg, { Polygon, Line } from "react-native-svg";
import { useQuery } from "@tanstack/react-query";
import { colors as C, themedStyles, layout } from "../constants/theme";
import { TopBar, SectionTitle } from "../components/SharedComponents";
import { supabaseService } from "../services/supabaseService";
import { notificationService } from "../services/notificationService";
import { parseRoDate } from "../utils/dates";
import { BRAND_NAME } from "../constants/brand";
import { useTopClearance } from "../hooks/useTopClearance";

function notify(title, msg) {
  if (Platform.OS === "web") window.alert(`${title}\n\n${msg}`);
  else Alert.alert(title, msg);
}

// Eticheta de convocare pentru portalul jucătorului.
const CALLUP = {
  titular: { label: "Titular", color: C.green },
  rezerva: { label: "Rezervă", color: C.amber },
};

const METRICS = [
  ["technique", "Tehnică"],
  ["speed", "Viteză"],
  ["discipline", "Disciplină"],
  ["attitude", "Atitudine"],
  ["tactics", "Tactică"],
  ["physical", "Fizic"],
];

export default function MyProfileScreen({ currentUser, players = [], trainings = [], matches = [], attendance = {}, clubId, selectedClub }) {
  const topClearance = useTopClearance();
  const isParent = currentUser?.role === "parent";
  // RLS întoarce doar jucătorul propriu (sau copilul, pentru părinte).
  const myPlayer = players[0] || null;

  const { data: evaluations = {} } = useQuery({
    queryKey: ["evaluations", clubId],
    queryFn: () => supabaseService.getEvaluations(clubId),
    enabled: !!clubId,
  });
  const { data: monthlyPayments = {} } = useQuery({
    queryKey: ["monthlyPayments", clubId],
    queryFn: () => supabaseService.getMonthlyPayments(clubId),
    enabled: !!clubId,
  });

  const myEval = myPlayer ? evaluations[myPlayer.id] : null;

  // Prezența proprie din marcajele existente.
  const presence = useMemo(() => {
    if (!myPlayer) return { total: 0, present: 0 };
    let total = 0, present = 0;
    Object.values(attendance || {}).forEach((byPlayer) => {
      const st = byPlayer?.[myPlayer.id];
      if (st) { total += 1; if (st === "present" || st === "late") present += 1; }
    });
    return { total, present };
  }, [attendance, myPlayer]);
  const attendanceRate = presence.total ? Math.round((presence.present / presence.total) * 100) : null;

  // Cotizații proprii (câte plătite / restante din lunile înregistrate).
  const fees = useMemo(() => {
    if (!myPlayer) return { paid: 0, unpaid: 0 };
    let paid = 0, unpaid = 0;
    Object.values(monthlyPayments || {}).forEach((byPlayer) => {
      const p = byPlayer?.[myPlayer.id];
      if (p) { if (p.paid) paid += 1; else unpaid += 1; }
    });
    return { paid, unpaid };
  }, [monthlyPayments, myPlayer]);

  const upcoming = useMemo(() => {
    if (!myPlayer) return [];
    const items = [];
    trainings.filter((t) => t.group === myPlayer.group).forEach((t) =>
      items.push({ kind: "Antrenament", title: t.theme || "Antrenament", date: t.date, time: t.time, location: t.location, color: C.purple }));
    matches.filter((m) => m.group === myPlayer.group).forEach((m) => {
      const callUp = (m.callUps || {})[String(myPlayer.id)] || null;
      items.push({ kind: "Meci", title: `vs ${m.opponent}`, date: m.date, time: m.time, location: m.location, color: C.blue, callUp });
    });
    return items
      .map((i) => ({ ...i, d: parseRoDate(i.date) }))
      .filter((i) => i.d && i.d >= new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate()))
      .sort((a, b) => a.d - b.d)
      .slice(0, 5);
  }, [trainings, matches, myPlayer]);

  const enableReminders = async () => {
    if (Platform.OS === "web") {
      notify("Disponibil în aplicația mobilă", `Reminderele push locale funcționează în aplicația ${BRAND_NAME} (iOS/Android).`);
      return;
    }
    if (upcoming.length === 0) {
      notify("Nicio activitate", "Nu ai activități viitoare pentru care să setez remindere.");
      return;
    }
    try {
      let count = 0;
      for (const item of upcoming) {
        const id = await notificationService.scheduleReminder(
          `${item.kind}: ${item.title}`,
          `${item.date} • ${item.time} • ${item.location}`,
          item.d
        );
        if (id) count += 1;
      }
      notify("Remindere setate", count ? `Am programat ${count} remindere (cu 2h înainte).` : "Activitățile sunt prea aproape pentru remindere.");
    } catch (e) {
      notify("Eroare", e.message);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={[styles.content, topClearance]} showsVerticalScrollIndicator={false}>
      <TopBar title={isParent ? "Copilul meu" : "Profilul meu"} eyebrow={selectedClub?.name || BRAND_NAME} />

      {!myPlayer ? (
        <View style={styles.emptyState}>
          <LucideIcons.UserX size={38} color={C.muted} />
          <Text style={styles.emptyText}>
            Contul tău nu este încă legat de un jucător. Contactează antrenorul clubului.
          </Text>
        </View>
      ) : (
        <>
          {/* Card jucător */}
          <View style={styles.heroCard}>
            <View style={styles.heroAvatar}><LucideIcons.User size={26} color="white" /></View>
            <View style={{ flex: 1, marginLeft: 14 }}>
              <Text style={styles.heroName}>{myPlayer.name}</Text>
              <Text style={styles.heroMeta}>#{myPlayer.no || "—"} • {myPlayer.role || "Jucător"} • {myPlayer.group}</Text>
              <View style={[styles.statusPill, { backgroundColor: (myPlayer.status === "Activ" ? C.green : C.amber) + "18" }]}>
                <Text style={[styles.statusPillText, { color: myPlayer.status === "Activ" ? C.green : C.amber }]}>{myPlayer.status || "Activ"}</Text>
              </View>
            </View>
          </View>

          {/* Statistici proprii */}
          <View style={styles.statsRow}>
            <StatBox icon="TrendingUp" label="Prezență" val={attendanceRate === null ? "—" : `${attendanceRate}%`} color={C.green} />
            <StatBox icon="CircleCheck" label="Cotizații plătite" val={String(fees.paid)} color={C.cyan} />
            <StatBox icon="CircleAlert" label="Restante" val={String(fees.unpaid)} color={fees.unpaid > 0 ? C.red : C.dim} />
          </View>

          {/* Evaluare */}
          <SectionTitle title="Evaluarea mea" />
          {myEval ? (
            <View style={styles.evalCard}>
              <RadarChart evalRow={myEval} />
              <View style={{ flex: 1, gap: 8 }}>
                {METRICS.map(([key, label]) => (
                  <View key={key} style={styles.evalRow}>
                    <Text style={styles.evalLabel}>{label}</Text>
                    <View style={styles.evalBarBg}><View style={[styles.evalBarFill, { width: `${(Number(myEval[key]) || 0) * 10}%` }]} /></View>
                    <Text style={styles.evalVal}>{Number(myEval[key]) || 0}</Text>
                  </View>
                ))}
              </View>
            </View>
          ) : (
            <View style={styles.plainCard}><Text style={styles.plainText}>Nicio evaluare încă. Antrenorul o va completa în timp.</Text></View>
          )}

          {/* Program */}
          <SectionTitle title="Următoarele activități" action="Reminder" onAction={enableReminders} />
          {upcoming.length === 0 ? (
            <View style={styles.plainCard}><Text style={styles.plainText}>Nicio activitate programată pentru grupa {myPlayer.group}.</Text></View>
          ) : (
            upcoming.map((item, i) => {
              const call = item.callUp ? (CALLUP[item.callUp] || null) : null;
              return (
                <View key={i} style={styles.activityRow}>
                  <View style={[styles.activityDot, { backgroundColor: item.color }]} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.activityTitle}>{item.kind}: {item.title}</Text>
                    <Text style={styles.activityMeta}>{item.date} • {item.time} • {item.location}</Text>
                  </View>
                  {call && (
                    <View style={[styles.callTag, { backgroundColor: call.color + "18", borderColor: call.color + "40" }]}>
                      <Text style={[styles.callTagText, { color: call.color }]}>{call.label}</Text>
                    </View>
                  )}
                </View>
              );
            })
          )}
        </>
      )}
    </ScrollView>
  );
}

const StatBox = ({ icon, label, val, color }) => {
  const Icon = LucideIcons[icon] || LucideIcons.Circle;
  return (
    <View style={styles.statBox}>
      <Icon size={18} color={color} />
      <Text style={styles.statVal}>{val}</Text>
      <Text style={styles.statLabel} numberOfLines={1}>{label}</Text>
    </View>
  );
};

const RadarChart = ({ evalRow }) => {
  const size = 140, cx = size / 2, cy = size / 2, r = 50, n = METRICS.length;
  const pts = METRICS.map(([key], i) => {
    const a = (Math.PI * 2 * i) / n - Math.PI / 2;
    const v = (Number(evalRow[key]) || 0) / 10;
    return `${cx + r * v * Math.cos(a)},${cy + r * v * Math.sin(a)}`;
  }).join(" ");
  const grid = METRICS.map((_, i) => {
    const a = (Math.PI * 2 * i) / n - Math.PI / 2;
    return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) };
  });
  return (
    <Svg width={size} height={size}>
      {[0.5, 1].map((f, i) => (
        <Polygon key={i} points={grid.map((g) => `${cx + (g.x - cx) * f},${cy + (g.y - cy) * f}`).join(" ")} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
      ))}
      {grid.map((g, i) => <Line key={i} x1={cx} y1={cy} x2={g.x} y2={g.y} stroke="rgba(255,255,255,0.08)" strokeWidth="1" />)}
      <Polygon points={pts} fill={C.cyan + "33"} stroke={C.cyan} strokeWidth="2" />
    </Svg>
  );
};

const styles = themedStyles((C) => StyleSheet.create({
  container: { flex: 1, backgroundColor: "transparent" },
  content: { padding: 18, paddingBottom: layout.navClearance },
  emptyState: { alignItems: "center", justifyContent: "center", paddingVertical: 50, gap: 12 },
  emptyText: { color: C.muted, fontSize: 12.5, fontWeight: "600", textAlign: "center", lineHeight: 18, paddingHorizontal: 24 },

  heroCard: { flexDirection: "row", alignItems: "center", backgroundColor: C.card, borderRadius: 20, padding: 18, borderWidth: 1, borderColor: C.line, marginBottom: 14 },
  heroAvatar: { width: 56, height: 56, borderRadius: 28, backgroundColor: C.cyan + "1F", borderWidth: 1, borderColor: C.cyan + "4C", alignItems: "center", justifyContent: "center" },
  heroName: { color: C.text, fontSize: 18, fontWeight: "900" },
  heroMeta: { color: C.muted, fontSize: 11, fontWeight: "700", marginTop: 3 },
  statusPill: { alignSelf: "flex-start", paddingHorizontal: 10, paddingVertical: 3, borderRadius: 8, marginTop: 8 },
  statusPillText: { fontSize: 9, fontWeight: "900" },

  statsRow: { flexDirection: "row", flexWrap: "wrap", gap: 12, marginBottom: 8 },
  statBox: { flexBasis: 96, flexGrow: 1, backgroundColor: C.card, borderRadius: 16, padding: 14, alignItems: "center", borderWidth: 1, borderColor: C.line },
  statVal: { color: C.text, fontSize: 18, fontWeight: "900", marginTop: 8 },
  statLabel: { color: C.dim, fontSize: 9, fontWeight: "800", marginTop: 2, textTransform: "uppercase" },

  evalCard: { flexDirection: "row", alignItems: "center", gap: 14, backgroundColor: C.card, borderRadius: 20, padding: 16, borderWidth: 1, borderColor: C.line },
  evalRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  evalLabel: { color: C.text, fontSize: 10, fontWeight: "800", width: 62 },
  evalBarBg: { flex: 1, height: 5, backgroundColor: C.fill2, borderRadius: 3, overflow: "hidden" },
  evalBarFill: { height: "100%", backgroundColor: C.cyan, borderRadius: 3 },
  evalVal: { color: C.text, fontSize: 11, fontWeight: "900", width: 16, textAlign: "right" },

  plainCard: { backgroundColor: C.card, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: C.line },
  plainText: { color: C.muted, fontSize: 12, fontWeight: "600", lineHeight: 17 },

  activityRow: { flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: C.card, borderRadius: 14, padding: 14, marginBottom: 8, borderWidth: 1, borderColor: C.line },
  activityDot: { width: 8, height: 8, borderRadius: 4 },
  activityTitle: { color: C.text, fontSize: 12.5, fontWeight: "800" },
  activityMeta: { color: C.dim, fontSize: 10, fontWeight: "700", marginTop: 2 },
  callTag: { paddingHorizontal: 9, paddingVertical: 4, borderRadius: 8, borderWidth: 1 },
  callTagText: { fontSize: 9.5, fontWeight: "900" },
}));
