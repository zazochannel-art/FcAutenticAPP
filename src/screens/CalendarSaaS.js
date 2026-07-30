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
import { useQueryClient } from "@tanstack/react-query";
import { supabaseService } from "../services/supabaseService";
import { colors as C, themedStyles, layout } from "../constants/theme";
import { useTopClearance } from "../hooks/useTopClearance";

// --- Premium Palette ---

const MONTH_NAMES = ["ianuarie", "februarie", "martie", "aprilie", "mai", "iunie", "iulie", "august", "septembrie", "octombrie", "noiembrie", "decembrie"];
const MONTH_PREFIXES = { ian: 0, feb: 1, mar: 2, apr: 3, mai: 4, iun: 5, iul: 6, aug: 7, sep: 8, oct: 9, noi: 10, nov: 10, dec: 11 };
const DAY_HEADERS = ["LUN", "MAR", "MIE", "JOI", "VIN", "SÂM", "DUM"];

// Etichetele de dată sunt text liber ("29 iunie", "31 MAI 2026", "07 iun.").
// Extragem zi + lună (+ an, implicit anul curent).
function parseRoDate(label) {
  if (!label) return null;
  const match = String(label).toLowerCase().match(/(\d{1,2})\s*([a-zăâîșț]+)\.?\s*(\d{4})?/);
  if (!match) return null;
  const day = Number(match[1]);
  const monthKey = match[2].slice(0, 3);
  const month = MONTH_PREFIXES[monthKey];
  if (month === undefined || day < 1 || day > 31) return null;
  const year = match[3] ? Number(match[3]) : new Date().getFullYear();
  const date = new Date(year, month, day);
  return Number.isNaN(date.getTime()) ? null : date;
}

function sameDay(a, b) {
  return a && b && a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function notify(title, msg) {
  if (Platform.OS === "web") window.alert(`${title}\n\n${msg}`);
  else Alert.alert(title, msg);
}

const EVENT_TYPE_COLORS = {
  training: C.purple,
  match: C.blue,
  event: C.amber,
  medical: C.green,
  payment: C.cyan,
};

export default function CalendarSaaS({ trainings = [], matches = [], events = [], clubId, currentUser }) {
  const topClearance = useTopClearance();
  const queryClient = useQueryClient();
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [addOpen, setAddOpen] = useState(false);

  const canManage = ["super_admin", "club_owner", "admin", "coach"].includes(currentUser?.role);

  // Toate activitățile clubului, normalizate într-o singură listă de evenimente.
  const allEvents = useMemo(() => {
    const list = [];
    trainings.forEach((t) => list.push({
      id: `t-${t.id}`,
      kind: "training",
      date: parseRoDate(t.date),
      time: t.time || "",
      label: `${t.group} Antrenament`,
      sub: t.location || "",
      color: EVENT_TYPE_COLORS.training,
    }));
    matches.forEach((m) => list.push({
      id: `m-${m.id}`,
      kind: "match",
      date: parseRoDate(m.date),
      time: m.time || "",
      label: `Meci vs ${m.opponent}`,
      sub: `${m.group} • ${m.location || ""}`,
      color: EVENT_TYPE_COLORS.match,
    }));
    events.forEach((e) => list.push({
      id: `e-${e.id}`,
      kind: "event",
      date: parseRoDate(e.date),
      time: e.time || "",
      label: e.type || "Eveniment",
      sub: [e.group, e.notes].filter(Boolean).join(" • "),
      color: EVENT_TYPE_COLORS.event,
      raw: e,
    }));
    return list;
  }, [trainings, matches, events]);

  const datedEvents = allEvents.filter((e) => e.date);
  const undatedEvents = allEvents.filter((e) => !e.date);

  // Grila lunii curente: săptămâni de 7 zile, începând de luni.
  const weeks = useMemo(() => {
    const firstDay = new Date(viewYear, viewMonth, 1);
    const startOffset = (firstDay.getDay() + 6) % 7; // luni = 0
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const cells = [];
    for (let i = 0; i < startOffset; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(viewYear, viewMonth, d));
    while (cells.length % 7 !== 0) cells.push(null);
    const rows = [];
    for (let i = 0; i < cells.length; i += 7) rows.push(cells.slice(i, i + 7));
    return rows;
  }, [viewYear, viewMonth]);

  const eventsOn = (date) => datedEvents.filter((e) => sameDay(e.date, date));

  const monthEvents = datedEvents.filter((e) => e.date.getFullYear() === viewYear && e.date.getMonth() === viewMonth);
  const todayEvents = eventsOn(today);
  const upcoming = datedEvents
    .filter((e) => e.date >= new Date(today.getFullYear(), today.getMonth(), today.getDate()))
    .sort((a, b) => a.date - b.date)
    .slice(0, 6);

  const changeMonth = (delta) => {
    const next = new Date(viewYear, viewMonth + delta, 1);
    setViewYear(next.getFullYear());
    setViewMonth(next.getMonth());
  };

  const goToday = () => {
    setViewYear(today.getFullYear());
    setViewMonth(today.getMonth());
  };

  const saveEvent = async (form) => {
    if (!form.type.trim() || !form.date.trim()) {
      notify("Date incomplete", "Completează cel puțin tipul și data evenimentului.");
      return;
    }
    try {
      await supabaseService.insertEvent({ ...form, clubId });
      setAddOpen(false);
      queryClient.invalidateQueries({ queryKey: ["events"] });
    } catch (e) {
      notify("Eroare", e.message);
    }
  };

  const monthTitle = `${MONTH_NAMES[viewMonth][0].toUpperCase()}${MONTH_NAMES[viewMonth].slice(1)} ${viewYear}`;

  return (
    <View style={styles.container}>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={[styles.scrollContent, topClearance]} showsVerticalScrollIndicator={false}>

        <View style={styles.pageHeader}>
          <Text style={styles.pageTitle}>Calendar</Text>
          <Text style={styles.pageSub}>Antrenamentele, meciurile și evenimentele clubului, într-un singur loc.</Text>
        </View>

        {/* Stat Cards */}
        <View style={styles.statsGrid}>
           <StatCard icon="CalendarDays" label={`Evenimente în ${MONTH_NAMES[viewMonth]}`} val={String(monthEvents.length)} iColor={C.green} />
           <StatCard icon="Dumbbell" label="Antrenamente" val={String(trainings.length)} iColor={C.purple} />
           <StatCard icon="Trophy" label="Meciuri" val={String(matches.length)} iColor={C.blue} />
           <StatCard icon="Bell" label="Alte evenimente" val={String(events.length)} iColor={C.amber} />
        </View>

        {canManage && (
          <Pressable style={styles.addBtn} onPress={() => setAddOpen(true)}>
            <LucideIcons.CalendarPlus size={16} color="white" />
            <Text style={styles.addBtnText}>Adaugă eveniment</Text>
          </Pressable>
        )}

        <View style={styles.mainGrid}>
          {/* Month grid */}
          <View style={styles.colCalendar}>
            <View style={styles.cardMain}>
              <View style={styles.calendarControls}>
                <View style={styles.navRow}>
                  <Pressable style={styles.navBtn} onPress={() => changeMonth(-1)}><LucideIcons.ChevronLeft size={16} color="white" /></Pressable>
                  <Pressable style={styles.navBtn} onPress={() => changeMonth(1)}><LucideIcons.ChevronRight size={16} color="white" /></Pressable>
                  <Pressable style={styles.todayBtn} onPress={goToday}><Text style={styles.todayText}>Azi</Text></Pressable>
                  <Text style={styles.currentMonth}>{monthTitle}</Text>
                </View>
              </View>

              <View style={styles.dayHeaders}>
                {DAY_HEADERS.map((d) => <Text key={d} style={styles.dayH}>{d}</Text>)}
              </View>

              {weeks.map((week, wIndex) => (
                <View key={wIndex} style={styles.calRow}>
                  {week.map((date, dIndex) => {
                    const dayEvents = date ? eventsOn(date) : [];
                    const isToday = date && sameDay(date, today);
                    return (
                      <View key={dIndex} style={[styles.calCell, !date && styles.calCellEmpty, isToday && styles.calCellActive]}>
                        {date && (
                          <>
                            <Text style={[styles.calDayNum, isToday && { color: C.cyan }]}>{date.getDate()}</Text>
                            <View style={styles.calEvents}>
                              {dayEvents.slice(0, 3).map((e) => (
                                <View key={e.id} style={[styles.eventMarker, { backgroundColor: e.color + "15" }]}>
                                  <View style={[styles.eventDot, { backgroundColor: e.color }]} />
                                  <Text style={[styles.eventText, { color: e.color }]} numberOfLines={1}>
                                    {e.time ? `${e.time} ` : ""}{e.label}
                                  </Text>
                                </View>
                              ))}
                              {dayEvents.length > 3 && (
                                <Text style={styles.moreText}>+{dayEvents.length - 3} altele</Text>
                              )}
                            </View>
                          </>
                        )}
                      </View>
                    );
                  })}
                </View>
              ))}

              {undatedEvents.length > 0 && (
                <Text style={styles.undatedHint}>
                  {undatedEvents.length} activități au date care nu pot fi plasate în calendar (folosește formatul „29 iulie").
                </Text>
              )}
            </View>
          </View>

          {/* Sidebar */}
          <View style={styles.colSidebar}>
            <View style={styles.cardSide}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>Agenda zilei</Text>
                <Text style={styles.dateLabel}>{today.getDate()} {MONTH_NAMES[today.getMonth()]}</Text>
              </View>
              {todayEvents.length === 0 && (
                <Text style={styles.emptyText}>Nicio activitate programată azi.</Text>
              )}
              {todayEvents.map((e) => (
                <View key={e.id} style={styles.agendaLine}>
                  <Text style={styles.agendaTime}>{e.time || "—"}</Text>
                  <View style={[styles.agendaMarker, { backgroundColor: e.color }]} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.agendaTitle} numberOfLines={1}>{e.label}</Text>
                    {!!e.sub && <Text style={styles.agendaLoc} numberOfLines={1}>{e.sub}</Text>}
                  </View>
                </View>
              ))}
            </View>

            <View style={[styles.cardSide, { marginTop: 16 }]}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>Evenimente apropiate</Text>
              </View>
              {upcoming.length === 0 && (
                <Text style={styles.emptyText}>Nimic programat în perioada următoare.</Text>
              )}
              {upcoming.map((e) => (
                <View key={e.id} style={styles.upcomingItem}>
                  <View style={styles.upDateBlock}>
                    <Text style={styles.upDateNum}>{e.date.getDate()}</Text>
                    <Text style={styles.upDateMonth}>{MONTH_NAMES[e.date.getMonth()].slice(0, 3).toUpperCase()}</Text>
                  </View>
                  <View style={[styles.upMarker, { backgroundColor: e.color }]} />
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={styles.upTitle} numberOfLines={1}>{e.label}</Text>
                    <Text style={styles.upTime} numberOfLines={1}>{e.time ? `${e.time} • ` : ""}{e.sub}</Text>
                  </View>
                </View>
              ))}
            </View>

            <View style={[styles.cardSide, { marginTop: 16 }]}>
              <Text style={[styles.cardTitle, { marginBottom: 14 }]}>Legendă</Text>
              <LegendItem dot={C.purple} label="Antrenamente" />
              <LegendItem dot={C.blue} label="Meciuri" />
              <LegendItem dot={C.amber} label="Evenimente club" />
            </View>
          </View>
        </View>

      </ScrollView>

      <AddEventModal visible={addOpen} onClose={() => setAddOpen(false)} onSave={saveEvent} />
    </View>
  );
}

function AddEventModal({ visible, onClose, onSave }) {
  const [form, setForm] = useState({ type: "", date: "", time: "", group: "", notes: "" });
  const update = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  const submit = () => {
    onSave(form);
    setForm({ type: "", date: "", time: "", group: "", notes: "" });
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalCard}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Eveniment nou</Text>
            <Pressable onPress={onClose}><LucideIcons.X size={18} color={C.muted} /></Pressable>
          </View>

          <Text style={styles.modalLabel}>TIP EVENIMENT</Text>
          <TextInput style={styles.modalInput} value={form.type} onChangeText={(v) => update("type", v)} placeholder="Ex: Ședință staff, Evaluări medicale" placeholderTextColor={C.dim} />

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

          <View style={{ flexDirection: "row", gap: 10 }}>
            <View style={{ flex: 1 }}>
              <Text style={styles.modalLabel}>GRUPA (OPȚIONAL)</Text>
              <TextInput style={styles.modalInput} value={form.group} onChangeText={(v) => update("group", v)} placeholder="U16" placeholderTextColor={C.dim} />
            </View>
            <View style={{ flex: 2 }}>
              <Text style={styles.modalLabel}>DETALII (OPȚIONAL)</Text>
              <TextInput style={styles.modalInput} value={form.notes} onChangeText={(v) => update("notes", v)} placeholder="Sala de conferințe" placeholderTextColor={C.dim} />
            </View>
          </View>

          <Pressable style={styles.modalSaveBtn} onPress={submit}>
            <LucideIcons.CalendarPlus size={16} color="white" />
            <Text style={styles.modalSaveText}>Salvează evenimentul</Text>
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
          <Text style={styles.statVal}>{val}</Text>
          <Text style={styles.statLabel} numberOfLines={1}>{label}</Text>
       </View>
    </View>
  );
};

const LegendItem = ({ dot, label }) => (
  <View style={styles.legendItem}>
     <View style={[styles.legendDot, { backgroundColor: dot }]} />
     <Text style={styles.legendText}>{label}</Text>
  </View>
);

const styles = themedStyles((C) => StyleSheet.create({
  container: { flex: 1, backgroundColor: "transparent" },
  scrollContent: { padding: 18, paddingBottom: layout.navClearance },

  pageHeader: { marginBottom: 24 },
  pageTitle: { color: C.text, fontSize: 26, fontWeight: '900', letterSpacing: -0.5 },
  pageSub: { color: C.muted, fontSize: 13, fontWeight: '600', marginTop: 3 },

  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 16 },
  statCard: { flexBasis: 170, flexGrow: 1, backgroundColor: C.card, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: C.line, flexDirection: 'row', alignItems: 'center' },
  statIconWrap: { width: 38, height: 38, borderRadius: 10, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  statVal: { color: C.text, fontSize: 18, fontWeight: '900' },
  statLabel: { color: C.muted, fontSize: 9, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.4, marginTop: 1 },

  addBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: C.blue, height: 44, borderRadius: 12, marginBottom: 16 },
  addBtnText: { color: C.text, fontSize: 12, fontWeight: '900' },

  mainGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 14 },
  colCalendar: { flexBasis: 420, flexGrow: 3, flexShrink: 1, minWidth: 0 },
  colSidebar: { flexBasis: 250, flexGrow: 1, flexShrink: 1, minWidth: 0 },

  cardMain: { backgroundColor: C.card, borderRadius: 20, padding: 16, borderWidth: 1, borderColor: C.line },
  cardSide: { backgroundColor: C.card, borderRadius: 20, padding: 16, borderWidth: 1, borderColor: C.line },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  cardTitle: { color: C.text, fontSize: 12.5, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 0.8 },
  emptyText: { color: C.muted, fontSize: 11, fontWeight: '600', lineHeight: 16 },

  calendarControls: { marginBottom: 14 },
  navRow: { flexDirection: 'row', alignItems: 'center' },
  navBtn: { width: 30, height: 30, backgroundColor: C.fill3, borderRadius: 8, alignItems: 'center', justifyContent: 'center', marginRight: 8 },
  todayBtn: { paddingHorizontal: 12, height: 30, backgroundColor: C.fill3, borderRadius: 8, alignItems: 'center', justifyContent: 'center', marginHorizontal: 8 },
  todayText: { color: C.text, fontSize: 11, fontWeight: '800' },
  currentMonth: { color: C.text, fontSize: 15, fontWeight: '900', marginLeft: 8 },

  dayHeaders: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: C.line, paddingBottom: 8, marginBottom: 4 },
  dayH: { flex: 1, color: C.dim, fontSize: 9, fontWeight: '900', textAlign: 'center' },

  calRow: { flexDirection: 'row', minHeight: 84, borderBottomWidth: 1, borderBottomColor: C.line },
  calCell: { flex: 1, borderRightWidth: 1, borderRightColor: C.line, padding: 4 },
  calCellEmpty: { backgroundColor: C.fill1 },
  calCellActive: { backgroundColor: C.blue + "08" },
  calDayNum: { color: C.muted, fontSize: 10.5, fontWeight: '800' },
  calEvents: { marginTop: 3, gap: 2 },
  eventMarker: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 4, paddingVertical: 2, borderRadius: 4 },
  eventDot: { width: 4, height: 4, borderRadius: 2, marginRight: 4 },
  eventText: { fontSize: 7.5, fontWeight: '700', flex: 1 },
  moreText: { color: C.dim, fontSize: 7.5, fontWeight: '800', marginLeft: 4 },
  undatedHint: { color: C.dim, fontSize: 9, fontWeight: '600', marginTop: 10, lineHeight: 13 },

  dateLabel: { color: C.dim, fontSize: 10.5, fontWeight: '800' },
  agendaLine: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: C.line },
  agendaTime: { color: C.dim, fontSize: 10, fontWeight: '900', width: 42 },
  agendaMarker: { width: 3, height: 22, borderRadius: 2, marginHorizontal: 10 },
  agendaTitle: { color: C.text, fontSize: 11, fontWeight: '800' },
  agendaLoc: { color: C.dim, fontSize: 9, fontWeight: '700', marginTop: 1 },

  upcomingItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: C.line },
  upDateBlock: { width: 34, alignItems: 'center' },
  upDateNum: { color: C.text, fontSize: 13, fontWeight: '900' },
  upDateMonth: { color: C.blue, fontSize: 7.5, fontWeight: '900' },
  upMarker: { width: 5, height: 5, borderRadius: 2.5, marginHorizontal: 10 },
  upTitle: { color: C.text, fontSize: 10.5, fontWeight: '800' },
  upTime: { color: C.dim, fontSize: 8.5, fontWeight: '700', marginTop: 1 },

  legendItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  legendDot: { width: 8, height: 8, borderRadius: 4, marginRight: 10 },
  legendText: { color: C.muted, fontSize: 10.5, fontWeight: '700' },

  modalOverlay: { flex: 1, backgroundColor: C.isDark ? "rgba(0,0,0,0.72)" : "rgba(9,9,11,0.45)", alignItems: 'center', justifyContent: 'center', padding: 20 },
  modalCard: { width: '100%', maxWidth: 460, backgroundColor: C.card, borderRadius: 18, padding: 20, borderWidth: 1, borderColor: C.line },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  modalTitle: { color: C.text, fontSize: 15, fontWeight: '900' },
  modalLabel: { color: C.muted, fontSize: 9, fontWeight: '900', letterSpacing: 1, marginBottom: 6, marginTop: 4 },
  modalInput: { backgroundColor: C.bgSecondary, borderWidth: 1, borderColor: C.line, color: C.text, borderRadius: 10, paddingHorizontal: 12, height: 42, fontSize: 12, fontWeight: '600', marginBottom: 12 },
  modalSaveBtn: { height: 46, borderRadius: 12, backgroundColor: C.blue, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  modalSaveText: { color: C.text, fontSize: 12, fontWeight: '900' },
}));
