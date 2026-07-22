import React, { useMemo, useState } from "react";
import { View, Text, Pressable, Modal, TextInput, ActivityIndicator } from "react-native";
import * as LucideIcons from "lucide-react-native";
import { useQuery } from "@tanstack/react-query";
import { supabaseService } from "../../services/supabaseService";
import { AD, AdminPage, StatCard, ActionBtn, Card, EmptyBox, notify, s } from "./adminUi";

const ROLE_LABELS = {
  super_admin: "Super admin", club_owner: "Owner", admin: "Admin",
  coach: "Antrenor", player: "Jucător", parent: "Părinte", viewer: "Vizitator",
};

export default function AdminUsersScreen({ clubs = [], onManageClub }) {
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteClubId, setInviteClubId] = useState(null);
  const [loading, setLoading] = useState(false);

  const { data: overview } = useQuery({
    queryKey: ["platformOverview"],
    queryFn: () => supabaseService.getPlatformOverview(),
  });

  const memberships = overview?.memberships || [];
  const clubName = (id) => clubs.find((c) => c.id === id)?.name || "Club";

  const roleCounts = useMemo(() => {
    const counts = {};
    memberships.filter((m) => m.status === "active").forEach((m) => {
      const r = m.role || "viewer";
      counts[r] = (counts[r] || 0) + 1;
    });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  }, [memberships]);

  const pendingByClub = useMemo(() => {
    const map = {};
    memberships.filter((m) => m.status === "pending").forEach((m) => {
      map[m.club_id] = (map[m.club_id] || 0) + 1;
    });
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [memberships]);

  const activeCount = memberships.filter((m) => m.status === "active").length;
  const pendingTotal = memberships.filter((m) => m.status === "pending").length;

  const invite = async () => {
    if (!inviteEmail.includes("@")) { notify("Email invalid", "Introdu o adresă de email validă."); return; }
    const targetClub = inviteClubId || clubs[0]?.id;
    if (!targetClub) { notify("Fără club", "Creează mai întâi un club pentru care să inviți un owner."); return; }
    setLoading(true);
    try {
      const invitation = await supabaseService.inviteOwner(inviteEmail.trim().toLowerCase(), targetClub);
      setInviteEmail("");
      setInviteOpen(false);
      notify("Invitație creată", `Trimite-i persoanei codul de invitație:\n\n${invitation.token}\n\nÎl introduce în ecranul „Alătură-te unui club”.`);
    } catch (e) {
      notify("Eroare", e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminPage title="Utilizatori & cereri" subtitle="Membri pe platformă, cereri de aprobat și invitații de owner.">
      <View style={s.statsGrid}>
        <StatCard icon="Users" label="Total conturi" val={String(overview?.usersCount ?? "—")} sub="în platformă" iColor={AD.violet} />
        <StatCard icon="UserCheck" label="Membri activi" val={String(activeCount)} sub="în cluburi" iColor={AD.green} />
        <StatCard icon="Clock" label="Cereri în așteptare" val={String(pendingTotal)} sub="de aprobat" iColor={pendingTotal > 0 ? AD.amber : AD.dim} />
      </View>

      <View style={s.actionsList}>
        <ActionBtn icon="UserPlus" label="Invită owner de club" color={AD.violet} onPress={() => setInviteOpen(true)} />
      </View>

      <Card title="Cereri de aprobat">
        {pendingByClub.length === 0 ? (
          <EmptyBox icon="UserCheck" text="Nicio cerere de alăturare în așteptare." />
        ) : (
          pendingByClub.map(([clubId, count]) => (
            <View key={clubId} style={styles.pendRow}>
              <View style={styles.pendIcon}><LucideIcons.Clock size={15} color={AD.amber} /></View>
              <View style={{ flex: 1, marginLeft: 10 }}>
                <Text style={s.rowMainText} numberOfLines={1}>{clubName(clubId)}</Text>
                <Text style={s.rowSubText}>{count} {count === 1 ? "cerere în așteptare" : "cereri în așteptare"}</Text>
              </View>
              <Pressable onPress={() => onManageClub?.(clubId, "Staff")} style={[s.rowBtn, { borderColor: AD.cyan + "40", backgroundColor: AD.cyan + "10" }]}>
                <LucideIcons.Settings2 size={12} color={AD.cyan} />
                <Text style={[s.rowBtnText, { color: AD.cyan }]}>Deschide clubul</Text>
              </Pressable>
            </View>
          ))
        )}
      </Card>

      <Card title="Membri activi pe roluri">
        {roleCounts.length === 0 ? (
          <Text style={s.emptyText}>Niciun membru activ încă.</Text>
        ) : (
          roleCounts.map(([role, count]) => (
            <View key={role} style={styles.roleRow}>
              <Text style={styles.roleLabel}>{ROLE_LABELS[role] || role}</Text>
              <Text style={styles.roleVal}>{count}</Text>
            </View>
          ))
        )}
      </Card>

      <Modal visible={inviteOpen} transparent animationType="fade" onRequestClose={() => setInviteOpen(false)}>
        <View style={s.modalOverlay}>
          <View style={s.modalCard}>
            <View style={s.modalHeader}>
              <Text style={s.modalTitle}>Invită owner de club</Text>
              <Pressable onPress={() => setInviteOpen(false)}><LucideIcons.X size={18} color={AD.dim} /></Pressable>
            </View>

            <Text style={s.modalLabel}>EMAIL</Text>
            <TextInput
              style={s.modalInput}
              value={inviteEmail}
              onChangeText={setInviteEmail}
              placeholder="owner@club.com"
              placeholderTextColor={AD.faint}
              autoCapitalize="none"
              keyboardType="email-address"
            />

            <Text style={s.modalLabel}>CLUB</Text>
            <View style={{ gap: 6, marginBottom: 16 }}>
              {clubs.map((club) => (
                <Pressable key={club.id} onPress={() => setInviteClubId(club.id)} style={[s.optionRow, (inviteClubId || clubs[0]?.id) === club.id && { borderColor: AD.cyan, backgroundColor: AD.cyan + "08" }]}>
                  <Text style={s.rowMainText}>{club.name}</Text>
                  {(inviteClubId || clubs[0]?.id) === club.id && <LucideIcons.Check size={14} color={AD.cyan} />}
                </Pressable>
              ))}
            </View>

            <Pressable style={[s.modalSaveBtn, loading && { opacity: 0.7 }]} onPress={invite} disabled={loading}>
              {loading ? <ActivityIndicator size="small" color="white" /> : (
                <>
                  <LucideIcons.Send size={15} color="white" />
                  <Text style={s.modalSaveText}>Generează invitația</Text>
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
  pendRow: { flexDirection: "row", alignItems: "center", paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.03)" },
  pendIcon: { width: 32, height: 32, borderRadius: 9, backgroundColor: AD.amber + "15", alignItems: "center", justifyContent: "center" },
  roleRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 9, borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.03)" },
  roleLabel: { color: AD.dim, fontSize: 11, fontWeight: "700" },
  roleVal: { color: "white", fontSize: 12, fontWeight: "900" },
};
