import React, { useState } from "react";
import { Image, View, Text, ScrollView, StyleSheet, Pressable, TextInput } from "react-native";
import * as LucideIcons from "lucide-react-native";
import { colors as C, radius, spacing } from "../constants/theme";
import { BlurView } from "expo-blur";
import ProfileSheet from "./ProfileSheet";

// Iconițe pentru fiecare tab. Meniul din sidebar se construiește dinamic din
// lista `tabs` primită, ca să reflecte exact ce vede rolul curent.
const TAB_ICONS = {
  Dashboard: "LayoutDashboard",
  "Echipă": "Users",
  "Antren.": "Dumbbell",
  Meciuri: "Trophy",
  Calendar: "CalendarDays",
  Sarcini: "ListChecks",
  Staff: "UserCog",
  "Finanțe": "Wallet",
  AI: "Bot",
  Abonamente: "CreditCard",
  Documente: "FolderOpen",
  Echipament: "Package",
  "Disciplină": "ShieldAlert",
  Scouting: "Binoculars",
  Tactici: "ClipboardList",
  Statistici: "ChartColumn",
  Galerie: "Images",
  Profil: "User",
  "Mai mult": "Settings",
  // Administrare platformă
  "Panou SaaS": "LayoutDashboard",
  Cluburi: "Building2",
  "Abonamente SaaS": "CreditCard",
  Utilizatori: "Users",
};

// Taburile care aparțin secțiunii de administrare a platformei.
const ADMIN_LABELS = ["Panou SaaS", "Cluburi", "Abonamente SaaS", "Utilizatori"];

export function SaaSAppShell({ children, activeTab, setTab, tabs = [], user, selectedClub, onLogout }) {
  const toItem = (label) => ({ label, icon: TAB_ICONS[label] || "Circle" });
  // „Mai mult” nu se mai afișează în sidebar; setările/cluburile sunt accesibile
  // din cardul de profil (dreapta sus).
  const primaryItems = tabs.filter((label) => !ADMIN_LABELS.includes(label) && label !== "Mai mult").map(toItem);
  const adminItems = tabs.filter((label) => ADMIN_LABELS.includes(label)).map(toItem);

  return (
    <View style={styles.shell}>
      <SaaSSidebar
        activeTab={activeTab}
        setTab={setTab}
        primaryItems={primaryItems}
        adminItems={adminItems}
        selectedClub={selectedClub}
      />
      <View style={styles.main}>
        <Topbar user={user} selectedClub={selectedClub} setTab={setTab} onLogout={onLogout} onNotifications={() => setTab("Notif.")} />
        <View style={styles.pageFrame}>{children}</View>
      </View>
    </View>
  );
}

export const SaaSSidebar = ({ activeTab, setTab, primaryItems = [], adminItems = [], selectedClub }) => {
  return (
    <View style={styles.sidebar}>
      <View style={styles.sidebarHeader}>
        <Image source={require("../../assets/icon-square.png")} style={styles.sidebarLogoImage} />
        <View>
          <Text style={styles.sidebarBrand}>Footbal Manager <Text style={styles.inlineAdmin}>99</Text></Text>
          <Text style={styles.sidebarAdmin}>Platformă cluburi sportive</Text>
        </View>
      </View>

      <ScrollView style={styles.menuScroll}>
        <Text style={styles.menuSectionLabel}>MENIU PRINCIPAL</Text>
        {primaryItems.map((tab) => <MenuItem key={tab.label} tab={tab} activeTab={activeTab} setTab={setTab} />)}
        {adminItems.length > 0 && (
          <>
            <Text style={styles.menuSectionLabel}>ADMIN SAAS</Text>
            {adminItems.map((tab) => <MenuItem key={tab.label} tab={tab} activeTab={activeTab} setTab={setTab} />)}
          </>
        )}
      </ScrollView>

      <View style={styles.sidebarFooter}>
        <View style={styles.clubCard}>
          <Image source={require("../../assets/icon-square.png")} style={styles.clubLogoSmall} />
          <View style={{ flex: 1, marginLeft: 10 }}>
            <Text style={styles.clubName} numberOfLines={1}>{selectedClub?.name || "FC Autentic"}</Text>
            <Text style={styles.clubSeason}>{selectedClub?.plan ? `Plan ${selectedClub.plan}` : "Club"}</Text>
          </View>
        </View>
      </View>
    </View>
  );
};

function MenuItem({ tab, activeTab, setTab }) {
  const Icon = LucideIcons[tab.icon] || LucideIcons.Circle;
  const isActive = activeTab === tab.label;
  return (
    <Pressable onPress={() => setTab(tab.label)} style={[styles.menuItem, isActive && styles.menuItemActive]}>
      <Icon size={20} color={isActive ? C.cyan : C.muted} strokeWidth={isActive ? 2.5 : 2} />
      <Text style={[styles.menuText, isActive && styles.menuTextActive]}>{tab.label}</Text>
      {tab.label === "Mai mult" && <View style={styles.countBadge}><Text style={styles.countText}>3</Text></View>}
      {isActive && <View style={styles.activeIndicator} />}
    </Pressable>
  );
}

function Topbar({ user, selectedClub, setTab, onLogout, onNotifications }) {
  const [profileOpen, setProfileOpen] = useState(false);
  return (
    <View style={styles.topbar}>
      <View style={styles.searchBox}>
        <LucideIcons.Search size={18} color={C.muted} />
        <TextInput
          value=""
          editable={false}
          pointerEvents="none"
          placeholder="Caută jucători, meciuri, sarcini..."
          placeholderTextColor={C.dim}
          style={styles.searchInput}
        />
        <View style={styles.shortcut}><Text style={styles.shortcutText}>⌘ K</Text></View>
      </View>

      <View style={{ flex: 1 }} />

      <Pressable onPress={onNotifications} style={styles.notifyButton}>
        <LucideIcons.Bell size={19} color="white" />
        <View style={styles.notifyDot}><Text style={styles.notifyText}>3</Text></View>
      </Pressable>
      <Pressable style={styles.profilePill} onPress={() => setProfileOpen(true)}>
        <View style={styles.profileTextWrap}>
          <Text style={styles.profileName}>{user?.name || "Utilizator"}</Text>
          <Text style={styles.profileRole}>{user?.role === "super_admin" ? "Administrator" : user?.role || "Admin"}</Text>
        </View>
        <View style={styles.avatar}><Text style={styles.avatarText}>{(user?.name || "A").slice(0, 1)}</Text></View>
        <LucideIcons.ChevronDown size={14} color={C.muted} />
      </Pressable>

      <ProfileSheet
        visible={profileOpen}
        user={user}
        selectedClub={selectedClub}
        onClose={() => setProfileOpen(false)}
        onLogout={onLogout}
        onNavigate={setTab}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  shell: { flex: 1, flexDirection: "row", backgroundColor: C.bg },
  main: { flex: 1, padding: 12, gap: 10 },
  pageFrame: { flex: 1, overflow: "hidden", borderRadius: 20, borderWidth: 1, borderColor: "rgba(0,212,255,0.08)", backgroundColor: "rgba(2,6,23,0.35)" },
  sidebar: {
    width: 260,
    margin: 6,
    borderRadius: 20,
    backgroundColor: "rgba(4, 11, 20, 0.92)",
    borderWidth: 1,
    borderColor: "rgba(0,212,255,0.14)",
    paddingTop: spacing.md,
    overflow: "hidden",
  },
  sidebarHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.xl,
    gap: 10
  },
  sidebarLogoImage: { width: 40, height: 40, resizeMode: "contain" },
  sidebarBrand: { color: "white", fontSize: 16, fontWeight: "900", letterSpacing: -0.3 },
  inlineAdmin: { color: C.cyan, fontSize: 12 },
  sidebarAdmin: { color: C.muted, fontSize: 9, fontWeight: "700", marginTop: 1 },

  menuScroll: { flex: 1, paddingHorizontal: spacing.sm },
  menuSectionLabel: {
    color: C.dim,
    fontSize: 8.5,
    fontWeight: "900",
    letterSpacing: 1.2,
    marginBottom: spacing.sm,
    marginLeft: spacing.lg,
    marginTop: spacing.md
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.md,
    marginBottom: 3,
    gap: 12,
    position: "relative"
  },
  menuItemActive: {
    backgroundColor: "rgba(0, 212, 255, 0.08)",
    borderWidth: 1,
    borderColor: "rgba(0,212,255,0.45)",
    shadowColor: C.cyan,
    shadowOpacity: 0.28,
    shadowRadius: 12,
  },
  menuText: { color: C.muted, fontSize: 12, fontWeight: "700" },
  menuTextActive: { color: C.cyan },
  countBadge: { marginLeft: "auto", backgroundColor: C.cyan, borderRadius: 999, paddingHorizontal: 6, paddingVertical: 1.5 },
  countText: { color: C.bg, fontSize: 9, fontWeight: "900" },
  activeIndicator: {
    position: "absolute",
    left: 0,
    top: "30%",
    bottom: "30%",
    width: 2.5,
    backgroundColor: C.cyan,
    borderRadius: radius.full,
    shadowColor: C.cyan,
    shadowRadius: 8,
    shadowOpacity: 0.8
  },

  sidebarFooter: { padding: spacing.md, gap: 12, borderTopWidth: 1, borderTopColor: C.line },
  seasonInfoWidget: { backgroundColor: "rgba(255,255,255,0.02)", padding: 12, borderRadius: 16, borderWidth: 1, borderColor: "rgba(255,255,255,0.05)", marginBottom: 4 },
  seasonInfoHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  seasonTitle: { color: 'white', fontSize: 10, fontWeight: '900', letterSpacing: 0.5 },
  leagueText: { color: C.muted, fontSize: 10, fontWeight: '700' },
  matchdayText: { color: C.dim, fontSize: 9, fontWeight: '600', marginBottom: 12 },
  seasonStatRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 },
  seasonStatLabel: { color: C.dim, fontSize: 8.5, fontWeight: '800' },
  seasonStatVal: { color: 'white', fontSize: 12, fontWeight: '900' },
  seasonProgressBar: { height: 4, backgroundColor: "rgba(255,255,255,0.05)", borderRadius: 2, marginTop: 6, overflow: 'hidden' },
  seasonProgressFill: { height: '100%', backgroundColor: C.blue, borderRadius: 2 },
  fullStandingsBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 16, backgroundColor: "rgba(255,255,255,0.03)", padding: 10, borderRadius: 10, borderWidth: 1, borderColor: "rgba(255,255,255,0.05)" },
  fullStandingsText: { color: C.muted, fontSize: 9, fontWeight: '800' },

  clubCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.03)",
    padding: 10,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)"
  },
  clubLogoSmall: { width: 30, height: 30, resizeMode: "contain" },
  clubName: { color: "white", fontSize: 11, fontWeight: "800" },
  clubSeason: { color: C.dim, fontSize: 8.5, fontWeight: "700", marginTop: 1 },
  seasonButton: { marginTop: 8, height: 34, borderRadius: 10, borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6 },
  seasonText: { color: C.muted, fontSize: 10, fontWeight: "800" },
  topbar: { height: 60, flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 4 },
  searchBox: { width: 440, height: 46, borderRadius: 12, borderWidth: 1, borderColor: "rgba(148,163,184,0.12)", backgroundColor: "rgba(15,23,42,0.75)", paddingHorizontal: 14, flexDirection: "row", alignItems: "center", gap: 10 },
  searchInput: { flex: 1, color: "white", fontSize: 12, fontWeight: "600" },
  shortcut: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, backgroundColor: "rgba(255,255,255,0.05)", borderWidth: 1, borderColor: "rgba(255,255,255,0.05)" },
  shortcutText: { color: C.dim, fontSize: 9, fontWeight: "900" },
  notifyButton: { width: 46, height: 46, borderRadius: 12, borderWidth: 1, borderColor: "rgba(148,163,184,0.12)", backgroundColor: "rgba(15,23,42,0.75)", alignItems: "center", justifyContent: "center" },
  notifyDot: { position: "absolute", top: 10, right: 10, width: 12, height: 12, borderRadius: 6, backgroundColor: C.cyan, alignItems: "center", justifyContent: "center", borderWidth: 1.5, borderColor: "#020812" },
  notifyText: { color: "#020812", fontSize: 7.5, fontWeight: "900" },
  profilePill: { height: 46, borderRadius: 12, borderWidth: 1, borderColor: "rgba(148,163,184,0.12)", backgroundColor: "rgba(15,23,42,0.75)", paddingHorizontal: 12, flexDirection: "row", alignItems: "center", gap: 10 },
  profileTextWrap: { alignItems: 'flex-end' },
  avatar: { width: 30, height: 30, borderRadius: 15, backgroundColor: "rgba(255,255,255,0.08)", alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "rgba(255,255,255,0.1)" },
  avatarText: { color: "white", fontSize: 12, fontWeight: "900" },
  profileName: { color: "white", fontSize: 11, fontWeight: "800" },
  profileRole: { color: C.dim, fontSize: 8.5, fontWeight: "700", textTransform: 'uppercase' },
});
