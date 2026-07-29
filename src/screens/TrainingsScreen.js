import React, { useState } from "react";
import { Alert, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import * as LucideIcons from "lucide-react-native";
import { useQueryClient } from "@tanstack/react-query";
import { colors as C, themedStyles, layout } from "../constants/theme";
import { TopBar, SectionTitle } from "../components/SharedComponents";
import { BeUIButton } from "../components/ui/be-ui-button";
import { supabaseService } from "../services/supabaseService";

const clubGroups = ["U13", "U16", "U19", "Juniori", "Seniori"];

function notify(title, msg) {
  if (Platform.OS === "web") window.alert(`${title}\n\n${msg}`);
  else Alert.alert(title, msg);
}

const attendanceOptions = [
  ["present", "Check", "Prezent", C.green],
  ["absent", "X", "Absent", C.red],
  ["late", "Clock", "Întârziat", C.amber],
  ["injured", "Plus", "Accidentat", "#D47AF0"],
  ["excused", "Circle", "Scutit", C.blue],
];

export default function TrainingsScreen({ players, trainings, attendance = {}, setAttendance, currentUser, selectedClub, clubId }) {
  const queryClient = useQueryClient();
  const [view, setView] = useState("list");
  const [selected, setSelected] = useState(null);
  const [filter, setFilter] = useState("Toate");
  const [addOpen, setAddOpen] = useState(false);

  const canManage = ["super_admin", "club_owner", "admin", "coach"].includes(currentUser?.role);
  const safeGroups = selectedClub?.groups?.length ? selectedClub.groups : clubGroups;
  const visibleTrainings = trainings.filter(t => filter === "Toate" || t.group === filter);
  const groupPlayers = players.filter(p => p.group === selected?.group);

  const saveTraining = async (form) => {
    if (!form.date.trim() || !form.time.trim() || !form.location.trim()) {
      notify("Date incomplete", "Completează data, ora și locația antrenamentului.");
      return;
    }
    try {
      await supabaseService.insertTraining({
        date: form.date.trim(),
        time: form.time.trim(),
        location: form.location.trim(),
        group: form.group,
        coach: form.coach.trim() || currentUser?.name || "Antrenor",
        theme: form.theme.trim() || null,
        clubId,
      });
      setAddOpen(false);
      queryClient.invalidateQueries({ queryKey: ["trainings"] });
    } catch (e) {
      notify("Eroare", e.message);
    }
  };

  const markAttendance = (pId, status) => {
    setAttendance({
      ...attendance,
      [selected.id]: {
        ...(attendance[selected.id] || {}),
        [pId]: status
      }
    });
  };

  if (view === "detail" && selected) {
    return (
      <ScrollView contentContainerStyle={styles.content}>
        <BeUIButton
          label="Toate antrenamentele"
          variant="ghost"
          size="sm"
          icon="ChevronLeft"
          onPress={() => setView("list")}
          style={{ alignSelf: "flex-start", marginBottom: 14 }}
        />
        <TopBar title={selected.theme} eyebrow={selected.group} />

        <View style={styles.detailHero}>
          <Text style={{color: C.text, opacity: 0.6}}>{selected.date} • {selected.time}</Text>
          <Text style={{color: C.text, fontWeight: '900', marginTop: 5}}><LucideIcons.MapPin size={13} color="white" /> {selected.location}</Text>
        </View>

        <SectionTitle title="Prezență Jucători" />
        {groupPlayers.map(player => {
          const currentStatus = attendance[selected.id]?.[player.id];
          return (
            <View key={player.id} style={styles.attendanceCard}>
              <Text style={{color: C.text, fontWeight: '700'}}>{player.name}</Text>
              <View style={styles.statusRow}>
                {attendanceOptions.map(([key, iconName]) => (
                  <BeUIButton
                    key={key}
                    variant={currentStatus === key ? (key === "present" ? "success" : key === "absent" ? "danger" : "secondary") : "ghost"}
                    size="sm"
                    icon={iconName}
                    onPress={() => markAttendance(player.id, key)}
                    style={[
                      { width: 32, height: 32, paddingHorizontal: 0 },
                      currentStatus === key && key === "late" && { backgroundColor: C.amber }
                    ]}
                  />
                ))}
              </View>
            </View>
          );
        })}
      </ScrollView>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <TopBar title="Antrenamente" eyebrow="CENTRUL DE PREGĂTIRE" />
        {canManage && (
          <BeUIButton
            label="Programează antrenament"
            variant="primary"
            size="md"
            icon="PlusCircle"
            onPress={() => setAddOpen(true)}
            fullWidth
            style={{ marginTop: 4 }}
          />
        )}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{marginVertical: 15}}>
          {["Toate", ...safeGroups].map((group) => (
            <Pressable key={group} style={[styles.filterChip, filter === group && styles.filterChipActive]} onPress={() => setFilter(group)}>
              <Text style={[styles.filterChipText, filter === group && styles.filterChipTextActive]}>{group}</Text>
            </Pressable>
          ))}
        </ScrollView>
        {visibleTrainings.length === 0 && (
          <View style={styles.emptyBox}>
            <LucideIcons.CalendarOff size={30} color={C.dim} />
            <Text style={styles.emptyText}>
              {trainings.length === 0
                ? "Niciun antrenament programat încă. Creează primul cu butonul de mai sus."
                : "Niciun antrenament pentru această grupă."}
            </Text>
          </View>
        )}
        {visibleTrainings.map((training) => (
          <Pressable key={training.id} style={styles.trainingCard} onPress={() => { setSelected(training); setView("detail"); }}>
            <View style={{flexDirection: 'row', justifyContent: 'space-between'}}>
              <Text style={styles.trainingTitle}>{training.theme || "Antrenament"}</Text>
              <Text style={{color: C.blue, fontWeight: '900'}}>{training.group}</Text>
            </View>
            <Text style={styles.trainingMeta}>{training.date} • {training.time} • {training.location}</Text>
          </Pressable>
        ))}
      </ScrollView>

      <AddTrainingModal visible={addOpen} onClose={() => setAddOpen(false)} onSave={saveTraining} groups={safeGroups} />
    </View>
  );
}

function AddTrainingModal({ visible, onClose, onSave, groups }) {
  const [form, setForm] = useState({ date: "", time: "", location: "", group: groups[0] || "U19", coach: "", theme: "" });
  const update = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalCard}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Antrenament nou</Text>
            <Pressable onPress={onClose}><LucideIcons.X size={18} color={C.muted} /></Pressable>
          </View>

          <Text style={styles.modalLabel}>TEMĂ</Text>
          <TextInput style={styles.modalInput} value={form.theme} onChangeText={(v) => update("theme", v)} placeholder="Ex: Finalizare și pressing" placeholderTextColor={C.dim} />

          <View style={{ flexDirection: "row", gap: 10 }}>
            <View style={{ flex: 1 }}>
              <Text style={styles.modalLabel}>DATA</Text>
              <TextInput style={styles.modalInput} value={form.date} onChangeText={(v) => update("date", v)} placeholder="29 iulie 2026" placeholderTextColor={C.dim} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.modalLabel}>ORA</Text>
              <TextInput style={styles.modalInput} value={form.time} onChangeText={(v) => update("time", v)} placeholder="18:00" placeholderTextColor={C.dim} />
            </View>
          </View>

          <Text style={styles.modalLabel}>LOCAȚIE</Text>
          <TextInput style={styles.modalInput} value={form.location} onChangeText={(v) => update("location", v)} placeholder="Baza sportivă, Teren 1" placeholderTextColor={C.dim} />

          <Text style={styles.modalLabel}>ANTRENOR</Text>
          <TextInput style={styles.modalInput} value={form.coach} onChangeText={(v) => update("coach", v)} placeholder="Numele antrenorului" placeholderTextColor={C.dim} />

          <Text style={styles.modalLabel}>GRUPA</Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
            {groups.map((g) => (
              <Pressable key={g} onPress={() => update("group", g)} style={[styles.filterChip, form.group === g && styles.filterChipActive]}>
                <Text style={[styles.filterChipText, form.group === g && styles.filterChipTextActive]}>{g}</Text>
              </Pressable>
            ))}
          </View>

          <BeUIButton label="Salvează antrenamentul" variant="primary" size="lg" icon="CheckCircle2" onPress={() => onSave(form)} fullWidth />
        </View>
      </View>
    </Modal>
  );
}

const styles = themedStyles((C) => StyleSheet.create({
  content: { padding: 18, paddingBottom: layout.navClearance },
  filterChip: { paddingVertical: 7, paddingHorizontal: 15, borderRadius: 18, borderWidth: 1, borderColor: C.line, marginRight: 8 },
  filterChipActive: { backgroundColor: C.red, borderColor: C.red },
  filterChipText: { color: C.muted, fontSize: 11, fontWeight: "800" },
  trainingCard: { backgroundColor: C.card, borderRadius: 18, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: C.line },
  trainingTitle: { color: C.text, fontSize: 15, fontWeight: "800" },
  trainingMeta: { color: C.muted, fontSize: 10, marginTop: 5 },
  detailHero: { backgroundColor: C.card, padding: 20, borderRadius: 20, marginBottom: 20 },
  attendanceCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: C.card, padding: 12, borderRadius: 15, marginBottom: 8 },
  statusRow: { flexDirection: 'row', gap: 5 },
  statusBtn: { width: 32, height: 32, borderRadius: 8, backgroundColor: C.bg, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: C.line },
  backLink: { flexDirection: "row", alignItems: "center", marginBottom: 14 },
  backText: { color: C.blue, fontSize: 12, fontWeight: "800" },
  emptyBox: { alignItems: 'center', gap: 10, paddingVertical: 34 },
  emptyText: { color: C.muted, fontSize: 12, fontWeight: '600', textAlign: 'center', lineHeight: 17, paddingHorizontal: 20 },
  modalOverlay: { flex: 1, backgroundColor: C.isDark ? "rgba(0,0,0,0.72)" : "rgba(9,9,11,0.45)", alignItems: 'center', justifyContent: 'center', padding: 20 },
  modalCard: { width: '100%', maxWidth: 460, backgroundColor: C.card, borderRadius: 18, padding: 20, borderWidth: 1, borderColor: C.line },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  modalTitle: { color: C.text, fontSize: 15, fontWeight: '900' },
  modalLabel: { color: C.muted, fontSize: 9, fontWeight: '900', letterSpacing: 1, marginBottom: 6, marginTop: 4 },
  modalInput: { backgroundColor: C.bgSecondary, borderWidth: 1, borderColor: C.line, color: C.text, borderRadius: 10, paddingHorizontal: 12, height: 42, fontSize: 12, fontWeight: '600', marginBottom: 12 },
}));
