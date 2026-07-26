import React, { useState } from "react";
import { View, Text, ScrollView, StyleSheet, Pressable, Modal, TextInput, Image, Platform, Alert, Linking } from "react-native";
import * as LucideIcons from "lucide-react-native";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { colors as C } from "../constants/theme";
import { TopBar } from "../components/SharedComponents";
import { supabaseService } from "../services/supabaseService";
import RoDateField from "../components/RoDateField";

function notify(title, msg) {
  if (Platform.OS === "web") window.alert(`${title}\n\n${msg}`);
  else Alert.alert(title, msg);
}

export default function MediaScreen({ clubId, selectedClub, currentUser, openNotifications }) {
  const queryClient = useQueryClient();
  const [addOpen, setAddOpen] = useState(false);

  const canManage = ["super_admin", "club_owner", "admin", "coach"].includes(currentUser?.role);

  const { data: media = [], isLoading } = useQuery({
    queryKey: ["mediaGallery", clubId],
    queryFn: () => supabaseService.getMedia(clubId),
    enabled: !!clubId,
  });

  const open = (m) => { if (m.url) Linking.openURL(m.url).catch((e) => notify("Eroare", e.message)); };

  const remove = (m) => {
    const run = async () => {
      try { await supabaseService.deleteMedia(m.id); queryClient.invalidateQueries({ queryKey: ["mediaGallery"] }); }
      catch (e) { notify("Eroare", e.message); }
    };
    if (Platform.OS === "web") { if (window.confirm(`Ștergi „${m.title}”?`)) run(); }
    else Alert.alert("Șterge", `Ștergi „${m.title}”?`, [{ text: "Anulează", style: "cancel" }, { text: "Șterge", style: "destructive", onPress: run }]);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <TopBar title="Galerie" eyebrow={selectedClub?.name || "FOOTBAL MANAGER 99"} openNotifications={openNotifications} />

      {canManage && (
        <Pressable style={styles.addBtn} onPress={() => setAddOpen(true)}>
          <LucideIcons.ImagePlus size={15} color="white" /><Text style={styles.addBtnText}>Adaugă în galerie</Text>
        </Pressable>
      )}

      {isLoading && <Text style={styles.empty}>Se încarcă...</Text>}
      {!isLoading && media.length === 0 && (
        <View style={styles.emptyState}>
          <LucideIcons.Images size={38} color={C.muted} />
          <Text style={styles.emptyText}>{canManage ? "Galeria e goală. Adaugă foto/video de la meciuri și antrenamente." : "Clubul nu a adăugat încă media."}</Text>
        </View>
      )}

      <View style={styles.grid}>
        {media.map((m) => (
          <View key={m.id} style={styles.tile}>
            <Pressable style={styles.thumb} onPress={() => open(m)}>
              {m.type === "video" ? (
                <View style={styles.videoThumb}><LucideIcons.PlayCircle size={30} color="white" /></View>
              ) : m.url ? (
                <Image source={{ uri: m.url }} style={styles.thumbImg} resizeMode="cover" />
              ) : (
                <View style={styles.videoThumb}><LucideIcons.Image size={26} color={C.dim} /></View>
              )}
            </Pressable>
            <View style={styles.tileFooter}>
              <View style={{ flex: 1 }}>
                <Text style={styles.tileTitle} numberOfLines={1}>{m.title}</Text>
                {!!m.date_label && <Text style={styles.tileDate}>{m.date_label}</Text>}
              </View>
              {canManage && <Pressable onPress={() => remove(m)} style={styles.delBtn}><LucideIcons.Trash2 size={13} color={C.red} /></Pressable>}
            </View>
          </View>
        ))}
      </View>

      <AddMediaModal
        visible={addOpen}
        clubId={clubId}
        onClose={() => setAddOpen(false)}
        onSaved={() => { setAddOpen(false); queryClient.invalidateQueries({ queryKey: ["mediaGallery"] }); }}
      />
    </ScrollView>
  );
}

function AddMediaModal({ visible, clubId, onClose, onSaved }) {
  const [form, setForm] = useState({ title: "", url: "", type: "image", date: "" });
  const [saving, setSaving] = useState(false);

  React.useEffect(() => { if (visible) setForm({ title: "", url: "", type: "image", date: "" }); }, [visible]);
  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const save = async () => {
    if (!form.title.trim() || !form.url.trim()) { notify("Date incomplete", "Completează titlul și link-ul."); return; }
    setSaving(true);
    try {
      await supabaseService.insertMedia({ title: form.title.trim(), url: form.url.trim(), type: form.type, date: form.date.trim(), clubId });
      onSaved();
    } catch (e) { notify("Eroare", e.message); } finally { setSaving(false); }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalCard}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Media nouă</Text>
            <Pressable onPress={onClose}><LucideIcons.X size={18} color={C.dim} /></Pressable>
          </View>
          <Text style={styles.modalLabel}>TITLU</Text>
          <TextInput style={styles.modalInput} value={form.title} onChangeText={(v) => set("title", v)} placeholder="Ex: Finala Cupei U16" placeholderTextColor={C.dim} />
          <Text style={styles.modalLabel}>LINK (imagine sau video)</Text>
          <TextInput style={styles.modalInput} value={form.url} onChangeText={(v) => set("url", v)} placeholder="https://..." placeholderTextColor={C.dim} autoCapitalize="none" />
          <Text style={styles.modalLabel}>TIP</Text>
          <View style={styles.chipRow}>
            {[["image", "Imagine"], ["video", "Video"]].map(([val, label]) => (
              <Pressable key={val} onPress={() => set("type", val)} style={[styles.chip, form.type === val && { borderColor: C.cyan, backgroundColor: C.cyan + "10" }]}>
                <Text style={[styles.chipText, form.type === val && { color: C.cyan }]}>{label}</Text>
              </Pressable>
            ))}
          </View>
          <Text style={styles.modalLabel}>DATA (opțional)</Text>
          <RoDateField value={form.date} onChange={(v) => set("date", v)} placeholder="Alege data" />
          <Pressable style={[styles.modalSaveBtn, saving && { opacity: 0.7 }]} onPress={save} disabled={saving}>
            <LucideIcons.Check size={16} color="white" /><Text style={styles.modalSaveText}>Adaugă</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  content: { padding: 18, paddingBottom: 120 },
  addBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, height: 46, borderRadius: 14, backgroundColor: C.blue, marginBottom: 18 },
  addBtnText: { color: "white", fontSize: 12.5, fontWeight: "900" },
  empty: { color: C.muted, fontSize: 12, fontWeight: "600", textAlign: "center", paddingVertical: 20 },
  emptyState: { alignItems: "center", justifyContent: "center", paddingVertical: 50, gap: 12 },
  emptyText: { color: C.muted, fontSize: 12.5, fontWeight: "600", textAlign: "center", lineHeight: 18, paddingHorizontal: 20 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  tile: { flexBasis: 150, flexGrow: 1, backgroundColor: C.card, borderRadius: 14, overflow: "hidden", borderWidth: 1, borderColor: "rgba(255,255,255,0.05)" },
  thumb: { height: 110, backgroundColor: C.bgSecondary },
  thumbImg: { width: "100%", height: "100%" },
  videoThumb: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(124,58,237,0.15)" },
  tileFooter: { flexDirection: "row", alignItems: "center", padding: 10, gap: 6 },
  tileTitle: { color: "white", fontSize: 11.5, fontWeight: "800" },
  tileDate: { color: C.dim, fontSize: 9, fontWeight: "700", marginTop: 2 },
  delBtn: { width: 28, height: 28, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.72)", alignItems: "center", justifyContent: "center", padding: 20 },
  modalCard: { width: "100%", maxWidth: 460, backgroundColor: C.card, borderRadius: 18, padding: 20, borderWidth: 1, borderColor: "rgba(0,212,255,0.12)" },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  modalTitle: { color: "white", fontSize: 15, fontWeight: "900" },
  modalLabel: { color: C.muted, fontSize: 9, fontWeight: "900", letterSpacing: 1, marginBottom: 6, marginTop: 4 },
  modalInput: { backgroundColor: C.bgSecondary, borderWidth: 1, borderColor: C.line, color: "white", borderRadius: 10, paddingHorizontal: 12, height: 42, fontSize: 12, fontWeight: "600", marginBottom: 12 },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginBottom: 12 },
  chip: { paddingHorizontal: 14, height: 34, borderRadius: 10, borderWidth: 1, borderColor: "rgba(255,255,255,0.1)", alignItems: "center", justifyContent: "center" },
  chipText: { color: C.muted, fontSize: 10.5, fontWeight: "800" },
  modalSaveBtn: { height: 46, borderRadius: 12, backgroundColor: C.blue, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 4 },
  modalSaveText: { color: "white", fontSize: 12, fontWeight: "900" },
});
