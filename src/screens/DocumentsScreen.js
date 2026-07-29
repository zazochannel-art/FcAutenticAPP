import React, { useState } from "react";
import { View, Text, ScrollView, StyleSheet, Pressable, Modal, TextInput, Platform, Alert, Linking, ActivityIndicator } from "react-native";
import * as LucideIcons from "lucide-react-native";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { colors as C, themedStyles, layout } from "../constants/theme";
import { TopBar } from "../components/SharedComponents";
import { supabaseService } from "../services/supabaseService";
import { storageService } from "../services/storageService";
import RoDateField from "../components/RoDateField";
import { BRAND_NAME } from "../constants/brand";

function notify(title, msg) {
  if (Platform.OS === "web") window.alert(`${title}\n\n${msg}`);
  else Alert.alert(title, msg);
}

const DOC_TYPES = ["Contract", "Medical", "Regulament", "Formular", "Altele"];
const TYPE_COLORS_ = () => ({ Contract: C.blue, Medical: C.red, Regulament: C.purple, Formular: C.amber, Altele: C.dim });

export default function DocumentsScreen({ clubId, selectedClub, currentUser }) {
  const queryClient = useQueryClient();
  const [addOpen, setAddOpen] = useState(false);
  const [opening, setOpening] = useState(null);

  const canManage = ["super_admin", "club_owner", "admin", "coach"].includes(currentUser?.role);

  const { data: documents = [], isLoading } = useQuery({
    queryKey: ["documents", clubId],
    queryFn: () => supabaseService.getDocuments(clubId),
    enabled: !!clubId,
  });

  const openDoc = async (doc) => {
    if (!doc.fileUrl) { notify("Fără fișier", "Acestui document nu i s-a atașat un fișier."); return; }
    setOpening(doc.id);
    try {
      let url = doc.fileUrl;
      if (!/^https?:\/\//.test(url)) url = await storageService.createSignedUrl(url);
      if (url) await Linking.openURL(url);
    } catch (e) {
      notify("Eroare", e.message);
    } finally {
      setOpening(null);
    }
  };

  const removeDoc = (doc) => {
    const run = async () => {
      try {
        await supabaseService.deleteDocument(doc.id);
        queryClient.invalidateQueries({ queryKey: ["documents"] });
      } catch (e) { notify("Eroare", e.message); }
    };
    if (Platform.OS === "web") { if (window.confirm(`Ștergi „${doc.title}”?`)) run(); }
    else Alert.alert("Șterge documentul", `Ștergi „${doc.title}”?`, [{ text: "Anulează", style: "cancel" }, { text: "Șterge", style: "destructive", onPress: run }]);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <TopBar title="Documente" eyebrow={selectedClub?.name || BRAND_NAME} />

      {canManage && (
        <Pressable style={styles.addBtn} onPress={() => setAddOpen(true)}>
          <LucideIcons.Upload size={15} color="white" />
          <Text style={styles.addBtnText}>Adaugă document</Text>
        </Pressable>
      )}

      {isLoading && <Text style={styles.empty}>Se încarcă documentele...</Text>}

      {!isLoading && documents.length === 0 && (
        <View style={styles.emptyState}>
          <LucideIcons.FolderOpen size={38} color={C.muted} />
          <Text style={styles.emptyText}>
            {canManage ? "Niciun document încă. Încarcă primul contract, regulament sau formular medical." : "Clubul nu a publicat încă documente."}
          </Text>
        </View>
      )}

      {documents.map((doc) => {
        const color = TYPE_COLORS_()[doc.type] || C.dim;
        return (
          <View key={doc.id} style={styles.card}>
            <View style={[styles.docIcon, { backgroundColor: color + "18" }]}>
              <LucideIcons.FileText size={18} color={color} />
            </View>
            <Pressable style={{ flex: 1, marginLeft: 12 }} onPress={() => openDoc(doc)}>
              <Text style={styles.docTitle} numberOfLines={1}>{doc.title}</Text>
              <Text style={styles.docMeta} numberOfLines={1}>
                {doc.type || "Document"}{doc.owner ? ` • ${doc.owner}` : ""}{doc.expires ? ` • expiră ${doc.expires}` : ""}
              </Text>
            </Pressable>
            {opening === doc.id ? (
              <ActivityIndicator size="small" color={C.cyan} style={{ marginLeft: 8 }} />
            ) : (
              <Pressable onPress={() => openDoc(doc)} style={styles.iconBtn}>
                <LucideIcons.ExternalLink size={15} color={C.muted} />
              </Pressable>
            )}
            {canManage && (
              <Pressable onPress={() => removeDoc(doc)} style={styles.iconBtn}>
                <LucideIcons.Trash2 size={15} color={C.red} />
              </Pressable>
            )}
          </View>
        );
      })}

      <AddDocModal
        visible={addOpen}
        clubId={clubId}
        onClose={() => setAddOpen(false)}
        onSaved={() => { setAddOpen(false); queryClient.invalidateQueries({ queryKey: ["documents"] }); }}
      />
    </ScrollView>
  );
}

function AddDocModal({ visible, clubId, onClose, onSaved }) {
  const [title, setTitle] = useState("");
  const [type, setType] = useState("Contract");
  const [owner, setOwner] = useState("");
  const [expires, setExpires] = useState("");
  const [asset, setAsset] = useState(null);
  const [saving, setSaving] = useState(false);

  const reset = () => { setTitle(""); setType("Contract"); setOwner(""); setExpires(""); setAsset(null); };

  const pick = async () => {
    try {
      const picked = await storageService.pickDocument();
      if (picked) {
        setAsset(picked);
        if (!title.trim()) setTitle(picked.name || "");
      }
    } catch (e) { notify("Eroare", e.message); }
  };

  const save = async () => {
    if (!title.trim()) { notify("Titlu lipsă", "Dă un titlu documentului."); return; }
    setSaving(true);
    try {
      let fileUrl = null;
      if (asset) {
        const uploaded = await storageService.uploadPickedDocument(asset, clubId || "general");
        fileUrl = uploaded?.path || null;
      }
      await supabaseService.insertDocument({ title: title.trim(), type, owner: owner.trim(), expires: expires.trim(), fileUrl, clubId });
      reset();
      onSaved();
    } catch (e) {
      notify("Eroare", e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalCard}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Document nou</Text>
            <Pressable onPress={onClose}><LucideIcons.X size={18} color={C.dim} /></Pressable>
          </View>

          <Text style={styles.modalLabel}>TITLU</Text>
          <TextInput style={styles.modalInput} value={title} onChangeText={setTitle} placeholder="Ex: Contract colaborare 2026" placeholderTextColor={C.dim} />

          <Text style={styles.modalLabel}>TIP</Text>
          <View style={styles.typeRow}>
            {DOC_TYPES.map((t) => (
              <Pressable key={t} onPress={() => setType(t)} style={[styles.typeChip, type === t && { borderColor: C.cyan, backgroundColor: C.cyan + "10" }]}>
                <Text style={[styles.typeChipText, type === t && { color: C.cyan }]}>{t}</Text>
              </Pressable>
            ))}
          </View>

          <View style={{ flexDirection: "row", gap: 10 }}>
            <View style={{ flex: 1 }}>
              <Text style={styles.modalLabel}>PROPRIETAR (opțional)</Text>
              <TextInput style={styles.modalInput} value={owner} onChangeText={setOwner} placeholder="Nume jucător/staff" placeholderTextColor={C.dim} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.modalLabel}>EXPIRĂ (opțional)</Text>
              <RoDateField value={expires} onChange={setExpires} placeholder="Alege data" />
            </View>
          </View>

          <Pressable style={[styles.fileBtn, asset && { borderColor: C.green + "50", backgroundColor: C.green + "10" }]} onPress={pick}>
            <LucideIcons.Paperclip size={14} color={asset ? C.green : C.muted} />
            <Text style={[styles.fileBtnText, asset && { color: C.green }]} numberOfLines={1}>
              {asset ? (asset.name || "Fișier atașat") : "Alege un fișier (PDF, imagine...)"}
            </Text>
          </Pressable>

          <Pressable style={[styles.modalSaveBtn, saving && { opacity: 0.7 }]} onPress={save} disabled={saving}>
            {saving ? <ActivityIndicator size="small" color="white" /> : (
              <>
                <LucideIcons.Check size={16} color="white" />
                <Text style={styles.modalSaveText}>Salvează documentul</Text>
              </>
            )}
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

  card: { flexDirection: "row", alignItems: "center", backgroundColor: C.card, borderRadius: 16, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: C.line },
  docIcon: { width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  docTitle: { color: C.text, fontSize: 13, fontWeight: "800" },
  docMeta: { color: C.dim, fontSize: 10.5, fontWeight: "700", marginTop: 3 },
  iconBtn: { width: 34, height: 34, borderRadius: 10, alignItems: "center", justifyContent: "center", marginLeft: 4 },

  modalOverlay: { flex: 1, backgroundColor: C.isDark ? "rgba(0,0,0,0.72)" : "rgba(9,9,11,0.45)", alignItems: "center", justifyContent: "center", padding: 20 },
  modalCard: { width: "100%", maxWidth: 460, backgroundColor: C.card, borderRadius: 18, padding: 20, borderWidth: 1, borderColor: C.cyan + "1F" },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  modalTitle: { color: C.text, fontSize: 15, fontWeight: "900" },
  modalLabel: { color: C.muted, fontSize: 9, fontWeight: "900", letterSpacing: 1, marginBottom: 6, marginTop: 4 },
  modalInput: { backgroundColor: C.bgSecondary, borderWidth: 1, borderColor: C.line, color: C.text, borderRadius: 10, paddingHorizontal: 12, height: 42, fontSize: 12, fontWeight: "600", marginBottom: 12 },
  typeRow: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginBottom: 12 },
  typeChip: { paddingHorizontal: 12, height: 34, borderRadius: 10, borderWidth: 1, borderColor: C.lineStrong, alignItems: "center", justifyContent: "center" },
  typeChipText: { color: C.muted, fontSize: 10.5, fontWeight: "800" },
  fileBtn: { flexDirection: "row", alignItems: "center", gap: 8, height: 44, borderRadius: 12, borderWidth: 1, borderColor: C.line, borderStyle: "dashed", paddingHorizontal: 14, marginBottom: 16 },
  fileBtnText: { color: C.muted, fontSize: 11.5, fontWeight: "700", flex: 1 },
  modalSaveBtn: { height: 46, borderRadius: 12, backgroundColor: C.blue, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 },
  modalSaveText: { color: C.text, fontSize: 12, fontWeight: "900" },
}));
