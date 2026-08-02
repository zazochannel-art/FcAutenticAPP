import React, { useEffect, useRef, useState } from "react";
import { Platform, Image, View, Text, ScrollView, StyleSheet, Pressable, TextInput } from "react-native";
import * as LucideIcons from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import { colors as C, radius, spacing, themedStyles, gradients, elevation } from "../constants/theme";
import ProfileSheet from "./ProfileSheet";
import { AmbientBackground } from "./ui/visuals";
import { BRAND_NAME } from "../constants/brand";
import { useTranslation } from "../i18n";
import { searchAll } from "../utils/search";

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

export function SaaSAppShell({ children, activeTab, setTab, tabs = [], user, selectedClub, onLogout, notificationsCount = 0, searchData }) {
  const toItem = (label) => ({ label, icon: TAB_ICONS[label] || "Circle" });
  // „Mai mult” nu se mai afișează în sidebar; setările/cluburile sunt accesibile
  // din cardul de profil (dreapta sus).
  const primaryItems = tabs.filter((label) => !ADMIN_LABELS.includes(label) && label !== "Mai mult").map(toItem);
  const adminItems = tabs.filter((label) => ADMIN_LABELS.includes(label)).map(toItem);

  return (
    <View style={styles.shell}>
      <AmbientBackground />
      <SaaSSidebar
        activeTab={activeTab}
        setTab={setTab}
        primaryItems={primaryItems}
        adminItems={adminItems}
        selectedClub={selectedClub}
      />
      <View style={styles.main}>
        <Topbar user={user} selectedClub={selectedClub} setTab={setTab} onLogout={onLogout} onNotifications={() => setTab("Notif.")} notificationsCount={notificationsCount} searchData={searchData} />
        <View style={styles.pageFrame}>{children}</View>
      </View>
    </View>
  );
}

export const SaaSSidebar = ({ activeTab, setTab, primaryItems = [], adminItems = [], selectedClub }) => {
  const { t } = useTranslation();
  return (
    <View style={styles.sidebar}>
      <View style={styles.sidebarHeader}>
        <View style={styles.sidebarLogoTile}>
          <Image source={require("../../assets/logo.png")} style={styles.sidebarLogoImage} />
        </View>
        <View>
          <Text style={styles.sidebarBrand}>{BRAND_NAME}</Text>
          <Text style={styles.sidebarAdmin}>{t('nav.platform')}</Text>
        </View>
      </View>

      <ScrollView style={styles.menuScroll}>
        <Text style={styles.menuSectionLabel}>{t('nav.sectionMain')}</Text>
        {primaryItems.map((tab) => <MenuItem key={tab.label} tab={tab} activeTab={activeTab} setTab={setTab} />)}
        {adminItems.length > 0 && (
          <>
            <Text style={styles.menuSectionLabel}>{t('nav.sectionAdmin')}</Text>
            {adminItems.map((tab) => <MenuItem key={tab.label} tab={tab} activeTab={activeTab} setTab={setTab} />)}
          </>
        )}
      </ScrollView>

      <View style={styles.sidebarFooter}>
        <View style={styles.clubCard}>
          <View style={styles.clubLogoTile}>
            <Image source={require("../../assets/logo.png")} style={styles.clubLogoSmall} />
          </View>
          <View style={{ flex: 1, marginLeft: 10 }}>
            <Text style={styles.clubName} numberOfLines={1}>{selectedClub?.name || t('nav.club')}</Text>
            <Text style={styles.clubSeason}>{selectedClub?.plan ? `Plan ${selectedClub.plan}` : t('nav.club')}</Text>
          </View>
          <View style={styles.onlineDot} />
        </View>
      </View>
    </View>
  );
};

function MenuItem({ tab, activeTab, setTab }) {
  const { t } = useTranslation();
  const Icon = LucideIcons[tab.icon] || LucideIcons.Circle;
  const isActive = activeTab === tab.label;
  const label = t(`nav.tab.${tab.label}`);
  return (
    <Pressable
      onPress={() => setTab(tab.label)}
      style={[styles.menuItem, isActive && styles.menuItemActive]}
      accessibilityRole="tab"
      accessibilityState={{ selected: isActive }}
      accessibilityLabel={label}
    >
      {isActive && (
        <LinearGradient
          colors={gradients.tabActive}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={StyleSheet.absoluteFill}
        />
      )}
      <Icon size={18} color={isActive ? "#fff" : C.muted} strokeWidth={2} />
      <Text style={[styles.menuText, isActive && styles.menuTextActive]}>{label}</Text>
    </Pressable>
  );
}

function Topbar({ user, selectedClub, setTab, onLogout, onNotifications, notificationsCount = 0, searchData }) {
  const { t } = useTranslation();
  const [profileOpen, setProfileOpen] = useState(false);
  // Caseta era decorativă: `editable={false}`, cu o insignă „⌘ K” care nu
  // deschidea nimic. Acum caută prin datele deja încărcate.
  const [query, setQuery] = useState("");
  const inputRef = useRef(null);
  const results = searchAll(searchData, query);

  // Scurtătura promisă de insignă chiar funcționează acum.
  useEffect(() => {
    if (Platform.OS !== "web" || typeof document === "undefined") return undefined;
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        inputRef.current?.focus();
      }
      if (e.key === "Escape") setQuery("");
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  const go = (result) => { setQuery(""); setTab(result.tab); };

  return (
    <View style={styles.topbar}>
      <View>
        <View style={styles.searchBox}>
          <LucideIcons.Search size={18} color={C.muted} />
          <TextInput
            ref={inputRef}
            value={query}
            onChangeText={setQuery}
            placeholder={t('nav.search')}
            placeholderTextColor={C.dim}
            style={styles.searchInput}
          />
          {query ? (
            <Pressable onPress={() => setQuery("")} accessibilityRole="button" accessibilityLabel={t('common.close')}>
              <LucideIcons.X size={15} color={C.dim} />
            </Pressable>
          ) : (
            <View style={styles.shortcut}><Text style={styles.shortcutText}>⌘ K</Text></View>
          )}
        </View>

        {query.trim().length >= 2 && (
          <View style={styles.searchResults}>
            {results.length === 0 ? (
              <Text style={styles.searchEmpty}>{t('nav.searchEmpty')}</Text>
            ) : results.map((r) => {
              const Icon = LucideIcons[r.icon] || LucideIcons.Circle;
              return (
                <Pressable key={r.id} style={styles.searchRow} onPress={() => go(r)} accessibilityRole="button">
                  <Icon size={15} color={C.cyan} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.searchTitle} numberOfLines={1}>{r.title}</Text>
                    {!!r.subtitle && <Text style={styles.searchSub} numberOfLines={1}>{r.subtitle}</Text>}
                  </View>
                  <Text style={styles.searchTab}>{t(`nav.tab.${r.tab}`)}</Text>
                </Pressable>
              );
            })}
          </View>
        )}
      </View>

      <View style={{ flex: 1 }} />

      <Pressable onPress={onNotifications} style={styles.notifyButton} accessibilityRole="button" accessibilityLabel={t('nav.notifications')}>
        <LucideIcons.Bell size={19} color="white" />
        {notificationsCount > 0 && (
          <View style={styles.notifyDot}>
            <Text style={styles.notifyText}>{notificationsCount > 9 ? "9+" : notificationsCount}</Text>
          </View>
        )}
      </Pressable>
      <Pressable style={styles.profilePill} onPress={() => setProfileOpen(true)} accessibilityRole="button" accessibilityLabel={t('nav.profile')}>
        <View style={styles.profileTextWrap}>
          <Text style={styles.profileName}>{user?.name || t('nav.user')}</Text>
          <Text style={styles.profileRole}>{user?.role === "super_admin" ? t('nav.administrator') : user?.role || "Admin"}</Text>
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

const styles = themedStyles((C) => StyleSheet.create({
  shell: { flex: 1, flexDirection: "row", backgroundColor: C.bg },
  main: { flex: 1, padding: 12, gap: 10 },
  pageFrame: { flex: 1, overflow: "hidden", borderRadius: radius.xl, backgroundColor: C.transparent },
  // .tabs @min-width:701px — panou flotant de 240px, rază 20, fundal propriu
  // rgba(20,24,43,.6) cu blur(20px) saturate(160%).
  sidebar: {
    width: 240,
    margin: 8,
    borderRadius: 20,
    backgroundColor: C.navPanel,
    borderWidth: 1,
    borderColor: C.line,
    paddingTop: spacing.md,
    overflow: "hidden",
    ...(Platform.OS === "web" ? { backdropFilter: "blur(20px) saturate(160%)" } : null),
  },
  sidebarHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.xl,
    gap: 10
  },
  sidebarLogoTile: { width: 46, height: 46, borderRadius: 13, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: C.cyan + "59", overflow: "hidden" },
  sidebarLogoImage: { width: 44, height: 44, borderRadius: 11, resizeMode: "cover" },
  sidebarBrand: { color: C.text, fontSize: 16, fontWeight: "900", letterSpacing: -0.3 },
  sidebarAdmin: { color: C.muted, fontSize: 9, fontWeight: "700", marginTop: 1 },

  menuScroll: { flex: 1, paddingHorizontal: 10 },
  menuSectionLabel: {
    color: C.dim,
    fontSize: 8.5,
    fontWeight: "900",
    letterSpacing: 1.2,
    marginBottom: spacing.sm,
    marginLeft: spacing.lg,
    marginTop: spacing.md
  },
  // .tab — 12px 14px, rază 12, gap 8, iconiță 18px, text 14/600
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: radius.md,
    marginBottom: 4,
    gap: 8,
    position: "relative",
    overflow: "hidden",
  },
  // .tab.active — box-shadow: 0 6px 18px rgba(139,92,246,.35)
  menuItemActive: { ...elevation.medium },
  menuText: { color: C.muted, fontSize: 14, fontWeight: "600" },
  menuTextActive: { color: "#fff", fontWeight: "600" },
  countBadge: { marginLeft: "auto", backgroundColor: C.cyan, borderRadius: 999, paddingHorizontal: 6, paddingVertical: 1.5 },
  countText: { color: C.bg, fontSize: 9, fontWeight: "900" },
  activeIndicator: {
    position: "absolute",
    left: 0,
    top: "28%",
    bottom: "28%",
    width: 3,
    backgroundColor: C.cyan,
    borderRadius: radius.full,
  },

  sidebarFooter: { padding: spacing.md, gap: 12, borderTopWidth: 1, borderTopColor: C.line },
  seasonInfoWidget: { backgroundColor: C.fill1, padding: 12, borderRadius: 16, borderWidth: 1, borderColor: C.line, marginBottom: 4 },
  seasonInfoHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  seasonTitle: { color: C.text, fontSize: 10, fontWeight: '900', letterSpacing: 0.5 },
  leagueText: { color: C.muted, fontSize: 10, fontWeight: '700' },
  matchdayText: { color: C.dim, fontSize: 9, fontWeight: '600', marginBottom: 12 },
  seasonStatRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 },
  seasonStatLabel: { color: C.dim, fontSize: 8.5, fontWeight: '800' },
  seasonStatVal: { color: C.text, fontSize: 12, fontWeight: '900' },
  seasonProgressBar: { height: 4, backgroundColor: C.fill3, borderRadius: 2, marginTop: 6, overflow: 'hidden' },
  seasonProgressFill: { height: '100%', backgroundColor: C.blue, borderRadius: 2 },
  fullStandingsBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 16, backgroundColor: C.fill1, padding: 10, borderRadius: 10, borderWidth: 1, borderColor: C.line },
  fullStandingsText: { color: C.muted, fontSize: 9, fontWeight: '800' },

  clubCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: C.fill3,
    padding: 10,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: C.line
  },
  clubLogoTile: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center", overflow: "hidden" },
  clubLogoSmall: { width: 34, height: 34, borderRadius: 8, resizeMode: "cover" },
  clubName: { color: C.text, fontSize: 11, fontWeight: "800" },
  clubSeason: { color: C.dim, fontSize: 8.5, fontWeight: "700", marginTop: 1 },
  onlineDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: C.green, borderWidth: 1.5, borderColor: C.card },
  seasonButton: { marginTop: 8, height: 34, borderRadius: 10, borderWidth: 1, borderColor: C.line, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6 },
  seasonText: { color: C.muted, fontSize: 10, fontWeight: "800" },
  // Antetul stă peste pagină: altfel panoul de rezultate al căutării era
  // acoperit de conținutul de dedesubt și nu se putea apăsa.
  topbar: { height: 62, flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 4, zIndex: 20 },
  searchBox: { width: 440, height: 46, borderRadius: radius.md, borderWidth: 1, borderColor: C.line, backgroundColor: C.card, paddingHorizontal: 14, flexDirection: "row", alignItems: "center", gap: 10 },
  searchInput: { flex: 1, color: C.text, fontSize: 12, fontWeight: "600", outlineStyle: "none" },
  searchResults: { position: "absolute", top: 52, left: 0, width: 440, maxHeight: 340, backgroundColor: C.cardSolid, borderRadius: radius.md, borderWidth: 1, borderColor: C.line, paddingVertical: 6, zIndex: 50, ...elevation.nav },
  searchRow: { flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 14, paddingVertical: 9 },
  searchTitle: { color: C.text, fontSize: 12, fontWeight: "800" },
  searchSub: { color: C.dim, fontSize: 10, fontWeight: "600", marginTop: 1 },
  searchTab: { color: C.muted, fontSize: 9.5, fontWeight: "900", textTransform: "uppercase", letterSpacing: 0.6 },
  searchEmpty: { color: C.muted, fontSize: 11.5, fontWeight: "600", paddingHorizontal: 14, paddingVertical: 12 },
  shortcut: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, backgroundColor: C.fill3, borderWidth: 1, borderColor: C.line },
  shortcutText: { color: C.dim, fontSize: 9, fontWeight: "900" },
  notifyButton: { width: 46, height: 46, borderRadius: radius.md, borderWidth: 1, borderColor: C.line, backgroundColor: C.card, alignItems: "center", justifyContent: "center" },
  notifyDot: { position: "absolute", top: 10, right: 10, width: 12, height: 12, borderRadius: 6, backgroundColor: C.cyan, alignItems: "center", justifyContent: "center", borderWidth: 1.5, borderColor: C.bg },
  notifyText: { color: C.bg, fontSize: 7.5, fontWeight: "900" },
  profilePill: { height: 46, borderRadius: 12, borderWidth: 1, borderColor: "rgba(148,163,184,0.12)", backgroundColor: C.card, paddingHorizontal: 12, flexDirection: "row", alignItems: "center", gap: 10 },
  profileTextWrap: { alignItems: 'flex-end' },
  avatar: { width: 30, height: 30, borderRadius: 15, backgroundColor: C.fill4, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: C.lineStrong },
  avatarText: { color: C.text, fontSize: 12, fontWeight: "900" },
  profileName: { color: C.text, fontSize: 11, fontWeight: "800" },
  profileRole: { color: C.dim, fontSize: 8.5, fontWeight: "700", textTransform: 'uppercase' },
}));
