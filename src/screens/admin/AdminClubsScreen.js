import React, { useMemo, useState } from "react";
import { View, Text, ScrollView, Pressable, ActivityIndicator } from "react-native";
import * as LucideIcons from "lucide-react-native";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabaseService } from "../../services/supabaseService";
import { AD, PLAN_COLORS, AdminPage, StatCard, ActionBtn, Card, EmptyBox, formatDate, notify, confirmAction, s } from "./adminUi";

export default function AdminClubsScreen({ clubs = [], onCreateClub, onManageClub }) {
  const queryClient = useQueryClient();
  const [busyId, setBusyId] = useState(null);

  const { data: overview } = useQuery({
    queryKey: ["platformOverview"],
    queryFn: () => supabaseService.getPlatformOverview(),
  });
  const { data: subscriptions = [] } = useQuery({
    queryKey: ["subscriptions"],
    queryFn: () => supabaseService.getSubscriptions(),
  });

  const memberships = overview?.memberships || [];
  const allPlayers = overview?.players || [];

  const perClub = useMemo(() => {
    const map = {};
    clubs.forEach((c) => { map[c.id] = { users: 0, players: 0 }; });
    memberships.forEach((m) => { if (m.status === "active" && map[m.club_id]) map[m.club_id].users += 1; });
    allPlayers.forEach((p) => { if (map[p.club_id]) map[p.club_id].players += 1; });
    return map;
  }, [clubs, memberships, allPlayers]);

  const subFor = (clubId) => subscriptions.find((sub) => (sub.clubId || sub.club_id) === clubId);

  const toggleBlocked = (club) => {
    const next = !club.blocked;
    confirmAction(
      next ? "Blochează clubul" : "Deblochează clubul",
      next
        ? `„${club.name}” nu va mai putea fi accesat de membrii săi. Continui?`
        : `„${club.name}” va redeveni accesibil. Continui?`,
      async () => {
        setBusyId(club.id);
        try {
          await supabaseService.setClubBlocked(club.id, next);
          queryClient.invalidateQueries({ queryKey: ["clubs"] });
        } catch (e) {
          notify("Eroare", e.message);
        } finally {
          setBusyId(null);
        }
      }
    );
  };

  return (
    <AdminPage title="Cluburi" subtitle="Administrează cluburile din platformă, blochează sau intră în gestiunea unui club.">
      <View style={s.statsGrid}>
        <StatCard icon="Building2" label="Cluburi totale" val={String(clubs.length)} iColor={AD.cyan} />
        <StatCard icon="ShieldCheck" label="Active" val={String(clubs.filter((c) => !c.blocked).length)} iColor={AD.green} />
        <StatCard icon="ShieldOff" label="Blocate" val={String(clubs.filter((c) => c.blocked).length)} iColor={AD.red} />
      </View>

      <View style={s.actionsList}>
        <ActionBtn icon="Plus" label="Creează club" color={AD.cyan} onPress={onCreateClub} />
      </View>

      <Card title={`Cluburi în platformă (${clubs.length})`}>
        {clubs.length === 0 ? (
          <EmptyBox icon="Building2" text="Niciun club în platformă încă." />
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={{ minWidth: 720, flexGrow: 1 }}>
              <View style={s.tableHeader}>
                <Text style={[s.th, { flex: 2 }]}>Club</Text>
                <Text style={[s.th, { flex: 1 }]}>Plan</Text>
                <Text style={[s.th, { width: 70, textAlign: "center" }]}>Utiliz.</Text>
                <Text style={[s.th, { width: 60, textAlign: "center" }]}>Jucători</Text>
                <Text style={[s.th, { flex: 1.2 }]}>Expiră</Text>
                <Text style={[s.th, { width: 200, textAlign: "right" }]}>Acțiuni</Text>
              </View>
              {clubs.map((club) => {
                const stats = perClub[club.id] || { users: 0, players: 0 };
                const sub = subFor(club.id);
                const plan = sub?.planName || club.plan || "Free";
                const busy = busyId === club.id;
                return (
                  <View key={club.id} style={s.tableRow}>
                    <View style={{ flex: 2, flexDirection: "row", alignItems: "center" }}>
                      <View style={[s.miniLogo, club.blocked && { backgroundColor: AD.red + "22" }]}>
                        <LucideIcons.Shield size={12} color={club.blocked ? AD.red : "white"} />
                      </View>
                      <View style={{ marginLeft: 10, flex: 1 }}>
                        <Text style={s.rowMainText} numberOfLines={1}>{club.name}</Text>
                        <Text style={s.rowSubText} numberOfLines={1}>
                          {club.city ? `${club.city}${club.country ? ", " + club.country : ""}` : (club.email || "—")}
                        </Text>
                      </View>
                    </View>
                    <Text style={[{ color: PLAN_COLORS[plan] || AD.dim, fontSize: 10.5, fontWeight: "900" }, { flex: 1 }]}>{plan}</Text>
                    <Text style={[s.rowSubText, { width: 70, textAlign: "center" }]}>{stats.users}</Text>
                    <Text style={[s.rowSubText, { width: 60, textAlign: "center" }]}>{stats.players}</Text>
                    <Text style={[s.rowSubText, { flex: 1.2 }]}>{formatDate(sub?.expiresAt)}</Text>
                    <View style={{ width: 200, flexDirection: "row", justifyContent: "flex-end", gap: 8 }}>
                      <Pressable onPress={() => onManageClub?.(club.id)} style={[s.rowBtn, { borderColor: AD.cyan + "40", backgroundColor: AD.cyan + "10" }]}>
                        <LucideIcons.Settings2 size={12} color={AD.cyan} />
                        <Text style={[s.rowBtnText, { color: AD.cyan }]}>Administrează</Text>
                      </Pressable>
                      <Pressable onPress={() => toggleBlocked(club)} disabled={busy} style={[s.rowBtn, { borderColor: (club.blocked ? AD.green : AD.red) + "40", backgroundColor: (club.blocked ? AD.green : AD.red) + "10" }]}>
                        {busy ? <ActivityIndicator size="small" color={club.blocked ? AD.green : AD.red} /> : (
                          <>
                            {club.blocked ? <LucideIcons.LockOpen size={12} color={AD.green} /> : <LucideIcons.Lock size={12} color={AD.red} />}
                            <Text style={[s.rowBtnText, { color: club.blocked ? AD.green : AD.red }]}>{club.blocked ? "Deblochează" : "Blochează"}</Text>
                          </>
                        )}
                      </Pressable>
                    </View>
                  </View>
                );
              })}
            </View>
          </ScrollView>
        )}
      </Card>
    </AdminPage>
  );
}
