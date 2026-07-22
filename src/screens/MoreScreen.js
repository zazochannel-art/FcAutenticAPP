import React from "react";
import { Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import * as LucideIcons from "lucide-react-native";
import { colors as C, spacing, radius } from "../constants/theme";
import { TopBar, SectionTitle } from "../components/SharedComponents";
import { BeUIButton } from "../components/ui/be-ui-button";

const TAB_ICONS = {
  Dashboard: "LayoutGrid",
  "Echipă": "Users",
  "Antren.": "Dumbbell",
  Meciuri: "Trophy",
  Calendar: "CalendarDays",
  Sarcini: "ListChecks",
  Staff: "UserCog",
  "Finanțe": "Wallet",
  AI: "Sparkles",
  Abonamente: "CreditCard",
  Documente: "FolderOpen",
  Profil: "User",
  "Panou SaaS": "LayoutDashboard",
  Cluburi: "Building2",
  "Abonamente SaaS": "CreditCard",
  Utilizatori: "Users",
};

export default function MoreScreen({ currentUser, onLogout, selectedClub, openNotifications, switchClub, onCreateClub, clubs = [], tabs = [], setTab }) {
  const { width } = useWindowDimensions();
  const isMobile = width < 768;

  // Pe mobil, bara de jos are loc doar pentru primele 4 tab-uri; restul
  // paginilor sunt accesibile de aici.
  const hiddenTabs = isMobile ? tabs.slice(4).filter((t) => t !== "Mai mult") : [];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <TopBar title="Mai mult" eyebrow="OPȚIUNI ȘI CLUBURI" openNotifications={openNotifications} />

      {hiddenTabs.length > 0 && (
        <>
          <SectionTitle title="Toate paginile" />
          <View style={styles.pagesGrid}>
            {hiddenTabs.map((tabName) => {
              const Icon = LucideIcons[TAB_ICONS[tabName]] || LucideIcons.Circle;
              return (
                <Pressable key={tabName} style={styles.pageItem} onPress={() => setTab?.(tabName)}>
                  <View style={styles.pageIcon}><Icon size={20} color={C.cyan} /></View>
                  <Text style={styles.pageLabel} numberOfLines={1}>{tabName}</Text>
                  <LucideIcons.ChevronRight size={15} color={C.dim} />
                </Pressable>
              );
            })}
          </View>
        </>
      )}

      <SectionTitle title="Schimbă Clubul (SaaS)" action="Adaugă" onAction={onCreateClub} />
      <View style={styles.clubSelector}>
        {clubs.map((club) => (
          <Pressable
            key={club.id}
            style={[styles.clubItem, selectedClub?.id === club.id && styles.clubItemActive]}
            onPress={() => switchClub?.(club.id)}
          >
            <View style={styles.clubIcon}>
              <Text style={styles.clubInitial}>{club.name[0]}</Text>
            </View>
            <View style={{flex: 1, marginLeft: 12}}>
              <Text style={styles.clubName} numberOfLines={1}>{club.name}</Text>
              <Text style={styles.clubPlan}>{club.plan_name || club.plan || "Free"} Plan</Text>
            </View>
            {selectedClub?.id === club.id && <LucideIcons.CheckCircle2 size={18} color={C.cyan} />}
          </Pressable>
        ))}
      </View>

      <SectionTitle title="Contul meu" />
      <View style={styles.profileCard}>
        <LucideIcons.UserCircle2 size={isMobile ? 40 : 50} color={C.blue} />
        <View style={{marginLeft: 15, flex: 1}}>
          <Text style={{color: 'white', fontWeight: '900', fontSize: 15}} numberOfLines={1}>{currentUser?.name}</Text>
          <Text style={{color: C.muted, fontSize: 11}} numberOfLines={1}>{currentUser?.email}</Text>
        </View>
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
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#020617" },
  content: { padding: spacing.md, paddingBottom: 120 },
  clubSelector: { backgroundColor: "rgba(15,23,42,0.6)", borderRadius: 20, padding: 8, marginBottom: 20, borderWidth: 1, borderColor: "rgba(255,255,255,0.05)" },
  clubItem: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 16, marginBottom: 4 },
  clubItemActive: { backgroundColor: "rgba(0, 212, 255, 0.08)" },
  clubIcon: { width: 36, height: 36, borderRadius: 10, backgroundColor: "#030712", alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: C.line },
  clubInitial: { color: C.cyan, fontWeight: '900', fontSize: 16 },
  clubName: { color: 'white', fontWeight: '800', fontSize: 13 },
  clubPlan: { color: C.dim, fontSize: 10, fontWeight: '600', marginTop: 2 },
  profileCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: "rgba(15,23,42,0.6)", padding: 16, borderRadius: 20, marginBottom: 20, borderWidth: 1, borderColor: "rgba(255,255,255,0.05)" },
  pagesGrid: { backgroundColor: "rgba(15,23,42,0.6)", borderRadius: 20, padding: 8, marginBottom: 4, borderWidth: 1, borderColor: "rgba(255,255,255,0.05)" },
  pageItem: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 16 },
  pageIcon: { width: 36, height: 36, borderRadius: 10, backgroundColor: "#030712", alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: C.line },
  pageLabel: { flex: 1, color: 'white', fontWeight: '800', fontSize: 13, marginLeft: 12 },
});
