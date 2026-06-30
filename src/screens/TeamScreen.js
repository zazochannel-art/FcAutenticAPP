import React, { useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, View, TextInput } from "react-native";
import * as LucideIcons from "lucide-react-native";
import { colors as C } from "../constants/theme";
import { TopBar, Metric, SectionTitle, TrainingField } from "../components/SharedComponents";

import { BeUIButton } from "../components/ui/be-ui-button";

const clubGroups = ["U13", "U16", "U19", "Juniori", "Seniori"];
const attendanceOptions = [
  ["present", "✓", "Prezent", C.green],
  ["absent", "×", "Absent", C.red],
  ["late", "⏱", "Întârziat", C.amber],
  ["injured", "+", "Accidentat", "#D47AF0"],
  ["excused", "•", "Scutit", C.blue],
];

export default function TeamScreen({ players, setPlayers, currentUser, trainings = [], attendance = {}, payments = {}, monthlyPayments = {}, matches = [], clubSettings, playerObservations = {}, selectedClub, openNotifications }) {
  const [selectedGroup, setSelectedGroup] = useState("U19");
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [editingPlayer, setEditingPlayer] = useState(false);
  const [playerForm, setPlayerForm] = useState({});
  const [showAddPlayer, setShowAddPlayer] = useState(false);
  const [newPlayer, setNewPlayer] = useState({ name: "", no: "", role: "Mijlocaș", group: "U19" });

  const activeGroups = ["super_admin", "club_owner", "admin"].includes(currentUser?.role) ? (selectedClub?.groups || clubGroups) : [...new Set(players.map(p => p.group))];
  const safeSelectedGroup = activeGroups.includes(selectedGroup) ? selectedGroup : activeGroups[0];
  const visiblePlayers = players.filter((player) => player.group === safeSelectedGroup);

  const getAttendanceStats = (player) => {
    const relevant = trainings.filter((t) => t.group === player.group);
    const statuses = relevant.map((t) => attendance[t.id]?.[player.id]).filter(Boolean);
    const presentCount = statuses.filter((s) => s === "present").length;
    const percentage = statuses.length ? Math.round(((presentCount) / statuses.length) * 100) : 0;
    return { total: relevant.length, present: presentCount, percentage };
  };

  if (selectedPlayer) {
    const stats = getAttendanceStats(selectedPlayer);
    return (
      <ScrollView contentContainerStyle={styles.content}>
        <BeUIButton
          label="Înapoi la echipă"
          variant="ghost"
          size="sm"
          icon="ChevronLeft"
          onPress={() => setSelectedPlayer(null)}
          style={{ alignSelf: "flex-start", marginBottom: 14 }}
        />
        <TopBar title={selectedPlayer.name} eyebrow={`PROFIL JUCĂTOR • ${selectedPlayer.group}`} openNotifications={openNotifications} />

        <View style={styles.playerHero}>
          <View style={styles.avatarLarge}>
            <LucideIcons.User size={40} color="white" />
          </View>
          <Text style={styles.heroName}>{selectedPlayer.name}</Text>
          <Text style={styles.heroMeta}>#{selectedPlayer.no} • {selectedPlayer.role}</Text>
          <Text style={styles.percentText}>{stats.percentage}%</Text>
          <Text style={styles.percentLabel}>prezență la antrenamente</Text>
        </View>

        <View style={styles.statsGrid}>
          <Metric icon="calendar-outline" value={stats.total} label="Antren." color={C.blue} />
          <Metric icon="checkmark-circle-outline" value={stats.present} label="Prezent" color={C.green} />
          <Metric icon="football-outline" value="0" label="Goluri" color={C.red} />
        </View>

        <SectionTitle title="Detalii Personale" />
        <View style={styles.detailsBox}>
          <Text style={styles.detailText}><Text style={{fontWeight: '900'}}>Status:</Text> {selectedPlayer.status}</Text>
          <Text style={styles.detailText}><Text style={{fontWeight: '900'}}>Telefon:</Text> {selectedPlayer.parentPhone || "Nespecificat"}</Text>
          <Text style={styles.detailText}><Text style={{fontWeight: '900'}}>Medical:</Text> {selectedPlayer.medicalStatus || "Apt"}</Text>
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <TopBar title="Echipă" eyebrow="LOT ȘI PREZENȚĂ" openNotifications={openNotifications} />
      <View style={styles.teamGroups}>
        {activeGroups.map((group) => (
          <Pressable key={group} style={[styles.teamGroupCard, safeSelectedGroup === group && styles.teamGroupCardActive]} onPress={() => setSelectedGroup(group)}>
            <Text style={[styles.teamGroupName, safeSelectedGroup === group && styles.teamGroupNameActive]}>{group}</Text>
          </Pressable>
        ))}
      </View>
      {visiblePlayers.map((player) => (
        <Pressable style={styles.playerRow} key={player.id} onPress={() => setSelectedPlayer(player)}>
          <Text style={styles.playerNo}>{player.no}</Text>
          <View style={styles.playerInfo}><Text style={styles.playerName}>{player.name}</Text><Text style={styles.playerRole}>{player.role}</Text></View>
          <LucideIcons.ChevronRight size={19} color={C.muted} />
        </Pressable>
      ))}

      {showAddPlayer && (
        <View style={styles.formCard}>
          <TrainingField label="Nume jucător" value={newPlayer.name} onChange={(name) => setNewPlayer({ ...newPlayer, name })} />
          <BeUIButton
            label="Salvează"
            variant="danger"
            size="md"
            icon="Save"
            onPress={() => {
              if (!newPlayer.name.trim()) { Alert.alert("Lipseste numele", "Completeaza numele jucatorului."); return; }
              setPlayers(current => [...current, { id: Date.now(), ...newPlayer, clubId: selectedClub?.id, status: "Activ", present: true }]);
              setShowAddPlayer(false);
            }}
            fullWidth
            style={{ marginTop: 10 }}
          />
        </View>
      )}

      <BeUIButton
        label={showAddPlayer ? "Închide" : "Adaugă jucător"}
        variant="outline"
        size="md"
        icon={showAddPlayer ? "X" : "UserPlus"}
        onPress={() => setShowAddPlayer(!showAddPlayer)}
        fullWidth
        style={{ marginTop: 15 }}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 18, paddingBottom: 32 },
  teamGroups: { flexDirection: "row", flexWrap: "wrap", gap: 9, paddingBottom: 14 },
  teamGroupCard: { flexGrow: 1, backgroundColor: C.card, borderRadius: 16, padding: 12, borderWidth: 1, borderColor: C.line, alignItems: 'center' },
  teamGroupCardActive: { backgroundColor: C.red, borderColor: C.red },
  teamGroupName: { color: C.text, fontSize: 14, fontWeight: "900" },
  playerRow: { flexDirection: "row", alignItems: "center", backgroundColor: C.card, borderRadius: 15, padding: 11, marginTop: 8 },
  playerNo: { color: C.red, width: 26, fontSize: 17, fontWeight: "900", textAlign: "center" },
  playerInfo: { flex: 1, marginLeft: 10 },
  playerName: { color: C.text, fontSize: 13, fontWeight: "800" },
  playerRole: { color: C.muted, fontSize: 9, marginTop: 4 },
  playerHero: { alignItems: 'center', backgroundColor: C.card, padding: 20, borderRadius: 24, marginBottom: 15 },
  avatarLarge: { width: 70, height: 70, borderRadius: 25, backgroundColor: C.red, alignItems: 'center', justifyContent: 'center' },
  heroName: { color: 'white', fontSize: 22, fontWeight: '900', marginTop: 12 },
  heroMeta: { color: C.muted, fontSize: 12, marginTop: 4 },
  percentText: { color: C.green, fontSize: 32, fontWeight: '900', marginTop: 15 },
  percentLabel: { color: C.muted, fontSize: 10 },
  statsGrid: { flexDirection: 'row', backgroundColor: C.card, padding: 15, borderRadius: 20, marginBottom: 15 },
  detailsBox: { backgroundColor: C.card, padding: 15, borderRadius: 18 },
  detailText: { color: 'white', fontSize: 13, marginBottom: 8 },
  backLink: { flexDirection: "row", alignItems: "center", marginBottom: 14 },
  backText: { color: C.blue, fontSize: 12, fontWeight: "800" },
});
