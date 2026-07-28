import React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { radius, themedStyles, gradients } from "../../constants/theme";
import { LANGUAGES, useTranslation } from "../../i18n";

// Selector compact de limbă, în stilul `.tabs` din Kultura: un container cu
// bordură și trei segmente, cel activ cu gradientul de accent.
export function LanguagePicker({ style }) {
  const { lang, setLanguage, t } = useTranslation();

  return (
    <View style={[styles.wrap, style]}>
      {LANGUAGES.map((item) => {
        const isActive = item.key === lang;
        return (
          <Pressable
            key={item.key}
            onPress={() => setLanguage(item.key)}
            style={styles.item}
            accessibilityRole="button"
            accessibilityState={{ selected: isActive }}
            accessibilityLabel={t("lang.name")}
          >
            {isActive && (
              <LinearGradient
                colors={gradients.button}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[StyleSheet.absoluteFill, { borderRadius: radius.sm }]}
              />
            )}
            <Text style={[styles.label, isActive && styles.labelActive]}>{item.label}</Text>
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
