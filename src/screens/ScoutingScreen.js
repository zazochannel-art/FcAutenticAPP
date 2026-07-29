import React, { useState } from "react";
import { View, Text, ScrollView, StyleSheet, Pressable, Modal, TextInput, Platform, Alert } from "react-native";
import * as LucideIcons from "lucide-react-native";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { colors as C, themedStyles, layout } from "../constants/theme";
import { TopBar } from "../components/SharedComponents";
import { supabaseService } from "../services/supabaseService";
import { SkeletonRow, EmptyState } from "../components/ui/visuals";
import { BRAND_NAME } from "../constants/brand";

function notify(title, msg) {
  if (Platform.OS === "web") window.alert(`${title}\n\n${msg}`);
  else Alert.alert(title, msg);
}

const DECISIONS = ["De urmărit", "Invită la probe", "Ofertă", "Respins"];
const DECISION_COLORS_ = () => ({ "De urmărit": C.blue, "Invită la probe": C.amber, "Ofertă": C.green, "Respins": C.red });

export default function ScoutingScreen({ clubId, selectedClub, currentUser }) {
  const queryClient = useQueryClient();
  const [editItem, setEditItem] = useState(null);
  const [addOpen, setAddOpen] = useState(false);

  const canManage = ["super_admin", "club_owner", "admin", "coach"].includes(currentUser?.role);

  const { data: prospects = [], isLoading } = useQuery({
    queryKey: ["scouting", clubId],
    queryFn: () => supabaseService.getScouting(clubId),
    enabled: !!clubId,
  });

  const remove = (item) => {
    const run = async () => {
      try { await supabaseService.deleteScouting(item.id); queryClient.invalidateQueries({ queryKey: ["scouting"] }); }
      catch (e) { notify("Eroare", e.message); }
    };
    if (Platform.OS === "web") { if (window.confirm(`Ștergi „${item.name}”?`)) run(); }
    else Alert.alert("Șterge", `Ștergi „${item.name}”?`, [{ text: "Anulează", style: "cancel" }, { text: "Șterge", style: "destructive", onPress: run }]);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <TopBar title="Scouting" eyebrow={selectedClub?.name || BRAND_NAME} />

      {canManage && (
        <Pressable style={styles.addBtn} onPress={() => setAddOpen(true)}>
          <LucideIcons.Plus size={15} color="white" /><Text style={styles.addBtnText}>Adaugă jucător urmărit</Text>
        </Pressable>
      )}

      {isLoading && <View>{[0, 1, 2, 3].map((i) => <SkeletonRow key={i} />)}</View>}
      {!isLoading && prospects.length === 0 && (
        <EmptyState
          icon="Binoculars"
          title="Niciun jucător urmărit"
          subtitle="Adaugă prima recomandare de scouting pentru clubul tău."
          actionLabel={canManage ? "Adaugă jucător" : undefined}
          onAction={() => setAddOpen(true)}
        />
      )}

      {prospects.map((p) => {
        const color = DECISION_COLORS_()[p.decision] || C.dim;
        return (
          <View key={p.id} style={styles.card}>
            <View style={styles.avatar}><LucideIcons.UserSearch size={16} color={C.cyan} /></View>
            <Pressable style={{ flex: 1, marginLeft: 12 }} onPress={() => canManage && setEditItem(p)}>
              <View style={styles.cardHead}>
                <Text style={styles.name} numberOfLines={1}>{p.name}</Text>
                {!!p.decision && (
                  <View style={[styles.badge, { backgroundColor: color + "18", borderColor: color + "40" }]}>
                    <Text style={[styles.badgeText, { color }]}>{p.decision}</Text>
                  </View>
                )}
              </View>
              <Text style={styles.meta} numberOfLines={1}>{[p.role, p.age ? `${p.age} ani` : null].filter(Boolean).join(" • ") || "Jucător urmărit"}</Text>
              {!!p.notes && <Text style={styles.notes} numberOfLines={2}>{p.notes}</Text>}
            </Pressable>
            {canManage && (
              <>
                <Pressable onPress={() => setEditItem(p)} style={styles.iconBtn}><LucideIcons.Pencil size={15} color={C.muted} /></Pressable>
                <Pressable onPress={() => remove(p)} style={styles.iconBtn}><LucideIcons.Trash2 size={15} color={C.red} /></Pressable>
              </>
            )}
          </View>
        );
      })}

      <ScoutingModal
        visible={addOpen || !!editItem}
        item={editItem}
        clubId={clubId}
        onClose={() => { setAddOpen(false); setEditItem(null); }}
        onSaved={() => { setAddOpen(false); setEditItem(null); queryClient.invalidateQueries({ queryKey: ["scouting"] }); }}
      />
    </ScrollView>
  );
}

function ScoutingModal({ visible, item, clubId, onClose, onSaved }) {
  const [form, setForm] = useState({ name: "", age: "", role: "", notes: "", decision: DECISIONS[0] });
  const [saving, setSaving] = useState(false);

  React.useEffect(() => {
    if (item) setForm({ name: item.name || "", age: item.age ? String(item.age) : "", role: item.role || "", notes: item.notes || "", decision: item.decision || DECISIONS[0] });
    else setForm({ name: "", age: "", role: "", notes: "", decision: DECISIONS[0] });
  }, [item, visible]);

  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const save = async () => {
    if (!form.name.trim()) { notify("Nume lipsă", "Dă un nume jucătorului."); return; }
    setSaving(true);
    try {
      const payload = { name: form.name.trim(), age: form.age.trim(), role: form.role.trim(), notes: form.notes.trim(), decision: form.decision };
      if (item) await supabaseService.updateScouting({ ...payload, id: item.id });
      else await supabaseService.insertScouting({ ...payload, clubId });
      onSaved();
    } catch (e) { notify("Eroare", e.message); } finally { setSaving(false); }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalCard}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{item ? "Editează" : "Jucător urmărit nou"}</Text>
            <Pressable onPress={onClose}><LucideIcons.X size={18} color={C.dim} /></Pressable>
          </View>
          <Text style={styles.modalLabel}>NUME</Text>
          <TextInput style={styles.modalInput} value={form.name} onChangeText={(v) => set("name", v)} placeholder="Nume și prenume" placeholderTextColor={C.dim} />
          <View style={{ flexDirection: "row", gap: 10 }}>
            <View style={{ flex: 1 }}>
              <Text style={styles.modalLabel}>VÂRSTĂ</Text>
              <TextInput style={styles.modalInput} value={form.age} onChangeText={(v) => set("age", v)} placeholder="16" placeholderTextColor={C.dim} keyboardType="number-pad" />
            </View>
            <View style={{ flex: 2 }}>
              <Text style={styles.modalLabel}>POZIȚIE</Text>
              <TextInput style={styles.modalInput} value={form.role} onChangeText={(v) => set("role", v)} placeholder="Ex: Mijlocaș central" placeholderTextColor={C.dim} />
            </View>
          </View>
          <Text style={styles.modalLabel}>DECIZIE</Text>
          <View style={styles.chipRow}>
            {DECISIONS.map((d) => (
              <Pressable key={d} onPress={() => set("decision", d)} style={[styles.chip, form.decision === d && { borderColor: DECISION_COLORS_()[d], backgroundColor: DECISION_COLORS_()[d] + "12" }]}>
                <Text style={[styles.chipText, form.decision === d && { color: DECISION_COLORS_()[d] }]}>{d}</Text>
              </Pressable>
            ))}
          </View>
          <Text style={styles.modalLabel}>OBSERVAȚII (opțional)</Text>
          <TextInput style={[styles.modalInput, { height: 70, textAlignVertical: "top", paddingTop: 10 }]} value={form.notes} onChangeText={(v) => set("notes", v)} placeholder="Puncte forte, context, recomandare..." placeholderTextColor={C.dim} multiline />
          <Pressable style={[styles.modalSaveBtn, saving && { opacity: 0.7 }]} onPress={save} disabled={saving}>
            <LucideIcons.Check size={16} color="white" /><Text style={styles.modalSaveText}>{item ? "Salvează" : "Adaugă"}</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = themedStyles((C) => StyleSheet.create({
  container: { flex: 1, backgroundColor: "transparent" },
  content: { padding: 18, paddingBottom: layout.navClearance },
  addBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, height: 46, borderRadius: 14, backgroundColor: C.blue, marginBottom: 18 },
  addBtnText: { color: C.text, fontSize: 12.5, fontWeight: "900" },
  empty: { color: C.muted, fontSize: 12, fontWeight: "600", textAlign: "center", paddingVertical: 20 },
  emptyState: { alignItems: "center", justifyContent: "center", paddingVertical: 50, gap: 12 },
  emptyText: { color: C.muted, fontSize: 12.5, fontWeight: "600", textAlign: "center", lineHeight: 18, paddingHorizontal: 20 },
  card: { flexDirection: "row", alignItems: "flex-start", backgroundColor: C.card, borderRadius: 16, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: C.line },
  avatar: { width: 38, height: 38, borderRadius: 19, backgroundColor: C.cyan + "1A", alignItems: "center", justifyContent: "center", marginTop: 2 },
  cardHead: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 },
  name: { color: C.text, fontSize: 13, fontWeight: "800", flex: 1 },
  badge: { paddingHorizontal: 9, paddingVertical: 3, borderRadius: 8, borderWidth: 1 },
  badgeText: { fontSize: 9, fontWeight: "900" },
  meta: { color: C.dim, fontSize: 10.5, fontWeight: "700", marginTop: 3 },
  notes: { color: C.muted, fontSize: 11, fontWeight: "600", marginTop: 5, lineHeight: 15 },
  iconBtn: { width: 34, height: 34, borderRadius: 10, alignItems: "center", justifyContent: "center", marginLeft: 2 },
  modalOverlay: { flex: 1, backgroundColor: C.isDark ? "rgba(0,0,0,0.72)" : "rgba(9,9,11,0.45)", alignItems: "center", justifyContent: "center", padding: 20 },
  modalCard: { width: "100%", maxWidth: 460, backgroundColor: C.card, borderRadius: 18, padding: 20, borderWidth: 1, borderColor: C.cyan + "1F" },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  modalTitle: { color: C.text, fontSize: 15, fontWeight: "900" },
  modalLabel: { color: C.muted, fontSize: 9, fontWeight: "900", letterSpacing: 1, marginBottom: 6, marginTop: 4 },
  modalInput: { backgroundColor: C.bgSecondary, borderWidth: 1, borderColor: C.line, color: C.text, borderRadius: 10, paddingHorizontal: 12, height: 42, fontSize: 12, fontWeight: "600", marginBottom: 12 },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginBottom: 12 },
  chip: { paddingHorizontal: 12, height: 34, borderRadius: 10, borderWidth: 1, borderColor: C.lineStrong, alignItems: "center", justifyContent: "center" },
  chipText: { color: C.muted, fontSize: 10.5, fontWeight: "800" },
  modalSaveBtn: { height: 46, borderRadius: 12, backgroundColor: C.blue, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 4 },
  modalSaveText: { color: C.text, fontSize: 12, fontWeight: "900" },
}));
