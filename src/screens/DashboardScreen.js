import React from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import * as LucideIcons from "lucide-react-native";
import { colors as C } from "../constants/theme";
import { TopBar, Metric, SectionTitle } from "../components/SharedComponents";
import { getDateParts } from "../utils/dates";

import { BeUIButton } from "../components/ui/be-ui-button";

const roleLabels = {
  super_admin: "Super Admin",
  club_owner: "Owner club",
  viewer: "Viewer",
  admin: "Admin",
  coach: "Antrenor",
  player: "Jucător",
  parent: "Părinte",
  guest: "Vizitator",
};

export default function DashboardScreen({ tasks, toggleTask, players, trainings, matches, attendance, transactions, clubSettings, currentUser, setTab, selectedClub, subscription, invitations = [], memberships = [], openNotifications }) {
  const incomeTotal = transactions.filter((row) => row.positive).reduce((sum, row) => sum + Number(row.value || 0), 0);
  const expenseTotal = transactions.filter((row) => !row.positive).reduce((sum, row) => sum + Number(row.value || 0), 0);
  const balance = incomeTotal - expenseTotal;

  const nextTraining = trainings
    .filter((item) => item.state !== "Finalizat")
    .slice()
    .sort((a,b) => (a.date > b.date ? 1 : -1))[0];

  const nextMatch = matches
    ?.filter((item) => item.status !== "Finalizat")
    .slice()
    .sort((a,b) => (a.date > b.date ? 1 : -1))[0];

  const nextEvent = nextTraining
    ? { type: `ANTRENAMENT ${nextTraining.group}`, title: nextTraining.theme || "Antrenament programat", date: nextTraining.date, time: nextTraining.time, location: nextTraining.location, tab: "Antren." }
    : nextMatch
      ? { type: nextMatch.type || "MECI", title: `FC Autentic vs ${nextMatch.opponent}`, date: nextMatch.date, time: nextMatch.time, location: nextMatch.location, tab: "Meciuri" }
      : { type: "PROGRAM", title: "Nu există evenimente programate", date: "—", time: "—", location: "Adaugă un antrenament sau meci", tab: "Calendar" };

  const canSeeClubState = ["super_admin", "club_owner", "admin", "coach"].includes(currentUser?.role);
  const canManageFinance = ["super_admin", "club_owner", "admin"].includes(currentUser?.role);
  const nextEventDate = getDateParts(nextEvent.date);
  const personalPlayer = players.find((player) => player.id === currentUser?.playerId || player.id === currentUser?.childPlayerId);
  const personalStatuses = personalPlayer ? trainings.filter((training) => training.group === personalPlayer.group).map((training) => attendance?.[training.id]?.[personalPlayer.id]).filter(Boolean) : [];
  const personalPresent = personalStatuses.filter((status) => status === "present").length;
  const personalLate = personalStatuses.filter((status) => status === "late").length;
  const personalPercent = personalStatuses.length ? Math.round(((personalPresent + personalLate * 0.5) / personalStatuses.length) * 100) : 0;
  const ownerInviteCount = invitations.filter((item) => item.clubId === selectedClub?.id && item.status === "pending").length;
  const coachCount = memberships.filter((item) => item.clubId === selectedClub?.id && item.role === "coach").length;
  const attendanceMarked = Object.values(attendance || {}).reduce((sum, row) => sum + Object.keys(row || {}).length, 0);
  const subscriptionLabel = subscription?.planName || selectedClub?.plan || "Free";

  return (
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <TopBar title={`Bun venit, ${currentUser?.name || "Manager"}!`} eyebrow={`${roleLabels[currentUser?.role] || "FC AUTENTIC"} • DASHBOARD`} openNotifications={openNotifications} />

      {canSeeClubState ? (
        <>
        <View style={styles.controlCard}>
          <View style={styles.controlTop}>
            <View>
              <Text style={styles.controlKicker}>STAREA CLUBULUI</Text>
              <Text style={styles.controlTitle}>Totul este în regulă</Text>
            </View>
            <View style={styles.livePill}><View style={styles.liveDot} /><Text style={styles.liveText}>ACTIV</Text></View>
          </View>
          <View style={styles.metricsRow}>
            <Metric icon="Users" value={players.length} label="Jucători" color={C.blue} />
            <Metric icon="CalendarDays" value={trainings.length} label="Antrenamente" color={C.amber} />
            {canManageFinance
              ? <Metric icon="Wallet" value={balance.toLocaleString("ro-RO")} label="Sold MDL" color={C.green} />
              : <Metric icon="Bell" value="3" label="Notificări" color={C.green} />}
          </View>
        </View>
        <View style={styles.profilePanel}>
          <Text style={styles.paymentSectionLabel}>SAAS CLUB</Text>
          <View style={styles.profileDetailsGrid}>
            <View style={styles.profileDetailBox}><Text style={styles.profileDetailLabel}>Club activ</Text><Text style={styles.profileDetailValue}>{selectedClub?.name || clubSettings.clubName}</Text></View>
            <View style={styles.profileDetailBox}><Text style={styles.profileDetailLabel}>Antrenori</Text><Text style={styles.profileDetailValue}>{coachCount}</Text></View>
            <View style={styles.profileDetailBox}><Text style={styles.profileDetailLabel}>Prezente marcate</Text><Text style={styles.profileDetailValue}>{attendanceMarked}</Text></View>
            <View style={styles.profileDetailBox}><Text style={styles.profileDetailLabel}>Abonament</Text><Text style={[styles.profileDetailValue, { color: C.amber }]}>{subscriptionLabel}</Text></View>
          </View>
          {["club_owner", "admin"].includes(currentUser?.role) && (
            <BeUIButton
              label={`${ownerInviteCount} invitatii pending`}
              variant="outline"
              size="md"
              icon="Mail"
              onPress={() => setTab?.("Mai mult")}
              fullWidth
              style={{ marginTop: 10 }}
            />
          )}
        </View>
        </>
      ) : (
        <View style={styles.personalCard}>
          <View style={styles.personalIcon}>
            <LucideIcons.UserCircle2 size={30} color={C.blue} />
          </View>
          <View style={styles.personalInfo}>
            <Text style={styles.controlKicker}>SPAȚIUL TĂU</Text>
            <Text style={styles.personalTitle}>{currentUser?.role === "parent" ? "Programul copilului" : "Programul meu"}</Text>
            <Text style={styles.personalText}>Ai acces doar la antrenamente, meciuri, prezență și notificările permise rolului tău.</Text>
          </View>
        </View>
      )}

      {!canSeeClubState && personalPlayer && (
        <>
          <SectionTitle title={currentUser?.role === "parent" ? "Copilul meu" : "Profilul meu"} action="Detalii" onAction={() => setTab?.("Mai mult")} />
          <View style={styles.profileDetailsGrid}>
            <View style={styles.profileDetailBox}><Text style={styles.profileDetailLabel}>Jucător</Text><Text style={styles.profileDetailValue}>{personalPlayer.name}</Text></View>
            <View style={styles.profileDetailBox}><Text style={styles.profileDetailLabel}>Grupă</Text><Text style={styles.profileDetailValue}>{personalPlayer.group}</Text></View>
            <View style={styles.profileDetailBox}><Text style={styles.profileDetailLabel}>Prezență</Text><Text style={[styles.profileDetailValue, { color: C.green }]}>{personalStatuses.length ? `${personalPercent}%` : "—"}</Text></View>
            <View style={styles.profileDetailBox}><Text style={styles.profileDetailLabel}>Cotizație</Text><Text style={[styles.profileDetailValue, { color: C.green }]}>OK</Text></View>
          </View>
        </>
      )}

      <SectionTitle title="Următorul eveniment" action={nextEvent.tab} onAction={() => setTab?.(nextEvent.tab)} />
      <Pressable style={styles.nextEvent} onPress={() => setTab?.(nextEvent.tab)}>
        <View style={styles.dateBlock}><Text style={styles.dateDay}>{nextEventDate.day}</Text><Text style={styles.dateMonth}>{nextEventDate.month}</Text></View>
        <View style={styles.eventInfo}>
          <Text style={styles.eventTag}>{nextEvent.type} • {nextEvent.time}</Text>
          <Text style={styles.eventTitle}>{nextEvent.title}</Text>
          <Text style={styles.eventMeta}><LucideIcons.MapPin size={13} color={C.muted} /> {nextEvent.location}</Text>
        </View>
        <LucideIcons.ChevronRight size={20} color={C.muted} />
      </Pressable>

      <SectionTitle title="Sarcini de azi" action={`${tasks.filter((task) => task.done).length}/${tasks.length}`} />
      <View style={styles.taskList}>
        {tasks.length ? tasks.map((task) => (
          <Pressable key={task.id} style={styles.taskRow} onPress={() => toggleTask(task.id)}>
            <View style={[styles.check, task.done && styles.checkDone]}>
              {task.done && <LucideIcons.Check size={15} color={C.text} />}
            </View>
            <View style={styles.taskTextWrap}>
              <Text style={[styles.taskText, task.done && styles.taskTextDone]}>{task.title}</Text>
              <Text style={styles.taskMeta}>{task.meta}</Text>
            </View>
            <View style={[styles.priority, { backgroundColor: `${task.color}20` }]}>
              <Text style={[styles.priorityText, { color: task.color }]}>{task.priority}</Text>
            </View>
          </Pressable>
        )) : (
          <View style={styles.emptyState}>
            <LucideIcons.CheckCircle2 size={22} color={C.green} />
            <Text style={styles.emptyStateText}>Nu există sarcini pentru azi.</Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 18, paddingBottom: 32 },
  controlCard: { backgroundColor: C.card, borderRadius: 23, padding: 17, borderWidth: 1, borderColor: C.line },
  controlTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingBottom: 17, borderBottomWidth: 1, borderBottomColor: C.line },
  controlKicker: { color: C.muted, fontSize: 9, fontWeight: "800", letterSpacing: 1.3 },
  controlTitle: { color: C.text, fontSize: 18, fontWeight: "800", marginTop: 4 },
  livePill: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: `${C.green}18`, paddingVertical: 7, paddingHorizontal: 10, borderRadius: 20 },
  liveDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: C.green },
  liveText: { color: C.green, fontSize: 9, fontWeight: "900" },
  metricsRow: { flexDirection: "row", marginTop: 17 },
  profilePanel: { backgroundColor: C.card, borderRadius: 20, padding: 15, borderWidth: 1, borderColor: C.line, marginTop: 8 },
  paymentSectionLabel: { color: C.muted, fontSize: 9, fontWeight: "900", letterSpacing: 1.2, marginBottom: 9 },
  profileDetailsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 9 },
  profileDetailBox: { flexGrow: 1, flexBasis: "46%", backgroundColor: C.bg, borderRadius: 14, padding: 12, borderWidth: 1, borderColor: C.line },
  profileDetailLabel: { color: C.muted, fontSize: 8, fontWeight: "900", letterSpacing: 0.8 },
  profileDetailValue: { color: C.text, fontSize: 11, fontWeight: "800", marginTop: 6 },
  secondaryButton: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, borderWidth: 1, borderColor: C.line, backgroundColor: C.card, borderRadius: 14, padding: 13, marginTop: 10 },
  secondaryButtonText: { color: C.blue, fontWeight: "900", fontSize: 12 },
  personalCard: { flexDirection: "row", alignItems: "center", gap: 13, backgroundColor: C.card, borderRadius: 23, padding: 17, borderWidth: 1, borderColor: C.line },
  personalIcon: { width: 58, height: 58, borderRadius: 18, backgroundColor: `${C.blue}16`, alignItems: "center", justifyContent: "center" },
  personalInfo: { flex: 1 },
  personalTitle: { color: C.text, fontSize: 18, fontWeight: "900", marginTop: 4 },
  personalText: { color: C.muted, fontSize: 10, lineHeight: 15, marginTop: 5 },
  nextEvent: { backgroundColor: C.card, borderRadius: 18, padding: 14, flexDirection: "row", alignItems: "center", borderLeftWidth: 3, borderLeftColor: C.red },
  dateBlock: { width: 52, height: 58, borderRadius: 13, backgroundColor: C.panel, alignItems: "center", justifyContent: "center" },
  dateDay: { color: C.text, fontSize: 22, fontWeight: "900" },
  dateMonth: { color: C.red, fontSize: 9, fontWeight: "900" },
  eventInfo: { flex: 1, marginLeft: 13 },
  eventTag: { color: C.red, fontSize: 9, fontWeight: "900", letterSpacing: 0.7 },
  eventTitle: { color: C.text, fontSize: 14, fontWeight: "800", marginTop: 4 },
  eventMeta: { color: C.muted, fontSize: 10, marginTop: 5 },
  taskList: { backgroundColor: C.card, borderRadius: 18, paddingHorizontal: 14 },
  taskRow: { flexDirection: "row", alignItems: "center", paddingVertical: 13, borderBottomWidth: 1, borderBottomColor: C.line },
  check: { width: 23, height: 23, borderRadius: 7, borderWidth: 2, borderColor: C.muted, alignItems: "center", justifyContent: "center" },
  checkDone: { backgroundColor: C.green, borderColor: C.green },
  taskTextWrap: { flex: 1, marginLeft: 11 },
  taskText: { color: C.text, fontSize: 12, fontWeight: "700" },
  taskTextDone: { color: C.muted, textDecorationLine: "line-through" },
  taskMeta: { color: C.muted, fontSize: 9, marginTop: 3 },
  priority: { paddingVertical: 5, paddingHorizontal: 7, borderRadius: 7 },
  priorityText: { fontSize: 7, fontWeight: "900" },
  emptyState: { alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 18 },
  emptyStateText: { color: C.muted, fontSize: 11, fontWeight: "700" },
});
