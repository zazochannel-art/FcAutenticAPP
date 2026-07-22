import React, { useState, useEffect } from "react";
import { View, Text, ScrollView, StyleSheet, Pressable, TextInput, Modal, Platform, Alert } from "react-native";
import * as LucideIcons from "lucide-react-native";
import Svg, { Polygon, Line, Circle } from "react-native-svg";
import { useQueryClient } from "@tanstack/react-query";
import { supabaseService } from "../services/supabaseService";

const CARD_BG = "#071127";
const BORDER = "rgba(0, 212, 255, 0.12)";
const CYAN = "#00D4FF";
const BLUE = "#0D8BFF";
const DIM = "#94A3B8";
const TH = "#475569";

const METRICS = [
  ["technique", "Tehnică"],
  ["speed", "Viteză"],
  ["discipline", "Disciplină"],
  ["attitude", "Atitudine"],
  ["tactics", "Tactică"],
  ["physical", "Fizic"],
];
const OBS_TYPES = ["Pozitiv", "De îmbunătățit", "Medical", "Disciplină"];

function notify(title, msg) {
  if (Platform.OS === "web") window.alert(`${title}\n\n${msg}`);
  else Alert.alert(title, msg);
}

export default function PlayerDetailModal({ player, canManage, evaluations = {}, observations = {}, onClose }) {
  const queryClient = useQueryClient();
  const [tab, setTab] = useState("eval");
  const [saving, setSaving] = useState(false);

  const evalRow = evaluations[player?.id] || {};
  const [scores, setScores] = useState({});
  const [plan, setPlan] = useState({ focus: "", objective: "", exercises: "", status: "Activ" });
  const [obsForm, setObsForm] = useState({ type: "Pozitiv", text: "" });

  useEffect(() => {
    if (!player) return;
    const initial = {};
    METRICS.forEach(([k]) => { initial[k] = Number(evalRow[k]) || 0; });
    setScores(initial);
  }, [player?.id]);

  if (!player) return null;

  const playerObs = observations[player.id] || [];

  const bump = (key, delta) => {
    setScores((s) => ({ ...s, [key]: Math.max(0, Math.min(10, (Number(s[key]) || 0) + delta)) }));
  };

  const saveEval = async () => {
    setSaving(true);
    try {
      await supabaseService.saveEvaluation(player.id, { month: "Curent", ...scores });
      queryClient.invalidateQueries({ queryKey: ["evaluations"] });
      notify("Salvat", "Evaluarea a fost salvată.");
    } catch (e) { notify("Eroare", e.message); } finally { setSaving(false); }
  };

  const savePlan = async () => {
    setSaving(true);
    try {
      await supabaseService.saveDevelopmentPlan(player.id, plan);
      queryClient.invalidateQueries({ queryKey: ["developmentPlans"] });
      notify("Salvat", "Planul de dezvoltare a fost salvat.");
    } catch (e) { notify("Eroare", e.message); } finally { setSaving(false); }
  };

  const addObs = async () => {
    if (!obsForm.text.trim()) { notify("Date incomplete", "Scrie o observație."); return; }
    setSaving(true);
    try {
      await supabaseService.insertObservation(player.id, {
        type: obsForm.type,
        text: obsForm.text.trim(),
        date: new Date().toISOString().slice(0, 10),
        clubId: player.clubId,
      });
      setObsForm({ type: "Pozitiv", text: "" });
      queryClient.invalidateQueries({ queryKey: ["observations"] });
    } catch (e) { notify("Eroare", e.message); } finally { setSaving(false); }
  };

  const deleteObs = async (id) => {
    try {
      await supabaseService.deleteObservation(id);
      queryClient.invalidateQueries({ queryKey: ["observations"] });
    } catch (e) { notify("Eroare", e.message); }
  };

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.avatar}><LucideIcons.User size={20} color="white" /></View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.name}>{player.name}</Text>
              <Text style={styles.meta}>#{player.no || "—"} • {player.role || "—"} • {player.group} • {player.status || "Activ"}</Text>
            </View>
            <Pressable onPress={onClose} style={styles.closeBtn}><LucideIcons.X size={18} color={DIM} /></Pressable>
          </View>

          {/* Tabs */}
          <View style={styles.tabs}>
            {[["eval", "Evaluare"], ["obs", "Observații"], ["dev", "Dezvoltare"]].map(([k, l]) => (
              <Pressable key={k} onPress={() => setTab(k)} style={[styles.tab, tab === k && styles.tabActive]}>
                <Text style={[styles.tabText, tab === k && { color: CYAN }]}>{l}</Text>
              </Pressable>
            ))}
          </View>

          <ScrollView style={{ maxHeight: 460 }} contentContainerStyle={{ padding: 16 }} showsVerticalScrollIndicator={false}>
            {tab === "eval" && (
              <>
                <RadarChart scores={scores} />
                {METRICS.map(([key, label]) => (
                  <View key={key} style={styles.metricRow}>
                    <Text style={styles.metricLabel}>{label}</Text>
                    <View style={styles.metricBarBg}>
                      <View style={[styles.metricBarFill, { width: `${(scores[key] || 0) * 10}%` }]} />
                    </View>
                    {canManage ? (
                      <View style={styles.stepper}>
                        <Pressable onPress={() => bump(key, -1)} style={styles.stepBtn}><Text style={styles.stepTxt}>−</Text></Pressable>
                        <Text style={styles.metricVal}>{scores[key] || 0}</Text>
                        <Pressable onPress={() => bump(key, 1)} style={styles.stepBtn}><Text style={styles.stepTxt}>+</Text></Pressable>
                      </View>
                    ) : (
                      <Text style={styles.metricVal}>{scores[key] || 0}</Text>
                    )}
                  </View>
                ))}
                {canManage && (
                  <Pressable onPress={saveEval} disabled={saving} style={styles.saveBtn}>
                    <LucideIcons.Save size={15} color="white" />
                    <Text style={styles.saveBtnText}>Salvează evaluarea</Text>
                  </Pressable>
                )}
              </>
            )}

            {tab === "obs" && (
              <>
                {canManage && (
                  <View style={styles.obsAdd}>
                    <View style={styles.obsTypeRow}>
                      {OBS_TYPES.map((t) => (
                        <Pressable key={t} onPress={() => setObsForm((f) => ({ ...f, type: t }))} style={[styles.obsTypeChip, obsForm.type === t && styles.obsTypeChipActive]}>
                          <Text style={[styles.obsTypeText, obsForm.type === t && { color: CYAN }]}>{t}</Text>
                        </Pressable>
                      ))}
                    </View>
                    <TextInput
                      style={styles.obsInput}
                      value={obsForm.text}
                      onChangeText={(text) => setObsForm((f) => ({ ...f, text }))}
                      placeholder="Scrie o observație despre jucător..."
                      placeholderTextColor={TH}
                      multiline
                    />
                    <Pressable onPress={addObs} disabled={saving} style={styles.saveBtn}>
                      <LucideIcons.Plus size={15} color="white" />
                      <Text style={styles.saveBtnText}>Adaugă observație</Text>
                    </Pressable>
                  </View>
                )}
                {playerObs.length === 0 && <Text style={styles.empty}>Nicio observație încă.</Text>}
                {playerObs.map((o) => (
                  <View key={o.id} style={styles.obsItem}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.obsItemType}>{o.type}{o.date ? ` • ${o.date}` : ""}</Text>
                      <Text style={styles.obsItemText}>{o.text}</Text>
                    </View>
                    {canManage && (
                      <Pressable onPress={() => deleteObs(o.id)} style={{ padding: 6 }}><LucideIcons.Trash2 size={14} color={TH} /></Pressable>
                    )}
                  </View>
                ))}
              </>
            )}

            {tab === "dev" && (
              <>
                <Field label="FOCUS" value={plan.focus} onChange={(v) => setPlan((p) => ({ ...p, focus: v }))} placeholder="Ex: Piciorul stâng, jocul de cap" editable={canManage} />
                <Field label="OBIECTIV" value={plan.objective} onChange={(v) => setPlan((p) => ({ ...p, objective: v }))} placeholder="Ex: Titular în 3 luni" editable={canManage} />
                <Field label="EXERCIȚII" value={plan.exercises} onChange={(v) => setPlan((p) => ({ ...p, exercises: v }))} placeholder="Ex: Ședințe individuale finalizare" editable={canManage} multiline />
                {canManage && (
                  <Pressable onPress={savePlan} disabled={saving} style={styles.saveBtn}>
                    <LucideIcons.Save size={15} color="white" />
                    <Text style={styles.saveBtnText}>Salvează planul</Text>
                  </Pressable>
                )}
                {!canManage && !plan.focus && !plan.objective && <Text style={styles.empty}>Niciun plan de dezvoltare încă.</Text>}
              </>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

function Field({ label, value, onChange, placeholder, editable, multiline }) {
  return (
    <View style={{ marginBottom: 12 }}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        style={[styles.fieldInput, multiline && { height: 70, textAlignVertical: "top", paddingTop: 10 }]}
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={TH}
        editable={editable}
        multiline={multiline}
      />
    </View>
  );
}

const RadarChart = ({ scores }) => {
  const size = 180, cx = size / 2, cy = size / 2, r = 66;
  const n = METRICS.length;
  const points = METRICS.map(([key], i) => {
    const angle = (Math.PI * 2 * i) / n - Math.PI / 2;
    const val = (Number(scores[key]) || 0) / 10;
    return `${cx + r * val * Math.cos(angle)},${cy + r * val * Math.sin(angle)}`;
  }).join(" ");
  const grid = METRICS.map((_, i) => {
    const angle = (Math.PI * 2 * i) / n - Math.PI / 2;
    return { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) };
  });
  return (
    <View style={{ alignItems: "center", marginBottom: 16 }}>
      <Svg width={size} height={size}>
        {[0.25, 0.5, 0.75, 1].map((f, i) => (
          <Polygon
            key={i}
            points={grid.map((g) => `${cx + (g.x - cx) * f},${cy + (g.y - cy) * f}`).join(" ")}
            fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="1"
          />
        ))}
        {grid.map((g, i) => <Line key={i} x1={cx} y1={cy} x2={g.x} y2={g.y} stroke="rgba(255,255,255,0.08)" strokeWidth="1" />)}
        <Polygon points={points} fill={CYAN + "33"} stroke={CYAN} strokeWidth="2" />
        {points.split(" ").map((p, i) => { const [x, y] = p.split(","); return <Circle key={i} cx={x} cy={y} r="2.5" fill={CYAN} />; })}
      </Svg>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: "rgba(2,6,23,0.88)", justifyContent: "flex-end" },
  sheet: { backgroundColor: CARD_BG, borderTopLeftRadius: 24, borderTopRightRadius: 24, borderWidth: 1, borderColor: BORDER, maxWidth: 560, width: "100%", alignSelf: "center" },
  header: { flexDirection: "row", alignItems: "center", padding: 18, borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.05)" },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: "rgba(255,255,255,0.08)", alignItems: "center", justifyContent: "center" },
  name: { color: "white", fontSize: 16, fontWeight: "900" },
  meta: { color: TH, fontSize: 10.5, fontWeight: "700", marginTop: 2 },
  closeBtn: { width: 34, height: 34, borderRadius: 10, backgroundColor: "rgba(255,255,255,0.05)", alignItems: "center", justifyContent: "center" },
  tabs: { flexDirection: "row", padding: 8, gap: 6 },
  tab: { flex: 1, height: 36, borderRadius: 9, alignItems: "center", justifyContent: "center" },
  tabActive: { backgroundColor: CYAN + "12", borderWidth: 1, borderColor: CYAN + "30" },
  tabText: { color: DIM, fontSize: 12, fontWeight: "900" },

  metricRow: { flexDirection: "row", alignItems: "center", marginBottom: 12, gap: 10 },
  metricLabel: { color: "white", fontSize: 11, fontWeight: "800", width: 78 },
  metricBarBg: { flex: 1, height: 6, backgroundColor: "rgba(255,255,255,0.06)", borderRadius: 3, overflow: "hidden" },
  metricBarFill: { height: "100%", backgroundColor: CYAN, borderRadius: 3 },
  stepper: { flexDirection: "row", alignItems: "center", gap: 8 },
  stepBtn: { width: 26, height: 26, borderRadius: 8, backgroundColor: "rgba(255,255,255,0.06)", alignItems: "center", justifyContent: "center" },
  stepTxt: { color: "white", fontSize: 16, fontWeight: "900" },
  metricVal: { color: "white", fontSize: 13, fontWeight: "900", width: 22, textAlign: "center" },

  saveBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, height: 44, borderRadius: 12, backgroundColor: BLUE, marginTop: 14 },
  saveBtnText: { color: "white", fontSize: 12, fontWeight: "900" },
  empty: { color: DIM, fontSize: 11.5, fontWeight: "600", textAlign: "center", paddingVertical: 20 },

  obsAdd: { marginBottom: 14 },
  obsTypeRow: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginBottom: 10 },
  obsTypeChip: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 12, borderWidth: 1, borderColor: "rgba(255,255,255,0.08)" },
  obsTypeChipActive: { borderColor: CYAN, backgroundColor: CYAN + "10" },
  obsTypeText: { color: DIM, fontSize: 10, fontWeight: "800" },
  obsInput: { minHeight: 64, backgroundColor: "rgba(2,6,23,0.6)", borderWidth: 1, borderColor: "#1e293b", borderRadius: 12, padding: 12, color: "white", fontSize: 12, fontWeight: "600", textAlignVertical: "top" },
  obsItem: { flexDirection: "row", alignItems: "flex-start", paddingVertical: 11, borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.04)" },
  obsItemType: { color: CYAN, fontSize: 9.5, fontWeight: "900", letterSpacing: 0.4 },
  obsItemText: { color: "white", fontSize: 12, fontWeight: "600", marginTop: 3, lineHeight: 17 },

  fieldLabel: { color: DIM, fontSize: 9, fontWeight: "900", letterSpacing: 1, marginBottom: 6 },
  fieldInput: { backgroundColor: "rgba(2,6,23,0.6)", borderWidth: 1, borderColor: "#1e293b", borderRadius: 10, paddingHorizontal: 12, height: 42, color: "white", fontSize: 12, fontWeight: "600" },
});
