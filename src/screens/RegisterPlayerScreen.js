import React, { useState } from "react";
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import * as LucideIcons from "lucide-react-native";
import { colors as C } from "../constants/theme";
import { Badge, TrainingField } from "../components/SharedComponents";
import { BeUIButton } from "../components/ui/be-ui-button";

const clubGroups = ["U13", "U16", "U19", "Juniori", "Seniori"];

export default function RegisterPlayerScreen({ onBack, onRegister, loading, error }) {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    group: "U19",
    no: "",
    role: "Mijlocaș",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [localError, setLocalError] = useState("");

  const submit = () => {
    const email = form.email.trim().toLowerCase();
    if (form.name.trim().length < 3) {
      setLocalError("Introdu numele complet al jucătorului.");
      return;
    }
    if (!email.includes("@")) {
      setLocalError("Introdu un email valid.");
      return;
    }
    if (form.password.length < 6) {
      setLocalError("Parola trebuie să aibă minimum 6 caractere.");
      return;
    }
    if (form.password !== form.confirmPassword) {
      setLocalError("Parolele nu coincid.");
      return;
    }
    setLocalError("");
    onRegister({
      ...form,
      email,
      name: form.name.trim(),
      role: form.role.trim() || "Jucător",
      no: form.no.replace(/[^0-9]/g, ""),
    });
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.loginContent} showsVerticalScrollIndicator={false}>
        <BeUIButton
          label="Înapoi la login"
          variant="ghost"
          size="sm"
          icon="ChevronLeft"
          onPress={onBack}
          style={{ alignSelf: "flex-start", marginBottom: 14 }}
        />
        <View style={styles.loginHero}>
          <Badge size={82} />
          <Text style={styles.loginTitle}>Cont jucător</Text>
          <Text style={styles.loginSubtitle}>Creează profilul personal în FC Autentic.</Text>
        </View>
        <View style={styles.formCard}>
          <TrainingField label="Nume complet" value={form.name} onChange={(name) => setForm({ ...form, name })} placeholder="Ex: Victor Rusu" />
          <TrainingField label="Email" value={form.email} onChange={(email) => setForm({ ...form, email })} placeholder="jucator@email.com" />
          <View style={styles.formRow}>
            <View style={styles.formHalf}>
              <TrainingField label="Număr" value={form.no} onChange={(no) => setForm({ ...form, no: no.replace(/[^0-9]/g, "") })} placeholder="10" />
            </View>
            <View style={styles.formHalf}>
              <TrainingField label="Post" value={form.role} onChange={(role) => setForm({ ...form, role })} placeholder="Atacant" />
            </View>
          </View>
          <Text style={styles.trainingFieldLabel}>Grupa</Text>
          <View style={styles.groupRow}>
            {clubGroups.map((group) => (
              <Pressable key={group} style={[styles.groupChip, form.group === group && styles.groupChipActive]} onPress={() => setForm({ ...form, group })}>
                <Text style={[styles.groupChipText, form.group === group && styles.groupChipTextActive]}>{group}</Text>
              </Pressable>
            ))}
          </View>
          <Text style={styles.trainingFieldLabel}>Parolă</Text>
          <View style={styles.passwordWrap}>
            <TextInput
              style={styles.passwordInput}
              value={form.password}
              onChangeText={(password) => setForm({ ...form, password })}
              placeholder="Parola"
              placeholderTextColor={C.muted}
              secureTextEntry={!showPassword}
            />
            <Pressable onPress={() => setShowPassword((value) => !value)}>
              {showPassword ? <LucideIcons.EyeOff size={21} color={C.blue} /> : <LucideIcons.Eye size={21} color={C.blue} />}
            </Pressable>
          </View>
          <TrainingField label="Confirmă parola" value={form.confirmPassword} onChange={(confirmPassword) => setForm({ ...form, confirmPassword })} placeholder="Repetă parola" />
          {!!(localError || error) && <Text style={styles.authError}>{localError || error}</Text>}
          <BeUIButton
            label={loading ? "Se creează..." : "Creează contul"}
            variant="danger"
            size="lg"
            icon="CheckCircle2"
            onPress={submit}
            style={{ marginTop: 8 }}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },
  loginContent: { padding: 18, paddingBottom: 34 },
  backLink: { flexDirection: "row", alignItems: "center", alignSelf: "flex-start", marginBottom: 14 },
  backText: { color: C.blue, fontSize: 12, fontWeight: "800" },
  loginHero: { alignItems: "center", backgroundColor: C.card, borderRadius: 24, padding: 20, borderWidth: 1, borderColor: C.line, marginBottom: 14 },
  loginTitle: { color: C.text, fontSize: 27, fontWeight: "900", marginTop: 10 },
  loginSubtitle: { color: C.muted, fontSize: 11, marginTop: 5 },
  formCard: { backgroundColor: C.card, borderRadius: 20, padding: 15 },
  formRow: { flexDirection: "row", gap: 10 },
  formHalf: { flex: 1 },
  trainingFieldLabel: { color: C.muted, fontSize: 9, fontWeight: "900", letterSpacing: 0.8, marginBottom: 6 },
  groupRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 14 },
  groupChip: { flexGrow: 1, flexBasis: "22%", alignItems: "center", borderWidth: 1, borderColor: C.line, borderRadius: 11, paddingVertical: 10, paddingHorizontal: 8 },
  groupChipActive: { backgroundColor: C.red, borderColor: C.red },
  groupChipText: { color: C.muted, fontWeight: "800", fontSize: 11 },
  groupChipTextActive: { color: C.text },
  passwordWrap: { flexDirection: "row", alignItems: "center", backgroundColor: C.bg, borderWidth: 1, borderColor: C.line, borderRadius: 12, paddingRight: 12, marginBottom: 12 },
  passwordInput: { flex: 1, color: C.text, paddingHorizontal: 12, paddingVertical: 12, fontSize: 12 },
  authError: { color: C.amber, fontSize: 11, lineHeight: 16, marginBottom: 10 },
  primaryButton: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, backgroundColor: C.red, borderRadius: 14, padding: 14, marginTop: 8 },
  primaryButtonText: { color: C.text, fontWeight: "900", fontSize: 12 },
});
