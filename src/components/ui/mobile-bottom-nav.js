import React from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
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
  "Mai mult": "MoreHorizontal",
};

export function MobileBottomNav({ tabs, activeTab, onTabPress }) {
  const mainTabs = tabs.slice(0, 4);
  const showMore = tabs.length > 4;

  return (
    <View style={styles.wrapper}>
      <BlurView intensity={30} tint="dark" style={styles.container}>
        {mainTabs.map((label) => (
          <BottomItem key={label} label={label} active={activeTab === label} onPress={() => onTabPress(label)} />
        ))}
        {showMore && (
          <BottomItem label="Mai mult" active={activeTab === "Mai mult" || !mainTabs.includes(activeTab)} onPress={() => onTabPress("Mai mult")} />
        )}
      </BlurView>
    </View>
  );
}

function BottomItem({ label, active, onPress }) {
  const Icon = LucideIcons[tabIcons[label]] || LucideIcons.Circle;
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
});
