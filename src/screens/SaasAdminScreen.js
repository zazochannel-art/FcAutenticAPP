import React from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { colors as C } from "../constants/theme";
import { TopBar, Metric } from "../components/SharedComponents";

export default function SaasAdminScreen({ clubs = [], players = [], memberships = [], subscriptions = [], openNotifications }) {
  return (
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <TopBar title="Super Admin" eyebrow="PLATFORMA SAAS" openNotifications={openNotifications} />
      <View style={styles.profileStats}>
        <Metric icon="Building" value={clubs.length} label="Cluburi" color={C.blue} />
        <Metric icon="Users" value={memberships.length} label="Membri" color={C.green} />
        <Metric icon="Trophy" value={players.length} label="Jucatori" color={C.amber} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 18, paddingBottom: 32 },
  profileStats: { flexDirection: "row", backgroundColor: C.card, borderRadius: 17, padding: 12, marginTop: 11 },
});
