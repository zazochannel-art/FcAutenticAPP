import React, { useState } from "react";
import { Image, View, Text, Pressable, StyleSheet } from "react-native";
import * as LucideIcons from "lucide-react-native";
import { colors as C, radius, themedStyles } from "../../constants/theme";
import { BRAND_NAME } from "../../constants/brand";
import { useProfile } from "../../context/ProfileContext";
import ProfileSheet from "../ProfileSheet";

// Antetul global de pe mobil. Pe desktop marca stă în sidebar; pe mobil o
// aveau doar ecranele de club, prin `TopBar`, iar cele de administrare deloc —
// de aceea logoul nu se vedea pe nicio pagină pentru super-admin.
//
// Numele e text, nu wordmark-ul din logo: bara stă pe `colors.bg`, iar pe tema
// luminoasă literele argintii ale wordmark-ului ar fi fost aproape invizibile.
export function MobileTopBar({ topInset = 0, onNotifications }) {
  const profile = useProfile();
  const [profileOpen, setProfileOpen] = useState(false);
  const initial = (profile?.user?.name || "U").slice(0, 1).toUpperCase();

  return (
    <View style={[styles.bar, { paddingTop: topInset + 10 }]}>
      <View style={styles.brand}>
        <Image source={require("../../../assets/icon-square.png")} style={styles.logo} />
        <Text style={styles.name} numberOfLines={1}>{BRAND_NAME}</Text>
      </View>

      {onNotifications ? (
        <Pressable onPress={onNotifications} style={styles.action} accessibilityRole="button" accessibilityLabel="Notificări">
          <LucideIcons.Bell size={18} color={C.muted} />
        </Pressable>
      ) : null}

      {profile?.user ? (
        <>
          <Pressable onPress={() => setProfileOpen(true)} style={[styles.action, styles.avatar]} accessibilityRole="button" accessibilityLabel="Profil">
            <Text style={styles.avatarText}>{initial}</Text>
          </Pressable>
          <ProfileSheet
            visible={profileOpen}
            user={profile.user}
            selectedClub={profile.selectedClub}
            onClose={() => setProfileOpen(false)}
            onLogout={profile.onLogout}
            onNavigate={profile.onNavigate}
          />
        </>
      ) : null}
    </View>
  );
}

const styles = themedStyles((C) => StyleSheet.create({
  bar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingBottom: 10,
    gap: 8,
  },
  brand: { flexDirection: "row", alignItems: "center", gap: 10, flex: 1 },
  logo: { width: 34, height: 34, borderRadius: 10, resizeMode: "cover" },
  name: { color: C.text, fontSize: 16, fontWeight: "900", letterSpacing: -0.3, flexShrink: 1 },
  action: {
    width: 38,
    height: 38,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: C.line,
    backgroundColor: C.card,
    alignItems: "center",
    justifyContent: "center",
  },
  avatar: { borderColor: C.accent + "40", backgroundColor: C.accent + "14" },
  avatarText: { color: C.accent, fontSize: 14, fontWeight: "900" },
}));
