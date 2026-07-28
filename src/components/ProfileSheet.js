import React from "react";
import { Modal, View, Text, Pressable, StyleSheet } from "react-native";
import * as LucideIcons from "lucide-react-native";
import { colors as C, themedStyles } from "../constants/theme";
import { useTranslation } from "../i18n";

const ROLE_LABELS = {
  super_admin: "Administrator platformă",
  club_owner: "Owner club",
  admin: "Administrator",
  coach: "Antrenor",
  player: "Jucător",
  parent: "Părinte",
  viewer: "Vizitator",
};

// Fișă de profil + setări, deschisă din cardul de profil (dreapta sus).
export default function ProfileSheet({ visible, user, selectedClub, onClose, onLogout, onNavigate }) {
  const { t } = useTranslation();
  if (!visible) return null;

  const role = user?.role || "viewer";
  const initial = (user?.name || "U").slice(0, 1).toUpperCase();
  const isPlayerOrParent = role === "player" || role === "parent";

  const go = (tab) => { onClose?.(); onNavigate?.(tab); };

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.card} onPress={(e) => e.stopPropagation?.()}>
          <View style={styles.header}>
            <View style={styles.avatar}><Text style={styles.avatarText}>{initial}</Text></View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.name} numberOfLines={1}>{user?.name || t('nav.user')}</Text>
              {!!user?.email && <Text style={styles.email} numberOfLines={1}>{user.email}</Text>}
            </View>
            <Pressable onPress={onClose} style={styles.closeBtn}><LucideIcons.X size={18} color={C.dim} /></Pressable>
          </View>

          <View style={styles.infoRow}>
            <InfoPill icon="ShieldCheck" label="Rol" value={ROLE_LABELS[role] || role} />
            <InfoPill icon="Building2" label="Club" value={selectedClub?.name || "—"} />
          </View>

          <View style={styles.menu}>
            {isPlayerOrParent && (
              <MenuItem icon="User" label="Profilul meu" onPress={() => go("Profil")} />
            )}
            <MenuItem icon="Settings" label="Setări și cluburi" onPress={() => go("Mai mult")} />
            <MenuItem icon="LogOut" label="Ieșire din cont" danger onPress={() => { onClose?.(); onLogout?.(); }} />
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const InfoPill = ({ icon, label, value }) => {
  const Icon = LucideIcons[icon] || LucideIcons.Circle;
  return (
    <View style={styles.infoPill}>
      <Icon size={14} color={C.cyan} />
      <View style={{ marginLeft: 8, flex: 1 }}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue} numberOfLines={1}>{value}</Text>
      </View>
    </View>
  );
};

const MenuItem = ({ icon, label, onPress, danger }) => {
  const Icon = LucideIcons[icon] || LucideIcons.Circle;
  const color = danger ? C.red : "white";
  return (
    <Pressable onPress={onPress} style={styles.menuItem}>
      <Icon size={17} color={danger ? C.red : C.cyan} />
      <Text style={[styles.menuLabel, { color }]}>{label}</Text>
      <LucideIcons.ChevronRight size={15} color={C.dim} />
    </Pressable>
  );
};

const styles = themedStyles((C) => StyleSheet.create({
  overlay: { flex: 1, backgroundColor: C.bgSecondary, alignItems: "flex-end", justifyContent: "flex-start", padding: 16 },
  card: { width: "100%", maxWidth: 340, backgroundColor: C.card, borderRadius: 18, padding: 16, borderWidth: 1, borderColor: C.cyan + "24", marginTop: 8 },
  header: { flexDirection: "row", alignItems: "center", marginBottom: 14 },
  avatar: { width: 46, height: 46, borderRadius: 23, backgroundColor: C.cyan + "24", borderWidth: 1, borderColor: C.cyan + "59", alignItems: "center", justifyContent: "center" },
  avatarText: { color: C.cyan, fontSize: 18, fontWeight: "900" },
  name: { color: C.text, fontSize: 15, fontWeight: "900" },
  email: { color: C.muted, fontSize: 11, fontWeight: "600", marginTop: 2 },
  closeBtn: { width: 30, height: 30, alignItems: "center", justifyContent: "center" },

  infoRow: { flexDirection: "row", gap: 8, marginBottom: 14 },
  infoPill: { flex: 1, flexDirection: "row", alignItems: "center", backgroundColor: C.bgSecondary, borderRadius: 12, padding: 10, borderWidth: 1, borderColor: C.line },
  infoLabel: { color: C.dim, fontSize: 8.5, fontWeight: "800", textTransform: "uppercase", letterSpacing: 0.5 },
  infoValue: { color: C.text, fontSize: 11.5, fontWeight: "800", marginTop: 1 },

  menu: { gap: 4 },
  menuItem: { flexDirection: "row", alignItems: "center", gap: 12, height: 46, borderRadius: 12, paddingHorizontal: 12, backgroundColor: C.fill1, borderWidth: 1, borderColor: C.line },
  menuLabel: { flex: 1, fontSize: 13, fontWeight: "700" },
}));
