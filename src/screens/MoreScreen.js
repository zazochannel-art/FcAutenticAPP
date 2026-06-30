import React from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import * as LucideIcons from "lucide-react-native";
import { colors as C } from "../constants/theme";
import { TopBar, SectionTitle } from "../components/SharedComponents";
import { BeUIButton } from "../components/ui/be-ui-button";

export default function MoreScreen({ currentUser, onLogout, selectedClub, openNotifications, switchClub, onCreateClub, clubs = [] }) {
  return (
    <ScrollView contentContainerStyle={styles.content}>
      <TopBar title="Mai mult" eyebrow="OPȚIUNI ȘI CLUBURI" openNotifications={openNotifications} />

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
              <Text style={styles.clubName}>{club.name}</Text>
              <Text style={styles.clubPlan}>{club.plan || "Free"} Plan</Text>
            </View>
            {selectedClub?.id === club.id && <LucideIcons.CheckCircle2 size={20} color={C.green} />}
          </Pressable>
        ))}
      </View>

      <SectionTitle title="Contul meu" />
      <View style={styles.profileCard}>
        <LucideIcons.UserCircle2 size={50} color={C.blue} />
        <View style={{marginLeft: 15}}>
          <Text style={{color: 'white', fontWeight: '900'}}>{currentUser?.name}</Text>
          <Text style={{color: C.muted, fontSize: 11}}>{currentUser?.email}</Text>
        </View>
      </View>

      <BeUIButton
        label="Deconectare"
        variant="danger"
        size="lg"
        icon="LogOut"
        onPress={onLogout}
        fullWidth
        style={{ marginTop: 20, backgroundColor: `${C.red}25` }}
        textStyle={{ color: C.red }}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 18 },
  clubSelector: { backgroundColor: C.card, borderRadius: 20, padding: 10, marginBottom: 20 },
  clubItem: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 15, marginBottom: 5 },
  clubItemActive: { backgroundColor: C.panel },
  clubIcon: { width: 40, height: 40, borderRadius: 12, backgroundColor: C.bg, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: C.line },
  clubInitial: { color: C.red, fontWeight: '900', fontSize: 18 },
  clubName: { color: 'white', fontWeight: '800' },
  clubPlan: { color: C.muted, fontSize: 10 },
  profileCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.card, padding: 15, borderRadius: 20, marginBottom: 20 },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, padding: 16, borderRadius: 16, backgroundColor: `${C.red}15`, marginTop: 20 },
  logoutText: { color: C.red, fontWeight: '900' }
});
