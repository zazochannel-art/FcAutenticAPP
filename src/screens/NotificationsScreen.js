import React, { useState } from "react";
import { ScrollView, StyleSheet, Text, View, Pressable, TextInput, Platform, Alert } from "react-native";
import * as LucideIcons from "lucide-react-native";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { colors as C } from "../constants/theme";
import { TopBar } from "../components/SharedComponents";
import { supabaseService } from "../services/supabaseService";

function notify(title, msg) {
  if (Platform.OS === "web") window.alert(`${title}\n\n${msg}`);
  else Alert.alert(title, msg);
}

function timeAgo(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const diff = Math.floor((Date.now() - d.getTime()) / 1000);
  if (diff < 60) return "acum";
  if (diff < 3600) return `acum ${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `acum ${Math.floor(diff / 3600)}h`;
  return d.toLocaleDateString("ro-RO", { day: "numeric", month: "short" });
}

export default function NotificationsScreen({ currentUser, clubId, selectedClub, openNotifications }) {
  const queryClient = useQueryClient();
  const [text, setText] = useState("");
  const [posting, setPosting] = useState(false);

  const canPost = ["super_admin", "club_owner", "admin", "coach"].includes(currentUser?.role);

  const { data: messages = [], isLoading } = useQuery({
    queryKey: ["announcements", clubId],
    queryFn: () => supabaseService.getChatMessages(clubId),
    enabled: !!clubId,
  });

  const feed = [...messages].reverse();

  const post = async () => {
    if (!text.trim()) return;
    setPosting(true);
    try {
      await supabaseService.insertChatMessage({
        audience: "club",
        authorId: currentUser?.id,
        authorName: currentUser?.name || "Staff",
        text: text.trim(),
        clubId,
      });
      setText("");
      queryClient.invalidateQueries({ queryKey: ["announcements"] });
    } catch (e) {
      notify("Eroare", e.message);
    } finally {
      setPosting(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <TopBar title="Anunțuri" eyebrow="COMUNICARE CLUB" openNotifications={openNotifications} />

      {canPost && (
        <View style={styles.composer}>
          <TextInput
            style={styles.input}
            value={text}
            onChangeText={setText}
            placeholder={`Scrie un anunț pentru ${selectedClub?.name || "club"}...`}
            placeholderTextColor={C.dim}
            multiline
          />
          <Pressable onPress={post} disabled={posting || !text.trim()} style={[styles.postBtn, (posting || !text.trim()) && { opacity: 0.5 }]}>
            <LucideIcons.Send size={15} color="white" />
            <Text style={styles.postBtnText}>Publică anunțul</Text>
          </Pressable>
        </View>
      )}

      {isLoading && <Text style={styles.empty}>Se încarcă anunțurile...</Text>}

      {!isLoading && feed.length === 0 && (
        <View style={styles.emptyState}>
          <LucideIcons.BellOff size={38} color={C.muted} />
          <Text style={styles.emptyText}>
            {canPost ? "Niciun anunț încă. Publică primul mesaj pentru club." : "Niciun anunț nou de la club."}
          </Text>
        </View>
      )}

      {feed.map((m) => (
        <View key={m.id} style={styles.card}>
          <View style={styles.cardIcon}><LucideIcons.Megaphone size={16} color={C.cyan} /></View>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <View style={styles.cardHead}>
              <Text style={styles.author}>{m.author_name || "Club"}</Text>
              <Text style={styles.time}>{timeAgo(m.created_at)}</Text>
            </View>
            <Text style={styles.msgText}>{m.text}</Text>
          </View>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 18, paddingBottom: 120 },
  composer: { backgroundColor: "rgba(15,23,42,0.6)", borderRadius: 18, padding: 14, borderWidth: 1, borderColor: "rgba(255,255,255,0.06)", marginBottom: 18 },
  input: { minHeight: 60, color: "white", fontSize: 13, fontWeight: "600", textAlignVertical: "top", backgroundColor: "rgba(2,6,23,0.5)", borderRadius: 12, padding: 12, borderWidth: 1, borderColor: "#1e293b" },
  postBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, height: 42, borderRadius: 12, backgroundColor: C.blue, marginTop: 10 },
  postBtnText: { color: "white", fontSize: 12, fontWeight: "900" },
  empty: { color: C.muted, fontSize: 12, fontWeight: "600", textAlign: "center", paddingVertical: 20 },
  emptyState: { alignItems: "center", justifyContent: "center", paddingVertical: 50, gap: 12 },
  emptyText: { color: C.muted, fontSize: 12.5, fontWeight: "600", textAlign: "center", lineHeight: 18, paddingHorizontal: 20 },
  card: { flexDirection: "row", backgroundColor: "rgba(15,23,42,0.6)", borderRadius: 16, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: "rgba(255,255,255,0.05)" },
  cardIcon: { width: 34, height: 34, borderRadius: 10, backgroundColor: "rgba(0,212,255,0.1)", alignItems: "center", justifyContent: "center" },
  cardHead: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 3 },
  author: { color: "white", fontSize: 12, fontWeight: "900" },
  time: { color: C.dim, fontSize: 9.5, fontWeight: "700" },
  msgText: { color: C.muted, fontSize: 12.5, fontWeight: "600", lineHeight: 18 },
});
