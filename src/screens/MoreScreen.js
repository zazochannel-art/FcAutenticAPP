import React, { useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View, Switch, Modal, TextInput, Platform, Alert, ActivityIndicator } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as LucideIcons from "lucide-react-native";
import { useQueryClient } from "@tanstack/react-query";
import { colors as C, spacing } from "../constants/theme";
import { TopBar, SectionTitle } from "../components/SharedComponents";
import { BeUIButton } from "../components/ui/be-ui-button";
import { authService } from "../services/authService";
import { supabaseService } from "../services/supabaseService";

const APP_VERSION = "1.0.0";
const NOTIF_KEY = "fc_notif_prefs";

const NOTIF_ITEMS = [
  ["announcements", "Anunțuri club", "Megaphone"],
  ["callups", "Convocări la meci", "ClipboardCheck"],
  ["trainings", "Antrenamente", "Dumbbell"],
  ["payments", "Cotizații și plăți", "Wallet"],
];

function notify(title, msg) {
  if (Platform.OS === "web") window.alert(`${title}\n\n${msg}`);
  else Alert.alert(title, msg);
}

async function copyText(text) {
  try {
    if (Platform.OS === "web" && typeof navigator !== "undefined" && navigator.clipboard) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch (_) { /* fallback mai jos */ }
  return false;
}

export default function MoreScreen({ currentUser, onLogout, selectedClub, openNotifications, switchClub, onCreateClub, clubs = [] }) {
  const isStaff = ["super_admin", "club_owner", "admin", "coach"].includes(currentUser?.role);

  const queryClient = useQueryClient();
  const [prefs, setPrefs] = useState({ announcements: true, callups: true, trainings: true, payments: true });
  const [nameOpen, setNameOpen] = useState(false);
  const [passOpen, setPassOpen] = useState(false);
  const [clubEditOpen, setClubEditOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const canEditClub = ["super_admin", "club_owner", "admin"].includes(currentUser?.role);

  const deleteAccount = () => {
    const run = async () => {
      setDeleting(true);
      try {
        await authService.deleteAccount();
        onLogout?.();
      } catch (e) { notify("Eroare", e.message); } finally { setDeleting(false); }
    };
    const msg = "Contul tău și toate datele asociate vor fi șterse definitiv. Acțiunea nu poate fi anulată.";
    if (Platform.OS === "web") { if (window.confirm(`Șterge contul\n\n${msg}`)) run(); }
    else Alert.alert("Șterge contul", msg, [{ text: "Anulează", style: "cancel" }, { text: "Șterge definitiv", style: "destructive", onPress: run }]);
  };

  useEffect(() => {
    AsyncStorage.getItem(NOTIF_KEY).then((raw) => {
      if (raw) { try { setPrefs((p) => ({ ...p, ...JSON.parse(raw) })); } catch (_) { /* ignore */ } }
    });
  }, []);

  const togglePref = (key) => {
    setPrefs((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      AsyncStorage.setItem(NOTIF_KEY, JSON.stringify(next));
      return next;
    });
  };

  const copyJoinCode = async () => {
    const code = selectedClub?.joinCode;
    if (!code) return;
    const ok = await copyText(code);
    notify(ok ? "Copiat" : "Cod de club", ok ? `Codul ${code} a fost copiat.` : `Codul clubului: ${code}`);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <TopBar title="Setări" eyebrow="CONT, CLUB ȘI PREFERINȚE" openNotifications={openNotifications} />

      {/* Contul meu */}
      <SectionTitle title="Contul meu" />
      <View style={styles.card}>
        <View style={styles.profileRow}>
          <LucideIcons.UserCircle2 size={44} color={C.blue} />
          <View style={{ marginLeft: 14, flex: 1 }}>
            <Text style={styles.profileName} numberOfLines={1}>{currentUser?.name || "Utilizator"}</Text>
            <Text style={styles.profileEmail} numberOfLines={1}>{currentUser?.email}</Text>
          </View>
        </View>
        <Pressable style={styles.row} onPress={() => setNameOpen(true)}>
          <View style={styles.rowIcon}><LucideIcons.Pencil size={17} color={C.cyan} /></View>
          <Text style={styles.rowLabel}>Editează numele</Text>
          <LucideIcons.ChevronRight size={15} color={C.dim} />
        </Pressable>
        <Pressable style={styles.row} onPress={() => setPassOpen(true)}>
          <View style={styles.rowIcon}><LucideIcons.KeyRound size={17} color={C.cyan} /></View>
          <Text style={styles.rowLabel}>Schimbă parola</Text>
          <LucideIcons.ChevronRight size={15} color={C.dim} />
        </Pressable>
        <Pressable style={styles.row} onPress={deleteAccount} disabled={deleting}>
          <View style={[styles.rowIcon, { borderColor: C.red + "40" }]}>
            {deleting ? <ActivityIndicator size="small" color={C.red} /> : <LucideIcons.Trash2 size={17} color={C.red} />}
          </View>
          <Text style={[styles.rowLabel, { color: C.red }]}>Șterge contul</Text>
          <LucideIcons.ChevronRight size={15} color={C.dim} />
        </Pressable>
      </View>

      {/* Notificări */}
      <SectionTitle title="Notificări" />
      <View style={styles.card}>
        {NOTIF_ITEMS.map(([key, label, icon]) => {
          const Icon = LucideIcons[icon] || LucideIcons.Bell;
          return (
            <View key={key} style={styles.row}>
              <View style={styles.rowIcon}><Icon size={17} color={C.cyan} /></View>
              <Text style={styles.rowLabel}>{label}</Text>
              <Switch
                value={!!prefs[key]}
                onValueChange={() => togglePref(key)}
                trackColor={{ false: C.line, true: C.cyan + "88" }}
                thumbColor={prefs[key] ? C.cyan : "#64748b"}
              />
            </View>
          );
        })}
      </View>

      {/* Cod de club (staff) */}
      {isStaff && selectedClub?.joinCode ? (
        <>
          <SectionTitle title="Cod de club" />
          <View style={styles.card}>
            <View style={styles.row}>
              <View style={styles.rowIcon}><LucideIcons.KeySquare size={17} color={C.cyan} /></View>
              <View style={{ flex: 1 }}>
                <Text style={styles.rowLabel}>Cod de înregistrare</Text>
                <Text style={styles.codeValue}>{selectedClub.joinCode}</Text>
              </View>
              <Pressable style={styles.copyBtn} onPress={copyJoinCode}>
                <LucideIcons.Copy size={14} color={C.cyan} />
                <Text style={styles.copyText}>Copiază</Text>
              </Pressable>
            </View>
            <Text style={styles.hint}>Dă acest cod jucătorilor și părinților ca să se alăture clubului.</Text>
            {canEditClub && (
              <Pressable style={styles.row} onPress={() => setClubEditOpen(true)}>
                <View style={styles.rowIcon}><LucideIcons.Settings2 size={17} color={C.cyan} /></View>
                <Text style={styles.rowLabel}>Editează clubul</Text>
                <LucideIcons.ChevronRight size={15} color={C.dim} />
              </Pressable>
            )}
          </View>
        </>
      ) : null}

      {/* Cluburi */}
      <SectionTitle title="Cluburile mele" action="Adaugă" onAction={onCreateClub} />
      <View style={styles.card}>
        {clubs.length === 0 && <Text style={styles.hint}>Niciun club încă.</Text>}
        {clubs.map((club) => (
          <Pressable
            key={club.id}
            style={[styles.row, selectedClub?.id === club.id && styles.rowActive]}
            onPress={() => switchClub?.(club.id)}
          >
            <View style={styles.clubIcon}><Text style={styles.clubInitial}>{club.name?.[0] || "C"}</Text></View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.rowLabel} numberOfLines={1}>{club.name}</Text>
              <Text style={styles.clubPlan}>{club.plan_name || club.plan || "Free"} Plan</Text>
            </View>
            {selectedClub?.id === club.id && <LucideIcons.CheckCircle2 size={18} color={C.cyan} />}
          </Pressable>
        ))}
      </View>

      {/* Aplicație */}
      <SectionTitle title="Aplicație" />
      <View style={styles.card}>
        <InfoRow icon="Languages" label="Limbă" value="Română" />
        <InfoRow icon="Moon" label="Temă" value="Întunecată" />
        <InfoRow icon="Info" label="Versiune" value={APP_VERSION} />
      </View>

      <BeUIButton
        label="Deconectare"
        variant="danger"
        size="lg"
        icon="LogOut"
        onPress={onLogout}
        fullWidth
        style={{ marginTop: 8, backgroundColor: `${C.red}15` }}
        textStyle={{ color: C.red, fontSize: 13 }}
      />

      <EditNameModal visible={nameOpen} currentName={currentUser?.name} onClose={() => setNameOpen(false)} />
      <ChangePasswordModal visible={passOpen} onClose={() => setPassOpen(false)} />
      <ClubSettingsModal
        visible={clubEditOpen}
        club={selectedClub}
        onClose={() => setClubEditOpen(false)}
        onSaved={() => { setClubEditOpen(false); queryClient.invalidateQueries({ queryKey: ["clubs"] }); }}
      />
    </ScrollView>
  );
}

function ClubSettingsModal({ visible, club, onClose, onSaved }) {
  const [form, setForm] = useState({ name: "", city: "", country: "", phone: "", email: "", primaryColor: "", secondaryColor: "", logoUrl: "", groups: "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (visible && club) {
      setForm({
        name: club.name || "",
        city: club.city || "",
        country: club.country || "",
        phone: club.phone || "",
        email: club.email || "",
        primaryColor: club.primaryColor || "",
        secondaryColor: club.secondaryColor || "",
        logoUrl: club.logo || "",
        groups: (club.groups || []).join(", "),
      });
    }
  }, [visible, club]);

  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const save = async () => {
    if (form.name.trim().length < 2) { notify("Nume lipsă", "Clubul are nevoie de un nume."); return; }
    setSaving(true);
    try {
      const groups = form.groups.split(",").map((g) => g.trim()).filter(Boolean);
      await supabaseService.updateClub(club.id, {
        name: form.name.trim(),
        city: form.city.trim(),
        country: form.country.trim(),
        phone: form.phone.trim(),
        email: form.email.trim(),
        primaryColor: form.primaryColor.trim(),
        secondaryColor: form.secondaryColor.trim(),
        logoUrl: form.logoUrl.trim(),
        groups: groups.length ? groups : undefined,
      });
      notify("Salvat", "Datele clubului au fost actualizate.");
      onSaved();
    } catch (e) { notify("Eroare", e.message); } finally { setSaving(false); }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={[styles.modalCard, { maxHeight: "88%" }]}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Editează clubul</Text>
            <Pressable onPress={onClose}><LucideIcons.X size={18} color={C.dim} /></Pressable>
          </View>
          <ScrollView showsVerticalScrollIndicator={false}>
            <Text style={styles.modalLabel}>NUME CLUB</Text>
            <TextInput style={styles.modalInput} value={form.name} onChangeText={(v) => set("name", v)} placeholder="FC Autentic" placeholderTextColor={C.dim} />
            <View style={{ flexDirection: "row", gap: 10 }}>
              <View style={{ flex: 1 }}><Text style={styles.modalLabel}>ORAȘ</Text><TextInput style={styles.modalInput} value={form.city} onChangeText={(v) => set("city", v)} placeholder="Chișinău" placeholderTextColor={C.dim} /></View>
              <View style={{ flex: 1 }}><Text style={styles.modalLabel}>ȚARĂ</Text><TextInput style={styles.modalInput} value={form.country} onChangeText={(v) => set("country", v)} placeholder="Moldova" placeholderTextColor={C.dim} /></View>
            </View>
            <View style={{ flexDirection: "row", gap: 10 }}>
              <View style={{ flex: 1 }}><Text style={styles.modalLabel}>EMAIL</Text><TextInput style={styles.modalInput} value={form.email} onChangeText={(v) => set("email", v)} placeholder="contact@club.md" placeholderTextColor={C.dim} autoCapitalize="none" /></View>
              <View style={{ flex: 1 }}><Text style={styles.modalLabel}>TELEFON</Text><TextInput style={styles.modalInput} value={form.phone} onChangeText={(v) => set("phone", v)} placeholder="+373..." placeholderTextColor={C.dim} /></View>
            </View>
            <View style={{ flexDirection: "row", gap: 10 }}>
              <View style={{ flex: 1 }}><Text style={styles.modalLabel}>CULOARE PRIMARĂ</Text><TextInput style={styles.modalInput} value={form.primaryColor} onChangeText={(v) => set("primaryColor", v)} placeholder="#00D4FF" placeholderTextColor={C.dim} autoCapitalize="none" /></View>
              <View style={{ flex: 1 }}><Text style={styles.modalLabel}>CULOARE SECUNDARĂ</Text><TextInput style={styles.modalInput} value={form.secondaryColor} onChangeText={(v) => set("secondaryColor", v)} placeholder="#7C3AED" placeholderTextColor={C.dim} autoCapitalize="none" /></View>
            </View>
            <Text style={styles.modalLabel}>LOGO (URL, opțional)</Text>
            <TextInput style={styles.modalInput} value={form.logoUrl} onChangeText={(v) => set("logoUrl", v)} placeholder="https://..." placeholderTextColor={C.dim} autoCapitalize="none" />
            <Text style={styles.modalLabel}>GRUPE (separate prin virgulă)</Text>
            <TextInput style={styles.modalInput} value={form.groups} onChangeText={(v) => set("groups", v)} placeholder="U13, U16, U19, Seniori" placeholderTextColor={C.dim} />
            <SaveButton saving={saving} onPress={save} label="Salvează clubul" />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const InfoRow = ({ icon, label, value }) => {
  const Icon = LucideIcons[icon] || LucideIcons.Circle;
  return (
    <View style={styles.row}>
      <View style={styles.rowIcon}><Icon size={17} color={C.cyan} /></View>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
};

function EditNameModal({ visible, currentName, onClose }) {
  const [name, setName] = useState(currentName || "");
  const [saving, setSaving] = useState(false);
  useEffect(() => { if (visible) setName(currentName || ""); }, [visible, currentName]);

  const save = async () => {
    if (name.trim().length < 3) { notify("Nume prea scurt", "Introdu numele complet."); return; }
    setSaving(true);
    try {
      await authService.updateProfileName(name.trim());
      notify("Salvat", "Numele a fost actualizat. Se aplică la următoarea reîncărcare.");
      onClose();
    } catch (e) { notify("Eroare", e.message); } finally { setSaving(false); }
  };

  return (
    <SettingModal visible={visible} title="Editează numele" onClose={onClose}>
      <Text style={styles.modalLabel}>NUME COMPLET</Text>
      <TextInput style={styles.modalInput} value={name} onChangeText={setName} placeholder="Numele tău" placeholderTextColor={C.dim} />
      <SaveButton saving={saving} onPress={save} label="Salvează" />
    </SettingModal>
  );
}

function ChangePasswordModal({ visible, onClose }) {
  const [pass, setPass] = useState("");
  const [confirm, setConfirm] = useState("");
  const [saving, setSaving] = useState(false);
  useEffect(() => { if (visible) { setPass(""); setConfirm(""); } }, [visible]);

  const save = async () => {
    if (pass.length < 6) { notify("Parolă prea scurtă", "Minim 6 caractere."); return; }
    if (pass !== confirm) { notify("Parolele nu coincid", "Rescrie aceeași parolă."); return; }
    setSaving(true);
    try {
      await authService.updatePassword(pass);
      notify("Parolă schimbată", "Parola ta a fost actualizată.");
      onClose();
    } catch (e) { notify("Eroare", e.message); } finally { setSaving(false); }
  };

  return (
    <SettingModal visible={visible} title="Schimbă parola" onClose={onClose}>
      <Text style={styles.modalLabel}>PAROLĂ NOUĂ</Text>
      <TextInput style={styles.modalInput} value={pass} onChangeText={setPass} placeholder="Minim 6 caractere" placeholderTextColor={C.dim} secureTextEntry />
      <Text style={styles.modalLabel}>CONFIRMĂ PAROLA</Text>
      <TextInput style={styles.modalInput} value={confirm} onChangeText={setConfirm} placeholder="Rescrie parola" placeholderTextColor={C.dim} secureTextEntry />
      <SaveButton saving={saving} onPress={save} label="Schimbă parola" />
    </SettingModal>
  );
}

const SettingModal = ({ visible, title, onClose, children }) => (
  <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
    <View style={styles.modalOverlay}>
      <View style={styles.modalCard}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>{title}</Text>
          <Pressable onPress={onClose}><LucideIcons.X size={18} color={C.dim} /></Pressable>
        </View>
        {children}
      </View>
    </View>
  </Modal>
);

const SaveButton = ({ saving, onPress, label }) => (
  <Pressable style={[styles.modalSaveBtn, saving && { opacity: 0.7 }]} onPress={onPress} disabled={saving}>
    {saving ? <ActivityIndicator size="small" color="white" /> : (
      <>
        <LucideIcons.Check size={16} color="white" />
        <Text style={styles.modalSaveText}>{label}</Text>
      </>
    )}
  </Pressable>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#020617" },
  content: { padding: spacing.md, paddingBottom: 120 },

  card: { backgroundColor: C.card, borderRadius: 18, padding: 6, marginBottom: 8, borderWidth: 1, borderColor: "rgba(255,255,255,0.05)" },
  row: { flexDirection: "row", alignItems: "center", padding: 12, borderRadius: 14, gap: 4 },
  rowActive: { backgroundColor: "rgba(0,212,255,0.08)" },
  rowIcon: { width: 36, height: 36, borderRadius: 10, backgroundColor: "#030712", alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: C.line, marginRight: 12 },
  rowLabel: { flex: 1, color: "white", fontWeight: "800", fontSize: 13 },
  infoValue: { color: C.muted, fontSize: 12, fontWeight: "700" },

  profileRow: { flexDirection: "row", alignItems: "center", padding: 12 },
  profileName: { color: "white", fontWeight: "900", fontSize: 15 },
  profileEmail: { color: C.muted, fontSize: 11, marginTop: 2 },

  codeValue: { color: C.cyan, fontSize: 15, fontWeight: "900", letterSpacing: 2, marginTop: 2 },
  copyBtn: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 12, height: 34, borderRadius: 10, borderWidth: 1, borderColor: C.cyan + "40", backgroundColor: C.cyan + "10" },
  copyText: { color: C.cyan, fontSize: 11, fontWeight: "800" },
  hint: { color: C.dim, fontSize: 10.5, fontWeight: "600", paddingHorizontal: 12, paddingBottom: 8, lineHeight: 15 },

  clubIcon: { width: 36, height: 36, borderRadius: 10, backgroundColor: "#030712", alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: C.line },
  clubInitial: { color: C.cyan, fontWeight: "900", fontSize: 16 },
  clubPlan: { color: C.dim, fontSize: 10, fontWeight: "600", marginTop: 2 },

  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.72)", alignItems: "center", justifyContent: "center", padding: 20 },
  modalCard: { width: "100%", maxWidth: 420, backgroundColor: C.card, borderRadius: 18, padding: 20, borderWidth: 1, borderColor: "rgba(0,212,255,0.14)" },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  modalTitle: { color: "white", fontSize: 15, fontWeight: "900" },
  modalLabel: { color: C.muted, fontSize: 9, fontWeight: "900", letterSpacing: 1, marginBottom: 6, marginTop: 4 },
  modalInput: { backgroundColor: C.bgSecondary, borderWidth: 1, borderColor: C.line, color: "white", borderRadius: 10, paddingHorizontal: 12, height: 44, fontSize: 12, fontWeight: "600", marginBottom: 12 },
  modalSaveBtn: { height: 46, borderRadius: 12, backgroundColor: C.blue, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 4 },
  modalSaveText: { color: "white", fontSize: 12, fontWeight: "900" },
});
