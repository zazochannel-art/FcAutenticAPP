import React, { useState } from "react";
import { Platform, Pressable, StyleSheet, Text, View, Modal, ScrollView } from "react-native";
import { BlurView } from "expo-blur";
import * as LucideIcons from "lucide-react-native";
import { colors as C } from "../../constants/theme";

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
  Galerie: "Images",
  Profil: "User",
  "Panou SaaS": "LayoutDashboard",
  Cluburi: "Building2",
  "Abonamente SaaS": "CreditCard",
  Utilizatori: "Users",
  "Mai mult": "Settings",
};

// „Mai mult” e ecranul de setări; îl afișăm cu numele „Setări” în meniu.
const displayLabel = (label) => (label === "Mai mult" ? "Setări" : label);

export function MobileBottomNav({ tabs, activeTab, onTabPress }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const mainTabs = tabs.slice(0, 4);
  const showMenu = tabs.length > 4;

  const pick = (label) => { setMenuOpen(false); onTabPress(label); };

  return (
    <View style={styles.wrapper}>
      <BlurView intensity={30} tint="dark" style={styles.container}>
        {mainTabs.map((label) => (
          <BottomItem key={label} label={displayLabel(label)} icon={tabIcons[label]} active={activeTab === label} onPress={() => onTabPress(label)} />
        ))}
        {showMenu && (
          <BottomItem label="Meniu" icon="LayoutGrid" active={!mainTabs.includes(activeTab)} onPress={() => setMenuOpen(true)} />
        )}
      </BlurView>

      <Modal visible={menuOpen} transparent animationType="slide" onRequestClose={() => setMenuOpen(false)}>
        <Pressable style={styles.sheetOverlay} onPress={() => setMenuOpen(false)}>
          <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation?.()}>
            <View style={styles.sheetHandle} />
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>Toate paginile</Text>
              <Pressable onPress={() => setMenuOpen(false)} style={styles.sheetClose}>
                <LucideIcons.X size={18} color={C.dim} />
              </Pressable>
            </View>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.grid}>
              {tabs.map((label) => {
                const Icon = LucideIcons[tabIcons[label]] || LucideIcons.Circle;
                const active = activeTab === label;
                return (
                  <Pressable key={label} style={[styles.tile, active && styles.tileActive]} onPress={() => pick(label)}>
                    <View style={[styles.tileIcon, active && styles.tileIconActive]}>
                      <Icon size={22} color={active ? C.cyan : C.muted} strokeWidth={active ? 2.6 : 2} />
                    </View>
                    <Text style={[styles.tileLabel, active && styles.tileLabelActive]} numberOfLines={1}>{displayLabel(label)}</Text>
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

function BottomItem({ label, icon, active, onPress }) {
  const Icon = LucideIcons[icon] || LucideIcons.Circle;
  return (
    <Pressable onPress={onPress} style={styles.tab}>
      <View style={[styles.iconWrap, active && styles.iconActive]}>
        <Icon size={20} color={active ? C.cyan : C.muted} strokeWidth={active ? 2.7 : 2} />
      </View>
      <Text style={[styles.label, active && styles.labelActive]} numberOfLines={1}>{label}</Text>
      {active && <View style={styles.glow} />}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingBottom: Platform.OS === "ios" ? 34 : 10,
    backgroundColor: "transparent",
  },
  container: {
    flexDirection: "row",
    height: 68,
    marginHorizontal: 14,
    marginBottom: 8,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "rgba(0,212,255,0.18)",
    backgroundColor: "rgba(7,17,31,0.88)",
    paddingHorizontal: 8,
    alignItems: "center",
    justifyContent: "space-around",
    overflow: "hidden",
  },
  tab: { flex: 1, height: "100%", alignItems: "center", justifyContent: "center" },
  iconWrap: { width: 32, height: 30, alignItems: "center", justifyContent: "center", borderRadius: 12 },
  iconActive: { backgroundColor: "rgba(0,212,255,0.1)" },
  label: { color: C.muted, fontSize: 9, fontWeight: "800", marginTop: 2 },
  labelActive: { color: C.cyan },
  glow: { position: "absolute", bottom: 5, width: 22, height: 2, borderRadius: 2, backgroundColor: C.cyan },

  sheetOverlay: { flex: 1, backgroundColor: "rgba(2,6,23,0.6)", justifyContent: "flex-end" },
  sheet: { backgroundColor: "#071127", borderTopLeftRadius: 24, borderTopRightRadius: 24, borderWidth: 1, borderColor: "rgba(0,212,255,0.14)", paddingHorizontal: 16, paddingTop: 10, paddingBottom: Platform.OS === "ios" ? 40 : 24, maxHeight: "75%" },
  sheetHandle: { alignSelf: "center", width: 40, height: 4, borderRadius: 2, backgroundColor: "rgba(255,255,255,0.15)", marginBottom: 12 },
  sheetHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 },
  sheetTitle: { color: "white", fontSize: 16, fontWeight: "900" },
  sheetClose: { width: 32, height: 32, alignItems: "center", justifyContent: "center" },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 10, paddingBottom: 6 },
  tile: { width: "22%", minWidth: 74, flexGrow: 1, alignItems: "center", paddingVertical: 14, borderRadius: 16, backgroundColor: "rgba(255,255,255,0.02)", borderWidth: 1, borderColor: "rgba(255,255,255,0.05)" },
  tileActive: { borderColor: C.cyan + "50", backgroundColor: C.cyan + "10" },
  tileIcon: { width: 46, height: 46, borderRadius: 14, backgroundColor: "rgba(2,6,23,0.5)", alignItems: "center", justifyContent: "center", marginBottom: 8 },
  tileIconActive: { backgroundColor: "rgba(0,212,255,0.12)" },
  tileLabel: { color: C.muted, fontSize: 10, fontWeight: "800", textAlign: "center" },
  tileLabelActive: { color: C.cyan },
});
