import React, { useState } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { radius, themedStyles, gradients } from "../../constants/theme";

export const LANGUAGES = ["Ro", "RU", "En"];

// Selector compact de limbă, în stilul `.tabs` din Kultura: un container cu
// bordură și trei segmente, cel activ cu gradientul de accent.
//
// Notă: deocamdată schimbă doar segmentul selectat. Textele aplicației sunt
// scrise direct în română, fără strat de traduceri — traducerea propriu-zisă
// cere un i18n separat.
export function LanguagePicker({ value, onChange, style }) {
  const [internal, setInternal] = useState(LANGUAGES[0]);
  const active = value ?? internal;

  const pick = (lang) => {
    if (value === undefined) setInternal(lang);
    onChange?.(lang);
  };

  return (
    <View style={[styles.wrap, style]}>
      {LANGUAGES.map((lang) => {
        const isActive = lang === active;
        return (
          <Pressable key={lang} onPress={() => pick(lang)} style={styles.item} accessibilityRole="button">
            {isActive && (
              <LinearGradient
                colors={gradients.button}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[StyleSheet.absoluteFill, { borderRadius: radius.sm }]}
              />
            )}
            <Text style={[styles.label, isActive && styles.labelActive]}>{lang}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = themedStyles((C) => StyleSheet.create({
  wrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    padding: 3,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: C.line,
    backgroundColor: C.card,
  },
  item: {
    paddingVertical: 5,
    paddingHorizontal: 9,
    borderRadius: radius.sm,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  label: { color: C.muted, fontSize: 11, fontWeight: "700" },
  labelActive: { color: "#fff" },
}));
