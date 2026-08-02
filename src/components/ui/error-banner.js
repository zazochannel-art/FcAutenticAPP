import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import * as LucideIcons from "lucide-react-native";
import { colors as C, radius, themedStyles } from "../../constants/theme";
import { clearQueryError, useQueryError } from "../../hooks/useQueryError";
import { useTranslation } from "../../i18n";

// Banda care apare când o cerere către bază eșuează. Fără ea, ecranele arătau
// starea goală și păreau să spună că nu există date.
export function ErrorBanner({ onRetry, style }) {
  const { t } = useTranslation();
  const error = useQueryError();
  if (!error) return null;

  const retry = () => { clearQueryError(); onRetry?.(); };

  return (
    <View style={[styles.bar, style]} accessibilityRole="alert">
      <LucideIcons.CloudOff size={16} color={C.red} />
      <View style={{ flex: 1 }}>
        <Text style={styles.title}>{t('error.loadFailed')}</Text>
        <Text style={styles.detail} numberOfLines={2}>{error.message}</Text>
      </View>
      <Pressable onPress={retry} style={styles.action} accessibilityRole="button">
        <Text style={styles.actionText}>{t('error.retry')}</Text>
      </Pressable>
      <Pressable onPress={clearQueryError} style={styles.close} accessibilityRole="button" accessibilityLabel={t('common.close')}>
        <LucideIcons.X size={15} color={C.dim} />
      </Pressable>
    </View>
  );
}

const styles = themedStyles((C) => StyleSheet.create({
  bar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginHorizontal: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: C.red + "55",
    // Fundal opac: banda plutește peste pagină, iar cu o culoare translucidă
    // conținutul de dedesubt se vedea prin text.
    backgroundColor: C.cardSolid,
  },
  title: { color: C.text, fontSize: 12, fontWeight: "900" },
  detail: { color: C.muted, fontSize: 10.5, fontWeight: "600", marginTop: 1 },
  action: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 999, borderWidth: 1, borderColor: C.red + "55" },
  actionText: { color: C.red, fontSize: 11, fontWeight: "900" },
  close: { width: 26, height: 26, alignItems: "center", justifyContent: "center" },
}));
