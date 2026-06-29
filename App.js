import React, { useEffect, useRef, useState } from "react";
import {
  Alert,
  Animated,
  Image,
  Pressable,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  Platform,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { isSupabaseConfigured, supabase } from "./supabaseClient";
import { supabaseService } from "./supabaseService";
import { scheduleLocalReminder } from "./src/services/mobileNotifications";
import { buildSimplePdf, safeReportFileName } from "./src/utils/pdf";
import { compareClubSchedule, currentMonthLabel, getDateParts, getMonthOptions, nowLabel, todayLabel } from "./src/utils/dates";

const C = {
  navy: "#061726",
  panel: "#0E2940",
  panel2: "#153853",
  line: "#214661",
  red: "#E32934",
  blue: "#51B7F2",
  green: "#35C784",
  amber: "#F4B84A",
  white: "#F7FAFC",
  muted: "#94AFC2",
};

const ENABLE_DEMO_MODE = String(process.env.EXPO_PUBLIC_ENABLE_DEMO || "").toLowerCase() === "true";
const LOCAL_MODE_LABEL = isSupabaseConfigured ? "Supabase" : "Local";
const DEFAULT_CLUB_ID = "club-fc-autentic";
const DEFAULT_SUBSCRIPTION_ID = "sub-fc-autentic-free";
const STORAGE_KEYS = {
  auth: "fc-autentic-auth",
  registeredUsers: "fc-autentic-registered-users",
  appData: "fc-autentic-training-data",
};

const toastListeners = new Set();

function showAppMessage(title, message) {
  if (toastListeners.size) {
    toastListeners.forEach((listener) => listener({ id: Date.now(), title, message }));
  } else {
    Alert.alert(title, message);
  }
}

function reportSyncError(area, error) {
  console.error(`Error syncing ${area} to Supabase:`, error);
  showAppMessage("Sincronizare eșuată", `${area}: datele au rămas local. Verifică conexiunea Supabase.`);
}

function downloadPdf(title, body) {
  if (typeof window === "undefined" || typeof document === "undefined") return false;
  const blob = new Blob([buildSimplePdf(title, body)], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${safeReportFileName(title)}.pdf`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
  return true;
}

function ToastHost() {
  const [toast, setToast] = useState(null);
  useEffect(() => {
    const listener = (nextToast) => setToast(nextToast);
    toastListeners.add(listener);
    return () => toastListeners.delete(listener);
  }, []);
  useEffect(() => {
    if (!toast) return undefined;
    const timer = setTimeout(() => setToast(null), 2600);
    return () => clearTimeout(timer);
  }, [toast]);
  if (!toast) return null;
  return (
    <View style={styles.toast}>
      <View style={styles.toastIcon}><Ionicons name="checkmark" size={16} color={C.white} /></View>
      <View style={styles.toastTextWrap}>
        <Text style={styles.toastTitle}>{toast.title}</Text>
        <Text style={styles.toastMessage}>{toast.message}</Text>
      </View>
    </View>
  );
}

const initialPlayers = [
  { id: 1, no: 1, name: "Victor Rusu", role: "Portar", group: "U19", status: "Activ", present: true },
  { id: 2, no: 4, name: "Andrei Munteanu", role: "Fundaș", group: "U19", status: "Activ", present: true },
  { id: 3, no: 8, name: "Mihai Lupu", role: "Mijlocaș", group: "U16", status: "Recuperare", present: false },
  { id: 4, no: 10, name: "Alexandru Popa", role: "Atacant", group: "U16", status: "Activ", present: true },
  { id: 5, no: 14, name: "Denis Ceban", role: "Fundaș", group: "U13", status: "Activ", present: true },
  { id: 6, no: 21, name: "Sergiu Moraru", role: "Mijlocaș", group: "U13", status: "Activ", present: false },
  { id: 7, no: 7, name: "David Rotaru", role: "Atacant", group: "Juniori", status: "Activ", present: true },
  { id: 8, no: 11, name: "Luca Cojocaru", role: "Mijlocaș", group: "Juniori", status: "Activ", present: true },
  { id: 9, no: 3, name: "Matei Sandu", role: "Fundaș", group: "Juniori", status: "Activ", present: false },
];

const clubGroups = ["U13", "U16", "U19", "Juniori", "Seniori"];
const NavigationContext = React.createContext({ openNotifications: () => {} });

const subscriptionPlans = {
  Free: { name: "Free", maxPlayers: 20, monthlyPrice: 0, features: ["1 club", "20 jucatori", "Functii de baza"] },
  Basic: { name: "Basic", maxPlayers: 50, monthlyPrice: 19, features: ["50 jucatori", "Antrenamente", "Prezenta"] },
  Pro: { name: "Pro", maxPlayers: null, monthlyPrice: 49, features: ["Jucatori nelimitati", "Statistici", "Rapoarte", "Meciuri"] },
  Academy: { name: "Academy", maxPlayers: null, monthlyPrice: 99, features: ["Mai multe grupe", "Mai multi antrenori", "Rapoarte avansate"] },
};

const defaultClub = {
  id: DEFAULT_CLUB_ID,
  name: "FC Autentic",
  logo: "",
  city: "Chisinau",
  country: "Moldova",
  email: "contact@fcautentic.md",
  phone: "+373 600 00 000",
  description: "Club de fotbal organizat profesionist.",
  groups: clubGroups,
  status: "active",
  blocked: false,
  plan: "Free",
  createdAt: "29 iunie 2026",
};

const defaultSubscription = {
  id: DEFAULT_SUBSCRIPTION_ID,
  clubId: DEFAULT_CLUB_ID,
  planName: "Free",
  status: "active",
  maxPlayers: subscriptionPlans.Free.maxPlayers,
  startedAt: "29 iunie 2026",
  expiresAt: "",
  createdAt: "29 iunie 2026",
};

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

const demoUsers = [
  { id: "demo-super", email: "super@fcautentic.md", password: "super123", name: "Super Admin", role: "super_admin", assignedGroups: clubGroups },
  { id: "demo-admin", email: "admin@fcautentic.md", password: "admin123", name: "Igor", role: "admin", assignedGroups: clubGroups },
  { id: "demo-coach", email: "antrenor@fcautentic.md", password: "coach123", name: "Mihai Rusu", role: "coach", assignedGroups: ["U19", "U16"] },
  { id: "demo-player", email: "jucator@fcautentic.md", password: "player123", name: "Victor Rusu", role: "player", playerId: 1, assignedGroups: ["U19"] },
  { id: "demo-parent", email: "parinte@fcautentic.md", password: "parent123", name: "Ana Rusu", role: "parent", childPlayerId: 1, assignedGroups: ["U19"] },
];

const roleRoutes = {
  super_admin: ["Panou", "Admin", "Echipă", "Antren.", "Meciuri", "Calendar", "Finanțe", "Mai mult"],
  club_owner: ["Panou", "Echipă", "Antren.", "Meciuri", "Calendar", "Finanțe", "Mai mult"],
  admin: ["Panou", "Echipă", "Antren.", "Meciuri", "Calendar", "Finanțe", "Mai mult"],
  coach: ["Panou", "Echipă", "Antren.", "Meciuri", "Calendar", "Mai mult"],
  player: ["Panou", "Antren.", "Meciuri", "Calendar", "Mai mult"],
  parent: ["Panou", "Antren.", "Meciuri", "Calendar", "Mai mult"],
  viewer: ["Panou", "Calendar", "Mai mult"],
  guest: ["Panou", "Calendar", "Mai mult"],
};

const roleTabs = {
  super_admin: ["Panou", "Admin", "Mai mult"],
  club_owner: ["Panou", "Echipă", "Antren.", "Meciuri", "Mai mult"],
  admin: ["Panou", "Echipă", "Antren.", "Meciuri", "Mai mult"],
  coach: ["Panou", "Echipă", "Antren.", "Meciuri", "Mai mult"],
  player: ["Panou", "Antren.", "Meciuri", "Calendar", "Mai mult"],
  parent: ["Panou", "Antren.", "Meciuri", "Calendar", "Mai mult"],
  viewer: ["Panou", "Calendar", "Mai mult"],
  guest: ["Panou", "Calendar", "Mai mult"],
};

const tabIcons = {
  Panou: "grid",
  Admin: "shield-checkmark",
  Echipă: "people",
  "Antren.": "barbell",
  Meciuri: "football",
  Calendar: "calendar",
  "Notif.": "notifications",
  Finanțe: "wallet",
  "Mai mult": "menu",
};

function normalizeRole(role) {
  if (role === "admin") return "club_owner";
  return role || "viewer";
}

function isSuperAdmin(user) {
  return user?.role === "super_admin";
}

function isClubOwner(user) {
  return ["club_owner", "admin"].includes(user?.role);
}

function canManageClub(user) {
  return ["super_admin", "club_owner", "admin", "coach"].includes(user?.role);
}

function canManageFinance(user) {
  return ["super_admin", "club_owner", "admin"].includes(user?.role);
}

function getClubId(item) {
  return item?.clubId || item?.club_id || DEFAULT_CLUB_ID;
}

function attachClubId(item, clubId = DEFAULT_CLUB_ID) {
  if (!item || typeof item !== "object") return item;
  return { ...item, clubId: getClubId(item) || clubId };
}

function attachClubIdList(list, clubId = DEFAULT_CLUB_ID) {
  return (list || []).map((item) => attachClubId(item, clubId));
}

function filterByClub(list, clubId) {
  if (!clubId) return list || [];
  return (list || []).filter((item) => getClubId(item) === clubId);
}

function getClubSubscription(subscriptions, clubId) {
  return (subscriptions || []).find((item) => item.clubId === clubId) || { ...defaultSubscription, clubId, id: `sub-${clubId}`, planName: "Free" };
}

function getPlanLimit(subscription) {
  const plan = subscriptionPlans[subscription?.planName] || subscriptionPlans.Free;
  return subscription?.maxPlayers ?? plan.maxPlayers;
}

function isSubscriptionActive(subscription, club) {
  if (club?.blocked || club?.status === "blocked" || club?.status === "inactive") return false;
  if (!subscription) return true;
  if (subscription.status && subscription.status !== "active" && subscription.status !== "trialing") return false;
  if (!subscription.expiresAt) return true;
  const parsed = Date.parse(subscription.expiresAt);
  return Number.isNaN(parsed) ? true : parsed >= Date.now();
}

function filterPlayersByUser(players, user, clubId) {
  const scopedPlayers = filterByClub(players, clubId);
  if (!user || ["super_admin", "club_owner", "admin"].includes(user.role)) return scopedPlayers;
  if (user.role === "coach") return scopedPlayers.filter((player) => user.assignedGroups?.includes(player.group));
  if (user.role === "player") return scopedPlayers.filter((player) => player.id === user.playerId);
  if (user.role === "parent") {
    const children = [user.childPlayerId, ...(user.childPlayerIds || [])].filter(Boolean);
    return scopedPlayers.filter((player) => children.includes(player.id));
  }
  return [];
}

function filterTrainingsByUser(trainings, user, players, clubId) {
  const scopedTrainings = filterByClub(trainings, clubId);
  if (!user || ["super_admin", "club_owner", "admin"].includes(user.role)) return scopedTrainings;
  if (user.role === "coach") return scopedTrainings.filter((training) => user.assignedGroups?.includes(training.group));
  const allowedPlayers = filterPlayersByUser(players, user, clubId);
  const groups = [...new Set(allowedPlayers.map((player) => player.group))];
  return scopedTrainings.filter((training) => groups.includes(training.group));
}

function filterMatchesByUser(matches, user, players, clubId) {
  const scopedMatches = filterByClub(matches, clubId);
  if (!user || ["super_admin", "club_owner", "admin"].includes(user.role)) return scopedMatches;
  if (user.role === "coach") return scopedMatches.filter((match) => user.assignedGroups?.includes(match.group));
  const allowedPlayers = filterPlayersByUser(players, user, clubId);
  const groups = [...new Set(allowedPlayers.map((player) => player.group))];
  return scopedMatches.filter((match) => groups.includes(match.group));
}

function getPlayerJournal(playerObservations, playerId) {
  return (playerObservations?.[playerId] || []).slice().sort((a, b) => Number(b.id) - Number(a.id));
}

function buildPlayerReport(player, { trainings = [], attendance = {}, matches = [], payments = {}, monthlyPayments = {}, observations = [] }) {
  const playerTrainings = trainings.filter((training) => training.group === player.group);
  const statuses = playerTrainings.map((training) => attendance[training.id]?.[player.id]).filter(Boolean);
  const present = statuses.filter((status) => status === "present").length;
  const late = statuses.filter((status) => status === "late").length;
  const absent = statuses.filter((status) => status === "absent").length;
  const percent = statuses.length ? Math.round(((present + late * 0.5) / statuses.length) * 100) : 0;
  const playerMatches = matches.filter((match) => match.group === player.group);
  const goals = playerMatches.reduce((sum, match) => sum + Number(match.scorers?.[player.id] || 0), 0);
  const assists = playerMatches.reduce((sum, match) => sum + Number(match.playerStats?.[player.id]?.assists || 0), 0);
  const minutes = playerMatches.reduce((sum, match) => sum + Number(match.playerStats?.[player.id]?.minutes || 0), 0);
  const paid = Object.values(payments).reduce((sum, row) => sum + (row?.[player.id]?.paid ? Number(row[player.id].amount || 0) : 0), 0)
    + Object.values(monthlyPayments).reduce((sum, row) => sum + (row?.[player.id]?.paid ? Number(row[player.id].amount || 0) : 0), 0);
  return [
    `Raport jucător - ${player.name}`,
    `Grupă: ${player.group}`,
    `Număr: #${player.no}`,
    `Post: ${player.role}`,
    `Status: ${player.status}`,
    `Prezență: ${percent}% (${present} prezent, ${late} întârziat, ${absent} absent)`,
    `Meciuri grupă: ${playerMatches.length}`,
    `Minute: ${minutes}`,
    `Goluri: ${goals}`,
    `Assist-uri: ${assists}`,
    `Total achitat: ${paid} lei`,
    `Observații recente: ${observations.slice(0, 5).map((item) => item.text).join(" | ") || "—"}`,
  ].join("\n");
}

const trainingSteps = [
  "Încălzire",
  "Exerciții tehnice",
  "Pase",
  "Dribling",
  "Șuturi",
  "Tactică",
  "Meci de antrenament",
  "Stretching / recuperare",
];

const initialTrainings = [
  {
    id: 101,
    state: "Viitor",
    date: "25 iunie 2026",
    time: "18:30",
    location: "Teren principal",
    group: "U19",
    coach: "M. Rusu",
    theme: "Tranziția pozitivă",
    objectives: "Reacție rapidă după recuperarea mingii",
    equipment: "Mingi, conuri, veste, porți mici",
    exercises: "Rondo 5v2, tranziții 6v4, joc 8v8",
    steps: trainingSteps,
  },
  {
    id: 102,
    state: "Viitor",
    date: "27 iunie 2026",
    time: "17:00",
    location: "Arena Nord",
    group: "U16",
    coach: "A. Popescu",
    theme: "Finalizare",
    objectives: "Precizie și decizie în ultima treime",
    equipment: "Mingi, jaloane, manechine",
    exercises: "Șut după dribling, 2v1, atac pozițional",
    steps: trainingSteps,
  },
  {
    id: 103,
    state: "Finalizat",
    date: "20 iunie 2026",
    time: "18:00",
    location: "Teren secundar",
    group: "U13",
    coach: "D. Ceban",
    theme: "Control și pasă",
    objectives: "Orientarea corpului și primul contact",
    equipment: "Mingi, conuri colorate",
    exercises: "Pătrate de pase, 3v3, joc liber",
    steps: trainingSteps,
  },
];

const attendanceOptions = [
  ["present", "✓", "Prezent", C.green],
  ["absent", "×", "Absent", C.red],
  ["late", "⏱", "Întârziat", C.amber],
  ["injured", "+", "Accidentat", "#D47AF0"],
  ["excused", "•", "Scutit", C.blue],
];

const initialMatches = [
  {
    id: 201,
    type: "Meci oficial",
    opponent: "FC Speranța",
    group: "U19",
    date: "29 iunie 2026",
    time: "18:00",
    location: "Stadionul Municipal",
    status: "Programat",
    score: "",
    notes: "Ajungere cu 45 minute înainte. Echipament roșu-albastru.",
    callUps: { 1: "convocat", 2: "convocat" },
  },
  {
    id: 202,
    type: "Meci amical",
    opponent: "Academia Nord",
    group: "U16",
    date: "2 iulie 2026",
    time: "17:30",
    location: "Arena Nord",
    status: "Programat",
    score: "",
    notes: "Test tactic pentru pressing și tranziție.",
    callUps: { 3: "rezervă", 4: "convocat" },
  },
];

const initialFinanceRows = [
  { id: 1, label: "Cotizații jucători", value: 18500, positive: true, date: "Iunie" },
  { id: 2, label: "Închiriere teren", value: 6200, positive: false, date: "20 iun" },
  { id: 3, label: "Echipament sportiv", value: 4350, positive: false, date: "17 iun" },
  { id: 4, label: "Sponsor local", value: 12000, positive: true, date: "12 iun" },
];

const initialClubSettings = {
  clubName: "FC Autentic",
  email: "contact@fcautentic.md",
  phone: "+373 600 00 000",
  address: "Stadionul Municipal",
  currency: "MDL",
  trainingFee: "150",
  monthlyFee: "600",
  primaryColor: C.red,
};

const initialDocuments = [
  { id: 1, title: "Contract jucător", owner: "Victor Rusu", type: "Contract", status: "Valid", expires: "30.06.2027" },
  { id: 2, title: "Acord părinte", owner: "Ana Rusu", type: "Acord", status: "Valid", expires: "Nelimitat" },
  { id: 3, title: "Certificat medical", owner: "Mihai Lupu", type: "Medical", status: "Expiră curând", expires: "15.07.2026" },
];

const initialAnnouncements = [
  { id: 1, audience: "Toți", title: "Program actualizat", text: "Verificați calendarul pentru următoarele antrenamente.", date: "Azi" },
  { id: 2, audience: "Părinți U19", title: "Convocare meci", text: "Jucătorii convocați trebuie să ajungă cu 45 minute înainte.", date: "Ieri" },
];

const initialPlayerObservations = {
  1: [
    { id: 1001, type: "Profil", source: "Evaluare inițială", date: "Azi", author: "Igor", text: "Atitudine bună și comunicare foarte bună cu linia de apărare." },
  ],
};

const initialEquipment = [
  { id: 1, name: "Mingi antrenament", category: "Materiale", total: 24, assigned: "Club", missing: 2 },
  { id: 2, name: "Veste roșii", category: "Echipament", total: 18, assigned: "U19", missing: 0 },
  { id: 3, name: "Conuri", category: "Materiale", total: 40, assigned: "Antrenori", missing: 4 },
];

const initialEvaluations = {
  1: { month: "Iunie 2026", technique: 8, speed: 7, discipline: 9, attitude: 9, tactics: 8, physical: 7 },
};

const initialDevelopmentPlans = {
  1: { focus: "Joc de picior și ieșiri pe centrări", objective: "Îmbunătățește repunerea rapidă", exercises: "10 minute pase lungi după fiecare antrenament", status: "În lucru" },
};

const initialDiscipline = [
  { id: 1, playerId: 3, type: "Întârziere", date: "20 iunie", note: "A ajuns cu 12 minute întârziere." },
];

const initialChatMessages = [
  { id: 1, audience: "Antrenori", author: "Igor", text: "Actualizăm convocările până vineri.", date: "Azi" },
];

const initialMediaGallery = [
  { id: 1, type: "Meci", title: "U19 vs FC Speranța", url: "Video/poze de adăugat", date: "29 iunie" },
];

const initialScouting = [
  { id: 1, name: "Nicu Vieru", age: "12", role: "Atacant", notes: "Viteză bună, finalizare de urmărit.", decision: "Revăzut" },
];

const seedData = {
  players: ENABLE_DEMO_MODE ? attachClubIdList(initialPlayers) : [],
  trainings: ENABLE_DEMO_MODE ? attachClubIdList(initialTrainings) : [],
  matches: ENABLE_DEMO_MODE ? attachClubIdList(initialMatches) : [],
  attendance: ENABLE_DEMO_MODE ? { 103: { 5: "present", 6: "late" } } : {},
  payments: ENABLE_DEMO_MODE ? { 101: { 1: { paid: true, amount: "150", paidAt: "Achitat azi" } } } : {},
  transactions: ENABLE_DEMO_MODE ? attachClubIdList(initialFinanceRows) : [],
  documents: ENABLE_DEMO_MODE ? attachClubIdList(initialDocuments) : [],
  announcements: ENABLE_DEMO_MODE ? initialAnnouncements : [],
  playerObservations: ENABLE_DEMO_MODE ? initialPlayerObservations : {},
  equipment: ENABLE_DEMO_MODE ? attachClubIdList(initialEquipment) : [],
  evaluations: ENABLE_DEMO_MODE ? initialEvaluations : {},
  developmentPlans: ENABLE_DEMO_MODE ? initialDevelopmentPlans : {},
  discipline: ENABLE_DEMO_MODE ? attachClubIdList(initialDiscipline) : [],
  chatMessages: ENABLE_DEMO_MODE ? attachClubIdList(initialChatMessages) : [],
  mediaGallery: ENABLE_DEMO_MODE ? attachClubIdList(initialMediaGallery) : [],
  scouting: ENABLE_DEMO_MODE ? attachClubIdList(initialScouting) : [],
};

function Badge({ size = 48 }) {
  return <Image source={require("./assets/icon.png")} style={{ width: size, height: size, resizeMode: "contain" }} />;
}

function AppTopBar({ title, eyebrow = "FC AUTENTIC • MANAGER" }) {
  return (
    <View style={styles.topBar}>
      <View style={styles.topTitleWrap}>
        <Text style={styles.eyebrow}>{eyebrow}</Text>
        <Text style={styles.pageTitle}>{title}</Text>
      </View>
      <View style={styles.logoWrap}><Badge size={50} /></View>
    </View>
  );
}

function TopBar({ title, eyebrow = "FC AUTENTIC • MANAGER" }) {
  const { openNotifications } = React.useContext(NavigationContext);
  return (
    <View style={styles.topBar}>
      <View style={styles.logoWrap}><Badge size={44} /></View>
      <View style={styles.topTitleWrap}>
        <Text style={styles.eyebrow}>{eyebrow}</Text>
        <Text style={styles.pageTitle}>{title}</Text>
      </View>
      <Pressable style={styles.topNotifyButton} onPress={openNotifications}>
        <Ionicons name="notifications-outline" size={22} color={C.white} />
      </Pressable>
    </View>
  );
}

function SectionTitle({ title, action, onAction }) {
  return (
    <View style={styles.sectionHead}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {action ? <Pressable onPress={onAction}><Text style={styles.sectionAction}>{action}</Text></Pressable> : null}
    </View>
  );
}

function Metric({ icon, value, label, color }) {
  return (
    <View style={styles.metric}>
      <View style={[styles.metricIcon, { backgroundColor: `${color}22` }]}>
        <Ionicons name={icon} size={20} color={color} />
      </View>
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </View>
  );
}

function WelcomeScreen({ onLogin, onGuest }) {
  const fade = useRef(new Animated.Value(0)).current;
  const lift = useRef(new Animated.Value(18)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fade, { toValue: 1, duration: 650, useNativeDriver: true }),
      Animated.timing(lift, { toValue: 0, duration: 650, useNativeDriver: true }),
    ]).start();
  }, [fade, lift]);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.welcomeScreen}>
        <View style={styles.ballGlow} />
        <View style={styles.pitchLineOne} />
        <View style={styles.pitchLineTwo} />
        <Animated.View style={[styles.welcomeCard, { opacity: fade, transform: [{ translateY: lift }] }]}>
          <View style={styles.welcomeLogo}><Badge size={142} /></View>
          <Text style={styles.welcomeClub}>FC Autentic</Text>
          <Text style={styles.welcomeTitle}>Clubul tău, organizat profesionist.</Text>
          <Text style={styles.welcomeText}>Gestionare pentru jucători, antrenori, părinți, finanțe și prezență — într-o aplicație mobilă modernă.</Text>
          <Pressable style={styles.welcomePrimary} onPress={onLogin}>
            <Text style={styles.welcomePrimaryText}>Autentificare</Text>
            <Ionicons name="arrow-forward" size={19} color={C.white} />
          </Pressable>
          <Pressable style={styles.welcomeSecondary} onPress={onGuest}>
            <Text style={styles.welcomeSecondaryText}>Continuă ca Vizitator</Text>
          </Pressable>
          <Text style={styles.supabaseHint}>{isSupabaseConfigured ? "Supabase Auth activ" : "Mod local activ până conectezi Supabase"}</Text>
        </Animated.View>
      </View>
    </SafeAreaView>
  );
}

function LoginScreen({ onBack, onLogin, onGoogle, onForgot, onRegister, loading, error }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [localError, setLocalError] = useState("");

  const submit = () => {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail.includes("@")) {
      setLocalError("Introdu un email valid.");
      return;
    }
    if (password.length < 6) {
      setLocalError("Parola trebuie să aibă minimum 6 caractere.");
      return;
    }
    setLocalError("");
    onLogin(cleanEmail, password);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.loginContent} showsVerticalScrollIndicator={false}>
        <Pressable style={styles.backLink} onPress={onBack}>
          <Ionicons name="chevron-back" size={20} color={C.blue} />
          <Text style={styles.backText}>Înapoi</Text>
        </Pressable>
        <View style={styles.loginHero}>
          <Badge size={82} />
          <Text style={styles.loginTitle}>Autentificare</Text>
          <Text style={styles.loginSubtitle}>Intră în contul tău FC Autentic.</Text>
        </View>
        <View style={styles.formCard}>
          <TrainingField label="Email" value={email} onChange={setEmail} placeholder="nume@email.com" />
          <Text style={styles.trainingFieldLabel}>Parolă</Text>
          <View style={styles.passwordWrap}>
            <TextInput
              style={styles.passwordInput}
              value={password}
              onChangeText={setPassword}
              placeholder="Parola"
              placeholderTextColor={C.muted}
              secureTextEntry={!showPassword}
            />
            <Pressable onPress={() => setShowPassword((value) => !value)}>
              <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={21} color={C.blue} />
            </Pressable>
          </View>
          {!!(localError || error) && <Text style={styles.authError}>{localError || error}</Text>}
          <Pressable style={styles.primaryButton} onPress={submit}>
            <Ionicons name="log-in-outline" size={20} color={C.white} />
            <Text style={styles.primaryButtonText}>{loading ? "Se verifică..." : "Intră în aplicație"}</Text>
          </Pressable>
          <Pressable style={styles.googleButton} onPress={onGoogle}>
            <Ionicons name="logo-google" size={18} color={C.white} />
            <Text style={styles.googleButtonText}>Login cu Google</Text>
          </Pressable>
          <Pressable onPress={() => onForgot(email.trim().toLowerCase())}>
            <Text style={styles.forgotText}>Am uitat parola</Text>
          </Pressable>
          <Pressable style={styles.createAccountButton} onPress={onRegister}>
            <Ionicons name="person-add-outline" size={18} color={C.blue} />
            <Text style={styles.createAccountText}>Creează cont jucător</Text>
          </Pressable>
        </View>
        {ENABLE_DEMO_MODE && (
          <View style={styles.demoBox}>
            <Text style={styles.demoTitle}>Conturi demo</Text>
            <Text style={styles.demoText}>Admin: admin@fcautentic.md / admin123</Text>
            <Text style={styles.demoText}>Antrenor: antrenor@fcautentic.md / coach123</Text>
            <Text style={styles.demoText}>Jucător: jucator@fcautentic.md / player123</Text>
            <Text style={styles.demoText}>Părinte: parinte@fcautentic.md / parent123</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function RegisterPlayerScreen({ onBack, onRegister, loading, error }) {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    group: "U19",
    no: "",
    role: "Mijlocaș",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [localError, setLocalError] = useState("");

  const submit = () => {
    const email = form.email.trim().toLowerCase();
    if (form.name.trim().length < 3) {
      setLocalError("Introdu numele complet al jucătorului.");
      return;
    }
    if (!email.includes("@")) {
      setLocalError("Introdu un email valid.");
      return;
    }
    if (form.password.length < 6) {
      setLocalError("Parola trebuie să aibă minimum 6 caractere.");
      return;
    }
    if (form.password !== form.confirmPassword) {
      setLocalError("Parolele nu coincid.");
      return;
    }
    setLocalError("");
    onRegister({
      ...form,
      email,
      name: form.name.trim(),
      role: form.role.trim() || "Jucător",
      no: form.no.replace(/[^0-9]/g, ""),
    });
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.loginContent} showsVerticalScrollIndicator={false}>
        <Pressable style={styles.backLink} onPress={onBack}>
          <Ionicons name="chevron-back" size={20} color={C.blue} />
          <Text style={styles.backText}>Înapoi la login</Text>
        </Pressable>
        <View style={styles.loginHero}>
          <Badge size={82} />
          <Text style={styles.loginTitle}>Cont jucător</Text>
          <Text style={styles.loginSubtitle}>Creează profilul personal în FC Autentic.</Text>
        </View>
        <View style={styles.formCard}>
          <TrainingField label="Nume complet" value={form.name} onChange={(name) => setForm({ ...form, name })} placeholder="Ex: Victor Rusu" />
          <TrainingField label="Email" value={form.email} onChange={(email) => setForm({ ...form, email })} placeholder="jucator@email.com" />
          <View style={styles.formRow}>
            <View style={styles.formHalf}>
              <TrainingField label="Număr" value={form.no} onChange={(no) => setForm({ ...form, no: no.replace(/[^0-9]/g, "") })} placeholder="10" />
            </View>
            <View style={styles.formHalf}>
              <TrainingField label="Post" value={form.role} onChange={(role) => setForm({ ...form, role })} placeholder="Atacant" />
            </View>
          </View>
          <Text style={styles.trainingFieldLabel}>Grupa</Text>
          <View style={styles.groupRow}>
            {clubGroups.map((group) => (
              <Pressable key={group} style={[styles.groupChip, form.group === group && styles.groupChipActive]} onPress={() => setForm({ ...form, group })}>
                <Text style={[styles.groupChipText, form.group === group && styles.groupChipTextActive]}>{group}</Text>
              </Pressable>
            ))}
          </View>
          <Text style={styles.trainingFieldLabel}>Parolă</Text>
          <View style={styles.passwordWrap}>
            <TextInput
              style={styles.passwordInput}
              value={form.password}
              onChangeText={(password) => setForm({ ...form, password })}
              placeholder="Parola"
              placeholderTextColor={C.muted}
              secureTextEntry={!showPassword}
            />
            <Pressable onPress={() => setShowPassword((value) => !value)}>
              <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={21} color={C.blue} />
            </Pressable>
          </View>
          <TrainingField label="Confirmă parola" value={form.confirmPassword} onChange={(confirmPassword) => setForm({ ...form, confirmPassword })} placeholder="Repetă parola" />
          {!!(localError || error) && <Text style={styles.authError}>{localError || error}</Text>}
          <Pressable style={styles.primaryButton} onPress={submit}>
            <Ionicons name="checkmark-circle-outline" size={20} color={C.white} />
            <Text style={styles.primaryButtonText}>{loading ? "Se creează..." : "Creează contul"}</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function OnboardingScreen({ currentUser, invitations, onCreateClub, onAcceptInvitation, onLogout, error }) {
  const [token, setToken] = useState("");
  const pendingForUser = (invitations || []).filter((item) =>
    item.status === "pending" && item.email?.toLowerCase() === currentUser?.email?.toLowerCase()
  );
  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <TopBar title="Alege clubul" eyebrow="SAAS MULTI-CLUB" />
        <View style={styles.controlCard}>
          <View style={styles.controlTop}>
            <View>
              <Text style={styles.controlKicker}>BUN VENIT</Text>
              <Text style={styles.controlTitle}>{currentUser?.name || currentUser?.email || "Utilizator"}</Text>
            </View>
            <View style={styles.livePill}><View style={styles.liveDot} /><Text style={styles.liveText}>CONT NOU</Text></View>
          </View>
          <Text style={styles.personalText}>
            Ca sa intri in platforma, creezi un club nou sau accepti o invitatie primita de la un club existent.
          </Text>
        </View>

        <Pressable style={styles.primaryButton} onPress={onCreateClub}>
          <Ionicons name="add-circle-outline" size={20} color={C.white} />
          <Text style={styles.primaryButtonText}>Creeaza club nou</Text>
        </Pressable>

        <View style={styles.formCard}>
          <Text style={styles.paymentSectionLabel}>ACCEPTA INVITATIE</Text>
          <TrainingField label="Token invitatie sau email" value={token} onChange={setToken} placeholder="ex: invite-abc123" />
          {!!error && <Text style={styles.authError}>{error}</Text>}
          <Pressable style={styles.secondaryButton} onPress={() => onAcceptInvitation(token)}>
            <Ionicons name="mail-open-outline" size={18} color={C.blue} />
            <Text style={styles.secondaryButtonText}>Accepta invitatia</Text>
          </Pressable>
        </View>

        {pendingForUser.length ? (
          <>
            <SectionTitle title="Invitatii gasite pentru emailul tau" />
            {pendingForUser.map((invite) => (
              <Pressable style={styles.historyRow} key={invite.id} onPress={() => onAcceptInvitation(invite.token)}>
                <View>
                  <Text style={styles.historyTitle}>{roleLabels[invite.role] || invite.role}</Text>
                  <Text style={styles.historyMeta}>Token: {invite.token}</Text>
                </View>
                <Text style={[styles.historyStatus, { color: C.amber }]}>Accepta</Text>
              </Pressable>
            ))}
          </>
        ) : null}

        <Pressable style={styles.logoutButton} onPress={onLogout}>
          <Ionicons name="log-out-outline" size={18} color={C.red} />
          <Text style={styles.logoutText}>Iesire din cont</Text>
        </Pressable>
      </ScrollView>
      <ToastHost />
    </SafeAreaView>
  );
}

function CreateClubScreen({ onBack, onCreate, loading, error }) {
  const [form, setForm] = useState({
    name: "",
    logo: "",
    city: "",
    country: "Moldova",
    email: "",
    phone: "",
    description: "",
    groups: ["U13", "U16", "U19", "Seniori"],
  });

  const toggleGroup = (group) => {
    setForm((current) => ({
      ...current,
      groups: current.groups.includes(group)
        ? current.groups.filter((item) => item !== group)
        : [...current.groups, group],
    }));
  };

  const submit = () => {
    if (!form.name.trim()) {
      showAppMessage("Nume lipsa", "Completeaza numele clubului.");
      return;
    }
    if (!form.email.trim().includes("@")) {
      showAppMessage("Email invalid", "Completeaza emailul de contact al clubului.");
      return;
    }
    if (!form.groups.length) {
      showAppMessage("Grupe lipsa", "Alege cel putin o categorie de varsta.");
      return;
    }
    onCreate(form);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Pressable style={styles.backLink} onPress={onBack}>
          <Ionicons name="chevron-back" size={20} color={C.blue} />
          <Text style={styles.backText}>Inapoi</Text>
        </Pressable>
        <TopBar title="Create Club" eyebrow="ONBOARDING SAAS" />
        <View style={styles.formCard}>
          <TrainingField label="Nume club" value={form.name} onChange={(name) => setForm({ ...form, name })} placeholder="FC Autentic Academy" />
          <TrainingField label="Logo club (URL optional)" value={form.logo} onChange={(logo) => setForm({ ...form, logo })} placeholder="https://..." />
          <View style={styles.formRow}>
            <View style={styles.formHalf}><TrainingField label="Oras" value={form.city} onChange={(city) => setForm({ ...form, city })} placeholder="Chisinau" /></View>
            <View style={styles.formHalf}><TrainingField label="Tara" value={form.country} onChange={(country) => setForm({ ...form, country })} placeholder="Moldova" /></View>
          </View>
          <TrainingField label="Email contact" value={form.email} onChange={(email) => setForm({ ...form, email })} placeholder="club@email.com" />
          <TrainingField label="Telefon" value={form.phone} onChange={(phone) => setForm({ ...form, phone })} placeholder="+373..." />
          <TrainingField label="Descriere" value={form.description} onChange={(description) => setForm({ ...form, description })} multiline />
          <Text style={styles.trainingFieldLabel}>Categorii / grupe</Text>
          <View style={styles.groupRow}>
            {["U13", "U16", "U19", "Juniori", "Seniori"].map((group) => (
              <Pressable key={group} style={[styles.groupChip, form.groups.includes(group) && styles.groupChipActive]} onPress={() => toggleGroup(group)}>
                <Text style={[styles.groupChipText, form.groups.includes(group) && styles.groupChipTextActive]}>{group}</Text>
              </Pressable>
            ))}
          </View>
          {!!error && <Text style={styles.authError}>{error}</Text>}
        </View>
        <Pressable style={styles.primaryButton} onPress={submit}>
          <Ionicons name="shield-checkmark-outline" size={20} color={C.white} />
          <Text style={styles.primaryButtonText}>{loading ? "Se creeaza..." : "Creeaza club si devino owner"}</Text>
        </Pressable>
      </ScrollView>
      <ToastHost />
    </SafeAreaView>
  );
}

function Dashboard({ tasks, toggleTask, players, trainings, matches, attendance, transactions, payments, monthlyPayments, clubSettings, currentUser, setTab, selectedClub, subscription, invitations = [], memberships = [] }) {
  const budgetRows = makeAutomaticFinanceRows({ players, trainings, payments, monthlyPayments, transactions, clubSettings });
  const incomeTotal = budgetRows.filter((row) => row.positive).reduce((sum, row) => sum + Number(row.value || 0), 0);
  const expenseTotal = budgetRows.filter((row) => !row.positive).reduce((sum, row) => sum + Number(row.value || 0), 0);
  const balance = incomeTotal - expenseTotal;
  const nextTraining = trainings
    .filter((item) => item.state !== "Finalizat")
    .slice()
    .sort(compareClubSchedule)[0] || trainings.slice().sort(compareClubSchedule)[0];
  const nextMatch = matches
    ?.filter((item) => item.status !== "Finalizat")
    .slice()
    .sort(compareClubSchedule)[0] || matches?.slice().sort(compareClubSchedule)[0];
  const nextEvent = nextTraining
    ? { type: `ANTRENAMENT ${nextTraining.group}`, title: nextTraining.theme || "Antrenament programat", date: nextTraining.date, time: nextTraining.time, location: nextTraining.location, tab: "Antren." }
    : nextMatch
      ? { type: nextMatch.type || "MECI", title: `FC Autentic vs ${nextMatch.opponent}`, date: nextMatch.date, time: nextMatch.time, location: nextMatch.location, tab: "Meciuri" }
      : { type: "PROGRAM", title: "Nu există evenimente programate", date: "—", time: "—", location: "Adaugă un antrenament sau meci", tab: "Calendar" };
  const canSeeClubState = canManageClub(currentUser);
  const nextEventDate = getDateParts(nextEvent.date);
  const personalPlayer = players.find((player) => player.id === currentUser?.playerId || player.id === currentUser?.childPlayerId);
  const personalStatuses = personalPlayer ? trainings.filter((training) => training.group === personalPlayer.group).map((training) => attendance?.[training.id]?.[personalPlayer.id]).filter(Boolean) : [];
  const personalPresent = personalStatuses.filter((status) => status === "present").length;
  const personalLate = personalStatuses.filter((status) => status === "late").length;
  const personalPercent = personalStatuses.length ? Math.round(((personalPresent + personalLate * 0.5) / personalStatuses.length) * 100) : 0;
  const personalDebtKey = personalPlayer ? Object.keys(monthlyPayments || {}).find((key) => key.endsWith(`-${personalPlayer.group}`) && monthlyPayments[key]?.[personalPlayer.id] && !monthlyPayments[key][personalPlayer.id]?.paid) : null;
  const ownerInviteCount = invitations.filter((item) => item.clubId === selectedClub?.id && item.status === "pending").length;
  const coachCount = memberships.filter((item) => item.clubId === selectedClub?.id && item.role === "coach").length;
  const attendanceMarked = Object.values(attendance || {}).reduce((sum, row) => sum + Object.keys(row || {}).length, 0);
  const subscriptionLabel = subscription?.planName || selectedClub?.plan || "Free";

  return (
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <TopBar title={`Bun venit, ${currentUser?.name || "Manager"}!`} eyebrow={`${roleLabels[currentUser?.role] || "FC AUTENTIC"} • DASHBOARD`} />

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
            <Metric icon="people" value={players.length} label="Jucători" color={C.blue} />
            <Metric icon="calendar" value={trainings.length} label="Antrenamente" color={C.amber} />
            {canManageFinance(currentUser)
              ? <Metric icon="wallet" value={balance.toLocaleString("ro-RO")} label="Sold MDL" color={C.green} />
              : <Metric icon="notifications-outline" value="3" label="Notificări" color={C.green} />}
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
          {isClubOwner(currentUser) && (
            <Pressable style={styles.secondaryButton} onPress={() => setTab?.("Mai mult")}>
              <Ionicons name="mail-outline" size={18} color={C.blue} />
              <Text style={styles.secondaryButtonText}>{ownerInviteCount} invitatii pending</Text>
            </Pressable>
          )}
        </View>
        </>
      ) : (
        <View style={styles.personalCard}>
          <View style={styles.personalIcon}>
            <Ionicons name={currentUser?.role === "parent" ? "people-circle-outline" : "person-circle-outline"} size={30} color={C.blue} />
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
            <View style={styles.profileDetailBox}><Text style={styles.profileDetailLabel}>Cotizație</Text><Text style={[styles.profileDetailValue, { color: personalDebtKey ? C.amber : C.green }]}>{personalDebtKey ? "Restant" : "OK"}</Text></View>
          </View>
        </>
      )}

      <SectionTitle title="Următorul eveniment" action={nextEvent.tab} onAction={() => setTab?.(nextEvent.tab)} />
      <Pressable style={styles.nextEvent} onPress={() => setTab?.(nextEvent.tab)}>
        <View style={styles.dateBlock}><Text style={styles.dateDay}>{nextEventDate.day}</Text><Text style={styles.dateMonth}>{nextEventDate.month}</Text></View>
        <View style={styles.eventInfo}>
          <Text style={styles.eventTag}>{nextEvent.type} • {nextEvent.time}</Text>
          <Text style={styles.eventTitle}>{nextEvent.title}</Text>
          <Text style={styles.eventMeta}><Ionicons name="location-outline" size={13} /> {nextEvent.location}</Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color={C.muted} />
      </Pressable>

      <SectionTitle title="Sarcini de azi" action={`${tasks.filter((task) => task.done).length}/${tasks.length}`} />
      <View style={styles.taskList}>
        {tasks.length ? tasks.map((task) => (
          <Pressable key={task.id} style={styles.taskRow} onPress={() => toggleTask(task.id)}>
            <View style={[styles.check, task.done && styles.checkDone]}>
              {task.done && <Ionicons name="checkmark" size={15} color={C.white} />}
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
            <Ionicons name="checkmark-done-outline" size={22} color={C.green} />
            <Text style={styles.emptyStateText}>Nu există sarcini pentru azi.</Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

function Team({ players, setPlayers, currentUser, trainings = [], attendance = {}, payments = {}, monthlyPayments = {}, matches = [], clubSettings = initialClubSettings, playerObservations = {}, setPlayerObservations = () => {}, selectedClub, subscription }) {
  const [selectedGroup, setSelectedGroup] = useState("U19");
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [editingPlayer, setEditingPlayer] = useState(false);
  const [playerForm, setPlayerForm] = useState({});
  const [profileNote, setProfileNote] = useState("");
  const [showAddPlayer, setShowAddPlayer] = useState(false);
  const [newPlayer, setNewPlayer] = useState({
    name: "",
    no: "",
    role: "Mijlocaș",
    group: "U19",
  });
  const allowedPlayers = filterPlayersByUser(players, currentUser, selectedClub?.id);
  const allowedGroups = ["super_admin", "club_owner", "admin"].includes(currentUser?.role) ? (selectedClub?.groups || clubGroups) : [...new Set(allowedPlayers.map((player) => player.group))];
  const activeGroups = allowedGroups.length ? allowedGroups : clubGroups;
  const safeSelectedGroup = activeGroups.includes(selectedGroup) ? selectedGroup : activeGroups[0];
  const visiblePlayers = allowedPlayers.filter((player) => player.group === safeSelectedGroup);
  const present = visiblePlayers.filter((player) => player.present).length;
  const unavailable = visiblePlayers.filter((player) => player.status !== "Activ").length;

  const getAttendanceStats = (player) => {
    const relevant = trainings.filter((training) => training.group === player.group);
    const statuses = relevant.map((training) => attendance[training.id]?.[player.id]).filter(Boolean);
    const presentCount = statuses.filter((status) => status === "present").length;
    const absent = statuses.filter((status) => status === "absent").length;
    const late = statuses.filter((status) => status === "late").length;
    const injured = statuses.filter((status) => status === "injured").length;
    const excused = statuses.filter((status) => status === "excused").length;
    const percentage = statuses.length ? Math.round(((presentCount + late * 0.5 + excused * 0.5) / statuses.length) * 100) : 0;
    return { total: relevant.length, marked: statuses.length, present: presentCount, absent, late, injured, excused, percentage };
  };

  const getFinanceStats = (player) => {
    const trainingPaid = Object.values(payments).reduce((sum, row) => {
      const payment = row?.[player.id];
      return sum + (payment?.paid ? Number(payment.amount || clubSettings.trainingFee || 0) : 0);
    }, 0);
    const monthlyPaid = Object.values(monthlyPayments).reduce((sum, row) => {
      const payment = row?.[player.id];
      return sum + (payment?.paid ? Number(payment.amount || clubSettings.monthlyFee || 0) : 0);
    }, 0);
    const unpaidMonths = Object.entries(monthlyPayments).filter(([key, row]) => key.endsWith(`-${player.group}`) && row?.[player.id] && !row[player.id]?.paid).length;
    return { trainingPaid, monthlyPaid, totalPaid: trainingPaid + monthlyPaid, unpaidMonths };
  };

  const getMatchStats = (player) => {
    const playerMatches = matches.filter((match) => match.group === player.group);
    const goals = playerMatches.reduce((sum, match) => sum + Number(match.scorers?.[player.id] || 0), 0);
    const assists = playerMatches.reduce((sum, match) => sum + Number(match.playerStats?.[player.id]?.assists || 0), 0);
    const minutes = playerMatches.reduce((sum, match) => sum + Number(match.playerStats?.[player.id]?.minutes || 0), 0);
    const yellow = playerMatches.reduce((sum, match) => sum + Number(match.playerStats?.[player.id]?.yellow || 0), 0);
    return { total: playerMatches.length, goals, assists, minutes, yellow, last: playerMatches.slice(0, 5) };
  };

  const startEditPlayer = (player) => {
    setPlayerForm({
      name: player.name || "",
      no: String(player.no || ""),
      role: player.role || "",
      group: player.group || safeSelectedGroup,
      status: player.status || "Activ",
      birthdate: player.birthdate || "",
      foot: player.foot || "",
      parentPhone: player.parentPhone || "",
      medicalStatus: player.medicalStatus || "",
    });
    setEditingPlayer(true);
  };

  const savePlayerProfile = () => {
    if (!selectedPlayer || !playerForm.name?.trim()) {
      showAppMessage("Date incomplete", "Completează numele jucătorului.");
      return;
    }
    const updated = {
      ...selectedPlayer,
      ...playerForm,
      name: playerForm.name.trim(),
      no: Number(playerForm.no) || selectedPlayer.no,
      role: playerForm.role?.trim() || "Jucător",
      status: playerForm.status?.trim() || "Activ",
    };
    setPlayers((current) => current.map((player) => (player.id === selectedPlayer.id ? updated : player)));
    setSelectedPlayer(updated);
    setEditingPlayer(false);
    showAppMessage("Profil actualizat", "Datele jucătorului au fost salvate.");
  };

  const addProfileObservation = () => {
    if (!selectedPlayer || !profileNote.trim()) {
      showAppMessage("Observație goală", "Scrie observația înainte de salvare.");
      return;
    }
    const note = {
      id: Date.now(),
      type: "Profil",
      source: "Profil jucător",
      date: nowLabel(),
      author: currentUser?.name || "Antrenor",
      text: profileNote.trim(),
    };
    setPlayerObservations((current) => ({
      ...current,
      [selectedPlayer.id]: [note, ...(current[selectedPlayer.id] || [])],
    }));
    setProfileNote("");
    showAppMessage("Observație salvată", "Nota a fost adăugată în istoricul jucătorului.");
  };

  const savePlayer = () => {
    if (!newPlayer.name.trim()) {
      showAppMessage("Lipseste numele", "Completeaza numele jucatorului inainte de salvare.");
      return;
    }
    const limit = getPlanLimit(subscription);
    const clubPlayerCount = filterByClub(players, selectedClub?.id).length;
    if (limit && clubPlayerCount >= limit) {
      showAppMessage("Limita abonament", `Planul ${subscription?.planName || "Free"} permite maxim ${limit} jucatori. Actualizeaza abonamentul pentru a continua.`);
      return;
    }
    const player = {
      id: Date.now(),
      no: Number(newPlayer.no) || players.length + 1,
      name: newPlayer.name.trim(),
      role: newPlayer.role.trim() || "Jucător",
      group: newPlayer.group,
      clubId: selectedClub?.id || DEFAULT_CLUB_ID,
      status: "Activ",
      present: true,
    };
    setPlayers((current) => [...current, player]);
    setSelectedGroup(newPlayer.group);
    setNewPlayer({ name: "", no: "", role: "Mijlocaș", group: newPlayer.group });
    setShowAddPlayer(false);
    showAppMessage("Salvat", "Jucatorul a fost adaugat in echipa.");
  };

  if (selectedPlayer) {
    const currentPlayer = players.find((player) => player.id === selectedPlayer.id) || selectedPlayer;
    const stats = getAttendanceStats(currentPlayer);
    const finance = getFinanceStats(currentPlayer);
    const matchStats = getMatchStats(currentPlayer);
    const trainingHistory = trainings.filter((training) => training.group === currentPlayer.group).slice(0, 6);
    const journal = getPlayerJournal(playerObservations, currentPlayer.id);
    const reportText = buildPlayerReport(currentPlayer, { trainings, attendance, matches, payments, monthlyPayments, observations: journal });

    return (
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Pressable style={styles.backLink} onPress={() => { setSelectedPlayer(null); setEditingPlayer(false); }}>
          <Ionicons name="chevron-back" size={20} color={C.blue} />
          <Text style={styles.backText}>Înapoi la echipă</Text>
        </Pressable>
        <TopBar title={currentPlayer.name} eyebrow={`PROFIL JUCĂTOR • ${currentPlayer.group}`} />
        <View style={styles.playerProfileHero}>
          <View style={styles.profileAvatar}><Ionicons name="person" size={34} color={C.white} /></View>
          <Text style={styles.profilePlayerName}>{currentPlayer.name}</Text>
          <Text style={styles.profilePlayerMeta}>#{currentPlayer.no} • {currentPlayer.role} • {currentPlayer.status}</Text>
          <Text style={styles.profilePercent}>{stats.percentage}%</Text>
          <Text style={styles.profilePercentLabel}>prezență calculată automat</Text>
        </View>

        <View style={styles.profileStats}>
          <Metric icon="calendar-outline" value={stats.total} label="Antren." color={C.blue} />
          <Metric icon="checkmark-circle-outline" value={stats.present} label="Prezent" color={C.green} />
          <Metric icon="football-outline" value={matchStats.goals} label="Goluri" color={C.red} />
          <Metric icon="cash-outline" value={`${finance.totalPaid} L`} label="Achitat" color={C.amber} />
        </View>

        {canManageClub(currentUser) && (
          <View style={styles.formActions}>
            <Pressable style={[styles.formActionButton, styles.formCancelButton]} onPress={() => editingPlayer ? setEditingPlayer(false) : startEditPlayer(currentPlayer)}>
              <Text style={styles.formCancelText}>{editingPlayer ? "Închide redactarea" : "Redactează profil"}</Text>
            </Pressable>
            <Pressable style={[styles.formActionButton, styles.formSaveButton]} onPress={() => showAppMessage("Raport pregătit", reportText)}>
              <Text style={styles.formSaveText}>Raport</Text>
            </Pressable>
          </View>
        )}

        {editingPlayer && (
          <View style={styles.formCard}>
            <TrainingField label="Nume" value={playerForm.name} onChange={(name) => setPlayerForm({ ...playerForm, name })} />
            <View style={styles.formRow}>
              <View style={styles.formHalf}><TrainingField label="Număr" value={playerForm.no} onChange={(no) => setPlayerForm({ ...playerForm, no: no.replace(/[^0-9]/g, "") })} /></View>
              <View style={styles.formHalf}><TrainingField label="Post" value={playerForm.role} onChange={(role) => setPlayerForm({ ...playerForm, role })} /></View>
            </View>
            <Text style={styles.trainingFieldLabel}>Grupa</Text>
            <View style={styles.groupRow}>
              {activeGroups.map((group) => (
                <Pressable key={group} style={[styles.groupChip, playerForm.group === group && styles.groupChipActive]} onPress={() => setPlayerForm({ ...playerForm, group })}>
                  <Text style={[styles.groupChipText, playerForm.group === group && styles.groupChipTextActive]}>{group}</Text>
                </Pressable>
              ))}
            </View>
            <View style={styles.formRow}>
              <View style={styles.formHalf}><TrainingField label="Data nașterii" value={playerForm.birthdate} onChange={(birthdate) => setPlayerForm({ ...playerForm, birthdate })} placeholder="12.04.2010" /></View>
              <View style={styles.formHalf}><TrainingField label="Picior" value={playerForm.foot} onChange={(foot) => setPlayerForm({ ...playerForm, foot })} placeholder="Drept/Stâng" /></View>
            </View>
            <TrainingField label="Telefon părinte" value={playerForm.parentPhone} onChange={(parentPhone) => setPlayerForm({ ...playerForm, parentPhone })} />
            <TrainingField label="Status medical" value={playerForm.medicalStatus} onChange={(medicalStatus) => setPlayerForm({ ...playerForm, medicalStatus })} placeholder="Apt / recuperare / atenționări" />
            <TrainingField label="Status sportiv" value={playerForm.status} onChange={(status) => setPlayerForm({ ...playerForm, status })} />
            <Pressable style={styles.primaryButton} onPress={savePlayerProfile}>
              <Ionicons name="save-outline" size={18} color={C.white} />
              <Text style={styles.primaryButtonText}>Salvează profilul</Text>
            </Pressable>
          </View>
        )}

        <SectionTitle title="Date personale" />
        <View style={styles.profileDetailsGrid}>
          <View style={styles.profileDetailBox}><Text style={styles.profileDetailLabel}>Număr</Text><Text style={styles.profileDetailValue}>#{currentPlayer.no}</Text></View>
          <View style={styles.profileDetailBox}><Text style={styles.profileDetailLabel}>Grupă</Text><Text style={styles.profileDetailValue}>{currentPlayer.group}</Text></View>
          <View style={styles.profileDetailBox}><Text style={styles.profileDetailLabel}>Post</Text><Text style={styles.profileDetailValue}>{currentPlayer.role}</Text></View>
          <View style={styles.profileDetailBox}><Text style={styles.profileDetailLabel}>Status</Text><Text style={styles.profileDetailValue}>{currentPlayer.status}</Text></View>
          <View style={styles.profileDetailBox}><Text style={styles.profileDetailLabel}>Data nașterii</Text><Text style={styles.profileDetailValue}>{currentPlayer.birthdate || "De completat"}</Text></View>
          <View style={styles.profileDetailBox}><Text style={styles.profileDetailLabel}>Picior preferat</Text><Text style={styles.profileDetailValue}>{currentPlayer.foot || "De completat"}</Text></View>
          <View style={styles.profileDetailBox}><Text style={styles.profileDetailLabel}>Telefon părinte</Text><Text style={styles.profileDetailValue}>{currentPlayer.parentPhone || "De completat"}</Text></View>
          <View style={styles.profileDetailBox}><Text style={styles.profileDetailLabel}>Medical</Text><Text style={styles.profileDetailValue}>{currentPlayer.medicalStatus || "Apt"}</Text></View>
        </View>

        <SectionTitle title="Prezență antrenamente" />
        <View style={styles.profileStats}>
          <Metric icon="close-circle-outline" value={stats.absent} label="Absent" color={C.red} />
          <Metric icon="time-outline" value={stats.late} label="Întârziat" color={C.amber} />
          <Metric icon="medkit-outline" value={stats.injured} label="Accid." color={C.red} />
          <Metric icon="alert-circle-outline" value={stats.marked} label="Marcate" color={C.blue} />
        </View>
        {trainingHistory.length ? trainingHistory.map((training) => {
          const currentStatus = attendance[training.id]?.[currentPlayer.id];
          const option = attendanceOptions.find(([key]) => key === currentStatus);
          return (
            <View style={styles.historyRow} key={training.id}>
              <View><Text style={styles.historyTitle}>{training.theme}</Text><Text style={styles.historyMeta}>{training.date} • {training.time} • {training.location}</Text></View>
              <Text style={[styles.historyStatus, { color: option?.[3] || C.muted }]}>{option?.[2] || "Nemarcat"}</Text>
            </View>
          );
        }) : (
          <View style={styles.emptyState}><Ionicons name="calendar-clear-outline" size={24} color={C.muted} /><Text style={styles.emptyText}>Nu există încă antrenamente pentru această grupă.</Text></View>
        )}

        <SectionTitle title="Finanțe" />
        <View style={styles.profileDetailsGrid}>
          <View style={styles.profileDetailBox}><Text style={styles.profileDetailLabel}>Antrenamente achitate</Text><Text style={styles.profileDetailValue}>{finance.trainingPaid} lei</Text></View>
          <View style={styles.profileDetailBox}><Text style={styles.profileDetailLabel}>Cotizații achitate</Text><Text style={styles.profileDetailValue}>{finance.monthlyPaid} lei</Text></View>
          <View style={styles.profileDetailBox}><Text style={styles.profileDetailLabel}>Total achitat</Text><Text style={styles.profileDetailValue}>{finance.totalPaid} lei</Text></View>
          <View style={styles.profileDetailBox}><Text style={styles.profileDetailLabel}>Luni restante</Text><Text style={styles.profileDetailValue}>{finance.unpaidMonths}</Text></View>
        </View>

        <SectionTitle title="Meciuri și statistici" />
        <View style={styles.profileDetailsGrid}>
          <View style={styles.profileDetailBox}><Text style={styles.profileDetailLabel}>Meciuri grupă</Text><Text style={styles.profileDetailValue}>{matchStats.total}</Text></View>
          <View style={styles.profileDetailBox}><Text style={styles.profileDetailLabel}>Goluri marcate</Text><Text style={styles.profileDetailValue}>{matchStats.goals}</Text></View>
          <View style={styles.profileDetailBox}><Text style={styles.profileDetailLabel}>Assist-uri</Text><Text style={styles.profileDetailValue}>{matchStats.assists}</Text></View>
          <View style={styles.profileDetailBox}><Text style={styles.profileDetailLabel}>Minute jucate</Text><Text style={styles.profileDetailValue}>{matchStats.minutes}</Text></View>
        </View>
        {matchStats.last.map((match) => (
          <View style={styles.historyRow} key={match.id}>
            <View><Text style={styles.historyTitle}>vs {match.opponent}</Text><Text style={styles.historyMeta}>{match.date} • {match.location}</Text></View>
            <Text style={styles.historyStatus}>{Number(match.scorers?.[currentPlayer.id] || 0)} goluri</Text>
          </View>
        ))}

        <SectionTitle title="Observații antrenor" action={`${journal.length} note`} />
        {canManageClub(currentUser) && (
          <View style={styles.formCard}>
            <TrainingField label="Observație nouă" value={profileNote} onChange={setProfileNote} placeholder="Ex: progres bun la finalizare, atenție la poziționare..." multiline />
            <Pressable style={styles.primaryButton} onPress={addProfileObservation}>
              <Ionicons name="chatbox-ellipses-outline" size={18} color={C.white} />
              <Text style={styles.primaryButtonText}>Salvează observația</Text>
            </Pressable>
          </View>
        )}
        {journal.length ? journal.map((item) => (
          <View style={styles.noteCard} key={item.id}>
            <Ionicons name={item.type === "Meci" ? "football-outline" : item.type === "Antrenament" ? "barbell-outline" : "chatbox-ellipses-outline"} size={22} color={C.blue} />
            <View style={{ flex: 1 }}>
              <Text style={styles.historyTitle}>{item.type} • {item.source}</Text>
              <Text style={styles.historyMeta}>{item.date} • {item.author}</Text>
              <Text style={styles.noteText}>{item.text}</Text>
            </View>
          </View>
        )) : (
          <View style={styles.emptyState}><Ionicons name="chatbubbles-outline" size={24} color={C.muted} /><Text style={styles.emptyText}>Nu există încă observații pentru acest jucător.</Text></View>
        )}
      </ScrollView>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <TopBar title="Echipă" eyebrow="LOT ȘI PREZENȚĂ" />

      <View style={styles.teamGroups}>
        {activeGroups.map((group) => {
          const count = allowedPlayers.filter((player) => player.group === group).length;
          const active = safeSelectedGroup === group;
          return (
            <Pressable
              accessibilityLabel={`Grupa ${group}`}
              key={group}
              style={[styles.teamGroupCard, active && styles.teamGroupCardActive]}
              onPress={() => setSelectedGroup(group)}
            >
              <View style={[styles.teamGroupIcon, active && styles.teamGroupIconActive]}>
                <Ionicons name={group === "Juniori" ? "school-outline" : "shield-outline"} size={20} color={active ? C.white : C.blue} />
              </View>
              <Text style={[styles.teamGroupName, active && styles.teamGroupNameActive]}>{group}</Text>
              <Text style={[styles.teamGroupCount, active && styles.teamGroupCountActive]}>{count} jucători</Text>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.summaryStrip}>
        <View><Text style={styles.summaryValue}>{visiblePlayers.length}</Text><Text style={styles.summaryLabel}>în {safeSelectedGroup}</Text></View>
        <View style={styles.summaryDivider} />
        <View><Text style={[styles.summaryValue, { color: C.green }]}>{present}</Text><Text style={styles.summaryLabel}>prezenți azi</Text></View>
        <View style={styles.summaryDivider} />
        <View><Text style={[styles.summaryValue, { color: C.amber }]}>{unavailable}</Text><Text style={styles.summaryLabel}>indisponibili</Text></View>
      </View>

      <View style={styles.selectedGroupHeader}>
        <View>
          <Text style={styles.selectedGroupEyebrow}>GRUPA SELECTATĂ</Text>
          <Text style={styles.selectedGroupTitle}>{safeSelectedGroup}</Text>
        </View>
        <View style={styles.selectedGroupBadge}><Text style={styles.selectedGroupBadgeText}>{visiblePlayers.length}</Text></View>
      </View>

      {visiblePlayers.map((player) => (
        <Pressable style={styles.playerRow} key={player.id} onPress={() => setSelectedPlayer(player)}>
          <Text style={styles.playerNo}>{player.no}</Text>
          <View style={styles.avatar}><Ionicons name="person" size={22} color={C.muted} /></View>
          <View style={styles.playerInfo}>
            <Text style={styles.playerName}>{player.name}</Text>
            <Text style={styles.playerRole}>{player.role} • {player.group} • {player.status}</Text>
          </View>
          <Ionicons name="chevron-forward" size={19} color={C.muted} />
        </Pressable>
      ))}
      {showAddPlayer && canManageClub(currentUser) && (
        <View style={styles.formCard}>
          <TrainingField label="Nume jucător" value={newPlayer.name} onChange={(name) => setNewPlayer({ ...newPlayer, name })} placeholder="Ex: Ion Ciobanu" />
          <View style={styles.formRow}>
            <View style={styles.formHalf}><TrainingField label="Număr" value={newPlayer.no} onChange={(no) => setNewPlayer({ ...newPlayer, no: no.replace(/[^0-9]/g, "") })} placeholder="10" /></View>
            <View style={styles.formHalf}><TrainingField label="Post" value={newPlayer.role} onChange={(role) => setNewPlayer({ ...newPlayer, role })} placeholder="Atacant" /></View>
          </View>
          <Text style={styles.trainingFieldLabel}>Grupa</Text>
          <View style={styles.groupRow}>
            {activeGroups.map((group) => (
              <Pressable key={group} style={[styles.groupChip, newPlayer.group === group && styles.groupChipActive]} onPress={() => setNewPlayer({ ...newPlayer, group })}>
                <Text style={[styles.groupChipText, newPlayer.group === group && styles.groupChipTextActive]}>{group}</Text>
              </Pressable>
            ))}
          </View>
          <View style={styles.formActions}>
            <Pressable style={[styles.formActionButton, styles.formCancelButton]} onPress={() => setShowAddPlayer(false)}>
              <Text style={styles.formCancelText}>Anulează</Text>
            </Pressable>
            <Pressable style={[styles.formActionButton, styles.formSaveButton]} onPress={savePlayer}>
              <Text style={styles.formSaveText}>Salvează</Text>
            </Pressable>
          </View>
        </View>
      )}
      {canManageClub(currentUser) ? (
        <Pressable style={styles.outlineButton} onPress={() => setShowAddPlayer((value) => !value)}>
          <Ionicons name="person-add-outline" size={19} color={C.blue} />
          <Text style={styles.outlineButtonText}>{showAddPlayer ? "Închide formularul" : "Adaugă jucător"}</Text>
        </Pressable>
      ) : (
        <View style={styles.readOnlyNotice}>
          <Ionicons name="lock-closed-outline" size={17} color={C.blue} />
          <Text style={styles.readOnlyNoticeText}>Ai acces doar la informațiile permise rolului tău.</Text>
        </View>
      )}
    </ScrollView>
  );
}

function TrainingField({ label, value, onChange, placeholder, multiline = false }) {
  return (
    <View style={styles.trainingField}>
      <Text style={styles.trainingFieldLabel}>{label}</Text>
      <TextInput
        style={[styles.trainingInput, multiline && styles.trainingInputLarge]}
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={C.muted}
        multiline={multiline}
      />
    </View>
  );
}

function Trainings({ players, trainings, setTrainings, attendance, setAttendance, currentUser, playerObservations = {}, setPlayerObservations = () => {}, selectedClub, subscription }) {
  const [view, setView] = useState("list");
  const [filter, setFilter] = useState("Toate");
  const [statusFilter, setStatusFilter] = useState("Viitoare");
  const [selected, setSelected] = useState(null);
  const [profilePlayer, setProfilePlayer] = useState(null);
  const [role, setRole] = useState("Admin");
  const [editingTrainingId, setEditingTrainingId] = useState(null);
  const [trainingNotes, setTrainingNotes] = useState({});
  const [form, setForm] = useState({
    date: "30 iunie 2026",
    time: "18:30",
    location: "Teren principal",
    group: "U19",
    coach: "M. Rusu",
    theme: "",
    objectives: "",
    equipment: "",
    exercises: "",
  });

  const permittedTrainings = filterTrainingsByUser(trainings, currentUser, players, selectedClub?.id);
  const permittedPlayers = filterPlayersByUser(players, currentUser, selectedClub?.id);
  const permittedGroups = ["super_admin", "club_owner", "admin"].includes(currentUser?.role) ? (selectedClub?.groups || clubGroups) : [...new Set(permittedTrainings.map((training) => training.group))];
  const safeGroups = permittedGroups.length ? permittedGroups : clubGroups;
  const canManage = canManageClub(currentUser);
  const visibleTrainings = permittedTrainings.filter((training) => {
    const groupMatches = filter === "Toate" || training.group === filter;
    const stateMatches = statusFilter === "Viitoare" ? training.state === "Viitor" : training.state === "Finalizat";
    return groupMatches && stateMatches;
  });

  const saveTraining = () => {
    if (!form.date.trim() || !form.time.trim() || !form.location.trim()) {
      showAppMessage("Date incomplete", "Completeaza data, ora si locatia antrenamentului.");
      return;
    }
    if (!isSubscriptionActive(subscription, selectedClub)) {
      showAppMessage("Abonament blocat", "Clubul are abonamentul expirat sau este blocat. Nu se pot crea antrenamente noi.");
      return;
    }
    const training = {
      ...form,
      id: editingTrainingId || Date.now(),
      clubId: selectedClub?.id || DEFAULT_CLUB_ID,
      state: trainings.find((item) => item.id === editingTrainingId)?.state || "Viitor",
      steps: trainings.find((item) => item.id === editingTrainingId)?.steps || trainingSteps,
    };
    setTrainings((current) => editingTrainingId
      ? current.map((item) => (item.id === editingTrainingId ? training : item))
      : [training, ...current]);
    setSelected(training);
    setEditingTrainingId(null);
    setView("detail");
    showAppMessage("Salvat", editingTrainingId ? "Antrenamentul a fost actualizat." : "Antrenamentul a fost creat.");
  };

  const startEditTraining = (training) => {
    setForm({
      date: training.date || "",
      time: training.time || "",
      location: training.location || "",
      group: training.group || safeGroups[0],
      coach: training.coach || "",
      theme: training.theme || "",
      objectives: training.objectives || "",
      equipment: training.equipment || "",
      exercises: training.exercises || "",
    });
    setEditingTrainingId(training.id);
    setView("create");
  };

  const deleteTraining = (trainingId) => {
    setTrainings((current) => current.filter((item) => item.id !== trainingId));
    setSelected(null);
    setEditingTrainingId(null);
    setView("list");
    showAppMessage("Sters", "Antrenamentul a fost sters din program.");
  };

  const markAttendance = (trainingId, playerId, value) => {
    setAttendance((current) => ({
      ...current,
      [trainingId]: {
        ...(current[trainingId] || {}),
        [playerId]: value,
      },
    }));
  };

  const saveTrainingPlayerNote = (training, player) => {
    const key = `${training.id}-${player.id}`;
    const text = trainingNotes[key]?.trim();
    if (!text) {
      showAppMessage("Observație goală", "Scrie observația pentru jucător înainte de salvare.");
      return;
    }
    const note = {
      id: Date.now(),
      type: "Antrenament",
      source: training.theme || "Antrenament",
      date: training.date || todayLabel(),
      author: currentUser?.name || "Antrenor",
      text,
    };
    setPlayerObservations((current) => ({
      ...current,
      [player.id]: [note, ...(current[player.id] || [])],
    }));
    setTrainingNotes((current) => ({ ...current, [key]: "" }));
    showAppMessage("Observație salvată", `Nota pentru ${player.name} a fost adăugată.`);
  };

  const getPlayerStats = (player) => {
    const relevant = trainings.filter((training) => training.group === player.group);
    const statuses = relevant.map((training) => attendance[training.id]?.[player.id]).filter(Boolean);
    const present = statuses.filter((status) => status === "present").length;
    const absent = statuses.filter((status) => status === "absent").length;
    const late = statuses.filter((status) => status === "late").length;
    const percentage = statuses.length ? Math.round(((present + late * 0.5) / statuses.length) * 100) : 0;
    return { total: relevant.length, present, absent, late, percentage };
  };

  if (profilePlayer) {
    const stats = getPlayerStats(profilePlayer);
    const journal = getPlayerJournal(playerObservations, profilePlayer.id);
    return (
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Pressable style={styles.backLink} onPress={() => setProfilePlayer(null)}>
          <Ionicons name="chevron-back" size={20} color={C.blue} />
          <Text style={styles.backText}>Înapoi la prezență</Text>
        </Pressable>
        <View style={styles.playerProfileHero}>
          <View style={styles.profileAvatar}><Ionicons name="person" size={34} color={C.white} /></View>
          <Text style={styles.profilePlayerName}>{profilePlayer.name}</Text>
          <Text style={styles.profilePlayerMeta}>{profilePlayer.role} • {profilePlayer.group}</Text>
          <Text style={styles.profilePercent}>{stats.percentage}%</Text>
          <Text style={styles.profilePercentLabel}>prezență la antrenamente</Text>
        </View>
        <View style={styles.profileStats}>
          <Metric icon="calendar-outline" value={stats.total} label="Total" color={C.blue} />
          <Metric icon="checkmark-circle-outline" value={stats.present} label="Prezent" color={C.green} />
          <Metric icon="close-circle-outline" value={stats.absent} label="Absent" color={C.red} />
          <Metric icon="time-outline" value={stats.late} label="Întârziat" color={C.amber} />
        </View>
        <View style={styles.profileDetailsGrid}>
          <View style={styles.profileDetailBox}><Text style={styles.profileDetailLabel}>Data nașterii</Text><Text style={styles.profileDetailValue}>{profilePlayer.birthdate || "De completat"}</Text></View>
          <View style={styles.profileDetailBox}><Text style={styles.profileDetailLabel}>Picior preferat</Text><Text style={styles.profileDetailValue}>{profilePlayer.foot || "Drept"}</Text></View>
          <View style={styles.profileDetailBox}><Text style={styles.profileDetailLabel}>Telefon părinte</Text><Text style={styles.profileDetailValue}>{profilePlayer.parentPhone || "+373 600 11 222"}</Text></View>
          <View style={styles.profileDetailBox}><Text style={styles.profileDetailLabel}>Meciuri</Text><Text style={styles.profileDetailValue}>{profilePlayer.matches || 0}</Text></View>
        </View>
        <SectionTitle title="Ultimele observații" />
        {journal.length ? journal.slice(0, 4).map((item) => (
          <View style={styles.noteCard} key={item.id}>
            <Ionicons name={item.type === "Meci" ? "football-outline" : "barbell-outline"} size={22} color={C.blue} />
            <View style={{ flex: 1 }}>
              <Text style={styles.historyTitle}>{item.type} • {item.source}</Text>
              <Text style={styles.historyMeta}>{item.date} • {item.author}</Text>
              <Text style={styles.noteText}>{item.text}</Text>
            </View>
          </View>
        )) : (
          <View style={styles.emptyState}><Ionicons name="chatbubbles-outline" size={24} color={C.muted} /><Text style={styles.emptyText}>Nu există încă observații salvate.</Text></View>
        )}
        <SectionTitle title="Istoric antrenamente" />
        {trainings.filter((training) => training.group === profilePlayer.group).map((training) => {
          const currentStatus = attendance[training.id]?.[profilePlayer.id];
          const option = attendanceOptions.find(([key]) => key === currentStatus);
          return (
            <View style={styles.historyRow} key={training.id}>
              <View><Text style={styles.historyTitle}>{training.theme}</Text><Text style={styles.historyMeta}>{training.date} • {training.group}</Text></View>
              <Text style={[styles.historyStatus, { color: option?.[3] || C.muted }]}>{option?.[2] || "Nemarcat"}</Text>
            </View>
          );
        })}
      </ScrollView>
    );
  }

  if (view === "create") {
    return (
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Pressable style={styles.backLink} onPress={() => { setEditingTrainingId(null); setView("list"); }}>
          <Ionicons name="chevron-back" size={20} color={C.blue} />
          <Text style={styles.backText}>Anulează</Text>
        </Pressable>
        <TopBar title={editingTrainingId ? "Redactează antrenament" : "Antrenament nou"} eyebrow="PLANIFICARE" />
        <View style={styles.formCard}>
          <View style={styles.formRow}>
            <View style={styles.formHalf}><TrainingField label="Data" value={form.date} onChange={(date) => setForm({ ...form, date })} /></View>
            <View style={styles.formHalf}><TrainingField label="Ora" value={form.time} onChange={(time) => setForm({ ...form, time })} /></View>
          </View>
          <TrainingField label="Locația" value={form.location} onChange={(location) => setForm({ ...form, location })} />
          <Text style={styles.trainingFieldLabel}>Grupa</Text>
          <View style={styles.groupRow}>
            {safeGroups.map((group) => (
              <Pressable key={group} style={[styles.groupChip, form.group === group && styles.groupChipActive]} onPress={() => setForm({ ...form, group })}>
                <Text style={[styles.groupChipText, form.group === group && styles.groupChipTextActive]}>{group}</Text>
              </Pressable>
            ))}
          </View>
          <TrainingField label="Antrenor" value={form.coach} onChange={(coach) => setForm({ ...form, coach })} />
          <TrainingField label="Tema antrenamentului" value={form.theme} onChange={(theme) => setForm({ ...form, theme })} placeholder="Ex: tranziția pozitivă" />
          <TrainingField label="Obiective" value={form.objectives} onChange={(objectives) => setForm({ ...form, objectives })} placeholder="Ce urmărim?" multiline />
          <TrainingField label="Echipament necesar" value={form.equipment} onChange={(equipment) => setForm({ ...form, equipment })} placeholder="Mingi, conuri, veste..." multiline />
          <TrainingField label="Exerciții planificate" value={form.exercises} onChange={(exercises) => setForm({ ...form, exercises })} placeholder="Descrie exercițiile" multiline />
        </View>
        <Pressable style={styles.primaryButton} onPress={saveTraining}>
          <Ionicons name="checkmark" size={20} color={C.white} />
          <Text style={styles.primaryButtonText}>{editingTrainingId ? "Actualizează antrenamentul" : "Salvează antrenamentul"}</Text>
        </Pressable>
      </ScrollView>
    );
  }

  if (view === "detail" && selected) {
    const groupPlayers = currentUser?.role === "admin" || currentUser?.role === "coach"
      ? players.filter((player) => player.group === selected.group && filterPlayersByUser(players, currentUser).some((allowed) => allowed.id === player.id))
      : permittedPlayers.filter((player) => player.group === selected.group);
    return (
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Pressable style={styles.backLink} onPress={() => setView("list")}>
          <Ionicons name="chevron-back" size={20} color={C.blue} />
          <Text style={styles.backText}>Toate antrenamentele</Text>
        </Pressable>
        <View style={styles.trainingDetailHero}>
          <View style={styles.trainingDetailTop}>
            <View style={styles.trainingGroupPill}><Text style={styles.trainingGroupPillText}>{selected.group}</Text></View>
            <Text style={styles.trainingState}>{selected.state}</Text>
          </View>
          <Text style={styles.trainingDetailTitle}>{selected.theme || "Antrenament fără titlu"}</Text>
          <Text style={styles.trainingDetailMeta}>{selected.date} • {selected.time}</Text>
          <Text style={styles.trainingDetailMeta}><Ionicons name="location-outline" size={13} /> {selected.location} • {selected.coach}</Text>
        </View>
        {canManage && (
          <View style={styles.formActions}>
            <Pressable style={[styles.formActionButton, styles.formCancelButton]} onPress={() => startEditTraining(selected)}>
              <Text style={styles.formCancelText}>Redactează</Text>
            </Pressable>
            <Pressable style={[styles.formActionButton, styles.formSaveButton]} onPress={() => deleteTraining(selected.id)}>
              <Text style={styles.formSaveText}>Șterge</Text>
            </Pressable>
          </View>
        )}

        <SectionTitle title="Obiective și pregătire" />
        <View style={styles.detailInfoCard}>
          <Text style={styles.detailInfoLabel}>OBIECTIVE</Text><Text style={styles.detailInfoValue}>{selected.objectives || "—"}</Text>
          <Text style={styles.detailInfoLabel}>ECHIPAMENT</Text><Text style={styles.detailInfoValue}>{selected.equipment || "—"}</Text>
          <Text style={styles.detailInfoLabel}>EXERCIȚII</Text><Text style={styles.detailInfoValue}>{selected.exercises || "—"}</Text>
        </View>

        <SectionTitle title="Planul antrenamentului" />
        <View style={styles.timeline}>
          {selected.steps.map((step, index) => (
            <View style={styles.timelineRow} key={step}>
              <View style={styles.timelineNumber}><Text style={styles.timelineNumberText}>{index + 1}</Text></View>
              <Text style={styles.timelineText}>{step}</Text>
              <Text style={styles.timelineMinutes}>{index === 0 || index === 7 ? "10 min" : "15 min"}</Text>
            </View>
          ))}
        </View>

        <SectionTitle title="Prezență" action="Salvare automată" />
        <Text style={styles.attendanceSubtitle}>Alege statusul fiecărui jucător. Modificările sunt păstrate automat.</Text>
        {groupPlayers.map((player) => {
          const current = attendance[selected.id]?.[player.id];
          const noteKey = `${selected.id}-${player.id}`;
          return (
            <View style={styles.attendanceCard} key={player.id}>
              <Pressable style={styles.attendancePlayer} onPress={() => setProfilePlayer(player)}>
                <View style={styles.smallAvatar}><Text style={styles.smallAvatarText}>{player.no}</Text></View>
                <View><Text style={styles.attendanceName}>{player.name}</Text><Text style={styles.attendanceRole}>{player.role} • Vezi profilul</Text></View>
                <Ionicons name="chevron-forward" size={17} color={C.muted} />
              </Pressable>
              {canManage ? (
                <View style={styles.statusButtons}>
                  {attendanceOptions.map(([key, symbol, label, color]) => (
                    <Pressable
                      accessibilityLabel={`${label} ${player.name}`}
                      key={key}
                      style={[styles.statusButton, current === key && { backgroundColor: color, borderColor: color }]}
                      onPress={() => markAttendance(selected.id, player.id, key)}
                    >
                      <Text style={[styles.statusSymbol, current === key && { color: C.white }]}>{symbol}</Text>
                      <Text style={[styles.statusButtonText, current === key && { color: C.white }]}>{label}</Text>
                    </Pressable>
                  ))}
                </View>
              ) : (
                <Text style={styles.readOnlyStatus}>{attendanceOptions.find(([key]) => key === current)?.[2] || "Nemarcat"}</Text>
              )}
              {canManage && (
                <View style={styles.inlineNoteBox}>
                  <TrainingField label="Observație antrenor pentru jucător" value={trainingNotes[noteKey] || ""} onChange={(text) => setTrainingNotes((currentNotes) => ({ ...currentNotes, [noteKey]: text }))} placeholder="Ex: a lucrat bine la pase, atenție la disciplină..." multiline />
                  <Pressable style={styles.smallSaveButton} onPress={() => saveTrainingPlayerNote(selected, player)}>
                    <Ionicons name="save-outline" size={16} color={C.white} />
                    <Text style={styles.smallSaveText}>Salvează observația</Text>
                  </Pressable>
                </View>
              )}
            </View>
          );
        })}
      </ScrollView>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <TopBar title="Antrenamente" eyebrow="CENTRUL DE PREGĂTIRE" />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.roleRow}>
        {[roleLabels[currentUser?.role] || "Vizitator"].map((item) => (
          <Pressable key={item} style={[styles.roleChip, styles.roleChipActive]} onPress={() => setRole(item)}>
            <Text style={[styles.roleChipText, styles.roleChipTextActive]}>{item}</Text>
          </Pressable>
        ))}
      </ScrollView>
      <View style={styles.trainingSummary}>
        <View><Text style={styles.trainingSummaryValue}>{permittedTrainings.filter((item) => item.state === "Viitor").length}</Text><Text style={styles.trainingSummaryLabel}>Viitoare</Text></View>
        <View style={styles.summaryDivider} />
        <View><Text style={[styles.trainingSummaryValue, { color: C.green }]}>{permittedTrainings.filter((item) => item.state === "Finalizat").length}</Text><Text style={styles.trainingSummaryLabel}>Finalizate</Text></View>
        <View style={styles.summaryDivider} />
        <View><Text style={[styles.trainingSummaryValue, { color: C.amber }]}>86%</Text><Text style={styles.trainingSummaryLabel}>Prezență</Text></View>
      </View>
      <View style={styles.listHeader}>
        <View style={styles.statusToggle}>
          {["Viitoare", "Finalizate"].map((item) => (
            <Pressable key={item} style={[styles.statusToggleButton, statusFilter === item && styles.statusToggleActive]} onPress={() => setStatusFilter(item)}>
              <Text style={[styles.statusToggleText, statusFilter === item && styles.statusToggleTextActive]}>{item}</Text>
            </Pressable>
          ))}
        </View>
        {canManage && (
          <Pressable accessibilityLabel="Creează antrenament" style={styles.addTrainingButton} onPress={() => { setEditingTrainingId(null); setView("create"); }}>
            <Ionicons name="add" size={24} color={C.white} />
          </Pressable>
        )}
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.groupFilters}>
        {["Toate", ...safeGroups].map((group) => (
          <Pressable key={group} style={[styles.filterChip, filter === group && styles.filterChipActive]} onPress={() => setFilter(group)}>
            <Text style={[styles.filterChipText, filter === group && styles.filterChipTextActive]}>{group}</Text>
          </Pressable>
        ))}
      </ScrollView>
      {visibleTrainings.length === 0 && <Text style={styles.emptyText}>Nu există antrenamente pentru filtrul selectat.</Text>}
      {visibleTrainings.map((training) => (
        <Pressable key={training.id} style={styles.trainingCard} onPress={() => { setSelected(training); setView("detail"); }}>
          <View style={styles.trainingCardTop}>
            <View style={styles.trainingDateIcon}><Ionicons name="football-outline" size={25} color={C.red} /></View>
            <View style={styles.trainingCardInfo}>
              <View style={styles.trainingCardTags}><Text style={styles.trainingGroup}>{training.group}</Text><Text style={styles.trainingStateSmall}>{training.state}</Text></View>
              <Text style={styles.trainingTitle}>{training.theme}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={C.muted} />
          </View>
          <View style={styles.trainingMetaGrid}>
            <Text style={styles.trainingMeta}><Ionicons name="calendar-outline" size={13} /> {training.date}</Text>
            <Text style={styles.trainingMeta}><Ionicons name="time-outline" size={13} /> {training.time}</Text>
            <Text style={styles.trainingMeta}><Ionicons name="location-outline" size={13} /> {training.location}</Text>
            <Text style={styles.trainingMeta}><Ionicons name="person-outline" size={13} /> {training.coach}</Text>
          </View>
        </Pressable>
      ))}
    </ScrollView>
  );
}

const romanianMonths = {
  ianuarie: "IAN",
  februarie: "FEB",
  martie: "MAR",
  aprilie: "APR",
  mai: "MAI",
  iunie: "IUN",
  iulie: "IUL",
  august: "AUG",
  septembrie: "SEP",
  octombrie: "OCT",
  noiembrie: "NOI",
  decembrie: "DEC",
};

function makeTrainingEvent(training) {
  const dateParts = getDateParts(training.date);
  return {
    type: `Antrenament ${training.group}`,
    day: training.state === "Finalizat" ? "GATA" : "PLAN",
    date: `${dateParts.day} ${dateParts.month}`,
    time: training.time,
    detail: `${training.theme || "Fără temă"} • ${training.location}`,
    icon: "barbell-outline",
    color: training.state === "Finalizat" ? C.green : C.blue,
    group: training.group,
    rawDate: training.date,
  };
}

const callUpOptions = [
  ["convocat", "checkmark-circle", "Convocat", C.green],
  ["rezervă", "ellipse-outline", "Rezervă", C.amber],
  ["indisponibil", "close-circle", "Indisponibil", C.red],
  ["confirmat", "shield-checkmark", "Confirmat", C.blue],
];
const matchSquadStatuses = ["convocat", "confirmat", "rezervă"];

function MatchesPage({ players, matches, setMatches, currentUser, playerObservations = {}, setPlayerObservations = () => {}, selectedClub }) {
  const roleMatches = filterMatchesByUser(matches, currentUser, players, selectedClub?.id);
  const roleGroups = ["super_admin", "club_owner", "admin"].includes(currentUser?.role) ? (selectedClub?.groups || clubGroups) : [...new Set(roleMatches.map((match) => match.group))];
  const activeGroups = roleGroups.length ? roleGroups : clubGroups;
  const [selectedGroup, setSelectedGroup] = useState(activeGroups[0] || "U19");
  const safeGroup = activeGroups.includes(selectedGroup) ? selectedGroup : activeGroups[0];
  const groupMatches = roleMatches.filter((match) => match.group === safeGroup);
  const [selectedMatchId, setSelectedMatchId] = useState(groupMatches[0]?.id || roleMatches[0]?.id);
  const selectedMatch = groupMatches.find((match) => match.id === selectedMatchId) || groupMatches[0] || roleMatches[0];
  const [showMatchForm, setShowMatchForm] = useState(false);
  const [editingMatchId, setEditingMatchId] = useState(null);
  const [matchPlayerNotes, setMatchPlayerNotes] = useState({});
  const [activeStatsPlayerId, setActiveStatsPlayerId] = useState(null);
  const [matchForm, setMatchForm] = useState({
    type: "Meci oficial",
    opponent: "",
    group: safeGroup || "U19",
    date: "30 iunie 2026",
    time: "18:00",
    location: "Stadionul Municipal",
    notes: "",
  });
  const canEditMatches = canManageClub(currentUser);
  const selectedPlayers = selectedMatch ? players.filter((player) => player.group === selectedMatch.group) : [];
  const visibleCallUpPlayers = canEditMatches ? selectedPlayers : filterPlayersByUser(selectedPlayers, currentUser, selectedClub?.id);
  const callUps = selectedMatch?.callUps || {};
  const matchAnalysisPlayers = selectedPlayers.filter((player) => matchSquadStatuses.includes(callUps[player.id]) || Number(selectedMatch?.scorers?.[player.id] || 0) > 0);
  const activeStatsPlayer = matchAnalysisPlayers.find((player) => player.id === activeStatsPlayerId);
  const smartCallUps = selectedPlayers
    .map((player) => {
      const playerMatches = matches.filter((match) => match.group === player.group);
      const goals = playerMatches.reduce((sum, match) => sum + Number(match.scorers?.[player.id] || 0), 0);
      const minutes = playerMatches.reduce((sum, match) => sum + Number(match.playerStats?.[player.id]?.minutes || 0), 0);
      const penalty = player.status !== "Activ" ? 20 : 0;
      return { player, score: Math.max(0, 70 + goals * 8 + Math.round(minutes / 30) - penalty) };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);
  const calledCount = selectedPlayers.filter((player) => matchSquadStatuses.includes(callUps[player.id])).length;
  const confirmedCount = selectedPlayers.filter((player) => callUps[player.id] === "confirmat").length;

  const chooseGroup = (group) => {
    const firstMatch = roleMatches.find((match) => match.group === group);
    setSelectedGroup(group);
    setSelectedMatchId(firstMatch?.id);
    setMatchForm((current) => ({ ...current, group }));
  };

  const saveMatch = () => {
    if (!matchForm.opponent.trim()) {
      showAppMessage("Lipseste adversarul", "Completeaza adversarul inainte de salvarea meciului.");
      return;
    }
    const newMatch = {
      id: editingMatchId || Date.now(),
      status: matches.find((match) => match.id === editingMatchId)?.status || "Programat",
      score: matches.find((match) => match.id === editingMatchId)?.score || "",
      callUps: matches.find((match) => match.id === editingMatchId)?.callUps || {},
      clubId: selectedClub?.id || DEFAULT_CLUB_ID,
      ...matchForm,
      opponent: matchForm.opponent.trim(),
      notes: matchForm.notes.trim() || "Fara observatii.",
    };
    setMatches((current) => editingMatchId
      ? current.map((match) => (match.id === editingMatchId ? { ...match, ...newMatch } : match))
      : [newMatch, ...current]);
    setSelectedGroup(newMatch.group);
    setSelectedMatchId(newMatch.id);
    setMatchForm({ type: "Meci oficial", opponent: "", group: newMatch.group, date: "30 iunie 2026", time: "18:00", location: "Stadionul Municipal", notes: "" });
    setShowMatchForm(false);
    setEditingMatchId(null);
    showAppMessage("Salvat", editingMatchId ? "Meciul a fost actualizat." : "Meciul a fost adaugat.");
  };

  const startEditMatch = (match) => {
    setEditingMatchId(match.id);
    setMatchForm({
      type: match.type || "Meci oficial",
      opponent: match.opponent || "",
      group: match.group || safeGroup,
      date: match.date || "30 iunie 2026",
      time: match.time || "18:00",
      location: match.location || "Stadionul Municipal",
      notes: match.notes || "",
    });
    setShowMatchForm(true);
  };

  const deleteMatch = (matchId) => {
    setMatches((current) => current.filter((match) => match.id !== matchId));
    setSelectedMatchId(null);
    setEditingMatchId(null);
    setShowMatchForm(false);
    showAppMessage("Sters", "Meciul a fost sters din program.");
  };

  const setCallUpStatus = (playerId, status) => {
    if (!selectedMatch || !canEditMatches) return;
    setMatches((current) => current.map((match) => (
      match.id === selectedMatch.id
        ? { ...match, callUps: { ...(match.callUps || {}), [playerId]: status } }
        : match
    )));
  };

  const updateSelectedMatch = (patch) => {
    if (!selectedMatch || !canEditMatches) return;
    setMatches((current) => current.map((match) => (
      match.id === selectedMatch.id ? { ...match, ...patch } : match
    )));
  };

  const updateGoalScorer = (playerId, delta) => {
    if (!selectedMatch || !canEditMatches) return;
    const currentGoals = Number(selectedMatch.scorers?.[playerId] || 0);
    const nextGoals = Math.max(0, currentGoals + delta);
    const scorers = { ...(selectedMatch.scorers || {}) };
    if (nextGoals) scorers[playerId] = nextGoals;
    else delete scorers[playerId];
    updateSelectedMatch({ scorers });
  };

  const updateMatchPlayerStat = (playerId, field, delta) => {
    if (!selectedMatch || !canEditMatches) return;
    const currentStats = selectedMatch.playerStats || {};
    const playerStats = currentStats[playerId] || { minutes: 0, assists: 0, yellow: 0, red: 0 };
    const nextValue = Math.max(0, Number(playerStats[field] || 0) + delta);
    updateSelectedMatch({
      playerStats: {
        ...currentStats,
        [playerId]: { ...playerStats, [field]: nextValue },
      },
    });
  };

  const saveMatchPlayerNote = (match, player) => {
    const key = `${match.id}-${player.id}`;
    const text = matchPlayerNotes[key]?.trim();
    if (!text) {
      showAppMessage("Observație goală", "Scrie observația pentru jucător înainte de salvare.");
      return;
    }
    const note = {
      id: Date.now(),
      type: "Meci",
      source: `vs ${match.opponent}`,
      date: match.date || todayLabel(),
      author: currentUser?.name || "Antrenor",
      text,
    };
    setPlayerObservations((current) => ({
      ...current,
      [player.id]: [note, ...(current[player.id] || [])],
    }));
    setMatchPlayerNotes((current) => ({ ...current, [key]: "" }));
    showAppMessage("Observație salvată", `Nota pentru ${player.name} a fost adăugată.`);
  };

  const totalTeamGoals = selectedMatch
    ? Object.values(selectedMatch.scorers || {}).reduce((sum, value) => sum + Number(value || 0), 0)
    : 0;

  return (
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <TopBar title="Meciuri" eyebrow="PROGRAM SI CONVOCARI" />

      <View style={styles.trainingSummary}>
        <View><Text style={styles.trainingSummaryValue}>{roleMatches.length}</Text><Text style={styles.trainingSummaryLabel}>meciuri</Text></View>
        <View style={styles.summaryDivider} />
        <View><Text style={[styles.trainingSummaryValue, { color: C.green }]}>{calledCount}</Text><Text style={styles.trainingSummaryLabel}>convocati</Text></View>
        <View style={styles.summaryDivider} />
        <View><Text style={[styles.trainingSummaryValue, { color: C.blue }]}>{confirmedCount}</Text><Text style={styles.trainingSummaryLabel}>confirmati</Text></View>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.groupFilters}>
        {activeGroups.map((group) => (
          <Pressable key={group} style={[styles.filterChip, safeGroup === group && styles.filterChipActive]} onPress={() => chooseGroup(group)}>
            <Text style={[styles.filterChipText, safeGroup === group && styles.filterChipTextActive]}>{group}</Text>
          </Pressable>
        ))}
      </ScrollView>

      {canEditMatches && showMatchForm && (
        <View style={styles.formCard}>
          <View style={styles.formRow}>
            <View style={styles.formHalf}><TrainingField label="Tip meci" value={matchForm.type} onChange={(type) => setMatchForm({ ...matchForm, type })} /></View>
            <View style={styles.formHalf}><TrainingField label="Adversar" value={matchForm.opponent} onChange={(opponent) => setMatchForm({ ...matchForm, opponent })} placeholder="FC ..." /></View>
          </View>
          <Text style={styles.trainingFieldLabel}>Grupa</Text>
          <View style={styles.groupRow}>
            {activeGroups.map((group) => (
              <Pressable key={group} style={[styles.groupChip, matchForm.group === group && styles.groupChipActive]} onPress={() => setMatchForm({ ...matchForm, group })}>
                <Text style={[styles.groupChipText, matchForm.group === group && styles.groupChipTextActive]}>{group}</Text>
              </Pressable>
            ))}
          </View>
          <View style={styles.formRow}>
            <View style={styles.formHalf}><TrainingField label="Data" value={matchForm.date} onChange={(date) => setMatchForm({ ...matchForm, date })} /></View>
            <View style={styles.formHalf}><TrainingField label="Ora" value={matchForm.time} onChange={(time) => setMatchForm({ ...matchForm, time })} /></View>
          </View>
          <TrainingField label="Locatia" value={matchForm.location} onChange={(location) => setMatchForm({ ...matchForm, location })} />
          <TrainingField label="Observatii" value={matchForm.notes} onChange={(notes) => setMatchForm({ ...matchForm, notes })} placeholder="Echipament, ora sosirii, detalii..." multiline />
          <View style={styles.formActions}>
            <Pressable style={[styles.formActionButton, styles.formCancelButton]} onPress={() => { setShowMatchForm(false); setEditingMatchId(null); }}>
              <Text style={styles.formCancelText}>Anuleaza</Text>
            </Pressable>
            <Pressable style={[styles.formActionButton, styles.formSaveButton]} onPress={saveMatch}>
              <Text style={styles.formSaveText}>{editingMatchId ? "Actualizeaza" : "Salveaza"}</Text>
            </Pressable>
          </View>
        </View>
      )}

      <View style={styles.listHeader}>
        <SectionTitle title="Meciurile grupei" action={safeGroup} />
        {canEditMatches && (
          <Pressable style={styles.addTrainingButton} onPress={() => setShowMatchForm((value) => !value)}>
            <Ionicons name={showMatchForm ? "close" : "add"} size={24} color={C.white} />
          </Pressable>
        )}
      </View>

      {groupMatches.map((match) => {
        const active = selectedMatch?.id === match.id;
        const matchCallUps = match.callUps || {};
        const matchCalled = players.filter((player) => player.group === match.group && matchSquadStatuses.includes(matchCallUps[player.id])).length;
        const matchScorers = Object.entries(match.scorers || {})
          .map(([playerId, goals]) => `${players.find((player) => String(player.id) === String(playerId))?.name || "Jucător"} ${goals}`)
          .join(", ");
        return (
          <Pressable key={match.id} style={[styles.matchCard, active && styles.matchCardActive]} onPress={() => setSelectedMatchId(match.id)}>
            <View style={styles.matchCardTop}>
              <View style={styles.matchBall}><Ionicons name="football-outline" size={23} color={C.red} /></View>
              <View style={styles.matchInfo}>
                <Text style={styles.matchType}>{match.type} • {match.group}</Text>
                <Text style={styles.matchTitle}>FC Autentic vs {match.opponent}</Text>
                <Text style={styles.matchMeta}>{match.date} • {match.time} • {match.location}</Text>
              </View>
              <View style={styles.matchScoreBox}>
                <Text style={styles.matchScore}>{match.score || "—"}</Text>
                <Text style={styles.matchScoreLabel}>{match.status}</Text>
              </View>
            </View>
            <View style={styles.matchMiniStats}>
              <Text style={styles.matchMiniText}>{matchCalled} convocati</Text>
              {!!matchScorers && <Text style={styles.matchMiniText}>Marcatori: {matchScorers}</Text>}
              <Text style={styles.matchMiniText}>{match.notes}</Text>
            </View>
          </Pressable>
        );
      })}
      {!groupMatches.length && <Text style={styles.emptyText}>Nu exista meciuri pentru aceasta grupa.</Text>}

      {selectedMatch && (
        <>
          <SectionTitle title="Detalii meci" action={selectedMatch.status || "Programat"} />
          <View style={styles.matchHero}>
            <View style={styles.matchDetailTop}>
              <View style={{ flex: 1 }}>
                <Text style={styles.matchHeroTag}>{selectedMatch.group} • {selectedMatch.type}</Text>
                <Text style={styles.matchHeroTitle}>FC Autentic vs {selectedMatch.opponent}</Text>
                <Text style={styles.matchHeroMeta}>{selectedMatch.date} • {selectedMatch.time} • {selectedMatch.location}</Text>
              </View>
              <View style={styles.matchBigScore}>
                <TextInput
                  editable={canEditMatches}
                  style={styles.matchBigScoreInput}
                  value={selectedMatch.score || ""}
                  onChangeText={(score) => updateSelectedMatch({ score })}
                  placeholder="—"
                  placeholderTextColor={C.muted}
                />
                <TextInput
                  editable={canEditMatches}
                  style={styles.matchStatusInput}
                  value={selectedMatch.status || "Programat"}
                  onChangeText={(status) => updateSelectedMatch({ status })}
                  placeholder="Status"
                  placeholderTextColor={C.muted}
                />
              </View>
            </View>
            <Text style={styles.matchHeroNote}>{selectedMatch.notes}</Text>
          </View>
          {canEditMatches && (
            <View style={styles.formActions}>
              <Pressable style={[styles.formActionButton, styles.formCancelButton]} onPress={() => startEditMatch(selectedMatch)}>
                <Text style={styles.formCancelText}>Redacteaza</Text>
              </Pressable>
              <Pressable style={[styles.formActionButton, styles.formSaveButton]} onPress={() => deleteMatch(selectedMatch.id)}>
                <Text style={styles.formSaveText}>Sterge</Text>
              </Pressable>
            </View>
          )}

          {canEditMatches && (
            <View style={styles.matchAnalysisCard}>
              <View style={styles.matchAnalysisHead}>
                <View>
                  <Text style={styles.controlKicker}>ANALIZA MECIULUI</Text>
                  <Text style={styles.adminDetailTitle}>Statistici și observații</Text>
                </View>
                <Ionicons name="analytics-outline" size={22} color={C.blue} />
              </View>
              <View style={styles.goalStatsBox}>
                <View style={styles.goalStatsHead}>
                  <Text style={styles.trainingFieldLabel}>Marcatori reali</Text>
                  <Text style={styles.goalTotal}>{totalTeamGoals} goluri FC Autentic</Text>
                </View>
                {matchAnalysisPlayers.map((player) => {
                  const goals = Number(selectedMatch.scorers?.[player.id] || 0);
                  const individual = selectedMatch.playerStats?.[player.id] || {};
                  return (
                    <Pressable style={styles.matchPlayerCompactRow} key={`scorer-${player.id}`} onPress={() => setActiveStatsPlayerId(player.id)}>
                      <View style={styles.smallAvatar}><Text style={styles.smallAvatarText}>{player.no}</Text></View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.attendanceName}>{player.name}</Text>
                        <Text style={styles.attendanceRole}>
                          {goals} goluri • {individual.minutes || 0} min • {individual.assists || 0} assist
                        </Text>
                      </View>
                      <Ionicons name="create-outline" size={20} color={C.blue} />
                    </Pressable>
                  );
                })}
                {!matchAnalysisPlayers.length && (
                  <View style={styles.emptyState}>
                    <Ionicons name="people-outline" size={24} color={C.muted} />
                    <Text style={styles.emptyText}>Alege mai întâi jucătorii convocați la acest meci. Aici vor apărea doar ei.</Text>
                  </View>
                )}
              </View>
              <TrainingField label="Assist-uri / cartonașe / alte statistici" value={selectedMatch.stats || ""} onChange={(stats) => updateSelectedMatch({ stats })} placeholder="Ex: Andrei assist, Denis galben..." multiline />
              <TrainingField label="Observații după meci" value={selectedMatch.postNotes || ""} onChange={(postNotes) => updateSelectedMatch({ postNotes })} placeholder="Concluziile antrenorului..." multiline />
            </View>
          )}

          {canEditMatches && activeStatsPlayer && (
            <View style={styles.playerStatsWindow}>
              <View style={styles.matchAnalysisHead}>
                <View>
                  <Text style={styles.controlKicker}>FIȘĂ JUCĂTOR MECI</Text>
                  <Text style={styles.adminDetailTitle}>{activeStatsPlayer.name}</Text>
                </View>
                <Pressable style={styles.closeMiniButton} onPress={() => setActiveStatsPlayerId(null)}>
                  <Ionicons name="close" size={20} color={C.white} />
                </Pressable>
              </View>
              {(() => {
                const goals = Number(selectedMatch.scorers?.[activeStatsPlayer.id] || 0);
                const individual = selectedMatch.playerStats?.[activeStatsPlayer.id] || {};
                const noteKey = `${selectedMatch.id}-${activeStatsPlayer.id}`;
                return (
                  <>
                    <View style={styles.goalScorerRow}>
                      <View style={styles.smallAvatar}><Text style={styles.smallAvatarText}>{activeStatsPlayer.no}</Text></View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.attendanceName}>{activeStatsPlayer.name}</Text>
                        <Text style={styles.attendanceRole}>{activeStatsPlayer.role} • {activeStatsPlayer.group}</Text>
                      </View>
                      <Pressable style={styles.goalButton} onPress={() => updateGoalScorer(activeStatsPlayer.id, -1)}>
                        <Ionicons name="remove" size={16} color={C.white} />
                      </Pressable>
                      <Text style={styles.goalCount}>{goals}</Text>
                      <Pressable style={[styles.goalButton, { backgroundColor: C.green }]} onPress={() => updateGoalScorer(activeStatsPlayer.id, 1)}>
                        <Ionicons name="add" size={16} color={C.white} />
                      </Pressable>
                    </View>
                    <View style={styles.matchStatGrid}>
                      {[
                        ["minutes", "Minute", individual.minutes || 0],
                        ["assists", "Assist", individual.assists || 0],
                        ["yellow", "Galbene", individual.yellow || 0],
                        ["red", "Roșii", individual.red || 0],
                      ].map(([field, label, value]) => (
                        <View style={styles.matchStatBox} key={field}>
                          <Text style={styles.profileDetailLabel}>{label}</Text>
                          <View style={styles.matchStatControls}>
                            <Pressable style={styles.miniRoundButton} onPress={() => updateMatchPlayerStat(activeStatsPlayer.id, field, field === "minutes" ? -5 : -1)}><Text style={styles.miniRoundText}>-</Text></Pressable>
                            <Text style={styles.matchStatValue}>{value}</Text>
                            <Pressable style={styles.miniRoundButton} onPress={() => updateMatchPlayerStat(activeStatsPlayer.id, field, field === "minutes" ? 5 : 1)}><Text style={styles.miniRoundText}>+</Text></Pressable>
                          </View>
                        </View>
                      ))}
                    </View>
                    <TrainingField label="Observație individuală după meci" value={matchPlayerNotes[noteKey] || ""} onChange={(text) => setMatchPlayerNotes((current) => ({ ...current, [noteKey]: text }))} placeholder="Ex: 60 minute bune, assist, poziționare..." multiline />
                    <View style={styles.formActions}>
                      <Pressable style={[styles.formActionButton, styles.formCancelButton]} onPress={() => setActiveStatsPlayerId(null)}>
                        <Text style={styles.formCancelText}>Închide</Text>
                      </Pressable>
                      <Pressable style={[styles.formActionButton, styles.formSaveButton]} onPress={() => saveMatchPlayerNote(selectedMatch, activeStatsPlayer)}>
                        <Text style={styles.formSaveText}>Salvează nota</Text>
                      </Pressable>
                    </View>
                  </>
                );
              })()}
            </View>
          )}

          {canEditMatches && (
            <>
              <SectionTitle title="Convocări inteligente" action="Recomandat" />
              <View style={styles.profilePanel}>
                {smartCallUps.map(({ player, score }) => (
                  <Pressable style={styles.historyRow} key={`smart-${player.id}`} onPress={() => setCallUpStatus(player.id, "convocat")}>
                    <View>
                      <Text style={styles.historyTitle}>{player.name}</Text>
                      <Text style={styles.historyMeta}>{player.role} • {player.status} • scor formă {score}</Text>
                    </View>
                    <Text style={[styles.historyStatus, { color: C.green }]}>Convoacă</Text>
                  </Pressable>
                ))}
              </View>
            </>
          )}

          <SectionTitle title="Primul 11 / formație" action={matchAnalysisPlayers.length ? `${Math.min(matchAnalysisPlayers.length, 11)} jucători` : "Alege convocări"} />
          <View style={styles.pitchCard}>
            {["Atac", "Mijloc", "Apărare", "Portar"].map((line, lineIndex) => {
              const linePlayers = matchAnalysisPlayers.slice(lineIndex * 3, lineIndex === 3 ? lineIndex * 3 + 2 : lineIndex * 3 + 3);
              return (
                <View style={styles.pitchLine} key={line}>
                  <Text style={styles.pitchLineLabel}>{line}</Text>
                  <View style={styles.pitchPlayers}>
                    {linePlayers.length ? linePlayers.map((player) => (
                      <View style={styles.pitchPlayer} key={`pitch-${player.id}`}>
                        <Text style={styles.pitchPlayerNo}>{player.no}</Text>
                        <Text style={styles.pitchPlayerName}>{player.name.split(" ")[0]}</Text>
                      </View>
                    )) : <Text style={styles.emptyText}>—</Text>}
                  </View>
                </View>
              );
            })}
          </View>

          <SectionTitle title="Convocari" action={canEditMatches ? "Editabil" : "Doar vizualizare"} />
          {visibleCallUpPlayers.map((player) => {
            const currentStatus = callUps[player.id] || "neconvocat";
            const currentOption = callUpOptions.find(([value]) => value === currentStatus);
            return (
              <View style={styles.callUpCard} key={player.id}>
                <View style={styles.attendancePlayer}>
                  <View style={styles.smallAvatar}><Text style={styles.smallAvatarText}>{player.no}</Text></View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.attendanceName}>{player.name}</Text>
                    <Text style={styles.attendanceRole}>{player.role} • {player.group}</Text>
                  </View>
                  <Text style={[styles.callUpCurrent, { color: currentOption?.[3] || C.muted }]}>{currentOption?.[2] || "Neconvocat"}</Text>
                </View>
                {canEditMatches ? (
                  <View style={styles.callUpButtons}>
                    {callUpOptions.map(([value, icon, label, color]) => {
                      const active = currentStatus === value;
                      return (
                        <Pressable key={value} style={[styles.callUpButton, active && { backgroundColor: color, borderColor: color }]} onPress={() => setCallUpStatus(player.id, value)}>
                          <Ionicons name={icon} size={16} color={active ? C.white : color} />
                          <Text style={[styles.callUpButtonText, active && { color: C.white }]}>{label}</Text>
                        </Pressable>
                      );
                    })}
                  </View>
                ) : (
                  <Text style={styles.readOnlyStatus}>Statusul convocarii este vizibil pentru rolul tau.</Text>
                )}
              </View>
            );
          })}
        </>
      )}
    </ScrollView>
  );
}

function Calendar({ trainings, matches = [], events, setEvents, currentUser, players, selectedClub }) {
  const [showEventForm, setShowEventForm] = useState(false);
  const [calendarGroup, setCalendarGroup] = useState("Toate");
  const [eventForm, setEventForm] = useState({
    type: "Meci amical",
    date: todayLabel(),
    time: "18:00",
    detail: "Stadionul Municipal",
  });
  const trainingEvents = filterTrainingsByUser(trainings, currentUser, players, selectedClub?.id).map(makeTrainingEvent);
  const matchEvents = filterMatchesByUser(matches, currentUser, players, selectedClub?.id).map((match) => ({
    id: `match-${match.id}`,
    type: `${match.type} • ${match.group}`,
    day: "MECI",
    date: match.date,
    time: match.time,
    detail: `FC Autentic vs ${match.opponent} • ${match.location}`,
    icon: "football-outline",
    color: C.red,
    group: match.group,
    rawDate: match.date,
  }));
  const calendarItems = [...trainingEvents, ...matchEvents, ...events]
    .filter((item) => calendarGroup === "Toate" || item.group === calendarGroup || !item.group)
    .sort((a, b) => compareClubSchedule({ date: a.rawDate || a.date, time: a.time }, { date: b.rawDate || b.date, time: b.time }));

  const saveEvent = () => {
    if (!eventForm.type.trim()) {
      showAppMessage("Lipseste evenimentul", "Completeaza numele evenimentului.");
      return;
    }
    setEvents((current) => [
      {
        id: Date.now(),
        day: "NOU",
        icon: "calendar-outline",
        color: C.red,
        clubId: selectedClub?.id || DEFAULT_CLUB_ID,
        ...eventForm,
      },
      ...current,
    ]);
    setEventForm({ type: "Meci amical", date: todayLabel(), time: "18:00", detail: "Stadionul Municipal" });
    setShowEventForm(false);
    showAppMessage("Salvat", "Evenimentul a fost adaugat in calendar.");
  };

  return (
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <TopBar title="Calendar" eyebrow="MECIURI ȘI ANTRENAMENTE" />
      <View style={styles.monthBar}>
        <Pressable><Ionicons name="chevron-back" size={21} color={C.white} /></Pressable>
        <Text style={styles.monthText}>{currentMonthLabel()}</Text>
        <Pressable><Ionicons name="chevron-forward" size={21} color={C.white} /></Pressable>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.groupFilters}>
        {["Toate", ...clubGroups].map((group) => (
          <Pressable key={group} style={[styles.filterChip, calendarGroup === group && styles.filterChipActive]} onPress={() => setCalendarGroup(group)}>
            <Text style={[styles.filterChipText, calendarGroup === group && styles.filterChipTextActive]}>{group}</Text>
          </Pressable>
        ))}
      </ScrollView>
      {calendarItems.map((item, index) => (
        <View style={styles.scheduleCard} key={`${item.type}-${item.date}-${index}`}>
          <View style={styles.scheduleDate}><Text style={styles.scheduleDay}>{item.day}</Text><Text style={styles.scheduleNumber}>{getDateParts(item.rawDate || item.date).day}</Text></View>
          <View style={[styles.scheduleIcon, { backgroundColor: `${item.color}20` }]}><Ionicons name={item.icon} size={23} color={item.color} /></View>
          <View style={styles.scheduleInfo}>
            <Text style={styles.scheduleType}>{item.type}</Text>
            <Text style={styles.scheduleDetail}>{item.time} • {item.detail}</Text>
          </View>
          <Ionicons name="ellipsis-vertical" size={18} color={C.muted} />
        </View>
      ))}
      {showEventForm && canManageClub(currentUser) && (
        <View style={styles.formCard}>
          <TrainingField label="Eveniment" value={eventForm.type} onChange={(type) => setEventForm({ ...eventForm, type })} />
          <View style={styles.formRow}>
            <View style={styles.formHalf}><TrainingField label="Data" value={eventForm.date} onChange={(date) => setEventForm({ ...eventForm, date })} placeholder={todayLabel()} /></View>
            <View style={styles.formHalf}><TrainingField label="Ora" value={eventForm.time} onChange={(time) => setEventForm({ ...eventForm, time })} placeholder="18:00" /></View>
          </View>
          <TrainingField label="Detalii" value={eventForm.detail} onChange={(detail) => setEventForm({ ...eventForm, detail })} placeholder="Locație sau adversar" />
          <View style={styles.formActions}>
            <Pressable style={[styles.formActionButton, styles.formCancelButton]} onPress={() => setShowEventForm(false)}>
              <Text style={styles.formCancelText}>Anulează</Text>
            </Pressable>
            <Pressable style={[styles.formActionButton, styles.formSaveButton]} onPress={saveEvent}>
              <Text style={styles.formSaveText}>Salvează</Text>
            </Pressable>
          </View>
        </View>
      )}
      {canManageClub(currentUser) && (
        <Pressable style={styles.primaryButton} onPress={() => setShowEventForm((value) => !value)}>
          <Ionicons name="add" size={20} color={C.white} />
          <Text style={styles.primaryButtonText}>{showEventForm ? "Închide formularul" : "Adaugă eveniment"}</Text>
        </Pressable>
      )}
    </ScrollView>
  );
}

function formatMoney(value, positive) {
  return `${positive ? "+" : "−"} ${Number(value || 0).toLocaleString("ro-RO")} MDL`;
}

const demoFinanceLabels = ["Cotizații jucători", "Sponsor local", "Închiriere teren", "Echipament sportiv"];

function getPlayerName(players, playerId) {
  return players.find((player) => String(player.id) === String(playerId))?.name || `Jucător ${playerId}`;
}

function makeAutomaticFinanceRows({ players, trainings, payments, monthlyPayments, transactions, clubSettings }) {
  const cleanManualRows = transactions.filter((row) => !demoFinanceLabels.includes(row.label));

  const trainingRows = Object.entries(payments).flatMap(([trainingId, playerPayments]) => {
    const training = trainings.find((item) => String(item.id) === String(trainingId));
    return Object.entries(playerPayments || {})
      .filter(([, payment]) => payment?.paid)
      .map(([playerId, payment]) => ({
        id: `training-${trainingId}-${playerId}`,
        label: `Antrenament ${training?.group || ""} - ${getPlayerName(players, playerId)}`,
        value: Number(payment.amount || clubSettings.trainingFee || 150),
        positive: true,
        date: training?.date || payment.paidAt || "Achitat",
        automatic: true,
      }));
  });

  const monthlyRows = Object.entries(monthlyPayments).flatMap(([key, playerPayments]) => {
    const group = clubGroups.find((item) => key.endsWith(`-${item}`)) || "";
    const month = group ? key.replace(`-${group}`, "") : key;
    return Object.entries(playerPayments || {})
      .filter(([, payment]) => payment?.paid)
      .map(([playerId, payment]) => ({
        id: `monthly-${key}-${playerId}`,
        label: `Cotizație ${group} - ${getPlayerName(players, playerId)}`,
        value: Number(payment.amount || clubSettings.monthlyFee || 600),
        positive: true,
        date: month || payment.paidAt || "Luna curentă",
        automatic: true,
      }));
  });

  return [...monthlyRows, ...trainingRows, ...cleanManualRows];
}

function Finances({ players, trainings, payments, setPayments, monthlyPayments, setMonthlyPayments, transactions, setTransactions, clubSettings, selectedClub }) {
  const [financeView, setFinanceView] = useState("Plăți antrenamente");
  const [selectedPaymentGroup, setSelectedPaymentGroup] = useState(trainings[0]?.group || clubGroups[0]);
  const [selectedTrainingId, setSelectedTrainingId] = useState(trainings[0]?.id);
  const [selectedMonth, setSelectedMonth] = useState(currentMonthLabel());
  const [transactionType, setTransactionType] = useState(null);
  const [editingTransactionId, setEditingTransactionId] = useState(null);
  const [transactionForm, setTransactionForm] = useState({
    label: "",
    value: "",
    date: todayLabel(),
  });
  const groupTrainings = trainings.filter((training) => training.group === selectedPaymentGroup);
  const selectedTraining = groupTrainings.find((training) => training.id === selectedTrainingId) || groupTrainings[0];
  const trainingPlayers = selectedTraining ? players.filter((player) => player.group === selectedTraining.group) : [];
  const trainingPayments = selectedTraining ? payments[selectedTraining.id] || {} : {};
  const paidPlayers = trainingPlayers.filter((player) => trainingPayments[player.id]?.paid);
  const collected = paidPlayers.reduce((sum, player) => sum + Number(trainingPayments[player.id]?.amount || 0), 0);
  const expected = trainingPlayers.reduce((sum, player) => sum + Number(trainingPayments[player.id]?.amount || 150), 0);
  const monthlyPlayers = players.filter((player) => player.group === selectedPaymentGroup);
  const monthKey = `${selectedMonth}-${selectedPaymentGroup}`;
  const groupMonthlyPayments = monthlyPayments[monthKey] || {};
  const monthlyPaidPlayers = monthlyPlayers.filter((player) => groupMonthlyPayments[player.id]?.paid);
  const monthlyPartialPlayers = monthlyPlayers.filter((player) => !groupMonthlyPayments[player.id]?.paid && Number(groupMonthlyPayments[player.id]?.amount || 0) > 0 && Number(groupMonthlyPayments[player.id]?.amount || 0) < Number(clubSettings.monthlyFee || 600));
  const monthlyDebtors = monthlyPlayers.filter((player) => !groupMonthlyPayments[player.id]?.paid && Number(groupMonthlyPayments[player.id]?.amount || 0) < Number(clubSettings.monthlyFee || 600));
  const monthlyCollected = monthlyPlayers.reduce((sum, player) => sum + (groupMonthlyPayments[player.id]?.paid ? Number(groupMonthlyPayments[player.id]?.amount || clubSettings.monthlyFee || 600) : Number(groupMonthlyPayments[player.id]?.amount || 0)), 0);
  const monthlyExpected = monthlyPlayers.reduce((sum, player) => sum + Number(groupMonthlyPayments[player.id]?.amount || clubSettings.monthlyFee || 600), 0);
  const budgetRows = makeAutomaticFinanceRows({ players, trainings, payments, monthlyPayments, transactions, clubSettings });
  const automaticIncomeTotal = budgetRows.filter((row) => row.positive && row.automatic).reduce((sum, row) => sum + Number(row.value || 0), 0);
  const manualIncomeTotal = budgetRows.filter((row) => row.positive && !row.automatic).reduce((sum, row) => sum + Number(row.value || 0), 0);
  const incomeTotal = budgetRows.filter((row) => row.positive).reduce((sum, row) => sum + Number(row.value || 0), 0);
  const expenseTotal = budgetRows.filter((row) => !row.positive).reduce((sum, row) => sum + Number(row.value || 0), 0);
  const balance = incomeTotal - expenseTotal;

  const openTransactionForm = (type) => {
    setEditingTransactionId(null);
    setTransactionType(type);
    setTransactionForm({
      label: type === "income" ? "Cotizație jucător" : "Cheltuială club",
      value: "",
      date: todayLabel(),
    });
  };

  const editExpense = (row) => {
    if (row.automatic || row.positive) return;
    setEditingTransactionId(row.id);
    setTransactionType("expense");
    setTransactionForm({
      label: row.label,
      value: String(row.value || ""),
      date: row.date || todayLabel(),
    });
  };

  const selectPaymentGroup = (group) => {
    const firstTraining = trainings.find((training) => training.group === group);
    setSelectedPaymentGroup(group);
    setSelectedTrainingId(firstTraining?.id);
  };

  const saveTransaction = () => {
    const value = Number(transactionForm.value || 0);
    if (!transactionForm.label.trim() || !value) {
      showAppMessage("Date incomplete", "Completeaza denumirea si suma tranzactiei.");
      return;
    }
    if (editingTransactionId) {
      setTransactions((current) => current.map((row) => (
        row.id === editingTransactionId
          ? { ...row, label: transactionForm.label.trim(), value, date: transactionForm.date.trim() || todayLabel() }
          : row
      )));
    } else {
      setTransactions((current) => [
        {
          id: Date.now(),
          label: transactionForm.label.trim(),
          value,
          positive: transactionType === "income",
          date: transactionForm.date.trim() || todayLabel(),
          clubId: selectedClub?.id || DEFAULT_CLUB_ID,
        },
        ...current,
      ]);
    }
    setTransactionType(null);
    setEditingTransactionId(null);
    setTransactionForm({ label: "", value: "", date: todayLabel() });
    showAppMessage("Salvat", editingTransactionId ? "Cheltuiala a fost actualizata." : "Tranzactia a fost adaugata in buget.");
  };

  const changeAmount = (playerId, value) => {
    const cleanValue = value.replace(/[^0-9]/g, "");
    setPayments((current) => ({
      ...current,
      [selectedTraining.id]: {
        ...(current[selectedTraining.id] || {}),
        [playerId]: {
          ...(current[selectedTraining.id]?.[playerId] || {}),
          amount: cleanValue,
        },
      },
    }));
  };

  const togglePaid = (playerId) => {
    setPayments((current) => {
      const currentPayment = current[selectedTraining.id]?.[playerId] || {};
      return {
        ...current,
        [selectedTraining.id]: {
          ...(current[selectedTraining.id] || {}),
          [playerId]: {
            amount: currentPayment.amount || "150",
            paid: !currentPayment.paid,
            paidAt: !currentPayment.paid ? nowLabel() : null,
          },
        },
      };
    });
  };

  const changeMonthlyAmount = (playerId, value) => {
    const cleanValue = value.replace(/[^0-9]/g, "");
    setMonthlyPayments((current) => ({
      ...current,
      [monthKey]: {
        ...(current[monthKey] || {}),
        [playerId]: {
          ...(current[monthKey]?.[playerId] || {}),
          amount: cleanValue,
        },
      },
    }));
  };

  const toggleMonthlyPaid = (playerId) => {
    setMonthlyPayments((current) => {
      const currentPayment = current[monthKey]?.[playerId] || {};
      return {
        ...current,
        [monthKey]: {
          ...(current[monthKey] || {}),
          [playerId]: {
            amount: currentPayment.amount || clubSettings.monthlyFee || "600",
            paid: !currentPayment.paid,
            paidAt: !currentPayment.paid ? nowLabel() : null,
          },
        },
      };
    });
  };

  return (
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <TopBar title="Finanțe" eyebrow="BUGETUL CLUBULUI" />
      <View style={styles.financeViewToggle}>
        {["Plăți antrenamente", "Cotizații lunare", "Buget general"].map((item) => (
          <Pressable key={item} style={[styles.financeViewButton, financeView === item && styles.financeViewActive]} onPress={() => setFinanceView(item)}>
            <Text style={[styles.financeViewText, financeView === item && styles.financeViewTextActive]}>{item}</Text>
          </Pressable>
        ))}
      </View>

      {financeView === "Buget general" ? (
        <>
          <View style={styles.balanceCard}>
            <Text style={styles.balanceLabel}>SOLD DISPONIBIL</Text>
            <Text style={styles.balanceValue}>{balance.toLocaleString("ro-RO")} <Text style={styles.balanceCurrency}>MDL</Text></Text>
            <View style={styles.financeStats}>
              <View><Text style={styles.financeMiniLabel}>VENITURI</Text><Text style={[styles.financeMiniValue, { color: C.green }]}>+{incomeTotal.toLocaleString("ro-RO")}</Text></View>
              <View style={styles.summaryDivider} />
              <View><Text style={styles.financeMiniLabel}>CHELTUIELI</Text><Text style={[styles.financeMiniValue, { color: C.red }]}>−{expenseTotal.toLocaleString("ro-RO")}</Text></View>
            </View>
          </View>
          <SectionTitle title="Tranzacții recente" action="Vezi toate" />
          {budgetRows.map((row) => (
            <View style={styles.transaction} key={row.id}>
              <View style={[styles.transactionIcon, { backgroundColor: row.positive ? `${C.green}20` : `${C.red}20` }]}>
                <Ionicons name={row.positive ? "arrow-down" : "arrow-up"} size={19} color={row.positive ? C.green : C.red} />
              </View>
              <View style={styles.transactionInfo}><Text style={styles.transactionName}>{row.label}</Text><Text style={styles.transactionDate}>{row.date}</Text></View>
              <View style={{ alignItems: "flex-end", gap: 6 }}>
                <Text style={[styles.transactionAmount, { color: row.positive ? C.green : C.white }]}>{formatMoney(row.value, row.positive)}</Text>
                {!row.automatic && !row.positive && (
                  <Pressable onPress={() => editExpense(row)} style={{ paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999, backgroundColor: `${C.blue}22`, borderWidth: 1, borderColor: `${C.blue}66` }}>
                    <Text style={{ color: C.blue, fontSize: 9, fontWeight: "900" }}>Redacteaza</Text>
                  </Pressable>
                )}
              </View>
            </View>
          ))}
          {transactionType && (
            <View style={styles.formCard}>
              <TrainingField label={transactionType === "income" ? "Denumire venit" : "Denumire cheltuială"} value={transactionForm.label} onChange={(label) => setTransactionForm({ ...transactionForm, label })} />
              <View style={styles.formRow}>
                <View style={styles.formHalf}>
                  <TrainingField label="Suma MDL" value={transactionForm.value} onChange={(value) => setTransactionForm({ ...transactionForm, value: value.replace(/[^0-9]/g, "") })} placeholder="1500" />
                </View>
                <View style={styles.formHalf}>
                  <TrainingField label="Data" value={transactionForm.date} onChange={(date) => setTransactionForm({ ...transactionForm, date })} placeholder={todayLabel()} />
                </View>
              </View>
              <View style={styles.formActions}>
                <Pressable style={[styles.formActionButton, styles.formCancelButton]} onPress={() => { setTransactionType(null); setEditingTransactionId(null); }}>
                  <Text style={styles.formCancelText}>Anulează</Text>
                </Pressable>
                <Pressable style={[styles.formActionButton, styles.formSaveButton]} onPress={saveTransaction}>
                  <Text style={styles.formSaveText}>Salvează</Text>
                </Pressable>
              </View>
            </View>
          )}
          <View style={styles.financeButtons}>
            <Pressable style={[styles.smallButton, { backgroundColor: C.green }]} onPress={() => openTransactionForm("income")}><Ionicons name="add" size={19} color={C.white} /><Text style={styles.smallButtonText}>Venit</Text></Pressable>
            <Pressable style={[styles.smallButton, { backgroundColor: C.red }]} onPress={() => openTransactionForm("expense")}><Ionicons name="remove" size={19} color={C.white} /><Text style={styles.smallButtonText}>Cheltuială</Text></Pressable>
          </View>
        </>
      ) : financeView === "Cotizații lunare" ? (
        <>
          <Text style={styles.paymentSectionLabel}>LUNA</Text>
          <View style={styles.paymentTrainingList}>
            {getMonthOptions(6).map((month) => (
              <Pressable key={month} style={[styles.paymentTrainingChip, selectedMonth === month && styles.paymentTrainingChipActive]} onPress={() => setSelectedMonth(month)}>
                <Text style={[styles.paymentTrainingGroup, selectedMonth === month && { color: C.white }]}>{month}</Text>
                <Text style={[styles.paymentTrainingDate, selectedMonth === month && { color: C.white }]}>cotizație</Text>
              </Pressable>
            ))}
          </View>
          <Text style={styles.paymentSectionLabel}>GRUPA</Text>
          <View style={styles.paymentTrainingList}>
            {clubGroups.map((group) => (
              <Pressable key={group} style={[styles.paymentTrainingChip, selectedPaymentGroup === group && styles.paymentTrainingChipActive]} onPress={() => setSelectedPaymentGroup(group)}>
                <Text style={[styles.paymentTrainingGroup, selectedPaymentGroup === group && { color: C.white }]}>{group}</Text>
                <Text style={[styles.paymentTrainingDate, selectedPaymentGroup === group && { color: C.white }]}>{players.filter((player) => player.group === group).length} juc.</Text>
              </Pressable>
            ))}
          </View>
          <View style={styles.paymentHero}>
            <View style={styles.paymentHeroTop}>
              <View>
                <Text style={styles.paymentHeroTag}>{selectedPaymentGroup} • {selectedMonth}</Text>
                <Text style={styles.paymentHeroTitle}>Cotizații lunare</Text>
                <Text style={styles.paymentHeroMeta}>Standard: {clubSettings.monthlyFee} {clubSettings.currency}</Text>
              </View>
              <View style={styles.paymentCountCircle}>
                <Text style={styles.paymentCountValue}>{monthlyPaidPlayers.length}/{monthlyPlayers.length}</Text>
                <Text style={styles.paymentCountLabel}>achitat</Text>
              </View>
            </View>
            <View style={styles.paymentProgressTrack}>
              <View style={[styles.paymentProgressFill, { width: `${monthlyPlayers.length ? (monthlyPaidPlayers.length / monthlyPlayers.length) * 100 : 0}%` }]} />
            </View>
            <View style={styles.paymentTotals}>
              <View><Text style={styles.paymentTotalLabel}>ÎNCASAT</Text><Text style={[styles.paymentTotalValue, { color: C.green }]}>{monthlyCollected} {clubSettings.currency}</Text></View>
            <View><Text style={styles.paymentTotalLabel}>RESTANT</Text><Text style={[styles.paymentTotalValue, { color: C.amber }]}>{Math.max(monthlyExpected - monthlyCollected, 0)} {clubSettings.currency}</Text></View>
            </View>
          </View>
          <View style={styles.profileDetailsGrid}>
            <View style={styles.profileDetailBox}><Text style={styles.profileDetailLabel}>Achitat</Text><Text style={[styles.profileDetailValue, { color: C.green }]}>{monthlyPaidPlayers.length}</Text></View>
            <View style={styles.profileDetailBox}><Text style={styles.profileDetailLabel}>Parțial</Text><Text style={[styles.profileDetailValue, { color: C.blue }]}>{monthlyPartialPlayers.length}</Text></View>
            <View style={styles.profileDetailBox}><Text style={styles.profileDetailLabel}>Restanțieri</Text><Text style={[styles.profileDetailValue, { color: C.amber }]}>{monthlyDebtors.length}</Text></View>
            <View style={styles.profileDetailBox}><Text style={styles.profileDetailLabel}>Datorie totală</Text><Text style={[styles.profileDetailValue, { color: C.red }]}>{Math.max(monthlyExpected - monthlyCollected, 0)} {clubSettings.currency}</Text></View>
          </View>
          <SectionTitle title="Jucători și cotizații" action="Salvare automată" />
          {monthlyPlayers.map((player) => {
            const payment = groupMonthlyPayments[player.id] || {};
            const paidAmount = payment.paid ? Number(payment.amount || clubSettings.monthlyFee || 600) : Number(payment.amount || 0);
            const standardFee = Number(clubSettings.monthlyFee || 600);
            const paymentLabel = payment.paid ? "Achitat" : paidAmount > 0 && paidAmount < standardFee ? "Parțial achitat" : "Restanță";
            return (
              <View style={[styles.paymentPlayerCard, payment.paid && styles.paymentPlayerPaid]} key={player.id}>
                <View style={styles.paymentPlayerTop}>
                  <View style={styles.paymentAvatar}><Text style={styles.paymentAvatarText}>{player.no}</Text></View>
                  <View style={styles.paymentPlayerInfo}>
                    <Text style={styles.paymentPlayerName}>{player.name}</Text>
                    <Text style={[styles.paymentStatus, { color: payment.paid ? C.green : paidAmount > 0 ? C.blue : C.amber }]}>{paymentLabel}</Text>
                  </View>
                  <View style={styles.amountWrap}>
                    <TextInput style={styles.amountInput} keyboardType="numeric" value={String(payment.amount || clubSettings.monthlyFee || "600")} onChangeText={(value) => changeMonthlyAmount(player.id, value)} />
                    <Text style={styles.amountCurrency}>{clubSettings.currency}</Text>
                  </View>
                </View>
                <Pressable style={[styles.markPaidButton, payment.paid && styles.markPaidButtonActive]} onPress={() => toggleMonthlyPaid(player.id)}>
                  <Ionicons name={payment.paid ? "checkmark-circle" : "cash-outline"} size={19} color={payment.paid ? C.white : C.green} />
                  <Text style={[styles.markPaidText, payment.paid && { color: C.white }]}>{payment.paid ? "Achitat" : "Marchează achitat"}</Text>
                </Pressable>
              </View>
            );
          })}
        </>
      ) : (
        <>
          <Text style={styles.paymentSectionLabel}>ALEGE CATEGORIA DE VÂRSTĂ</Text>
          <View style={styles.paymentTrainingList}>
            {clubGroups.map((group) => {
              const trainingCount = trainings.filter((training) => training.group === group).length;
              const isActive = selectedPaymentGroup === group;
              return (
                <Pressable
                  key={group}
                  style={[styles.paymentTrainingChip, isActive && styles.paymentTrainingChipActive]}
                  onPress={() => selectPaymentGroup(group)}
                >
                  <Text style={[styles.paymentTrainingGroup, isActive && { color: C.white }]}>{group}</Text>
                  <Text style={[styles.paymentTrainingDate, isActive && { color: C.white }]}>
                    {trainingCount ? `${trainingCount} antren.` : "Fara antren."}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <Text style={styles.paymentSectionLabel}>ALEGE ANTRENAMENTUL</Text>
          <View style={styles.paymentTrainingList}>
            {groupTrainings.map((training) => (
              <Pressable
                key={training.id}
                style={[styles.paymentTrainingChip, selectedTraining?.id === training.id && styles.paymentTrainingChipActive]}
                onPress={() => setSelectedTrainingId(training.id)}
              >
                <Text style={[styles.paymentTrainingGroup, selectedTraining?.id === training.id && { color: C.white }]}>{training.date}</Text>
                <Text style={[styles.paymentTrainingDate, selectedTraining?.id === training.id && { color: C.white }]}>{training.time} • {training.location}</Text>
              </Pressable>
            ))}
            {!groupTrainings.length && (
              <Text style={styles.emptyText}>Nu exista antrenamente pentru aceasta categorie.</Text>
            )}
          </View>

          {selectedTraining && (
            <>
              <View style={styles.paymentHero}>
                <View style={styles.paymentHeroTop}>
                  <View>
                    <Text style={styles.paymentHeroTag}>{selectedTraining.group} • {selectedTraining.time}</Text>
                    <Text style={styles.paymentHeroTitle}>{selectedTraining.theme}</Text>
                    <Text style={styles.paymentHeroMeta}>{selectedTraining.location} • {selectedTraining.coach}</Text>
                  </View>
                  <View style={styles.paymentCountCircle}>
                    <Text style={styles.paymentCountValue}>{paidPlayers.length}/{trainingPlayers.length}</Text>
                    <Text style={styles.paymentCountLabel}>achitat</Text>
                  </View>
                </View>
                <View style={styles.paymentProgressTrack}>
                  <View style={[styles.paymentProgressFill, { width: `${trainingPlayers.length ? (paidPlayers.length / trainingPlayers.length) * 100 : 0}%` }]} />
                </View>
                <View style={styles.paymentTotals}>
                  <View><Text style={styles.paymentTotalLabel}>ÎNCASAT</Text><Text style={[styles.paymentTotalValue, { color: C.green }]}>{collected} MDL</Text></View>
                  <View><Text style={styles.paymentTotalLabel}>DE ÎNCASAT</Text><Text style={[styles.paymentTotalValue, { color: C.amber }]}>{Math.max(expected - collected, 0)} MDL</Text></View>
                </View>
              </View>

              <SectionTitle title="Jucători și plăți" action="Salvare automată" />
              {trainingPlayers.map((player) => {
                const payment = trainingPayments[player.id] || {};
                return (
                  <View style={[styles.paymentPlayerCard, payment.paid && styles.paymentPlayerPaid]} key={player.id}>
                    <View style={styles.paymentPlayerTop}>
                      <View style={styles.paymentAvatar}><Text style={styles.paymentAvatarText}>{player.no}</Text></View>
                      <View style={styles.paymentPlayerInfo}>
                        <Text style={styles.paymentPlayerName}>{player.name}</Text>
                        <Text style={[styles.paymentStatus, { color: payment.paid ? C.green : C.amber }]}>{payment.paid ? payment.paidAt || "Achitat" : "Neachitat"}</Text>
                      </View>
                      <View style={styles.amountWrap}>
                        <TextInput
                          accessibilityLabel={`Suma ${player.name}`}
                          style={styles.amountInput}
                          keyboardType="numeric"
                          value={String(payment.amount || "150")}
                          onChangeText={(value) => changeAmount(player.id, value)}
                        />
                        <Text style={styles.amountCurrency}>MDL</Text>
                      </View>
                    </View>
                    <Pressable
                      accessibilityLabel={`${payment.paid ? "Anulează plata" : "Marchează achitat"} ${player.name}`}
                      style={[styles.markPaidButton, payment.paid && styles.markPaidButtonActive]}
                      onPress={() => togglePaid(player.id)}
                    >
                      <Ionicons name={payment.paid ? "checkmark-circle" : "cash-outline"} size={19} color={payment.paid ? C.white : C.green} />
                      <Text style={[styles.markPaidText, payment.paid && { color: C.white }]}>{payment.paid ? "Achitat" : "Marchează achitat"}</Text>
                    </Pressable>
                  </View>
                );
              })}
            </>
          )}
        </>
      )}
    </ScrollView>
  );
}

function buildNotifications(currentUser, players, trainings, attendance, matches = [], monthlyPayments = {}, documents = [], clubSettings = initialClubSettings) {
  const [invitationForm, setInvitationForm] = useState({ email: "", role: "coach" });
  const personalPlayer = players.find((player) => player.id === currentUser?.playerId || player.id === currentUser?.childPlayerId);
  const personalTrainings = filterTrainingsByUser(trainings, currentUser, players).slice().sort(compareClubSchedule);
  const personalMatches = filterMatchesByUser(matches, currentUser, players).slice().sort(compareClubSchedule);
  const personalStatuses = personalPlayer
    ? personalTrainings.map((training) => attendance[training.id]?.[personalPlayer.id]).filter(Boolean)
    : [];
  const personalPresent = personalStatuses.filter((status) => status === "present").length;
  const personalLate = personalStatuses.filter((status) => status === "late").length;
  const personalAbsent = personalStatuses.filter((status) => status === "absent").length;
  const personalPercent = personalStatuses.length ? Math.round(((personalPresent + personalLate * 0.5) / personalStatuses.length) * 100) : 0;
  const monthKey = personalPlayer ? `${currentMonthLabel()}-${personalPlayer.group}` : null;
  const personalPayment = personalPlayer && monthKey ? monthlyPayments[monthKey]?.[personalPlayer.id] : null;
  const standardFee = Number(clubSettings.monthlyFee || 600);
  const currentMonthDebt = personalPlayer ? Math.max(Number(personalPayment?.paid ? 0 : (standardFee - Number(personalPayment?.amount || 0))), 0) : 0;
  const expiringDoc = personalPlayer ? documents.find((doc) => doc.owner === personalPlayer.name && doc.status !== "Valid") : documents.find((doc) => doc.status !== "Valid");
  return [
    {
      id: "next-training",
      icon: "barbell-outline",
      color: C.blue,
      title: "Următorul antrenament",
      text: personalTrainings[0]
        ? `${personalTrainings[0].group} • ${personalTrainings[0].date}, ${personalTrainings[0].time}`
        : "Nu există antrenamente planificate pentru rolul tău.",
    },
    {
      id: "attendance",
      icon: "checkmark-done-outline",
      color: C.green,
      title: "Prezență actualizată",
      text: personalPlayer ? `${personalPlayer.name}: ${personalPercent}% prezență calculată.` : "Profilul tău este pregătit.",
    },
    {
      id: "match",
      icon: "football-outline",
      color: C.red,
      title: "Următorul meci",
      text: personalMatches[0] ? `${personalMatches[0].group} • vs ${personalMatches[0].opponent}, ${personalMatches[0].date} ${personalMatches[0].time}` : "Nu există meciuri planificate pentru rolul tău.",
    },
    {
      id: "dues",
      icon: "wallet-outline",
      color: currentMonthDebt ? C.amber : C.green,
      title: "Cotizație lunară",
      text: personalPlayer ? (currentMonthDebt ? `${personalPlayer.name} are restanță estimată pentru ${currentMonthLabel()}.` : `${personalPlayer.name}: cotizația lunară este în regulă.`) : "Cotizațiile sunt urmărite automat pe fiecare grupă.",
    },
    {
      id: "medical",
      icon: "medkit-outline",
      color: expiringDoc ? C.amber : C.green,
      title: "Certificat medical",
      text: expiringDoc ? `${expiringDoc.owner}: ${expiringDoc.title} • ${expiringDoc.status}, expiră ${expiringDoc.expires}.` : "Fișele medicale sunt în regulă.",
    },
    {
      id: "absence-risk",
      icon: "alert-circle-outline",
      color: personalAbsent >= 2 ? C.red : C.blue,
      title: "Monitorizare prezență",
      text: personalPlayer ? `${personalPlayer.name}: ${personalAbsent} absențe, ${personalLate} întârzieri.` : "Prezența lotului este monitorizată automat.",
    },
  ];
}

function NotificationsPage({ currentUser, players, trainings, attendance, matches, monthlyPayments, documents, clubSettings }) {
  const [readNotifications, setReadNotifications] = useState({});
  const notifications = buildNotifications(currentUser, players, trainings, attendance, matches, monthlyPayments, documents, clubSettings);

  const activateMobileAlerts = async () => {
    try {
      const first = notifications[0];
      const result = await scheduleLocalReminder(first?.title || "FC Autentic", first?.text || "Ai o actualizare nouă în aplicație.", 5);
      showAppMessage(
        result.scheduled ? "Alerte activate" : "Preview web",
        result.scheduled ? "Am programat o alertă de test. Pe telefon vom folosi notificări native." : "În browser notificările mobile sunt simulate; pe iOS/Android vor fi native."
      );
    } catch (error) {
      showAppMessage("Notificări inactive", error.message || "Nu am putut activa notificările mobile.");
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <TopBar title="Notificări" eyebrow={`${roleLabels[currentUser?.role] || "FC AUTENTIC"} • ALERTĂRI`} />
      <View style={styles.notificationsPanel}>
        <View style={styles.notificationsHeader}>
          <Text style={styles.adminDetailTitle}>Actualizări recente</Text>
          <Text style={styles.notificationCounter}>{notifications.filter((item) => !readNotifications[item.id]).length} noi</Text>
        </View>
        {notifications.map((item) => {
          const read = readNotifications[item.id];
          return (
            <Pressable
              key={item.id}
              style={[styles.notificationRow, read && styles.notificationRead]}
              onPress={() => setReadNotifications((current) => ({ ...current, [item.id]: !current[item.id] }))}
            >
              <View style={[styles.notificationIcon, { backgroundColor: `${item.color}20` }]}>
                <Ionicons name={item.icon} size={20} color={item.color} />
              </View>
              <View style={styles.notificationInfo}>
                <Text style={styles.notificationTitle}>{item.title}</Text>
                <Text style={styles.notificationText}>{item.text}</Text>
              </View>
              <Ionicons name={read ? "checkmark-circle" : "ellipse"} size={18} color={read ? C.green : C.amber} />
            </Pressable>
          );
        })}
        <Pressable style={styles.primaryButton} onPress={activateMobileAlerts}>
          <Ionicons name={Platform.OS === "web" ? "phone-portrait-outline" : "notifications-outline"} size={19} color={C.white} />
          <Text style={styles.primaryButtonText}>Activează alerte mobile</Text>
        </Pressable>
        <Text style={styles.notificationHint}>Apasă pe o notificare pentru a o marca citită/necitită.</Text>
      </View>
    </ScrollView>
  );
}

function More({ currentUser, onLogout, setTab, players, setPlayers, trainings, matches, attendance, payments, monthlyPayments, clubSettings, setClubSettings, documents, setDocuments, announcements, setAnnouncements, playerObservations = {}, equipment = [], setEquipment = () => {}, evaluations = {}, setEvaluations = () => {}, developmentPlans = {}, setDevelopmentPlans = () => {}, discipline = [], setDiscipline = () => {}, chatMessages = [], setChatMessages = () => {}, mediaGallery = [], setMediaGallery = () => {}, scouting = [], setScouting = () => {}, selectedClub, clubs = [], setSelectedClubId = () => {}, subscriptions = [], setSubscriptions = () => {}, invitations = [], setInvitations = () => {}, memberships = [], setMemberships = () => {} }) {
  const [selectedMenu, setSelectedMenu] = useState(null);
  const [exportedReport, setExportedReport] = useState("");
  const [medicalForms, setMedicalForms] = useState({});
  const [equipmentForm, setEquipmentForm] = useState({ name: "Echipament nou", category: "Materiale", total: "", assigned: "Club", missing: "0" });
  const [selectedPlayerForTools, setSelectedPlayerForTools] = useState(players[0]?.id);
  const [evaluationForm, setEvaluationForm] = useState({ month: currentMonthLabel(), technique: "8", speed: "8", discipline: "8", attitude: "8", tactics: "8", physical: "8" });
  const [planForm, setPlanForm] = useState({ focus: "", objective: "", exercises: "", status: "În lucru" });
  const [disciplineForm, setDisciplineForm] = useState({ type: "Întârziere", note: "" });
  const [chatForm, setChatForm] = useState({ audience: "Părinți", text: "" });
  const [mediaForm, setMediaForm] = useState({ type: "Meci", title: "", url: "", date: todayLabel() });
  const [scoutForm, setScoutForm] = useState({ name: "", age: "", role: "", notes: "", decision: "Revăzut" });
  const personalPlayer = players.find((player) => player.id === currentUser?.playerId || player.id === currentUser?.childPlayerId);
  const personalTrainings = filterTrainingsByUser(trainings, currentUser, players, selectedClub?.id);
  const personalStatuses = personalPlayer
    ? personalTrainings.map((training) => attendance[training.id]?.[personalPlayer.id]).filter(Boolean)
    : [];
  const personalPresent = personalStatuses.filter((status) => status === "present").length;
  const personalLate = personalStatuses.filter((status) => status === "late").length;
  const personalPercent = personalStatuses.length ? Math.round(((personalPresent + personalLate * 0.5) / personalStatuses.length) * 100) : 0;
  const navigationShortcuts = [
    ["calendar-outline", "Calendar", "Program complet", () => setTab?.("Calendar")],
    ...(canManageFinance(currentUser) ? [["wallet-outline", "Finanțe", "Buget și plăți", () => setTab?.("Finanțe")]] : []),
  ];
  const fullMenu = [
    ["person-circle-outline", "Profil personal"],
    ["star-outline", "Evaluări lunare"],
    ["trending-up-outline", "Plan dezvoltare"],
    ["warning-outline", "Disciplină"],
    ["chatbox-ellipses-outline", "Chat intern"],
    ["images-outline", "Galerie foto/video"],
    ["eye-outline", "Scouting probe"],
    ["podium-outline", "Ranking intern"],
    ["document-text-outline", "Documente și contracte"],
    ["medkit-outline", "Fișe medicale"],
    ["shirt-outline", "Inventar echipament"],
    ["analytics-outline", "Status aplicație"],
    ["chatbubbles-outline", "Anunțuri club"],
    ["download-outline", "Export rapoarte"],
    ["business-outline", "Cluburi mele"],
    ["mail-outline", "Invitatii club"],
    ["card-outline", "Abonament SaaS"],
    ["people-circle-outline", "Staff și permisiuni"],
    ["settings-outline", "Setări club"],
  ];
  const [announcementForm, setAnnouncementForm] = useState({ audience: "Toți", title: "", text: "" });
  const addAnnouncement = () => {
    if (!announcementForm.title.trim()) {
      showAppMessage("Lipseste titlul", "Completeaza titlul anuntului inainte de trimitere.");
      return;
    }
    setAnnouncements((current) => [{ id: Date.now(), ...announcementForm, date: nowLabel() }, ...current]);
    showAppMessage("Trimis", "Anuntul a fost publicat in club.");
    setAnnouncementForm({ audience: "Toți", title: "", text: "" });
  };
  const addDocument = () => {
    setDocuments((current) => [
      { id: Date.now(), title: "Document nou", owner: currentUser?.name || "Club", type: "General", status: "Lipsă fișier", expires: "De completat", clubId: selectedClub?.id || DEFAULT_CLUB_ID },
      ...current,
    ]);
    showAppMessage("Adaugat", "Documentul nou a fost creat in lista.");
  };
  const updatePlayerMedical = (playerId, patch) => {
    setPlayers((current) => current.map((player) => (player.id === playerId ? { ...player, ...patch } : player)));
  };
  const saveMedical = (player) => {
    const form = medicalForms[player.id] || {};
    updatePlayerMedical(player.id, {
      allergies: form.allergies ?? player.allergies ?? "Nu",
      emergencyContact: form.emergencyContact ?? player.emergencyContact ?? player.parentPhone ?? "",
      medicalStatus: form.medicalStatus ?? player.medicalStatus ?? "Apt",
      medicalExpires: form.medicalExpires ?? player.medicalExpires ?? "De completat",
    });
    showAppMessage("Fișă medicală salvată", `Datele medicale pentru ${player.name} au fost actualizate.`);
  };
  const addEquipment = () => {
    if (!equipmentForm.name.trim()) {
      showAppMessage("Denumire lipsă", "Completează denumirea echipamentului.");
      return;
    }
    setEquipment((current) => [{ id: Date.now(), ...equipmentForm, total: Number(equipmentForm.total || 0), missing: Number(equipmentForm.missing || 0), clubId: selectedClub?.id || DEFAULT_CLUB_ID }, ...current]);
    setEquipmentForm({ name: "Echipament nou", category: "Materiale", total: "", assigned: "Club", missing: "0" });
    showAppMessage("Inventar actualizat", "Echipamentul a fost adăugat.");
  };
  const updateEquipment = (id, patch) => {
    setEquipment((current) => current.map((item) => (item.id === id ? { ...item, ...patch } : item)));
  };
  const saveEvaluation = () => {
    setEvaluations((current) => ({ ...current, [selectedPlayerForTools]: { ...evaluationForm, technique: Number(evaluationForm.technique), speed: Number(evaluationForm.speed), discipline: Number(evaluationForm.discipline), attitude: Number(evaluationForm.attitude), tactics: Number(evaluationForm.tactics), physical: Number(evaluationForm.physical) } }));
    showAppMessage("Evaluare salvată", "Evaluarea lunară a fost actualizată.");
  };
  const saveDevelopmentPlan = () => {
    setDevelopmentPlans((current) => ({ ...current, [selectedPlayerForTools]: planForm }));
    showAppMessage("Plan salvat", "Planul individual de dezvoltare a fost actualizat.");
  };
  const addDiscipline = () => {
    setDiscipline((current) => [{ id: Date.now(), playerId: selectedPlayerForTools, type: disciplineForm.type, note: disciplineForm.note || "Fără detalii", date: nowLabel(), clubId: selectedClub?.id || DEFAULT_CLUB_ID }, ...current]);
    setDisciplineForm({ type: "Întârziere", note: "" });
    showAppMessage("Disciplină actualizată", "Incidentul a fost adăugat.");
  };
  const sendChatMessage = () => {
    if (!chatForm.text.trim()) return showAppMessage("Mesaj gol", "Scrie mesajul înainte de trimitere.");
    setChatMessages((current) => [{ id: Date.now(), audience: chatForm.audience, author: currentUser?.name || "Club", text: chatForm.text.trim(), date: nowLabel(), clubId: selectedClub?.id || DEFAULT_CLUB_ID }, ...current]);
    setChatForm({ audience: chatForm.audience, text: "" });
    showAppMessage("Trimis", "Mesajul a fost adăugat în chat.");
  };
  const addMedia = () => {
    if (!mediaForm.title.trim()) return showAppMessage("Titlu lipsă", "Completează titlul media.");
    setMediaGallery((current) => [{ id: Date.now(), ...mediaForm, clubId: selectedClub?.id || DEFAULT_CLUB_ID }, ...current]);
    setMediaForm({ type: "Meci", title: "", url: "", date: todayLabel() });
    showAppMessage("Galerie actualizată", "Elementul media a fost adăugat.");
  };
  const addScout = () => {
    if (!scoutForm.name.trim()) return showAppMessage("Nume lipsă", "Completează numele jucătorului în probă.");
    setScouting((current) => [{ id: Date.now(), ...scoutForm, clubId: selectedClub?.id || DEFAULT_CLUB_ID }, ...current]);
    setScoutForm({ name: "", age: "", role: "", notes: "", decision: "Revăzut" });
    showAppMessage("Scouting actualizat", "Jucătorul în probă a fost adăugat.");
  };
  const currentSubscription = getClubSubscription(subscriptions, selectedClub?.id);
  const sendInvitation = () => {
    const email = invitationForm.email.trim().toLowerCase();
    if (!email.includes("@")) return showAppMessage("Email invalid", "Completeaza emailul persoanei invitate.");
    if (!selectedClub?.id) return showAppMessage("Club lipsa", "Alege clubul inainte de a trimite invitatia.");
    const invite = {
      id: `invite-${Date.now()}`,
      email,
      role: invitationForm.role,
      clubId: selectedClub.id,
      status: "pending",
      token: `fc-${Math.random().toString(36).slice(2, 10)}`,
      createdAt: nowLabel(),
    };
    if (isSupabaseConfigured && supabaseService.insertInvitation) {
      supabaseService.insertInvitation(invite).catch((error) => reportSyncError("Invitatii", error));
    }
    setInvitations((current) => [invite, ...current]);
    setInvitationForm({ email: "", role: "coach" });
    showAppMessage("Invitatie trimisa", `Token: ${invite.token}`);
  };
  const updateSubscriptionPlan = (planName) => {
    const plan = subscriptionPlans[planName] || subscriptionPlans.Free;
    setSubscriptions((current) => {
      const exists = current.some((item) => item.clubId === selectedClub?.id);
      const next = {
        ...(exists ? current.find((item) => item.clubId === selectedClub?.id) : {}),
        id: currentSubscription.id || `sub-${selectedClub?.id}`,
        clubId: selectedClub?.id,
        planName,
        status: "active",
        maxPlayers: plan.maxPlayers,
        startedAt: currentSubscription.startedAt || nowLabel(),
        expiresAt: currentSubscription.expiresAt || "",
        createdAt: currentSubscription.createdAt || nowLabel(),
      };
      if (isSupabaseConfigured && supabaseService.insertSubscription) {
        supabaseService.insertSubscription(next).catch((error) => reportSyncError("Abonament", error));
      }
      return exists ? current.map((item) => (item.clubId === selectedClub?.id ? next : item)) : [next, ...current];
    });
    showAppMessage("Abonament actualizat", `Clubul foloseste planul ${planName}.`);
  };
  const ranking = players.map((player) => {
    const statuses = trainings.filter((training) => training.group === player.group).map((training) => attendance[training.id]?.[player.id]).filter(Boolean);
    const present = statuses.filter((status) => status === "present").length;
    const goals = matches.filter((match) => match.group === player.group).reduce((sum, match) => sum + Number(match.scorers?.[player.id] || 0), 0);
    const evalAvg = evaluations[player.id] ? Math.round((Number(evaluations[player.id].technique || 0) + Number(evaluations[player.id].speed || 0) + Number(evaluations[player.id].discipline || 0) + Number(evaluations[player.id].attitude || 0) + Number(evaluations[player.id].tactics || 0) + Number(evaluations[player.id].physical || 0)) / 6) : 0;
    return { player, score: present * 4 + goals * 8 + evalAvg * 5 };
  }).sort((a, b) => b.score - a.score);
  const exportReport = (title) => {
    const report = title === "Raport complet jucători"
      ? players.map((player) => buildPlayerReport(player, { trainings, attendance, matches, payments, monthlyPayments, observations: getPlayerJournal(playerObservations, player.id) })).join("\n\n---\n\n")
      : title === "Listă jucători"
      ? players.map((player) => `${player.name} • #${player.no} • ${player.group} • ${player.role} • ${player.status}`).join("\n")
      : title === "Prezență lunară"
        ? players.map((player) => buildPlayerReport(player, { trainings, attendance, matches, payments, monthlyPayments, observations: getPlayerJournal(playerObservations, player.id) })).join("\n\n---\n\n")
        : title === "Raport financiar"
          ? [
              `Raport financiar - ${clubSettings.clubName}`,
              `Plăți antrenamente: ${Object.keys(payments).length} antrenamente`,
              `Cotizații lunare: ${Object.keys(monthlyPayments).length} luni/grupe`,
              `Jucători: ${players.length}`,
            ].join("\n")
          : matches.map((match) => {
              const squad = players
                .filter((player) => player.group === match.group && matchSquadStatuses.includes(match.callUps?.[player.id]))
                .map((player) => `${player.name} (${match.callUps[player.id]})`)
                .join(", ");
              return `${match.type} • ${match.group}\nFC Autentic vs ${match.opponent}\n${match.date} • ${match.time}\nLot: ${squad || "necompletat"}`;
            }).join("\n\n---\n\n");
    setExportedReport(`${title}\n\n${report}`);
    const downloaded = downloadPdf(title, report);
    showAppMessage("Raport generat", downloaded ? `${title} a fost descărcat ca PDF.` : `${title} este pregătit și afișat mai jos.`);
  };
  const personalMenu = [
    ["person-circle-outline", "Profil personal"],
  ];
  const menu = isSuperAdmin(currentUser) || isClubOwner(currentUser)
    ? fullMenu
    : currentUser?.role === "coach"
      ? fullMenu.filter(([, label]) => !["Cluburi mele", "Invitatii club", "Abonament SaaS", "Staff И™i permisiuni", "SetДѓri club"].includes(label))
      : personalMenu;
  return (
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <TopBar title="Administrare" />
      <View style={styles.clubCard}>
        <Badge size={82} />
        <View style={styles.clubInfo}>
          <Text style={styles.clubName}>{selectedClub?.name || currentUser?.name || "FC Autentic"}</Text>
          <Text style={styles.clubRole}>{roleLabels[currentUser?.role] || "Cont utilizator"} • {selectedClub?.city || "club"}</Text>
          <View style={styles.planPill}><Text style={styles.planText}>{currentSubscription.planName || LOCAL_MODE_LABEL}</Text></View>
        </View>
      </View>
      <View style={styles.shortcutGrid}>
        {navigationShortcuts.map(([icon, label, meta, action]) => (
          <Pressable style={styles.shortcutCard} key={label} onPress={action}>
            <View style={styles.shortcutIcon}><Ionicons name={icon} size={21} color={C.blue} /></View>
            <Text style={styles.shortcutTitle}>{label}</Text>
            <Text style={styles.shortcutMeta}>{meta}</Text>
          </Pressable>
        ))}
      </View>
      {menu.map(([icon, label]) => (
        <Pressable style={[styles.menuRow, selectedMenu === label && styles.menuRowActive]} key={label} onPress={() => setSelectedMenu(label)}>
          <View style={styles.menuIcon}><Ionicons name={icon} size={22} color={C.blue} /></View>
          <Text style={styles.menuLabel}>{label}</Text>
          <Ionicons name="chevron-forward" size={19} color={C.muted} />
        </Pressable>
      ))}
      {selectedMenu && (
        selectedMenu === "Profil personal" ? (
          <View style={styles.profilePanel}>
            <View style={styles.profilePanelTop}>
              <View style={styles.profilePanelAvatar}>
                <Ionicons name="person" size={34} color={C.white} />
              </View>
              <View style={styles.profilePanelInfo}>
                <Text style={styles.profilePanelName}>{currentUser?.name || "Utilizator"}</Text>
                <Text style={styles.profilePanelRole}>{roleLabels[currentUser?.role] || "Cont"} • {LOCAL_MODE_LABEL}</Text>
              </View>
            </View>
            <View style={styles.profileDetailsGrid}>
              <View style={styles.profileDetailBox}>
                <Text style={styles.profileDetailLabel}>Email</Text>
                <Text style={styles.profileDetailValue}>{currentUser?.email || "—"}</Text>
              </View>
              <View style={styles.profileDetailBox}>
                <Text style={styles.profileDetailLabel}>Grupă</Text>
                <Text style={styles.profileDetailValue}>{personalPlayer?.group || currentUser?.assignedGroups?.join(", ") || "—"}</Text>
              </View>
              <View style={styles.profileDetailBox}>
                <Text style={styles.profileDetailLabel}>Profil sportiv</Text>
                <Text style={styles.profileDetailValue}>{personalPlayer ? `#${personalPlayer.no} • ${personalPlayer.role}` : "Administrare club"}</Text>
              </View>
              <View style={styles.profileDetailBox}>
                <Text style={styles.profileDetailLabel}>Prezență</Text>
                <Text style={[styles.profileDetailValue, { color: C.green }]}>{personalStatuses.length ? `${personalPercent}%` : "—"}</Text>
              </View>
            </View>
            <View style={styles.permissionCard}>
              <Ionicons name="shield-checkmark-outline" size={20} color={C.blue} />
              <Text style={styles.permissionText}>
                {currentUser?.role === "admin"
                  ? "Ai acces complet la administrarea clubului."
                  : currentUser?.role === "coach"
                    ? `Ai acces la grupele: ${currentUser?.assignedGroups?.join(", ") || "atribuite"}.`
                    : currentUser?.role === "parent"
                      ? "Ai acces doar la profilul și programul copilului tău."
                      : "Ai acces doar la profilul, programul și statisticile tale."}
              </Text>
            </View>
          </View>
        ) : selectedMenu === "Cluburi mele" ? (
          <View style={styles.profilePanel}>
            <Text style={styles.paymentSectionLabel}>CLUBURI ACCESIBILE</Text>
            {clubs.map((club) => {
              const membership = memberships.find((item) => item.clubId === club.id && item.userId === currentUser?.id);
              const active = selectedClub?.id === club.id;
              return (
                <Pressable key={club.id} style={[styles.historyRow, active && styles.menuRowActive]} onPress={() => setSelectedClubId(club.id)}>
                  <View>
                    <Text style={styles.historyTitle}>{club.name}</Text>
                    <Text style={styles.historyMeta}>{club.city || "Oras"} • {roleLabels[membership?.role] || "Acces platforma"}</Text>
                  </View>
                  <Text style={[styles.historyStatus, { color: active ? C.green : C.muted }]}>{active ? "Activ" : "Alege"}</Text>
                </Pressable>
              );
            })}
          </View>
        ) : selectedMenu === "Invitatii club" ? (
          <View style={styles.profilePanel}>
            <Text style={styles.paymentSectionLabel}>INVITA UTILIZATORI</Text>
            <TrainingField label="Email" value={invitationForm.email} onChange={(email) => setInvitationForm({ ...invitationForm, email })} placeholder="persoana@email.com" />
            <Text style={styles.trainingFieldLabel}>Rol</Text>
            <View style={styles.groupRow}>
              {["coach", "player", "parent", "viewer"].map((role) => (
                <Pressable key={role} style={[styles.groupChip, invitationForm.role === role && styles.groupChipActive]} onPress={() => setInvitationForm({ ...invitationForm, role })}>
                  <Text style={[styles.groupChipText, invitationForm.role === role && styles.groupChipTextActive]}>{roleLabels[role] || role}</Text>
                </Pressable>
              ))}
            </View>
            <Pressable style={styles.primaryButton} onPress={sendInvitation}>
              <Ionicons name="send-outline" size={18} color={C.white} />
              <Text style={styles.primaryButtonText}>Trimite invitatie</Text>
            </Pressable>
            <SectionTitle title="Invitatii trimise" />
            {invitations.filter((item) => item.clubId === selectedClub?.id).map((invite) => (
              <View style={styles.historyRow} key={invite.id}>
                <View>
                  <Text style={styles.historyTitle}>{invite.email}</Text>
                  <Text style={styles.historyMeta}>{roleLabels[invite.role] || invite.role} • token {invite.token}</Text>
                </View>
                <Text style={[styles.historyStatus, { color: invite.status === "accepted" ? C.green : C.amber }]}>{invite.status}</Text>
              </View>
            ))}
          </View>
        ) : selectedMenu === "Abonament SaaS" ? (
          <View style={styles.profilePanel}>
            <Text style={styles.paymentSectionLabel}>PLANURI SAAS</Text>
            {Object.values(subscriptionPlans).map((plan) => (
              <Pressable key={plan.name} style={[styles.subscriptionCard, currentSubscription.planName === plan.name && styles.subscriptionCardActive]} onPress={() => updateSubscriptionPlan(plan.name)}>
                <View>
                  <Text style={styles.subscriptionTitle}>{plan.name}</Text>
                  <Text style={styles.subscriptionMeta}>{plan.maxPlayers ? `max ${plan.maxPlayers} jucatori` : "jucatori nelimitati"} • {plan.features.join(", ")}</Text>
                </View>
                <Text style={styles.subscriptionPrice}>{plan.monthlyPrice ? `${plan.monthlyPrice}€/lună` : "Free"}</Text>
              </Pressable>
            ))}
            <View style={styles.permissionCard}>
              <Ionicons name="lock-closed-outline" size={20} color={isSubscriptionActive(currentSubscription, selectedClub) ? C.green : C.red} />
              <Text style={styles.permissionText}>
                Status: {currentSubscription.status || "active"} • limita curenta: {getPlanLimit(currentSubscription) || "nelimitat"} jucatori.
              </Text>
            </View>
          </View>
        ) : selectedMenu === "Setări club" ? (
          <View style={styles.profilePanel}>
            <TrainingField label="Numele clubului" value={clubSettings.clubName} onChange={(clubName) => setClubSettings({ ...clubSettings, clubName })} />
            <TrainingField label="Email club" value={clubSettings.email} onChange={(email) => setClubSettings({ ...clubSettings, email })} />
            <TrainingField label="Telefon" value={clubSettings.phone} onChange={(phone) => setClubSettings({ ...clubSettings, phone })} />
            <TrainingField label="Adresă" value={clubSettings.address} onChange={(address) => setClubSettings({ ...clubSettings, address })} />
            <View style={styles.formRow}>
              <View style={styles.formHalf}><TrainingField label="Moneda" value={clubSettings.currency} onChange={(currency) => setClubSettings({ ...clubSettings, currency })} /></View>
              <View style={styles.formHalf}><TrainingField label="Cotizație lunară" value={clubSettings.monthlyFee} onChange={(monthlyFee) => setClubSettings({ ...clubSettings, monthlyFee: monthlyFee.replace(/[^0-9]/g, "") })} /></View>
            </View>
            <TrainingField label="Taxă standard antrenament" value={clubSettings.trainingFee} onChange={(trainingFee) => setClubSettings({ ...clubSettings, trainingFee: trainingFee.replace(/[^0-9]/g, "") })} />
          </View>
        ) : selectedMenu === "Evaluări lunare" ? (
          <View style={styles.profilePanel}>
            <Text style={styles.paymentSectionLabel}>JUCĂTOR</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.groupFilters}>
              {players.map((player) => (
                <Pressable key={player.id} style={[styles.filterChip, selectedPlayerForTools === player.id && styles.filterChipActive]} onPress={() => setSelectedPlayerForTools(player.id)}>
                  <Text style={[styles.filterChipText, selectedPlayerForTools === player.id && styles.filterChipTextActive]}>{player.name}</Text>
                </Pressable>
              ))}
            </ScrollView>
            <TrainingField label="Luna" value={evaluationForm.month} onChange={(month) => setEvaluationForm({ ...evaluationForm, month })} />
            {[
              ["technique", "Tehnică"], ["speed", "Viteză"], ["discipline", "Disciplină"], ["attitude", "Atitudine"], ["tactics", "Tactică"], ["physical", "Fizic"],
            ].map(([key, label]) => (
              <TrainingField key={key} label={`${label} (1-10)`} value={String(evaluationForm[key])} onChange={(value) => setEvaluationForm({ ...evaluationForm, [key]: value.replace(/[^0-9]/g, "").slice(0, 2) })} />
            ))}
            <Pressable style={styles.primaryButton} onPress={saveEvaluation}><Ionicons name="star-outline" size={18} color={C.white} /><Text style={styles.primaryButtonText}>Salvează evaluarea</Text></Pressable>
            {Object.entries(evaluations).map(([playerId, evaluation]) => (
              <View style={styles.historyRow} key={playerId}>
                <View><Text style={styles.historyTitle}>{getPlayerName(players, playerId)}</Text><Text style={styles.historyMeta}>{evaluation.month} • Tehnică {evaluation.technique} • Atitudine {evaluation.attitude}</Text></View>
                <Text style={[styles.historyStatus, { color: C.green }]}>{Math.round((Number(evaluation.technique) + Number(evaluation.speed) + Number(evaluation.discipline) + Number(evaluation.attitude) + Number(evaluation.tactics) + Number(evaluation.physical)) / 6)}/10</Text>
              </View>
            ))}
          </View>
        ) : selectedMenu === "Plan dezvoltare" ? (
          <View style={styles.profilePanel}>
            <Text style={styles.paymentSectionLabel}>JUCĂTOR</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.groupFilters}>
              {players.map((player) => (
                <Pressable key={player.id} style={[styles.filterChip, selectedPlayerForTools === player.id && styles.filterChipActive]} onPress={() => setSelectedPlayerForTools(player.id)}>
                  <Text style={[styles.filterChipText, selectedPlayerForTools === player.id && styles.filterChipTextActive]}>{player.name}</Text>
                </Pressable>
              ))}
            </ScrollView>
            <TrainingField label="De îmbunătățit" value={planForm.focus} onChange={(focus) => setPlanForm({ ...planForm, focus })} />
            <TrainingField label="Obiectiv lunar" value={planForm.objective} onChange={(objective) => setPlanForm({ ...planForm, objective })} multiline />
            <TrainingField label="Exerciții recomandate" value={planForm.exercises} onChange={(exercises) => setPlanForm({ ...planForm, exercises })} multiline />
            <TrainingField label="Status" value={planForm.status} onChange={(status) => setPlanForm({ ...planForm, status })} />
            <Pressable style={styles.primaryButton} onPress={saveDevelopmentPlan}><Ionicons name="trending-up-outline" size={18} color={C.white} /><Text style={styles.primaryButtonText}>Salvează planul</Text></Pressable>
            {Object.entries(developmentPlans).map(([playerId, plan]) => (
              <View style={styles.noteCard} key={playerId}>
                <Ionicons name="flag-outline" size={22} color={C.blue} />
                <View style={{ flex: 1 }}><Text style={styles.historyTitle}>{getPlayerName(players, playerId)} • {plan.status}</Text><Text style={styles.noteText}>{plan.focus} — {plan.objective}</Text><Text style={styles.historyMeta}>{plan.exercises}</Text></View>
              </View>
            ))}
          </View>
        ) : selectedMenu === "Disciplină" ? (
          <View style={styles.profilePanel}>
            <TrainingField label="Tip incident" value={disciplineForm.type} onChange={(type) => setDisciplineForm({ ...disciplineForm, type })} />
            <TrainingField label="Observație" value={disciplineForm.note} onChange={(note) => setDisciplineForm({ ...disciplineForm, note })} multiline />
            <Pressable style={styles.primaryButton} onPress={addDiscipline}><Ionicons name="warning-outline" size={18} color={C.white} /><Text style={styles.primaryButtonText}>Adaugă disciplină</Text></Pressable>
            {discipline.map((item) => <View style={styles.historyRow} key={item.id}><View><Text style={styles.historyTitle}>{getPlayerName(players, item.playerId)} • {item.type}</Text><Text style={styles.historyMeta}>{item.date} • {item.note}</Text></View><Text style={[styles.historyStatus, { color: C.amber }]}>Evidență</Text></View>)}
          </View>
        ) : selectedMenu === "Chat intern" ? (
          <View style={styles.profilePanel}>
            <TrainingField label="Audiență" value={chatForm.audience} onChange={(audience) => setChatForm({ ...chatForm, audience })} />
            <TrainingField label="Mesaj" value={chatForm.text} onChange={(text) => setChatForm({ ...chatForm, text })} multiline />
            <Pressable style={styles.primaryButton} onPress={sendChatMessage}><Ionicons name="send-outline" size={18} color={C.white} /><Text style={styles.primaryButtonText}>Trimite mesaj</Text></Pressable>
            {chatMessages.map((message) => <View style={styles.notificationRow} key={message.id}><View style={styles.notificationIcon}><Ionicons name="chatbox-outline" size={18} color={C.blue} /></View><View style={styles.notificationInfo}><Text style={styles.notificationTitle}>{message.audience} • {message.author}</Text><Text style={styles.notificationText}>{message.date} • {message.text}</Text></View></View>)}
          </View>
        ) : selectedMenu === "Galerie foto/video" ? (
          <View style={styles.profilePanel}>
            <TrainingField label="Tip" value={mediaForm.type} onChange={(type) => setMediaForm({ ...mediaForm, type })} />
            <TrainingField label="Titlu" value={mediaForm.title} onChange={(title) => setMediaForm({ ...mediaForm, title })} />
            <TrainingField label="Link / descriere media" value={mediaForm.url} onChange={(url) => setMediaForm({ ...mediaForm, url })} />
            <Pressable style={styles.primaryButton} onPress={addMedia}><Ionicons name="images-outline" size={18} color={C.white} /><Text style={styles.primaryButtonText}>Adaugă media</Text></Pressable>
            {mediaGallery.map((item) => <View style={styles.historyRow} key={item.id}><View><Text style={styles.historyTitle}>{item.title}</Text><Text style={styles.historyMeta}>{item.type} • {item.date} • {item.url}</Text></View><Text style={[styles.historyStatus, { color: C.blue }]}>Media</Text></View>)}
          </View>
        ) : selectedMenu === "Scouting probe" ? (
          <View style={styles.profilePanel}>
            <TrainingField label="Nume" value={scoutForm.name} onChange={(name) => setScoutForm({ ...scoutForm, name })} />
            <View style={styles.formRow}><View style={styles.formHalf}><TrainingField label="Vârstă" value={scoutForm.age} onChange={(age) => setScoutForm({ ...scoutForm, age })} /></View><View style={styles.formHalf}><TrainingField label="Poziție" value={scoutForm.role} onChange={(role) => setScoutForm({ ...scoutForm, role })} /></View></View>
            <TrainingField label="Observații" value={scoutForm.notes} onChange={(notes) => setScoutForm({ ...scoutForm, notes })} multiline />
            <TrainingField label="Decizie" value={scoutForm.decision} onChange={(decision) => setScoutForm({ ...scoutForm, decision })} />
            <Pressable style={styles.primaryButton} onPress={addScout}><Ionicons name="eye-outline" size={18} color={C.white} /><Text style={styles.primaryButtonText}>Adaugă la scouting</Text></Pressable>
            {scouting.map((item) => <View style={styles.historyRow} key={item.id}><View><Text style={styles.historyTitle}>{item.name} • {item.age} ani</Text><Text style={styles.historyMeta}>{item.role} • {item.notes}</Text></View><Text style={[styles.historyStatus, { color: C.amber }]}>{item.decision}</Text></View>)}
          </View>
        ) : selectedMenu === "Ranking intern" ? (
          <View style={styles.profilePanel}>
            {ranking.map(({ player, score }, index) => <View style={styles.historyRow} key={player.id}><View><Text style={styles.historyTitle}>#{index + 1} {player.name}</Text><Text style={styles.historyMeta}>{player.group} • {player.role}</Text></View><Text style={[styles.historyStatus, { color: index < 3 ? C.green : C.blue }]}>{score} pct</Text></View>)}
          </View>
        ) : selectedMenu === "Documente și contracte" ? (
          <View style={styles.profilePanel}>
            {documents.map((doc) => (
              <View style={styles.historyRow} key={doc.id}>
                <View>
                  <Text style={styles.historyTitle}>{doc.title}</Text>
                  <Text style={styles.historyMeta}>{doc.owner} • {doc.type} • Expiră: {doc.expires}</Text>
                </View>
                <Text style={[styles.historyStatus, { color: doc.status === "Valid" ? C.green : C.amber }]}>{doc.status}</Text>
              </View>
            ))}
            <Pressable style={styles.outlineButton} onPress={addDocument}>
              <Ionicons name="add" size={18} color={C.blue} />
              <Text style={styles.outlineButtonText}>Adaugă document</Text>
            </Pressable>
          </View>
        ) : selectedMenu === "Fișe medicale" ? (
          <View style={styles.profilePanel}>
            {players.map((player) => {
              const form = medicalForms[player.id] || {};
              return (
              <View style={styles.medicalCard} key={player.id}>
                <View style={styles.historyRow}>
                  <View>
                  <Text style={styles.historyTitle}>{player.name}</Text>
                  <Text style={styles.historyMeta}>{player.group} • alergii: {player.allergies || "Nu"} • urgență: {player.emergencyContact || player.parentPhone || "De completat"}</Text>
                  <Text style={styles.historyMeta}>Certificat: {player.medicalExpires || "De completat"}</Text>
                </View>
                <Text style={[styles.historyStatus, { color: (player.medicalStatus || player.status) === "Apt" || player.status === "Activ" ? C.green : C.amber }]}>{player.medicalStatus || (player.status === "Activ" ? "Apt" : "Recuperare")}</Text>
              </View>
              <TrainingField label="Alergii" value={form.allergies ?? player.allergies ?? "Nu"} onChange={(allergies) => setMedicalForms((current) => ({ ...current, [player.id]: { ...(current[player.id] || {}), allergies } }))} />
              <TrainingField label="Contact urgență" value={form.emergencyContact ?? player.emergencyContact ?? player.parentPhone ?? ""} onChange={(emergencyContact) => setMedicalForms((current) => ({ ...current, [player.id]: { ...(current[player.id] || {}), emergencyContact } }))} />
              <View style={styles.formRow}>
                <View style={styles.formHalf}><TrainingField label="Status medical" value={form.medicalStatus ?? player.medicalStatus ?? "Apt"} onChange={(medicalStatus) => setMedicalForms((current) => ({ ...current, [player.id]: { ...(current[player.id] || {}), medicalStatus } }))} /></View>
                <View style={styles.formHalf}><TrainingField label="Expiră certificat" value={form.medicalExpires ?? player.medicalExpires ?? ""} onChange={(medicalExpires) => setMedicalForms((current) => ({ ...current, [player.id]: { ...(current[player.id] || {}), medicalExpires } }))} placeholder="15.07.2026" /></View>
              </View>
              <Pressable style={styles.smallSaveButton} onPress={() => saveMedical(player)}>
                <Ionicons name="save-outline" size={16} color={C.white} />
                <Text style={styles.smallSaveText}>Salvează fișa medicală</Text>
              </Pressable>
              </View>
            );})}
          </View>
        ) : selectedMenu === "Inventar echipament" ? (
          <View style={styles.profilePanel}>
            <TrainingField label="Denumire" value={equipmentForm.name} onChange={(name) => setEquipmentForm({ ...equipmentForm, name })} />
            <View style={styles.formRow}>
              <View style={styles.formHalf}><TrainingField label="Categorie" value={equipmentForm.category} onChange={(category) => setEquipmentForm({ ...equipmentForm, category })} /></View>
              <View style={styles.formHalf}><TrainingField label="Total" value={equipmentForm.total} onChange={(total) => setEquipmentForm({ ...equipmentForm, total: total.replace(/[^0-9]/g, "") })} /></View>
            </View>
            <View style={styles.formRow}>
              <View style={styles.formHalf}><TrainingField label="Asignat" value={equipmentForm.assigned} onChange={(assigned) => setEquipmentForm({ ...equipmentForm, assigned })} /></View>
              <View style={styles.formHalf}><TrainingField label="Lipsă" value={equipmentForm.missing} onChange={(missing) => setEquipmentForm({ ...equipmentForm, missing: missing.replace(/[^0-9]/g, "") })} /></View>
            </View>
            <Pressable style={styles.primaryButton} onPress={addEquipment}>
              <Ionicons name="add" size={18} color={C.white} />
              <Text style={styles.primaryButtonText}>Adaugă în inventar</Text>
            </Pressable>
            {equipment.map((item) => (
              <View style={styles.inventoryCard} key={item.id}>
                <View>
                  <Text style={styles.historyTitle}>{item.name}</Text>
                  <Text style={styles.historyMeta}>{item.category} • asignat: {item.assigned}</Text>
                </View>
                <View style={styles.inventoryNumbers}>
                  <Text style={styles.historyStatus}>{item.total} total</Text>
                  <Text style={[styles.historyStatus, { color: Number(item.missing) ? C.amber : C.green }]}>{item.missing} lipsă</Text>
                </View>
                <View style={styles.formRow}>
                  <View style={styles.formHalf}><TrainingField label="Total" value={String(item.total)} onChange={(total) => updateEquipment(item.id, { total: Number(total.replace(/[^0-9]/g, "") || 0) })} /></View>
                  <View style={styles.formHalf}><TrainingField label="Lipsă" value={String(item.missing)} onChange={(missing) => updateEquipment(item.id, { missing: Number(missing.replace(/[^0-9]/g, "") || 0) })} /></View>
                </View>
              </View>
            ))}
          </View>
        ) : selectedMenu === "Status aplicație" ? (
          <View style={styles.profilePanel}>
            <View style={styles.profileDetailsGrid}>
              <View style={styles.profileDetailBox}><Text style={styles.profileDetailLabel}>Jucători</Text><Text style={styles.profileDetailValue}>{players.length}</Text></View>
              <View style={styles.profileDetailBox}><Text style={styles.profileDetailLabel}>Antrenamente</Text><Text style={styles.profileDetailValue}>{trainings.length}</Text></View>
              <View style={styles.profileDetailBox}><Text style={styles.profileDetailLabel}>Meciuri</Text><Text style={styles.profileDetailValue}>{matches.length}</Text></View>
              <View style={styles.profileDetailBox}><Text style={styles.profileDetailLabel}>Observații</Text><Text style={styles.profileDetailValue}>{Object.values(playerObservations).reduce((sum, list) => sum + list.length, 0)}</Text></View>
              <View style={styles.profileDetailBox}><Text style={styles.profileDetailLabel}>Inventar</Text><Text style={styles.profileDetailValue}>{equipment.length} poziții</Text></View>
              <View style={styles.profileDetailBox}><Text style={styles.profileDetailLabel}>Bază date</Text><Text style={[styles.profileDetailValue, { color: isSupabaseConfigured ? C.green : C.amber }]}>{isSupabaseConfigured ? "Supabase conectat" : "Mod local"}</Text></View>
            </View>
            <View style={styles.permissionCard}>
              <Ionicons name="cloud-done-outline" size={20} color={C.blue} />
              <Text style={styles.permissionText}>Ultima salvare locală se face automat după fiecare modificare. Datele sunt păstrate în memoria aplicației până conectăm complet Supabase Database.</Text>
            </View>
          </View>
        ) : selectedMenu === "Anunțuri club" ? (
          <View style={styles.profilePanel}>
            <TrainingField label="Audiență" value={announcementForm.audience} onChange={(audience) => setAnnouncementForm({ ...announcementForm, audience })} />
            <TrainingField label="Titlu" value={announcementForm.title} onChange={(title) => setAnnouncementForm({ ...announcementForm, title })} />
            <TrainingField label="Mesaj" value={announcementForm.text} onChange={(text) => setAnnouncementForm({ ...announcementForm, text })} multiline />
            <Pressable style={styles.primaryButton} onPress={addAnnouncement}>
              <Ionicons name="send-outline" size={18} color={C.white} />
              <Text style={styles.primaryButtonText}>Trimite anunț</Text>
            </Pressable>
            {announcements.map((item) => (
              <View style={styles.notificationRow} key={item.id}>
                <View style={[styles.notificationIcon, { backgroundColor: `${C.blue}20` }]}><Ionicons name="megaphone-outline" size={20} color={C.blue} /></View>
                <View style={styles.notificationInfo}>
                  <Text style={styles.notificationTitle}>{item.title}</Text>
                  <Text style={styles.notificationText}>{item.audience} • {item.date} • {item.text}</Text>
                </View>
              </View>
            ))}
          </View>
        ) : selectedMenu === "Export rapoarte" ? (
          <View style={styles.profilePanel}>
            {[
              ["Raport complet jucători", `${players.length} rapoarte individuale cu observații`],
              ["Listă jucători", `${players.length} jucători pregătiți pentru export`],
              ["Prezență lunară", `${trainings.length} antrenamente analizate`],
              ["Raport financiar", `${Object.keys(payments).length + Object.keys(monthlyPayments).length} seturi de plăți`],
              ["Convocare meci", `${matches.length} meciuri disponibile`],
            ].map(([title, meta]) => (
              <Pressable style={styles.historyRow} key={title} onPress={() => exportReport(title)}>
                <View>
                  <Text style={styles.historyTitle}>{title}</Text>
                  <Text style={styles.historyMeta}>{meta}</Text>
                </View>
                <Text style={[styles.historyStatus, { color: C.blue }]}>PDF</Text>
              </Pressable>
            ))}
            {!!exportedReport && (
              <View style={styles.reportPreview}>
                <Text style={styles.reportPreviewTitle}>Previzualizare raport</Text>
                <Text style={styles.reportPreviewText}>{exportedReport}</Text>
              </View>
            )}
          </View>
        ) : (
          <View style={styles.adminDetailCard}>
            <Text style={styles.adminDetailTitle}>{selectedMenu}</Text>
            <Text style={styles.adminDetailText}>Secțiune pregătită pentru club. Următorul pas este să conectăm aici documente, fișe, inventar sau permisiuni reale.</Text>
          </View>
        )
      )}
      <Pressable style={styles.logoutButton} onPress={onLogout}>
        <Ionicons name="log-out-outline" size={19} color={C.white} />
        <Text style={styles.logoutText}>Ieșire din cont</Text>
      </Pressable>
    </ScrollView>
  );
}

const tabs = [
  ["Panou", "grid"],
  ["Echipă", "people"],
  ["Antren.", "barbell"],
  ["Calendar", "calendar"],
  ["Finanțe", "wallet"],
  ["Mai mult", "menu"],
];

function SaasAdminPage({ clubs, players, memberships, subscriptions, setClubs }) {
  const activeClubs = clubs.filter((club) => !club.blocked && club.status !== "blocked").length;
  const totalUsers = new Set(memberships.map((item) => item.userId)).size;
  const estimatedMrr = subscriptions.reduce((sum, subscription) => {
    const plan = subscriptionPlans[subscription.planName] || subscriptionPlans.Free;
    return sum + (subscription.status === "active" ? plan.monthlyPrice : 0);
  }, 0);
  const toggleClubBlock = (clubId) => {
    setClubs((current) => current.map((club) => (
      club.id === clubId ? { ...club, blocked: !club.blocked, status: club.blocked ? "active" : "blocked" } : club
    )));
    const currentClub = clubs.find((club) => club.id === clubId);
    if (currentClub && isSupabaseConfigured && supabaseService.updateClub) {
      const updated = { ...currentClub, blocked: !currentClub.blocked, status: currentClub.blocked ? "active" : "blocked" };
      supabaseService.updateClub(updated).catch((error) => reportSyncError("Cluburi SaaS", error));
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <TopBar title="Super Admin" eyebrow="PLATFORMA SAAS" />
      <View style={styles.profileStats}>
        <Metric icon="business-outline" value={clubs.length} label="Cluburi" color={C.blue} />
        <Metric icon="people-outline" value={totalUsers} label="Utilizatori" color={C.green} />
        <Metric icon="football-outline" value={players.length} label="Jucatori" color={C.amber} />
        <Metric icon="cash-outline" value={`${estimatedMrr}€`} label="MRR estimat" color={C.red} />
      </View>
      <View style={styles.controlCard}>
        <View style={styles.controlTop}>
          <View>
            <Text style={styles.controlKicker}>STATUS PLATFORMA</Text>
            <Text style={styles.controlTitle}>{activeClubs}/{clubs.length} cluburi active</Text>
          </View>
          <View style={styles.livePill}><View style={styles.liveDot} /><Text style={styles.liveText}>SAAS</Text></View>
        </View>
      </View>
      <SectionTitle title="Toate cluburile" />
      {clubs.map((club) => {
        const subscription = getClubSubscription(subscriptions, club.id);
        const clubPlayers = players.filter((player) => getClubId(player) === club.id).length;
        const clubCoaches = memberships.filter((item) => item.clubId === club.id && item.role === "coach").length;
        return (
          <View style={styles.subscriptionCard} key={club.id}>
            <View style={{ flex: 1 }}>
              <Text style={styles.subscriptionTitle}>{club.name}</Text>
              <Text style={styles.subscriptionMeta}>{club.city || "Oras"} • {clubPlayers} jucatori • {clubCoaches} antrenori</Text>
              <Text style={styles.subscriptionMeta}>Plan {subscription.planName} • status {subscription.status || "active"}</Text>
            </View>
            <Pressable style={[styles.smallSaveButton, { backgroundColor: club.blocked ? C.green : C.red }]} onPress={() => toggleClubBlock(club.id)}>
              <Text style={styles.smallSaveText}>{club.blocked ? "Deblocheaza" : "Blocheaza"}</Text>
            </Pressable>
          </View>
        );
      })}
    </ScrollView>
  );
}

export default function App() {
  const [authView, setAuthView] = useState("welcome");
  const [currentUser, setCurrentUser] = useState(null);
  const [registeredUsers, setRegisteredUsers] = useState([]);
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState("");
  const [tab, setTab] = useState("Panou");
  const [players, rawSetPlayers] = useState(seedData.players);
  const [trainings, rawSetTrainings] = useState(seedData.trainings);
  const [matches, rawSetMatches] = useState(seedData.matches);
  const [attendance, rawSetAttendance] = useState(seedData.attendance);
  const [payments, rawSetPayments] = useState(seedData.payments);
  const [monthlyPayments, rawSetMonthlyPayments] = useState({});
  const [events, rawSetEvents] = useState([]);
  const [transactions, rawSetTransactions] = useState(seedData.transactions);
  const [clubSettings, setClubSettings] = useState(initialClubSettings);
  const [documents, rawSetDocuments] = useState(seedData.documents);
  const [announcements, setAnnouncements] = useState(seedData.announcements);
  const [playerObservations, rawSetPlayerObservations] = useState(seedData.playerObservations);
  const [equipment, rawSetEquipment] = useState(seedData.equipment);
  const [evaluations, rawSetEvaluations] = useState(seedData.evaluations);
  const [developmentPlans, rawSetDevelopmentPlans] = useState(seedData.developmentPlans);
  const [discipline, rawSetDiscipline] = useState(seedData.discipline);
  const [chatMessages, rawSetChatMessages] = useState(seedData.chatMessages);
  const [mediaGallery, rawSetMediaGallery] = useState(seedData.mediaGallery);
  const [scouting, rawSetScouting] = useState(seedData.scouting);
  const [clubs, setClubs] = useState([defaultClub]);
  const [selectedClubId, setSelectedClubId] = useState(DEFAULT_CLUB_ID);
  const [memberships, setMemberships] = useState([]);
  const [subscriptions, setSubscriptions] = useState([defaultSubscription]);
  const [invitations, setInvitations] = useState([]);
  const [hydrated, setHydrated] = useState(false);
  const [tasks, setTasks] = useState(ENABLE_DEMO_MODE ? [
    { id: 1, title: "Confirmă lotul pentru meci", meta: "Termen: azi, 16:00", priority: "URGENT", color: C.red, done: false },
    { id: 2, title: "Achită chiria terenului", meta: "Termen: 25 iunie", priority: "MEDIU", color: C.amber, done: false },
    { id: 3, title: "Verifică echipamentul", meta: "Responsabil: Andrei", priority: "NORMAL", color: C.blue, done: true },
  ] : []);

  const loadAllFromSupabase = async () => {
    try {
      const [
        dbPlayers,
        dbTrainings,
        dbMatches,
        dbAttendance,
        dbPayments,
        dbMonthlyPayments,
        dbEvents,
        dbTransactions,
        dbDocuments,
        dbObservations,
        dbEquipment,
        dbEvaluations,
        dbDevelopmentPlans,
        dbDiscipline,
        dbChatMessages,
        dbMediaGallery,
        dbScouting
      ] = await Promise.all([
        supabaseService.getPlayers().catch(() => seedData.players),
        supabaseService.getTrainings().catch(() => seedData.trainings),
        supabaseService.getMatches().catch(() => seedData.matches),
        supabaseService.getAttendance().catch(() => ({})),
        supabaseService.getTrainingPayments().catch(() => ({})),
        supabaseService.getMonthlyPayments().catch(() => ({})),
        supabaseService.getEvents().catch(() => []),
        supabaseService.getTransactions().catch(() => seedData.transactions),
        supabaseService.getDocuments().catch(() => seedData.documents),
        supabaseService.getObservations().catch(() => seedData.playerObservations),
        supabaseService.getEquipment().catch(() => seedData.equipment),
        supabaseService.getEvaluations().catch(() => seedData.evaluations),
        supabaseService.getDevelopmentPlans().catch(() => seedData.developmentPlans),
        supabaseService.getDiscipline().catch(() => seedData.discipline),
        supabaseService.getChatMessages().catch(() => seedData.chatMessages),
        supabaseService.getMedia().catch(() => seedData.mediaGallery),
        supabaseService.getScouting().catch(() => seedData.scouting),
      ]);

      rawSetPlayers(dbPlayers);
      rawSetTrainings(dbTrainings);
      rawSetMatches(dbMatches);
      rawSetAttendance(dbAttendance);
      rawSetPayments(dbPayments);
      rawSetMonthlyPayments(dbMonthlyPayments);
      rawSetEvents(dbEvents);
      rawSetTransactions(dbTransactions);
      rawSetDocuments(dbDocuments);
      rawSetPlayerObservations(dbObservations);
      rawSetEquipment(dbEquipment);
      rawSetEvaluations(dbEvaluations);
      rawSetDevelopmentPlans(dbDevelopmentPlans);
      rawSetDiscipline(dbDiscipline);
      rawSetChatMessages(dbChatMessages);
      rawSetMediaGallery(dbMediaGallery);
      rawSetScouting(dbScouting);
      if (supabaseService.getClubs) {
        const [dbClubs, dbMemberships, dbSubscriptions, dbInvitations] = await Promise.all([
          supabaseService.getClubs().catch(() => [defaultClub]),
          supabaseService.getMemberships().catch(() => []),
          supabaseService.getSubscriptions().catch(() => [defaultSubscription]),
          supabaseService.getInvitations().catch(() => []),
        ]);
        setClubs(dbClubs.length ? dbClubs : [defaultClub]);
        setMemberships(dbMemberships);
        setSubscriptions(dbSubscriptions.length ? dbSubscriptions : [defaultSubscription]);
        setInvitations(dbInvitations);
      }
    } catch (err) {
      console.warn("Eroare la încărcarea datelor din Supabase:", err);
    }
  };

  const setPlayers = (updater) => {
    rawSetPlayers((current) => {
      const next = typeof updater === "function" ? updater(current) : updater;
      if (isSupabaseConfigured && currentUser && currentUser.id !== "guest") {
        setTimeout(async () => {
          try {
            if (next.length > current.length) {
              const added = next.filter(p => !current.some(op => op.id === p.id));
              for (let p of added) {
                const dbP = await supabaseService.insertPlayer(p);
                rawSetPlayers(curr => curr.map(x => x.id === p.id ? dbP : x));
              }
            } else if (next.length < current.length) {
              const deleted = current.filter(p => !next.some(op => op.id === p.id));
              for (let p of deleted) {
                await supabaseService.deletePlayer(p.id);
              }
            } else {
              const modified = next.filter(p => {
                const op = current.find(x => x.id === p.id);
                return op && JSON.stringify(op) !== JSON.stringify(p);
              });
              for (let p of modified) {
                await supabaseService.updatePlayer(p);
              }
            }
          } catch (e) {
            reportSyncError("Jucători", e);
          }
        }, 0);
      }
      return next;
    });
  };

  const setTrainings = (updater) => {
    rawSetTrainings((current) => {
      const next = typeof updater === "function" ? updater(current) : updater;
      if (isSupabaseConfigured && currentUser && currentUser.id !== "guest") {
        setTimeout(async () => {
          try {
            if (next.length > current.length) {
              const added = next.filter(t => !current.some(ot => ot.id === t.id));
              for (let t of added) {
                const dbT = await supabaseService.insertTraining(t);
                rawSetTrainings(curr => curr.map(x => x.id === t.id ? dbT : x));
              }
            } else if (next.length < current.length) {
              const deleted = current.filter(t => !next.some(ot => ot.id === t.id));
              for (let t of deleted) {
                await supabaseService.deleteTraining(t.id);
              }
            } else {
              const modified = next.filter(t => {
                const op = current.find(x => x.id === t.id);
                return op && JSON.stringify(op) !== JSON.stringify(t);
              });
              for (let t of modified) {
                await supabaseService.updateTraining(t);
              }
            }
          } catch (e) {
            reportSyncError("Antrenamente", e);
          }
        }, 0);
      }
      return next;
    });
  };

  const setMatches = (updater) => {
    rawSetMatches((current) => {
      const next = typeof updater === "function" ? updater(current) : updater;
      if (isSupabaseConfigured && currentUser && currentUser.id !== "guest") {
        setTimeout(async () => {
          try {
            if (next.length > current.length) {
              const added = next.filter(m => !current.some(om => om.id === m.id));
              for (let m of added) {
                const dbM = await supabaseService.insertMatch(m);
                rawSetMatches(curr => curr.map(x => x.id === m.id ? dbM : x));
              }
            } else if (next.length < current.length) {
              const deleted = current.filter(m => !next.some(om => om.id === m.id));
              for (let m of deleted) {
                await supabaseService.deleteMatch(m.id);
              }
            } else {
              const modified = next.filter(m => {
                const op = current.find(x => x.id === m.id);
                return op && JSON.stringify(op) !== JSON.stringify(m);
              });
              for (let m of modified) {
                await supabaseService.updateMatch(m);
              }
            }
          } catch (e) {
            reportSyncError("Meciuri", e);
          }
        }, 0);
      }
      return next;
    });
  };

  const setAttendance = (updater) => {
    rawSetAttendance((current) => {
      const next = typeof updater === "function" ? updater(current) : updater;
      if (isSupabaseConfigured && currentUser && currentUser.id !== "guest") {
        setTimeout(async () => {
          try {
            for (let tId of Object.keys(next)) {
              const prevT = current[tId] || {};
              const currT = next[tId] || {};
              for (let pId of Object.keys(currT)) {
                if (currT[pId] !== prevT[pId]) {
                  await supabaseService.saveAttendance(Number(tId), Number(pId), currT[pId]);
                }
              }
              for (let pId of Object.keys(prevT)) {
                if (!(pId in currT)) {
                  await supabaseService.saveAttendance(Number(tId), Number(pId), null);
                }
              }
            }
          } catch (e) {
            reportSyncError("Prezență", e);
          }
        }, 0);
      }
      return next;
    });
  };

  const setPayments = (updater) => {
    rawSetPayments((current) => {
      const next = typeof updater === "function" ? updater(current) : updater;
      if (isSupabaseConfigured && currentUser && currentUser.id !== "guest") {
        setTimeout(async () => {
          try {
            for (let tId of Object.keys(next)) {
              const prevT = current[tId] || {};
              const currT = next[tId] || {};
              for (let pId of Object.keys(currT)) {
                const prevP = prevT[pId] || {};
                const currP = currT[pId] || {};
                if (JSON.stringify(prevP) !== JSON.stringify(currP)) {
                  await supabaseService.saveTrainingPayment(Number(tId), Number(pId), currP);
                }
              }
            }
          } catch (e) {
            reportSyncError("Plăți antrenamente", e);
          }
        }, 0);
      }
      return next;
    });
  };

  const setMonthlyPayments = (updater) => {
    rawSetMonthlyPayments((current) => {
      const next = typeof updater === "function" ? updater(current) : updater;
      if (isSupabaseConfigured && currentUser && currentUser.id !== "guest") {
        setTimeout(async () => {
          try {
            for (let key of Object.keys(next)) {
              const prevKey = current[key] || {};
              const currKey = next[key] || {};
              const dashIndex = key.lastIndexOf("-");
              if (dashIndex === -1) continue;
              const monthLabel = key.substring(0, dashIndex);
              const groupName = key.substring(dashIndex + 1);

              for (let pId of Object.keys(currKey)) {
                const prevP = prevKey[pId] || {};
                const currP = currKey[pId] || {};
                if (JSON.stringify(prevP) !== JSON.stringify(currP)) {
                  await supabaseService.saveMonthlyPayment(monthLabel, groupName, Number(pId), currP);
                }
              }
            }
          } catch (e) {
            reportSyncError("Cotizații lunare", e);
          }
        }, 0);
      }
      return next;
    });
  };

  const setTransactions = (updater) => {
    rawSetTransactions((current) => {
      const next = typeof updater === "function" ? updater(current) : updater;
      if (isSupabaseConfigured && currentUser && currentUser.id !== "guest") {
        setTimeout(async () => {
          try {
            if (next.length > current.length) {
              const added = next.filter(t => !current.some(ot => ot.id === t.id));
              for (let t of added) {
                const dbT = await supabaseService.insertTransaction(t);
                rawSetTransactions(curr => curr.map(x => x.id === t.id ? dbT : x));
              }
            } else if (next.length < current.length) {
              const deleted = current.filter(t => !next.some(ot => ot.id === t.id));
              for (let t of deleted) {
                await supabaseService.deleteTransaction(t.id);
              }
            }
          } catch (e) {
            reportSyncError("Buget", e);
          }
        }, 0);
      }
      return next;
    });
  };

  const setEvents = (updater) => {
    rawSetEvents((current) => {
      const next = typeof updater === "function" ? updater(current) : updater;
      if (isSupabaseConfigured && currentUser && currentUser.id !== "guest") {
        setTimeout(async () => {
          try {
            if (next.length > current.length) {
              const added = next.filter(e => !current.some(oe => oe.id === e.id));
              for (let e of added) {
                const dbE = await supabaseService.insertEvent(e);
                rawSetEvents(curr => curr.map(x => x.id === e.id ? dbE : x));
              }
            } else if (next.length < current.length) {
              const deleted = current.filter(e => !next.some(oe => oe.id === e.id));
              for (let e of deleted) {
                await supabaseService.deleteEvent(e.id);
              }
            }
          } catch (e) {
            reportSyncError("Calendar", e);
          }
        }, 0);
      }
      return next;
    });
  };

  const setDocuments = (updater) => {
    rawSetDocuments((current) => {
      const next = typeof updater === "function" ? updater(current) : updater;
      if (isSupabaseConfigured && currentUser && currentUser.id !== "guest") {
        setTimeout(async () => {
          try {
            if (next.length > current.length) {
              const added = next.filter(d => !current.some(od => od.id === d.id));
              for (let d of added) {
                const dbD = await supabaseService.insertDocument(d);
                rawSetDocuments(curr => curr.map(x => x.id === d.id ? dbD : x));
              }
            } else if (next.length < current.length) {
              const deleted = current.filter(d => !next.some(od => od.id === d.id));
              for (let d of deleted) {
                await supabaseService.deleteDocument(d.id);
              }
            } else {
              const modified = next.filter(d => {
                const op = current.find(x => x.id === d.id);
                return op && JSON.stringify(op) !== JSON.stringify(d);
              });
              for (let d of modified) {
                await supabaseService.updateDocument(d);
              }
            }
          } catch (e) {
            reportSyncError("Documente", e);
          }
        }, 0);
      }
      return next;
    });
  };

  const setEquipment = (updater) => {
    rawSetEquipment((current) => {
      const next = typeof updater === "function" ? updater(current) : updater;
      if (isSupabaseConfigured && currentUser && currentUser.id !== "guest") {
        setTimeout(async () => {
          try {
            if (next.length > current.length) {
              const added = next.filter(e => !current.some(oe => oe.id === e.id));
              for (let e of added) {
                const dbE = await supabaseService.insertEquipment(e);
                rawSetEquipment(curr => curr.map(x => x.id === e.id ? dbE : x));
              }
            } else if (next.length < current.length) {
              const deleted = current.filter(e => !next.some(oe => oe.id === e.id));
              for (let e of deleted) {
                await supabaseService.deleteEquipment(e.id);
              }
            } else {
              const modified = next.filter(e => {
                const op = current.find(x => x.id === e.id);
                return op && JSON.stringify(op) !== JSON.stringify(e);
              });
              for (let e of modified) {
                await supabaseService.updateEquipment(e);
              }
            }
          } catch (e) {
            reportSyncError("Inventar", e);
          }
        }, 0);
      }
      return next;
    });
  };

  const setEvaluations = (updater) => {
    rawSetEvaluations((current) => {
      const next = typeof updater === "function" ? updater(current) : updater;
      if (isSupabaseConfigured && currentUser && currentUser.id !== "guest") {
        setTimeout(async () => {
          try {
            for (let pId of Object.keys(next)) {
              if (JSON.stringify(current[pId]) !== JSON.stringify(next[pId])) {
                await supabaseService.saveEvaluation(Number(pId), next[pId]);
              }
            }
          } catch (e) {
            reportSyncError("Evaluări", e);
          }
        }, 0);
      }
      return next;
    });
  };

  const setDevelopmentPlans = (updater) => {
    rawSetDevelopmentPlans((current) => {
      const next = typeof updater === "function" ? updater(current) : updater;
      if (isSupabaseConfigured && currentUser && currentUser.id !== "guest") {
        setTimeout(async () => {
          try {
            for (let pId of Object.keys(next)) {
              if (JSON.stringify(current[pId]) !== JSON.stringify(next[pId])) {
                await supabaseService.saveDevelopmentPlan(Number(pId), next[pId]);
              }
            }
          } catch (e) {
            reportSyncError("Planuri dezvoltare", e);
          }
        }, 0);
      }
      return next;
    });
  };

  const setDiscipline = (updater) => {
    rawSetDiscipline((current) => {
      const next = typeof updater === "function" ? updater(current) : updater;
      if (isSupabaseConfigured && currentUser && currentUser.id !== "guest") {
        setTimeout(async () => {
          try {
            if (next.length > current.length) {
              const added = next.filter(d => !current.some(od => od.id === d.id));
              for (let d of added) {
                const dbD = await supabaseService.insertDiscipline(d);
                rawSetDiscipline(curr => curr.map(x => x.id === d.id ? dbD : x));
              }
            } else if (next.length < current.length) {
              const deleted = current.filter(d => !next.some(od => od.id === d.id));
              for (let d of deleted) {
                await supabaseService.deleteDiscipline(d.id);
              }
            }
          } catch (e) {
            reportSyncError("Disciplină", e);
          }
        }, 0);
      }
      return next;
    });
  };

  const setChatMessages = (updater) => {
    rawSetChatMessages((current) => {
      const next = typeof updater === "function" ? updater(current) : updater;
      if (isSupabaseConfigured && currentUser && currentUser.id !== "guest") {
        setTimeout(async () => {
          try {
            if (next.length > current.length) {
              const added = next.filter(msg => !current.some(omsg => omsg.id === msg.id));
              for (let msg of added) {
                const dbMsg = await supabaseService.insertChatMessage(msg);
                rawSetChatMessages(curr => curr.map(x => x.id === msg.id ? dbMsg : x));
              }
            }
          } catch (e) {
            reportSyncError("Chat", e);
          }
        }, 0);
      }
      return next;
    });
  };

  const setMediaGallery = (updater) => {
    rawSetMediaGallery((current) => {
      const next = typeof updater === "function" ? updater(current) : updater;
      if (isSupabaseConfigured && currentUser && currentUser.id !== "guest") {
        setTimeout(async () => {
          try {
            if (next.length > current.length) {
              const added = next.filter(m => !current.some(om => om.id === m.id));
              for (let m of added) {
                const dbM = await supabaseService.insertMedia(m);
                rawSetMediaGallery(curr => curr.map(x => x.id === m.id ? dbM : x));
              }
            } else if (next.length < current.length) {
              const deleted = current.filter(m => !next.some(om => om.id === m.id));
              for (let m of deleted) {
                await supabaseService.deleteMedia(m.id);
              }
            }
          } catch (e) {
            reportSyncError("Galerie media", e);
          }
        }, 0);
      }
      return next;
    });
  };

  const setScouting = (updater) => {
    rawSetScouting((current) => {
      const next = typeof updater === "function" ? updater(current) : updater;
      if (isSupabaseConfigured && currentUser && currentUser.id !== "guest") {
        setTimeout(async () => {
          try {
            if (next.length > current.length) {
              const added = next.filter(s => !current.some(os => os.id === s.id));
              for (let s of added) {
                const dbS = await supabaseService.insertScouting(s);
                rawSetScouting(curr => curr.map(x => x.id === s.id ? dbS : x));
              }
            } else if (next.length < current.length) {
              const deleted = current.filter(s => !next.some(os => os.id === s.id));
              for (let s of deleted) {
                await supabaseService.deleteScouting(s.id);
              }
            } else {
              const modified = next.filter(s => {
                const op = current.find(x => x.id === s.id);
                return op && JSON.stringify(op) !== JSON.stringify(s);
              });
              for (let s of modified) {
                await supabaseService.updateScouting(s);
              }
            }
          } catch (e) {
            reportSyncError("Scouting", e);
          }
        }, 0);
      }
      return next;
    });
  };

  const setPlayerObservations = (updater) => {
    rawSetPlayerObservations((current) => {
      const next = typeof updater === "function" ? updater(current) : updater;
      if (isSupabaseConfigured && currentUser && currentUser.id !== "guest") {
        setTimeout(async () => {
          try {
            for (let pId of Object.keys(next)) {
              const prevList = current[pId] || [];
              const currList = next[pId] || [];
              if (currList.length > prevList.length) {
                const added = currList.filter(obs => !prevList.some(o => o.id === obs.id));
                for (let obs of added) {
                  const dbObs = await supabaseService.insertObservation(Number(pId), obs);
                  rawSetPlayerObservations(curr => ({
                    ...curr,
                    [pId]: (curr[pId] || []).map(x => x.id === obs.id ? dbObs : x)
                  }));
                }
              } else if (currList.length < prevList.length) {
                const deleted = prevList.filter(obs => !currList.some(o => o.id === obs.id));
                for (let obs of deleted) {
                  await supabaseService.deleteObservation(obs.id);
                }
              }
            }
          } catch (e) {
            reportSyncError("Observații", e);
          }
        }, 0);
      }
      return next;
    });
  };

  const togglePresence = (id) => rawSetPlayers((current) => current.map((player) => player.id === id ? { ...player, present: !player.present } : player));
  const toggleTask = (id) => setTasks((current) => current.map((task) => task.id === id ? { ...task, done: !task.done } : task));

  const fetchSupabaseProfile = async (sessionUser) => {
    let { data, error } = await supabase
      .from("profiles")
      .select("full_name, role, platform_role, assigned_groups, player_id, child_player_id")
      .eq("id", sessionUser.id)
      .maybeSingle();
    if (error && String(error.message || "").includes("platform_role")) {
      const retry = await supabase
        .from("profiles")
        .select("full_name, role, assigned_groups, player_id, child_player_id")
        .eq("id", sessionUser.id)
        .maybeSingle();
      data = retry.data;
      error = retry.error;
    }
    if (error) throw error;
    return {
      id: sessionUser.id,
      email: sessionUser.email,
      name: data?.full_name || sessionUser.user_metadata?.full_name || sessionUser.email,
      role: data?.platform_role || data?.role || "viewer",
      assignedGroups: data?.assigned_groups || [],
      playerId: data?.player_id,
      childPlayerId: data?.child_player_id,
    };
  };

  const enterApp = async (profile) => {
    setCurrentUser(profile);
    const userMemberships = memberships.filter((item) => item.userId === profile.id);
    const legacyRole = ["admin", "coach", "player", "parent"].includes(profile.role);
    if (userMemberships.length && !userMemberships.some((item) => item.clubId === selectedClubId)) {
      setSelectedClubId(userMemberships[0].clubId);
    }
    const needsOnboarding = profile.id !== "guest" && !isSuperAdmin(profile) && !legacyRole && userMemberships.length === 0;
    setAuthView(needsOnboarding ? "onboarding" : "app");
    const allowedTabs = roleTabs[profile.role] || roleTabs.guest;
    setTab(allowedTabs[0]);
    await AsyncStorage.setItem(STORAGE_KEYS.auth, JSON.stringify(profile));
    if (isSupabaseConfigured && profile && profile.id !== "guest") {
      await loadAllFromSupabase();
    }
  };

  const loginWithEmail = async (email, password) => {
    setAuthLoading(true);
    setAuthError("");
    try {
      if (isSupabaseConfigured) {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        const profile = await fetchSupabaseProfile(data.user);
        await enterApp(profile);
      } else {
        const localUsers = ENABLE_DEMO_MODE ? [...demoUsers, ...registeredUsers] : registeredUsers;
        const localUser = localUsers.find((user) => user.email === email && user.password === password);
        if (!localUser) throw new Error("Email sau parolă greșită. Creează un cont sau conectează Supabase.");
        await enterApp(localUser);
      }
    } catch (error) {
      setAuthError(error.message || "Autentificarea a eșuat.");
    } finally {
      setAuthLoading(false);
    }
  };

  const loginWithGoogle = async () => {
    setAuthError("");
    if (!isSupabaseConfigured) {
      setAuthError("Google login devine activ după configurarea cheilor Supabase.");
      return;
    }
    const { error } = await supabase.auth.signInWithOAuth({ provider: "google" });
    if (error) setAuthError(error.message);
  };

  const forgotPassword = async (email) => {
    if (!email.includes("@")) {
      setAuthError("Introdu emailul înainte de resetarea parolei.");
      return;
    }
    if (!isSupabaseConfigured) {
      setAuthError("Resetarea parolei devine activă după conectarea Supabase.");
      return;
    }
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    setAuthError(error ? error.message : "Ți-am trimis email pentru resetarea parolei.");
  };

  const registerPlayerAccount = async (form) => {
    setAuthLoading(true);
    setAuthError("");
    try {
      if (isSupabaseConfigured) {
        const { data, error } = await supabase.auth.signUp({
          email: form.email,
          password: form.password,
          options: {
            data: {
              full_name: form.name,
              group_name: form.group,
              player_no: Number(form.no) || null,
              player_position: form.role,
            },
          },
        });
        if (error) throw error;
        if (data.session?.user) {
          const profile = await fetchSupabaseProfile(data.session.user);
          await enterApp(profile);
        } else {
          setAuthError("Cont creat. Verifică emailul pentru confirmare, apoi autentifică-te.");
          setAuthView("login");
        }
        return;
      }

      const localUsers = ENABLE_DEMO_MODE ? [...demoUsers, ...registeredUsers] : registeredUsers;
      const existing = localUsers.some((user) => user.email === form.email);
      if (existing) throw new Error("Există deja un cont cu acest email.");
      const accountId = Date.now();
      const profile = {
        id: `local-${accountId}`,
        email: form.email,
        password: form.password,
        name: form.name,
        role: "viewer",
        assignedGroups: [form.group],
      };
      const updatedUsers = [...registeredUsers, profile];
      setRegisteredUsers(updatedUsers);
      await AsyncStorage.setItem(STORAGE_KEYS.registeredUsers, JSON.stringify(updatedUsers));
      await enterApp(profile);
    } catch (error) {
      setAuthError(error.message || "Nu am putut crea contul.");
    } finally {
      setAuthLoading(false);
    }
  };

  const createClubForCurrentUser = async (form) => {
    if (!currentUser || currentUser.id === "guest") {
      setAuthError("Autentifica-te inainte de a crea un club.");
      return;
    }
    setAuthLoading(true);
    setAuthError("");
    try {
      const clubId = `club-${Date.now()}`;
      const club = {
        id: clubId,
        name: form.name.trim(),
        logo: form.logo?.trim() || "",
        city: form.city?.trim() || "",
        country: form.country?.trim() || "",
        email: form.email?.trim().toLowerCase() || "",
        phone: form.phone?.trim() || "",
        description: form.description?.trim() || "",
        groups: form.groups?.length ? form.groups : clubGroups,
        status: "active",
        blocked: false,
        plan: "Free",
        createdAt: nowLabel(),
      };
      const subscription = {
        id: `sub-${clubId}`,
        clubId,
        planName: "Free",
        status: "active",
        maxPlayers: subscriptionPlans.Free.maxPlayers,
        startedAt: nowLabel(),
        expiresAt: "",
        createdAt: nowLabel(),
      };
      const membership = {
        id: `member-${clubId}-${currentUser.id}`,
        userId: currentUser.id,
        clubId,
        role: "club_owner",
        assignedGroups: club.groups,
        playerId: null,
        childPlayerIds: [],
        createdAt: nowLabel(),
      };
      if (isSupabaseConfigured && supabaseService.insertClub) {
        await supabaseService.insertClub(club);
        await supabaseService.insertMembership(membership);
        await supabaseService.insertSubscription(subscription);
      }
      setClubs((current) => [club, ...current]);
      setSubscriptions((current) => [subscription, ...current]);
      setMemberships((current) => [membership, ...current]);
      setSelectedClubId(clubId);
      setAuthView("app");
      setTab("Panou");
      showAppMessage("Club creat", `${club.name} este gata. Tu esti club_owner.`);
    } catch (error) {
      setAuthError(error.message || "Nu am putut crea clubul.");
    } finally {
      setAuthLoading(false);
    }
  };

  const acceptClubInvitation = async (tokenOrEmail) => {
    const lookup = tokenOrEmail?.trim().toLowerCase() || currentUser?.email?.toLowerCase();
    if (!lookup) {
      setAuthError("Introdu tokenul invitatiei sau emailul tau.");
      return;
    }
    const invite = invitations.find((item) =>
      item.status === "pending" && (item.token?.toLowerCase() === lookup || item.email?.toLowerCase() === lookup)
    );
    if (!invite) {
      setAuthError("Nu am gasit o invitatie pending pentru acest token/email.");
      return;
    }
    const membership = {
      id: `member-${invite.clubId}-${currentUser.id}`,
      userId: currentUser.id,
      clubId: invite.clubId,
      role: invite.role,
      assignedGroups: clubs.find((club) => club.id === invite.clubId)?.groups || clubGroups,
      playerId: currentUser.playerId || null,
      childPlayerIds: currentUser.childPlayerId ? [currentUser.childPlayerId] : [],
      createdAt: nowLabel(),
    };
    try {
      if (isSupabaseConfigured && supabaseService.acceptInvitation) {
        await supabaseService.acceptInvitation(invite.token, membership);
      }
      setMemberships((current) => [membership, ...current.filter((item) => !(item.userId === currentUser.id && item.clubId === invite.clubId))]);
      setInvitations((current) => current.map((item) => item.id === invite.id ? { ...item, status: "accepted", acceptedAt: nowLabel() } : item));
      setSelectedClubId(invite.clubId);
      setAuthView("app");
      setTab("Panou");
      showAppMessage("Invitatie acceptata", "Accesul la club a fost activat.");
    } catch (error) {
      setAuthError(error.message || "Nu am putut accepta invitatia.");
    }
  };

  const continueAsGuest = async () => {
    await enterApp({ id: "guest", name: "Vizitator", role: "guest", assignedGroups: [] });
  };

  const logout = async () => {
    if (isSupabaseConfigured) await supabase.auth.signOut();
    await AsyncStorage.removeItem(STORAGE_KEYS.auth);
    setCurrentUser(null);
    setAuthView("welcome");
    setTab("Panou");
  };

  useEffect(() => {
    if (typeof window === "undefined" || typeof document === "undefined") return;
    document.title = "FC Autentic";
    const manifest = document.querySelector('link[rel="manifest"]');
    if (manifest) manifest.remove();
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.getRegistrations?.().then((registrations) => {
        registrations.forEach((registration) => registration.unregister());
      }).catch(() => {});
    }
  }, []);

  useEffect(() => {
    const loadTrainingData = async () => {
      try {
        const saved = await AsyncStorage.getItem(STORAGE_KEYS.appData);
        const savedAuth = await AsyncStorage.getItem(STORAGE_KEYS.auth);
        const savedRegisteredUsers = await AsyncStorage.getItem(STORAGE_KEYS.registeredUsers);
        if (savedRegisteredUsers) setRegisteredUsers(JSON.parse(savedRegisteredUsers));
        
        let activeProfile = null;
        if (savedAuth) {
          const parsedAuth = JSON.parse(savedAuth);
          if (!ENABLE_DEMO_MODE && String(parsedAuth.id || "").startsWith("demo-")) {
            await AsyncStorage.removeItem(STORAGE_KEYS.auth);
          } else {
            activeProfile = parsedAuth;
            setCurrentUser(activeProfile);
            setAuthView("app");
            setTab((roleTabs[activeProfile.role] || roleTabs.guest)[0]);
          }
        }
        if (isSupabaseConfigured) {
          const { data } = await supabase.auth.getSession();
          if (data.session?.user) {
            const profile = await fetchSupabaseProfile(data.session.user);
            activeProfile = profile;
            setCurrentUser(profile);
            setAuthView("app");
            setTab((roleTabs[profile.role] || roleTabs.guest)[0]);
          }
        }
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed.players) rawSetPlayers(attachClubIdList(parsed.players));
          if (parsed.trainings) rawSetTrainings(attachClubIdList(parsed.trainings));
          if (parsed.matches) rawSetMatches(attachClubIdList(parsed.matches));
          if (parsed.attendance) rawSetAttendance(parsed.attendance);
          if (parsed.payments) rawSetPayments(parsed.payments);
          if (parsed.monthlyPayments) rawSetMonthlyPayments(parsed.monthlyPayments);
          if (parsed.events) rawSetEvents(attachClubIdList(parsed.events));
          if (parsed.transactions) rawSetTransactions(attachClubIdList(parsed.transactions));
          if (parsed.clubSettings) setClubSettings(parsed.clubSettings);
          if (parsed.documents) rawSetDocuments(attachClubIdList(parsed.documents));
          if (parsed.announcements) setAnnouncements(parsed.announcements);
          if (parsed.playerObservations) rawSetPlayerObservations(parsed.playerObservations);
          if (parsed.equipment) rawSetEquipment(attachClubIdList(parsed.equipment));
          if (parsed.evaluations) rawSetEvaluations(parsed.evaluations);
          if (parsed.developmentPlans) rawSetDevelopmentPlans(parsed.developmentPlans);
          if (parsed.discipline) rawSetDiscipline(attachClubIdList(parsed.discipline));
          if (parsed.chatMessages) rawSetChatMessages(attachClubIdList(parsed.chatMessages));
          if (parsed.mediaGallery) rawSetMediaGallery(attachClubIdList(parsed.mediaGallery));
          if (parsed.scouting) rawSetScouting(attachClubIdList(parsed.scouting));
          if (parsed.clubs) setClubs(parsed.clubs.length ? parsed.clubs : [defaultClub]);
          if (parsed.selectedClubId) setSelectedClubId(parsed.selectedClubId);
          if (parsed.memberships) setMemberships(parsed.memberships);
          if (parsed.subscriptions) setSubscriptions(parsed.subscriptions.length ? parsed.subscriptions : [defaultSubscription]);
          if (parsed.invitations) setInvitations(parsed.invitations);
        }
        if (isSupabaseConfigured && activeProfile && activeProfile.id !== "guest") {
          await loadAllFromSupabase();
        }
      } catch (err) {
        console.warn("Eroare la revalidarea datelor din Supabase:", err);
      } finally {
        setHydrated(true);
      }
    };
    loadTrainingData();
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    AsyncStorage.setItem(STORAGE_KEYS.appData, JSON.stringify({ players, trainings, matches, attendance, payments, monthlyPayments, events, transactions, clubSettings, documents, announcements, playerObservations, equipment, evaluations, developmentPlans, discipline, chatMessages, mediaGallery, scouting, clubs, selectedClubId, memberships, subscriptions, invitations }));
  }, [players, trainings, matches, attendance, payments, monthlyPayments, events, transactions, clubSettings, documents, announcements, playerObservations, equipment, evaluations, developmentPlans, discipline, chatMessages, mediaGallery, scouting, clubs, selectedClubId, memberships, subscriptions, invitations, hydrated]);

  useEffect(() => {
    if (!hydrated || !currentUser || authView !== "app") return;
    const legacyRole = ["admin", "coach", "player", "parent"].includes(currentUser.role);
    const hasMembership = memberships.some((item) => item.userId === currentUser.id);
    if (currentUser.id !== "guest" && !isSuperAdmin(currentUser) && !legacyRole && !hasMembership) {
      setAuthView("onboarding");
    }
  }, [hydrated, currentUser, memberships, authView]);

  const selectedClub = clubs.find((club) => club.id === selectedClubId) || clubs[0] || defaultClub;
  const selectedSubscription = getClubSubscription(subscriptions, selectedClub?.id);
  const currentMembership = memberships.find((item) => item.userId === currentUser?.id && item.clubId === selectedClub?.id);
  const effectiveUser = currentUser ? {
    ...currentUser,
    role: isSuperAdmin(currentUser) ? "super_admin" : (currentMembership?.role || normalizeRole(currentUser.role)),
    assignedGroups: currentMembership?.assignedGroups || currentUser.assignedGroups || [],
    playerId: currentMembership?.playerId ?? currentUser.playerId,
    childPlayerId: currentMembership?.childPlayerId ?? currentUser.childPlayerId,
    childPlayerIds: currentMembership?.childPlayerIds || currentUser.childPlayerIds || [],
    clubId: selectedClub?.id,
  } : null;
  const clubPlayers = filterByClub(players, selectedClub?.id);
  const clubTrainings = filterByClub(trainings, selectedClub?.id);
  const clubMatches = filterByClub(matches, selectedClub?.id);
  const clubEvents = filterByClub(events, selectedClub?.id);
  const clubTransactions = filterByClub(transactions, selectedClub?.id);
  const clubDocuments = filterByClub(documents, selectedClub?.id);
  const clubEquipment = filterByClub(equipment, selectedClub?.id);
  const clubDiscipline = filterByClub(discipline, selectedClub?.id);
  const clubChatMessages = filterByClub(chatMessages, selectedClub?.id);
  const clubMediaGallery = filterByClub(mediaGallery, selectedClub?.id);
  const clubScouting = filterByClub(scouting, selectedClub?.id);
  const allowedRoutes = roleRoutes[effectiveUser?.role] || roleRoutes.guest;
  const activeTabs = roleTabs[effectiveUser?.role] || roleTabs.guest;
  const safeTab = tab === "Notif." ? "Notif." : (allowedRoutes.includes(tab) ? tab : activeTabs[0]);
  const rolePlayers = filterPlayersByUser(players, effectiveUser, selectedClub?.id);
  const roleTrainings = filterTrainingsByUser(trainings, effectiveUser, players, selectedClub?.id);
  const roleMatches = filterMatchesByUser(matches, effectiveUser, players, selectedClub?.id);

  const pages = {
    Panou: isSuperAdmin(effectiveUser)
      ? <SaasAdminPage clubs={clubs} players={players} memberships={memberships} subscriptions={subscriptions} setClubs={setClubs} />
      : <Dashboard tasks={tasks} toggleTask={toggleTask} players={rolePlayers} trainings={roleTrainings} matches={roleMatches} attendance={attendance} transactions={clubTransactions} payments={payments} monthlyPayments={monthlyPayments} clubSettings={clubSettings} currentUser={effectiveUser} setTab={setTab} selectedClub={selectedClub} subscription={selectedSubscription} invitations={invitations} memberships={memberships} />,
    Admin: <SaasAdminPage clubs={clubs} players={players} memberships={memberships} subscriptions={subscriptions} setClubs={setClubs} />,
    Echipă: <Team players={clubPlayers} setPlayers={setPlayers} currentUser={effectiveUser} trainings={clubTrainings} attendance={attendance} payments={payments} monthlyPayments={monthlyPayments} matches={clubMatches} clubSettings={clubSettings} playerObservations={playerObservations} setPlayerObservations={setPlayerObservations} selectedClub={selectedClub} subscription={selectedSubscription} />,
    "Antren.": <Trainings players={clubPlayers} trainings={clubTrainings} setTrainings={setTrainings} attendance={attendance} setAttendance={setAttendance} currentUser={effectiveUser} playerObservations={playerObservations} setPlayerObservations={setPlayerObservations} selectedClub={selectedClub} subscription={selectedSubscription} />,
    Meciuri: <MatchesPage players={clubPlayers} matches={clubMatches} setMatches={setMatches} currentUser={effectiveUser} playerObservations={playerObservations} setPlayerObservations={setPlayerObservations} selectedClub={selectedClub} />,
    Calendar: <Calendar trainings={clubTrainings} matches={clubMatches} events={clubEvents} setEvents={setEvents} currentUser={effectiveUser} players={clubPlayers} selectedClub={selectedClub} />,
    "Notif.": <NotificationsPage currentUser={effectiveUser} players={clubPlayers} trainings={clubTrainings} attendance={attendance} matches={clubMatches} monthlyPayments={monthlyPayments} documents={clubDocuments} clubSettings={clubSettings} />,
    Finanțe: canManageFinance(effectiveUser) ? <Finances players={clubPlayers} trainings={clubTrainings} payments={payments} setPayments={setPayments} monthlyPayments={monthlyPayments} setMonthlyPayments={setMonthlyPayments} transactions={clubTransactions} setTransactions={setTransactions} clubSettings={clubSettings} selectedClub={selectedClub} /> : null,
    "Mai mult": <More currentUser={effectiveUser} onLogout={logout} setTab={setTab} players={clubPlayers} setPlayers={setPlayers} trainings={clubTrainings} matches={clubMatches} attendance={attendance} payments={payments} monthlyPayments={monthlyPayments} clubSettings={clubSettings} setClubSettings={setClubSettings} documents={clubDocuments} setDocuments={setDocuments} announcements={announcements} setAnnouncements={setAnnouncements} playerObservations={playerObservations} equipment={clubEquipment} setEquipment={setEquipment} evaluations={evaluations} setEvaluations={setEvaluations} developmentPlans={developmentPlans} setDevelopmentPlans={setDevelopmentPlans} discipline={clubDiscipline} setDiscipline={setDiscipline} chatMessages={clubChatMessages} setChatMessages={setChatMessages} mediaGallery={clubMediaGallery} setMediaGallery={setMediaGallery} scouting={clubScouting} setScouting={setScouting} selectedClub={selectedClub} clubs={clubs} setSelectedClubId={setSelectedClubId} subscriptions={subscriptions} setSubscriptions={setSubscriptions} invitations={invitations} setInvitations={setInvitations} memberships={memberships} setMemberships={setMemberships} />,
  };

  if (authView === "welcome") {
    return <WelcomeScreen onLogin={() => setAuthView("login")} onGuest={continueAsGuest} />;
  }

  if (authView === "login") {
    return <LoginScreen onBack={() => setAuthView("welcome")} onLogin={loginWithEmail} onGoogle={loginWithGoogle} onForgot={forgotPassword} onRegister={() => { setAuthError(""); setAuthView("register"); }} loading={authLoading} error={authError} />;
  }

  if (authView === "register") {
    return <RegisterPlayerScreen onBack={() => { setAuthError(""); setAuthView("login"); }} onRegister={registerPlayerAccount} loading={authLoading} error={authError} />;
  }

  if (authView === "onboarding") {
    return <OnboardingScreen currentUser={currentUser} invitations={invitations} onCreateClub={() => { setAuthError(""); setAuthView("create-club"); }} onAcceptInvitation={acceptClubInvitation} onLogout={logout} error={authError} />;
  }

  if (authView === "create-club") {
    return <CreateClubScreen onBack={() => { setAuthError(""); setAuthView("onboarding"); }} onCreate={createClubForCurrentUser} loading={authLoading} error={authError} />;
  }

  return (
    <NavigationContext.Provider value={{ openNotifications: () => setTab("Notif.") }}>
      <SafeAreaView style={styles.safe}>
        <StatusBar barStyle="light-content" backgroundColor={C.navy} />
        <View style={styles.app}>{pages[safeTab]}</View>
        <View style={styles.tabBar}>
          <View style={styles.tabBarContent}>
            {activeTabs.map((label) => {
              const icon = tabIcons[label];
              const active = tab === label || (label === "Mai mult" && !activeTabs.includes(tab) && tab !== "Notif.");
              return (
                <Pressable style={styles.tab} key={label} onPress={() => setTab(label)}>
                  <View style={[styles.tabIconWrap, active && styles.tabIconActive]}>
                    <Ionicons name={active ? icon : `${icon}-outline`} size={21} color={active ? C.white : C.muted} />
                  </View>
                  <Text style={[styles.tabText, active && styles.tabTextActive]}>{label}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>
        <ToastHost />
      </SafeAreaView>
    </NavigationContext.Provider>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.navy },
  app: { flex: 1 },
  content: { padding: 18, paddingBottom: 32 },
  topBar: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 10, marginBottom: 22 },
  topTitleWrap: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 4 },
  eyebrow: { color: C.blue, fontSize: 9, fontWeight: "900", letterSpacing: 1.7, textAlign: "center" },
  pageTitle: { color: C.white, fontSize: 27, fontWeight: "900", marginTop: 4, textAlign: "center" },
  logoWrap: { width: 52, height: 52, borderRadius: 17, backgroundColor: C.panel, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: C.line },
  topNotifyButton: { width: 52, height: 52, borderRadius: 17, backgroundColor: C.panel, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: C.line },
  controlCard: { backgroundColor: C.panel, borderRadius: 23, padding: 17, borderWidth: 1, borderColor: C.line },
  controlTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingBottom: 17, borderBottomWidth: 1, borderBottomColor: C.line },
  controlKicker: { color: C.muted, fontSize: 9, fontWeight: "800", letterSpacing: 1.3 },
  controlTitle: { color: C.white, fontSize: 18, fontWeight: "800", marginTop: 4 },
  livePill: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: `${C.green}18`, paddingVertical: 7, paddingHorizontal: 10, borderRadius: 20 },
  liveDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: C.green },
  liveText: { color: C.green, fontSize: 9, fontWeight: "900" },
  personalCard: { flexDirection: "row", alignItems: "center", gap: 13, backgroundColor: C.panel, borderRadius: 23, padding: 17, borderWidth: 1, borderColor: C.line },
  personalIcon: { width: 58, height: 58, borderRadius: 18, backgroundColor: `${C.blue}16`, alignItems: "center", justifyContent: "center" },
  personalInfo: { flex: 1 },
  personalTitle: { color: C.white, fontSize: 18, fontWeight: "900", marginTop: 4 },
  personalText: { color: C.muted, fontSize: 10, lineHeight: 15, marginTop: 5 },
  welcomeScreen: { flex: 1, backgroundColor: C.navy, padding: 24, justifyContent: "center", overflow: "hidden" },
  ballGlow: { position: "absolute", width: 290, height: 290, borderRadius: 145, backgroundColor: `${C.blue}24`, top: -70, right: -80 },
  pitchLineOne: { position: "absolute", width: 460, height: 460, borderRadius: 230, borderWidth: 1, borderColor: `${C.white}12`, left: -220, bottom: -90 },
  pitchLineTwo: { position: "absolute", width: 180, height: 180, borderRadius: 90, borderWidth: 1, borderColor: `${C.red}35`, right: -40, bottom: 80 },
  welcomeCard: { backgroundColor: "rgba(14,41,64,0.92)", borderRadius: 30, padding: 24, alignItems: "center", borderWidth: 1, borderColor: C.line },
  welcomeLogo: { width: 164, height: 164, borderRadius: 52, backgroundColor: C.navy, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: C.line },
  welcomeClub: { color: C.white, fontSize: 34, fontWeight: "900", marginTop: 18 },
  welcomeTitle: { color: C.blue, fontSize: 16, fontWeight: "900", textAlign: "center", marginTop: 7 },
  welcomeText: { color: C.muted, fontSize: 12, lineHeight: 19, textAlign: "center", marginTop: 10, marginBottom: 20 },
  welcomePrimary: { width: "100%", flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 9, backgroundColor: C.red, borderRadius: 16, paddingVertical: 15 },
  welcomePrimaryText: { color: C.white, fontSize: 13, fontWeight: "900" },
  welcomeSecondary: { width: "100%", alignItems: "center", borderWidth: 1, borderColor: C.blue, borderRadius: 16, paddingVertical: 14, marginTop: 10 },
  welcomeSecondaryText: { color: C.blue, fontSize: 12, fontWeight: "900" },
  supabaseHint: { color: C.muted, fontSize: 9, marginTop: 14 },
  loginContent: { padding: 18, paddingBottom: 34 },
  loginHero: { alignItems: "center", backgroundColor: C.panel, borderRadius: 24, padding: 20, borderWidth: 1, borderColor: C.line, marginBottom: 14 },
  loginTitle: { color: C.white, fontSize: 27, fontWeight: "900", marginTop: 10 },
  loginSubtitle: { color: C.muted, fontSize: 11, marginTop: 5 },
  passwordWrap: { flexDirection: "row", alignItems: "center", backgroundColor: C.navy, borderWidth: 1, borderColor: C.line, borderRadius: 12, paddingRight: 12, marginBottom: 12 },
  passwordInput: { flex: 1, color: C.white, paddingHorizontal: 12, paddingVertical: 12, fontSize: 12 },
  authError: { color: C.amber, fontSize: 11, lineHeight: 16, marginBottom: 10 },
  googleButton: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, backgroundColor: C.panel2, borderRadius: 14, padding: 14, marginTop: 10 },
  googleButtonText: { color: C.white, fontSize: 12, fontWeight: "900" },
  forgotText: { color: C.blue, textAlign: "center", fontSize: 12, fontWeight: "800", marginTop: 14 },
  createAccountButton: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, borderWidth: 1, borderColor: C.blue, borderRadius: 14, padding: 13, marginTop: 12 },
  createAccountText: { color: C.blue, fontSize: 12, fontWeight: "900" },
  demoBox: { backgroundColor: `${C.blue}12`, borderRadius: 16, padding: 14, marginTop: 14, borderWidth: 1, borderColor: `${C.blue}30` },
  demoTitle: { color: C.white, fontSize: 12, fontWeight: "900", marginBottom: 7 },
  demoText: { color: C.muted, fontSize: 10, lineHeight: 16 },
  metricsRow: { flexDirection: "row", marginTop: 17 },
  metric: { flex: 1, alignItems: "center" },
  metricIcon: { width: 38, height: 38, borderRadius: 12, alignItems: "center", justifyContent: "center", marginBottom: 7 },
  metricValue: { color: C.white, fontSize: 17, fontWeight: "900" },
  metricLabel: { color: C.muted, fontSize: 9, marginTop: 2 },
  sectionHead: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 24, marginBottom: 11 },
  sectionTitle: { color: C.white, fontSize: 18, fontWeight: "800" },
  sectionAction: { color: C.blue, fontSize: 12, fontWeight: "700" },
  nextEvent: { backgroundColor: C.panel, borderRadius: 18, padding: 14, flexDirection: "row", alignItems: "center", borderLeftWidth: 3, borderLeftColor: C.red },
  dateBlock: { width: 52, height: 58, borderRadius: 13, backgroundColor: C.panel2, alignItems: "center", justifyContent: "center" },
  dateDay: { color: C.white, fontSize: 22, fontWeight: "900" },
  dateMonth: { color: C.red, fontSize: 9, fontWeight: "900" },
  eventInfo: { flex: 1, marginLeft: 13 },
  eventTag: { color: C.red, fontSize: 9, fontWeight: "900", letterSpacing: 0.7 },
  eventTitle: { color: C.white, fontSize: 14, fontWeight: "800", marginTop: 4 },
  eventMeta: { color: C.muted, fontSize: 10, marginTop: 5 },
  taskList: { backgroundColor: C.panel, borderRadius: 18, paddingHorizontal: 14 },
  taskRow: { flexDirection: "row", alignItems: "center", paddingVertical: 13, borderBottomWidth: 1, borderBottomColor: C.line },
  check: { width: 23, height: 23, borderRadius: 7, borderWidth: 2, borderColor: C.muted, alignItems: "center", justifyContent: "center" },
  checkDone: { backgroundColor: C.green, borderColor: C.green },
  taskTextWrap: { flex: 1, marginLeft: 11 },
  taskText: { color: C.white, fontSize: 12, fontWeight: "700" },
  taskTextDone: { color: C.muted, textDecorationLine: "line-through" },
  taskMeta: { color: C.muted, fontSize: 9, marginTop: 3 },
  priority: { paddingVertical: 5, paddingHorizontal: 7, borderRadius: 7 },
  priorityText: { fontSize: 7, fontWeight: "900" },
  emptyState: { alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 18 },
  emptyStateText: { color: C.muted, fontSize: 11, fontWeight: "700" },
  quickGrid: { flexDirection: "row", gap: 8 },
  quickButton: { flex: 1, alignItems: "center", backgroundColor: C.panel, borderRadius: 15, paddingVertical: 13 },
  quickIcon: { width: 42, height: 42, borderRadius: 13, alignItems: "center", justifyContent: "center" },
  quickLabel: { color: C.white, fontSize: 9, fontWeight: "700", marginTop: 7 },
  shortcutGrid: { flexDirection: "row", gap: 10, marginBottom: 12 },
  shortcutCard: { flex: 1, backgroundColor: C.panel, borderRadius: 17, padding: 13, borderWidth: 1, borderColor: C.line },
  shortcutIcon: { width: 38, height: 38, borderRadius: 12, backgroundColor: `${C.blue}16`, alignItems: "center", justifyContent: "center", marginBottom: 9 },
  shortcutTitle: { color: C.white, fontSize: 13, fontWeight: "900" },
  shortcutMeta: { color: C.muted, fontSize: 9, marginTop: 4 },
  summaryStrip: { flexDirection: "row", alignItems: "center", justifyContent: "space-around", backgroundColor: C.panel, borderRadius: 19, padding: 17, marginBottom: 14 },
  summaryValue: { color: C.white, fontSize: 22, fontWeight: "900", textAlign: "center" },
  summaryLabel: { color: C.muted, fontSize: 9, marginTop: 3, textAlign: "center" },
  summaryDivider: { width: 1, height: 38, backgroundColor: C.line },
  teamGroups: { width: "100%", flexDirection: "row", flexWrap: "wrap", gap: 9, paddingBottom: 14 },
  teamGroupCard: { flexGrow: 1, flexBasis: "45%", maxWidth: "48.7%", backgroundColor: C.panel, borderRadius: 16, padding: 12, borderWidth: 1, borderColor: C.line },
  teamGroupCardActive: { backgroundColor: C.red, borderColor: C.red },
  teamGroupIcon: { width: 36, height: 36, borderRadius: 11, backgroundColor: `${C.blue}18`, alignItems: "center", justifyContent: "center", marginBottom: 10 },
  teamGroupIconActive: { backgroundColor: "rgba(255,255,255,0.18)" },
  teamGroupName: { color: C.white, fontSize: 14, fontWeight: "900" },
  teamGroupNameActive: { color: C.white },
  teamGroupCount: { color: C.muted, fontSize: 8, marginTop: 4 },
  teamGroupCountActive: { color: "rgba(255,255,255,0.75)" },
  selectedGroupHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 18, marginBottom: 2 },
  selectedGroupEyebrow: { color: C.blue, fontSize: 8, fontWeight: "900", letterSpacing: 1.1 },
  selectedGroupTitle: { color: C.white, fontSize: 20, fontWeight: "900", marginTop: 3 },
  selectedGroupBadge: { width: 34, height: 34, borderRadius: 11, backgroundColor: C.panel2, alignItems: "center", justifyContent: "center" },
  selectedGroupBadgeText: { color: C.blue, fontSize: 13, fontWeight: "900" },
  attendanceHint: { flexDirection: "row", gap: 8, backgroundColor: `${C.blue}13`, padding: 11, borderRadius: 12, marginBottom: 8 },
  attendanceHintText: { flex: 1, color: C.muted, fontSize: 10, lineHeight: 15 },
  playerRow: { flexDirection: "row", alignItems: "center", backgroundColor: C.panel, borderRadius: 15, padding: 11, marginTop: 8 },
  playerNo: { color: C.red, width: 26, fontSize: 17, fontWeight: "900", textAlign: "center" },
  avatar: { width: 43, height: 43, borderRadius: 14, backgroundColor: C.panel2, alignItems: "center", justifyContent: "center", marginHorizontal: 10 },
  playerInfo: { flex: 1 },
  playerName: { color: C.white, fontSize: 13, fontWeight: "800" },
  playerRole: { color: C.muted, fontSize: 9, marginTop: 4 },
  presence: { width: 30, height: 30, borderRadius: 10, borderWidth: 2, borderColor: C.muted, alignItems: "center", justifyContent: "center" },
  presenceOn: { backgroundColor: C.green, borderColor: C.green },
  outlineButton: { flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 8, borderWidth: 1, borderColor: C.blue, borderRadius: 14, padding: 13, marginTop: 15 },
  outlineButtonText: { color: C.blue, fontWeight: "800" },
  readOnlyNotice: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: `${C.blue}12`, borderRadius: 14, padding: 12, marginTop: 14 },
  readOnlyNoticeText: { flex: 1, color: C.muted, fontSize: 10, lineHeight: 15 },
  monthBar: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: C.panel, padding: 14, borderRadius: 15, marginBottom: 13 },
  monthText: { color: C.white, fontWeight: "800", fontSize: 15 },
  scheduleCard: { flexDirection: "row", alignItems: "center", backgroundColor: C.panel, borderRadius: 17, padding: 13, marginBottom: 10 },
  scheduleDate: { width: 42, alignItems: "center" },
  scheduleDay: { color: C.red, fontSize: 8, fontWeight: "900" },
  scheduleNumber: { color: C.white, fontSize: 21, fontWeight: "900", marginTop: 3 },
  scheduleIcon: { width: 45, height: 45, borderRadius: 14, alignItems: "center", justifyContent: "center", marginHorizontal: 11 },
  scheduleInfo: { flex: 1 },
  scheduleType: { color: C.white, fontSize: 14, fontWeight: "800" },
  scheduleDetail: { color: C.muted, fontSize: 10, marginTop: 5 },
  primaryButton: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, backgroundColor: C.red, borderRadius: 14, padding: 14, marginTop: 8 },
  primaryButtonText: { color: C.white, fontWeight: "900", fontSize: 12 },
  secondaryButton: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, borderWidth: 1, borderColor: C.line, backgroundColor: C.panel, borderRadius: 14, padding: 13, marginTop: 10 },
  secondaryButtonText: { color: C.blue, fontWeight: "900", fontSize: 12 },
  subscriptionCard: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12, backgroundColor: C.panel, borderWidth: 1, borderColor: C.line, borderRadius: 18, padding: 14, marginBottom: 10 },
  subscriptionCardActive: { borderColor: C.amber, backgroundColor: "#17314A" },
  subscriptionTitle: { color: C.white, fontWeight: "900", fontSize: 15 },
  subscriptionMeta: { color: C.muted, fontSize: 11, marginTop: 4 },
  subscriptionPrice: { color: C.amber, fontWeight: "900", fontSize: 13 },
  balanceCard: { backgroundColor: C.panel, borderRadius: 22, padding: 20, alignItems: "center", borderWidth: 1, borderColor: C.line },
  balanceLabel: { color: C.muted, fontSize: 9, fontWeight: "800", letterSpacing: 1.5 },
  balanceValue: { color: C.white, fontSize: 35, fontWeight: "900", marginVertical: 10 },
  balanceCurrency: { color: C.blue, fontSize: 14 },
  financeStats: { width: "100%", flexDirection: "row", justifyContent: "space-around", alignItems: "center", borderTopWidth: 1, borderTopColor: C.line, paddingTop: 15 },
  financeMiniLabel: { color: C.muted, fontSize: 8, fontWeight: "800", textAlign: "center" },
  financeMiniValue: { fontSize: 15, fontWeight: "900", marginTop: 4 },
  transaction: { flexDirection: "row", alignItems: "center", backgroundColor: C.panel, borderRadius: 14, padding: 12, marginBottom: 8 },
  transactionIcon: { width: 39, height: 39, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  transactionInfo: { flex: 1, marginLeft: 10 },
  transactionName: { color: C.white, fontSize: 12, fontWeight: "700" },
  transactionDate: { color: C.muted, fontSize: 9, marginTop: 3 },
  transactionAmount: { fontSize: 11, fontWeight: "900" },
  financeButtons: { flexDirection: "row", gap: 10, marginTop: 10 },
  smallButton: { flex: 1, flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 7, padding: 13, borderRadius: 13 },
  smallButtonText: { color: C.white, fontSize: 11, fontWeight: "900" },
  financeViewToggle: { flexDirection: "row", backgroundColor: C.panel, padding: 4, borderRadius: 14, marginBottom: 17 },
  financeViewButton: { flex: 1, alignItems: "center", paddingVertical: 11, borderRadius: 11 },
  financeViewActive: { backgroundColor: C.panel2 },
  financeViewText: { color: C.muted, fontSize: 10, fontWeight: "800" },
  financeViewTextActive: { color: C.white },
  paymentSectionLabel: { color: C.muted, fontSize: 9, fontWeight: "900", letterSpacing: 1.2, marginBottom: 9 },
  paymentTrainingList: { width: "100%", flexDirection: "row", flexWrap: "wrap", gap: 8, paddingBottom: 14 },
  paymentTrainingChip: { flexGrow: 1, flexBasis: "31%", maxWidth: "48.8%", backgroundColor: C.panel, borderRadius: 13, paddingVertical: 10, paddingHorizontal: 12, borderWidth: 1, borderColor: C.line },
  paymentTrainingChipActive: { backgroundColor: C.red, borderColor: C.red },
  paymentTrainingGroup: { color: C.blue, fontSize: 9, fontWeight: "900" },
  paymentTrainingDate: { color: C.muted, fontSize: 8, marginTop: 4 },
  paymentHero: { backgroundColor: C.panel, borderRadius: 20, padding: 16, borderWidth: 1, borderColor: C.line },
  paymentHeroTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  paymentHeroTag: { color: C.blue, fontSize: 9, fontWeight: "900" },
  paymentHeroTitle: { color: C.white, fontSize: 17, fontWeight: "900", marginTop: 4 },
  paymentHeroMeta: { color: C.muted, fontSize: 9, marginTop: 5 },
  paymentCountCircle: { width: 58, height: 58, borderRadius: 19, backgroundColor: `${C.green}18`, alignItems: "center", justifyContent: "center" },
  paymentCountValue: { color: C.green, fontSize: 16, fontWeight: "900" },
  paymentCountLabel: { color: C.muted, fontSize: 7, marginTop: 2 },
  paymentProgressTrack: { height: 7, borderRadius: 5, backgroundColor: C.navy, overflow: "hidden", marginVertical: 15 },
  paymentProgressFill: { height: "100%", backgroundColor: C.green, borderRadius: 5 },
  paymentTotals: { flexDirection: "row", justifyContent: "space-between" },
  paymentTotalLabel: { color: C.muted, fontSize: 8, fontWeight: "800" },
  paymentTotalValue: { fontSize: 15, fontWeight: "900", marginTop: 4 },
  paymentPlayerCard: { backgroundColor: C.panel, borderRadius: 17, padding: 12, marginBottom: 9, borderWidth: 1, borderColor: C.line },
  paymentPlayerPaid: { borderColor: `${C.green}80` },
  paymentPlayerTop: { flexDirection: "row", alignItems: "center" },
  paymentAvatar: { width: 42, height: 42, borderRadius: 13, backgroundColor: C.panel2, alignItems: "center", justifyContent: "center" },
  paymentAvatarText: { color: C.red, fontSize: 16, fontWeight: "900" },
  paymentPlayerInfo: { flex: 1, marginLeft: 10 },
  paymentPlayerName: { color: C.white, fontSize: 12, fontWeight: "800" },
  paymentStatus: { fontSize: 8, fontWeight: "800", marginTop: 4 },
  amountWrap: { flexDirection: "row", alignItems: "center", backgroundColor: C.navy, borderRadius: 10, borderWidth: 1, borderColor: C.line, paddingRight: 8 },
  amountInput: { width: 52, color: C.white, fontSize: 12, fontWeight: "900", paddingVertical: 9, paddingHorizontal: 8, textAlign: "right" },
  amountCurrency: { color: C.muted, fontSize: 7, fontWeight: "800" },
  markPaidButton: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 7, borderRadius: 11, borderWidth: 1, borderColor: C.green, paddingVertical: 10, marginTop: 10 },
  markPaidButtonActive: { backgroundColor: C.green, borderColor: C.green },
  markPaidText: { color: C.green, fontSize: 10, fontWeight: "900" },
  clubCard: { flexDirection: "row", alignItems: "center", backgroundColor: C.panel, borderRadius: 20, padding: 16, marginBottom: 15 },
  clubInfo: { marginLeft: 15 },
  clubName: { color: C.white, fontSize: 19, fontWeight: "900" },
  clubRole: { color: C.muted, fontSize: 10, marginTop: 3 },
  planPill: { alignSelf: "flex-start", backgroundColor: `${C.blue}20`, paddingVertical: 4, paddingHorizontal: 7, borderRadius: 6, marginTop: 8 },
  planText: { color: C.blue, fontSize: 8, fontWeight: "900" },
  menuRow: { flexDirection: "row", alignItems: "center", backgroundColor: C.panel, borderRadius: 14, padding: 12, marginBottom: 8 },
  menuRowActive: { borderWidth: 1, borderColor: C.blue },
  menuIcon: { width: 41, height: 41, borderRadius: 12, backgroundColor: C.panel2, alignItems: "center", justifyContent: "center" },
  menuLabel: { flex: 1, color: C.white, fontSize: 12, fontWeight: "700", marginLeft: 12 },
  adminDetailCard: { backgroundColor: C.panel, borderRadius: 17, padding: 15, borderWidth: 1, borderColor: C.line, marginTop: 8 },
  adminDetailTitle: { color: C.white, fontSize: 15, fontWeight: "900" },
  adminDetailText: { color: C.muted, fontSize: 11, lineHeight: 17, marginTop: 6 },
  profilePanel: { backgroundColor: C.panel, borderRadius: 20, padding: 15, borderWidth: 1, borderColor: C.line, marginTop: 8 },
  profilePanelTop: { flexDirection: "row", alignItems: "center", marginBottom: 14 },
  profilePanelAvatar: { width: 62, height: 62, borderRadius: 20, backgroundColor: C.red, alignItems: "center", justifyContent: "center" },
  profilePanelInfo: { flex: 1, marginLeft: 12 },
  profilePanelName: { color: C.white, fontSize: 18, fontWeight: "900" },
  profilePanelRole: { color: C.muted, fontSize: 10, marginTop: 4 },
  profileDetailsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 9 },
  profileDetailBox: { flexGrow: 1, flexBasis: "46%", backgroundColor: C.navy, borderRadius: 14, padding: 12, borderWidth: 1, borderColor: C.line },
  profileDetailLabel: { color: C.muted, fontSize: 8, fontWeight: "900", letterSpacing: 0.8 },
  profileDetailValue: { color: C.white, fontSize: 11, fontWeight: "800", marginTop: 6 },
  permissionCard: { flexDirection: "row", gap: 9, backgroundColor: `${C.blue}12`, borderRadius: 14, padding: 12, marginTop: 12 },
  permissionText: { flex: 1, color: C.muted, fontSize: 10, lineHeight: 15 },
  notificationsPanel: { backgroundColor: C.panel, borderRadius: 20, padding: 15, borderWidth: 1, borderColor: C.line, marginTop: 8 },
  notificationsHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 10 },
  notificationCounter: { color: C.amber, fontSize: 10, fontWeight: "900" },
  notificationRow: { flexDirection: "row", alignItems: "center", backgroundColor: C.navy, borderRadius: 14, padding: 11, borderWidth: 1, borderColor: C.line, marginBottom: 8 },
  notificationRead: { opacity: 0.58 },
  notificationIcon: { width: 42, height: 42, borderRadius: 13, alignItems: "center", justifyContent: "center" },
  notificationInfo: { flex: 1, marginLeft: 10 },
  notificationTitle: { color: C.white, fontSize: 12, fontWeight: "900" },
  notificationText: { color: C.muted, fontSize: 9, lineHeight: 14, marginTop: 3 },
  notificationHint: { color: C.muted, fontSize: 9, textAlign: "center", marginTop: 4 },
  logoutButton: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, backgroundColor: C.red, borderRadius: 14, padding: 13, marginTop: 16 },
  logoutText: { color: C.white, fontSize: 12, fontWeight: "900" },
  backLink: { flexDirection: "row", alignItems: "center", alignSelf: "flex-start", marginBottom: 14 },
  backText: { color: C.blue, fontSize: 12, fontWeight: "800" },
  roleRow: { gap: 7, paddingBottom: 14 },
  roleChip: { paddingVertical: 8, paddingHorizontal: 13, borderRadius: 20, backgroundColor: C.panel, borderWidth: 1, borderColor: C.line },
  roleChipActive: { backgroundColor: C.blue, borderColor: C.blue },
  roleChipText: { color: C.muted, fontSize: 10, fontWeight: "800" },
  roleChipTextActive: { color: C.navy },
  trainingSummary: { flexDirection: "row", alignItems: "center", justifyContent: "space-around", backgroundColor: C.panel, borderRadius: 19, padding: 15, marginBottom: 16 },
  trainingSummaryValue: { color: C.white, fontSize: 22, fontWeight: "900", textAlign: "center" },
  trainingSummaryLabel: { color: C.muted, fontSize: 9, marginTop: 3 },
  listHeader: { flexDirection: "row", alignItems: "center", gap: 10 },
  statusToggle: { flex: 1, flexDirection: "row", backgroundColor: C.panel, padding: 4, borderRadius: 13 },
  statusToggleButton: { flex: 1, paddingVertical: 10, alignItems: "center", borderRadius: 10 },
  statusToggleActive: { backgroundColor: C.panel2 },
  statusToggleText: { color: C.muted, fontSize: 10, fontWeight: "800" },
  statusToggleTextActive: { color: C.white },
  addTrainingButton: { width: 43, height: 43, borderRadius: 13, backgroundColor: C.red, alignItems: "center", justifyContent: "center" },
  groupFilters: { gap: 7, paddingVertical: 13 },
  filterChip: { paddingVertical: 7, paddingHorizontal: 15, borderRadius: 18, borderWidth: 1, borderColor: C.line },
  filterChipActive: { backgroundColor: C.red, borderColor: C.red },
  filterChipText: { color: C.muted, fontSize: 10, fontWeight: "800" },
  filterChipTextActive: { color: C.white },
  emptyText: { color: C.muted, textAlign: "center", paddingVertical: 35, fontSize: 12 },
  trainingCard: { backgroundColor: C.panel, borderRadius: 18, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: C.line },
  trainingCardTop: { flexDirection: "row", alignItems: "center" },
  trainingDateIcon: { width: 48, height: 48, borderRadius: 15, backgroundColor: `${C.red}18`, alignItems: "center", justifyContent: "center" },
  trainingCardInfo: { flex: 1, marginLeft: 11 },
  trainingCardTags: { flexDirection: "row", alignItems: "center", gap: 7 },
  trainingGroup: { color: C.blue, fontSize: 9, fontWeight: "900" },
  trainingStateSmall: { color: C.green, fontSize: 8, fontWeight: "800" },
  trainingTitle: { color: C.white, fontSize: 15, fontWeight: "800", marginTop: 4 },
  trainingMetaGrid: { flexDirection: "row", flexWrap: "wrap", borderTopWidth: 1, borderTopColor: C.line, marginTop: 12, paddingTop: 10 },
  trainingMeta: { color: C.muted, width: "50%", fontSize: 9, marginBottom: 7 },
  formCard: { backgroundColor: C.panel, borderRadius: 20, padding: 15 },
  formRow: { flexDirection: "row", gap: 10 },
  formHalf: { flex: 1 },
  trainingField: { marginBottom: 13 },
  trainingFieldLabel: { color: C.muted, fontSize: 9, fontWeight: "900", letterSpacing: 0.8, marginBottom: 6 },
  trainingInput: { backgroundColor: C.navy, borderWidth: 1, borderColor: C.line, color: C.white, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 11, fontSize: 12 },
  trainingInputLarge: { minHeight: 72, textAlignVertical: "top" },
  formActions: { flexDirection: "row", gap: 10, marginTop: 4 },
  formActionButton: { flex: 1, alignItems: "center", borderRadius: 12, paddingVertical: 12 },
  formCancelButton: { backgroundColor: C.panel2 },
  formSaveButton: { backgroundColor: C.red },
  formCancelText: { color: C.muted, fontSize: 11, fontWeight: "900" },
  formSaveText: { color: C.white, fontSize: 11, fontWeight: "900" },
  groupRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 14 },
  groupChip: { flexGrow: 1, flexBasis: "22%", alignItems: "center", borderWidth: 1, borderColor: C.line, borderRadius: 11, paddingVertical: 10, paddingHorizontal: 8 },
  groupChipActive: { backgroundColor: C.red, borderColor: C.red },
  groupChipText: { color: C.muted, fontWeight: "800", fontSize: 11 },
  groupChipTextActive: { color: C.white },
  trainingDetailHero: { backgroundColor: C.panel, borderRadius: 22, padding: 18, borderLeftWidth: 3, borderLeftColor: C.red },
  trainingDetailTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  trainingGroupPill: { backgroundColor: `${C.blue}20`, borderRadius: 8, paddingVertical: 5, paddingHorizontal: 9 },
  trainingGroupPillText: { color: C.blue, fontSize: 9, fontWeight: "900" },
  trainingState: { color: C.green, fontSize: 9, fontWeight: "900" },
  trainingDetailTitle: { color: C.white, fontSize: 23, fontWeight: "900", marginTop: 14 },
  trainingDetailMeta: { color: C.muted, fontSize: 10, marginTop: 7 },
  detailInfoCard: { backgroundColor: C.panel, borderRadius: 17, padding: 15 },
  detailInfoLabel: { color: C.blue, fontSize: 8, fontWeight: "900", letterSpacing: 1.1, marginBottom: 4 },
  detailInfoValue: { color: C.white, fontSize: 11, lineHeight: 16, marginBottom: 13 },
  timeline: { backgroundColor: C.panel, borderRadius: 17, paddingHorizontal: 14 },
  timelineRow: { flexDirection: "row", alignItems: "center", paddingVertical: 11, borderBottomWidth: 1, borderBottomColor: C.line },
  timelineNumber: { width: 27, height: 27, borderRadius: 9, backgroundColor: C.panel2, alignItems: "center", justifyContent: "center" },
  timelineNumberText: { color: C.blue, fontSize: 10, fontWeight: "900" },
  timelineText: { flex: 1, color: C.white, fontSize: 11, fontWeight: "700", marginLeft: 10 },
  timelineMinutes: { color: C.muted, fontSize: 9 },
  attendanceSubtitle: { color: C.muted, fontSize: 10, lineHeight: 15, marginTop: -5, marginBottom: 10 },
  attendanceCard: { backgroundColor: C.panel, borderRadius: 17, padding: 12, marginBottom: 10 },
  attendancePlayer: { flexDirection: "row", alignItems: "center" },
  smallAvatar: { width: 39, height: 39, borderRadius: 12, backgroundColor: C.panel2, alignItems: "center", justifyContent: "center" },
  smallAvatarText: { color: C.red, fontSize: 15, fontWeight: "900" },
  attendanceName: { color: C.white, fontSize: 12, fontWeight: "800", marginLeft: 10 },
  attendanceRole: { color: C.muted, fontSize: 8, marginLeft: 10, marginTop: 3 },
  inlineNoteBox: { marginTop: 10, backgroundColor: C.navy, borderRadius: 14, padding: 10, borderWidth: 1, borderColor: C.line },
  smallSaveButton: { marginTop: 8, backgroundColor: C.blue, borderRadius: 12, paddingVertical: 10, paddingHorizontal: 12, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 7 },
  smallSaveText: { color: C.white, fontSize: 10, fontWeight: "900" },
  statusButtons: { flexDirection: "row", gap: 5, marginTop: 11 },
  statusButton: { flex: 1, minHeight: 48, borderWidth: 1, borderColor: C.line, borderRadius: 9, alignItems: "center", justifyContent: "center", paddingVertical: 5 },
  statusSymbol: { color: C.muted, fontSize: 15, fontWeight: "900" },
  statusButtonText: { color: C.muted, fontSize: 6, fontWeight: "800", marginTop: 2 },
  readOnlyStatus: { color: C.blue, fontSize: 11, fontWeight: "800", marginTop: 10 },
  matchCard: { backgroundColor: C.panel, borderRadius: 18, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: C.line },
  matchCardActive: { borderColor: C.red },
  matchCardTop: { flexDirection: "row", alignItems: "center" },
  matchBall: { width: 48, height: 48, borderRadius: 15, backgroundColor: `${C.red}18`, alignItems: "center", justifyContent: "center" },
  matchInfo: { flex: 1, marginLeft: 11 },
  matchType: { color: C.blue, fontSize: 9, fontWeight: "900" },
  matchTitle: { color: C.white, fontSize: 14, fontWeight: "900", marginTop: 4 },
  matchMeta: { color: C.muted, fontSize: 8, marginTop: 5 },
  matchScoreBox: { minWidth: 48, alignItems: "center", backgroundColor: C.navy, borderRadius: 13, paddingVertical: 8, paddingHorizontal: 7, borderWidth: 1, borderColor: C.line },
  matchScore: { color: C.white, fontSize: 15, fontWeight: "900" },
  matchScoreLabel: { color: C.muted, fontSize: 7, fontWeight: "800", marginTop: 3 },
  matchMiniStats: { borderTopWidth: 1, borderTopColor: C.line, marginTop: 11, paddingTop: 9, gap: 4 },
  matchMiniText: { color: C.muted, fontSize: 9, lineHeight: 13 },
  matchHero: { backgroundColor: C.panel, borderRadius: 22, padding: 17, borderLeftWidth: 3, borderLeftColor: C.red, marginBottom: 10 },
  matchHeroTag: { color: C.blue, fontSize: 9, fontWeight: "900" },
  matchHeroTitle: { color: C.white, fontSize: 20, fontWeight: "900", marginTop: 8 },
  matchHeroMeta: { color: C.muted, fontSize: 10, marginTop: 7 },
  matchHeroNote: { color: C.white, fontSize: 11, lineHeight: 17, marginTop: 12 },
  matchDetailTop: { flexDirection: "row", alignItems: "center", gap: 12 },
  matchBigScore: { width: 96, backgroundColor: "#061726", borderRadius: 18, padding: 8, borderWidth: 1, borderColor: C.line, alignItems: "center" },
  matchBigScoreInput: { width: "100%", color: C.white, fontSize: 22, fontWeight: "900", textAlign: "center", paddingVertical: 4 },
  matchStatusInput: { width: "100%", color: C.blue, fontSize: 9, fontWeight: "900", textAlign: "center", paddingVertical: 2 },
  matchAnalysisCard: { backgroundColor: C.panel, borderRadius: 20, padding: 15, borderWidth: 1, borderColor: C.line, marginBottom: 12 },
  matchAnalysisHead: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 8 },
  goalStatsBox: { backgroundColor: "#071A2A", borderRadius: 16, borderWidth: 1, borderColor: C.line, padding: 12, marginBottom: 12 },
  goalStatsHead: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 8 },
  goalTotal: { color: C.green, fontSize: 10, fontWeight: "900" },
  goalScorerRow: { flexDirection: "row", alignItems: "center", gap: 9, paddingVertical: 8, borderTopWidth: 1, borderTopColor: C.line },
  goalButton: { width: 30, height: 30, borderRadius: 10, backgroundColor: C.red, alignItems: "center", justifyContent: "center" },
  goalCount: { width: 22, textAlign: "center", color: C.white, fontSize: 16, fontWeight: "900" },
  playerMatchStatsCard: { backgroundColor: C.panel, borderRadius: 15, padding: 10, marginTop: 10, borderWidth: 1, borderColor: C.line },
  matchPlayerCompactRow: { flexDirection: "row", alignItems: "center", gap: 9, backgroundColor: C.panel, borderRadius: 14, padding: 10, marginTop: 8, borderWidth: 1, borderColor: C.line },
  playerStatsWindow: { backgroundColor: C.panel, borderRadius: 20, padding: 15, borderWidth: 1, borderColor: C.blue, marginBottom: 12 },
  closeMiniButton: { width: 34, height: 34, borderRadius: 12, backgroundColor: C.red, alignItems: "center", justifyContent: "center" },
  matchStatGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 8 },
  matchStatBox: { flexGrow: 1, flexBasis: "46%", backgroundColor: C.navy, borderRadius: 12, padding: 9, borderWidth: 1, borderColor: C.line },
  matchStatControls: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 7 },
  matchStatValue: { color: C.white, fontSize: 15, fontWeight: "900" },
  miniRoundButton: { width: 26, height: 26, borderRadius: 9, backgroundColor: C.panel2, alignItems: "center", justifyContent: "center" },
  miniRoundText: { color: C.white, fontSize: 14, fontWeight: "900" },
  pitchCard: { backgroundColor: "#0B3A2B", borderRadius: 20, padding: 14, borderWidth: 1, borderColor: `${C.green}66`, marginBottom: 12 },
  pitchLine: { alignItems: "center", borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.14)", paddingVertical: 9 },
  pitchLineLabel: { color: "rgba(255,255,255,0.72)", fontSize: 8, fontWeight: "900", marginBottom: 6 },
  pitchPlayers: { flexDirection: "row", justifyContent: "center", gap: 8, flexWrap: "wrap" },
  pitchPlayer: { alignItems: "center", backgroundColor: "rgba(255,255,255,0.12)", borderRadius: 13, paddingVertical: 7, paddingHorizontal: 9, minWidth: 58 },
  pitchPlayerNo: { color: C.white, fontSize: 13, fontWeight: "900" },
  pitchPlayerName: { color: C.white, fontSize: 8, fontWeight: "800", marginTop: 2 },
  callUpCard: { backgroundColor: C.panel, borderRadius: 17, padding: 12, marginBottom: 10, borderWidth: 1, borderColor: C.line },
  callUpCurrent: { fontSize: 9, fontWeight: "900" },
  callUpButtons: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 11 },
  callUpButton: { flexGrow: 1, flexBasis: "47%", minHeight: 42, borderWidth: 1, borderColor: C.line, borderRadius: 10, alignItems: "center", justifyContent: "center", gap: 3, paddingVertical: 7 },
  callUpButtonText: { color: C.muted, fontSize: 8, fontWeight: "900" },
  playerProfileHero: { alignItems: "center", backgroundColor: C.panel, borderRadius: 22, padding: 20 },
  profileAvatar: { width: 68, height: 68, borderRadius: 22, backgroundColor: C.red, alignItems: "center", justifyContent: "center" },
  profilePlayerName: { color: C.white, fontSize: 21, fontWeight: "900", marginTop: 12 },
  profilePlayerMeta: { color: C.muted, fontSize: 10, marginTop: 4 },
  profilePercent: { color: C.green, fontSize: 34, fontWeight: "900", marginTop: 13 },
  profilePercentLabel: { color: C.muted, fontSize: 9 },
  profileStats: { flexDirection: "row", backgroundColor: C.panel, borderRadius: 17, padding: 12, marginTop: 11 },
  noteCard: { flexDirection: "row", gap: 11, backgroundColor: C.panel, borderRadius: 16, padding: 14 },
  noteText: { flex: 1, color: C.white, fontSize: 11, lineHeight: 17 },
  reportPreview: { backgroundColor: C.navy, borderRadius: 16, padding: 12, borderWidth: 1, borderColor: C.line, marginTop: 12 },
  reportPreviewTitle: { color: C.white, fontSize: 12, fontWeight: "900", marginBottom: 8 },
  reportPreviewText: { color: C.muted, fontSize: 10, lineHeight: 16 },
  medicalCard: { backgroundColor: C.panel, borderRadius: 17, padding: 12, marginBottom: 12, borderWidth: 1, borderColor: C.line },
  inventoryCard: { backgroundColor: C.panel, borderRadius: 17, padding: 12, marginTop: 10, borderWidth: 1, borderColor: C.line },
  inventoryNumbers: { flexDirection: "row", gap: 10, marginTop: 8, marginBottom: 4 },
  historyRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", backgroundColor: C.panel, borderRadius: 14, padding: 13, marginBottom: 8 },
  historyTitle: { color: C.white, fontSize: 11, fontWeight: "800" },
  historyMeta: { color: C.muted, fontSize: 8, marginTop: 4 },
  historyStatus: { fontSize: 9, fontWeight: "900" },
  tabBar: { height: 76, backgroundColor: "#0A2134", borderTopWidth: 1, borderTopColor: C.line, paddingTop: 7, paddingBottom: 4 },
  tabBarContent: { flex: 1, flexDirection: "row", justifyContent: "space-around", paddingHorizontal: 4 },
  tab: { flex: 1, alignItems: "center" },
  tabIconWrap: { width: 34, height: 32, borderRadius: 11, alignItems: "center", justifyContent: "center" },
  tabIconActive: { backgroundColor: C.red },
  tabText: { color: C.muted, fontSize: 8, fontWeight: "700", marginTop: 3 },
  tabTextActive: { color: C.white },
  toast: { position: "absolute", left: 18, right: 18, bottom: 94, zIndex: 50, flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: C.panel2, borderRadius: 18, padding: 14, borderWidth: 1, borderColor: C.line, shadowColor: "#000", shadowOpacity: 0.35, shadowRadius: 18, shadowOffset: { width: 0, height: 8 } },
  toastIcon: { width: 28, height: 28, borderRadius: 14, alignItems: "center", justifyContent: "center", backgroundColor: C.green },
  toastTextWrap: { flex: 1 },
  toastTitle: { color: C.white, fontSize: 13, fontWeight: "900" },
  toastMessage: { color: C.muted, fontSize: 11, fontWeight: "700", marginTop: 2 },
});

