import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  TextInput,
  Modal,
  ActivityIndicator,
  Platform,
  Alert
} from "react-native";
import * as LucideIcons from "lucide-react-native";
import { useQuery } from "@tanstack/react-query";
import { supabaseService } from "../services/supabaseService";

// --- Premium Palette ---
const BG_DARK = "#020812";
const CARD_BG = "rgba(4, 18, 32, 0.78)";
const BORDER_COLOR = "rgba(0, 212, 255, 0.12)";
const CYAN = "#00D4FF";
const VIOLET = "#7C3AED";
const AMBER = "#FACC15";
const GREEN = "#22C55E";
const RED = "#EF4444";
const BLUE_ACCENT = "#0D8BFF";
const TEXT_DIM = "#94A3B8";
const TEXT_TH = "#475569";

// Prețurile de listă ale planurilor — pentru MRR-ul estimat (nu există încă facturare reală).
const PLAN_PRICES = { Free: 0, Starter: 299, Basic: 299, Pro: 599, Elite: 999, Academy: 999 };
const PLAN_COLORS = { Free: TEXT_DIM, Starter: BLUE_ACCENT, Basic: BLUE_ACCENT, Pro: VIOLET, Elite: AMBER, Academy: AMBER };

function notify(title, msg) {
  if (Platform.OS === "web") window.alert(`${title}\n\n${msg}`);
  else Alert.alert(title, msg);
}

function formatDate(value) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("ro-RO", { day: "numeric", month: "short", year: "numeric" });
}

export default function SaasAdminScreen({ clubs = [], onCreateClub }) {
  const [inviteModal, setInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteClubId, setInviteClubId] = useState(null);
  const [loading, setLoading] = useState(false);

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
    memberships.forEach((m) => {
      if (m.status === "active" && map[m.club_id]) map[m.club_id].users += 1;
    });
    allPlayers.forEach((p) => {
      if (map[p.club_id]) map[p.club_id].players += 1;
    });
    return map;
  }, [clubs, memberships, allPlayers]);

  const activeSubscriptions = subscriptions.filter((s) => s.status === "active");
  const mrrEstimate = activeSubscriptions.reduce((sum, s) => sum + (PLAN_PRICES[s.planName] || 0), 0);

  const planDistribution = useMemo(() => {
    const counts = {};
    activeSubscriptions.forEach((s) => {
      const plan = s.planName || "Free";
      counts[plan] = (counts[plan] || 0) + 1;
    });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  }, [activeSubscriptions]);

  const subscriptionByClub = (clubId) => subscriptions.find((s) => (s.clubId || s.club_id) === clubId);

  const handleInvite = async () => {
    if (!inviteEmail.includes("@")) {
      notify("Email invalid", "Introdu o adresă de email validă.");
      return;
    }
    const targetClub = inviteClubId || clubs[0]?.id;
    if (!targetClub) {
      notify("Fără club", "Creează mai întâi un club pentru care să inviți un owner.");
      return;
    }
    setLoading(true);
    try {
      const invitation = await supabaseService.inviteOwner(inviteEmail.trim().toLowerCase(), targetClub);
      setInviteEmail("");
      setInviteModal(false);
      notify(
        "Invitație creată",
        `Trimite-i persoanei codul de invitație:\n\n${invitation.token}\n\nÎl introduce în ecranul „Alătură-te unui club”.`
      );
    } catch (error) {
      notify("Eroare", error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        <View style={styles.pageHeader}>
          <Text style={styles.pageTitle}>Admin SaaS</Text>
          <Text style={styles.pageSub}>Gestionează cluburile, abonamentele și starea platformei.</Text>
        </View>

        {/* Statistici reale */}
        <View style={styles.statsGrid}>
           <StatCard icon="Building2" label="Cluburi active" val={String(clubs.filter((c) => !c.blocked).length)} sub={`${clubs.length} în total`} iColor={CYAN} />
           <StatCard icon="Users" label="Utilizatori" val={String(overview?.usersCount ?? "—")} sub="conturi în platformă" iColor={VIOLET} />
           <StatCard icon="CreditCard" label="Abonamente active" val={String(activeSubscriptions.length)} sub={`${subscriptions.length} în total`} iColor={BLUE_ACCENT} />
           <StatCard icon="Wallet" label="MRR estimat" val={`${mrrEstimate.toLocaleString("ro-RO")} lei`} sub="din prețurile de listă ale planurilor" iColor={GREEN} />
        </View>

        {/* Acțiuni rapide */}
        <View style={styles.actionsList}>
           <ActionBtn icon="Plus" label="Creează club" color={CYAN} onPress={onCreateClub} />
           <ActionBtn icon="UserPlus" label="Invită owner" color={VIOLET} onPress={() => setInviteModal(true)} />
        </View>

        <View style={styles.middleGrid}>
          {/* Tabelul cluburilor */}
          <View style={styles.colLeft}>
            <View style={styles.cardMain}>
              <Text style={styles.cardTitle}>CLUBURI ÎN PLATFORMĂ ({clubs.length})</Text>

              {clubs.length === 0 && (
                <View style={styles.emptyBox}>
                  <LucideIcons.Building2 size={26} color={TEXT_TH} />
                  <Text style={styles.emptyText}>Niciun club în platformă încă.</Text>
                </View>
              )}

              {clubs.length > 0 && (
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={{ minWidth: 640, flexGrow: 1 }}>
                    <View style={styles.tableHeader}>
                      <Text style={[styles.th, { flex: 2 }]}>Club</Text>
                      <Text style={[styles.th, { flex: 1 }]}>Plan</Text>
                      <Text style={[styles.th, { width: 70, textAlign: 'center' }]}>Utilizatori</Text>
                      <Text style={[styles.th, { width: 60, textAlign: 'center' }]}>Jucători</Text>
                      <Text style={[styles.th, { flex: 1.3 }]}>Expiră</Text>
                      <Text style={[styles.th, { flex: 1 }]}>Status</Text>
                    </View>
                    {clubs.map((club) => {
                      const stats = perClub[club.id] || { users: 0, players: 0 };
                      const sub = subscriptionByClub(club.id);
                      const plan = sub?.planName || club.plan || "Free";
                      return (
                        <View key={club.id} style={styles.tableRow}>
                          <View style={{ flex: 2, flexDirection: 'row', alignItems: 'center' }}>
                            <View style={styles.miniLogo}><LucideIcons.Shield size={12} color="white" /></View>
                            <View style={{ marginLeft: 10, flex: 1 }}>
                              <Text style={styles.rowMainText} numberOfLines={1}>{club.name}</Text>
                              <Text style={styles.rowSubText} numberOfLines={1}>{club.city ? `${club.city}${club.country ? ", " + club.country : ""}` : (club.email || "—")}</Text>
                            </View>
                          </View>
                          <Text style={[styles.planLabel, { color: PLAN_COLORS[plan] || TEXT_DIM, flex: 1 }]}>{plan}</Text>
                          <Text style={[styles.rowSubText, { width: 70, textAlign: 'center' }]}>{stats.users}</Text>
                          <Text style={[styles.rowSubText, { width: 60, textAlign: 'center' }]}>{stats.players}</Text>
                          <Text style={[styles.rowSubText, { flex: 1.3 }]}>{formatDate(sub?.expiresAt)}</Text>
                          <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                            <View style={[styles.statusDot, { backgroundColor: club.blocked ? RED : GREEN }]} />
                            <Text style={[styles.rowSubText, club.blocked && { color: RED }]}>{club.blocked ? "Blocat" : "Activ"}</Text>
                          </View>
                        </View>
                      );
                    })}
                  </View>
                </ScrollView>
              )}
            </View>
          </View>

          {/* Sidebar */}
          <View style={styles.colRight}>
            <View style={styles.cardSide}>
              <Text style={styles.cardTitle}>ABONAMENTE</Text>
              {subscriptions.length === 0 && (
                <Text style={styles.emptyText}>Niciun abonament înregistrat.</Text>
              )}
              {subscriptions.map((sub) => {
                const club = clubs.find((c) => c.id === (sub.clubId || sub.club_id));
                return (
                  <View key={sub.id} style={styles.subRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.rowMainText} numberOfLines={1}>{club?.name || "Club"}</Text>
                      <Text style={styles.rowSubText}>din {formatDate(sub.startedAt)}</Text>
                    </View>
                    <View style={[styles.planBadge, { backgroundColor: (PLAN_COLORS[sub.planName] || TEXT_DIM) + "15" }]}>
                      <Text style={[styles.planBadgeText, { color: PLAN_COLORS[sub.planName] || TEXT_DIM }]}>{sub.planName}</Text>
                    </View>
                    <View style={[styles.statusDot, { backgroundColor: sub.status === "active" ? GREEN : AMBER, marginLeft: 8 }]} />
                  </View>
                );
              })}
            </View>

            <View style={[styles.cardSide, { marginTop: 16 }]}>
              <Text style={styles.cardTitle}>DISTRIBUȚIE PLANURI</Text>
              {planDistribution.length === 0 && (
                <Text style={styles.emptyText}>Fără abonamente active.</Text>
              )}
              {planDistribution.map(([plan, count]) => {
                const per = activeSubscriptions.length ? count / activeSubscriptions.length : 0;
                const color = PLAN_COLORS[plan] || TEXT_DIM;
                return (
                  <View key={plan} style={{ marginBottom: 12 }}>
                    <View style={styles.distLabelRow}>
                      <Text style={[styles.rowMainText, { color }]}>{plan}</Text>
                      <Text style={styles.rowSubText}>{count} ({Math.round(per * 100)}%)</Text>
                    </View>
                    <View style={styles.distBarBg}>
                      <View style={[styles.distBarFill, { width: `${Math.round(per * 100)}%`, backgroundColor: color }]} />
                    </View>
                  </View>
                );
              })}
            </View>

            <View style={[styles.cardSide, { marginTop: 16 }]}>
              <Text style={styles.cardTitle}>REZUMAT PLATFORMĂ</Text>
              <SummaryLine icon="Users" label="Membri activi în cluburi" value={String(memberships.filter((m) => m.status === "active").length)} />
              <SummaryLine icon="Clock" label="Cereri de alăturare în așteptare" value={String(memberships.filter((m) => m.status === "pending").length)} />
              <SummaryLine icon="Volleyball" label="Jucători înregistrați" value={String(allPlayers.length)} />
              <SummaryLine icon="ShieldOff" label="Cluburi blocate" value={String(clubs.filter((c) => c.blocked).length)} />
            </View>
          </View>
        </View>

      </ScrollView>

      {/* Invite modal */}
      <Modal visible={inviteModal} transparent animationType="fade" onRequestClose={() => setInviteModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Invită owner de club</Text>
              <Pressable onPress={() => setInviteModal(false)}><LucideIcons.X size={18} color={TEXT_DIM} /></Pressable>
            </View>

            <Text style={styles.modalLabel}>EMAIL</Text>
            <TextInput
              style={styles.modalInput}
              value={inviteEmail}
              onChangeText={setInviteEmail}
              placeholder="owner@club.com"
              placeholderTextColor={TEXT_TH}
              autoCapitalize="none"
              keyboardType="email-address"
            />

            <Text style={styles.modalLabel}>CLUB</Text>
            <View style={{ gap: 6, marginBottom: 16 }}>
              {clubs.map((club) => (
                <Pressable
                  key={club.id}
                  onPress={() => setInviteClubId(club.id)}
                  style={[styles.clubOption, (inviteClubId || clubs[0]?.id) === club.id && { borderColor: CYAN, backgroundColor: CYAN + "08" }]}
                >
                  <Text style={styles.rowMainText}>{club.name}</Text>
                  {(inviteClubId || clubs[0]?.id) === club.id && <LucideIcons.Check size={14} color={CYAN} />}
                </Pressable>
              ))}
            </View>

            <Pressable style={[styles.modalSaveBtn, loading && { opacity: 0.7 }]} onPress={handleInvite} disabled={loading}>
              {loading ? <ActivityIndicator size="small" color="white" /> : (
                <>
                  <LucideIcons.Send size={15} color="white" />
                  <Text style={styles.modalSaveText}>Generează invitația</Text>
                </>
              )}
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const StatCard = ({ icon, label, val, sub, iColor }) => {
  const Icon = LucideIcons[icon] || LucideIcons.Circle;
  return (
    <View style={styles.statCard}>
       <View style={[styles.statIconWrap, { backgroundColor: iColor + "10", borderColor: iColor + "30" }]}>
          <Icon size={20} color={iColor} />
       </View>
       <View style={{ marginLeft: 12, flex: 1 }}>
          <Text style={styles.statVal} numberOfLines={1}>{val}</Text>
          <Text style={styles.statLabel}>{label}</Text>
          <Text style={styles.statSub} numberOfLines={1}>{sub}</Text>
       </View>
    </View>
  );
};

const ActionBtn = ({ icon, label, color, onPress }) => {
  const Icon = LucideIcons[icon] || LucideIcons.Circle;
  return (
    <Pressable onPress={onPress || (() => notify("În lucru", `${label} va fi conectat în următoarea etapă.`))} style={styles.actionBtn}>
       <Icon size={15} color={color} />
       <Text style={styles.actionBtnText}>{label}</Text>
    </Pressable>
  );
};

const SummaryLine = ({ icon, label, value }) => {
  const Icon = LucideIcons[icon] || LucideIcons.Circle;
  return (
    <View style={styles.summaryLine}>
      <Icon size={14} color={TEXT_DIM} />
      <Text style={styles.summaryLabel}>{label}</Text>
      <Text style={styles.summaryValue}>{value}</Text>
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
  statCard: { flexBasis: 180, flexGrow: 1, backgroundColor: CARD_BG, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: BORDER_COLOR, flexDirection: 'row', alignItems: 'center' },
  statIconWrap: { width: 38, height: 38, borderRadius: 10, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  statVal: { color: 'white', fontSize: 16, fontWeight: '900' },
  statLabel: { color: TEXT_DIM, fontSize: 9.5, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.4, marginTop: 1 },
  statSub: { color: TEXT_TH, fontSize: 8.5, fontWeight: '700', marginTop: 1 },

  actionsList: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16 },
  actionBtn: { flexBasis: 170, flexGrow: 1, height: 42, backgroundColor: "rgba(15,23,42,0.4)", borderRadius: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderWidth: 1, borderColor: "rgba(255,255,255,0.06)" },
  actionBtnText: { color: 'white', fontSize: 11, fontWeight: '800' },

  middleGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 14 },
  colLeft: { flexBasis: 380, flexGrow: 1.6 },
  colRight: { flexBasis: 280, flexGrow: 1 },

  cardMain: { backgroundColor: CARD_BG, borderRadius: 18, padding: 16, borderWidth: 1, borderColor: BORDER_COLOR },
  cardSide: { backgroundColor: CARD_BG, borderRadius: 18, padding: 16, borderWidth: 1, borderColor: BORDER_COLOR },
  cardTitle: { color: 'white', fontSize: 12.5, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 12 },
  emptyBox: { alignItems: 'center', gap: 10, paddingVertical: 26 },
  emptyText: { color: TEXT_DIM, fontSize: 11, fontWeight: '600', lineHeight: 16 },

  tableHeader: { flexDirection: 'row', paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.05)", marginBottom: 4 },
  th: { color: TEXT_TH, fontSize: 8.5, fontWeight: "900", textTransform: "uppercase", letterSpacing: 0.8 },
  tableRow: { flexDirection: 'row', alignItems: 'center', minHeight: 54, borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.03)" },
  miniLogo: { width: 26, height: 26, borderRadius: 8, backgroundColor: "rgba(255,255,255,0.05)", alignItems: 'center', justifyContent: 'center' },
  rowMainText: { color: 'white', fontSize: 11, fontWeight: '800' },
  rowSubText: { color: TEXT_TH, fontSize: 9.5, fontWeight: '600' },
  planLabel: { fontSize: 10.5, fontWeight: '900' },
  statusDot: { width: 6, height: 6, borderRadius: 3 },

  subRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.03)" },
  planBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  planBadgeText: { fontSize: 8.5, fontWeight: '900' },

  distLabelRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 },
  distBarBg: { height: 6, backgroundColor: "rgba(255,255,255,0.05)", borderRadius: 3, overflow: 'hidden' },
  distBarFill: { height: '100%', borderRadius: 3 },

  summaryLine: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 9, borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.03)" },
  summaryLabel: { flex: 1, color: TEXT_DIM, fontSize: 10.5, fontWeight: '700' },
  summaryValue: { color: 'white', fontSize: 12, fontWeight: '900' },

  modalOverlay: { flex: 1, backgroundColor: "rgba(2,6,23,0.85)", alignItems: 'center', justifyContent: 'center', padding: 20 },
  modalCard: { width: '100%', maxWidth: 420, backgroundColor: "#071127", borderRadius: 18, padding: 20, borderWidth: 1, borderColor: BORDER_COLOR },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  modalTitle: { color: 'white', fontSize: 15, fontWeight: '900' },
  modalLabel: { color: TEXT_DIM, fontSize: 9, fontWeight: '900', letterSpacing: 1, marginBottom: 6, marginTop: 4 },
  modalInput: { backgroundColor: "rgba(2,6,23,0.6)", borderWidth: 1, borderColor: "#1e293b", color: 'white', borderRadius: 10, paddingHorizontal: 12, height: 42, fontSize: 12, fontWeight: '600', marginBottom: 12 },
  clubOption: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12, height: 40, borderRadius: 10, borderWidth: 1, borderColor: "rgba(255,255,255,0.08)" },
  modalSaveBtn: { height: 46, borderRadius: 12, backgroundColor: BLUE_ACCENT, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  modalSaveText: { color: 'white', fontSize: 12, fontWeight: '900' },
});
