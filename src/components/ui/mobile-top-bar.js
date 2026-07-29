import React, { useState } from "react";
import { Image, Platform, View, Text, Pressable, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import * as LucideIcons from "lucide-react-native";
import { colors as C, radius, themedStyles } from "../../constants/theme";
import { BRAND_NAME } from "../../constants/brand";
import { useTranslation } from "../../i18n";
import { useProfile } from "../../context/ProfileContext";
import ProfileSheet from "../ProfileSheet";

// Antetul global de pe mobil. Pe desktop marca stă în sidebar; pe mobil o
// aveau doar ecranele de club, prin `TopBar`, iar cele de administrare deloc —
// de aceea logoul nu se vedea pe nicio pagină pentru super-admin.
//
// Numele e text, nu wordmark-ul din logo: bara stă pe `colors.bg`, iar pe tema
// luminoasă literele argintii ale wordmark-ului ar fi fost aproape invizibile.
export function MobileTopBar({ topInset = 0, onNotifications, notificationsCount = 0 }) {
  const { t } = useTranslation();
  const profile = useProfile();
  const [profileOpen, setProfileOpen] = useState(false);
  const initial = (profile?.user?.name || "U").slice(0, 1).toUpperCase();

  return (
    <View style={[styles.bar, { paddingTop: topInset + 10 }]}>
      {/* Bara nu are fundal propriu: aurora din spate trebuie să treacă
          neîntreruptă până în primul rând de pixeli. O umplere cu `C.bg`, chiar
          și estompată, se citește ca o bandă lipită de marginea de sus — exact
          ce încercam să eliminăm. Conținutul care derulează pe dedesubt e
          stins cu neclaritate, nu acoperit cu culoare. */}
      {/* Când pagina acoperă bara de stare, iOS scrie ceasul și bateria cu alb,
          indiferent de temă. Pe tema luminoasă ar fi alb pe aproape alb, deci
          punem o umbrire discretă exact pe înălțimea barei de stare. */}
      {!C.isDark && topInset > 0 ? (
        <LinearGradient
          colors={["rgba(15, 23, 42, 0.45)", "rgba(15, 23, 42, 0)"]}
          style={[styles.statusScrim, { height: topInset }]}
          pointerEvents="none"
        />
      ) : null}
      <View style={styles.brand}>
        <Image source={require("../../../assets/logo.png")} style={styles.logo} />
        <Text style={styles.name} numberOfLines={1}>{BRAND_NAME}</Text>
      </View>

      {onNotifications ? (
        <Pressable onPress={onNotifications} style={styles.action} accessibilityRole="button" accessibilityLabel={t('nav.notifications')}>
          <LucideIcons.Bell size={18} color={C.muted} />
          {notificationsCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{notificationsCount > 9 ? "9+" : notificationsCount}</Text>
            </View>
          )}
        </Pressable>
      ) : null}

      {profile?.user ? (
        <>
          <Pressable onPress={() => setProfileOpen(true)} style={[styles.action, styles.avatar]} accessibilityRole="button" accessibilityLabel={t('nav.profile')}>
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
    ...(Platform.OS === "web" ? { backdropFilter: "blur(18px) saturate(160%)" } : null),
  },
  statusScrim: { position: "absolute", top: 0, left: 0, right: 0 },
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
  badge: {
    position: "absolute", top: -4, right: -4, minWidth: 16, height: 16,
    borderRadius: 8, paddingHorizontal: 4, backgroundColor: C.accent,
    alignItems: "center", justifyContent: "center", borderWidth: 1.5, borderColor: C.bg,
  },
  badgeText: { color: C.bg, fontSize: 8.5, fontWeight: "900" },
  avatarText: { color: C.accent, fontSize: 14, fontWeight: "900" },
}));
