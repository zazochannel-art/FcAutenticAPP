import React, { useMemo, useState } from "react";
import { View, Text, Pressable, Modal, TextInput, ActivityIndicator } from "react-native";
import * as LucideIcons from "lucide-react-native";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabaseService } from "../../services/supabaseService";
import { AD, PLAN_PRICES, PLAN_COLORS, PLAN_OPTIONS, AdminPage, StatCard, Card, EmptyBox, PlanBadge, formatDate, notify, s } from "./adminUi";

export default function AdminSubscriptionsScreen({ clubs = [] }) {
  const queryClient = useQueryClient();
  const [editClub, setEditClub] = useState(null);
  const [plan, setPlan] = useState("Free");
  const [maxPlayers, setMaxPlayers] = useState("");
  const [saving, setSaving] = useState(false);

  const { data: subscriptions = [] } = useQuery({
    queryKey: ["subscriptions"],
    queryFn: () => supabaseService.getSubscriptions(),
  });

  const activeSubs = subscriptions.filter((sub) => sub.status === "active");
  const mrr = activeSubs.reduce((sum, sub) => sum + (PLAN_PRICES[sub.planName] || 0), 0);
  const subFor = (clubId) => subscriptions.find((sub) => (sub.clubId || sub.club_id) === clubId);

  const rows = useMemo(
    () => clubs.map((club) => ({ club, sub: subFor(club.id) })),
    [clubs, subscriptions]
  );

  const openEdit = (club) => {
    const sub = subFor(club.id);
    setEditClub(club);
    setPlan(sub?.planName || club.plan || "Free");
    setMaxPlayers(sub?.maxPlayers != null ? String(sub.maxPlayers) : "");
  };

  const save = async () => {
    if (!editClub) return;
    setSaving(true);
    try {
      const max = maxPlayers.trim() ? Number(maxPlayers.trim()) : null;
      await supabaseService.updateSubscriptionPlan(editClub.id, plan, Number.isNaN(max) ? null : max);
      queryClient.invalidateQueries({ queryKey: ["subscriptions"] });
      queryClient.invalidateQueries({ queryKey: ["clubs"] });
      setEditClub(null);
    } catch (e) {
      notify("Eroare", e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminPage title="Abonamente" subtitle="Planurile cluburilor și veniturile recurente estimate.">
      <View style={s.statsGrid}>
        <StatCard icon="CreditCard" label="Abonamente active" val={String(activeSubs.length)} sub={`${subscriptions.length} în total`} iColor={AD.blue} />
        <StatCard icon="Wallet" label="MRR estimat" val={`${mrr.toLocaleString("ro-RO")} lei`} sub="din prețurile de listă" iColor={AD.green} />
        <StatCard icon="Crown" label="Planuri plătite" val={String(activeSubs.filter((sub) => (PLAN_PRICES[sub.planName] || 0) > 0).length)} sub="peste planul Free" iColor={AD.amber} />
      </View>

      <Card title={`Plan per club (${clubs.length})`}>
        {rows.length === 0 ? (
          <EmptyBox icon="CreditCard" text="Niciun club de abonat încă." />
        ) : (
          rows.map(({ club, sub }) => {
            const planName = sub?.planName || club.plan || "Free";
            return (
              <View key={club.id} style={styles.subRow}>
                <View style={{ flex: 1 }}>
                  <Text style={s.rowMainText} numberOfLines={1}>{club.name}</Text>
                  <Text style={s.rowSubText}>
                    {sub ? `din ${formatDate(sub.startedAt)}` : "fără abonament"}
                    {sub?.maxPlayers != null ? ` • max ${sub.maxPlayers} jucători` : ""}
                    {sub?.expiresAt ? ` • expiră ${formatDate(sub.expiresAt)}` : ""}
                  </Text>
                </View>
                <PlanBadge plan={planName} />
                <Pressable onPress={() => openEdit(club)} style={[s.rowBtn, { marginLeft: 10, borderColor: AD.cyan + "40", backgroundColor: AD.cyan + "10" }]}>
                  <LucideIcons.Pencil size={12} color={AD.cyan} />
                  <Text style={[s.rowBtnText, { color: AD.cyan }]}>Schimbă</Text>
                </Pressable>
              </View>
            );
          })
        )}
      </Card>

      <Modal visible={!!editClub} transparent animationType="fade" onRequestClose={() => setEditClub(null)}>
        <View style={s.modalOverlay}>
          <View style={s.modalCard}>
            <View style={s.modalHeader}>
              <Text style={s.modalTitle}>{editClub?.name}</Text>
              <Pressable onPress={() => setEditClub(null)}><LucideIcons.X size={18} color={AD.dim} /></Pressable>
            </View>

            <Text style={s.modalLabel}>PLAN</Text>
            <View style={{ gap: 6, marginBottom: 12 }}>
              {PLAN_OPTIONS.map((p) => (
                <Pressable key={p} onPress={() => setPlan(p)} style={[s.optionRow, plan === p && { borderColor: AD.cyan, backgroundColor: AD.cyan + "08" }]}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                    <View style={[s.statusDot, { backgroundColor: PLAN_COLORS[p] || AD.dim, width: 8, height: 8, borderRadius: 4 }]} />
                    <Text style={s.rowMainText}>{p}</Text>
                    <Text style={s.rowSubText}>{PLAN_PRICES[p] ? `${PLAN_PRICES[p]} lei/lună` : "gratuit"}</Text>
                  </View>
                  {plan === p && <LucideIcons.Check size={14} color={AD.cyan} />}
                </Pressable>
              ))}
            </View>

            <Text style={s.modalLabel}>LIMITĂ JUCĂTORI (opțional)</Text>
            <TextInput
              style={s.modalInput}
              value={maxPlayers}
              onChangeText={setMaxPlayers}
              placeholder="ex. 30"
              placeholderTextColor={AD.faint}
              keyboardType="number-pad"
            />

            <Pressable style={[s.modalSaveBtn, saving && { opacity: 0.7 }]} onPress={save} disabled={saving}>
              {saving ? <ActivityIndicator size="small" color="white" /> : (
                <>
                  <LucideIcons.Check size={15} color="white" />
                  <Text style={s.modalSaveText}>Salvează planul</Text>
                </>
              )}
            </Pressable>
          </View>
        </View>
      </Modal>
    </AdminPage>
  );
}

const styles = {
  subRow: { flexDirection: "row", alignItems: "center", paddingVertical: 11, borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.03)" },
};
