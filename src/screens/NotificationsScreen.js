import React, { useState } from "react";
import { ScrollView, StyleSheet, Text, View, Pressable, TextInput, Platform, Alert } from "react-native";
import * as LucideIcons from "lucide-react-native";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { colors as C, themedStyles, layout } from "../constants/theme";
import { TopBar } from "../components/SharedComponents";
import { supabaseService } from "../services/supabaseService";
import { useTopClearance } from "../hooks/useTopClearance";
import { useNotificationPrefs } from "../hooks/useNotificationPrefs";
import { buildNotifications } from "../utils/notifications";
import { useTranslation } from "../i18n";

// Iconița și culoarea fiecărei categorii.
const KIND_LOOK = {
  announcements: ["Megaphone", "cyan"],
  callups: ["ClipboardCheck", "green"],
  trainings: ["Dumbbell", "purple"],
  payments: ["Wallet", "amber"],
};

function notify(title, msg) {
  if (Platform.OS === "web") window.alert(`${title}\n\n${msg}`);
  else Alert.alert(title, msg);
}

function timeAgo(value) {
  if (!value) return "";
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  const diff = Math.floor((Date.now() - d.getTime()) / 1000);
  if (diff < 60) return "acum";
  if (diff < 3600) return `acum ${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `acum ${Math.floor(diff / 3600)}h`;
  return d.toLocaleDateString("ro-RO", { day: "numeric", month: "short" });
}

export default function NotificationsScreen({ currentUser, clubId, selectedClub, players = [], matches = [], trainings = [] }) {
  const { t } = useTranslation();
  const prefs = useNotificationPrefs();
  const topClearance = useTopClearance();
  const queryClient = useQueryClient();
  const [text, setText] = useState("");
  const [posting, setPosting] = useState(false);

  const canPost = ["super_admin", "club_owner", "admin", "coach"].includes(currentUser?.role);

  const { data: messages = [], isLoading } = useQuery({
    queryKey: ["announcements", clubId],
    queryFn: () => supabaseService.getChatMessages(clubId),
    enabled: !!clubId,
  });

  const { data: monthlyPayments = {} } = useQuery({
    queryKey: ["monthlyPayments", clubId],
    queryFn: () => supabaseService.getMonthlyPayments(clubId),
    enabled: !!clubId,
  });

  // Pentru jucător și părinte, politicile bazei întorc doar jucătorul propriu.
  const isPlayerSide = ["player", "parent"].includes(currentUser?.role);
  const myPlayer = isPlayerSide ? players[0] || null : null;

  const feed = buildNotifications({
    announcements: messages,
    matches,
    trainings,
    monthlyPayments,
    myPlayer,
    isStaff: canPost,
    prefs,
  });

  const allOff = Object.values(prefs).every((v) => v === false);

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
      notify(t('common.error'), e.message);
    } finally {
      setPosting(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={[styles.content, topClearance]} showsVerticalScrollIndicator={false}>
      <TopBar title={t('notif.title')} eyebrow={t('notif.eyebrow')} />

      {canPost && (
        <View style={styles.composer}>
          <TextInput
            style={styles.input}
            value={text}
            onChangeText={setText}
            placeholder={t('notif.compose', { club: selectedClub?.name || "" })}
            placeholderTextColor={C.dim}
            multiline
          />
          <Pressable onPress={post} disabled={posting || !text.trim()} style={[styles.postBtn, (posting || !text.trim()) && { opacity: 0.5 }]}>
            <LucideIcons.Send size={15} color="white" />
            <Text style={styles.postBtnText}>{t('notif.post')}</Text>
          </Pressable>
        </View>
      )}

      {/* Fără club selectat cererea nu pleacă niciodată; înainte rămânea „se
          încarcă” la nesfârșit și ascundea starea goală. */}
      {isLoading && !!clubId && <Text style={styles.empty}>{t('notif.loading')}</Text>}

      {(!isLoading || !clubId) && feed.length === 0 && (
        <View style={styles.emptyState}>
          <LucideIcons.BellOff size={38} color={C.muted} />
          <Text style={styles.emptyText}>{allOff ? t('notif.allOff') : t('notif.empty')}</Text>
        </View>
      )}

      {feed.map((item) => {
        const [iconName, colorKey] = KIND_LOOK[item.kind] || KIND_LOOK.announcements;
        const Icon = LucideIcons[iconName] || LucideIcons.Bell;
        const color = C[colorKey] || C.cyan;
        return (
          <View key={item.id} style={styles.card}>
            <View style={[styles.cardIcon, { backgroundColor: color + "1A" }]}>
              <Icon size={16} color={color} />
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <View style={styles.cardHead}>
                <Text style={styles.author}>{t(item.titleKey, item.vars)}</Text>
                <Text style={styles.time}>{timeAgo(item.at)}</Text>
              </View>
              <Text style={styles.msgText}>{item.bodyKey ? t(item.bodyKey, item.vars) : item.body}</Text>
            </View>
          </View>
        );
      })}
    </ScrollView>
  );
}

const styles = themedStyles((C) => StyleSheet.create({
  content: { padding: 18, paddingBottom: layout.navClearance },
  composer: { backgroundColor: C.card, borderRadius: 18, padding: 14, borderWidth: 1, borderColor: C.line, marginBottom: 18 },
  input: { minHeight: 60, color: C.text, fontSize: 13, fontWeight: "600", textAlignVertical: "top", backgroundColor: C.bgSecondary, borderRadius: 12, padding: 12, borderWidth: 1, borderColor: C.line },
  postBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, height: 42, borderRadius: 12, backgroundColor: C.blue, marginTop: 10 },
  postBtnText: { color: C.text, fontSize: 12, fontWeight: "900" },
  empty: { color: C.muted, fontSize: 12, fontWeight: "600", textAlign: "center", paddingVertical: 20 },
  emptyState: { alignItems: "center", justifyContent: "center", paddingVertical: 50, gap: 12 },
  emptyText: { color: C.muted, fontSize: 12.5, fontWeight: "600", textAlign: "center", lineHeight: 18, paddingHorizontal: 20 },
  card: { flexDirection: "row", backgroundColor: C.card, borderRadius: 16, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: C.line },
  cardIcon: { width: 34, height: 34, borderRadius: 10, backgroundColor: C.cyan + "1A", alignItems: "center", justifyContent: "center" },
  cardHead: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 3 },
  author: { color: C.text, fontSize: 12, fontWeight: "900" },
  time: { color: C.dim, fontSize: 9.5, fontWeight: "700" },
  msgText: { color: C.muted, fontSize: 12.5, fontWeight: "600", lineHeight: 18 },
}));
