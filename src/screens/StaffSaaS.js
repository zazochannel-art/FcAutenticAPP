import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  TextInput,
  Modal,
  Platform,
  Alert
} from "react-native";
import * as LucideIcons from "lucide-react-native";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabaseService } from "../services/supabaseService";
import { colors as C, themedStyles } from "../constants/theme";

// --- Premium Palette ---

const ROLE_LABELS = {
  club_owner: { label: "OWNER", color: C.cyan },
  admin: { label: "ADMIN", color: C.blue },
  coach: { label: "ANTRENOR", color: C.green },
  staff: { label: "STAFF", color: C.purple },
  player: { label: "JUCĂTOR", color: C.muted },
  parent: { label: "PĂRINTE", color: C.amber },
};

const INVITE_ROLES = [
  { value: "admin", label: "Admin" },
  { value: "coach", label: "Antrenor" },
  { value: "staff", label: "Staff" },
];

function notify(title, msg) {
  if (Platform.OS === "web") window.alert(`${title}\n\n${msg}`);
  else Alert.alert(title, msg);
}

export default function StaffSaaS({ selectedClub, clubId, currentUser }) {
  const queryClient = useQueryClient();
  const [inviteOpen, setInviteOpen] = useState(false);
  const [busyId, setBusyId] = useState(null);

  const isOwner = ["super_admin", "club_owner"].includes(currentUser?.role);
  const canView = ["super_admin", "club_owner", "admin", "coach"].includes(currentUser?.role);

  const { data: members = [], isLoading } = useQuery({
    queryKey: ["clubMembers", clubId],
    queryFn: () => supabaseService.getClubMembers(clubId),
    enabled: !!clubId && canView,
  });

  const refresh = () => queryClient.invalidateQueries({ queryKey: ["clubMembers"] });

  const activeMembers = members.filter((m) => m.status === "active");
  const pendingMembers = members.filter((m) => m.status === "pending");
  const staffMembers = activeMembers.filter((m) => ["club_owner", "admin", "coach", "staff"].includes(m.role));

  const approve = async (member) => {
    setBusyId(member.membershipId);
    try {
      // RPC-ul activează membership-ul și creează jucătorul în lot din datele lui.
      await supabaseService.approveMember(member.membershipId);
      refresh();
      queryClient.invalidateQueries({ queryKey: ["players"] });
    } catch (e) {
      notify("Eroare", e.message);
    } finally {
      setBusyId(null);
    }
  };

  const reject = async (member) => {
    setBusyId(member.membershipId);
    try {
      await supabaseService.removeMembership(member.membershipId);
      refresh();
    } catch (e) {
      notify("Eroare", e.message);
    } finally {
      setBusyId(null);
    }
  };

  const sendInvite = async (email, role) => {
    if (!email.includes("@")) {
      notify("Email invalid", "Introdu o adresă de email validă.");
      return;
    }
    try {
      const invitation = await supabaseService.inviteOwner(email, clubId, role);
      setInviteOpen(false);
      notify(
        "Invitație creată",
        `Trimite-i persoanei codul de invitație:\n\n${invitation.token}\n\nÎl introduce în ecranul „Alătură-te unui club".`
      );
    } catch (e) {
      notify("Eroare", e.message);
    }
  };

  if (!canView) {
    return (
      <View style={[styles.container, { alignItems: "center", justifyContent: "center", padding: 30 }]}>
        <LucideIcons.Lock size={34} color={C.dim} />
        <Text style={[styles.emptyText, { marginTop: 12 }]}>Doar administratorii clubului pot vedea echipa de staff.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        <View style={styles.pageHeader}>
          <Text style={styles.pageTitle}>Staff & membri</Text>
          <Text style={styles.pageSub}>Membrii clubului {selectedClub?.name || ""}: roluri, cereri de alăturare, invitații.</Text>
        </View>

        {/* Stat Cards */}
        <View style={styles.statsGrid}>
           <StatCard icon="Users" label="Membri activi" val={String(activeMembers.length)} iColor={C.blue} />
           <StatCard icon="UserCog" label="Staff tehnic" val={String(staffMembers.length)} iColor={C.purple} />
           <StatCard icon="UserPlus" label="Cereri în așteptare" val={String(pendingMembers.length)} iColor={C.amber} />
        </View>

        {/* Cod de înregistrare jucători */}
        {!!selectedClub?.joinCode && (
          <View style={styles.codeCard}>
            <View style={{ flex: 1 }}>
              <Text style={styles.codeCardLabel}>COD DE ÎNREGISTRARE JUCĂTORI</Text>
              <Text style={styles.codeCardValue}>{selectedClub.joinCode}</Text>
              <Text style={styles.codeCardHint}>Dă acest cod jucătorilor — îl introduc la „Înregistrare jucător” și intră direct în club.</Text>
            </View>
            <Pressable
              onPress={() => {
                if (Platform.OS === "web" && navigator?.clipboard) {
                  navigator.clipboard.writeText(selectedClub.joinCode);
                  notify("Copiat", "Codul a fost copiat în clipboard.");
                } else {
                  notify("Cod club", selectedClub.joinCode);
                }
              }}
              style={styles.codeCopyBtn}
            >
              <LucideIcons.Copy size={16} color={C.cyan} />
            </Pressable>
          </View>
        )}

        {isOwner && (
          <Pressable style={styles.inviteBtn} onPress={() => setInviteOpen(true)}>
            <LucideIcons.Mail size={16} color="white" />
            <Text style={styles.inviteBtnText}>Invită membru (staff)</Text>
          </Pressable>
        )}

        {/* Pending requests */}
        {pendingMembers.length > 0 && (
          <View style={[styles.cardMain, { borderColor: C.amber + "40" }]}>
            <Text style={styles.cardTitle}>CERERI DE ALĂTURARE ({pendingMembers.length})</Text>
            {pendingMembers.map((member) => (
              <View key={member.membershipId} style={styles.memberRow}>
                <View style={styles.avatar}><LucideIcons.User size={14} color="white" /></View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={styles.memberName}>{member.name}</Text>
                  <Text style={styles.memberMeta}>{member.email} • cere rol: {ROLE_LABELS[member.role]?.label || member.role}</Text>
                </View>
                {isOwner && (
                  <View style={{ flexDirection: "row", gap: 8 }}>
                    <Pressable
                      onPress={() => approve(member)}
                      disabled={busyId === member.membershipId}
                      style={[styles.smallBtn, { backgroundColor: C.green + "18" }]}
                    >
                      <LucideIcons.Check size={13} color={C.green} />
                      <Text style={[styles.smallBtnText, { color: C.green }]}>Aprobă</Text>
                    </Pressable>
                    <Pressable
                      onPress={() => reject(member)}
                      disabled={busyId === member.membershipId}
                      style={[styles.smallBtn, { backgroundColor: C.red + "15" }]}
                    >
                      <LucideIcons.X size={13} color={C.red} />
                      <Text style={[styles.smallBtnText, { color: C.red }]}>Respinge</Text>
                    </Pressable>
                  </View>
                )}
              </View>
            ))}
          </View>
        )}

        {/* Members list */}
        <View style={[styles.cardMain, { marginTop: 16 }]}>
          <Text style={styles.cardTitle}>MEMBRII CLUBULUI ({activeMembers.length})</Text>

          {isLoading && <Text style={styles.emptyText}>Se încarcă membrii...</Text>}

          {!isLoading && activeMembers.length === 0 && (
            <View style={styles.emptyBox}>
              <LucideIcons.Users size={30} color={C.dim} />
              <Text style={styles.emptyText}>Niciun membru activ încă. Invită colegii cu butonul de mai sus.</Text>
            </View>
          )}

          {activeMembers.map((member) => {
            const roleInfo = ROLE_LABELS[member.role] || { label: member.role?.toUpperCase() || "—", color: C.muted };
            const isSelf = member.userId === currentUser?.id;
            return (
              <View key={member.membershipId} style={styles.memberRow}>
                <View style={styles.avatar}><LucideIcons.User size={14} color="white" /></View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={styles.memberName}>{member.name}{isSelf ? " (tu)" : ""}</Text>
                  <Text style={styles.memberMeta} numberOfLines={1}>
                    {member.email}{member.assignedGroups?.length ? ` • ${member.assignedGroups.join(", ")}` : ""}
                  </Text>
                </View>
                <View style={[styles.roleBadge, { backgroundColor: roleInfo.color + "15" }]}>
                  <Text style={[styles.roleBadgeText, { color: roleInfo.color }]}>{roleInfo.label}</Text>
                </View>
                {isOwner && !isSelf && member.role !== "club_owner" && (
                  <Pressable
                    onPress={() => reject(member)}
                    disabled={busyId === member.membershipId}
                    style={styles.deleteBtn}
                  >
                    <LucideIcons.Trash2 size={14} color={C.dim} />
                  </Pressable>
                )}
              </View>
            );
          })}
        </View>

      </ScrollView>

      <InviteModal visible={inviteOpen} onClose={() => setInviteOpen(false)} onSend={sendInvite} />
    </View>
  );
}

function InviteModal({ visible, onClose, onSend }) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("coach");

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalCard}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Invită membru</Text>
            <Pressable onPress={onClose}><LucideIcons.X size={18} color={C.muted} /></Pressable>
          </View>

          <Text style={styles.modalLabel}>EMAIL</Text>
          <TextInput
            style={styles.modalInput}
            value={email}
            onChangeText={setEmail}
            placeholder="coleg@email.com"
            placeholderTextColor={C.dim}
            autoCapitalize="none"
            keyboardType="email-address"
          />

          <Text style={styles.modalLabel}>ROL</Text>
          <View style={{ flexDirection: "row", gap: 8, marginBottom: 16 }}>
            {INVITE_ROLES.map((r) => (
              <Pressable
                key={r.value}
                onPress={() => setRole(r.value)}
                style={[styles.roleChip, role === r.value && { borderColor: C.cyan, backgroundColor: C.cyan + "10" }]}
              >
                <Text style={[styles.roleChipText, role === r.value && { color: C.cyan }]}>{r.label}</Text>
              </Pressable>
            ))}
          </View>

          <Text style={styles.modalHint}>
            Invitația generează un cod pe care persoana îl introduce în ecranul „Alătură-te unui club" după ce își creează cont cu acest email.
          </Text>

          <Pressable style={styles.modalSaveBtn} onPress={() => onSend(email.trim().toLowerCase(), role)}>
            <LucideIcons.Send size={15} color="white" />
            <Text style={styles.modalSaveText}>Generează invitația</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const StatCard = ({ icon, label, val, iColor }) => {
  const Icon = LucideIcons[icon] || LucideIcons.Circle;
  return (
    <View style={styles.statCard}>
       <View style={[styles.statIconWrap, { backgroundColor: iColor + "10", borderColor: iColor + "30" }]}>
          <Icon size={20} color={iColor} />
       </View>
       <View style={{ marginLeft: 12 }}>
          <Text style={styles.statVal}>{val}</Text>
          <Text style={styles.statLabel}>{label}</Text>
       </View>
    </View>
  );
};

const styles = themedStyles((C) => StyleSheet.create({
  container: { flex: 1, backgroundColor: "transparent" },
  scrollContent: { padding: 18, paddingBottom: 60 },

  pageHeader: { marginBottom: 24 },
  pageTitle: { color: C.text, fontSize: 26, fontWeight: '900', letterSpacing: -0.5 },
  pageSub: { color: C.muted, fontSize: 13, fontWeight: '600', marginTop: 3 },

  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 16 },
  statCard: { flexBasis: 160, flexGrow: 1, backgroundColor: C.card, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: C.line, flexDirection: 'row', alignItems: 'center' },
  statIconWrap: { width: 38, height: 38, borderRadius: 10, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  statVal: { color: C.text, fontSize: 18, fontWeight: '900' },
  statLabel: { color: C.muted, fontSize: 9.5, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 1 },

  inviteBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: C.blue, height: 44, borderRadius: 12, marginBottom: 16 },
  inviteBtnText: { color: C.text, fontSize: 12, fontWeight: '900' },
  codeCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.cyan + "0C", borderWidth: 1, borderColor: C.cyan + "30", borderRadius: 14, padding: 14, marginBottom: 16 },
  codeCardLabel: { color: C.muted, fontSize: 8.5, fontWeight: '900', letterSpacing: 0.8 },
  codeCardValue: { color: C.cyan, fontSize: 22, fontWeight: '900', letterSpacing: 2, marginTop: 2 },
  codeCardHint: { color: C.dim, fontSize: 9.5, fontWeight: '600', marginTop: 4, lineHeight: 13 },
  codeCopyBtn: { width: 40, height: 40, borderRadius: 10, backgroundColor: C.cyan + "15", alignItems: 'center', justifyContent: 'center' },

  cardMain: { backgroundColor: C.card, borderRadius: 18, padding: 16, borderWidth: 1, borderColor: C.line },
  cardTitle: { color: C.text, fontSize: 12.5, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 12 },
  emptyBox: { alignItems: 'center', gap: 10, paddingVertical: 26 },
  emptyText: { color: C.muted, fontSize: 11.5, fontWeight: '600', textAlign: 'center', lineHeight: 17 },

  memberRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 11, borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.04)" },
  avatar: { width: 30, height: 30, borderRadius: 15, backgroundColor: "rgba(255,255,255,0.08)", alignItems: 'center', justifyContent: 'center' },
  memberName: { color: C.text, fontSize: 12, fontWeight: '800' },
  memberMeta: { color: C.dim, fontSize: 9.5, fontWeight: '600', marginTop: 1 },
  roleBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, marginLeft: 10 },
  roleBadgeText: { fontSize: 8, fontWeight: '900' },
  deleteBtn: { padding: 8, marginLeft: 4 },
  smallBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, height: 30, borderRadius: 8 },
  smallBtnText: { fontSize: 9.5, fontWeight: '900' },

  modalOverlay: { flex: 1, backgroundColor: C.isDark ? "rgba(0,0,0,0.72)" : "rgba(9,9,11,0.45)", alignItems: 'center', justifyContent: 'center', padding: 20 },
  modalCard: { width: '100%', maxWidth: 420, backgroundColor: C.card, borderRadius: 18, padding: 20, borderWidth: 1, borderColor: C.line },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  modalTitle: { color: C.text, fontSize: 15, fontWeight: '900' },
  modalLabel: { color: C.muted, fontSize: 9, fontWeight: '900', letterSpacing: 1, marginBottom: 6, marginTop: 4 },
  modalInput: { backgroundColor: C.bgSecondary, borderWidth: 1, borderColor: C.line, color: C.text, borderRadius: 10, paddingHorizontal: 12, height: 42, fontSize: 12, fontWeight: '600', marginBottom: 12 },
  modalHint: { color: C.dim, fontSize: 10, fontWeight: '600', lineHeight: 15, marginBottom: 16 },
  roleChip: { flex: 1, height: 36, borderRadius: 10, borderWidth: 1, borderColor: "rgba(255,255,255,0.1)", alignItems: 'center', justifyContent: 'center' },
  roleChipText: { color: C.muted, fontSize: 10, fontWeight: '900' },
  modalSaveBtn: { height: 46, borderRadius: 12, backgroundColor: C.blue, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  modalSaveText: { color: C.text, fontSize: 12, fontWeight: '900' },
}));
