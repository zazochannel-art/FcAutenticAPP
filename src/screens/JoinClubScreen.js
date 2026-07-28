import React, { useState } from "react";
import { ActivityIndicator, ImageBackground, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import { AlertTriangle, ArrowLeft, ArrowRight, CheckCircle2, Mail, Shield, Users } from "lucide-react-native";
import { colors as C, themedStyles } from "../constants/theme";
import { supabaseService } from "../services/supabaseService";
import { LanguagePicker } from "../components/ui/language-picker";
import { BRAND_NAME } from "../constants/brand";

const stadium = { uri: "https://images.unsplash.com/photo-1574629810360-7efbbe195018?q=80&w=2000" };

const ROLE_MAP = { "Jucător": "player", "Părinte": "parent", "Antrenor": "coach", "Staff": "staff" };

export default function JoinClubScreen({ onBack, onSuccess }) {
  const [inviteCode, setInviteCode] = useState("");
  const [clubName, setClubName] = useState("");
  const [role, setRole] = useState("Jucător");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [pendingInfo, setPendingInfo] = useState("");

  const submit = async () => {
    setError("");
    setPendingInfo("");
    const code = inviteCode.trim();
    const name = clubName.trim();

    if (!code && !name) {
      setError("Introdu codul de invitație sau numele clubului.");
      return;
    }

    setLoading(true);
    try {
      if (code) {
        // Codul de invitație activează membership-ul imediat, cu rolul din invitație.
        await supabaseService.acceptInvitation(code);
        onSuccess?.();
        return;
      }
      const result = await supabaseService.requestMembership(name, ROLE_MAP[role] || "player");
      setPendingInfo(
        `Cererea către ${result?.club_name || name} a fost trimisă și așteaptă aprobarea administratorului.`
      );
    } catch (e) {
      setError(e.message || "Nu am putut trimite cererea. Încearcă din nou.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <ImageBackground source={stadium} style={styles.bg} imageStyle={{ opacity: 0.18 }}>
        <LinearGradient colors={["#020617", "rgba(2,6,23,0.82)", "#020617"]} style={StyleSheet.absoluteFill} />
        <SafeAreaView style={{ flex: 1 }}>
          <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
            <View style={styles.header}>
              <Pressable onPress={onBack} style={styles.backButton}>
                <ArrowLeft size={18} color={C.muted} />
              </Pressable>
              <View style={styles.brand}>
                <Shield size={26} color={C.cyan} />
                <Text style={styles.brandText}>{BRAND_NAME}</Text>
              </View>
              <LanguagePicker />
            </View>

            <BlurView intensity={24} tint="dark" style={styles.card}>
              <View style={styles.iconHero}><Users size={42} color={C.purple} /></View>
              <Text style={styles.title}>Alătură-te unui club</Text>
              <Text style={styles.subtitle}>Introdu codul de invitație sau trimite o cerere către administratorul clubului.</Text>

              <Field label="Cod invitație" placeholder="Ex: FC-AUTENTIC-2026" value={inviteCode} onChangeText={setInviteCode} />

              <View style={styles.separator}>
                <View style={styles.line} /><Text style={styles.sepText}>SAU</Text><View style={styles.line} />
              </View>

              <Field label="Nume club" placeholder="Ex: FC Autentic" value={clubName} onChangeText={setClubName} />

              <Text style={styles.label}>Rol dorit</Text>
              <View style={styles.roleRow}>
                {["Jucător", "Părinte", "Antrenor", "Staff"].map((item) => (
                  <Pressable key={item} onPress={() => setRole(item)} style={[styles.rolePill, role === item && styles.roleActive]}>
                    <Text style={[styles.roleText, role === item && styles.roleTextActive]}>{item}</Text>
                  </Pressable>
                ))}
              </View>

              <Text style={styles.label}>Mesaj opțional</Text>
              <TextInput
                value={message}
                onChangeText={setMessage}
                placeholder="Scrie un mesaj scurt pentru club..."
                placeholderTextColor={C.dim}
                multiline
                style={styles.textarea}
              />

              {!!pendingInfo && (
                <View style={styles.statusBox}>
                  <CheckCircle2 size={18} color={C.green} />
                  <Text style={styles.statusText}>{pendingInfo}</Text>
                </View>
              )}

              {!!error && (
                <View style={styles.errorBox}>
                  <AlertTriangle size={18} color={C.red} />
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              )}

              <Pressable onPress={submit} disabled={loading} style={[styles.primaryPress, loading && { opacity: 0.7 }]}>
                <LinearGradient colors={[C.cyan, C.purple]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.primaryButton}>
                  {loading ? (
                    <ActivityIndicator color="white" size="small" />
                  ) : (
                    <>
                      <Mail size={18} color="white" />
                      <Text style={styles.primaryText}>Trimite cererea</Text>
                      <ArrowRight size={18} color="white" />
                    </>
                  )}
                </LinearGradient>
              </Pressable>
            </BlurView>
          </ScrollView>
        </SafeAreaView>
      </ImageBackground>
    </View>
  );
}

function Field(props) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{props.label}</Text>
      <TextInput {...props} placeholderTextColor={C.dim} style={styles.input} />
    </View>
  );
}

const styles = themedStyles((C) => StyleSheet.create({
  container: { flex: 1, backgroundColor: "#020617" },
  bg: { flex: 1 },
  content: { flexGrow: 1, padding: 22, alignItems: "center", justifyContent: "center" },
  header: { position: "absolute", top: 18, left: 22, right: 22, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  backButton: { width: 44, height: 44, borderRadius: 14, borderWidth: 1, borderColor: "rgba(148,163,184,0.16)", alignItems: "center", justifyContent: "center", backgroundColor: "rgba(15,23,42,0.65)" },
  brand: { flexDirection: "row", alignItems: "center", gap: 10 },
  brandText: { color: C.text, fontSize: 18, fontWeight: "900" },
  card: { width: "100%", maxWidth: 620, borderRadius: 30, overflow: "hidden", padding: 30, borderWidth: 1, borderColor: "rgba(124,58,237,0.45)", backgroundColor: "rgba(15,23,42,0.58)" },
  iconHero: { alignSelf: "center", width: 84, height: 84, borderRadius: 42, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(124,58,237,0.16)", borderWidth: 1, borderColor: "rgba(124,58,237,0.42)", marginBottom: 18 },
  title: { color: C.text, fontSize: 30, fontWeight: "900", textAlign: "center" },
  subtitle: { color: C.muted, fontSize: 14, lineHeight: 22, textAlign: "center", marginTop: 8, marginBottom: 24 },
  field: { marginBottom: 14 },
  label: { color: C.muted, fontSize: 11, fontWeight: "900", letterSpacing: 0.9, textTransform: "uppercase", marginBottom: 8 },
  input: { height: 54, borderRadius: 16, borderWidth: 1, borderColor: "rgba(148,163,184,0.16)", backgroundColor: "rgba(2,6,23,0.62)", color: C.text, paddingHorizontal: 16, fontSize: 14, fontWeight: "700" },
  textarea: { minHeight: 90, borderRadius: 16, borderWidth: 1, borderColor: "rgba(148,163,184,0.16)", backgroundColor: "rgba(2,6,23,0.62)", color: C.text, padding: 16, fontSize: 14, fontWeight: "700", textAlignVertical: "top" },
  separator: { flexDirection: "row", alignItems: "center", gap: 16, marginVertical: 14 },
  line: { flex: 1, height: 1, backgroundColor: "rgba(148,163,184,0.14)" },
  sepText: { color: C.dim, fontWeight: "900", fontSize: 11 },
  roleRow: { flexDirection: "row", flexWrap: "wrap", gap: 9, marginBottom: 14 },
  rolePill: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 999, borderWidth: 1, borderColor: "rgba(148,163,184,0.16)", backgroundColor: "rgba(2,6,23,0.45)" },
  roleActive: { borderColor: C.purple, backgroundColor: "rgba(124,58,237,0.18)" },
  roleText: { color: C.muted, fontSize: 12, fontWeight: "900" },
  roleTextActive: { color: C.text },
  statusBox: { flexDirection: "row", alignItems: "center", gap: 10, borderRadius: 16, borderWidth: 1, borderColor: "rgba(34,197,94,0.28)", backgroundColor: "rgba(34,197,94,0.1)", padding: 14, marginTop: 16 },
  statusText: { flex: 1, color: C.green, fontSize: 12, fontWeight: "800" },
  errorBox: { flexDirection: "row", alignItems: "center", gap: 10, borderRadius: 16, borderWidth: 1, borderColor: "rgba(239,68,68,0.3)", backgroundColor: "rgba(239,68,68,0.08)", padding: 14, marginTop: 16 },
  errorText: { flex: 1, color: C.red, fontSize: 12, fontWeight: "800" },
  primaryPress: { marginTop: 18 },
  primaryButton: { height: 58, borderRadius: 18, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10 },
  primaryText: { color: C.text, fontSize: 15, fontWeight: "900" },
}));
