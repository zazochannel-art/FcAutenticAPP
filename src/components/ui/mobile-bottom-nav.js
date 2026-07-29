import React, { useState } from "react";
import { Platform, Pressable, StyleSheet, Text, View, Modal, ScrollView } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import * as LucideIcons from "lucide-react-native";
import { colors as C, themedStyles, elevation, gradients } from "../../constants/theme";
import { useTranslation } from "../../i18n";

const tabIcons = {
  Dashboard: "LayoutGrid",
  Echipă: "Users",
  "Antren.": "Dumbbell",
  Meciuri: "Trophy",
  Calendar: "CalendarDays",
  Sarcini: "ListChecks",
  Staff: "UserCog",
  Finanțe: "Wallet",
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
  "Panou SaaS": "LayoutDashboard",
  Cluburi: "Building2",
  "Abonamente SaaS": "CreditCard",
  Utilizatori: "Users",
  "Mai mult": "Settings",
};

// Cât rămâne sub pastilă. Marginea de siguranță a telefonului se ia doar
// parțial: luată întreagă, pastila plutea la vreo 60pt de marginea de jos și
// golul de sub ea se citea ca un fundal în plus. O treime lasă indicatorul de
// gesturi liber, fără să împingă pastila departe de margine.
export function navBottomOffset(bottomInset = 0) {
  return 10 + Math.round(bottomInset * 0.35);
}

export function MobileBottomNav({ tabs, activeTab, onTabPress, bottomInset = 0 }) {
  const { t } = useTranslation();
  const [menuOpen, setMenuOpen] = useState(false);
  const mainTabs = tabs.slice(0, 4);
  const showMenu = tabs.length > 4;

  const pick = (label) => { setMenuOpen(false); onTabPress(label); };

  return (
    <View style={[styles.wrapper, { paddingBottom: navBottomOffset(bottomInset) }]} pointerEvents="box-none">
      {/* Nimic în spatele pastilei: aurora trebuie să ajungă până în ultimul
          rând de pixeli. O umplere cu `C.bg` sub ea se citea ca o bandă lipită
          de marginea de jos. Pastila are deja fundal propriu și neclaritate. */}
      <LinearGradient
        colors={[C.navBarFrom, C.navBarTo]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={styles.container}
      >
        {mainTabs.map((label) => (
          <BottomItem key={label} label={t(`nav.tab.${label}`)} icon={tabIcons[label]} active={activeTab === label} onPress={() => onTabPress(label)} />
        ))}
        {showMenu && (
          <BottomItem label={t('nav.menu')} icon="LayoutGrid" active={!mainTabs.includes(activeTab)} onPress={() => setMenuOpen(true)} />
        )}
      </LinearGradient>

      <Modal visible={menuOpen} transparent animationType="slide" onRequestClose={() => setMenuOpen(false)}>
        <Pressable style={styles.sheetOverlay} onPress={() => setMenuOpen(false)}>
          <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation?.()}>
            <View style={styles.sheetHandle} />
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>{t('nav.allPages')}</Text>
              <Pressable onPress={() => setMenuOpen(false)} style={styles.sheetClose} accessibilityRole="button" accessibilityLabel={t('common.close')}>
                <LucideIcons.X size={18} color={C.dim} />
              </Pressable>
            </View>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.grid}>
              {tabs.map((label) => {
                const Icon = LucideIcons[tabIcons[label]] || LucideIcons.Circle;
                const active = activeTab === label;
                return (
                  <Pressable key={label} style={[styles.tile, active && styles.tileActive]} onPress={() => pick(label)} accessibilityRole="button" accessibilityLabel={t(`nav.tab.${label}`)}>
                    <View style={[styles.tileIcon, active && styles.tileIconActive]}>
                      <Icon size={22} color={active ? C.cyan : C.muted} strokeWidth={active ? 2.6 : 2} />
                    </View>
                    <Text style={[styles.tileLabel, active && styles.tileLabelActive]} numberOfLines={1}>{t(`nav.tab.${label}`)}</Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

// .mtab — pastilă; eticheta apare doar pe tabul activ (în Kultura, `max-width`
// crește de la 0 la 90px). Iconița rămâne mereu vizibilă.
function BottomItem({ label, icon, active, onPress }) {
  const Icon = LucideIcons[icon] || LucideIcons.Circle;
  return (
    <Pressable
      onPress={onPress}
      style={[styles.tab, active && styles.tabActive]}
      accessibilityRole="tab"
      accessibilityState={{ selected: active }}
      accessibilityLabel={label}
    >
      {active && (
        <LinearGradient
          colors={gradients.button}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[StyleSheet.absoluteFill, { borderRadius: 999 }]}
        />
      )}
      <Icon size={21} color={active ? "#fff" : C.muted} strokeWidth={2} />
      {active && <Text style={styles.labelActive} numberOfLines={1}>{label}</Text>}
    </Pressable>
  );
}

const styles = themedStyles((C) => StyleSheet.create({
  // .mobile-tabs — pastilă flotantă, centrată, lipită de marginea de jos
  // (distanța vine din `navBottomOffset`, care ține cont de telefon)
  wrapper: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: "center",
    paddingHorizontal: 8,
    backgroundColor: "transparent",
  },
  container: {
    flexDirection: "row",
    width: "100%",
    maxWidth: 480,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: C.navBorder,
    padding: 5,
    gap: 2,
    alignItems: "center",
    justifyContent: "space-around",
    ...elevation.nav,
    ...(Platform.OS === "web" ? { backdropFilter: "blur(24px) saturate(180%)" } : null),
  },
  // .mtab / .mtab.active
  tab: { flexDirection: "row", alignItems: "center", justifyContent: "center", paddingVertical: 8, paddingHorizontal: 7, borderRadius: 999, overflow: "hidden" },
  tabActive: { paddingVertical: 9, paddingHorizontal: 13, gap: 6, ...elevation.navActive },
  labelActive: { color: "#fff", fontSize: 12, fontWeight: "600" },

  sheetOverlay: { flex: 1, backgroundColor: C.bgSecondary, justifyContent: "flex-end" },
  sheet: { backgroundColor: C.card, borderTopLeftRadius: 26, borderTopRightRadius: 26, borderWidth: 1, borderColor: C.line, paddingHorizontal: 16, paddingTop: 10, paddingBottom: Platform.OS === "ios" ? 40 : 24, maxHeight: "75%" },
  sheetHandle: { alignSelf: "center", width: 40, height: 4, borderRadius: 2, backgroundColor: C.lineStrong, marginBottom: 12 },
  sheetHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 },
  sheetTitle: { color: C.text, fontSize: 16, fontWeight: "900" },
  sheetClose: { width: 32, height: 32, alignItems: "center", justifyContent: "center" },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 10, paddingBottom: 6 },
  tile: { width: "22%", minWidth: 74, flexGrow: 1, alignItems: "center", paddingVertical: 14, borderRadius: 18, backgroundColor: C.fill1, borderWidth: 1, borderColor: C.line },
  tileActive: { borderColor: C.cyan + "45", backgroundColor: C.cyan + "12" },
  tileIcon: { width: 46, height: 46, borderRadius: 15, backgroundColor: C.fill3, alignItems: "center", justifyContent: "center", marginBottom: 8 },
  tileIconActive: { backgroundColor: C.fill5 },
  tileLabel: { color: C.muted, fontSize: 10, fontWeight: "800", textAlign: "center" },
  tileLabelActive: { color: C.cyan },
}));
