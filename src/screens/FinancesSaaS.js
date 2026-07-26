import React, { useMemo, useState } from "react";
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

const MONTH_NAMES = ["Ianuarie", "Februarie", "Martie", "Aprilie", "Mai", "Iunie", "Iulie", "August", "Septembrie", "Octombrie", "Noiembrie", "Decembrie"];

// Ultimele 6 luni ca etichete „Iulie 2026" (cheia folosită în monthly_payments).
function recentMonths(count = 6) {
  const out = [];
  const now = new Date();
  for (let i = 0; i < count; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    out.push(`${MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}`);
  }
  return out;
}

// --- Premium Palette ---
const BG_DARK = C.bg;
const CARD_BG = C.card;
const BORDER_COLOR = C.line;
const CYAN = C.cyan;
const VIOLET = C.purple;
const GREEN = C.green;
const RED = C.red;
const BLUE_ACCENT = C.blue;
const TEXT_DIM = C.muted;
const TEXT_TH = C.dim;

function notify(title, msg) {
  if (Platform.OS === "web") window.alert(`${title}\n\n${msg}`);
  else Alert.alert(title, msg);
}

function money(value) {
  return `${Number(value || 0).toLocaleString("ro-RO")} lei`;
}

export default function FinancesSaaS({ transactions = [], players = [], selectedClub, clubId, currentUser }) {
  const queryClient = useQueryClient();
  const [view, setView] = useState("transactions");
  const [addOpen, setAddOpen] = useState(false);
  const [filter, setFilter] = useState("Toate");
  const [busyId, setBusyId] = useState(null);

  const canManage = ["super_admin", "club_owner", "admin"].includes(currentUser?.role);

  const refresh = () => queryClient.invalidateQueries({ queryKey: ["transactions"] });

  const totals = useMemo(() => {
    const income = transactions.filter((t) => t.positive).reduce((s, t) => s + Number(t.value || 0), 0);
    const expenses = transactions.filter((t) => !t.positive).reduce((s, t) => s + Number(t.value || 0), 0);
    return { income, expenses, balance: income - expenses };
  }, [transactions]);

  const visible = transactions.filter((t) => {
    if (filter === "Venituri") return t.positive;
    if (filter === "Cheltuieli") return !t.positive;
    return true;
  });

  const save = async (form) => {
    if (!form.label.trim()) {
      notify("Date incomplete", "Completează descrierea tranzacției.");
      return;
    }
    if (!Number(form.value)) {
      notify("Date incomplete", "Completează o sumă validă.");
      return;
    }
    try {
      await supabaseService.insertTransaction({
        label: form.label.trim(),
        value: Math.abs(Number(form.value)),
        positive: form.positive,
        date: form.date.trim() || null,
        clubId,
      });
      setAddOpen(false);
      refresh();
    } catch (e) {
      notify("Eroare", e.message);
    }
  };

  const remove = async (tx) => {
    setBusyId(tx.id);
    try {
      await supabaseService.deleteTransaction(tx.id);
      refresh();
    } catch (e) {
      notify("Eroare", e.message);
    } finally {
      setBusyId(null);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        <View style={styles.pageHeader}>
          <Text style={styles.pageTitle}>Finanțe</Text>
          <Text style={styles.pageSub}>Venituri, cheltuieli și cotizațiile lunare ale jucătorilor.</Text>
        </View>

        {/* View toggle */}
        <View style={styles.segment}>
          {[["transactions", "Tranzacții"], ["fees", "Cotizații"]].map(([key, label]) => (
            <Pressable key={key} onPress={() => setView(key)} style={[styles.segmentBtn, view === key && styles.segmentBtnActive]}>
              <Text style={[styles.segmentText, view === key && { color: CYAN }]}>{label}</Text>
            </Pressable>
          ))}
        </View>

        {view === "fees" ? (
          <FeesModule players={players} selectedClub={selectedClub} clubId={clubId} canManage={canManage} />
        ) : (
        <>
        {/* Stat Cards */}
        <View style={styles.statsGrid}>
           <StatCard icon="ArrowUpCircle" label="Venituri" val={money(totals.income)} iColor={GREEN} />
           <StatCard icon="ArrowDownCircle" label="Cheltuieli" val={money(totals.expenses)} iColor={RED} />
           <StatCard icon="Wallet" label="Sold" val={money(totals.balance)} iColor={totals.balance >= 0 ? CYAN : RED} />
           <StatCard icon="ReceiptText" label="Tranzacții" val={String(transactions.length)} iColor={VIOLET} />
        </View>

        {/* Controls */}
        <View style={styles.controlsRow}>
          {canManage && (
            <Pressable style={styles.addBtn} onPress={() => setAddOpen(true)}>
              <LucideIcons.PlusCircle size={16} color="white" />
              <Text style={styles.addBtnText}>Adaugă tranzacție</Text>
            </Pressable>
          )}
          <View style={{ flexDirection: "row" }}>
            {["Toate", "Venituri", "Cheltuieli"].map((f) => (
              <Pressable key={f} onPress={() => setFilter(f)} style={[styles.filterChip, filter === f && styles.filterChipActive]}>
                <Text style={[styles.filterChipText, filter === f && { color: CYAN }]}>{f}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Transactions */}
        <View style={styles.cardMain}>
          <Text style={styles.cardTitle}>REGISTRUL TRANZACȚIILOR</Text>

          {visible.length === 0 && (
            <View style={styles.emptyBox}>
              <LucideIcons.Wallet size={30} color={TEXT_TH} />
              <Text style={styles.emptyText}>
                {transactions.length === 0
                  ? "Nicio tranzacție încă. Adaugă prima tranzacție cu butonul de mai sus."
                  : "Nicio tranzacție nu corespunde filtrului."}
              </Text>
            </View>
          )}

          {visible.map((tx) => (
            <View key={tx.id} style={styles.txRow}>
              <View style={[styles.txIcon, { backgroundColor: (tx.positive ? GREEN : RED) + "12" }]}>
                {tx.positive
                  ? <LucideIcons.ArrowUpRight size={14} color={GREEN} />
                  : <LucideIcons.ArrowDownRight size={14} color={RED} />}
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.txLabel} numberOfLines={1}>{tx.label}</Text>
                {!!tx.date && <Text style={styles.txDate}>{tx.date}</Text>}
              </View>
              <Text style={[styles.txValue, { color: tx.positive ? GREEN : RED }]}>
                {tx.positive ? "+" : "−"}{money(tx.value)}
              </Text>
              {canManage && (
                <Pressable onPress={() => remove(tx)} disabled={busyId === tx.id} style={styles.deleteBtn}>
                  <LucideIcons.Trash2 size={14} color={TEXT_TH} />
                </Pressable>
              )}
            </View>
          ))}
        </View>
        </>
        )}

      </ScrollView>

      <AddTransactionModal visible={addOpen} onClose={() => setAddOpen(false)} onSave={save} />
    </View>
  );
}

function FeesModule({ players, selectedClub, clubId, canManage }) {
  const queryClient = useQueryClient();
  const months = useMemo(() => recentMonths(6), []);
  const groups = selectedClub?.groups?.length
    ? selectedClub.groups
    : Array.from(new Set(players.map((p) => p.group).filter(Boolean)));

  const [month, setMonth] = useState(months[0]);
  const [group, setGroup] = useState(groups[0] || "");
  const [defaultFee, setDefaultFee] = useState("200");
  const [busyId, setBusyId] = useState(null);

  const { data: payments = {} } = useQuery({
    queryKey: ["monthlyPayments", clubId],
    queryFn: () => supabaseService.getMonthlyPayments(clubId),
    enabled: !!clubId,
  });

  const key = `${month}-${group}`;
  const monthGroupPayments = payments[key] || {};
  const groupPlayers = players.filter((p) => p.group === group);

  const paidCount = groupPlayers.filter((p) => monthGroupPayments[p.id]?.paid).length;
  const collected = groupPlayers.reduce(
    (sum, p) => sum + (monthGroupPayments[p.id]?.paid ? Number(monthGroupPayments[p.id]?.amount || 0) : 0),
    0
  );

  const togglePaid = async (player) => {
    const current = monthGroupPayments[player.id];
    const amount = current?.amount || defaultFee || "0";
    setBusyId(player.id);
    try {
      await supabaseService.saveMonthlyPayment(month, group, player.id, {
        paid: !current?.paid,
        amount,
        paidAt: !current?.paid ? new Date().toISOString().slice(0, 10) : "",
      });
      queryClient.invalidateQueries({ queryKey: ["monthlyPayments"] });
    } catch (e) {
      notify("Eroare", e.message);
    } finally {
      setBusyId(null);
    }
  };

  if (groups.length === 0) {
    return (
      <View style={styles.emptyBox}>
        <LucideIcons.Users size={30} color={TEXT_TH} />
        <Text style={styles.emptyText}>Nu există grupe cu jucători. Adaugă jucători în tab-ul Echipă.</Text>
      </View>
    );
  }

  return (
    <>
      {/* Stat cards cotizații */}
      <View style={styles.statsGrid}>
        <StatCard icon="CircleCheck" label="Plătit" val={`${paidCount}/${groupPlayers.length}`} iColor={GREEN} />
        <StatCard icon="Wallet" label="Încasat luna asta" val={money(collected)} iColor={CYAN} />
        <StatCard icon="Users" label="Jucători în grupă" val={String(groupPlayers.length)} iColor={VIOLET} />
      </View>

      {/* Selectoare lună + grupă */}
      <Text style={styles.feesLabel}>LUNA</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 8 }}>
        {months.map((m) => (
          <Pressable key={m} onPress={() => setMonth(m)} style={[styles.chip, month === m && styles.chipActive]}>
            <Text style={[styles.chipText, month === m && { color: CYAN }]}>{m}</Text>
          </Pressable>
        ))}
      </ScrollView>

      <Text style={styles.feesLabel}>GRUPA</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 8 }}>
        {groups.map((g) => (
          <Pressable key={g} onPress={() => setGroup(g)} style={[styles.chip, group === g && styles.chipActive]}>
            <Text style={[styles.chipText, group === g && { color: CYAN }]}>{g}</Text>
          </Pressable>
        ))}
      </ScrollView>

      {canManage && (
        <View style={styles.feeInputRow}>
          <Text style={styles.feeInputLabel}>Cotizație implicită (lei):</Text>
          <TextInput
            style={styles.feeInput}
            value={defaultFee}
            onChangeText={setDefaultFee}
            keyboardType="numeric"
            placeholder="200"
            placeholderTextColor={TEXT_TH}
          />
        </View>
      )}

      {/* Lista jucătorilor */}
      <View style={styles.cardMain}>
        <Text style={styles.cardTitle}>COTIZAȚII {group} • {month.toUpperCase()}</Text>
        {groupPlayers.length === 0 && (
          <View style={styles.emptyBox}>
            <LucideIcons.UserX size={28} color={TEXT_TH} />
            <Text style={styles.emptyText}>Niciun jucător în grupa {group}.</Text>
          </View>
        )}
        {groupPlayers.map((player) => {
          const p = monthGroupPayments[player.id];
          const paid = !!p?.paid;
          return (
            <View key={player.id} style={styles.feeRow}>
              <View style={styles.feeAvatar}><LucideIcons.User size={13} color="white" /></View>
              <View style={{ flex: 1, marginLeft: 10 }}>
                <Text style={styles.feeName} numberOfLines={1}>{player.name}</Text>
                <Text style={styles.feeSub}>{paid ? `Plătit • ${money(p.amount)}${p.paidAt ? ` • ${p.paidAt}` : ""}` : "Neplătit"}</Text>
              </View>
              <Pressable
                onPress={() => canManage && togglePaid(player)}
                disabled={!canManage || busyId === player.id}
                style={[styles.feeToggle, { backgroundColor: (paid ? GREEN : RED) + "18", borderColor: (paid ? GREEN : RED) + "40" }]}
              >
                {paid ? <LucideIcons.Check size={13} color={GREEN} /> : <LucideIcons.X size={13} color={RED} />}
                <Text style={[styles.feeToggleText, { color: paid ? GREEN : RED }]}>{paid ? "Plătit" : "Neplătit"}</Text>
              </Pressable>
            </View>
          );
        })}
      </View>
    </>
  );
}

function AddTransactionModal({ visible, onClose, onSave }) {
  const [form, setForm] = useState({ label: "", value: "", date: "", positive: true });
  const update = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  const submit = () => {
    onSave(form);
    setForm({ label: "", value: "", date: "", positive: true });
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalCard}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Tranzacție nouă</Text>
            <Pressable onPress={onClose}><LucideIcons.X size={18} color={TEXT_DIM} /></Pressable>
          </View>

          <View style={{ flexDirection: "row", gap: 8, marginBottom: 14 }}>
            <Pressable
              onPress={() => update("positive", true)}
              style={[styles.typeChip, form.positive && { borderColor: GREEN, backgroundColor: GREEN + "12" }]}
            >
              <LucideIcons.ArrowUpRight size={13} color={form.positive ? GREEN : TEXT_DIM} />
              <Text style={[styles.typeChipText, form.positive && { color: GREEN }]}>Venit</Text>
            </Pressable>
            <Pressable
              onPress={() => update("positive", false)}
              style={[styles.typeChip, !form.positive && { borderColor: RED, backgroundColor: RED + "12" }]}
            >
              <LucideIcons.ArrowDownRight size={13} color={!form.positive ? RED : TEXT_DIM} />
              <Text style={[styles.typeChipText, !form.positive && { color: RED }]}>Cheltuială</Text>
            </Pressable>
          </View>

          <Text style={styles.modalLabel}>DESCRIERE</Text>
          <TextInput style={styles.modalInput} value={form.label} onChangeText={(v) => update("label", v)} placeholder="Ex: Cotizație luna iulie" placeholderTextColor={TEXT_TH} />

          <View style={{ flexDirection: "row", gap: 10 }}>
            <View style={{ flex: 1 }}>
              <Text style={styles.modalLabel}>SUMĂ (LEI)</Text>
              <TextInput style={styles.modalInput} value={form.value} onChangeText={(v) => update("value", v)} placeholder="500" placeholderTextColor={TEXT_TH} keyboardType="numeric" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.modalLabel}>DATA</Text>
              <TextInput style={styles.modalInput} value={form.date} onChangeText={(v) => update("date", v)} placeholder="20 iulie 2026" placeholderTextColor={TEXT_TH} />
            </View>
          </View>

          <Pressable style={styles.modalSaveBtn} onPress={submit}>
            <LucideIcons.PlusCircle size={16} color="white" />
            <Text style={styles.modalSaveText}>Salvează tranzacția</Text>
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
       <View style={{ marginLeft: 12, flex: 1 }}>
          <Text style={styles.statVal} numberOfLines={1}>{val}</Text>
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

  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 20 },
  statCard: { flexBasis: 180, flexGrow: 1, backgroundColor: CARD_BG, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: BORDER_COLOR, flexDirection: 'row', alignItems: 'center' },
  statIconWrap: { width: 38, height: 38, borderRadius: 10, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  statVal: { color: 'white', fontSize: 15, fontWeight: '900' },
  statLabel: { color: TEXT_DIM, fontSize: 9.5, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 1 },

  segment: { flexDirection: 'row', backgroundColor: "rgba(255,255,255,0.03)", borderRadius: 12, padding: 4, marginBottom: 18, borderWidth: 1, borderColor: BORDER_COLOR },
  segmentBtn: { flex: 1, height: 38, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  segmentBtnActive: { backgroundColor: CYAN + "12", borderWidth: 1, borderColor: CYAN + "30" },
  segmentText: { color: TEXT_DIM, fontSize: 12, fontWeight: '900' },

  feesLabel: { color: TEXT_DIM, fontSize: 9, fontWeight: '900', letterSpacing: 1, marginBottom: 6, marginTop: 4 },
  chip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 14, borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", marginRight: 6 },
  chipActive: { borderColor: CYAN, backgroundColor: CYAN + "10" },
  chipText: { color: TEXT_DIM, fontSize: 10.5, fontWeight: '800' },
  feeInputRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 6, marginBottom: 14 },
  feeInputLabel: { color: TEXT_DIM, fontSize: 11, fontWeight: '700' },
  feeInput: { width: 90, height: 38, backgroundColor: C.bgSecondary, borderWidth: 1, borderColor: C.line, borderRadius: 10, paddingHorizontal: 12, color: 'white', fontSize: 12, fontWeight: '700' },
  feeRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.04)" },
  feeAvatar: { width: 28, height: 28, borderRadius: 14, backgroundColor: "rgba(255,255,255,0.08)", alignItems: 'center', justifyContent: 'center' },
  feeName: { color: 'white', fontSize: 12, fontWeight: '800' },
  feeSub: { color: TEXT_TH, fontSize: 9.5, fontWeight: '600', marginTop: 1 },
  feeToggle: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 12, height: 32, borderRadius: 9, borderWidth: 1 },
  feeToggleText: { fontSize: 10, fontWeight: '900' },

  controlsRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16, flexWrap: 'wrap' },
  addBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: BLUE_ACCENT, paddingHorizontal: 16, height: 38, borderRadius: 10 },
  addBtnText: { color: 'white', fontSize: 11, fontWeight: '900' },
  filterChip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 14, borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", marginRight: 6 },
  filterChipActive: { borderColor: CYAN, backgroundColor: CYAN + "10" },
  filterChipText: { color: TEXT_DIM, fontSize: 10, fontWeight: '800' },

  cardMain: { backgroundColor: CARD_BG, borderRadius: 18, padding: 16, borderWidth: 1, borderColor: BORDER_COLOR },
  cardTitle: { color: 'white', fontSize: 12.5, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 12 },
  emptyBox: { alignItems: 'center', gap: 10, paddingVertical: 30 },
  emptyText: { color: TEXT_DIM, fontSize: 11.5, fontWeight: '600', textAlign: 'center', lineHeight: 17 },

  txRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 11, borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.04)" },
  txIcon: { width: 30, height: 30, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  txLabel: { color: 'white', fontSize: 12, fontWeight: '800' },
  txDate: { color: TEXT_TH, fontSize: 9.5, fontWeight: '600', marginTop: 1 },
  txValue: { fontSize: 12.5, fontWeight: '900', marginLeft: 10 },
  deleteBtn: { padding: 8, marginLeft: 4 },

  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.72)", alignItems: 'center', justifyContent: 'center', padding: 20 },
  modalCard: { width: '100%', maxWidth: 440, backgroundColor: C.card, borderRadius: 18, padding: 20, borderWidth: 1, borderColor: BORDER_COLOR },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  modalTitle: { color: 'white', fontSize: 15, fontWeight: '900' },
  modalLabel: { color: TEXT_DIM, fontSize: 9, fontWeight: '900', letterSpacing: 1, marginBottom: 6, marginTop: 4 },
  modalInput: { backgroundColor: C.bgSecondary, borderWidth: 1, borderColor: C.line, color: 'white', borderRadius: 10, paddingHorizontal: 12, height: 42, fontSize: 12, fontWeight: '600', marginBottom: 12 },
  typeChip: { flex: 1, height: 40, borderRadius: 10, borderWidth: 1, borderColor: "rgba(255,255,255,0.1)", flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7 },
  typeChipText: { color: TEXT_DIM, fontSize: 11, fontWeight: '900' },
  modalSaveBtn: { height: 46, borderRadius: 12, backgroundColor: BLUE_ACCENT, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  modalSaveText: { color: 'white', fontSize: 12, fontWeight: '900' },
});
