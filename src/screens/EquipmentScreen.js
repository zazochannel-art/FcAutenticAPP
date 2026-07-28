import React, { useState } from "react";
import { View, Text, ScrollView, StyleSheet, Pressable, Modal, TextInput, Platform, Alert } from "react-native";
import * as LucideIcons from "lucide-react-native";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { colors as C, themedStyles } from "../constants/theme";
import { TopBar } from "../components/SharedComponents";
import { supabaseService } from "../services/supabaseService";
import { BRAND_NAME } from "../constants/brand";

function notify(title, msg) {
  if (Platform.OS === "web") window.alert(`${title}\n\n${msg}`);
  else Alert.alert(title, msg);
}

const CATEGORIES = ["Echipament joc", "Antrenament", "Medical", "Altele"];

export default function EquipmentScreen({ clubId, selectedClub, currentUser }) {
  const queryClient = useQueryClient();
  const [editItem, setEditItem] = useState(null);
  const [addOpen, setAddOpen] = useState(false);

  const canManage = ["super_admin", "club_owner", "admin", "coach"].includes(currentUser?.role);

  const { data: items = [], isLoading } = useQuery({
    queryKey: ["equipment", clubId],
    queryFn: () => supabaseService.getEquipment(clubId),
    enabled: !!clubId,
  });

  const totals = items.reduce((acc, it) => ({ total: acc.total + (Number(it.total) || 0), missing: acc.missing + (Number(it.missing) || 0) }), { total: 0, missing: 0 });

  const remove = (item) => {
    const run = async () => {
      try { await supabaseService.deleteEquipment(item.id); queryClient.invalidateQueries({ queryKey: ["equipment"] }); }
      catch (e) { notify("Eroare", e.message); }
    };
    if (Platform.OS === "web") { if (window.confirm(`Ștergi „${item.name}”?`)) run(); }
    else Alert.alert("Șterge", `Ștergi „${item.name}”?`, [{ text: "Anulează", style: "cancel" }, { text: "Șterge", style: "destructive", onPress: run }]);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <TopBar title="Echipament" eyebrow={selectedClub?.name || BRAND_NAME} />

      <View style={styles.statsRow}>
        <View style={styles.statBox}><Text style={styles.statVal}>{items.length}</Text><Text style={styles.statLabel}>Articole</Text></View>
        <View style={styles.statBox}><Text style={styles.statVal}>{totals.total}</Text><Text style={styles.statLabel}>Bucăți total</Text></View>
        <View style={styles.statBox}><Text style={[styles.statVal, totals.missing > 0 && { color: C.red }]}>{totals.missing}</Text><Text style={styles.statLabel}>Lipsă</Text></View>
      </View>

      {canManage && (
        <Pressable style={styles.addBtn} onPress={() => setAddOpen(true)}>
          <LucideIcons.Plus size={15} color="white" /><Text style={styles.addBtnText}>Adaugă articol</Text>
        </Pressable>
      )}

      {isLoading && <Text style={styles.empty}>Se încarcă...</Text>}
      {!isLoading && items.length === 0 && (
        <View style={styles.emptyState}>
          <LucideIcons.Package size={38} color={C.muted} />
          <Text style={styles.emptyText}>{canManage ? "Niciun articol în inventar. Adaugă primul echipament." : "Inventarul clubului este gol."}</Text>
        </View>
      )}

      {items.map((it) => (
        <View key={it.id} style={styles.card}>
          <View style={styles.iconWrap}><LucideIcons.Package size={18} color={C.cyan} /></View>
          <Pressable style={{ flex: 1, marginLeft: 12 }} onPress={() => canManage && setEditItem(it)}>
            <Text style={styles.name} numberOfLines={1}>{it.name}</Text>
            <Text style={styles.meta} numberOfLines={1}>
              {it.category || "Articol"} • {it.total || 0} buc{it.assigned ? ` • la ${it.assigned}` : ""}{Number(it.missing) > 0 ? ` • ${it.missing} lipsă` : ""}
            </Text>
          </Pressable>
          {canManage && (
            <>
              <Pressable onPress={() => setEditItem(it)} style={styles.iconBtn}><LucideIcons.Pencil size={15} color={C.muted} /></Pressable>
              <Pressable onPress={() => remove(it)} style={styles.iconBtn}><LucideIcons.Trash2 size={15} color={C.red} /></Pressable>
            </>
          )}
        </View>
      ))}

      <EquipmentModal
        visible={addOpen || !!editItem}
        item={editItem}
        clubId={clubId}
        onClose={() => { setAddOpen(false); setEditItem(null); }}
        onSaved={() => { setAddOpen(false); setEditItem(null); queryClient.invalidateQueries({ queryKey: ["equipment"] }); }}
      />
    </ScrollView>
  );
}

function EquipmentModal({ visible, item, clubId, onClose, onSaved }) {
  const [form, setForm] = useState({ name: "", category: "Echipament joc", total: "", missing: "", assigned: "" });
  const [saving, setSaving] = useState(false);

  React.useEffect(() => {
    if (item) setForm({ name: item.name || "", category: item.category || "Echipament joc", total: String(item.total ?? ""), missing: String(item.missing ?? ""), assigned: item.assigned || "" });
    else setForm({ name: "", category: "Echipament joc", total: "", missing: "", assigned: "" });
  }, [item, visible]);

  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const save = async () => {
    if (!form.name.trim()) { notify("Nume lipsă", "Dă un nume articolului."); return; }
    setSaving(true);
    try {
      const payload = { name: form.name.trim(), category: form.category, total: form.total, missing: form.missing, assigned: form.assigned.trim() };
      if (item) await supabaseService.updateEquipment({ ...payload, id: item.id });
      else await supabaseService.insertEquipment({ ...payload, clubId });
      onSaved();
    } catch (e) { notify("Eroare", e.message); } finally { setSaving(false); }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalCard}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{item ? "Editează articolul" : "Articol nou"}</Text>
            <Pressable onPress={onClose}><LucideIcons.X size={18} color={C.dim} /></Pressable>
          </View>
          <Text style={styles.modalLabel}>NUME</Text>
          <TextInput style={styles.modalInput} value={form.name} onChangeText={(v) => set("name", v)} placeholder="Ex: Tricouri joc" placeholderTextColor={C.dim} />
          <Text style={styles.modalLabel}>CATEGORIE</Text>
          <View style={styles.chipRow}>
            {CATEGORIES.map((c) => (
              <Pressable key={c} onPress={() => set("category", c)} style={[styles.chip, form.category === c && { borderColor: C.cyan, backgroundColor: C.cyan + "10" }]}>
                <Text style={[styles.chipText, form.category === c && { color: C.cyan }]}>{c}</Text>
              </Pressable>
            ))}
          </View>
          <View style={{ flexDirection: "row", gap: 10 }}>
            <View style={{ flex: 1 }}>
              <Text style={styles.modalLabel}>TOTAL</Text>
              <TextInput style={styles.modalInput} value={form.total} onChangeText={(v) => set("total", v)} placeholder="20" placeholderTextColor={C.dim} keyboardType="number-pad" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.modalLabel}>LIPSĂ</Text>
              <TextInput style={styles.modalInput} value={form.missing} onChangeText={(v) => set("missing", v)} placeholder="0" placeholderTextColor={C.dim} keyboardType="number-pad" />
            </View>
          </View>
          <Text style={styles.modalLabel}>ALOCAT (opțional)</Text>
          <TextInput style={styles.modalInput} value={form.assigned} onChangeText={(v) => set("assigned", v)} placeholder="Ex: Grupa U16" placeholderTextColor={C.dim} />
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
  content: { padding: 18, paddingBottom: 120 },
  statsRow: { flexDirection: "row", flexWrap: "wrap", gap: 12, marginBottom: 16 },
  statBox: { flexBasis: 96, flexGrow: 1, backgroundColor: C.card, borderRadius: 14, padding: 14, alignItems: "center", borderWidth: 1, borderColor: C.line },
  statVal: { color: C.text, fontSize: 20, fontWeight: "900" },
  statLabel: { color: C.dim, fontSize: 9, fontWeight: "800", marginTop: 2, textTransform: "uppercase" },
  addBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, height: 46, borderRadius: 14, backgroundColor: C.blue, marginBottom: 18 },
  addBtnText: { color: C.text, fontSize: 12.5, fontWeight: "900" },
  empty: { color: C.muted, fontSize: 12, fontWeight: "600", textAlign: "center", paddingVertical: 20 },
  emptyState: { alignItems: "center", justifyContent: "center", paddingVertical: 50, gap: 12 },
  emptyText: { color: C.muted, fontSize: 12.5, fontWeight: "600", textAlign: "center", lineHeight: 18, paddingHorizontal: 20 },
  card: { flexDirection: "row", alignItems: "center", backgroundColor: C.card, borderRadius: 16, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: C.line },
  iconWrap: { width: 40, height: 40, borderRadius: 12, backgroundColor: C.cyan + "1A", alignItems: "center", justifyContent: "center" },
  name: { color: C.text, fontSize: 13, fontWeight: "800" },
  meta: { color: C.dim, fontSize: 10.5, fontWeight: "700", marginTop: 3 },
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
