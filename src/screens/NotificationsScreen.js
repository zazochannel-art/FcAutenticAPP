import React from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import * as LucideIcons from "lucide-react-native";
import { colors as C } from "../constants/theme";
import { TopBar } from "../components/SharedComponents";

export default function NotificationsScreen({ currentUser, openNotifications }) {
  return (
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <TopBar title="Notificări" eyebrow="ALERTĂRI" openNotifications={openNotifications} />
      <View style={styles.emptyState}>
        <LucideIcons.BellOff size={40} color={C.muted} />
        <Text style={styles.emptyText}>Nu ai notificări noi.</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 18, paddingBottom: 32 },
  emptyState: { alignItems: "center", justifyContent: "center", paddingVertical: 60, gap: 12 },
  emptyText: { color: C.muted, fontSize: 13, fontWeight: '600' },
});
