import React, { useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import * as LucideIcons from "lucide-react-native";
import { colors as C } from "../constants/theme";
import { TopBar, SectionTitle } from "../components/SharedComponents";
import { BeUIButton } from "../components/ui/be-ui-button";

const attendanceOptions = [
  ["present", "Check", "Prezent", C.green],
  ["absent", "X", "Absent", C.red],
  ["late", "Clock", "Întârziat", C.amber],
  ["injured", "Plus", "Accidentat", "#D47AF0"],
];

export default function TrainingsScreen({ players, trainings, setTrainings, attendance = {}, setAttendance, currentUser, selectedClub, openNotifications }) {
  const [view, setView] = useState("list");
  const [selected, setSelected] = useState(null);
  const [filter, setFilter] = useState("Toate");

  const safeGroups = clubGroups;
  const visibleTrainings = trainings.filter(t => filter === "Toate" || t.group === filter);
  const groupPlayers = players.filter(p => p.group === selected?.group);

  const markAttendance = (pId, status) => {
    setAttendance({
      ...attendance,
      [selected.id]: {
        ...(attendance[selected.id] || {}),
        [pId]: status
      }
    });
  };

  if (view === "detail" && selected) {
    return (
      <ScrollView contentContainerStyle={styles.content}>
        <BeUIButton
          label="Toate antrenamentele"
          variant="ghost"
          size="sm"
          icon="ChevronLeft"
          onPress={() => setView("list")}
          style={{ alignSelf: "flex-start", marginBottom: 14 }}
        />
        <TopBar title={selected.theme} eyebrow={selected.group} openNotifications={openNotifications} />

        <View style={styles.detailHero}>
          <Text style={{color: 'white', opacity: 0.6}}>{selected.date} • {selected.time}</Text>
          <Text style={{color: 'white', fontWeight: '900', marginTop: 5}}><LucideIcons.MapPin size={13} color="white" /> {selected.location}</Text>
        </View>

        <SectionTitle title="Prezență Jucători" />
        {groupPlayers.map(player => {
          const currentStatus = attendance[selected.id]?.[player.id];
          return (
            <View key={player.id} style={styles.attendanceCard}>
              <Text style={{color: 'white', fontWeight: '700'}}>{player.name}</Text>
              <View style={styles.statusRow}>
                {attendanceOptions.map(([key, iconName, label, color]) => (
                  <BeUIButton
                    key={key}
                    variant={currentStatus === key ? (key === "present" ? "success" : key === "absent" ? "danger" : "secondary") : "ghost"}
                    size="sm"
                    icon={iconName}
                    onPress={() => markAttendance(player.id, key)}
                    style={[
                      { width: 32, height: 32, paddingHorizontal: 0 },
                      currentStatus === key && key === "late" && { backgroundColor: C.amber }
                    ]}
                  />
                ))}
              </View>
            </View>
          );
        })}
      </ScrollView>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <TopBar title="Antrenamente" eyebrow="CENTRUL DE PREGĂTIRE" openNotifications={openNotifications} />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{marginVertical: 15}}>
        {["Toate", "U13", "U16", "U19", "Juniori", "Seniori"].map((group) => (
          <Pressable key={group} style={[styles.filterChip, filter === group && styles.filterChipActive]} onPress={() => setFilter(group)}>
            <Text style={[styles.filterChipText, filter === group && styles.filterChipTextActive]}>{group}</Text>
          </Pressable>
        ))}
      </ScrollView>
      {visibleTrainings.map((training) => (
        <Pressable key={training.id} style={styles.trainingCard} onPress={() => { setSelected(training); setView("detail"); }}>
          <View style={{flexDirection: 'row', justifyContent: 'space-between'}}>
            <Text style={styles.trainingTitle}>{training.theme}</Text>
            <Text style={{color: C.blue, fontWeight: '900'}}>{training.group}</Text>
          </View>
          <Text style={styles.trainingMeta}>{training.date} • {training.time}</Text>
        </Pressable>
      ))}
    </ScrollView>
  );
}

const clubGroups = ["U13", "U16", "U19", "Juniori", "Seniori"];

const styles = StyleSheet.create({
  content: { padding: 18, paddingBottom: 32 },
  filterChip: { paddingVertical: 7, paddingHorizontal: 15, borderRadius: 18, borderWidth: 1, borderColor: C.line, marginRight: 8 },
  filterChipActive: { backgroundColor: C.red, borderColor: C.red },
  filterChipText: { color: C.muted, fontSize: 11, fontWeight: "800" },
  trainingCard: { backgroundColor: C.card, borderRadius: 18, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: C.line },
  trainingTitle: { color: 'white', fontSize: 15, fontWeight: "800" },
  trainingMeta: { color: C.muted, fontSize: 10, marginTop: 5 },
  detailHero: { backgroundColor: C.card, padding: 20, borderRadius: 20, marginBottom: 20 },
  attendanceCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: C.card, padding: 12, borderRadius: 15, marginBottom: 8 },
  statusRow: { flexDirection: 'row', gap: 5 },
  statusBtn: { width: 32, height: 32, borderRadius: 8, backgroundColor: C.bg, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: C.line },
  backLink: { flexDirection: "row", alignItems: "center", marginBottom: 14 },
  backText: { color: C.blue, fontSize: 12, fontWeight: "800" },
});
