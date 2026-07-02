import React, { useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import * as LucideIcons from "lucide-react-native";
import { colors as C } from "../constants/theme";
import { TopBar, SectionTitle } from "../components/SharedComponents";
import { BeUIButton } from "../components/ui/be-ui-button";

export default function FinancesScreen({
  players = [],
  trainings = [],
  transactions = [],
  clubSettings = {},
  openNotifications,
}) {
  const [view, setView] = useState("Buget");
  const [selectedGroup, setSelectedGroup] = useState("U19");

  const incomeTotal = transactions.filter((row) => row.positive).reduce((sum, row) => sum + Number(row.value || 0), 0);
  const expenseTotal = transactions.filter((row) => !row.positive).reduce((sum, row) => sum + Number(row.value || 0), 0);
  const balance = incomeTotal - expenseTotal;

  const groupPlayers = players.filter(p => p.group === selectedGroup);

  return (
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <TopBar title="Finanțe" eyebrow="BUGET ȘI PLĂȚI" openNotifications={openNotifications} />

      <View style={styles.viewToggle}>
        {["Buget", "Plăți Antren.", "Cotizații"].map(v => (
          <Pressable key={v} style={[styles.toggleBtn, view === v && styles.toggleBtnActive]} onPress={() => setView(v)}>
            <Text style={[styles.toggleText, view === v && styles.toggleTextActive]}>{v}</Text>
          </Pressable>
        ))}
      </View>

      {view === "Buget" ? (
        <>
          <View style={styles.balanceCard}>
            <Text style={styles.balanceLabel}>SOLD DISPONIBIL</Text>
            <Text style={styles.balanceValue}>{balance.toLocaleString("ro-RO")} MDL</Text>
            <View style={styles.statsRow}>
              <View>
                <Text style={{color: C.muted, fontSize: 8}}>VENITURI</Text>
                <Text style={{color: C.green, fontWeight: '900'}}>+{incomeTotal}</Text>
              </View>
              <View style={styles.divider} />
              <View>
                <Text style={{color: C.muted, fontSize: 8}}>CHELTUIELI</Text>
                <Text style={{color: C.red, fontWeight: '900'}}>-{expenseTotal}</Text>
              </View>
            </View>
          </View>

          <SectionTitle title="Tranzacții Recente" />
          {transactions.map((tx) => (
            <View key={tx.id} style={styles.txRow}>
              <View style={[styles.txIcon, {backgroundColor: tx.positive ? `${C.green}20` : `${C.red}20`}]}>
                {tx.positive ? <LucideIcons.ArrowDown size={16} color={C.green} /> : <LucideIcons.ArrowUp size={16} color={C.red} />}
              </View>
              <View style={{flex: 1, marginLeft: 12}}>
                <Text style={{color: 'white', fontWeight: '700'}}>{tx.label}</Text>
                <Text style={{color: C.muted, fontSize: 9}}>{tx.date || "Recent"}</Text>
              </View>
              <Text style={{color: tx.positive ? C.green : 'white', fontWeight: '900'}}>{tx.positive ? "+" : "-"}{tx.value} MDL</Text>
            </View>
          ))}
        </>
      ) : (
        <>
          <SectionTitle title={`Plăți Grupa ${selectedGroup}`} />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{marginBottom: 15}}>
            {["U13", "U16", "U19", "Seniori"].map(g => (
              <Pressable key={g} style={[styles.groupChip, selectedGroup === g && styles.groupChipActive]} onPress={() => setSelectedGroup(g)}>
                <Text style={{color: selectedGroup === g ? 'white' : C.muted}}>{g}</Text>
              </Pressable>
            ))}
          </ScrollView>

          {groupPlayers.map(player => (
            <View key={player.id} style={styles.playerPayCard}>
              <View style={{flex: 1}}>
                <Text style={{color: 'white', fontWeight: '800'}}>{player.name}</Text>
                <Text style={{color: C.muted, fontSize: 10}}>Standard: {clubSettings?.monthlyFee || 600} MDL</Text>
              </View>
              <BeUIButton
                label="MARCHEAZĂ ACHITAT"
                variant="outline"
                size="sm"
                onPress={() => Alert.alert("Plată", `${player.name} poate fi marcat achitat din modulul Finanțe SaaS conectat la baza de date.`)}
                textStyle={{ fontSize: 10 }}
              />
            </View>
          ))}
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 18, paddingBottom: 32 },
  viewToggle: { flexDirection: 'row', backgroundColor: C.card, borderRadius: 12, padding: 4, marginBottom: 20 },
  toggleBtn: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 10 },
  toggleBtnActive: { backgroundColor: C.panel },
  toggleText: { color: C.muted, fontSize: 11, fontWeight: '800' },
  toggleTextActive: { color: 'white' },
  balanceCard: { backgroundColor: C.card, borderRadius: 22, padding: 20, alignItems: "center", borderWidth: 1, borderColor: C.line },
  balanceLabel: { color: C.muted, fontSize: 9, fontWeight: "800", letterSpacing: 1.5 },
  balanceValue: { color: C.text, fontSize: 32, fontWeight: "900", marginVertical: 12 },
  statsRow: { flexDirection: 'row', width: '100%', justifyContent: 'space-around', borderTopWidth: 1, borderTopColor: C.line, paddingTop: 15 },
  divider: { width: 1, height: 25, backgroundColor: C.line },
  txRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.card, padding: 12, borderRadius: 15, marginBottom: 8 },
  txIcon: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  groupChip: { paddingHorizontal: 15, paddingVertical: 8, borderRadius: 12, backgroundColor: C.card, marginRight: 8, borderWidth: 1, borderColor: C.line },
  groupChipActive: { backgroundColor: C.red, borderColor: C.red },
  playerPayCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.card, padding: 14, borderRadius: 16, marginBottom: 9, borderWidth: 1, borderColor: C.line },
  payBtn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: C.green }
});
