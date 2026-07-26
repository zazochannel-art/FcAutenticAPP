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
import Svg, { Circle, Rect, G, Text as SvgText } from "react-native-svg";
import { useQuery } from "@tanstack/react-query";
import { supabaseService } from "../services/supabaseService";
import PlayerDetailModal from "../components/PlayerDetailModal";
import { colors as C } from "../constants/theme";

// --- Premium Palette ---
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

const DEFAULT_GROUPS = ["U13", "U16", "U19", "Juniori", "Seniori"];
const GROUP_COLORS = [BLUE_ACCENT, VIOLET, AMBER, GREEN, CYAN, RED];

function notify(title, msg) {
  if (Platform.OS === "web") window.alert(`${title}\n\n${msg}`);
  else Alert.alert(title, msg);
}

function ageFromBirthdate(birthdate) {
  if (!birthdate) return "—";
  const parsed = new Date(birthdate);
  if (Number.isNaN(parsed.getTime())) return "—";
  const diff = Date.now() - parsed.getTime();
  const age = Math.floor(diff / (365.25 * 24 * 3600 * 1000));
  return age > 0 && age < 100 ? String(age) : "—";
}

function positionBucket(role) {
  const value = (role || "").toLowerCase();
  if (value.includes("portar") || value.includes("gk")) return "Portari";
  if (value.includes("fundaș") || value.includes("fundas") || value.includes("cb") || value.includes("lb") || value.includes("rb")) return "Fundași";
  if (value.includes("mijlocaș") || value.includes("mijlocas") || value.includes("cm") || value.includes("cam") || value.includes("dm")) return "Mijlocași";
  if (value.includes("atacant") || value.includes("st") || value.includes("extrem") || value.includes("lw") || value.includes("rw")) return "Atacanți";
  return "Alții";
}

function statusInfo(status) {
  const value = (status || "").toLowerCase();
  if (value.includes("accident")) return { label: status, color: RED };
  if (value.includes("recuper")) return { label: status, color: AMBER };
  if (value.includes("inactiv") || value.includes("suspend")) return { label: status, color: TEXT_TH };
  return { label: status || "Activ", color: GREEN };
}

export default function TeamScreen({ players = [], setPlayers, currentUser, trainings = [], attendance = {}, selectedClub, clubId, setTab }) {
  const [search, setSearch] = useState("");
  const [groupFilter, setGroupFilter] = useState("Toate");
  const [addOpen, setAddOpen] = useState(false);
  const [detailPlayer, setDetailPlayer] = useState(null);

  const canManage = ["super_admin", "club_owner", "admin", "coach"].includes(currentUser?.role);
  const clubGroups = selectedClub?.groups?.length ? selectedClub.groups : DEFAULT_GROUPS;
  const activeClubId = clubId || selectedClub?.id;

  const { data: evaluations = {} } = useQuery({
    queryKey: ["evaluations", activeClubId],
    queryFn: () => supabaseService.getEvaluations(activeClubId),
    enabled: !!activeClubId,
  });
  const { data: observations = {} } = useQuery({
    queryKey: ["observations", activeClubId],
    queryFn: () => supabaseService.getObservations(activeClubId),
    enabled: !!activeClubId,
  });

  // Rata de prezență per jucător: prezent/întârziat din totalul marcajelor.
  const presenceByPlayer = useMemo(() => {
    const stats = {};
    Object.values(attendance || {}).forEach((byPlayer) => {
      Object.entries(byPlayer || {}).forEach(([pId, status]) => {
        if (!stats[pId]) stats[pId] = { total: 0, present: 0 };
        stats[pId].total += 1;
        if (status === "present" || status === "late") stats[pId].present += 1;
      });
    });
    return stats;
  }, [attendance]);

  const attendanceAverage = useMemo(() => {
    const all = Object.values(presenceByPlayer);
    const total = all.reduce((sum, s) => sum + s.total, 0);
    const present = all.reduce((sum, s) => sum + s.present, 0);
    return total ? Math.round((present / total) * 100) : null;
  }, [presenceByPlayer]);

  const activePlayers = players.filter((p) => statusInfo(p.status).color === GREEN);
  const injuredPlayers = players.filter((p) => (p.status || "").toLowerCase().includes("accident"));
  const groupsInUse = clubGroups.filter((g) => players.some((p) => p.group === g));

  const visiblePlayers = players.filter((p) => {
    if (groupFilter !== "Toate" && p.group !== groupFilter) return false;
    if (search.trim() && !(p.name || "").toLowerCase().includes(search.trim().toLowerCase())) return false;
    return true;
  });

  const positionCounts = useMemo(() => {
    const counts = { Portari: 0, "Fundași": 0, "Mijlocași": 0, "Atacanți": 0, "Alții": 0 };
    players.forEach((p) => { counts[positionBucket(p.role)] += 1; });
    return counts;
  }, [players]);

  const availability = useMemo(() => {
    const buckets = { Apt: 0, "Accidentați": 0, "În recuperare": 0, "Indisponibili": 0 };
    players.forEach((p) => {
      const value = (p.status || "").toLowerCase();
      if (value.includes("accident")) buckets["Accidentați"] += 1;
      else if (value.includes("recuper")) buckets["În recuperare"] += 1;
      else if (value.includes("inactiv") || value.includes("suspend")) buckets["Indisponibili"] += 1;
      else buckets.Apt += 1;
    });
    return buckets;
  }, [players]);

  const nextTraining = trainings.find((t) => t.state === "Viitor") || trainings[0];

  const addPlayer = (form) => {
    if (!form.name.trim()) {
      notify("Date incomplete", "Completează numele jucătorului.");
      return;
    }
    setPlayers?.((current) => [
      ...current,
      {
        id: Date.now(),
        no: Number(form.no) || 0,
        name: form.name.trim(),
        role: form.role.trim() || "Jucător",
        group: form.group,
        status: "Activ",
        rating: form.rating === "" ? null : Number(form.rating),
        secondaryPositions: [],
        present: true,
      },
    ]);
    setAddOpen(false);
  };

  const pct = (count) => (players.length ? Math.round((count / players.length) * 100) : 0);

  return (
    <View style={styles.container}>
      <View style={styles.mainWrapper}>
        <ScrollView style={styles.mainScroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

          {/* Page Header */}
          <View style={styles.pageHeader}>
            <View style={styles.pageTitleContainer}>
              <Text style={styles.pageTitle}>Echipă</Text>
              <Text style={styles.pageSub}>Gestionează lotul, monitorizează prezența și pregătește echipa pentru următoarele provocări.</Text>
            </View>
          </View>

          {/* Row 1: Stat Cards */}
          <View style={styles.statsGrid}>
             <StatCard icon="Users" label="JUCĂTORI ACTIVI" val={String(activePlayers.length)} valSub={`din ${players.length} înregistrați`} iColor={BLUE_ACCENT} />
             <StatCard icon="TrendingUp" label="PREZENȚĂ MEDIE" val={attendanceAverage === null ? "—" : `${attendanceAverage}%`} valSub={attendanceAverage === null ? "fără prezențe marcate" : "din prezențele marcate"} iColor={GREEN} />
             <StatCard icon="ShieldAlert" label="JUCĂTORI ACCIDENTAȚI" val={String(injuredPlayers.length)} valSub={injuredPlayers.length ? "momentan indisponibili" : "toți disponibili"} iColor={AMBER} />
             <StatCard icon="LayoutGrid" label="GRUPE ACTIVE" val={String(groupsInUse.length)} valSub={groupsInUse.join(", ") || "nicio grupă cu jucători"} iColor={VIOLET} />
          </View>

          {/* Row 2: Quick Actions */}
          {canManage && (
            <View style={styles.actionsRow}>
               <View style={styles.actionsList}>
                  <ActionBtn icon="UserPlus" label="Adaugă jucător" color={BLUE_ACCENT} onPress={() => setAddOpen(true)} />
                  <ActionBtn icon="CheckCircle" label="Marchează prezență" color={BLUE_ACCENT} onPress={() => setTab?.("Antren.")} />
               </View>
            </View>
          )}

          {/* Row 3: Main Grid */}
          <View style={styles.mainGrid}>

             {/* Left Column: Squad Table */}
             <View style={styles.colLeft}>
                <View style={styles.cardMain}>
                   <View style={styles.cardHeader}>
                      <Text style={styles.cardTitle}>LOTUL ECHIPEI ({visiblePlayers.length})</Text>
                      <View style={styles.tableControls}>
                         <View style={styles.smallSearch}>
                            <LucideIcons.Search size={14} color={TEXT_TH} />
                            <TextInput
                              placeholder="Caută în lot..."
                              placeholderTextColor={TEXT_TH}
                              style={styles.smallSearchInput}
                              value={search}
                              onChangeText={setSearch}
                            />
                         </View>
                      </View>
                   </View>

                   <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 10 }}>
                      {["Toate", ...clubGroups].map((g) => (
                        <Pressable key={g} onPress={() => setGroupFilter(g)} style={[styles.groupChip, groupFilter === g && styles.groupChipActive]}>
                          <Text style={[styles.groupChipText, groupFilter === g && { color: CYAN }]}>{g}</Text>
                        </Pressable>
                      ))}
                   </ScrollView>

                   <View style={styles.tableHeader}>
                      <Text style={[styles.th, { width: 30 }]}>NR.</Text>
                      <Text style={[styles.th, { flex: 2.5 }]}>JUCĂTOR</Text>
                      <Text style={[styles.th, { flex: 1.5 }]}>POZIȚIE</Text>
                      <Text style={[styles.th, { width: 50, textAlign: 'center' }]}>VÂRSTĂ</Text>
                      <Text style={[styles.th, { flex: 1.5 }]}>STATUS</Text>
                      <Text style={[styles.th, { flex: 2 }]}>PREZENȚĂ</Text>
                   </View>

                   {visiblePlayers.length === 0 && (
                     <View style={styles.emptyBox}>
                        <LucideIcons.Users size={28} color={TEXT_TH} />
                        <Text style={styles.emptyText}>
                          {players.length === 0
                            ? "Niciun jucător înregistrat încă. Adaugă primul jucător cu butonul de mai sus."
                            : "Niciun jucător nu corespunde filtrului curent."}
                        </Text>
                     </View>
                   )}

                   {visiblePlayers.map((player) => {
                     const s = statusInfo(player.status);
                     const presence = presenceByPlayer[player.id];
                     const rate = presence?.total ? presence.present / presence.total : null;
                     return (
                       <Pressable key={player.id} style={styles.tableRow} onPress={() => setDetailPlayer(player)}>
                          <Text style={styles.rowNum}>{player.no || "—"}</Text>
                          <View style={{ flex: 2.5, flexDirection: 'row', alignItems: 'center' }}>
                             <View style={styles.miniAvatar}><LucideIcons.User size={12} color="white" /></View>
                             <Text style={[styles.rowMainText, { marginLeft: 10 }]} numberOfLines={1}>{player.name}</Text>
                          </View>
                          <Text style={[styles.posLabel, { color: BLUE_ACCENT, flex: 1.5 }]} numberOfLines={1}>{player.role || "—"}</Text>
                          <Text style={[styles.rowSubText, { width: 50, textAlign: 'center' }]}>{ageFromBirthdate(player.birthdate)}</Text>
                          <View style={{ flex: 1.5, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                             <View style={[styles.statusDot, { backgroundColor: s.color }]} />
                             <Text style={[styles.rowSubText, { color: s.color === GREEN ? TEXT_DIM : s.color }]} numberOfLines={1}>{s.label}</Text>
                          </View>
                          <View style={{ flex: 2, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                             <View style={styles.ratingBarBg}>
                                {rate !== null && <View style={[styles.ratingBarFill, { width: `${Math.round(rate * 100)}%`, backgroundColor: GREEN }]} />}
                             </View>
                             <Text style={[styles.ratingVal, rate === null && { color: TEXT_TH }]}>{rate === null ? "—" : `${Math.round(rate * 100)}%`}</Text>
                             <LucideIcons.ChevronRight size={13} color={TEXT_TH} />
                          </View>
                       </Pressable>
                     );
                   })}
                </View>
             </View>

             {/* Right Column: Sidebar */}
             <View style={styles.colRight}>
                <View style={styles.cardSide}>
                   <View style={styles.cardHeader}>
                      <Text style={styles.cardTitle}>GRUPE & LOTURI</Text>
                   </View>
                   {clubGroups.map((group, index) => (
                     <GroupItem
                       key={group}
                       name={group}
                       sub={`${players.filter((p) => p.group === group).length} jucători`}
                       count={String(players.filter((p) => p.group === group).length)}
                       color={GROUP_COLORS[index % GROUP_COLORS.length]}
                     />
                   ))}
                </View>

                <View style={[styles.cardSide, { marginTop: 18 }]}>
                   <View style={styles.cardHeader}>
                      <Text style={styles.cardTitle}>PREZENȚĂ PE GRUPE</Text>
                   </View>
                   <GroupAttendanceChart players={players} presenceByPlayer={presenceByPlayer} groups={clubGroups} />
                   <View style={styles.attendanceFooter}>
                      <View style={styles.footerTrend}>
                         <LucideIcons.CheckCircle2 size={12} color={GREEN} />
                         <Text style={styles.footerTrendText}>
                           Medie club: <Text style={{ color: GREEN }}>{attendanceAverage === null ? "—" : `${attendanceAverage}%`}</Text>
                         </Text>
                      </View>
                   </View>
                </View>
             </View>
          </View>

          {/* Row 4: Bottom Grid */}
          <View style={styles.bottomGrid}>
             {/* Position Distribution */}
             <View style={styles.colWidget}>
                <View style={styles.cardMain}>
                   <Text style={styles.cardTitle}>DISTRIBUȚIA PE POZIȚII</Text>
                   <View style={styles.donutArea}>
                      <View style={styles.donutWrapper}>
                        <PositionsDonut counts={positionCounts} total={players.length} />
                        <View style={styles.donutLabelWrap}>
                           <Text style={styles.donutVal}>{players.length}</Text>
                           <Text style={styles.donutSub}>jucători</Text>
                        </View>
                      </View>
                      <View style={styles.legend}>
                         <LegendItem dot={CYAN} label="Portari" count={String(positionCounts.Portari)} per={`${pct(positionCounts.Portari)}%`} />
                         <LegendItem dot={BLUE_ACCENT} label="Fundași" count={String(positionCounts["Fundași"])} per={`${pct(positionCounts["Fundași"])}%`} />
                         <LegendItem dot={GREEN} label="Mijlocași" count={String(positionCounts["Mijlocași"])} per={`${pct(positionCounts["Mijlocași"])}%`} />
                         <LegendItem dot={RED} label="Atacanți" count={String(positionCounts["Atacanți"])} per={`${pct(positionCounts["Atacanți"])}%`} />
                         {positionCounts["Alții"] > 0 && (
                           <LegendItem dot={TEXT_TH} label="Alții" count={String(positionCounts["Alții"])} per={`${pct(positionCounts["Alții"])}%`} />
                         )}
                      </View>
                   </View>
                </View>
             </View>

             {/* Squad Availability */}
             <View style={styles.colWidget}>
                <View style={styles.cardMain}>
                   <Text style={styles.cardTitle}>DISPONIBILITATEA LOTULUI</Text>
                   <View style={styles.availSummaryGrid}>
                      <AvailMini label="Apt" count={String(availability.Apt)} per={`${pct(availability.Apt)}%`} color={GREEN} />
                      <AvailMini label="Accidentați" count={String(availability["Accidentați"])} per={`${pct(availability["Accidentați"])}%`} color={RED} />
                      <AvailMini label="În recuperare" count={String(availability["În recuperare"])} per={`${pct(availability["În recuperare"])}%`} color={AMBER} />
                      <AvailMini label="Indisponibili" count={String(availability.Indisponibili)} per={`${pct(availability.Indisponibili)}%`} color={BLUE_ACCENT} />
                   </View>
                </View>
             </View>

             {/* Next Activity */}
             <View style={styles.colWidget}>
                <View style={styles.cardMain}>
                   <Text style={styles.cardTitle}>URMĂTOAREA ACTIVITATE</Text>
                   {nextTraining ? (
                     <View style={styles.nextActivities}>
                        <View style={styles.activityRow}>
                           <View style={styles.activityIconWrap}><LucideIcons.Dumbbell size={16} color={GREEN} /></View>
                           <View style={{ flex: 1, marginLeft: 14 }}>
                              <Text style={styles.activityLabel}>ANTRENAMENT • {nextTraining.group}</Text>
                              <Text style={styles.activityTitle}>{nextTraining.theme || "Antrenament echipă"}</Text>
                              <Text style={styles.activityMeta}>{nextTraining.date} • {nextTraining.time}</Text>
                              <Text style={styles.activityLoc}>{nextTraining.location}</Text>
                           </View>
                        </View>
                     </View>
                   ) : (
                     <View style={styles.emptyBox}>
                        <LucideIcons.CalendarOff size={24} color={TEXT_TH} />
                        <Text style={styles.emptyText}>Niciun antrenament programat.</Text>
                     </View>
                   )}
                </View>
             </View>
          </View>

        </ScrollView>
      </View>

      <AddPlayerModal
        visible={addOpen}
        onClose={() => setAddOpen(false)}
        onSave={addPlayer}
        groups={clubGroups}
      />

      {detailPlayer && (
        <PlayerDetailModal
          player={detailPlayer}
          canManage={canManage}
          evaluations={evaluations}
          observations={observations}
          onClose={() => setDetailPlayer(null)}
        />
      )}
    </View>
  );
}

// --- Add Player Modal ---

function AddPlayerModal({ visible, onClose, onSave, groups }) {
  const [form, setForm] = useState({ name: "", no: "", role: "Mijlocaș", group: groups[0] || "U19", rating: "" });

  const update = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalCard}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Adaugă jucător</Text>
            <Pressable onPress={onClose}><LucideIcons.X size={18} color={TEXT_DIM} /></Pressable>
          </View>

          <Text style={styles.modalLabel}>NUME COMPLET</Text>
          <TextInput style={styles.modalInput} value={form.name} onChangeText={(v) => update("name", v)} placeholder="Andrei Popescu" placeholderTextColor={TEXT_TH} />

          <View style={{ flexDirection: "row", gap: 10 }}>
            <View style={{ flex: 1 }}>
              <Text style={styles.modalLabel}>NUMĂR</Text>
              <TextInput style={styles.modalInput} value={form.no} onChangeText={(v) => update("no", v)} placeholder="10" placeholderTextColor={TEXT_TH} keyboardType="numeric" />
            </View>
            <View style={{ flex: 2 }}>
              <Text style={styles.modalLabel}>POZIȚIE</Text>
              <TextInput style={styles.modalInput} value={form.role} onChangeText={(v) => update("role", v)} placeholder="Mijlocaș" placeholderTextColor={TEXT_TH} />
            </View>
          </View>

          <View style={{ flexDirection: "row", gap: 10 }}>
            <View style={{ flex: 1 }}>
              <Text style={styles.modalLabel}>GRUPA</Text>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
                {groups.map((g) => (
                  <Pressable key={g} onPress={() => update("group", g)} style={[styles.groupChip, form.group === g && styles.groupChipActive]}>
                    <Text style={[styles.groupChipText, form.group === g && { color: CYAN }]}>{g}</Text>
                  </Pressable>
                ))}
              </View>
            </View>
            <View style={{ width: 96 }}>
              <Text style={styles.modalLabel}>RATING</Text>
              <TextInput style={styles.modalInput} value={form.rating} onChangeText={(v) => update("rating", v.replace(/[^0-9]/g, "").slice(0, 2))} placeholder="60" placeholderTextColor={TEXT_TH} keyboardType="number-pad" />
            </View>
          </View>

          <Pressable style={styles.modalSaveBtn} onPress={() => onSave(form)}>
            <LucideIcons.UserPlus size={16} color="white" />
            <Text style={styles.modalSaveText}>Salvează jucătorul</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

// --- Sub-Components ---

const StatCard = ({ icon, label, val, valSub, iColor }) => {
  const Icon = LucideIcons[icon] || LucideIcons.Circle;
  return (
    <View style={styles.statCard}>
       <View style={styles.statContent}>
          <View style={[styles.statIconWrap, { backgroundColor: iColor + "10", borderColor: iColor + "30" }]}>
             <Icon size={20} color={iColor} />
          </View>
          <View style={{ marginLeft: 14, flex: 1 }}>
             <Text style={styles.statLabel}>{label}</Text>
             <Text style={styles.statVal}>{val}</Text>
             <Text style={styles.statValSub} numberOfLines={1}>{valSub}</Text>
          </View>
       </View>
    </View>
  );
};

const ActionBtn = ({ icon, label, color, onPress }) => {
  const Icon = LucideIcons[icon] || LucideIcons.Circle;
  return (
    <Pressable onPress={onPress || (() => notify("În lucru", `${label} va fi conectat în următoarea etapă.`))} style={styles.actionBtn}>
       <Icon size={14} color={color} />
       <Text style={styles.actionBtnText}>{label}</Text>
    </Pressable>
  );
};

const GroupItem = ({ name, sub, count, color }) => (
  <View style={styles.groupItem}>
     <View style={[styles.groupIndicator, { backgroundColor: color }]} />
     <View style={{ flex: 1, marginLeft: 12 }}>
        <Text style={styles.rowMainText}>{name}</Text>
        <Text style={styles.rowSubText}>{sub}</Text>
     </View>
     <View style={styles.groupCount}><Text style={[styles.countText, { color }]}>{count}</Text></View>
  </View>
);

const LegendItem = ({ dot, label, count, per }) => (
  <View style={styles.legendItem}>
     <View style={[styles.legendDot, { backgroundColor: dot }]} />
     <Text style={styles.legendLabel}>{label}</Text>
     <Text style={styles.legendCount}>{count}</Text>
     <Text style={styles.legendPer}>({per})</Text>
  </View>
);

const AvailMini = ({ label, count, per, color }) => (
  <View style={[styles.availMiniCard, { borderColor: color + "20" }]}>
     <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <View style={[styles.miniCheck, { backgroundColor: color + "15", borderColor: color + "30" }]}>
           <LucideIcons.Check size={10} color={color} />
        </View>
        <Text style={[styles.availMiniVal, { color }]}>{count}</Text>
     </View>
     <Text style={styles.availMiniLabel}>{label}</Text>
     <Text style={[styles.availMiniPer, { color }]}>{per}</Text>
  </View>
);

// --- SVG Components (date reale) ---

const GroupAttendanceChart = ({ players, presenceByPlayer, groups }) => {
  const bars = groups.map((group) => {
    const ids = players.filter((p) => p.group === group).map((p) => String(p.id));
    let total = 0;
    let present = 0;
    ids.forEach((id) => {
      const s = presenceByPlayer[id];
      if (s) { total += s.total; present += s.present; }
    });
    return { group, per: total ? Math.round((present / total) * 100) : 0 };
  });

  const slot = 300 / Math.max(bars.length, 1);

  return (
    <Svg width="100%" height="150" viewBox="0 0 300 150">
       {bars.map((bar, i) => (
          <G key={bar.group} transform={`translate(${i * slot}, 0)`}>
             <Rect x={slot / 2 - 10} y={130 - bar.per} width="20" height={Math.max(bar.per, 2)} rx="3" fill={BLUE_ACCENT} opacity="0.8" />
             <SvgText fontSize="7" fill={TEXT_DIM} x={slot / 2} y="145" textAnchor="middle">{bar.group}</SvgText>
             <SvgText fontSize="7" fill="white" fontWeight="800" x={slot / 2} y={124 - bar.per} textAnchor="middle">{bar.per}%</SvgText>
          </G>
       ))}
    </Svg>
  );
};

const PositionsDonut = ({ counts, total }) => {
  const CIRC = 251.2;
  const order = [
    ["Portari", CYAN],
    ["Fundași", BLUE_ACCENT],
    ["Mijlocași", GREEN],
    ["Atacanți", RED],
    ["Alții", TEXT_TH],
  ];
  let acc = 0;
  return (
    <Svg width="120" height="120" viewBox="0 0 100 100">
      <Circle cx="50" cy="50" r="40" stroke={C.line} strokeWidth="10" fill="none" />
      {total > 0 && order.map(([key, color]) => {
        const fraction = counts[key] / total;
        if (!fraction) return null;
        const startAngle = acc * 360 - 90;
        acc += fraction;
        return (
          <Circle
            key={key}
            cx="50" cy="50" r="40"
            stroke={color}
            strokeWidth="10"
            fill="none"
            strokeDasharray={`${fraction * CIRC} ${CIRC}`}
            transform={`rotate(${startAngle} 50 50)`}
          />
        );
      })}
    </Svg>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "transparent" },
  mainWrapper: { flex: 1 },
  mainScroll: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 50 },

  pageHeader: { marginBottom: 25 },
  pageTitleContainer: {},
  pageTitle: { color: 'white', fontSize: 24, fontWeight: '900', letterSpacing: -0.5 },
  pageSub: { color: TEXT_DIM, fontSize: 12, fontWeight: '600', marginTop: 3 },

  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 20 },
  statCard: { flexBasis: 220, flexGrow: 1, backgroundColor: CARD_BG, borderRadius: 14, padding: 12, minHeight: 95, borderWidth: 1, borderColor: BORDER_COLOR },
  statContent: { flexDirection: 'row', alignItems: 'center' },
  statIconWrap: { width: 32, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  statLabel: { color: TEXT_DIM, fontSize: 8, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 0.8 },
  statVal: { color: 'white', fontSize: 18, fontWeight: '900', marginTop: 4 },
  statValSub: { color: TEXT_TH, fontSize: 8.5, fontWeight: '700', marginTop: 1 },

  actionsRow: { marginBottom: 25 },
  actionsList: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, alignItems: 'center' },
  actionBtn: { flexGrow: 1, height: 38, borderRadius: 9, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 12, gap: 8, borderWidth: 1, borderColor: "rgba(0, 212, 255, 0.12)" },
  actionBtnText: { color: 'white', fontSize: 10.5, fontWeight: '800' },

  mainGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 16 },
  colLeft: { flexBasis: 420, flexGrow: 3 },
  colRight: { flexBasis: 240, flexGrow: 1 },

  cardMain: { backgroundColor: CARD_BG, borderRadius: 18, padding: 16, borderWidth: 1, borderColor: BORDER_COLOR, marginBottom: 12 },
  cardSide: { backgroundColor: CARD_BG, borderRadius: 18, padding: 16, borderWidth: 1, borderColor: BORDER_COLOR },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15, flexWrap: 'wrap', gap: 10 },
  cardTitle: { color: 'white', fontSize: 12.5, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 0.8 },

  tableControls: { flexDirection: 'row', gap: 10 },
  smallSearch: { width: 170, height: 28, backgroundColor: "rgba(255,255,255,0.03)", borderRadius: 7, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, borderWidth: 1, borderColor: "rgba(255,255,255,0.05)" },
  smallSearchInput: { flex: 1, color: 'white', fontSize: 10, fontWeight: '600', marginLeft: 6 },

  groupChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 14, borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", marginRight: 6 },
  groupChipActive: { borderColor: CYAN, backgroundColor: CYAN + "10" },
  groupChipText: { color: TEXT_DIM, fontSize: 10, fontWeight: '800' },

  tableHeader: { flexDirection: 'row', paddingBottom: 10, paddingHorizontal: 12, borderBottomWidth: 1, borderBottomColor: C.line, marginBottom: 10 },
  th: { color: TEXT_TH, fontSize: 8.5, fontWeight: "900", textTransform: "uppercase", letterSpacing: 1 },
  tableRow: { flexDirection: 'row', alignItems: 'center', minHeight: 62, paddingHorizontal: 12, marginBottom: 6, borderRadius: 14, backgroundColor: "rgba(255,255,255,0.025)", borderWidth: 1, borderColor: C.line },
  rowNum: { color: TEXT_DIM, fontSize: 11, fontWeight: '900', width: 30 },
  miniAvatar: { width: 34, height: 34, borderRadius: 11, backgroundColor: "rgba(255,255,255,0.07)", alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: C.line },
  rowMainText: { color: 'white', fontSize: 11, fontWeight: '800' },
  rowSubText: { color: TEXT_TH, fontSize: 9.5, fontWeight: '600' },
  posLabel: { fontSize: 10, fontWeight: '900' },
  statusDot: { width: 5, height: 5, borderRadius: 2.5 },
  ratingBarBg: { flex: 1, height: 5, backgroundColor: "rgba(255,255,255,0.05)", borderRadius: 2.5, overflow: 'hidden' },
  ratingBarFill: { height: '100%', borderRadius: 2.5 },
  ratingVal: { color: 'white', fontSize: 10, fontWeight: '900', width: 34, textAlign: 'right' },

  emptyBox: { alignItems: 'center', gap: 10, paddingVertical: 26, paddingHorizontal: 12 },
  emptyText: { color: TEXT_DIM, fontSize: 11, fontWeight: '600', textAlign: 'center', lineHeight: 17 },

  groupItem: { flexDirection: 'row', alignItems: 'center', height: 50, paddingHorizontal: 10, marginBottom: 5, borderRadius: 12, backgroundColor: "rgba(255,255,255,0.02)" },
  groupIndicator: { width: 3, height: 18, borderRadius: 2 },
  groupCount: { minWidth: 24, height: 18, borderRadius: 6, backgroundColor: "rgba(255,255,255,0.03)", alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 },
  countText: { fontSize: 9, fontWeight: '900' },

  attendanceFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 15 },
  footerTrend: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  footerTrendText: { color: TEXT_TH, fontSize: 9.5, fontWeight: '700' },

  bottomGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 16 },
  colWidget: { flexBasis: 260, flexGrow: 1 },
  donutArea: { flexDirection: 'row', alignItems: 'center', gap: 16, marginTop: 8 },
  donutWrapper: { width: 100, height: 100, alignItems: 'center', justifyContent: 'center' },
  donutLabelWrap: { position: 'absolute', alignItems: 'center', justifyContent: 'center' },
  donutVal: { color: 'white', fontSize: 16, fontWeight: '900' },
  donutSub: { color: TEXT_TH, fontSize: 8, fontWeight: '700', marginTop: -2 },
  legend: { flex: 1, gap: 8 },
  legendItem: { flexDirection: 'row', alignItems: 'center' },
  legendDot: { width: 6, height: 6, borderRadius: 3, marginRight: 8 },
  legendLabel: { flex: 1, color: TEXT_DIM, fontSize: 10, fontWeight: '700' },
  legendCount: { color: 'white', fontSize: 10, fontWeight: '800', marginRight: 4 },
  legendPer: { color: TEXT_TH, fontSize: 9, fontWeight: '700' },

  availSummaryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 10 },
  availMiniCard: { flexBasis: '45%', flexGrow: 1, padding: 10, borderRadius: 12, borderWidth: 1 },
  miniCheck: { width: 18, height: 18, borderRadius: 5, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  availMiniVal: { fontSize: 14, fontWeight: '900' },
  availMiniLabel: { color: TEXT_TH, fontSize: 8.5, fontWeight: '800', marginTop: 4 },
  availMiniPer: { fontSize: 8.5, fontWeight: '900', marginTop: 2 },

  nextActivities: { gap: 14, marginTop: 10 },
  activityRow: { flexDirection: 'row', alignItems: 'center' },
  activityIconWrap: { width: 32, height: 32, borderRadius: 8, backgroundColor: GREEN + "15", alignItems: 'center', justifyContent: 'center' },
  activityLabel: { color: GREEN, fontSize: 7.5, fontWeight: '900', letterSpacing: 0.5 },
  activityTitle: { color: 'white', fontSize: 11, fontWeight: '800', marginTop: 1 },
  activityMeta: { color: TEXT_TH, fontSize: 9.5, fontWeight: '700', marginTop: 2 },
  activityLoc: { color: TEXT_TH, fontSize: 8.5, fontWeight: '600' },

  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.72)", alignItems: 'center', justifyContent: 'center', padding: 20 },
  modalCard: { width: '100%', maxWidth: 420, backgroundColor: C.card, borderRadius: 18, padding: 20, borderWidth: 1, borderColor: BORDER_COLOR },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  modalTitle: { color: 'white', fontSize: 15, fontWeight: '900' },
  modalLabel: { color: TEXT_DIM, fontSize: 9, fontWeight: '900', letterSpacing: 1, marginBottom: 6, marginTop: 4 },
  modalInput: { backgroundColor: C.bgSecondary, borderWidth: 1, borderColor: C.line, color: 'white', borderRadius: 10, paddingHorizontal: 12, height: 42, fontSize: 12, fontWeight: '600', marginBottom: 12 },
  modalSaveBtn: { height: 46, borderRadius: 12, backgroundColor: BLUE_ACCENT, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  modalSaveText: { color: 'white', fontSize: 12, fontWeight: '900' },
});
