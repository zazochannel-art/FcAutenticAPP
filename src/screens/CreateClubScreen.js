import React, { useState } from "react";
import { Alert, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from "react-native";
import * as LucideIcons from "lucide-react-native";
import { colors as C } from "../constants/theme";
import { TopBar, TrainingField } from "../components/SharedComponents";

import { BeUIButton } from "../components/ui/be-ui-button";

export default function CreateClubScreen({ onBack, onCreate, loading, error, openNotifications }) {
  const [form, setForm] = useState({
    name: "",
    logo: "",
    city: "",
    country: "Moldova",
    email: "",
    phone: "",
    description: "",
    groups: ["U13", "U16", "U19", "Seniori"],
  });

  const toggleGroup = (group) => {
    setForm((current) => ({
      ...current,
      groups: current.groups.includes(group)
        ? current.groups.filter((item) => item !== group)
        : [...current.groups, group],
    }));
  };

  const submit = () => {
    if (!form.name.trim()) {
      Alert.alert("Nume lipsa", "Completeaza numele clubului.");
      return;
    }
    if (!form.email.trim().includes("@")) {
      Alert.alert("Email invalid", "Completeaza emailul de contact al clubului.");
      return;
    }
    if (!form.groups.length) {
      Alert.alert("Grupe lipsa", "Alege cel putin o categorie de varsta.");
      return;
    }
    onCreate(form);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <BeUIButton
          label="Înapoi"
          variant="ghost"
          size="sm"
          icon="ChevronLeft"
          onPress={onBack}
          style={{ alignSelf: "flex-start", marginBottom: 14 }}
        />
        <TopBar title="Create Club" eyebrow="ONBOARDING SAAS" openNotifications={openNotifications} />
        <View style={styles.formCard}>
          <TrainingField label="Nume club" value={form.name} onChange={(name) => setForm({ ...form, name })} placeholder="FC Autentic Academy" />
          <TrainingField label="Logo club (URL optional)" value={form.logo} onChange={(logo) => setForm({ ...form, logo })} placeholder="https://..." />
          <View style={styles.formRow}>
            <View style={styles.formHalf}><TrainingField label="Oras" value={form.city} onChange={(city) => setForm({ ...form, city })} placeholder="Chisinau" /></View>
            <View style={styles.formHalf}><TrainingField label="Tara" value={form.country} onChange={(country) => setForm({ ...form, country })} placeholder="Moldova" /></View>
          </View>
          <TrainingField label="Email contact" value={form.email} onChange={(email) => setForm({ ...form, email })} placeholder="club@email.com" />
          <TrainingField label="Telefon" value={form.phone} onChange={(phone) => setForm({ ...form, phone })} placeholder="+373..." />
          <TrainingField label="Descriere" value={form.description} onChange={(description) => setForm({ ...form, description })} multiline />
          <Text style={styles.trainingFieldLabel}>Categorii / grupe</Text>
          <View style={styles.groupRow}>
            {["U13", "U16", "U19", "Juniori", "Seniori"].map((group) => (
              <Pressable key={group} style={[styles.groupChip, form.groups.includes(group) && styles.groupChipActive]} onPress={() => toggleGroup(group)}>
                <Text style={[styles.groupChipText, form.groups.includes(group) && styles.groupChipTextActive]}>{group}</Text>
              </Pressable>
            ))}
          </View>
          {!!error && <Text style={styles.authError}>{error}</Text>}
        </View>
        <BeUIButton
          label={loading ? "Se creeaza..." : "Creeaza club si devino owner"}
          variant="danger"
          size="lg"
          icon="ShieldCheck"
          onPress={submit}
          fullWidth
          style={{ marginTop: 8 }}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },
  content: { padding: 18, paddingBottom: 32 },
  backLink: { flexDirection: "row", alignItems: "center", alignSelf: "flex-start", marginBottom: 14 },
  backText: { color: C.blue, fontSize: 12, fontWeight: "800" },
  formCard: { backgroundColor: C.card, borderRadius: 20, padding: 15 },
  formRow: { flexDirection: "row", gap: 10 },
  formHalf: { flex: 1 },
  trainingFieldLabel: { color: C.muted, fontSize: 9, fontWeight: "900", letterSpacing: 0.8, marginBottom: 6 },
  groupRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 14 },
  groupChip: { flexGrow: 1, flexBasis: "22%", alignItems: "center", borderWidth: 1, borderColor: C.line, borderRadius: 11, paddingVertical: 10, paddingHorizontal: 8 },
  groupChipActive: { backgroundColor: C.red, borderColor: C.red },
  groupChipText: { color: C.muted, fontWeight: "800", fontSize: 11 },
  groupChipTextActive: { color: C.text },
  authError: { color: C.amber, fontSize: 11, lineHeight: 16, marginBottom: 10 },
  primaryButton: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, backgroundColor: C.red, borderRadius: 14, padding: 14, marginTop: 8 },
  primaryButtonText: { color: C.text, fontWeight: "900", fontSize: 12 },
});
