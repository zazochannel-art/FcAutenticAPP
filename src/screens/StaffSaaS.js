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
import { colors as C } from "../constants/theme";

// --- Premium Palette ---
const BG_DARK = C.bg;
const CARD_BG = C.card;
const BORDER_COLOR = C.line;
const CYAN = C.cyan;
const VIOLET = C.purple;
const AMBER = C.amber;
const GREEN = C.green;
const RED = C.red;
const BLUE_ACCENT = C.blue;
const TEXT_DIM = C.muted;
const TEXT_TH = C.dim;

const ROLE_LABELS = {
  club_owner: { label: "OWNER", color: CYAN },
  admin: { label: "ADMIN", color: BLUE_ACCENT },
  coach: { label: "ANTRENOR", color: GREEN },
  staff: { label: "STAFF", color: VIOLET },
  player: { label: "JUCĂTOR", color: TEXT_DIM },
  parent: { label: "PĂRINTE", color: AMBER },
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
        <LucideIcons.Lock size={34} color={TEXT_TH} />
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
           <StatCard icon="Users" label="Membri activi" val={String(activeMembers.length)} iColor={BLUE_ACCENT} />
           <StatCard icon="UserCog" label="Staff tehnic" val={String(staffMembers.length)} iColor={VIOLET} />
           <StatCard icon="UserPlus" label="Cereri în așteptare" val={String(pendingMembers.length)} iColor={AMBER} />
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
              <LucideIcons.Copy size={16} color={CYAN} />
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
          <View style={[styles.cardMain, { borderColor: AMBER + "40" }]}>
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
                      style={[styles.smallBtn, { backgroundColor: GREEN + "18" }]}
                    >
                      <LucideIcons.Check size={13} color={GREEN} />
                      <Text style={[styles.smallBtnText, { color: GREEN }]}>Aprobă</Text>
                    </Pressable>
                    <Pressable
                      onPress={() => reject(member)}
                      disabled={busyId === member.membershipId}
                      style={[styles.smallBtn, { backgroundColor: RED + "15" }]}
                    >
                      <LucideIcons.X size={13} color={RED} />
                      <Text style={[styles.smallBtnText, { color: RED }]}>Respinge</Text>
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
              <LucideIcons.Users size={30} color={TEXT_TH} />
              <Text style={styles.emptyText}>Niciun membru activ încă. Invită colegii cu butonul de mai sus.</Text>
            </View>
          )}

          {activeMembers.map((member) => {
            const roleInfo = ROLE_LABELS[member.role] || { label: member.role?.toUpperCase() || "—", color: TEXT_DIM };
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
                    <LucideIcons.Trash2 size={14} color={TEXT_TH} />
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
            <Pressable onPress={onClose}><LucideIcons.X size={18} color={TEXT_DIM} /></Pressable>
          </View>

          <Text style={styles.modalLabel}>EMAIL</Text>
          <TextInput
            style={styles.modalInput}
            value={email}
            onChangeText={setEmail}
            placeholder="coleg@email.com"
            placeholderTextColor={TEXT_TH}
            autoCapitalize="none"
            keyboardType="email-address"
          />

          <Text style={styles.modalLabel}>ROL</Text>
          <View style={{ flexDirection: "row", gap: 8, marginBottom: 16 }}>
            {INVITE_ROLES.map((r) => (
              <Pressable
                key={r.value}
                onPress={() => setRole(r.value)}
                style={[styles.roleChip, role === r.value && { borderColor: CYAN, backgroundColor: CYAN + "10" }]}
              >
                <Text style={[styles.roleChipText, role === r.value && { color: CYAN }]}>{r.label}</Text>
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

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG_DARK },
  scrollContent: { padding: 18, paddingBottom: 60 },

  pageHeader: { marginBottom: 24 },
  pageTitle: { color: 'white', fontSize: 26, fontWeight: '900', letterSpacing: -0.5 },
  pageSub: { color: TEXT_DIM, fontSize: 13, fontWeight: '600', marginTop: 3 },

  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 16 },
  statCard: { flexBasis: 160, flexGrow: 1, backgroundColor: CARD_BG, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: BORDER_COLOR, flexDirection: 'row', alignItems: 'center' },
  statIconWrap: { width: 38, height: 38, borderRadius: 10, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  statVal: { color: 'white', fontSize: 18, fontWeight: '900' },
  statLabel: { color: TEXT_DIM, fontSize: 9.5, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 1 },

  inviteBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: BLUE_ACCENT, height: 44, borderRadius: 12, marginBottom: 16 },
  inviteBtnText: { color: 'white', fontSize: 12, fontWeight: '900' },
  codeCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: CYAN + "0C", borderWidth: 1, borderColor: CYAN + "30", borderRadius: 14, padding: 14, marginBottom: 16 },
  codeCardLabel: { color: TEXT_DIM, fontSize: 8.5, fontWeight: '900', letterSpacing: 0.8 },
  codeCardValue: { color: CYAN, fontSize: 22, fontWeight: '900', letterSpacing: 2, marginTop: 2 },
  codeCardHint: { color: TEXT_TH, fontSize: 9.5, fontWeight: '600', marginTop: 4, lineHeight: 13 },
  codeCopyBtn: { width: 40, height: 40, borderRadius: 10, backgroundColor: CYAN + "15", alignItems: 'center', justifyContent: 'center' },

  cardMain: { backgroundColor: CARD_BG, borderRadius: 18, padding: 16, borderWidth: 1, borderColor: BORDER_COLOR },
  cardTitle: { color: 'white', fontSize: 12.5, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 12 },
  emptyBox: { alignItems: 'center', gap: 10, paddingVertical: 26 },
  emptyText: { color: TEXT_DIM, fontSize: 11.5, fontWeight: '600', textAlign: 'center', lineHeight: 17 },

  memberRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 11, borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.04)" },
  avatar: { width: 30, height: 30, borderRadius: 15, backgroundColor: "rgba(255,255,255,0.08)", alignItems: 'center', justifyContent: 'center' },
  memberName: { color: 'white', fontSize: 12, fontWeight: '800' },
  memberMeta: { color: TEXT_TH, fontSize: 9.5, fontWeight: '600', marginTop: 1 },
  roleBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, marginLeft: 10 },
  roleBadgeText: { fontSize: 8, fontWeight: '900' },
  deleteBtn: { padding: 8, marginLeft: 4 },
  smallBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, height: 30, borderRadius: 8 },
  smallBtnText: { fontSize: 9.5, fontWeight: '900' },

  modalOverlay: { flex: 1, backgroundColor: "rgba(2,6,23,0.85)", alignItems: 'center', justifyContent: 'center', padding: 20 },
  modalCard: { width: '100%', maxWidth: 420, backgroundColor: "#071127", borderRadius: 18, padding: 20, borderWidth: 1, borderColor: BORDER_COLOR },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  modalTitle: { color: 'white', fontSize: 15, fontWeight: '900' },
  modalLabel: { color: TEXT_DIM, fontSize: 9, fontWeight: '900', letterSpacing: 1, marginBottom: 6, marginTop: 4 },
  modalInput: { backgroundColor: "rgba(2,6,23,0.6)", borderWidth: 1, borderColor: "#1e293b", color: 'white', borderRadius: 10, paddingHorizontal: 12, height: 42, fontSize: 12, fontWeight: '600', marginBottom: 12 },
  modalHint: { color: TEXT_TH, fontSize: 10, fontWeight: '600', lineHeight: 15, marginBottom: 16 },
  roleChip: { flex: 1, height: 36, borderRadius: 10, borderWidth: 1, borderColor: "rgba(255,255,255,0.1)", alignItems: 'center', justifyContent: 'center' },
  roleChipText: { color: TEXT_DIM, fontSize: 10, fontWeight: '900' },
  modalSaveBtn: { height: 46, borderRadius: 12, backgroundColor: BLUE_ACCENT, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  modalSaveText: { color: 'white', fontSize: 12, fontWeight: '900' },
});
