import React, { useMemo, useRef, useState } from "react";
import {
  View, Text, ScrollView, StyleSheet, Pressable, Modal, TextInput,
  Platform, Alert, PanResponder, Share,
} from "react-native";
import Svg, { Rect, Line, Circle } from "react-native-svg";
import * as LucideIcons from "lucide-react-native";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { colors as C, themedStyles, layout } from "../constants/theme";
import { TopBar } from "../components/SharedComponents";
import { supabaseService } from "../services/supabaseService";
import {
  POSITION_LINE as LINE_OF_CODE,
  playerLine,
  isAvailable,
  suspendedPlayerIds,
  slotSuitability,
} from "../utils/tactics";
import { SkeletonRow } from "../components/ui/visuals";
import { BRAND_NAME } from "../constants/brand";

function notify(title, msg) {
  if (Platform.OS === "web") window.alert(`${title}\n\n${msg}`);
  else Alert.alert(title, msg);
}
function confirmDelete(msg, run) {
  if (Platform.OS === "web") { if (window.confirm(msg)) run(); }
  else Alert.alert("Confirmare", msg, [{ text: "Anulează", style: "cancel" }, { text: "Șterge", style: "destructive", onPress: run }]);
}

// ---------------------------------------------------------------------------
// Formații — fiecare slot: { id, code, x (0-100 stânga→dreapta), y (0-100 sus→jos) }
// Sus = poarta adversă (atac), jos = poarta proprie (portar).
// ---------------------------------------------------------------------------
const FORMATIONS = {
  "4-4-2": [
    { id: "gk", code: "GK", x: 50, y: 92 },
    { id: "rb", code: "RB", x: 82, y: 72 }, { id: "rcb", code: "CB", x: 61, y: 75 }, { id: "lcb", code: "CB", x: 39, y: 75 }, { id: "lb", code: "LB", x: 18, y: 72 },
    { id: "rm", code: "RM", x: 84, y: 46 }, { id: "rcm", code: "CM", x: 60, y: 49 }, { id: "lcm", code: "CM", x: 40, y: 49 }, { id: "lm", code: "LM", x: 16, y: 46 },
    { id: "rs", code: "ST", x: 60, y: 20 }, { id: "ls", code: "ST", x: 40, y: 20 },
  ],
  "4-3-3": [
    { id: "gk", code: "GK", x: 50, y: 92 },
    { id: "rb", code: "RB", x: 82, y: 72 }, { id: "rcb", code: "CB", x: 61, y: 75 }, { id: "lcb", code: "CB", x: 39, y: 75 }, { id: "lb", code: "LB", x: 18, y: 72 },
    { id: "dm", code: "CDM", x: 50, y: 56 }, { id: "rcm", code: "CM", x: 70, y: 45 }, { id: "lcm", code: "CM", x: 30, y: 45 },
    { id: "rw", code: "RW", x: 80, y: 22 }, { id: "st", code: "ST", x: 50, y: 16 }, { id: "lw", code: "LW", x: 20, y: 22 },
  ],
  "4-2-3-1": [
    { id: "gk", code: "GK", x: 50, y: 92 },
    { id: "rb", code: "RB", x: 82, y: 72 }, { id: "rcb", code: "CB", x: 61, y: 75 }, { id: "lcb", code: "CB", x: 39, y: 75 }, { id: "lb", code: "LB", x: 18, y: 72 },
    { id: "rdm", code: "CDM", x: 62, y: 57 }, { id: "ldm", code: "CDM", x: 38, y: 57 },
    { id: "ram", code: "RM", x: 82, y: 37 }, { id: "cam", code: "CAM", x: 50, y: 38 }, { id: "lam", code: "LM", x: 18, y: 37 },
    { id: "st", code: "ST", x: 50, y: 16 },
  ],
  "4-1-4-1": [
    { id: "gk", code: "GK", x: 50, y: 92 },
    { id: "rb", code: "RB", x: 82, y: 72 }, { id: "rcb", code: "CB", x: 61, y: 75 }, { id: "lcb", code: "CB", x: 39, y: 75 }, { id: "lb", code: "LB", x: 18, y: 72 },
    { id: "dm", code: "CDM", x: 50, y: 58 },
    { id: "rm", code: "RM", x: 82, y: 42 }, { id: "rcm", code: "CM", x: 60, y: 44 }, { id: "lcm", code: "CM", x: 40, y: 44 }, { id: "lm", code: "LM", x: 18, y: 42 },
    { id: "st", code: "ST", x: 50, y: 18 },
  ],
  "3-5-2": [
    { id: "gk", code: "GK", x: 50, y: 92 },
    { id: "rcb", code: "CB", x: 70, y: 75 }, { id: "cb", code: "CB", x: 50, y: 77 }, { id: "lcb", code: "CB", x: 30, y: 75 },
    { id: "rwb", code: "RWB", x: 88, y: 52 }, { id: "rcm", code: "CM", x: 64, y: 49 }, { id: "dm", code: "CDM", x: 50, y: 56 }, { id: "lcm", code: "CM", x: 36, y: 49 }, { id: "lwb", code: "LWB", x: 12, y: 52 },
    { id: "rs", code: "ST", x: 60, y: 20 }, { id: "ls", code: "ST", x: 40, y: 20 },
  ],
  "3-4-3": [
    { id: "gk", code: "GK", x: 50, y: 92 },
    { id: "rcb", code: "CB", x: 70, y: 75 }, { id: "cb", code: "CB", x: 50, y: 77 }, { id: "lcb", code: "CB", x: 30, y: 75 },
    { id: "rm", code: "RM", x: 84, y: 48 }, { id: "rcm", code: "CM", x: 60, y: 50 }, { id: "lcm", code: "CM", x: 40, y: 50 }, { id: "lm", code: "LM", x: 16, y: 48 },
    { id: "rw", code: "RW", x: 78, y: 22 }, { id: "st", code: "ST", x: 50, y: 17 }, { id: "lw", code: "LW", x: 22, y: 22 },
  ],
  "5-3-2": [
    { id: "gk", code: "GK", x: 50, y: 92 },
    { id: "rwb", code: "RWB", x: 88, y: 66 }, { id: "rcb", code: "CB", x: 68, y: 76 }, { id: "cb", code: "CB", x: 50, y: 78 }, { id: "lcb", code: "CB", x: 32, y: 76 }, { id: "lwb", code: "LWB", x: 12, y: 66 },
    { id: "rcm", code: "CM", x: 68, y: 48 }, { id: "dm", code: "CDM", x: 50, y: 52 }, { id: "lcm", code: "CM", x: 32, y: 48 },
    { id: "rs", code: "ST", x: 60, y: 22 }, { id: "ls", code: "ST", x: 40, y: 22 },
  ],
  "5-4-1": [
    { id: "gk", code: "GK", x: 50, y: 92 },
    { id: "rwb", code: "RWB", x: 88, y: 66 }, { id: "rcb", code: "CB", x: 68, y: 76 }, { id: "cb", code: "CB", x: 50, y: 78 }, { id: "lcb", code: "CB", x: 32, y: 76 }, { id: "lwb", code: "LWB", x: 12, y: 66 },
    { id: "rm", code: "RM", x: 84, y: 46 }, { id: "rcm", code: "CM", x: 60, y: 48 }, { id: "lcm", code: "CM", x: 40, y: 48 }, { id: "lm", code: "LM", x: 16, y: 46 },
    { id: "st", code: "ST", x: 50, y: 20 },
  ],
  "Personalizată": [
    { id: "gk", code: "GK", x: 50, y: 92 },
    { id: "rb", code: "RB", x: 82, y: 72 }, { id: "rcb", code: "CB", x: 61, y: 75 }, { id: "lcb", code: "CB", x: 39, y: 75 }, { id: "lb", code: "LB", x: 18, y: 72 },
    { id: "rm", code: "RM", x: 84, y: 46 }, { id: "rcm", code: "CM", x: 60, y: 49 }, { id: "lcm", code: "CM", x: 40, y: 49 }, { id: "lm", code: "LM", x: 16, y: 46 },
    { id: "rs", code: "ST", x: 60, y: 20 }, { id: "ls", code: "ST", x: 40, y: 20 },
  ],
};
const FORMATION_NAMES = Object.keys(FORMATIONS);

const LINE_LABEL = { GK: "Portari", DEF: "Fundași", MID: "Mijlocași", ATT: "Atacanți" };
const LINE_COLOR_ = () => ({ GK: C.amber, DEF: C.blue, MID: C.cyan, ATT: C.purple });

const MENTALITIES = ["Foarte defensiv", "Defensiv", "Echilibrat", "Ofensiv", "Foarte ofensiv"];
const STYLES = ["Posesie", "Contraatac", "Presing agresiv", "Joc direct", "Atac pe benzi", "Pase scurte", "Pase lungi", "Echilibrat"];
const SLIDERS = [
  { key: "width", label: "Lățimea echipei", lo: "Îngust", hi: "Foarte larg", color: C.cyan },
  { key: "defensiveLine", label: "Linia defensivă", lo: "Joasă", hi: "Avansată", color: C.blue },
  { key: "pressing", label: "Intensitatea presingului", lo: "Redusă", hi: "Foarte mare", color: C.purple },
  { key: "tempo", label: "Ritmul jocului", lo: "Lent", hi: "Foarte rapid", color: C.amber },
];
const IND_ROLE = ["Standard", "Ofensiv", "Defensiv", "Suport"];
const IND_FREEDOM = ["Disciplinat", "Echilibrat", "Liber"];
const IND_TOGGLES = [
  { key: "attack", label: "Urcă în atac" },
  { key: "defend", label: "Rămâne în apărare" },
  { key: "passShort", label: "Pasează mai scurt" },
  { key: "passDirect", label: "Pasează mai direct" },
  { key: "shoot", label: "Șutează mai des" },
  { key: "cross", label: "Centrează mai des" },
  { key: "mark", label: "Marchează strâns" },
  { key: "press", label: "Presează agresiv" },
];

function initials(name = "") {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}
function shortName(name = "") {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length <= 1) return name;
  return `${parts[0][0]}. ${parts[parts.length - 1]}`;
}

function emptyDraft(formation = "4-3-3") {
  return {
    id: null, name: "", formation, isPublished: false,
    assignments: {}, subs: [], captainId: null,
    setPieces: {}, teamInstructions: defaultTeamInstructions(), playerInstructions: {},
  };
}
function defaultTeamInstructions() {
  return { mentality: "Echilibrat", style: "Echilibrat", width: 50, defensiveLine: 50, pressing: 50, tempo: 50 };
}

// ---------------------------------------------------------------------------
// Export / printare tactică (web: fereastră printabilă; nativ: Share text)
// ---------------------------------------------------------------------------
function buildTacticText(t, slots, playersById) {
  const L = [];
  L.push(`TACTICĂ: ${t.name || "Fără nume"} (${t.formation})`);
  L.push("");
  L.push("PRIMUL 11:");
  slots.forEach((s) => {
    const p = playersById[t.assignments[s.id]];
    const cap = p && p.id === t.captainId ? " (C)" : "";
    L.push(`  ${s.code}: ${p ? `#${p.no || "-"} ${p.name}${cap}` : "—"}`);
  });
  const subs = (t.subs || []).map((id) => playersById[id]).filter(Boolean);
  if (subs.length) { L.push(""); L.push("REZERVE:"); subs.forEach((p) => L.push(`  #${p.no || "-"} ${p.name}`)); }
  const sp = t.setPieces || {};
  const spL = [];
  if (playersById[sp.penalty]) spL.push(`  Penalty: ${playersById[sp.penalty].name}`);
  if (playersById[sp.freekick]) spL.push(`  Lovituri libere: ${playersById[sp.freekick].name}`);
  if (playersById[sp.corner]) spL.push(`  Cornere: ${playersById[sp.corner].name}`);
  if (spL.length) { L.push(""); L.push("FAZE FIXE:"); spL.forEach((l) => L.push(l)); }
  const ti = t.teamInstructions || {};
  L.push(""); L.push("INSTRUCȚIUNI ECHIPĂ:");
  L.push(`  Mentalitate: ${ti.mentality || "-"} · Stil: ${ti.style || "-"}`);
  L.push(`  Lățime ${ti.width ?? 50} · Linie def. ${ti.defensiveLine ?? 50} · Presing ${ti.pressing ?? 50} · Ritm ${ti.tempo ?? 50}`);
  return L.join("\n");
}

function buildTacticHtml(t, slots, playersById) {
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]));
  const rows = slots.map((s) => {
    const p = playersById[t.assignments[s.id]];
    const cap = p && p.id === t.captainId ? ' <b style="color:#b45309">(C)</b>' : "";
    return `<tr><td class="code">${s.code}</td><td>${p ? `#${esc(p.no || "-")} ${esc(p.name)}${cap}` : "—"}</td><td class="rt">${p && p.rating != null ? esc(p.rating) : ""}</td></tr>`;
  }).join("");
  const subs = (t.subs || []).map((id) => playersById[id]).filter(Boolean);
  const subsHtml = subs.length ? `<h3>Rezerve</h3><ul>${subs.map((p) => `<li>#${esc(p.no || "-")} ${esc(p.name)}</li>`).join("")}</ul>` : "";
  const sp = t.setPieces || {};
  const spItems = [
    playersById[sp.penalty] && `Penalty: ${esc(playersById[sp.penalty].name)}`,
    playersById[sp.freekick] && `Lovituri libere: ${esc(playersById[sp.freekick].name)}`,
    playersById[sp.corner] && `Cornere: ${esc(playersById[sp.corner].name)}`,
  ].filter(Boolean);
  const spHtml = spItems.length ? `<h3>Faze fixe</h3><ul>${spItems.map((x) => `<li>${x}</li>`).join("")}</ul>` : "";
  const ti = t.teamInstructions || {};
  return `<!doctype html><html lang="ro"><head><meta charset="utf-8"><title>${esc(t.name || "Tactică")}</title>
<style>
  body{font-family:-apple-system,Segoe UI,Roboto,Arial,sans-serif;color:#0f172a;margin:32px;}
  h1{font-size:22px;margin:0 0 2px;} .sub{color:#64748b;font-weight:700;margin-bottom:18px;}
  h3{font-size:13px;text-transform:uppercase;letter-spacing:1px;color:#0891b2;margin:20px 0 6px;}
  table{border-collapse:collapse;width:100%;max-width:460px;} td{padding:6px 8px;border-bottom:1px solid #e2e8f0;font-size:14px;}
  td.code{font-weight:800;color:#0891b2;width:56px;} td.rt{text-align:right;color:#64748b;font-weight:700;width:40px;}
  ul{margin:4px 0;padding-left:18px;} li{font-size:14px;margin:2px 0;}
  .ti{font-size:14px;line-height:1.6;}
  @media print{body{margin:12px;}}
</style></head><body>
  <h1>${esc(t.name || "Tactică")}</h1>
  <div class="sub">Formație ${esc(t.formation)}</div>
  <h3>Primul 11</h3>
  <table>${rows}</table>
  ${subsHtml}
  ${spHtml}
  <h3>Instrucțiuni de echipă</h3>
  <div class="ti">Mentalitate: <b>${esc(ti.mentality || "-")}</b> · Stil: <b>${esc(ti.style || "-")}</b><br>
  Lățime ${esc(ti.width ?? 50)} · Linie defensivă ${esc(ti.defensiveLine ?? 50)} · Presing ${esc(ti.pressing ?? 50)} · Ritm ${esc(ti.tempo ?? 50)}</div>
</body></html>`;
}

function exportTactic(t, slots, playersById) {
  if (Platform.OS === "web") {
    try {
      const w = window.open("", "_blank");
      if (!w) { notify("Blocat", "Permite ferestrele pop-up ca să printezi tactica."); return; }
      w.document.write(buildTacticHtml(t, slots, playersById));
      w.document.close();
      w.focus();
      setTimeout(() => { try { w.print(); } catch (_) {} }, 350);
    } catch (e) { notify("Eroare", e.message); }
  } else {
    Share.share({ message: buildTacticText(t, slots, playersById) }).catch(() => {});
  }
}

// ---------------------------------------------------------------------------
// Slider fără dependențe (PanResponder)
// ---------------------------------------------------------------------------
function Slider({ value = 50, onChange, disabled, color = C.cyan }) {
  const widthRef = useRef(0);
  const onChangeRef = useRef(onChange); onChangeRef.current = onChange;
  const disabledRef = useRef(disabled); disabledRef.current = disabled;
  const compute = (e) => {
    const x = e.nativeEvent.locationX;
    const w = widthRef.current || 1;
    let pct = Math.round((x / w) * 100);
    pct = Math.max(0, Math.min(100, pct));
    onChangeRef.current && onChangeRef.current(pct);
  };
  const responder = useRef(PanResponder.create({
    onStartShouldSetPanResponder: () => !disabledRef.current,
    onMoveShouldSetPanResponder: () => !disabledRef.current,
    onPanResponderGrant: compute,
    onPanResponderMove: compute,
  })).current;
  return (
    <View
      onLayout={(e) => { widthRef.current = e.nativeEvent.layout.width; }}
      {...(disabled ? {} : responder.panHandlers)}
      style={styles.sliderTrack}
    >
      <View style={[styles.sliderFill, { width: `${value}%`, backgroundColor: color }]} />
      <View style={[styles.sliderThumb, { left: `${value}%`, borderColor: color }]} />
    </View>
  );
}

// ---------------------------------------------------------------------------
// FormationSelector
// ---------------------------------------------------------------------------
function FormationSelector({ value, onChange, disabled }) {
  return (
    <View>
      <Text style={styles.sectionLabel}>FORMAȚIE</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingRight: 8 }}>
        {FORMATION_NAMES.map((f) => {
          const active = value === f;
          return (
            <Pressable key={f} disabled={disabled} onPress={() => onChange(f)}
              style={[styles.formChip, active && { borderColor: C.cyan, backgroundColor: C.cyan + "14" }, disabled && { opacity: 0.6 }]}>
              <Text style={[styles.formChipText, active && { color: C.cyan }]}>{f}</Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

// ---------------------------------------------------------------------------
// PlayerPosition — card pe teren
// ---------------------------------------------------------------------------
function PlayerPosition({ slot, player, isCaptain, moveActive, suspended, onPress }) {
  const lineColor = LINE_COLOR_()[LINE_OF_CODE[slot.code]] || C.cyan;
  const available = player ? (isAvailable(player.status) && !suspended) : true;
  return (
    <Pressable
      onPress={onPress}
      style={[styles.posWrap, { left: `${slot.x}%`, top: `${slot.y}%` }]}
    >
      <View style={[
        styles.posAvatar,
        { borderColor: player ? lineColor : "rgba(255,255,255,0.35)", backgroundColor: player ? C.isDark ? "rgba(0,0,0,0.72)" : "rgba(9,9,11,0.45)" : C.bgSecondary },
        moveActive && { borderColor: C.amber, borderStyle: "dashed" },
      ]}>
        {player ? (
          <Text style={styles.posInitials}>{player.no ? `#${player.no}` : initials(player.name)}</Text>
        ) : (
          <LucideIcons.Plus size={16} color="rgba(255,255,255,0.6)" />
        )}
        {isCaptain && (
          <View style={styles.capBadge}><Text style={styles.capBadgeText}>C</Text></View>
        )}
        {player && !available && (
          <View style={[styles.condDot, { backgroundColor: C.red }]} />
        )}
        {player && available && (
          <View style={[styles.condDot, { backgroundColor: C.green }]} />
        )}
      </View>
      <View style={[styles.posCodeTag, { backgroundColor: lineColor + "22", borderColor: lineColor + "55" }]}>
        <Text style={[styles.posCode, { color: lineColor }]}>{slot.code}</Text>
      </View>
      <Text style={styles.posName} numberOfLines={1}>
        {player ? shortName(player.name) : "Alege"}
      </Text>
    </Pressable>
  );
}

// ---------------------------------------------------------------------------
// FootballPitch
// ---------------------------------------------------------------------------
function FootballPitch({ slots, assignments, playersById, captainId, moveSource, suspendedIds, onSlotPress }) {
  return (
    <View style={styles.pitchWrap}>
      <Svg width="100%" height="100%" viewBox="0 0 100 150" preserveAspectRatio="none">
        <Rect x="0" y="0" width="100" height="150" fill="#0a3d1f" />
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <Rect key={i} x="0" y={i * 25} width="100" height="12.5" fill="#0d4a26" opacity="0.55" />
        ))}
        <Rect x="3" y="3" width="94" height="144" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="0.6" />
        <Line x1="3" y1="75" x2="97" y2="75" stroke="rgba(255,255,255,0.5)" strokeWidth="0.6" />
        <Circle cx="50" cy="75" r="12" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="0.6" />
        <Circle cx="50" cy="75" r="1" fill="rgba(255,255,255,0.5)" />
        {/* careu jos (poarta proprie) */}
        <Rect x="26" y="128" width="48" height="19" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="0.6" />
        <Rect x="38" y="140" width="24" height="7" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="0.6" />
        {/* careu sus (poarta adversă) */}
        <Rect x="26" y="3" width="48" height="19" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="0.6" />
        <Rect x="38" y="3" width="24" height="7" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="0.6" />
      </Svg>
      <View style={StyleSheet.absoluteFill}>
        {slots.map((slot) => (
          <PlayerPosition
            key={slot.id}
            slot={slot}
            player={playersById[assignments[slot.id]]}
            isCaptain={!!assignments[slot.id] && assignments[slot.id] === captainId}
            moveActive={moveSource === slot.id}
            suspended={suspendedIds ? suspendedIds.has(assignments[slot.id]) : false}
            onPress={() => onSlotPress(slot)}
          />
        ))}
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// PlayerSelectionModal
// ---------------------------------------------------------------------------
function PlayerSelectionModal({ visible, players, targetSlot, usedIds, currentId, suspendedIds, onPick, onClose }) {
  const [q, setQ] = useState("");
  const [lineFilter, setLineFilter] = useState("Toate");
  const [onlyAvailable, setOnlyAvailable] = useState(false);
  const [sortBy, setSortBy] = useState("Nume");
  const susp = suspendedIds || new Set();
  const available = (p) => isAvailable(p.status) && !susp.has(p.id);

  React.useEffect(() => { if (visible) { setQ(""); setLineFilter("Toate"); setOnlyAvailable(false); setSortBy("Nume"); } }, [visible]);

  const slotLine = targetSlot ? LINE_OF_CODE[targetSlot.code] : null;
  const suitabilityOf = (p) => slotSuitability(p, targetSlot?.code);

  const list = useMemo(() => {
    let arr = players.filter((p) => !usedIds.has(p.id) || p.id === currentId);
    if (q.trim()) {
      const s = q.toLowerCase();
      arr = arr.filter((p) => p.name.toLowerCase().includes(s) || String(p.no || "").includes(s) || (p.role || "").toLowerCase().includes(s));
    }
    if (lineFilter !== "Toate") arr = arr.filter((p) => playerLine(p.role) === lineFilter);
    if (onlyAvailable) arr = arr.filter((p) => available(p));
    arr = [...arr].sort((a, b) => {
      if (sortBy === "Rating") return (b.rating ?? -1) - (a.rating ?? -1) || a.name.localeCompare(b.name);
      if (sortBy === "Poziție") return playerLine(a.role).localeCompare(playerLine(b.role)) || a.name.localeCompare(b.name);
      if (sortBy === "Disponibilitate") return (available(b) - available(a)) || a.name.localeCompare(b.name);
      return a.name.localeCompare(b.name);
    });
    if (targetSlot) {
      arr = [...arr].sort((a, b) => suitabilityOf(a) - suitabilityOf(b));
    }
    return arr;
  }, [players, usedIds, currentId, q, lineFilter, onlyAvailable, sortBy, targetSlot, slotLine]);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.sheetOverlay}>
        <View style={styles.sheetCard}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{targetSlot ? `Alege jucător · ${targetSlot.code}` : "Alege jucător"}</Text>
            <Pressable onPress={onClose} hitSlop={8}><LucideIcons.X size={18} color={C.dim} /></Pressable>
          </View>

          <View style={styles.searchRow}>
            <LucideIcons.Search size={15} color={C.dim} />
            <TextInput style={styles.searchInput} value={q} onChangeText={setQ} placeholder="Caută după nume, număr, poziție" placeholderTextColor={C.dim} />
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
            {["Toate", "GK", "DEF", "MID", "ATT"].map((l) => (
              <Pressable key={l} onPress={() => setLineFilter(l)} style={[styles.miniChip, lineFilter === l && styles.miniChipOn]}>
                <Text style={[styles.miniChipText, lineFilter === l && styles.miniChipTextOn]}>{l === "Toate" ? "Toate" : LINE_LABEL[l]}</Text>
              </Pressable>
            ))}
          </ScrollView>

          <View style={styles.sortRow}>
            <Pressable onPress={() => setOnlyAvailable((v) => !v)} style={[styles.miniChip, onlyAvailable && styles.miniChipOn]}>
              <LucideIcons.Check size={12} color={onlyAvailable ? C.bg : C.dim} />
              <Text style={[styles.miniChipText, onlyAvailable && styles.miniChipTextOn]}>Doar disponibili</Text>
            </Pressable>
            {["Rating", "Nume", "Poziție", "Disponibilitate"].map((s) => (
              <Pressable key={s} onPress={() => setSortBy(s)} style={[styles.miniChip, sortBy === s && styles.miniChipOn]}>
                <Text style={[styles.miniChipText, sortBy === s && styles.miniChipTextOn]}>{s}</Text>
              </Pressable>
            ))}
          </View>

          <ScrollView style={{ marginTop: 6 }} showsVerticalScrollIndicator={false}>
            {list.length === 0 && <Text style={styles.emptyRow}>Niciun jucător găsit.</Text>}
            {list.map((p) => {
              const line = playerLine(p.role);
              const suit = suitabilityOf(p);
              const avail = available(p);
              const secLabel = (p.secondaryPositions || []).length ? ` · ${p.secondaryPositions.join("/")}` : "";
              return (
                <Pressable key={p.id} onPress={() => onPick(p.id)} style={styles.playerCard}>
                  <View style={[styles.playerNo, { backgroundColor: (LINE_COLOR_()[line] || C.cyan) + "22" }]}>
                    <Text style={[styles.playerNoText, { color: LINE_COLOR_()[line] || C.cyan }]}>{p.no ? p.no : initials(p.name)}</Text>
                  </View>
                  <View style={{ flex: 1, marginLeft: 10 }}>
                    <Text style={styles.playerCardName} numberOfLines={1}>{p.name}</Text>
                    <Text style={styles.playerCardMeta} numberOfLines={1}>
                      {[p.role || LINE_LABEL[line], p.group].filter(Boolean).join(" · ")}{secLabel}
                    </Text>
                  </View>
                  {p.rating != null && (
                    <View style={styles.ratingChip}><Text style={styles.ratingChipText}>{p.rating}</Text></View>
                  )}
                  {targetSlot && suit === 0 && <View style={styles.fitBadge}><Text style={styles.fitBadgeText}>Potrivit</Text></View>}
                  {targetSlot && suit === 1 && <View style={styles.fitBadgeAlt}><Text style={styles.fitBadgeAltText}>Poz. 2</Text></View>}
                  <View style={[styles.availPill, { backgroundColor: (avail ? C.green : C.red) + "18" }]}>
                    <Text style={[styles.availPillText, { color: avail ? C.green : C.red }]}>{avail ? "Apt" : "Indispon."}</Text>
                  </View>
                </Pressable>
              );
            })}
            <View style={{ height: 12 }} />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

// ---------------------------------------------------------------------------
// PlayerActionMenu
// ---------------------------------------------------------------------------
function PlayerActionMenu({ visible, player, slot, isCaptain, setPieces, onAction, onClose }) {
  if (!player) return null;
  const items = [
    { key: "change", label: "Schimbă jucătorul", icon: "ArrowLeftRight" },
    { key: "move", label: "Mută pe altă poziție", icon: "Move" },
    { key: "remove", label: "Scoate din primul 11", icon: "UserRound" },
    { key: "captain", label: isCaptain ? "Elimină banderola" : "Setează căpitan", icon: "Crown" },
    { key: "instructions", label: "Instrucțiuni individuale", icon: "ListOrdered" },
    { key: "penalty", label: `Executant penalty${setPieces.penalty === player.id ? " ✓" : ""}`, icon: "Target" },
    { key: "freekick", label: `Lovituri libere${setPieces.freekick === player.id ? " ✓" : ""}`, icon: "CornerUpRight" },
    { key: "corner", label: `Cornere${setPieces.corner === player.id ? " ✓" : ""}`, icon: "Flag" },
    { key: "details", label: "Vezi detalii", icon: "CircleDot" },
  ];
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.menuOverlay} onPress={onClose}>
        <Pressable style={styles.menuCard} onPress={(e) => e.stopPropagation?.()}>
          <View style={styles.menuHead}>
            <Text style={styles.menuName}>{player.name}</Text>
            <Text style={styles.menuMeta}>{slot?.code} · {player.role || "—"}</Text>
          </View>
          {items.map((it) => {
            const Icon = LucideIcons[it.icon] || LucideIcons.Circle;
            return (
              <Pressable key={it.key} onPress={() => onAction(it.key)} style={styles.menuRow}>
                <Icon size={16} color={it.key === "remove" ? C.red : C.cyan} />
                <Text style={[styles.menuRowText, it.key === "remove" && { color: C.red }]}>{it.label}</Text>
              </Pressable>
            );
          })}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

// ---------------------------------------------------------------------------
// PlayerInstructions modal
// ---------------------------------------------------------------------------
function PlayerInstructions({ visible, player, slotCode, value, onChange, onClose, disabled }) {
  if (!player) return null;
  const v = value || {};
  const selectRow = (label, options, key) => (
    <View style={{ marginBottom: 12 }}>
      <Text style={styles.modalLabel}>{label}</Text>
      <View style={styles.chipRow}>
        {options.map((o) => {
          const on = (v[key] || options[0]) === o;
          return (
            <Pressable key={o} disabled={disabled} onPress={() => onChange({ ...v, [key]: o })}
              style={[styles.chip, on && { borderColor: C.cyan, backgroundColor: C.cyan + "12" }]}>
              <Text style={[styles.chipText, on && { color: C.cyan }]}>{o}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={[styles.modalCard, { maxHeight: "85%" }]}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Instrucțiuni · {shortName(player.name)}</Text>
            <Pressable onPress={onClose}><LucideIcons.X size={18} color={C.dim} /></Pressable>
          </View>
          <ScrollView showsVerticalScrollIndicator={false}>
            {!!slotCode && (
              <View style={styles.instrPos}>
                <Text style={styles.instrPosLabel}>POZIȚIE</Text>
                <Text style={styles.instrPosValue}>{slotCode}</Text>
              </View>
            )}
            {selectRow("ROL", IND_ROLE, "role")}
            {selectRow("LIBERTATE DE MIȘCARE", IND_FREEDOM, "freedom")}
            <Text style={styles.modalLabel}>INSTRUCȚIUNI</Text>
            <View style={styles.chipRow}>
              {IND_TOGGLES.map((t) => {
                const on = !!v[t.key];
                return (
                  <Pressable key={t.key} disabled={disabled} onPress={() => onChange({ ...v, [t.key]: !on })}
                    style={[styles.chip, on && { borderColor: C.purple, backgroundColor: C.purple + "16" }]}>
                    {on && <LucideIcons.Check size={11} color={C.purple} />}
                    <Text style={[styles.chipText, on && { color: C.purple, marginLeft: 4 }]}>{t.label}</Text>
                  </Pressable>
                );
              })}
            </View>
            <Pressable style={[styles.modalSaveBtn, { marginTop: 14 }]} onPress={onClose}>
              <LucideIcons.Check size={16} color="white" /><Text style={styles.modalSaveText}>Gata</Text>
            </Pressable>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

// ---------------------------------------------------------------------------
// SubstitutesBench
// ---------------------------------------------------------------------------
function SubstitutesBench({ subs, playersById, onAdd, onRemove, canEdit }) {
  return (
    <View style={styles.card}>
      <View style={styles.cardTitleRow}>
        <LucideIcons.Users size={15} color={C.cyan} />
        <Text style={styles.cardTitle}>Rezerve ({subs.length})</Text>
      </View>
      <View style={styles.benchRow}>
        {subs.map((id) => {
          const p = playersById[id];
          if (!p) return null;
          const line = playerLine(p.role);
          return (
            <View key={id} style={styles.benchItem}>
              <View style={[styles.benchAvatar, { borderColor: LINE_COLOR_()[line] || C.cyan }]}>
                <Text style={styles.benchNo}>{p.no ? `#${p.no}` : initials(p.name)}</Text>
                {p.rating != null && <View style={styles.benchRating}><Text style={styles.benchRatingText}>{p.rating}</Text></View>}
              </View>
              <Text style={styles.benchName} numberOfLines={1}>{shortName(p.name)}</Text>
              <Text style={styles.benchPos} numberOfLines={1}>{p.role || LINE_LABEL[line]}</Text>
              {canEdit && (
                <Pressable onPress={() => onRemove(id)} style={styles.benchRemove}>
                  <LucideIcons.X size={12} color={C.red} />
                </Pressable>
              )}
            </View>
          );
        })}
        {canEdit && (
          <Pressable onPress={onAdd} style={styles.benchAdd}>
            <LucideIcons.Plus size={18} color={C.cyan} />
            <Text style={styles.benchAddText}>Adaugă</Text>
          </Pressable>
        )}
        {subs.length === 0 && !canEdit && <Text style={styles.emptyRow}>Nicio rezervă.</Text>}
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// TeamInstructions
// ---------------------------------------------------------------------------
function TeamInstructions({ value, onChange, disabled }) {
  const v = value || defaultTeamInstructions();
  const set = (k, val) => onChange({ ...v, [k]: val });
  return (
    <View style={styles.card}>
      <View style={styles.cardTitleRow}>
        <LucideIcons.ClipboardList size={15} color={C.cyan} />
        <Text style={styles.cardTitle}>Instrucțiuni de echipă</Text>
      </View>

      <Text style={styles.modalLabel}>MENTALITATE</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
        {MENTALITIES.map((m) => (
          <Pressable key={m} disabled={disabled} onPress={() => set("mentality", m)}
            style={[styles.chip, v.mentality === m && { borderColor: C.cyan, backgroundColor: C.cyan + "12" }]}>
            <Text style={[styles.chipText, v.mentality === m && { color: C.cyan }]}>{m}</Text>
          </Pressable>
        ))}
      </ScrollView>

      <Text style={[styles.modalLabel, { marginTop: 12 }]}>STIL DE JOC</Text>
      <View style={styles.chipRow}>
        {STYLES.map((s) => (
          <Pressable key={s} disabled={disabled} onPress={() => set("style", s)}
            style={[styles.chip, v.style === s && { borderColor: C.purple, backgroundColor: C.purple + "14" }]}>
            <Text style={[styles.chipText, v.style === s && { color: C.purple }]}>{s}</Text>
          </Pressable>
        ))}
      </View>

      <View style={{ marginTop: 8 }}>
        {SLIDERS.map((s) => (
          <View key={s.key} style={{ marginTop: 12 }}>
            <View style={styles.sliderHead}>
              <Text style={styles.sliderLabel}>{s.label}</Text>
              <Text style={[styles.sliderValue, { color: s.color }]}>{v[s.key] ?? 50}</Text>
            </View>
            <Slider value={v[s.key] ?? 50} onChange={(val) => set(s.key, val)} color={s.color} disabled={disabled} />
            <View style={styles.sliderEnds}>
              <Text style={styles.sliderEndText}>{s.lo}</Text>
              <Text style={styles.sliderEndText}>{s.hi}</Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// SavedTacticsList
// ---------------------------------------------------------------------------
function SavedTacticsList({ tactics, activeId, onLoad, onDuplicate, onDelete, canEdit }) {
  if (!tactics.length) return null;
  return (
    <View style={styles.card}>
      <View style={styles.cardTitleRow}>
        <LucideIcons.Save size={15} color={C.cyan} />
        <Text style={styles.cardTitle}>Tactici salvate ({tactics.length})</Text>
      </View>
      {tactics.map((t) => (
        <View key={t.id} style={[styles.savedRow, activeId === t.id && { borderColor: C.cyan + "55", backgroundColor: C.cyan + "0A" }]}>
          <Pressable style={{ flex: 1 }} onPress={() => onLoad(t)}>
            <View style={styles.savedTop}>
              <Text style={styles.savedName} numberOfLines={1}>{t.name}</Text>
              {t.isPublished && <View style={styles.pubBadge}><Text style={styles.pubBadgeText}>Publicat</Text></View>}
            </View>
            <Text style={styles.savedMeta}>{t.formation} · {Object.keys(t.assignments || {}).length}/11 titulari</Text>
          </Pressable>
          {canEdit && (
            <>
              <Pressable onPress={() => onDuplicate(t)} style={styles.iconBtn}><LucideIcons.Copy size={15} color={C.muted} /></Pressable>
              <Pressable onPress={() => onDelete(t)} style={styles.iconBtn}><LucideIcons.Trash2 size={15} color={C.red} /></Pressable>
            </>
          )}
        </View>
      ))}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Ecran principal
// ---------------------------------------------------------------------------
export default function TacticsScreen({ clubId, players = [], selectedClub, currentUser }) {
  const queryClient = useQueryClient();
  const canManage = ["super_admin", "club_owner", "admin", "coach"].includes(currentUser?.role);

  const { data: tactics = [], isLoading } = useQuery({
    queryKey: ["tactics", clubId],
    queryFn: () => supabaseService.getTactics(clubId),
    enabled: !!clubId,
  });

  const { data: discipline = [] } = useQuery({
    queryKey: ["discipline", clubId],
    queryFn: () => supabaseService.getDiscipline(clubId),
    enabled: !!clubId,
  });
  const suspendedIds = useMemo(() => suspendedPlayerIds(discipline), [discipline]);

  const [draft, setDraft] = useState(() => emptyDraft());
  const [selectTarget, setSelectTarget] = useState(null); // { type: 'slot'|'bench', slot? }
  const [menuSlot, setMenuSlot] = useState(null);
  const [instrPlayer, setInstrPlayer] = useState(null);
  const [instrSlotCode, setInstrSlotCode] = useState(null);
  const [moveSource, setMoveSource] = useState(null);
  const [saving, setSaving] = useState(false);
  const [viewTacticId, setViewTacticId] = useState(null);

  const playersById = useMemo(() => {
    const m = {};
    players.forEach((p) => { m[p.id] = p; });
    return m;
  }, [players]);

  const groups = useMemo(() => Array.from(new Set(players.map((p) => p.group).filter(Boolean))), [players]);
  const [groupScope, setGroupScope] = useState("Toate");
  const scopedPlayers = useMemo(
    () => (groupScope === "Toate" ? players : players.filter((p) => p.group === groupScope)),
    [players, groupScope]
  );

  const slots = FORMATIONS[draft.formation] || FORMATIONS["4-3-3"];
  const usedIds = useMemo(() => {
    const s = new Set(Object.values(draft.assignments).filter(Boolean));
    draft.subs.forEach((id) => s.add(id));
    return s;
  }, [draft.assignments, draft.subs]);

  const patch = (p) => setDraft((d) => ({ ...d, ...p }));

  // ---- viewer read-only mode --------------------------------------------
  if (!canManage) {
    const published = tactics.filter((t) => t.isPublished);
    const active = published.find((t) => t.id === viewTacticId) || published[0];
    const vSlots = active ? (FORMATIONS[active.formation] || FORMATIONS["4-3-3"]) : slots;
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <TopBar title="Tactici" eyebrow={selectedClub?.name || BRAND_NAME} />
        {isLoading && <View>{[0, 1, 2].map((i) => <SkeletonRow key={i} />)}</View>}
        {!isLoading && published.length === 0 && (
          <View style={styles.emptyState}>
            <LucideIcons.ClipboardList size={38} color={C.muted} />
            <Text style={styles.emptyText}>Antrenorul nu a publicat încă nicio tactică.</Text>
          </View>
        )}
        {published.length > 0 && (
          <>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, marginBottom: 12 }}>
              {published.map((t) => (
                <Pressable key={t.id} onPress={() => setViewTacticId(t.id)}
                  style={[styles.formChip, active?.id === t.id && { borderColor: C.cyan, backgroundColor: C.cyan + "14" }]}>
                  <Text style={[styles.formChipText, active?.id === t.id && { color: C.cyan }]}>{t.name}</Text>
                </Pressable>
              ))}
            </ScrollView>
            {active && (
              <>
                <View style={styles.viewHeadRow}>
                  <Text style={styles.viewFormation}>{active.formation}</Text>
                  <Pressable style={styles.exportBtn} onPress={() => exportTactic(active, vSlots, playersById)}>
                    <LucideIcons.Printer size={15} color={C.purple} /><Text style={styles.exportBtnText}>Exportă</Text>
                  </Pressable>
                </View>
                <FootballPitch slots={vSlots} assignments={active.assignments} playersById={playersById}
                  captainId={active.captainId} moveSource={null} suspendedIds={suspendedIds} onSlotPress={() => {}} />
                <SubstitutesBench subs={active.subs} playersById={playersById} canEdit={false} onAdd={() => {}} onRemove={() => {}} />
                <TeamInstructions value={active.teamInstructions} onChange={() => {}} disabled />
              </>
            )}
          </>
        )}
      </ScrollView>
    );
  }

  // ---- manager mode ------------------------------------------------------
  const onSlotPress = (slot) => {
    if (moveSource) {
      if (moveSource === slot.id) { setMoveSource(null); return; }
      // swap assignments between moveSource and slot
      setDraft((d) => {
        const a = { ...d.assignments };
        const from = a[moveSource]; const to = a[slot.id];
        if (to === undefined || to === null) delete a[moveSource]; else a[moveSource] = to;
        if (from === undefined || from === null) delete a[slot.id]; else a[slot.id] = from;
        return { ...d, assignments: a };
      });
      setMoveSource(null);
      return;
    }
    if (draft.assignments[slot.id]) setMenuSlot(slot);
    else setSelectTarget({ type: "slot", slot });
  };

  const pickPlayer = (playerId) => {
    if (selectTarget?.type === "slot") {
      setDraft((d) => ({ ...d, assignments: { ...d.assignments, [selectTarget.slot.id]: playerId } }));
    } else if (selectTarget?.type === "bench") {
      setDraft((d) => ({ ...d, subs: d.subs.includes(playerId) ? d.subs : [...d.subs, playerId] }));
    }
    setSelectTarget(null);
  };

  const onMenuAction = (key) => {
    const slot = menuSlot;
    const pid = draft.assignments[slot.id];
    setMenuSlot(null);
    switch (key) {
      case "change": setSelectTarget({ type: "slot", slot }); break;
      case "move": setMoveSource(slot.id); break;
      case "remove": setDraft((d) => { const a = { ...d.assignments }; delete a[slot.id]; const captainId = d.captainId === pid ? null : d.captainId; return { ...d, assignments: a, captainId }; }); break;
      case "captain": setDraft((d) => ({ ...d, captainId: d.captainId === pid ? null : pid })); break;
      case "instructions": setInstrPlayer(playersById[pid]); setInstrSlotCode(slot.code); break;
      case "penalty": setDraft((d) => ({ ...d, setPieces: { ...d.setPieces, penalty: d.setPieces.penalty === pid ? null : pid } })); break;
      case "freekick": setDraft((d) => ({ ...d, setPieces: { ...d.setPieces, freekick: d.setPieces.freekick === pid ? null : pid } })); break;
      case "corner": setDraft((d) => ({ ...d, setPieces: { ...d.setPieces, corner: d.setPieces.corner === pid ? null : pid } })); break;
      case "details": { const p = playersById[pid]; notify(p?.name || "Jucător", [p?.role, p?.group, p?.status].filter(Boolean).join(" · ") || "—"); break; }
      default: break;
    }
  };

  const changeFormation = (f) => {
    // păstrează jucătorii pe sloturile cu același id când e posibil
    setDraft((d) => {
      const newSlots = FORMATIONS[f] || [];
      const newIds = new Set(newSlots.map((s) => s.id));
      const kept = {};
      Object.entries(d.assignments).forEach(([sid, pid]) => { if (newIds.has(sid)) kept[sid] = pid; });
      return { ...d, formation: f, assignments: kept };
    });
    setMoveSource(null);
  };

  const startNew = () => { setDraft(emptyDraft()); setMoveSource(null); };
  const loadTactic = (t) => { setDraft({ ...t, teamInstructions: { ...defaultTeamInstructions(), ...(t.teamInstructions || {}) } }); setMoveSource(null); };

  const duplicate = async (t) => {
    try {
      await supabaseService.saveTactic({ ...t, id: null, name: `${t.name} (copie)`, isPublished: false, clubId });
      queryClient.invalidateQueries({ queryKey: ["tactics"] });
      notify("Tactică duplicată", `„${t.name}” a fost duplicată.`);
    } catch (e) { notify("Eroare", e.message); }
  };

  const remove = (t) => confirmDelete(`Ștergi tactica „${t.name}”?`, async () => {
    try {
      await supabaseService.deleteTactic(t.id);
      if (draft.id === t.id) startNew();
      queryClient.invalidateQueries({ queryKey: ["tactics"] });
    } catch (e) { notify("Eroare", e.message); }
  });

  const save = async () => {
    if (!draft.name.trim()) { notify("Nume lipsă", "Dă un nume tacticii înainte de a salva."); return; }
    setSaving(true);
    try {
      const wasPublished = tactics.find((t) => t.id === draft.id)?.isPublished;
      const saved = await supabaseService.saveTactic({ ...draft, name: draft.name.trim(), clubId });
      setDraft({ ...saved, teamInstructions: { ...defaultTeamInstructions(), ...(saved.teamInstructions || {}) } });
      queryClient.invalidateQueries({ queryKey: ["tactics"] });
      // Notificare in-app la publicare (tranziția către „publicat”).
      if (saved.isPublished && !wasPublished) {
        try {
          await supabaseService.insertChatMessage({
            audience: "club",
            authorId: currentUser?.id,
            authorName: currentUser?.name || "Staff",
            text: `📋 Tactică nouă publicată: ${saved.name} (${saved.formation}).`,
            clubId,
          });
          queryClient.invalidateQueries({ queryKey: ["announcements"] });
        } catch (_) { /* anunțul e opțional */ }
      }
      notify("Salvat", "Tactica a fost salvată cu succes.");
    } catch (e) { notify("Eroare", e.message); } finally { setSaving(false); }
  };

  const filledCount = Object.values(draft.assignments).filter(Boolean).length;
  const menuPlayerId = menuSlot ? draft.assignments[menuSlot.id] : null;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <TopBar title="Tactici" eyebrow={selectedClub?.name || BRAND_NAME} />

      <View style={styles.topActions}>
        <Pressable style={styles.newBtn} onPress={startNew}>
          <LucideIcons.Plus size={15} color={C.cyan} /><Text style={styles.newBtnText}>Tactică nouă</Text>
        </Pressable>
        <Pressable style={styles.exportBtn} onPress={() => exportTactic(draft, slots, playersById)}>
          <LucideIcons.Printer size={15} color={C.purple} /><Text style={styles.exportBtnText}>Exportă</Text>
        </Pressable>
        <View style={styles.countPill}>
          <Text style={styles.countPillText}>{filledCount}/11</Text>
        </View>
      </View>

      <View style={styles.card}>
        {groups.length > 0 && (
          <View style={{ marginBottom: 12 }}>
            <Text style={styles.modalLabel}>ECHIPĂ / GRUPĂ</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingRight: 8 }}>
              {["Toate", ...groups].map((g) => {
                const on = groupScope === g;
                return (
                  <Pressable key={g} onPress={() => setGroupScope(g)}
                    style={[styles.formChip, on && { borderColor: C.purple, backgroundColor: C.purple + "16" }]}>
                    <Text style={[styles.formChipText, on && { color: C.purple }]}>{g}</Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        )}
        <Text style={styles.modalLabel}>NUMELE TACTICII</Text>
        <TextInput style={styles.nameInput} value={draft.name} onChangeText={(v) => patch({ name: v })}
          placeholder="Ex: Tactica principală" placeholderTextColor={C.dim} />
        <View style={{ marginTop: 12 }}>
          <FormationSelector value={draft.formation} onChange={changeFormation} />
        </View>
        <Pressable style={styles.pubToggle} onPress={() => patch({ isPublished: !draft.isPublished })}>
          <View style={[styles.checkbox, draft.isPublished && { backgroundColor: C.cyan, borderColor: C.cyan }]}>
            {draft.isPublished && <LucideIcons.Check size={12} color={C.bg} />}
          </View>
          <Text style={styles.pubToggleText}>Publică tactica pentru jucători</Text>
        </Pressable>
        <Pressable style={[styles.saveBtn, saving && { opacity: 0.7 }]} onPress={save} disabled={saving}>
          <LucideIcons.Save size={16} color="white" />
          <Text style={styles.saveBtnText}>{draft.id ? "Actualizează tactica" : "Salvează tactica"}</Text>
        </Pressable>
      </View>

      {moveSource && (
        <View style={styles.moveHint}>
          <LucideIcons.Move size={14} color={C.amber} />
          <Text style={styles.moveHintText}>Atinge o altă poziție pentru a muta jucătorul.</Text>
          <Pressable onPress={() => setMoveSource(null)}><Text style={styles.moveCancel}>Anulează</Text></Pressable>
        </View>
      )}

      <FootballPitch
        slots={slots}
        assignments={draft.assignments}
        playersById={playersById}
        captainId={draft.captainId}
        moveSource={moveSource}
        suspendedIds={suspendedIds}
        onSlotPress={onSlotPress}
      />

      <SubstitutesBench
        subs={draft.subs}
        playersById={playersById}
        canEdit
        onAdd={() => setSelectTarget({ type: "bench" })}
        onRemove={(id) => setDraft((d) => ({ ...d, subs: d.subs.filter((x) => x !== id) }))}
      />

      <TeamInstructions value={draft.teamInstructions} onChange={(v) => patch({ teamInstructions: v })} />

      <SavedTacticsList
        tactics={tactics}
        activeId={draft.id}
        canEdit
        onLoad={loadTactic}
        onDuplicate={duplicate}
        onDelete={remove}
      />

      {players.length === 0 && (
        <Text style={styles.emptyText}>Niciun jucător în club. Adaugă jucători în tab-ul Echipă pentru a-i plasa pe teren.</Text>
      )}

      <PlayerSelectionModal
        visible={!!selectTarget}
        players={scopedPlayers}
        targetSlot={selectTarget?.slot || null}
        usedIds={usedIds}
        currentId={selectTarget?.type === "slot" ? draft.assignments[selectTarget.slot.id] : null}
        suspendedIds={suspendedIds}
        onPick={pickPlayer}
        onClose={() => setSelectTarget(null)}
      />

      <PlayerActionMenu
        visible={!!menuSlot}
        player={playersById[menuPlayerId]}
        slot={menuSlot}
        isCaptain={menuPlayerId === draft.captainId}
        setPieces={draft.setPieces}
        onAction={onMenuAction}
        onClose={() => setMenuSlot(null)}
      />

      <PlayerInstructions
        visible={!!instrPlayer}
        player={instrPlayer}
        slotCode={instrSlotCode}
        value={instrPlayer ? draft.playerInstructions[instrPlayer.id] : null}
        onChange={(v) => setDraft((d) => ({ ...d, playerInstructions: { ...d.playerInstructions, [instrPlayer.id]: v } }))}
        onClose={() => { setInstrPlayer(null); setInstrSlotCode(null); }}
      />
    </ScrollView>
  );
}

const styles = themedStyles((C) => StyleSheet.create({
  container: { flex: 1, backgroundColor: "transparent" },
  content: { padding: 18, paddingBottom: layout.navClearance },

  topActions: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 14 },
  newBtn: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 14, height: 40, borderRadius: 12, borderWidth: 1, borderColor: C.cyan + "40", backgroundColor: C.cyan + "10" },
  newBtnText: { color: C.cyan, fontSize: 12, fontWeight: "900" },
  countPill: { paddingHorizontal: 12, height: 32, borderRadius: 10, backgroundColor: C.card, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: C.line },
  countPillText: { color: C.text, fontSize: 12, fontWeight: "900" },

  card: { backgroundColor: C.card, borderRadius: 18, padding: 16, marginBottom: 14, borderWidth: 1, borderColor: C.line },
  cardTitleRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 },
  cardTitle: { color: C.text, fontSize: 13, fontWeight: "900" },

  sectionLabel: { color: C.muted, fontSize: 9, fontWeight: "900", letterSpacing: 1, marginBottom: 8 },
  modalLabel: { color: C.muted, fontSize: 9, fontWeight: "900", letterSpacing: 1, marginBottom: 6, marginTop: 2 },

  nameInput: { backgroundColor: C.bgSecondary, borderWidth: 1, borderColor: C.line, color: C.text, borderRadius: 10, paddingHorizontal: 12, height: 44, fontSize: 13, fontWeight: "700" },

  formChip: { paddingHorizontal: 14, height: 36, borderRadius: 10, borderWidth: 1, borderColor: C.lineStrong, alignItems: "center", justifyContent: "center" },
  formChipText: { color: C.muted, fontSize: 11.5, fontWeight: "800" },

  pubToggle: { flexDirection: "row", alignItems: "center", gap: 10, marginTop: 14 },
  checkbox: { width: 20, height: 20, borderRadius: 6, borderWidth: 1.5, borderColor: C.lineStrong, alignItems: "center", justifyContent: "center" },
  pubToggleText: { color: C.text, fontSize: 12, fontWeight: "700" },

  saveBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, height: 46, borderRadius: 12, backgroundColor: C.blue, marginTop: 14 },
  saveBtnText: { color: C.text, fontSize: 12.5, fontWeight: "900" },

  moveHint: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: C.amber + "12", borderColor: C.amber + "40", borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, height: 42, marginBottom: 12 },
  moveHintText: { color: C.amber, fontSize: 11.5, fontWeight: "800", flex: 1 },
  moveCancel: { color: C.amber, fontSize: 11.5, fontWeight: "900", textDecorationLine: "underline" },

  pitchWrap: { width: "100%", maxWidth: 460, alignSelf: "center", aspectRatio: 0.66, borderRadius: 18, overflow: "hidden", marginBottom: 14, borderWidth: 1, borderColor: C.line, position: "relative" },

  posWrap: { position: "absolute", width: 56, alignItems: "center", transform: [{ translateX: -28 }, { translateY: -28 }] },
  posAvatar: { width: 40, height: 40, borderRadius: 20, borderWidth: 2, alignItems: "center", justifyContent: "center", position: "relative" },
  posInitials: { color: C.text, fontSize: 12, fontWeight: "900" },
  posCodeTag: { paddingHorizontal: 6, height: 15, borderRadius: 5, borderWidth: 1, alignItems: "center", justifyContent: "center", marginTop: 3 },
  posCode: { fontSize: 8, fontWeight: "900" },
  posName: { color: C.text, fontSize: 9.5, fontWeight: "800", marginTop: 2, textAlign: "center", textShadowColor: "rgba(0,0,0,0.9)", textShadowRadius: 3 },
  capBadge: { position: "absolute", top: -4, right: -4, width: 16, height: 16, borderRadius: 8, backgroundColor: C.amber, alignItems: "center", justifyContent: "center", borderWidth: 1.5, borderColor: C.bg },
  capBadgeText: { color: C.bg, fontSize: 8, fontWeight: "900" },
  condDot: { position: "absolute", bottom: -2, left: -2, width: 10, height: 10, borderRadius: 5, borderWidth: 1.5, borderColor: C.bg },

  benchRow: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  benchItem: { width: 64, alignItems: "center" },
  benchAvatar: { width: 40, height: 40, borderRadius: 20, borderWidth: 2, backgroundColor: C.isDark ? "rgba(0,0,0,0.72)" : "rgba(9,9,11,0.45)", alignItems: "center", justifyContent: "center" },
  benchNo: { color: C.text, fontSize: 11, fontWeight: "900" },
  benchRating: { position: "absolute", bottom: -3, right: -3, minWidth: 16, height: 16, borderRadius: 8, backgroundColor: C.cyan, alignItems: "center", justifyContent: "center", paddingHorizontal: 3, borderWidth: 1.5, borderColor: C.bg },
  benchRatingText: { color: C.bg, fontSize: 8, fontWeight: "900" },
  benchName: { color: C.muted, fontSize: 9.5, fontWeight: "700", marginTop: 4, textAlign: "center" },
  benchPos: { color: C.dim, fontSize: 8.5, fontWeight: "700", marginTop: 1, textAlign: "center" },
  benchRemove: { position: "absolute", top: -4, right: 6, width: 18, height: 18, borderRadius: 9, backgroundColor: C.red + "22", alignItems: "center", justifyContent: "center" },
  benchAdd: { width: 64, height: 64, borderRadius: 12, borderWidth: 1, borderStyle: "dashed", borderColor: C.cyan + "55", alignItems: "center", justifyContent: "center" },
  benchAddText: { color: C.cyan, fontSize: 9, fontWeight: "800", marginTop: 2 },

  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  chip: { flexDirection: "row", paddingHorizontal: 12, height: 34, borderRadius: 10, borderWidth: 1, borderColor: C.lineStrong, alignItems: "center", justifyContent: "center" },
  chipText: { color: C.muted, fontSize: 10.5, fontWeight: "800" },

  sliderHead: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  sliderLabel: { color: C.text, fontSize: 11.5, fontWeight: "800" },
  sliderValue: { fontSize: 12, fontWeight: "900" },
  sliderTrack: { height: 24, justifyContent: "center", borderRadius: 12, backgroundColor: C.bgSecondary, paddingHorizontal: 2 },
  sliderFill: { position: "absolute", left: 2, height: 6, borderRadius: 3 },
  sliderThumb: { position: "absolute", width: 18, height: 18, borderRadius: 9, backgroundColor: "white", borderWidth: 3, marginLeft: -9 },
  sliderEnds: { flexDirection: "row", justifyContent: "space-between", marginTop: 5 },
  sliderEndText: { color: C.dim, fontSize: 9, fontWeight: "700" },

  instrPos: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: C.bgSecondary, borderRadius: 10, paddingHorizontal: 12, height: 40, marginBottom: 12 },
  instrPosLabel: { color: C.muted, fontSize: 9, fontWeight: "900", letterSpacing: 1 },
  instrPosValue: { color: C.cyan, fontSize: 13, fontWeight: "900" },

  savedRow: { flexDirection: "row", alignItems: "center", borderRadius: 12, borderWidth: 1, borderColor: C.line, padding: 12, marginBottom: 8 },
  savedTop: { flexDirection: "row", alignItems: "center", gap: 8 },
  savedName: { color: C.text, fontSize: 12.5, fontWeight: "800" },
  savedMeta: { color: C.dim, fontSize: 10, fontWeight: "700", marginTop: 3 },
  pubBadge: { backgroundColor: C.green + "18", borderColor: C.green + "40", borderWidth: 1, borderRadius: 6, paddingHorizontal: 7, paddingVertical: 2 },
  pubBadgeText: { color: C.green, fontSize: 8, fontWeight: "900" },
  iconBtn: { width: 34, height: 34, borderRadius: 10, alignItems: "center", justifyContent: "center", marginLeft: 2 },

  viewFormation: { color: C.cyan, fontSize: 13, fontWeight: "900", letterSpacing: 1 },
  viewHeadRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 8 },
  exportBtn: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 12, height: 40, borderRadius: 12, borderWidth: 1, borderColor: C.purple + "40", backgroundColor: C.purple + "12" },
  exportBtnText: { color: C.purple, fontSize: 12, fontWeight: "900" },

  emptyRow: { color: C.dim, fontSize: 11.5, fontWeight: "600", paddingVertical: 14, textAlign: "center" },
  emptyState: { alignItems: "center", justifyContent: "center", paddingVertical: 50, gap: 12 },
  emptyText: { color: C.muted, fontSize: 12, fontWeight: "600", textAlign: "center", lineHeight: 18, paddingHorizontal: 10, marginTop: 4 },

  // modaluri
  sheetOverlay: { flex: 1, backgroundColor: C.isDark ? "rgba(0,0,0,0.72)" : "rgba(9,9,11,0.45)", justifyContent: "flex-end" },
  sheetCard: { backgroundColor: C.cardSolid, borderTopLeftRadius: 22, borderTopRightRadius: 22, padding: 18, maxHeight: "88%", borderWidth: 1, borderColor: C.cyan + "1F" },
  modalOverlay: { flex: 1, backgroundColor: C.isDark ? "rgba(0,0,0,0.72)" : "rgba(9,9,11,0.45)", alignItems: "center", justifyContent: "center", padding: 20 },
  modalCard: { width: "100%", maxWidth: 460, backgroundColor: C.card, borderRadius: 18, padding: 20, borderWidth: 1, borderColor: C.cyan + "1F" },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 14 },
  modalTitle: { color: C.text, fontSize: 15, fontWeight: "900" },

  searchRow: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: C.bgSecondary, borderWidth: 1, borderColor: C.line, borderRadius: 12, paddingHorizontal: 12, height: 44, marginBottom: 10 },
  searchInput: { flex: 1, color: C.text, fontSize: 13, fontWeight: "600" },
  filterRow: { gap: 6, paddingBottom: 4 },
  sortRow: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 8 },
  miniChip: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 10, height: 30, borderRadius: 9, borderWidth: 1, borderColor: C.lineStrong, justifyContent: "center" },
  miniChipOn: { backgroundColor: C.cyan, borderColor: C.cyan },
  miniChipText: { color: C.muted, fontSize: 10.5, fontWeight: "800" },
  miniChipTextOn: { color: C.bg },

  playerCard: { flexDirection: "row", alignItems: "center", backgroundColor: C.card, borderRadius: 12, padding: 10, marginBottom: 8, borderWidth: 1, borderColor: C.line },
  playerNo: { width: 38, height: 38, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  playerNoText: { fontSize: 12, fontWeight: "900" },
  playerCardName: { color: C.text, fontSize: 12.5, fontWeight: "800" },
  playerCardMeta: { color: C.dim, fontSize: 10, fontWeight: "700", marginTop: 2 },
  fitBadge: { backgroundColor: C.green + "18", borderColor: C.green + "40", borderWidth: 1, borderRadius: 6, paddingHorizontal: 7, paddingVertical: 3, marginRight: 6 },
  fitBadgeText: { color: C.green, fontSize: 8.5, fontWeight: "900" },
  fitBadgeAlt: { backgroundColor: C.amber + "18", borderColor: C.amber + "40", borderWidth: 1, borderRadius: 6, paddingHorizontal: 7, paddingVertical: 3, marginRight: 6 },
  fitBadgeAltText: { color: C.amber, fontSize: 8.5, fontWeight: "900" },
  ratingChip: { minWidth: 26, height: 22, borderRadius: 7, backgroundColor: C.cyan + "18", alignItems: "center", justifyContent: "center", paddingHorizontal: 6, marginRight: 6 },
  ratingChipText: { color: C.cyan, fontSize: 11, fontWeight: "900" },
  availPill: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 7 },
  availPillText: { fontSize: 8.5, fontWeight: "900" },

  menuOverlay: { flex: 1, backgroundColor: C.isDark ? "rgba(0,0,0,0.7)" : "rgba(9,9,11,0.45)", alignItems: "center", justifyContent: "center", padding: 24 },
  menuCard: { width: "100%", maxWidth: 340, backgroundColor: C.cardSolid, borderRadius: 18, padding: 8, borderWidth: 1, borderColor: C.cyan + "24" },
  menuHead: { paddingHorizontal: 12, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: C.line, marginBottom: 4 },
  menuName: { color: C.text, fontSize: 14, fontWeight: "900" },
  menuMeta: { color: C.dim, fontSize: 10.5, fontWeight: "700", marginTop: 2 },
  menuRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 12, height: 44, borderRadius: 10 },
  menuRowText: { color: C.text, fontSize: 12.5, fontWeight: "700" },

  modalSaveBtn: { height: 46, borderRadius: 12, backgroundColor: C.blue, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 6 },
  modalSaveText: { color: C.text, fontSize: 12, fontWeight: "900" },
}));
