import React, { useMemo, useState } from "react";
import { View, Text, Pressable, Modal, ScrollView, StyleSheet } from "react-native";
import * as LucideIcons from "lucide-react-native";
import { colors as C } from "../constants/theme";
import { parseRoDate, formatRoDate, MONTHS_RO as MONTHS } from "../utils/dates";

// Câmp de dată care produce exact eticheta text folosită în aplicație
// („29 iulie 2026”), compatibilă cu parseRoDate. Funcționează pe web și nativ,
// fără dependențe suplimentare.
export default function RoDateField({ value, onChange, placeholder = "Alege data" }) {
  const [open, setOpen] = useState(false);
  const now = new Date();

  const initial = useMemo(() => parseRoDate(value) || now, [value]);
  const [day, setDay] = useState(initial.getDate());
  const [month, setMonth] = useState(initial.getMonth());
  const [year, setYear] = useState(initial.getFullYear());

  const openPicker = () => {
    const d = parseRoDate(value) || new Date();
    setDay(d.getDate()); setMonth(d.getMonth()); setYear(d.getFullYear());
    setOpen(true);
  };

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const years = Array.from({ length: 4 }, (_, i) => now.getFullYear() + i);

  const confirm = () => {
    const safeDay = Math.min(day, daysInMonth);
    onChange(formatRoDate(safeDay, month, year));
    setOpen(false);
  };

  return (
    <>
      <Pressable style={styles.field} onPress={openPicker}>
        <Text style={[styles.fieldText, !value && { color: C.dim }]} numberOfLines={1}>{value || placeholder}</Text>
        <LucideIcons.CalendarDays size={15} color={C.muted} />
      </Pressable>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <View style={styles.overlay}>
          <View style={styles.card}>
            <View style={styles.header}>
              <Text style={styles.title}>Alege data</Text>
              <Pressable onPress={() => setOpen(false)}><LucideIcons.X size={18} color={C.dim} /></Pressable>
            </View>

            <View style={styles.columns}>
              <Column label="ZI">
                {days.map((d) => (
                  <PickItem key={d} active={d === day} label={String(d)} onPress={() => setDay(d)} />
                ))}
              </Column>
              <Column label="LUNĂ">
                {MONTHS.map((m, i) => (
                  <PickItem key={m} active={i === month} label={m.slice(0, 3)} onPress={() => setMonth(i)} />
                ))}
              </Column>
              <Column label="AN">
                {years.map((y) => (
                  <PickItem key={y} active={y === year} label={String(y)} onPress={() => setYear(y)} />
                ))}
              </Column>
            </View>

            <Text style={styles.preview}>{formatRoDate(Math.min(day, daysInMonth), month, year)}</Text>

            <Pressable style={styles.confirmBtn} onPress={confirm}>
              <LucideIcons.Check size={16} color="white" />
              <Text style={styles.confirmText}>Confirmă</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </>
  );
}

const Column = ({ label, children }) => (
  <View style={styles.column}>
    <Text style={styles.columnLabel}>{label}</Text>
    <ScrollView style={styles.columnScroll} showsVerticalScrollIndicator={false}>{children}</ScrollView>
  </View>
);

const PickItem = ({ active, label, onPress }) => (
  <Pressable onPress={onPress} style={[styles.item, active && styles.itemActive]}>
    <Text style={[styles.itemText, active && styles.itemTextActive]}>{label}</Text>
  </Pressable>
);

const styles = StyleSheet.create({
  field: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: C.bgSecondary, borderWidth: 1, borderColor: C.line, borderRadius: 10, paddingHorizontal: 12, height: 42, marginBottom: 12 },
  fieldText: { color: "white", fontSize: 12, fontWeight: "600", flex: 1 },
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.72)", alignItems: "center", justifyContent: "center", padding: 20 },
  card: { width: "100%", maxWidth: 360, backgroundColor: C.card, borderRadius: 18, padding: 20, borderWidth: 1, borderColor: "rgba(0,212,255,0.12)" },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 14 },
  title: { color: "white", fontSize: 15, fontWeight: "900" },
  columns: { flexDirection: "row", gap: 8, height: 200 },
  column: { flex: 1 },
  columnLabel: { color: C.dim, fontSize: 8.5, fontWeight: "900", letterSpacing: 1, marginBottom: 6, textAlign: "center" },
  columnScroll: { flex: 1, backgroundColor: C.bgSecondary, borderRadius: 10, borderWidth: 1, borderColor: C.line },
  item: { paddingVertical: 9, alignItems: "center" },
  itemActive: { backgroundColor: C.cyan + "18" },
  itemText: { color: C.muted, fontSize: 12, fontWeight: "700" },
  itemTextActive: { color: C.cyan, fontWeight: "900" },
  preview: { color: "white", fontSize: 13, fontWeight: "800", textAlign: "center", marginTop: 14 },
  confirmBtn: { height: 46, borderRadius: 12, backgroundColor: C.blue, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 14 },
  confirmText: { color: "white", fontSize: 12, fontWeight: "900" },
});
