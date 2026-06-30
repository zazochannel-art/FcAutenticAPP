import React, { useEffect, useState } from "react";
import {
  Alert,
  Platform,
  Pressable,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  QueryClient,
  useQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { createAsyncStoragePersister } from "@tanstack/query-async-storage-persister";

// Config & Services
import { isSupabaseConfigured, supabase } from "./supabaseClient";
import { supabaseService } from "./supabaseService";
import { colors as C } from "./src/constants/theme";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      gcTime: 1000 * 60 * 60 * 24, // 24 ore
      staleTime: 2000,
    },
  },
});

const asyncStoragePersister = createAsyncStoragePersister({
  storage: AsyncStorage,
});

// Screens
import WelcomeScreen from "./src/screens/WelcomeScreen";
import LoginScreen from "./src/screens/LoginScreen";
import RegisterPlayerScreen from "./src/screens/RegisterPlayerScreen";
import OnboardingScreen from "./src/screens/OnboardingScreen";
import CreateClubScreen from "./src/screens/CreateClubScreen";
import DashboardScreen from "./src/screens/DashboardScreen";
import TeamScreen from "./src/screens/TeamScreen";
import TrainingsScreen from "./src/screens/TrainingsScreen";
import MatchesScreen from "./src/screens/MatchesScreen";
import CalendarScreen from "./src/screens/CalendarScreen";
import FinancesScreen from "./src/screens/FinancesScreen";
import NotificationsScreen from "./src/screens/NotificationsScreen";
import MoreScreen from "./src/screens/MoreScreen";
import SaasAdminScreen from "./src/screens/SaasAdminScreen";

const STORAGE_KEYS = {
  auth: "fc-autentic-auth",
  registeredUsers: "fc-autentic-registered-users",
  appData: "fc-autentic-training-data",
};

const DEFAULT_CLUB_ID = "00000000-0000-0000-0000-000000000000";
const DEFAULT_SUBSCRIPTION_ID = "sub-fc-autentic-free";
const ENABLE_DEMO_MODE = String(process.env.EXPO_PUBLIC_ENABLE_DEMO || "").toLowerCase() === "true";

const defaultClub = {
  id: DEFAULT_CLUB_ID,
  name: "FC Autentic",
  logo: "",
  city: "Chisinau",
  country: "Moldova",
  email: "contact@fcautentic.md",
  phone: "+373 600 00 000",
  description: "Club de fotbal organizat profesionist.",
  groups: ["U13", "U16", "U19", "Juniori", "Seniori"],
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
  maxPlayers: 20,
  startedAt: "29 iunie 2026",
  expiresAt: "",
  createdAt: "29 iunie 2026",
};

import { ExpandableTabs } from "./src/components/ui/expandable-tabs";

export default function App() {
  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{ persister: asyncStoragePersister }}
    >
      <MainApp />
    </PersistQueryClientProvider>
  );
}

function MainApp() {
  const queryClient = useQueryClient();
  const { width } = useWindowDimensions();
  const isDesktopLayout = width >= 768;

  // --- State ---
  const [authView, setAuthView] = useState("welcome");
  const [currentUser, setCurrentUser] = useState(null);
  const [tab, setTab] = useState("Panou");
  const [clubSettings, setClubSettings] = useState({ clubName: "FC Autentic" });
  const [selectedClubId, setSelectedClubId] = useState(null);

  // --- Queries ---
  const { data: players = [] } = useQuery({
    queryKey: ["players", selectedClubId],
    queryFn: () => supabaseService.getPlayers(selectedClubId),
    enabled: isSupabaseConfigured
  });
  const { data: trainings = [] } = useQuery({
    queryKey: ["trainings", selectedClubId],
    queryFn: () => supabaseService.getTrainings(selectedClubId),
    enabled: isSupabaseConfigured
  });
  const { data: matches = [] } = useQuery({
    queryKey: ["matches", selectedClubId],
    queryFn: () => supabaseService.getMatches(selectedClubId),
    enabled: isSupabaseConfigured
  });
  const { data: attendance = {} } = useQuery({
    queryKey: ["attendance", selectedClubId],
    queryFn: () => supabaseService.getAttendance(selectedClubId),
    enabled: isSupabaseConfigured
  });
  const { data: transactions = [] } = useQuery({
    queryKey: ["transactions", selectedClubId],
    queryFn: () => supabaseService.getTransactions(selectedClubId),
    enabled: isSupabaseConfigured
  });
  const { data: clubs = [] } = useQuery({
    queryKey: ["clubs"],
    queryFn: () => supabaseService.getClubs(),
    enabled: isSupabaseConfigured
  });
  const { data: memberships = [] } = useQuery({
    queryKey: ["memberships", currentUser?.id],
    queryFn: () => supabaseService.getMemberships(currentUser?.id),
    enabled: isSupabaseConfigured && !!currentUser
  });
  const { data: invitations = [] } = useQuery({
    queryKey: ["invitations", selectedClubId],
    queryFn: () => supabaseService.getInvitations(selectedClubId),
    enabled: isSupabaseConfigured
  });
  const { data: subscriptions = [] } = useQuery({
    queryKey: ["subscriptions"],
    queryFn: () => supabaseService.getSubscriptions(),
    enabled: isSupabaseConfigured
  });

  // Încărcăm automat primul club la care are acces user-ul la login
  useEffect(() => {
    if (memberships.length > 0 && !selectedClubId) {
      const firstClub = memberships[0].clubId || memberships[0].club_id;
      setSelectedClubId(firstClub);
    }
  }, [memberships]);

  const switchClub = (newClubId) => {
    setSelectedClubId(newClubId);
    queryClient.invalidateQueries(); // Reîncărcăm tot cache-ul pentru noul context
  };
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState("");
  const [tasks, setTasks] = useState(ENABLE_DEMO_MODE ? [
    { id: 1, title: "Confirmă lotul pentru meci", meta: "Termen: azi, 16:00", priority: "URGENT", color: C.red, done: false },
    { id: 2, title: "Achită chiria terenului", meta: "Termen: 25 iunie", priority: "MEDIU", color: C.amber, done: false },
    { id: 3, title: "Verifică echipamentul", meta: "Responsabil: Andrei", priority: "NORMAL", color: C.blue, done: true },
  ] : []);

  const selectedClub = (clubs && clubs.length > 0)
    ? (clubs.find((c) => c.id === selectedClubId) || clubs[0])
    : defaultClub;
  const subscription = subscriptions.find(s => (s.clubId || s.club_id) === selectedClubId) || defaultSubscription;
  const currentMembership = memberships.find((m) => {
    const membershipUserId = m.userId || m.user_id;
    const membershipClubId = m.clubId || m.club_id;
    return membershipUserId === currentUser?.id && membershipClubId === selectedClubId;
  });

  const effectiveUser = currentUser ? {
    ...currentUser,
    // REGULĂ DE FORȚĂ: Dacă e emailul tău, ești Super Admin indiferent de restul setărilor
    role: (currentUser.email === 'igor.gratii.99@mail.ru' || currentUser.role === "super_admin")
      ? "super_admin"
      : (currentMembership?.role || "viewer"),
    clubId: selectedClubId
  } : null;

  const roleTabs = {
    super_admin: ["Panou", "Echipă", "Antren.", "Meciuri", "Calendar", "Finanțe", "Mai mult"],
    club_owner: ["Panou", "Echipă", "Antren.", "Meciuri", "Calendar", "Finanțe", "Mai mult"],
    admin: ["Panou", "Echipă", "Antren.", "Meciuri", "Calendar", "Finanțe", "Mai mult"],
    coach: ["Panou", "Echipă", "Antren.", "Meciuri", "Mai mult"],
    player: ["Panou", "Antren.", "Meciuri", "Calendar", "Mai mult"],
    parent: ["Panou", "Antren.", "Meciuri", "Calendar", "Mai mult"],
    viewer: ["Panou", "Calendar", "Mai mult"],
    guest: ["Panou", "Calendar", "Mai mult"],
  };

  const activeTabs = roleTabs[effectiveUser?.role] || roleTabs.guest;

  const playerMutation = useMutation({
    mutationFn: async ({ type, payload }) => {
      if (type === "insert") return supabaseService.insertPlayer(payload);
      if (type === "update") return supabaseService.updatePlayer(payload);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["players"] })
  });

  const trainingMutation = useMutation({
    mutationFn: async (payload) => supabaseService.insertTraining(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["trainings"] })
  });

  const attendanceMutation = useMutation({
    mutationFn: async ({ tId, pId, status }) => supabaseService.saveAttendance(tId, pId, status),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["attendance"] })
  });

  const clubMutation = useMutation({
    mutationFn: async ({ name }) => supabaseService.createClub(currentUser.id, name),
    onSuccess: (newClub) => {
      queryClient.invalidateQueries({ queryKey: ["clubs"] });
      queryClient.invalidateQueries({ queryKey: ["memberships"] });
      setSelectedClubId(newClub.id);
      setAuthView("app");
      Alert.alert("Succes", `Clubul ${newClub.name} a fost creat!`);
    },
    onError: (err) => Alert.alert("Eroare", err.message)
  });

  const enterApp = async (profile) => {
    setCurrentUser(profile);
    setAuthView("app");
    setTab(roleTabs[profile.role]?.[0] || "Panou");
    await AsyncStorage.setItem(STORAGE_KEYS.auth, JSON.stringify(profile));
  };

  const loginWithEmail = async (email, password) => {
    setAuthLoading(true);
    try {
      // REGULĂ DE URGENȚĂ: Bypass pentru emailul de Super Admin
      if (email === 'igor.gratii.99@mail.ru' && password === 'admin123') {
        const { data: profile } = await supabase.from("profiles").select("*").eq("email", email).single();
        await enterApp({ ...profile, email, role: 'super_admin' });
        return;
      }

      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      const { data: profile } = await supabase.from("profiles").select("*").eq("id", data.user.id).single();
      await enterApp({ ...profile, email });
    } catch (e) {
      setAuthError(e.message);
    } finally {
      setAuthLoading(false);
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
    await AsyncStorage.removeItem(STORAGE_KEYS.auth);
    setCurrentUser(null);
    setAuthView("welcome");
  };

  const toggleTask = (id) => setTasks((current) => current.map((task) => task.id === id ? { ...task, done: !task.done } : task));

  useEffect(() => {
    if (!isSupabaseConfigured) return;

    const tableToKey = {
      players: "players",
      chat_messages: "chatMessages",
      matches: "matches",
      trainings: "trainings",
      attendance: "attendance",
      transactions: "transactions",
      club_memberships: "memberships",
      club_invitations: "invitations",
      player_observations: "observations",
      club_events: "events",
      player_evaluations: "evaluations",
      development_plans: "developmentPlans",
      discipline_records: "discipline",
      media_gallery: "mediaGallery",
      scouting_players: "scouting",
      training_payments: "payments",
      monthly_payments: "monthlyPayments",
    };

    const channel = supabase.channel("realtime-public-tables");

    Object.keys(tableToKey).forEach((table) => {
      channel.on(
        "postgres_changes",
        { event: "*", schema: "public", table: table },
        (payload) => {
          const key = tableToKey[payload.table];
          if (key) {
            // Invalidează inteligent: dacă avem club_id în datele noi, invalidăm doar acel club
            const clubId = payload.new?.club_id || payload.old?.club_id;
            if (clubId) {
              queryClient.invalidateQueries({ queryKey: [key, clubId] });
            } else {
              // Fallback: invalidăm toate datele de acest tip (ex: dacă coloana lipsește în DB)
              queryClient.invalidateQueries({ queryKey: [key] });
            }
          }
        }
      );
    });

    channel.subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  const pages = {
    Panou: effectiveUser?.role === "super_admin"
      ? <SaasAdminScreen clubs={clubs} players={players} memberships={memberships} openNotifications={() => setTab("Notif.")} />
      : <DashboardScreen
          tasks={tasks}
          toggleTask={toggleTask}
          players={players}
          trainings={trainings}
          matches={matches}
          attendance={attendance}
          transactions={transactions}
          clubSettings={clubSettings}
          currentUser={effectiveUser}
          setTab={setTab}
          selectedClub={selectedClub}
          subscription={subscription}
          memberships={memberships}
          openNotifications={() => setTab("Notif.")}
        />,
    Echipă: <TeamScreen
          players={players}
          setPlayers={(updater) => playerMutation.mutate({ type: "update", payload: updater(players) })}
          currentUser={effectiveUser}
          trainings={trainings}
          openNotifications={() => setTab("Notif.")}
        />,
    "Antren.": <TrainingsScreen
          players={players}
          trainings={trainings}
          currentUser={effectiveUser}
          openNotifications={() => setTab("Notif.")}
        />,
    Meciuri: <MatchesScreen
          players={players}
          matches={matches}
          currentUser={effectiveUser}
          openNotifications={() => setTab("Notif.")}
        />,
    Calendar: <CalendarScreen
          trainings={trainings}
          matches={matches}
          openNotifications={() => setTab("Notif.")}
        />,
    Finanțe: <FinancesScreen
          players={players}
          trainings={trainings}
          transactions={transactions}
          clubSettings={clubSettings}
          openNotifications={() => setTab("Notif.")}
        />,
    "Notif.": <NotificationsScreen
          currentUser={effectiveUser}
          openNotifications={() => setTab("Notif.")}
        />,
    "Mai mult": <MoreScreen
          currentUser={effectiveUser}
          onLogout={logout}
          selectedClub={selectedClub}
          clubs={clubs}
          switchClub={switchClub}
          onCreateClub={() => setAuthView("create-club")}
          openNotifications={() => setTab("Notif.")}
        />,
  };

  if (authView === "welcome") return <WelcomeScreen onLogin={() => setAuthView("login")} onGuest={() => enterApp({ role: "guest", name: "Vizitator" })} />;
  if (authView === "login") return <LoginScreen onBack={() => setAuthView("welcome")} onLogin={loginWithEmail} loading={authLoading} error={authError} onRegister={() => setAuthView("register")} />;
  if (authView === "register") return <RegisterPlayerScreen onBack={() => setAuthView("login")} onRegister={() => {}} />;
  if (authView === "create-club") return <CreateClubScreen onBack={() => setAuthView("app")} onCreate={(form) => clubMutation.mutate(form)} loading={clubMutation.isLoading} error={clubMutation.error?.message} />;

  const tabIconsMapping = {
    Panou: "LayoutGrid",
    Admin: "ShieldCheck",
    Echipă: "Users",
    "Antren.": "Dumbbell",
    Meciuri: "Trophy",
    Calendar: "CalendarDays",
    "Notif.": "Bell",
    Finanțe: "Wallet",
    "Mai mult": "Menu",
  };

  const navTabs = activeTabs.map(label => ({
    title: label,
    icon: tabIconsMapping[label] || "Circle"
  }));

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" />
      <View style={[styles.app, isDesktopLayout && styles.appDesktop]}>{pages[tab] || pages.Panou}</View>
      <ExpandableTabs
        tabs={navTabs}
        activeTab={tab}
        onChange={(label) => setTab(label)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },
  app: { flex: 1, paddingBottom: Platform.OS === "ios" ? 90 : 75 },
  appDesktop: { paddingTop: 92, paddingBottom: 24 },
});
