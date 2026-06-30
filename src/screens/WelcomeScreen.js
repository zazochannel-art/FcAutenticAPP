import React, { useEffect, useRef } from "react";
import { Animated, Pressable, SafeAreaView, StyleSheet, Text, View } from "react-native";
import * as LucideIcons from "lucide-react-native";
import { colors as C } from "../constants/theme";
import { Badge } from "../components/SharedComponents";
import { isSupabaseConfigured } from "../config/supabaseClient";

import { BeUIButton } from "../components/ui/be-ui-button";

export default function WelcomeScreen({ onLogin, onGuest }) {
  const fade = useRef(new Animated.Value(0)).current;
  const lift = useRef(new Animated.Value(18)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fade, { toValue: 1, duration: 650, useNativeDriver: true }),
      Animated.timing(lift, { toValue: 0, duration: 650, useNativeDriver: true }),
    ]).start();
  }, [fade, lift]);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.welcomeScreen}>
        <View style={styles.ballGlow} />
        <View style={styles.pitchLineOne} />
        <View style={styles.pitchLineTwo} />
        <Animated.View style={[styles.welcomeCard, { opacity: fade, transform: [{ translateY: lift }] }]}>
          <View style={styles.welcomeLogo}><Badge size={142} /></View>
          <Text style={styles.welcomeClub}>FC Autentic</Text>
          <Text style={styles.welcomeTitle}>Clubul tău, organizat profesionist.</Text>
          <Text style={styles.welcomeText}>Gestionare pentru jucători, antrenori, părinți, finanțe și prezență — într-o aplicație mobilă modernă.</Text>
          <BeUIButton
            label="Autentificare"
            variant="danger"
            size="lg"
            icon="ArrowRight"
            iconPosition="right"
            onPress={onLogin}
            fullWidth
            style={{ marginTop: 20 }}
          />
          <BeUIButton
            label="Continuă ca Vizitator"
            variant="outline"
            size="md"
            onPress={onGuest}
            fullWidth
            style={{ marginTop: 12 }}
          />
          <Text style={styles.supabaseHint}>{isSupabaseConfigured ? "Supabase Auth activ" : "Mod local activ până conectezi Supabase"}</Text>
        </Animated.View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },
  welcomeScreen: { flex: 1, backgroundColor: C.bg, padding: 24, justifyContent: "center", overflow: "hidden" },
  ballGlow: { position: "absolute", width: 290, height: 290, borderRadius: 145, backgroundColor: `${C.blue}24`, top: -70, right: -80 },
  pitchLineOne: { position: "absolute", width: 460, height: 460, borderRadius: 230, borderWidth: 1, borderColor: `${C.text}12`, left: -220, bottom: -90 },
  pitchLineTwo: { position: "absolute", width: 180, height: 180, borderRadius: 90, borderWidth: 1, borderColor: `${C.red}35`, right: -40, bottom: 80 },
  welcomeCard: { backgroundColor: "rgba(14,41,64,0.92)", borderRadius: 30, padding: 24, alignItems: "center", borderWidth: 1, borderColor: C.line },
  welcomeLogo: { width: 164, height: 164, borderRadius: 52, backgroundColor: C.bg, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: C.line },
  welcomeClub: { color: C.text, fontSize: 34, fontWeight: "900", marginTop: 18 },
  welcomeTitle: { color: C.blue, fontSize: 16, fontWeight: "900", textAlign: "center", marginTop: 7 },
  welcomeText: { color: C.muted, fontSize: 12, lineHeight: 19, textAlign: "center", marginTop: 10, marginBottom: 20 },
  welcomePrimary: { width: "100%", flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 9, backgroundColor: C.red, borderRadius: 16, paddingVertical: 15 },
  welcomePrimaryText: { color: C.text, fontSize: 13, fontWeight: "900" },
  welcomeSecondary: { width: "100%", alignItems: "center", borderWidth: 1, borderColor: C.blue, borderRadius: 16, paddingVertical: 14, marginTop: 10 },
  welcomeSecondaryText: { color: C.blue, fontSize: 12, fontWeight: "900" },
  supabaseHint: { color: C.muted, fontSize: 9, marginTop: 14 },
});
