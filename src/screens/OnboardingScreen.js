import React, { useState } from "react";
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from "react-native";
import * as LucideIcons from "lucide-react-native";
import { colors as C } from "../constants/theme";
import { TopBar, SectionTitle, TrainingField } from "../components/SharedComponents";
import { BeUIButton } from "../components/ui/be-ui-button";

const roleLabels = {
  super_admin: "Super Admin",
  club_owner: "Owner club",
  viewer: "Viewer",
  admin: "Admin",
  coach: "Antrenor",
  player: "Jucător",
  parent: "Părinte",
  guest: "Vizitator",
};

export default function OnboardingScreen({ currentUser, invitations, onCreateClub, onAcceptInvitation, onLogout, error, openNotifications }) {
  const [token, setToken] = useState("");
  const pendingForUser = (invitations || []).filter((item) =>
    item.status === "pending" && item.email?.toLowerCase() === currentUser?.email?.toLowerCase()
  );
  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <TopBar title="Alege clubul" eyebrow="SAAS MULTI-CLUB" openNotifications={openNotifications} />
        <View style={styles.controlCard}>
          <View style={styles.controlTop}>
            <View>
              <Text style={styles.controlKicker}>BUN VENIT</Text>
              <Text style={styles.controlTitle}>{currentUser?.name || currentUser?.email || "Utilizator"}</Text>
            </View>
            <View style={styles.livePill}><View style={styles.liveDot} /><Text style={styles.liveText}>CONT NOU</Text></View>
          </View>
          <Text style={styles.personalText}>
            Ca sa intri in platforma, creezi un club nou sau accepti o invitatie primita de la un club existent.
          </Text>
        </View>

        <BeUIButton
          label="Creează club nou"
          variant="danger"
          size="lg"
          icon="PlusCircle"
          onPress={onCreateClub}
          style={{ marginTop: 24 }}
        />

        <View style={styles.formCard}>
          <Text style={styles.paymentSectionLabel}>ACCEPTA INVITATIE</Text>
          <TrainingField label="Token invitatie sau email" value={token} onChange={setToken} placeholder="ex: invite-abc123" />
          {!!error && <Text style={styles.authError}>{error}</Text>}
          <BeUIButton
            label="Acceptă invitația"
            variant="outline"
            size="md"
            icon="MailOpen"
            onPress={() => onAcceptInvitation(token)}
            style={{ marginTop: 10 }}
          />
        </View>

        {pendingForUser.length ? (
          <>
            <SectionTitle title="Invitatii gasite pentru emailul tau" />
            {pendingForUser.map((invite) => (
              <Pressable style={styles.historyRow} key={invite.id} onPress={() => onAcceptInvitation(invite.token)}>
                <View>
                  <Text style={styles.historyTitle}>{roleLabels[invite.role] || invite.role}</Text>
                  <Text style={styles.historyMeta}>Token: {invite.token}</Text>
                </View>
                <Text style={[styles.historyStatus, { color: C.amber }]}>Accepta</Text>
              </Pressable>
            ))}
          </>
        ) : null}

        <BeUIButton
          label="Ieșire din cont"
          variant="danger"
          size="md"
          icon="LogOut"
          onPress={onLogout}
          style={{ marginTop: 16 }}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },
  content: { padding: 18, paddingBottom: 32 },
  controlCard: { backgroundColor: C.card, borderRadius: 23, padding: 17, borderWidth: 1, borderColor: C.line },
  controlTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingBottom: 17, borderBottomWidth: 1, borderBottomColor: C.line },
  controlKicker: { color: C.muted, fontSize: 9, fontWeight: "800", letterSpacing: 1.3 },
  controlTitle: { color: C.text, fontSize: 18, fontWeight: "800", marginTop: 4 },
  livePill: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: `${C.green}18`, paddingVertical: 7, paddingHorizontal: 10, borderRadius: 20 },
  liveDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: C.green },
  liveText: { color: C.green, fontSize: 9, fontWeight: "900" },
  personalText: { color: C.muted, fontSize: 10, lineHeight: 15, marginTop: 5 },
  primaryButton: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, backgroundColor: C.red, borderRadius: 14, padding: 14, marginTop: 24 },
  primaryButtonText: { color: C.text, fontWeight: "900", fontSize: 12 },
  formCard: { backgroundColor: C.card, borderRadius: 20, padding: 15, marginTop: 12 },
  paymentSectionLabel: { color: C.muted, fontSize: 9, fontWeight: "900", letterSpacing: 1.2, marginBottom: 9 },
  authError: { color: C.amber, fontSize: 11, lineHeight: 16, marginBottom: 10 },
  secondaryButton: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, borderWidth: 1, borderColor: C.line, backgroundColor: C.card, borderRadius: 14, padding: 13, marginTop: 10 },
  secondaryButtonText: { color: C.blue, fontWeight: "900", fontSize: 12 },
  historyRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", backgroundColor: C.card, borderRadius: 14, padding: 13, marginBottom: 8 },
  historyTitle: { color: C.text, fontSize: 11, fontWeight: "800" },
  historyMeta: { color: C.muted, fontSize: 8, marginTop: 4 },
  historyStatus: { fontSize: 9, fontWeight: "900" },
  logoutButton: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, backgroundColor: C.red, borderRadius: 14, padding: 13, marginTop: 16 },
  logoutText: { color: C.text, fontSize: 12, fontWeight: "900" },
});
