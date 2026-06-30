import React, { useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import * as LucideIcons from "lucide-react-native";
import { colors as C } from "../constants/theme";
import { TopBar, SectionTitle, TrainingField } from "../components/SharedComponents";
import { BeUIButton } from "../components/ui/be-ui-button";

const callUpOptions = [
  ["convocat", "CheckCircle2", "Convocat", C.green],
  ["rezervă", "Circle", "Rezervă", C.amber],
  ["indisponibil", "XCircle", "Indisponibil", C.red],
  ["confirmat", "ShieldCheck", "Confirmat", C.blue],
];
const matchSquadStatuses = ["convocat", "confirmat", "rezervă"];

export default function MatchesScreen({ players, matches, setMatches, currentUser, selectedClub, openNotifications }) {
  const [selectedGroup, setSelectedGroup] = useState("U19");
  const [activeStatsPlayerId, setActiveStatsPlayerId] = useState(null);
  const [showMatchForm, setShowMatchForm] = useState(false);

  const groupMatches = matches.filter((match) => match.group === selectedGroup);
  const selectedMatch = groupMatches[0]; // Simplified for selection logic
  const canEdit = ["super_admin", "club_owner", "admin", "coach"].includes(currentUser?.role);

  const matchAnalysisPlayers = players.filter(p => p.group === selectedGroup && (selectedMatch?.callUps?.[p.id]));

  return (
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <TopBar title="Meciuri" eyebrow="PROGRAM ȘI CONVOCĂRI" openNotifications={openNotifications} />

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.groupFilters}>
        {["U13", "U16", "U19", "Juniori", "Seniori"].map((group) => (
          <Pressable key={group} style={[styles.filterChip, selectedGroup === group && styles.filterChipActive]} onPress={() => setSelectedGroup(group)}>
            <Text style={[styles.filterChipText, selectedGroup === group && styles.filterChipTextActive]}>{group}</Text>
          </Pressable>
        ))}
      </ScrollView>

      {selectedMatch ? (
        <>
          <View style={styles.matchHero}>
            <Text style={styles.matchHeroTag}>{selectedMatch.group} • {selectedMatch.type}</Text>
            <Text style={styles.matchHeroTitle}>FC Autentic vs {selectedMatch.opponent}</Text>
            <Text style={styles.matchHeroMeta}>{selectedMatch.date} • {selectedMatch.time} • {selectedMatch.location}</Text>
            <View style={styles.scoreBox}>
              <Text style={styles.scoreText}>{selectedMatch.score || "v-v"}</Text>
            </View>
          </View>

          <SectionTitle title="Primul 11 / Formație" />
          <View style={styles.pitchCard}>
            {["Atac", "Mijloc", "Apărare", "Portar"].map((line) => (
              <View style={styles.pitchLine} key={line}>
                <Text style={styles.pitchLineLabel}>{line}</Text>
                <View style={styles.pitchPlayers}>
                  {matchAnalysisPlayers.length > 0 ? (
                    matchAnalysisPlayers.slice(0, 3).map(p => (
                      <View key={p.id} style={styles.pitchPlayer}>
                        <Text style={styles.pitchPlayerNo}>{p.no}</Text>
                        <Text style={styles.pitchPlayerName}>{p.name.split(" ")[0]}</Text>
                      </View>
                    ))
                  ) : <Text style={{color: 'white', opacity: 0.5}}>Niciun jucător selectat</Text>}
                </View>
              </View>
            ))}
          </View>

          <SectionTitle title="Convocări" action={canEdit ? "Modifică" : null} />
          {players.filter(p => p.group === selectedGroup).map(player => (
            <View key={player.id} style={styles.callUpCard}>
              <View style={{flex: 1}}>
                <Text style={{color: 'white', fontWeight: '800'}}>{player.name}</Text>
                <Text style={{color: C.muted, fontSize: 10}}>{player.role}</Text>
              </View>
              <Text style={{color: C.blue, fontWeight: '900'}}>{selectedMatch.callUps?.[player.id] || "Neconvocat"}</Text>
            </View>
          ))}
        </>
      ) : (
        <View style={styles.emptyState}>
          <LucideIcons.Trophy size={40} color={C.muted} />
          <Text style={styles.emptyText}>Nu sunt meciuri programate pentru această grupă.</Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 18, paddingBottom: 32 },
  groupFilters: { gap: 7, paddingVertical: 13 },
  filterChip: { paddingVertical: 7, paddingHorizontal: 15, borderRadius: 18, borderWidth: 1, borderColor: C.line },
  filterChipActive: { backgroundColor: C.red, borderColor: C.red },
  filterChipText: { color: C.muted, fontSize: 10, fontWeight: "800" },
  filterChipTextActive: { color: C.text },
  matchHero: { backgroundColor: C.card, borderRadius: 22, padding: 18, borderLeftWidth: 3, borderLeftColor: C.red, marginBottom: 15 },
  matchHeroTag: { color: C.blue, fontSize: 9, fontWeight: "900" },
  matchHeroTitle: { color: C.text, fontSize: 20, fontWeight: "900", marginTop: 8 },
  matchHeroMeta: { color: C.muted, fontSize: 10, marginTop: 7 },
  scoreBox: { marginTop: 15, backgroundColor: C.bg, padding: 10, borderRadius: 12, alignItems: 'center' },
  scoreText: { color: C.text, fontSize: 24, fontWeight: '900' },
  pitchCard: { backgroundColor: "#0B3A2B", borderRadius: 20, padding: 14, borderWidth: 1, borderColor: `${C.green}66`, marginBottom: 12 },
  pitchLine: { alignItems: "center", borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.14)", paddingVertical: 9 },
  pitchLineLabel: { color: "rgba(255,255,255,0.72)", fontSize: 8, fontWeight: "900", marginBottom: 6 },
  pitchPlayers: { flexDirection: "row", justifyContent: "center", gap: 8, flexWrap: "wrap" },
  pitchPlayer: { alignItems: "center", backgroundColor: "rgba(255,255,255,0.12)", borderRadius: 13, paddingVertical: 7, paddingHorizontal: 9, minWidth: 58 },
  pitchPlayerNo: { color: C.text, fontSize: 13, fontWeight: "900" },
  pitchPlayerName: { color: C.text, fontSize: 8, fontWeight: "800", marginTop: 2 },
  callUpCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.card, padding: 12, borderRadius: 14, marginBottom: 8, borderWidth: 1, borderColor: C.line },
  emptyState: { alignItems: "center", justifyContent: "center", paddingVertical: 50 },
  emptyText: { color: C.muted, marginTop: 10 },
});
