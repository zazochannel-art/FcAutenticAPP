import React, { useState, useEffect } from "react";
import { View, Text, ScrollView, StyleSheet, Pressable, TextInput, Modal, Platform, Alert, Share } from "react-native";
import * as LucideIcons from "lucide-react-native";
import Svg, { Polygon, Line, Circle } from "react-native-svg";
import { useQueryClient } from "@tanstack/react-query";
import { supabaseService } from "../services/supabaseService";
import { colors as C, themedStyles } from "../constants/theme";


const METRICS = [
  ["technique", "Tehnică"],
  ["speed", "Viteză"],
  ["discipline", "Disciplină"],
  ["attitude", "Atitudine"],
  ["tactics", "Tactică"],
  ["physical", "Fizic"],
];
const OBS_TYPES = ["Pozitiv", "De îmbunătățit", "Medical", "Disciplină"];
const POSITION_CODES = ["GK", "CB", "LB", "RB", "LWB", "RWB", "CDM", "CM", "CAM", "LM", "RM", "LW", "RW", "ST"];

function notify(title, msg) {
  if (Platform.OS === "web") window.alert(`${title}\n\n${msg}`);
  else Alert.alert(title, msg);
}

// --- Raport jucător (export / printare) ------------------------------------
function buildReportText(player, scores, obs, plan) {
  const L = [];
  L.push(`RAPORT JUCĂTOR: ${player.name}`);
  L.push(`#${player.no || "-"} · ${player.role || "-"} · ${player.group || "-"} · ${player.status || "Activ"}${player.rating != null ? ` · Rating ${player.rating}` : ""}`);
  if ((player.secondaryPositions || []).length) L.push(`Poziții secundare: ${player.secondaryPositions.join(", ")}`);
  L.push("");
  L.push("EVALUARE:");
  METRICS.forEach(([k, label]) => L.push(`  ${label}: ${Number(scores[k]) || 0}/10`));
  if ((obs || []).length) {
    L.push("");
    L.push("OBSERVAȚII:");
    obs.forEach((o) => L.push(`  [${o.type}${o.date ? ` · ${o.date}` : ""}] ${o.text}`));
  }
  if (plan && (plan.focus || plan.objective || plan.exercises)) {
    L.push("");
    L.push("PLAN DE DEZVOLTARE:");
    if (plan.focus) L.push(`  Focus: ${plan.focus}`);
    if (plan.objective) L.push(`  Obiectiv: ${plan.objective}`);
    if (plan.exercises) L.push(`  Exerciții: ${plan.exercises}`);
  }
  return L.join("\n");
}

function buildReportHtml(player, scores, obs, plan) {
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]));
  const metricRows = METRICS.map(([k, label]) => {
    const v = Number(scores[k]) || 0;
    return `<tr><td>${esc(label)}</td><td class="bar"><span style="width:${v * 10}%"></span></td><td class="v">${v}/10</td></tr>`;
  }).join("");
  const obsHtml = (obs || []).length
    ? `<h3>Observații</h3><ul>${obs.map((o) => `<li><b>${esc(o.type)}</b>${o.date ? ` · ${esc(o.date)}` : ""}: ${esc(o.text)}</li>`).join("")}</ul>`
    : "";
  const hasPlan = plan && (plan.focus || plan.objective || plan.exercises);
  const planHtml = hasPlan
    ? `<h3>Plan de dezvoltare</h3><ul>${[
        plan.focus && `<li><b>Focus:</b> ${esc(plan.focus)}</li>`,
        plan.objective && `<li><b>Obiectiv:</b> ${esc(plan.objective)}</li>`,
        plan.exercises && `<li><b>Exerciții:</b> ${esc(plan.exercises)}</li>`,
      ].filter(Boolean).join("")}</ul>`
    : "";
  const sec = (player.secondaryPositions || []).length ? ` · Poziții secundare: ${esc(player.secondaryPositions.join(", "))}` : "";
  return `<!doctype html><html lang="ro"><head><meta charset="utf-8"><title>Raport ${esc(player.name)}</title>
<style>
  body{font-family:-apple-system,Segoe UI,Roboto,Arial,sans-serif;color:#0f172a;margin:32px;}
  h1{font-size:22px;margin:0 0 2px;} .sub{color:#64748b;font-weight:700;margin-bottom:18px;}
  h3{font-size:13px;text-transform:uppercase;letter-spacing:1px;color:#0891b2;margin:20px 0 6px;}
  table{border-collapse:collapse;width:100%;max-width:460px;} td{padding:7px 8px;border-bottom:1px solid #e2e8f0;font-size:14px;}
  td.v{text-align:right;font-weight:800;width:52px;} td.bar{width:180px;} td.bar span{display:block;height:8px;border-radius:4px;background:#06b6d4;}
  ul{margin:4px 0;padding-left:18px;} li{font-size:14px;margin:3px 0;line-height:1.5;}
  @media print{body{margin:12px;}}
</style></head><body>
  <h1>${esc(player.name)}</h1>
  <div class="sub">#${esc(player.no || "-")} · ${esc(player.role || "-")} · ${esc(player.group || "-")} · ${esc(player.status || "Activ")}${player.rating != null ? ` · Rating ${esc(player.rating)}` : ""}${sec}</div>
  <h3>Evaluare</h3>
  <table>${metricRows}</table>
  ${obsHtml}
  ${planHtml}
</body></html>`;
}

function exportReport(player, scores, obs, plan) {
  if (Platform.OS === "web") {
    try {
      const w = window.open("", "_blank");
      if (!w) { notify("Blocat", "Permite ferestrele pop-up ca să printezi raportul."); return; }
      w.document.write(buildReportHtml(player, scores, obs, plan));
      w.document.close();
      w.focus();
      setTimeout(() => { try { w.print(); } catch (_) {} }, 350);
    } catch (e) { notify("Eroare", e.message); }
  } else {
    Share.share({ message: buildReportText(player, scores, obs, plan) }).catch(() => {});
  }
}

export default function PlayerDetailModal({ player, canManage, evaluations = {}, observations = {}, onClose }) {
  const queryClient = useQueryClient();
  const [tab, setTab] = useState("eval");
  const [saving, setSaving] = useState(false);

  const evalRow = evaluations[player?.id] || {};
  const [scores, setScores] = useState({});
  const [plan, setPlan] = useState({ focus: "", objective: "", exercises: "", status: "Activ" });
  const [obsForm, setObsForm] = useState({ type: "Pozitiv", text: "" });
  const [rating, setRating] = useState("");
  const [secPos, setSecPos] = useState([]);

  useEffect(() => {
    if (!player) return;
    const initial = {};
    METRICS.forEach(([k]) => { initial[k] = Number(evalRow[k]) || 0; });
    setScores(initial);
    setRating(player.rating != null ? String(player.rating) : "");
    setSecPos(Array.isArray(player.secondaryPositions) ? player.secondaryPositions : []);
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

  const bumpRating = (delta) => {
    setRating((r) => {
      const base = r === "" ? 60 : Number(r) || 0;
      return String(Math.max(1, Math.min(99, base + delta)));
    });
  };
  const toggleSecPos = (code) => {
    setSecPos((list) => (list.includes(code) ? list.filter((c) => c !== code) : [...list, code]));
  };
  const saveProfile = async () => {
    setSaving(true);
    try {
      const parsed = rating === "" ? null : Math.max(1, Math.min(99, Math.round(Number(rating)) || 0));
      await supabaseService.updatePlayer({ ...player, rating: parsed, secondaryPositions: secPos });
      queryClient.invalidateQueries({ queryKey: ["players"] });
      notify("Salvat", "Atributele jucătorului au fost salvate.");
    } catch (e) { notify("Eroare", e.message); } finally { setSaving(false); }
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
              <Text style={styles.meta}>#{player.no || "—"} • {player.role || "—"} • {player.group} • {player.status || "Activ"}{player.rating != null ? ` • ★ ${player.rating}` : ""}</Text>
            </View>
            <Pressable onPress={() => exportReport(player, scores, playerObs, plan)} style={styles.exportBtn} aria-label="Exportă raport">
              <LucideIcons.Printer size={17} color={C.cyan} />
            </Pressable>
            <Pressable onPress={onClose} style={styles.closeBtn}><LucideIcons.X size={18} color={C.muted} /></Pressable>
          </View>

          {/* Tabs */}
          <View style={styles.tabs}>
            {[["profil", "Atribute"], ["eval", "Evaluare"], ["obs", "Observații"], ["dev", "Dezvoltare"]].map(([k, l]) => (
              <Pressable key={k} onPress={() => setTab(k)} style={[styles.tab, tab === k && styles.tabActive]}>
                <Text style={[styles.tabText, tab === k && { color: C.cyan }]}>{l}</Text>
              </Pressable>
            ))}
          </View>

          <ScrollView style={{ maxHeight: 460 }} contentContainerStyle={{ padding: 16 }} showsVerticalScrollIndicator={false}>
            {tab === "profil" && (
              <>
                <Text style={styles.fieldLabel}>RATING GENERAL (1–99)</Text>
                <View style={styles.ratingRow}>
                  {canManage && (
                    <Pressable onPress={() => bumpRating(-1)} style={styles.stepBtn}><Text style={styles.stepTxt}>−</Text></Pressable>
                  )}
                  <View style={styles.ratingBadge}>
                    <Text style={styles.ratingBadgeText}>{rating === "" ? "—" : rating}</Text>
                  </View>
                  {canManage && (
                    <Pressable onPress={() => bumpRating(1)} style={styles.stepBtn}><Text style={styles.stepTxt}>+</Text></Pressable>
                  )}
                  {canManage && (
                    <TextInput
                      style={styles.ratingInput}
                      value={rating}
                      onChangeText={(v) => setRating(v.replace(/[^0-9]/g, "").slice(0, 2))}
                      placeholder="60"
                      placeholderTextColor={C.dim}
                      keyboardType="number-pad"
                    />
                  )}
                </View>

                <Text style={[styles.fieldLabel, { marginTop: 18 }]}>POZIȚIE PRINCIPALĂ</Text>
                <Text style={styles.primaryPos}>{player.role || "—"}</Text>

                <Text style={[styles.fieldLabel, { marginTop: 18 }]}>POZIȚII SECUNDARE</Text>
                <View style={styles.posGrid}>
                  {POSITION_CODES.map((code) => {
                    const on = secPos.includes(code);
                    return (
                      <Pressable key={code} disabled={!canManage} onPress={() => toggleSecPos(code)}
                        style={[styles.posChip, on && styles.posChipOn, !canManage && !on && { opacity: 0.5 }]}>
                        <Text style={[styles.posChipText, on && { color: C.cyan }]}>{code}</Text>
                      </Pressable>
                    );
                  })}
                </View>
                {!canManage && secPos.length === 0 && <Text style={styles.empty}>Nicio poziție secundară setată.</Text>}

                {canManage && (
                  <Pressable onPress={saveProfile} disabled={saving} style={styles.saveBtn}>
                    <LucideIcons.Save size={15} color="white" />
                    <Text style={styles.saveBtnText}>Salvează atributele</Text>
                  </Pressable>
                )}
              </>
            )}

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
                          <Text style={[styles.obsTypeText, obsForm.type === t && { color: C.cyan }]}>{t}</Text>
                        </Pressable>
                      ))}
                    </View>
                    <TextInput
                      style={styles.obsInput}
                      value={obsForm.text}
                      onChangeText={(text) => setObsForm((f) => ({ ...f, text }))}
                      placeholder="Scrie o observație despre jucător..."
                      placeholderTextColor={C.dim}
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
                      <Pressable onPress={() => deleteObs(o.id)} style={{ padding: 6 }}><LucideIcons.Trash2 size={14} color={C.dim} /></Pressable>
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
        placeholderTextColor={C.dim}
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
        <Polygon points={points} fill={C.cyan + "33"} stroke={C.cyan} strokeWidth="2" />
        {points.split(" ").map((p, i) => { const [x, y] = p.split(","); return <Circle key={i} cx={x} cy={y} r="2.5" fill={C.cyan} />; })}
      </Svg>
    </View>
  );
};

const styles = themedStyles((C) => StyleSheet.create({
  overlay: { flex: 1, backgroundColor: C.isDark ? "rgba(0,0,0,0.75)" : "rgba(9,9,11,0.45)", justifyContent: "flex-end" },
  sheet: { backgroundColor: C.card, borderTopLeftRadius: 24, borderTopRightRadius: 24, borderWidth: 1, borderColor: C.line, maxWidth: 560, width: "100%", alignSelf: "center" },
  header: { flexDirection: "row", alignItems: "center", padding: 18, borderBottomWidth: 1, borderBottomColor: C.line },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: C.fill4, alignItems: "center", justifyContent: "center" },
  name: { color: C.text, fontSize: 16, fontWeight: "900" },
  meta: { color: C.dim, fontSize: 10.5, fontWeight: "700", marginTop: 2 },
  exportBtn: { width: 34, height: 34, borderRadius: 10, backgroundColor: C.cyan + "12", borderWidth: 1, borderColor: C.cyan + "35", alignItems: "center", justifyContent: "center", marginRight: 8 },
  closeBtn: { width: 34, height: 34, borderRadius: 10, backgroundColor: C.fill3, alignItems: "center", justifyContent: "center" },
  tabs: { flexDirection: "row", padding: 8, gap: 6 },
  tab: { flex: 1, height: 36, borderRadius: 9, alignItems: "center", justifyContent: "center" },
  tabActive: { backgroundColor: C.cyan + "12", borderWidth: 1, borderColor: C.cyan + "30" },
  tabText: { color: C.muted, fontSize: 12, fontWeight: "900" },

  metricRow: { flexDirection: "row", alignItems: "center", marginBottom: 12, gap: 10 },
  metricLabel: { color: C.text, fontSize: 11, fontWeight: "800", width: 78 },
  metricBarBg: { flex: 1, height: 6, backgroundColor: C.fill2, borderRadius: 3, overflow: "hidden" },
  metricBarFill: { height: "100%", backgroundColor: C.cyan, borderRadius: 3 },
  stepper: { flexDirection: "row", alignItems: "center", gap: 8 },
  stepBtn: { width: 26, height: 26, borderRadius: 8, backgroundColor: C.fill2, alignItems: "center", justifyContent: "center" },
  stepTxt: { color: C.text, fontSize: 16, fontWeight: "900" },
  metricVal: { color: C.text, fontSize: 13, fontWeight: "900", width: 22, textAlign: "center" },

  saveBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, height: 44, borderRadius: 12, backgroundColor: C.blue, marginTop: 14 },
  saveBtnText: { color: C.text, fontSize: 12, fontWeight: "900" },
  empty: { color: C.muted, fontSize: 11.5, fontWeight: "600", textAlign: "center", paddingVertical: 20 },

  obsAdd: { marginBottom: 14 },
  obsTypeRow: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginBottom: 10 },
  obsTypeChip: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 12, borderWidth: 1, borderColor: C.line },
  obsTypeChipActive: { borderColor: C.cyan, backgroundColor: C.cyan + "10" },
  obsTypeText: { color: C.muted, fontSize: 10, fontWeight: "800" },
  obsInput: { minHeight: 64, backgroundColor: C.bgSecondary, borderWidth: 1, borderColor: C.line, borderRadius: 12, padding: 12, color: C.text, fontSize: 12, fontWeight: "600", textAlignVertical: "top" },
  obsItem: { flexDirection: "row", alignItems: "flex-start", paddingVertical: 11, borderBottomWidth: 1, borderBottomColor: C.line },
  obsItemType: { color: C.cyan, fontSize: 9.5, fontWeight: "900", letterSpacing: 0.4 },
  obsItemText: { color: C.text, fontSize: 12, fontWeight: "600", marginTop: 3, lineHeight: 17 },

  ratingRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  ratingBadge: { minWidth: 66, height: 52, borderRadius: 14, backgroundColor: C.cyan + "12", borderWidth: 1, borderColor: C.cyan + "40", alignItems: "center", justifyContent: "center", paddingHorizontal: 14 },
  ratingBadgeText: { color: C.cyan, fontSize: 24, fontWeight: "900" },
  ratingInput: { flex: 1, backgroundColor: C.bgSecondary, borderWidth: 1, borderColor: C.line, borderRadius: 10, paddingHorizontal: 12, height: 44, color: C.text, fontSize: 14, fontWeight: "800", textAlign: "center" },
  primaryPos: { color: C.blue, fontSize: 14, fontWeight: "900" },
  posGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 4 },
  posChip: { width: 52, height: 34, borderRadius: 10, borderWidth: 1, borderColor: C.lineStrong, alignItems: "center", justifyContent: "center" },
  posChipOn: { borderColor: C.cyan, backgroundColor: C.cyan + "12" },
  posChipText: { color: C.muted, fontSize: 11, fontWeight: "800" },

  fieldLabel: { color: C.muted, fontSize: 9, fontWeight: "900", letterSpacing: 1, marginBottom: 6 },
  fieldInput: { backgroundColor: C.bgSecondary, borderWidth: 1, borderColor: C.line, borderRadius: 10, paddingHorizontal: 12, height: 42, color: C.text, fontSize: 12, fontWeight: "600" },
}));
