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
import { useQueryClient } from "@tanstack/react-query";
import { supabaseService } from "../services/supabaseService";
import { colors as C, themedStyles } from "../constants/theme";

// --- Premium Palette ---

const PRIORITY_COLORS_ = () => ({ URGENT: C.red, MEDIU: C.amber, NORMAL: C.blue });
const FILTERS = ["Toate", "Active", "Finalizate", "URGENT", "MEDIU", "NORMAL"];

function notify(title, msg) {
  if (Platform.OS === "web") window.alert(`${title}\n\n${msg}`);
  else Alert.alert(title, msg);
}

export default function TasksSaaS({ tasks = [], clubId, currentUser }) {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState("Toate");
  const [addOpen, setAddOpen] = useState(false);
  const [busyId, setBusyId] = useState(null);

  const canManage = ["super_admin", "club_owner", "admin", "coach"].includes(currentUser?.role);

  const refresh = () => queryClient.invalidateQueries({ queryKey: ["tasks"] });

  const visible = tasks.filter((t) => {
    if (filter === "Active") return !t.done;
    if (filter === "Finalizate") return t.done;
    if (["URGENT", "MEDIU", "NORMAL"].includes(filter)) return t.priority === filter;
    return true;
  });

  const activeCount = tasks.filter((t) => !t.done).length;
  const urgentCount = tasks.filter((t) => !t.done && t.priority === "URGENT").length;
  const doneCount = tasks.filter((t) => t.done).length;

  const toggle = async (task) => {
    setBusyId(task.id);
    try {
      await supabaseService.setTaskDone(task.id, !task.done);
      refresh();
    } catch (e) {
      notify("Eroare", e.message);
    } finally {
      setBusyId(null);
    }
  };

  const remove = async (task) => {
    setBusyId(task.id);
    try {
      await supabaseService.deleteTask(task.id);
      refresh();
    } catch (e) {
      notify("Eroare", e.message);
    } finally {
      setBusyId(null);
    }
  };

  const save = async (form) => {
    if (!form.title.trim()) {
      notify("Date incomplete", "Completează titlul sarcinii.");
      return;
    }
    try {
      await supabaseService.insertTask({ ...form, clubId });
      setAddOpen(false);
      refresh();
    } catch (e) {
      notify("Eroare", e.message);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        <View style={styles.pageHeader}>
          <Text style={styles.pageTitle}>Sarcini</Text>
          <Text style={styles.pageSub}>Organizează activitatea clubului: termene, responsabili, priorități.</Text>
        </View>

        {/* Stat Cards */}
        <View style={styles.statsGrid}>
           <StatCard icon="ListChecks" label="Sarcini active" val={String(activeCount)} iColor={C.blue} />
           <StatCard icon="AlertCircle" label="Urgente" val={String(urgentCount)} iColor={C.red} />
           <StatCard icon="CheckCircle" label="Finalizate" val={String(doneCount)} iColor={C.green} />
           <StatCard icon="Layers" label="Total" val={String(tasks.length)} iColor={C.purple} />
        </View>

        {/* Actions + Filters */}
        <View style={styles.controlsRow}>
          {canManage && (
            <Pressable style={styles.addBtn} onPress={() => setAddOpen(true)}>
              <LucideIcons.PlusCircle size={16} color="white" />
              <Text style={styles.addBtnText}>Sarcină nouă</Text>
            </Pressable>
          )}
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {FILTERS.map((f) => (
              <Pressable key={f} onPress={() => setFilter(f)} style={[styles.filterChip, filter === f && styles.filterChipActive]}>
                <Text style={[styles.filterChipText, filter === f && { color: C.cyan }]}>{f}</Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>

        {/* Task list */}
        <View style={styles.cardMain}>
          {visible.length === 0 && (
            <View style={styles.emptyBox}>
              <LucideIcons.ClipboardCheck size={30} color={C.dim} />
              <Text style={styles.emptyText}>
                {tasks.length === 0
                  ? "Nicio sarcină încă. Creează prima sarcină cu butonul de mai sus."
                  : "Nicio sarcină nu corespunde filtrului."}
              </Text>
            </View>
          )}

          {visible.map((task) => (
            <View key={task.id} style={[styles.taskRow, task.done && { opacity: 0.55 }]}>
              <Pressable
                onPress={() => toggle(task)}
                disabled={busyId === task.id || !canManage}
                style={[styles.checkBox, task.done && styles.checkBoxDone]}
              >
                {task.done && <LucideIcons.Check size={13} color={C.bg} strokeWidth={3.5} />}
              </Pressable>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={[styles.taskTitle, task.done && { textDecorationLine: "line-through" }]}>{task.title}</Text>
                {!!task.detail && <Text style={styles.taskDetail} numberOfLines={2}>{task.detail}</Text>}
                <View style={styles.taskMetaRow}>
                  {!!task.dueLabel && (
                    <View style={styles.metaItem}>
                      <LucideIcons.Clock size={10} color={C.dim} />
                      <Text style={styles.metaText}>{task.dueLabel}</Text>
                    </View>
                  )}
                  {!!task.assignee && (
                    <View style={styles.metaItem}>
                      <LucideIcons.User size={10} color={C.dim} />
                      <Text style={styles.metaText}>{task.assignee}</Text>
                    </View>
                  )}
                </View>
              </View>
              <View style={[styles.priorityBadge, { backgroundColor: PRIORITY_COLORS_()[task.priority] + "18" }]}>
                <Text style={[styles.priorityText, { color: PRIORITY_COLORS_()[task.priority] }]}>{task.priority}</Text>
              </View>
              {canManage && (
                <Pressable onPress={() => remove(task)} disabled={busyId === task.id} style={styles.deleteBtn}>
                  <LucideIcons.Trash2 size={14} color={C.dim} />
                </Pressable>
              )}
            </View>
          ))}
        </View>

      </ScrollView>

      <AddTaskModal visible={addOpen} onClose={() => setAddOpen(false)} onSave={save} />
    </View>
  );
}

function AddTaskModal({ visible, onClose, onSave }) {
  const [form, setForm] = useState({ title: "", detail: "", priority: "NORMAL", dueLabel: "", assignee: "" });
  const update = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  const submit = () => {
    onSave(form);
    setForm({ title: "", detail: "", priority: "NORMAL", dueLabel: "", assignee: "" });
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalCard}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Sarcină nouă</Text>
            <Pressable onPress={onClose}><LucideIcons.X size={18} color={C.muted} /></Pressable>
          </View>

          <Text style={styles.modalLabel}>TITLU</Text>
          <TextInput style={styles.modalInput} value={form.title} onChangeText={(v) => update("title", v)} placeholder="Ex: Confirmă lotul pentru meci" placeholderTextColor={C.dim} />

          <Text style={styles.modalLabel}>DETALII (OPȚIONAL)</Text>
          <TextInput style={[styles.modalInput, { height: 70, textAlignVertical: "top", paddingTop: 10 }]} value={form.detail} onChangeText={(v) => update("detail", v)} placeholder="Descriere..." placeholderTextColor={C.dim} multiline />

          <View style={{ flexDirection: "row", gap: 10 }}>
            <View style={{ flex: 1 }}>
              <Text style={styles.modalLabel}>TERMEN</Text>
              <TextInput style={styles.modalInput} value={form.dueLabel} onChangeText={(v) => update("dueLabel", v)} placeholder="azi, 16:00" placeholderTextColor={C.dim} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.modalLabel}>RESPONSABIL</Text>
              <TextInput style={styles.modalInput} value={form.assignee} onChangeText={(v) => update("assignee", v)} placeholder="Andrei" placeholderTextColor={C.dim} />
            </View>
          </View>

          <Text style={styles.modalLabel}>PRIORITATE</Text>
          <View style={{ flexDirection: "row", gap: 8, marginBottom: 16 }}>
            {["URGENT", "MEDIU", "NORMAL"].map((p) => (
              <Pressable
                key={p}
                onPress={() => update("priority", p)}
                style={[styles.priorityChip, form.priority === p && { borderColor: PRIORITY_COLORS_()[p], backgroundColor: PRIORITY_COLORS_()[p] + "12" }]}
              >
                <Text style={[styles.priorityChipText, form.priority === p && { color: PRIORITY_COLORS_()[p] }]}>{p}</Text>
              </Pressable>
            ))}
          </View>

          <Pressable style={styles.modalSaveBtn} onPress={submit}>
            <LucideIcons.PlusCircle size={16} color="white" />
            <Text style={styles.modalSaveText}>Salvează sarcina</Text>
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

  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 20 },
  statCard: { flexBasis: 160, flexGrow: 1, backgroundColor: C.card, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: C.line, flexDirection: 'row', alignItems: 'center' },
  statIconWrap: { width: 38, height: 38, borderRadius: 10, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  statVal: { color: C.text, fontSize: 18, fontWeight: '900' },
  statLabel: { color: C.muted, fontSize: 9.5, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 1 },

  controlsRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16, flexWrap: 'wrap' },
  addBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: C.blue, paddingHorizontal: 16, height: 38, borderRadius: 10 },
  addBtnText: { color: C.text, fontSize: 11, fontWeight: '900' },
  filterChip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 14, borderWidth: 1, borderColor: C.line, marginRight: 6 },
  filterChipActive: { borderColor: C.cyan, backgroundColor: C.cyan + "10" },
  filterChipText: { color: C.muted, fontSize: 10, fontWeight: '800' },

  cardMain: { backgroundColor: C.card, borderRadius: 18, padding: 16, borderWidth: 1, borderColor: C.line },
  emptyBox: { alignItems: 'center', gap: 10, paddingVertical: 30 },
  emptyText: { color: C.muted, fontSize: 11.5, fontWeight: '600', textAlign: 'center', lineHeight: 17 },

  taskRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: C.line },
  checkBox: { width: 22, height: 22, borderRadius: 7, borderWidth: 1.5, borderColor: C.lineStrong, alignItems: 'center', justifyContent: 'center' },
  checkBoxDone: { backgroundColor: C.green, borderColor: C.green },
  taskTitle: { color: C.text, fontSize: 12.5, fontWeight: '800' },
  taskDetail: { color: C.muted, fontSize: 10.5, fontWeight: '600', marginTop: 2, lineHeight: 15 },
  taskMetaRow: { flexDirection: 'row', gap: 12, marginTop: 4 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { color: C.dim, fontSize: 9, fontWeight: '700' },
  priorityBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, marginLeft: 10 },
  priorityText: { fontSize: 8, fontWeight: '900' },
  deleteBtn: { padding: 8, marginLeft: 4 },

  modalOverlay: { flex: 1, backgroundColor: C.isDark ? "rgba(0,0,0,0.72)" : "rgba(9,9,11,0.45)", alignItems: 'center', justifyContent: 'center', padding: 20 },
  modalCard: { width: '100%', maxWidth: 440, backgroundColor: C.card, borderRadius: 18, padding: 20, borderWidth: 1, borderColor: C.line },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  modalTitle: { color: C.text, fontSize: 15, fontWeight: '900' },
  modalLabel: { color: C.muted, fontSize: 9, fontWeight: '900', letterSpacing: 1, marginBottom: 6, marginTop: 4 },
  modalInput: { backgroundColor: C.bgSecondary, borderWidth: 1, borderColor: C.line, color: C.text, borderRadius: 10, paddingHorizontal: 12, height: 42, fontSize: 12, fontWeight: '600', marginBottom: 12 },
  priorityChip: { flex: 1, height: 36, borderRadius: 10, borderWidth: 1, borderColor: C.lineStrong, alignItems: 'center', justifyContent: 'center' },
  priorityChipText: { color: C.muted, fontSize: 9.5, fontWeight: '900' },
  modalSaveBtn: { height: 46, borderRadius: 12, backgroundColor: C.blue, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  modalSaveText: { color: C.text, fontSize: 12, fontWeight: '900' },
}));
