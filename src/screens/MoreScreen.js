import React, { useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View, Switch, Modal, TextInput, Platform, Alert, ActivityIndicator } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as LucideIcons from "lucide-react-native";
import { useQueryClient } from "@tanstack/react-query";
import { colors as C, spacing, themedStyles, applyTheme, themeName, layout } from "../constants/theme";
import { TopBar, SectionTitle } from "../components/SharedComponents";
import { BeUIButton } from "../components/ui/be-ui-button";
import { authService } from "../services/authService";
import { supabaseService } from "../services/supabaseService";
import { useTopClearance } from "../hooks/useTopClearance";
import { LANGUAGES, useTranslation } from "../i18n";

const APP_VERSION = "1.0.0";
const NOTIF_KEY = "fc_notif_prefs";
const THEME_KEY = "fc_theme";

// Cheia și iconița sunt interne; eticheta vine din dicționar la randare.
const NOTIF_ITEMS = [
  ["announcements", "Megaphone"],
  ["callups", "ClipboardCheck"],
  ["trainings", "Dumbbell"],
  ["payments", "Wallet"],
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

export default function MoreScreen({ currentUser, onLogout, selectedClub, switchClub, onCreateClub, clubs = [], onThemeChange }) {
  const { t, lang, setLanguage } = useTranslation();
  const topClearance = useTopClearance();
  const [darkMode, setDarkMode] = useState(themeName !== "light");

  // Comută tema: aplicăm paleta, salvăm preferința și cerem remontarea
  // aplicației ca stilurile regenerate să fie preluate de toate ecranele.
  const toggleTheme = () => {
    const next = darkMode ? "light" : "dark";
    setDarkMode(!darkMode);
    applyTheme(next);
    AsyncStorage.setItem(THEME_KEY, next).catch(() => {});
    onThemeChange?.(next);
  };

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
      } catch (e) { notify(t('common.error'), e.message); } finally { setDeleting(false); }
    };
    const msg = t('more.deleteMsg');
    if (Platform.OS === "web") { if (window.confirm(`${t('more.deleteAccount')}\n\n${msg}`)) run(); }
    else Alert.alert(t('more.deleteAccount'), msg, [{ text: t('more.cancel'), style: "cancel" }, { text: t('more.deleteForever'), style: "destructive", onPress: run }]);
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
    notify(ok ? t('more.copied') : t('more.clubCode'), ok ? t('more.copiedMsg', { code }) : t('more.codeIs', { code }));
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={[styles.content, topClearance]} showsVerticalScrollIndicator={false}>
      <TopBar title={t('more.title')} eyebrow={t('more.eyebrow')} />

      {/* Contul meu */}
      <SectionTitle title={t('more.account')} />
      <View style={styles.card}>
        <View style={styles.profileRow}>
          <LucideIcons.UserCircle2 size={44} color={C.blue} />
          <View style={{ marginLeft: 14, flex: 1 }}>
            <Text style={styles.profileName} numberOfLines={1}>{currentUser?.name || t('more.user')}</Text>
            <Text style={styles.profileEmail} numberOfLines={1}>{currentUser?.email}</Text>
          </View>
        </View>
        <Pressable style={styles.row} onPress={() => setNameOpen(true)}>
          <View style={styles.rowIcon}><LucideIcons.Pencil size={17} color={C.cyan} /></View>
          <Text style={styles.rowLabel}>{t('more.editName')}</Text>
          <LucideIcons.ChevronRight size={15} color={C.dim} />
        </Pressable>
        <Pressable style={styles.row} onPress={() => setPassOpen(true)}>
          <View style={styles.rowIcon}><LucideIcons.KeyRound size={17} color={C.cyan} /></View>
          <Text style={styles.rowLabel}>{t('more.changePassword')}</Text>
          <LucideIcons.ChevronRight size={15} color={C.dim} />
        </Pressable>
        <Pressable style={styles.row} onPress={deleteAccount} disabled={deleting}>
          <View style={[styles.rowIcon, { borderColor: C.red + "40" }]}>
            {deleting ? <ActivityIndicator size="small" color={C.red} /> : <LucideIcons.Trash2 size={17} color={C.red} />}
          </View>
          <Text style={[styles.rowLabel, { color: C.red }]}>{t('more.deleteAccount')}</Text>
          <LucideIcons.ChevronRight size={15} color={C.dim} />
        </Pressable>
      </View>

      {/* Aspect */}
      <SectionTitle title={t('more.appearance')} />
      <View style={styles.card}>
        <View style={styles.row}>
          <View style={styles.rowIcon}>
            <LucideIcons.Moon size={17} color={C.cyan} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.rowLabel}>{t('more.darkTheme')}</Text>
            <Text style={styles.rowHint}>{t('more.darkThemeHint')}</Text>
          </View>
          <Switch
            value={darkMode}
            onValueChange={toggleTheme}
            trackColor={{ false: C.line, true: C.cyan + "88" }}
            thumbColor={darkMode ? C.cyan : C.muted}
          />
        </View>
      </View>

      {/* Notificări */}
      <SectionTitle title={t('more.notifications')} />
      <View style={styles.card}>
        {NOTIF_ITEMS.map(([key, icon]) => {
          const Icon = LucideIcons[icon] || LucideIcons.Bell;
          return (
            <View key={key} style={styles.row}>
              <View style={styles.rowIcon}><Icon size={17} color={C.cyan} /></View>
              <Text style={styles.rowLabel}>{t(`more.notif.${key}`)}</Text>
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
          <SectionTitle title={t('more.clubCode')} />
          <View style={styles.card}>
            <View style={styles.row}>
              <View style={styles.rowIcon}><LucideIcons.KeySquare size={17} color={C.cyan} /></View>
              <View style={{ flex: 1 }}>
                <Text style={styles.rowLabel}>{t('more.joinCode')}</Text>
                <Text style={styles.codeValue}>{selectedClub.joinCode}</Text>
              </View>
              <Pressable style={styles.copyBtn} onPress={copyJoinCode}>
                <LucideIcons.Copy size={14} color={C.cyan} />
                <Text style={styles.copyText}>{t('more.copy')}</Text>
              </Pressable>
            </View>
            <Text style={styles.hint}>{t('more.codeHint')}</Text>
            {canEditClub && (
              <Pressable style={styles.row} onPress={() => setClubEditOpen(true)}>
                <View style={styles.rowIcon}><LucideIcons.Settings2 size={17} color={C.cyan} /></View>
                <Text style={styles.rowLabel}>{t('more.editClub')}</Text>
                <LucideIcons.ChevronRight size={15} color={C.dim} />
              </Pressable>
            )}
          </View>
        </>
      ) : null}

      {/* Cluburi */}
      <SectionTitle title={t('more.myClubs')} action={t('more.add')} onAction={onCreateClub} />
      <View style={styles.card}>
        {clubs.length === 0 && <Text style={styles.hint}>{t('more.noClubs')}</Text>}
        {clubs.map((club) => (
          <Pressable
            key={club.id}
            style={[styles.row, selectedClub?.id === club.id && styles.rowActive]}
            onPress={() => switchClub?.(club.id)}
          >
            <View style={styles.clubIcon}><Text style={styles.clubInitial}>{club.name?.[0] || "C"}</Text></View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.rowLabel} numberOfLines={1}>{club.name}</Text>
              <Text style={styles.clubPlan}>{t('more.plan', { name: club.plan_name || club.plan || "Free" })}</Text>
            </View>
            {selectedClub?.id === club.id && <LucideIcons.CheckCircle2 size={18} color={C.cyan} />}
          </Pressable>
        ))}
      </View>

      {/* Aplicație */}
      <SectionTitle title={t('more.app')} />
      <View style={styles.card}>
        {/* Rândul arăta mereu „Română”, orice limbă ar fi fost aleasă, și nu
            se putea schimba decât din pagina de logare. Acum arată limba
            curentă și o poate și schimba. */}
        <View style={styles.row}>
          <View style={styles.rowIcon}><LucideIcons.Languages size={17} color={C.cyan} /></View>
          <Text style={styles.rowLabel}>{t('more.language')}</Text>
          <View style={styles.langRow}>
            {LANGUAGES.map((l) => (
              <Pressable
                key={l.key}
                onPress={() => setLanguage(l.key)}
                style={[styles.langChip, lang === l.key && styles.langChipActive]}
                accessibilityRole="button"
                accessibilityState={{ selected: lang === l.key }}
              >
                <Text style={[styles.langChipText, lang === l.key && styles.langChipTextActive]}>{l.label}</Text>
              </Pressable>
            ))}
          </View>
        </View>
        {/* Tema arăta „Întunecată” și când era pornită cea luminoasă. */}
        <InfoRow icon="Moon" label={t('more.theme')} value={darkMode ? t('more.themeDark') : t('more.themeLight')} />
        <InfoRow icon="Info" label={t('more.version')} value={APP_VERSION} />
      </View>

      <BeUIButton
        label={t('more.logout')}
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
  const { t } = useTranslation();
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
    if (form.name.trim().length < 2) { notify(t('more.club.nameMissing'), t('more.club.nameMissingMsg')); return; }
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
      notify(t('common.saved'), t('more.club.savedMsg'));
      onSaved();
    } catch (e) { notify(t('common.error'), e.message); } finally { setSaving(false); }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={[styles.modalCard, { maxHeight: "88%" }]}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{t('more.club.title')}</Text>
            <Pressable onPress={onClose}><LucideIcons.X size={18} color={C.dim} /></Pressable>
          </View>
          <ScrollView showsVerticalScrollIndicator={false}>
            <Text style={styles.modalLabel}>{t('more.club.name')}</Text>
            <TextInput style={styles.modalInput} value={form.name} onChangeText={(v) => set("name", v)} placeholder="FC Autentic" placeholderTextColor={C.dim} />
            <View style={{ flexDirection: "row", gap: 10 }}>
              <View style={{ flex: 1 }}><Text style={styles.modalLabel}>{t('more.club.city')}</Text><TextInput style={styles.modalInput} value={form.city} onChangeText={(v) => set("city", v)} placeholder="Chișinău" placeholderTextColor={C.dim} /></View>
              <View style={{ flex: 1 }}><Text style={styles.modalLabel}>{t('more.club.country')}</Text><TextInput style={styles.modalInput} value={form.country} onChangeText={(v) => set("country", v)} placeholder="Moldova" placeholderTextColor={C.dim} /></View>
            </View>
            <View style={{ flexDirection: "row", gap: 10 }}>
              <View style={{ flex: 1 }}><Text style={styles.modalLabel}>{t('more.club.email')}</Text><TextInput style={styles.modalInput} value={form.email} onChangeText={(v) => set("email", v)} placeholder="contact@club.md" placeholderTextColor={C.dim} autoCapitalize="none" /></View>
              <View style={{ flex: 1 }}><Text style={styles.modalLabel}>{t('more.club.phone')}</Text><TextInput style={styles.modalInput} value={form.phone} onChangeText={(v) => set("phone", v)} placeholder="+373..." placeholderTextColor={C.dim} /></View>
            </View>
            <View style={{ flexDirection: "row", gap: 10 }}>
              <View style={{ flex: 1 }}><Text style={styles.modalLabel}>{t('more.club.primary')}</Text><TextInput style={styles.modalInput} value={form.primaryColor} onChangeText={(v) => set("primaryColor", v)} placeholder="#06B6D4" placeholderTextColor={C.dim} autoCapitalize="none" /></View>
              <View style={{ flex: 1 }}><Text style={styles.modalLabel}>{t('more.club.secondary')}</Text><TextInput style={styles.modalInput} value={form.secondaryColor} onChangeText={(v) => set("secondaryColor", v)} placeholder="#7C3AED" placeholderTextColor={C.dim} autoCapitalize="none" /></View>
            </View>
            <Text style={styles.modalLabel}>{t('more.club.logo')}</Text>
            <TextInput style={styles.modalInput} value={form.logoUrl} onChangeText={(v) => set("logoUrl", v)} placeholder="https://..." placeholderTextColor={C.dim} autoCapitalize="none" />
            <Text style={styles.modalLabel}>{t('more.club.groups')}</Text>
            <TextInput style={styles.modalInput} value={form.groups} onChangeText={(v) => set("groups", v)} placeholder="U13, U16, U19, Seniori" placeholderTextColor={C.dim} />
            <SaveButton saving={saving} onPress={save} label={t('more.club.save')} />
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
  const { t } = useTranslation();
  const [name, setName] = useState(currentName || "");
  const [saving, setSaving] = useState(false);
  useEffect(() => { if (visible) setName(currentName || ""); }, [visible, currentName]);

  const save = async () => {
    if (name.trim().length < 3) { notify(t('more.name.tooShort'), t('more.name.tooShortMsg')); return; }
    setSaving(true);
    try {
      await authService.updateProfileName(name.trim());
      notify(t('common.saved'), t('more.name.savedMsg'));
      onClose();
    } catch (e) { notify(t('common.error'), e.message); } finally { setSaving(false); }
  };

  return (
    <SettingModal visible={visible} title={t('more.editName')} onClose={onClose}>
      <Text style={styles.modalLabel}>{t('more.name.label')}</Text>
      <TextInput style={styles.modalInput} value={name} onChangeText={setName} placeholder={t('more.name.hint')} placeholderTextColor={C.dim} />
      <SaveButton saving={saving} onPress={save} label={t('common.save')} />
    </SettingModal>
  );
}

function ChangePasswordModal({ visible, onClose }) {
  const { t } = useTranslation();
  const [pass, setPass] = useState("");
  const [confirm, setConfirm] = useState("");
  const [saving, setSaving] = useState(false);
  useEffect(() => { if (visible) { setPass(""); setConfirm(""); } }, [visible]);

  const save = async () => {
    if (pass.length < 6) { notify(t('more.pass.tooShort'), t('more.pass.tooShortMsg')); return; }
    if (pass !== confirm) { notify(t('more.pass.mismatch'), t('more.pass.mismatchMsg')); return; }
    setSaving(true);
    try {
      await authService.updatePassword(pass);
      notify(t('more.pass.changed'), t('more.pass.changedMsg'));
      onClose();
    } catch (e) { notify(t('common.error'), e.message); } finally { setSaving(false); }
  };

  return (
    <SettingModal visible={visible} title={t('more.changePassword')} onClose={onClose}>
      <Text style={styles.modalLabel}>{t('more.pass.new')}</Text>
      <TextInput style={styles.modalInput} value={pass} onChangeText={setPass} placeholder={t('more.pass.newHint')} placeholderTextColor={C.dim} secureTextEntry />
      <Text style={styles.modalLabel}>{t('more.pass.confirm')}</Text>
      <TextInput style={styles.modalInput} value={confirm} onChangeText={setConfirm} placeholder={t('more.pass.confirmHint')} placeholderTextColor={C.dim} secureTextEntry />
      <SaveButton saving={saving} onPress={save} label={t('more.changePassword')} />
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

const styles = themedStyles((C) => StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  content: { padding: spacing.md, paddingBottom: layout.navClearance },

  card: { backgroundColor: C.card, borderRadius: 18, padding: 6, marginBottom: 8, borderWidth: 1, borderColor: C.line },
  row: { flexDirection: "row", alignItems: "center", padding: 12, borderRadius: 14, gap: 4 },
  langRow: { flexDirection: "row", gap: 6 },
  langChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999, borderWidth: 1, borderColor: C.line, backgroundColor: C.fill1 },
  langChipActive: { borderColor: C.cyan + "55", backgroundColor: C.cyan + "14" },
  langChipText: { color: C.muted, fontSize: 12, fontWeight: "800" },
  langChipTextActive: { color: C.cyan },
  rowActive: { backgroundColor: C.cyan + "14" },
  rowIcon: { width: 36, height: 36, borderRadius: 10, backgroundColor: C.cardSolid, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: C.line, marginRight: 12 },
  rowHint: { color: C.dim, fontSize: 10.5, fontWeight: "600", marginTop: 2 },
  rowLabel: { flex: 1, color: C.text, fontWeight: "800", fontSize: 13 },
  infoValue: { color: C.muted, fontSize: 12, fontWeight: "700" },

  profileRow: { flexDirection: "row", alignItems: "center", padding: 12 },
  profileName: { color: C.text, fontWeight: "900", fontSize: 15 },
  profileEmail: { color: C.muted, fontSize: 11, marginTop: 2 },

  codeValue: { color: C.cyan, fontSize: 15, fontWeight: "900", letterSpacing: 2, marginTop: 2 },
  copyBtn: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 12, height: 34, borderRadius: 10, borderWidth: 1, borderColor: C.cyan + "40", backgroundColor: C.cyan + "10" },
  copyText: { color: C.cyan, fontSize: 11, fontWeight: "800" },
  hint: { color: C.dim, fontSize: 10.5, fontWeight: "600", paddingHorizontal: 12, paddingBottom: 8, lineHeight: 15 },

  clubIcon: { width: 36, height: 36, borderRadius: 10, backgroundColor: C.cardSolid, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: C.line },
  clubInitial: { color: C.cyan, fontWeight: "900", fontSize: 16 },
  clubPlan: { color: C.dim, fontSize: 10, fontWeight: "600", marginTop: 2 },

  modalOverlay: { flex: 1, backgroundColor: C.isDark ? "rgba(0,0,0,0.72)" : "rgba(9,9,11,0.45)", alignItems: "center", justifyContent: "center", padding: 20 },
  modalCard: { width: "100%", maxWidth: 420, backgroundColor: C.card, borderRadius: 18, padding: 20, borderWidth: 1, borderColor: C.cyan + "24" },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  modalTitle: { color: C.text, fontSize: 15, fontWeight: "900" },
  modalLabel: { color: C.muted, fontSize: 9, fontWeight: "900", letterSpacing: 1, marginBottom: 6, marginTop: 4 },
  modalInput: { backgroundColor: C.bgSecondary, borderWidth: 1, borderColor: C.line, color: C.text, borderRadius: 10, paddingHorizontal: 12, height: 44, fontSize: 12, fontWeight: "600", marginBottom: 12 },
  modalSaveBtn: { height: 46, borderRadius: 12, backgroundColor: C.blue, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 4 },
  modalSaveText: { color: C.text, fontSize: 12, fontWeight: "900" },
}));
