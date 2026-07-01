import React, { useEffect, useRef } from "react";
import { Animated, Pressable, SafeAreaView, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import * as LucideIcons from "lucide-react-native";
import { colors as C, radius, spacing } from "../constants/theme";
import { Badge } from "../components/SharedComponents";
import { isSupabaseConfigured } from "../config/supabaseClient";
import { BeUIButton } from "../components/ui/be-ui-button";

export default function WelcomeScreen({ onLogin, onGuest }) {
  const { width } = useWindowDimensions();
  const isMobile = width < 768;
  const fade = useRef(new Animated.Value(0)).current;
  const lift = useRef(new Animated.Value(18)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fade, { toValue: 1, duration: 650, useNativeDriver: true }),
      Animated.timing(lift, { toValue: 0, duration: 650, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.welcomeScreen}>
        <View style={styles.ballGlow} />
        <Animated.View style={[styles.welcomeCard, !isMobile && { maxWidth: 500 }, { opacity: fade, transform: [{ translateY: lift }] }]}>
          <View style={styles.welcomeLogo}><Badge size={isMobile ? 100 : 142} /></View>
          <Text style={[styles.welcomeClub, isMobile && { fontSize: 28 }]}>FC Autentic</Text>
          <Text style={[styles.welcomeTitle, isMobile && { fontSize: 14 }]}>Clubul tău, organizat profesionist.</Text>
          <Text style={[styles.welcomeText, isMobile && { fontSize: 11 }]}>Gestionare pentru jucători, antrenori, părinți și finanțe — într-o platformă modernă.</Text>

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
          <Text style={styles.supabaseHint}>{isSupabaseConfigured ? "Supabase Auth activ" : "Mod local activ"}</Text>
        </Animated.View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#020617" },
  welcomeScreen: { flex: 1, padding: 20, justifyContent: "center", alignItems: "center" },
  ballGlow: { position: "absolute", width: 200, height: 200, borderRadius: 100, backgroundColor: C.cyan + '15', top: -50, right: -50 },
  welcomeCard: { width: "100%", backgroundColor: "rgba(14,41,64,0.8)", borderRadius: 30, padding: 24, alignItems: "center", borderWidth: 1, borderColor: "rgba(255,255,255,0.08)" },
  welcomeLogo: { width: 120, height: 120, borderRadius: 24, backgroundColor: "#030712", alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "rgba(255,255,255,0.1)" },
  welcomeClub: { color: "white", fontSize: 34, fontWeight: "900", marginTop: 18 },
  welcomeTitle: { color: C.cyan, fontSize: 16, fontWeight: "900", textAlign: "center", marginTop: 7 },
  welcomeText: { color: C.muted, fontSize: 12, lineHeight: 18, textAlign: "center", marginTop: 10, marginBottom: 20 },
  supabaseHint: { color: C.dim, fontSize: 9, marginTop: 14, textTransform: "uppercase", letterSpacing: 1 },
});
