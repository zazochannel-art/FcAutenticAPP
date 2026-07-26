import React, { useState } from "react";
import { View, Text, ScrollView, StyleSheet, Pressable, Modal, TextInput, Platform, Alert } from "react-native";
import * as LucideIcons from "lucide-react-native";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { colors as C, themedStyles } from "../constants/theme";
import { TopBar } from "../components/SharedComponents";
import { supabaseService } from "../services/supabaseService";
import RoDateField from "../components/RoDateField";
import { SkeletonRow, EmptyState } from "../components/ui/visuals";

function notify(title, msg) {
  if (Platform.OS === "web") window.alert(`${title}\n\n${msg}`);
  else Alert.alert(title, msg);
}

const TYPES = ["Cartonaș galben", "Cartonaș roșu", "Suspendare", "Avertisment"];
const TYPE_COLORS_ = () => ({ "Cartonaș galben": C.amber, "Cartonaș roșu": C.red, "Suspendare": C.purple, "Avertisment": C.dim });

export default function DisciplineScreen({ clubId, players = [], selectedClub, currentUser, openNotifications }) {
  const queryClient = useQueryClient();
  const [addOpen, setAddOpen] = useState(false);

  const canManage = ["super_admin", "club_owner", "admin", "coach"].includes(currentUser?.role);

  const { data: records = [], isLoading } = useQuery({
    queryKey: ["discipline", clubId],
    queryFn: () => supabaseService.getDiscipline(clubId),
    enabled: !!clubId,
  });

  const playerName = (id) => players.find((p) => String(p.id) === String(id))?.name || "Jucător";

  const remove = (rec) => {
    const run = async () => {
      try { await supabaseService.deleteDiscipline(rec.id); queryClient.invalidateQueries({ queryKey: ["discipline"] }); }
      catch (e) { notify("Eroare", e.message); }
    };
    if (Platform.OS === "web") { if (window.confirm("Ștergi această înregistrare?")) run(); }
    else Alert.alert("Șterge", "Ștergi această înregistrare?", [{ text: "Anulează", style: "cancel" }, { text: "Șterge", style: "destructive", onPress: run }]);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <TopBar title="Disciplină" eyebrow={selectedClub?.name || "FOOTBAL MANAGER 99"} openNotifications={openNotifications} />

      {canManage && (
        <Pressable style={styles.addBtn} onPress={() => setAddOpen(true)}>
          <LucideIcons.Plus size={15} color="white" /><Text style={styles.addBtnText}>Înregistrează sancțiune</Text>
        </Pressable>
      )}

      {isLoading && <View>{[0, 1, 2, 3].map((i) => <SkeletonRow key={i} />)}</View>}
      {!isLoading && records.length === 0 && (
        <EmptyState
          icon="ShieldCheck"
          title="Niciun incident"
          subtitle="Nicio sancțiune înregistrată. Un club disciplinat!"
        />
      )}

      {records.map((r) => {
        const color = TYPE_COLORS_()[r.type] || C.dim;
        return (
          <View key={r.id} style={styles.card}>
            <View style={[styles.tagIcon, { backgroundColor: color + "18" }]}><LucideIcons.Flag size={16} color={color} /></View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <View style={styles.cardHead}>
                <Text style={styles.name} numberOfLines={1}>{playerName(r.player_id)}</Text>
                <View style={[styles.typeBadge, { backgroundColor: color + "18", borderColor: color + "40" }]}>
                  <Text style={[styles.typeBadgeText, { color }]}>{r.type}</Text>
                </View>
              </View>
              {!!r.note && <Text style={styles.note}>{r.note}</Text>}
              {!!r.suspended_until && <Text style={[styles.date, { color: C.purple }]}>Suspendat până la {r.suspended_until}</Text>}
              {!!r.date_label && <Text style={styles.date}>{r.date_label}</Text>}
            </View>
            {canManage && <Pressable onPress={() => remove(r)} style={styles.iconBtn}><LucideIcons.Trash2 size={15} color={C.red} /></Pressable>}
          </View>
        );
      })}

      <AddDisciplineModal
        visible={addOpen}
        players={players}
        onClose={() => setAddOpen(false)}
        onSaved={() => { setAddOpen(false); queryClient.invalidateQueries({ queryKey: ["discipline"] }); }}
      />
    </ScrollView>
  );
}

const SUSPENSION_TYPES = ["Cartonaș roșu", "Suspendare"];

function AddDisciplineModal({ visible, players, onClose, onSaved }) {
  const [playerId, setPlayerId] = useState(null);
  const [type, setType] = useState(TYPES[0]);
  const [note, setNote] = useState("");
  const [date, setDate] = useState("");
  const [suspendedUntil, setSuspendedUntil] = useState("");
  const [saving, setSaving] = useState(false);

  React.useEffect(() => { if (visible) { setPlayerId(null); setType(TYPES[0]); setNote(""); setDate(""); setSuspendedUntil(""); } }, [visible]);

  const isSuspension = SUSPENSION_TYPES.includes(type);

  const save = async () => {
    if (!playerId) { notify("Fără jucător", "Alege jucătorul sancționat."); return; }
    setSaving(true);
    try {
      await supabaseService.insertDiscipline({
        playerId, type, note: note.trim(), date: date.trim(),
        suspendedUntil: isSuspension && suspendedUntil.trim() ? suspendedUntil.trim() : null,
      });
      onSaved();
    } catch (e) { notify("Eroare", e.message); } finally { setSaving(false); }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={[styles.modalCard, { maxHeight: "85%" }]}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Sancțiune nouă</Text>
            <Pressable onPress={onClose}><LucideIcons.X size={18} color={C.dim} /></Pressable>
          </View>

          <Text style={styles.modalLabel}>JUCĂTOR</Text>
          {players.length === 0 ? (
            <Text style={styles.hint}>Niciun jucător în club. Adaugă jucători în tab-ul Echipă.</Text>
          ) : (
            <ScrollView style={{ maxHeight: 150 }} showsVerticalScrollIndicator={false}>
              {players.map((p) => (
                <Pressable key={p.id} onPress={() => setPlayerId(p.id)} style={[styles.playerRow, String(playerId) === String(p.id) && { borderColor: C.cyan, backgroundColor: C.cyan + "08" }]}>
                  <Text style={styles.playerName}>{p.name}</Text>
                  {String(playerId) === String(p.id) && <LucideIcons.Check size={14} color={C.cyan} />}
                </Pressable>
              ))}
            </ScrollView>
          )}

          <Text style={styles.modalLabel}>TIP</Text>
          <View style={styles.chipRow}>
            {TYPES.map((t) => (
              <Pressable key={t} onPress={() => setType(t)} style={[styles.chip, type === t && { borderColor: TYPE_COLORS_()[t], backgroundColor: TYPE_COLORS_()[t] + "12" }]}>
                <Text style={[styles.chipText, type === t && { color: TYPE_COLORS_()[t] }]}>{t}</Text>
              </Pressable>
            ))}
          </View>

          <Text style={styles.modalLabel}>MOTIV (opțional)</Text>
          <TextInput style={[styles.modalInput, { height: 60, textAlignVertical: "top", paddingTop: 10 }]} value={note} onChangeText={setNote} placeholder="Detalii..." placeholderTextColor={C.dim} multiline />
          <Text style={styles.modalLabel}>DATA (opțional)</Text>
          <RoDateField value={date} onChange={setDate} placeholder="Alege data" />

          {isSuspension && (
            <>
              <Text style={styles.modalLabel}>SUSPENDAT PÂNĂ LA (opțional)</Text>
              <RoDateField value={suspendedUntil} onChange={setSuspendedUntil} placeholder="Alege data" />
              <Text style={styles.hint}>Jucătorul apare automat indisponibil în Tactici și convocări până la această dată.</Text>
            </>
          )}

          <Pressable style={[styles.modalSaveBtn, saving && { opacity: 0.7 }]} onPress={save} disabled={saving}>
            <LucideIcons.Check size={16} color="white" /><Text style={styles.modalSaveText}>Înregistrează</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = themedStyles((C) => StyleSheet.create({
  container: { flex: 1, backgroundColor: "transparent" },
  content: { padding: 18, paddingBottom: 120 },
  addBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, height: 46, borderRadius: 14, backgroundColor: C.blue, marginBottom: 18 },
  addBtnText: { color: C.text, fontSize: 12.5, fontWeight: "900" },
  empty: { color: C.muted, fontSize: 12, fontWeight: "600", textAlign: "center", paddingVertical: 20 },
  emptyState: { alignItems: "center", justifyContent: "center", paddingVertical: 50, gap: 12 },
  emptyText: { color: C.muted, fontSize: 12.5, fontWeight: "600", textAlign: "center", lineHeight: 18, paddingHorizontal: 20 },
  card: { flexDirection: "row", alignItems: "flex-start", backgroundColor: C.card, borderRadius: 16, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: "rgba(255,255,255,0.05)" },
  tagIcon: { width: 36, height: 36, borderRadius: 11, alignItems: "center", justifyContent: "center", marginTop: 2 },
  cardHead: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 },
  name: { color: C.text, fontSize: 13, fontWeight: "800", flex: 1 },
  typeBadge: { paddingHorizontal: 9, paddingVertical: 3, borderRadius: 8, borderWidth: 1 },
  typeBadgeText: { fontSize: 9, fontWeight: "900" },
  note: { color: C.muted, fontSize: 11.5, fontWeight: "600", marginTop: 5, lineHeight: 16 },
  date: { color: C.dim, fontSize: 9.5, fontWeight: "700", marginTop: 4 },
  iconBtn: { width: 34, height: 34, borderRadius: 10, alignItems: "center", justifyContent: "center", marginLeft: 2 },
  modalOverlay: { flex: 1, backgroundColor: C.isDark ? "rgba(0,0,0,0.72)" : "rgba(9,9,11,0.45)", alignItems: "center", justifyContent: "center", padding: 20 },
  modalCard: { width: "100%", maxWidth: 460, backgroundColor: C.card, borderRadius: 18, padding: 20, borderWidth: 1, borderColor: "rgba(0,212,255,0.12)" },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  modalTitle: { color: C.text, fontSize: 15, fontWeight: "900" },
  modalLabel: { color: C.muted, fontSize: 9, fontWeight: "900", letterSpacing: 1, marginBottom: 6, marginTop: 4 },
  modalInput: { backgroundColor: C.bgSecondary, borderWidth: 1, borderColor: C.line, color: C.text, borderRadius: 10, paddingHorizontal: 12, height: 42, fontSize: 12, fontWeight: "600", marginBottom: 12 },
  hint: { color: C.dim, fontSize: 11, fontWeight: "600", marginBottom: 12 },
  playerRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 12, height: 40, borderRadius: 10, borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", marginBottom: 6 },
  playerName: { color: C.text, fontSize: 12, fontWeight: "700" },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginBottom: 12 },
  chip: { paddingHorizontal: 12, height: 34, borderRadius: 10, borderWidth: 1, borderColor: "rgba(255,255,255,0.1)", alignItems: "center", justifyContent: "center" },
  chipText: { color: C.muted, fontSize: 10.5, fontWeight: "800" },
  modalSaveBtn: { height: 46, borderRadius: 12, backgroundColor: C.blue, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 4 },
  modalSaveText: { color: C.text, fontSize: 12, fontWeight: "900" },
}));
