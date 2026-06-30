import React from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import * as LucideIcons from "lucide-react-native";
import { colors as C } from "../constants/theme";
import { TopBar } from "../components/SharedComponents";
import { currentMonthLabel } from "../utils/dates";

export default function CalendarScreen({ trainings, matches, openNotifications }) {
  return (
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <TopBar title="Calendar" eyebrow="MECIURI ȘI ANTRENAMENTE" openNotifications={openNotifications} />
      <View style={styles.monthBar}>
        <LucideIcons.CalendarDays size={18} color={C.blue} style={{ marginRight: 8 }} />
        <Text style={styles.monthText}>{currentMonthLabel()}</Text>
      </View>
      <View style={styles.emptyState}>
        <LucideIcons.CalendarOff size={40} color={C.muted} />
        <Text style={styles.emptyText}>Programul tău va apărea aici.</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 18, paddingBottom: 32 },
  monthBar: { flexDirection: 'row', backgroundColor: C.card, padding: 14, borderRadius: 15, marginBottom: 13, alignItems: 'center', justifyContent: 'center' },
  monthText: { color: C.text, fontWeight: "800", fontSize: 15 },
  emptyState: { alignItems: "center", justifyContent: "center", paddingVertical: 60, gap: 12 },
  emptyText: { color: C.muted, fontSize: 13, fontWeight: '600' },
});
