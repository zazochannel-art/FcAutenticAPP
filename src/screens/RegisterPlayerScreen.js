import React, { useState } from "react";
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, View, useWindowDimensions } from "react-native";
import * as LucideIcons from "lucide-react-native";
import { colors as C, radius, spacing } from "../constants/theme";
import { Badge, TrainingField } from "../components/SharedComponents";
import { BeUIButton } from "../components/ui/be-ui-button";

const clubGroups = ["U13", "U16", "U19", "Juniori", "Seniori"];

export default function RegisterPlayerScreen({ onBack, onRegister, loading, error }) {
  const { width } = useWindowDimensions();
  const isMobile = width < 768;

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    group: "U19",
    no: "",
    role: "Mijlocaș",
    clubCode: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [localError, setLocalError] = useState("");

  const submit = () => {
    const email = form.email.trim().toLowerCase();
    if (form.name.trim().length < 3) {
      setLocalError("Introdu numele complet.");
      return;
    }
    if (form.clubCode.trim().length < 4) {
      setLocalError("Introdu codul clubului primit de la antrenor/administrator.");
      return;
    }
    if (!email.includes("@")) {
      setLocalError("Introdu un email valid.");
      return;
    }
    if (form.password.length < 6) {
      setLocalError("Minim 6 caractere.");
      return;
    }
    if (form.password !== form.confirmPassword) {
      setLocalError("Parolele nu coincid.");
      return;
    }
    setLocalError("");
    onRegister(form);
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
          <Badge size={isMobile ? 60 : 82} />
          <Text style={[styles.loginTitle, isMobile && { fontSize: 24 }]}>Cont jucător</Text>
          <Text style={styles.loginSubtitle}>Alătură-te clubului tău cu codul primit de la antrenor.</Text>
        </View>

        <View style={[styles.formCard, !isMobile && { maxWidth: 500, alignSelf: 'center' }]}>
          <TrainingField
            label="Cod club"
            value={form.clubCode}
            onChange={(clubCode) => setForm({ ...form, clubCode: clubCode.toUpperCase() })}
            placeholder="Ex: A1B2C3D4"
          />
          <Text style={styles.codeHint}>Primești codul de la antrenorul sau administratorul clubului.</Text>

          <TrainingField label="Nume complet" value={form.name} onChange={(name) => setForm({ ...form, name })} placeholder="Andrei Popescu" />
          <TrainingField label="Email" value={form.email} onChange={(email) => setForm({ ...form, email })} placeholder="andrei@email.com" />

          <View style={styles.formRow}>
            <View style={{ flex: 1, marginRight: 8 }}>
              <TrainingField label="Număr" value={form.no} onChange={(no) => setForm({ ...form, no })} placeholder="10" />
            </View>
            <View style={{ flex: 1.5 }}>
              <TrainingField label="Post" value={form.role} onChange={(role) => setForm({ ...form, role })} placeholder="Atacant" />
            </View>
          </View>

          <Text style={styles.trainingFieldLabel}>Grupa</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.groupRow} contentContainerStyle={{ gap: 6 }}>
            {clubGroups.map((group) => (
              <Pressable key={group} style={[styles.groupChip, form.group === group && styles.groupChipActive]} onPress={() => setForm({ ...form, group })}>
                <Text style={[styles.groupChipText, form.group === group && styles.groupChipTextActive]}>{group}</Text>
              </Pressable>
            ))}
          </ScrollView>

          <Text style={styles.trainingFieldLabel}>Parolă</Text>
          <View style={styles.passwordWrap}>
            <TextInput
              style={styles.passwordInput}
              value={form.password}
              onChangeText={(password) => setForm({ ...form, password })}
              placeholder="Minim 6 caractere"
              placeholderTextColor={C.dim}
              secureTextEntry={!showPassword}
            />
            <Pressable onPress={() => setShowPassword((value) => !value)}>
              {showPassword ? <LucideIcons.EyeOff size={18} color={C.cyan} /> : <LucideIcons.Eye size={18} color={C.cyan} />}
            </Pressable>
          </View>

          <Text style={styles.trainingFieldLabel}>Confirmă parola</Text>
          <View style={styles.passwordWrap}>
            <TextInput
              style={styles.passwordInput}
              value={form.confirmPassword}
              onChangeText={(confirmPassword) => setForm({ ...form, confirmPassword })}
              placeholder="Rescrie parola"
              placeholderTextColor={C.dim}
              secureTextEntry={!showPassword}
            />
          </View>

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
  safe: { flex: 1, backgroundColor: "#020617" },
  loginContent: { padding: spacing.md, paddingBottom: 40 },
  loginHero: { alignItems: 'center', backgroundColor: "rgba(15,23,42,0.6)", borderRadius: 24, padding: 20, borderWidth: 1, borderColor: "rgba(255,255,255,0.06)", marginBottom: 16 },
  loginTitle: { color: 'white', fontSize: 27, fontWeight: '900', marginTop: 10 },
  loginSubtitle: { color: C.muted, fontSize: 11, marginTop: 5, textTransform: 'uppercase', letterSpacing: 1 },
  formCard: { backgroundColor: "rgba(15,23,42,0.4)", borderRadius: 20, padding: 20, borderWidth: 1, borderColor: "rgba(255,255,255,0.05)" },
  formRow: { flexDirection: 'row', marginBottom: 12 },
  trainingFieldLabel: { color: C.muted, fontSize: 9, fontWeight: "900", letterSpacing: 1, marginBottom: 8, textTransform: 'uppercase' },
  groupRow: { flexDirection: "row", marginBottom: 16 },
  groupChip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, borderWidth: 1, borderColor: '#1e293b', backgroundColor: "rgba(255,255,255,0.02)" },
  groupChipActive: { borderColor: C.cyan, backgroundColor: C.cyan + '15' },
  groupChipText: { color: C.muted, fontWeight: "800", fontSize: 10 },
  groupChipTextActive: { color: C.cyan },
  passwordWrap: { flexDirection: 'row', alignItems: 'center', backgroundColor: "rgba(2,6,23,0.5)", borderWidth: 1, borderColor: '#1e293b', borderRadius: 12, paddingHorizontal: 12, marginBottom: 12, height: 48 },
  passwordInput: { flex: 1, color: 'white', fontSize: 13, fontWeight: '600' },
  authError: { color: C.red, fontSize: 11, fontWeight: '700', marginBottom: 10, textAlign: 'center' },
  codeHint: { color: C.dim, fontSize: 10, fontWeight: '600', marginTop: -8, marginBottom: 16, lineHeight: 14 },
});
