import React, { useEffect, useState } from "react";
import {
  Alert,
  Platform,
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  QueryCache,
  QueryClient,
  useQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { createAsyncStoragePersister } from "@tanstack/query-async-storage-persister";

import { isSupabaseConfigured, supabase, supabaseConfigError } from "./src/config/supabaseClient";
import { supabaseService, DEFAULT_CLUB_ID } from "./src/services/supabaseService";
import { resolveEffectiveRole } from "./src/utils/roles";
import { ProfileContext } from "./src/context/ProfileContext";
import { authService } from "./src/services/authService";

const queryClient = new QueryClient({
  // Orice cerere care eșuează raportează într-un singur loc, iar carcasa arată
  // o bandă. Înainte, ecranele afișau starea goală și păreau să spună că nu
  // există date, deși cererea căzuse.
  queryCache: new QueryCache({
    onError: (error) => reportQueryError(error),
  }),
  defaultOptions: {
    queries: {
      gcTime: 1000 * 60 * 60 * 24,
      staleTime: 2000,
    },
  },
});

const asyncStoragePersister = createAsyncStoragePersister({
  storage: AsyncStorage,
});

import LoginPage from "./src/screens/LoginPage";
import RegisterPlayerScreen from "./src/screens/RegisterPlayerScreen";
import CreateClubScreen from "./src/screens/CreateClubSaaS";
import JoinClubScreen from "./src/screens/JoinClubScreen";
import OnboardingScreen from "./src/screens/OnboardingScreen";
import DashboardScreen from "./src/screens/DashboardScreen";
import TeamScreen from "./src/screens/TeamScreen";
import TrainingsScreen from "./src/screens/TrainingsScreen";
import MatchesScreen from "./src/screens/MatchesScreen";
import CalendarSaaS from "./src/screens/CalendarSaaS";
import FinancesSaaS from "./src/screens/FinancesSaaS";
import NotificationsScreen from "./src/screens/NotificationsScreen";
import MyProfileScreen from "./src/screens/MyProfileScreen";
import DocumentsScreen from "./src/screens/DocumentsScreen";
import EquipmentScreen from "./src/screens/EquipmentScreen";
import DisciplineScreen from "./src/screens/DisciplineScreen";
import ScoutingScreen from "./src/screens/ScoutingScreen";
import TacticsScreen from "./src/screens/TacticsScreen";
import StatsScreen from "./src/screens/StatsScreen";
import MediaScreen from "./src/screens/MediaScreen";
import MoreScreen from "./src/screens/MoreScreen";
import AdminDashboardScreen from "./src/screens/admin/AdminDashboardScreen";
import AdminClubsScreen from "./src/screens/admin/AdminClubsScreen";
import AdminSubscriptionsScreen from "./src/screens/admin/AdminSubscriptionsScreen";
import AdminUsersScreen from "./src/screens/admin/AdminUsersScreen";
import AISaaSReport from "./src/screens/AISaaSReport";
import PricingScreen from "./src/screens/PricingScreen";
import StaffSaaS from "./src/screens/StaffSaaS";
import TasksSaaS from "./src/screens/TasksSaaS";
import { SafeAreaProvider, useSafeAreaInsets } from "react-native-safe-area-context";
import { MobileBottomNav } from "./src/components/ui/mobile-bottom-nav";
import { MobileTopBar } from "./src/components/ui/mobile-top-bar";
import { SaaSAppShell } from "./src/components/SaaSShell";
import { AmbientBackground } from "./src/components/ui/visuals";
import SplashScreen from "./src/components/SplashScreen";
import { themedStyles, colors, applyTheme } from "./src/constants/theme";
import { loadSavedLanguage, useTranslation } from "./src/i18n";
import { loadNotificationPrefs, useNotificationPrefs } from "./src/hooks/useNotificationPrefs";
import { buildNotifications } from "./src/utils/notifications";
import { reportQueryError } from "./src/hooks/useQueryError";
import { ErrorBanner } from "./src/components/ui/error-banner";

const DEFAULT_SUBSCRIPTION_ID = "sub-fc-autentic-free";

// Fixtură pentru verificarea automată a aspectului (`npm run check:layout`).
// Ecranele pe care le păzește stau după autentificare, iar robotul n-are cont;
// aici pornește direct în interfață, cu un utilizator fals.
//
// Se aprinde doar la build, cu `EXPO_PUBLIC_LAYOUT_CHECK=1`. Build-urile de
// producție nu o setează, deci expresia se compilează la `null` și tot ce
// depinde de ea dispare din pachet.
const LAYOUT_CHECK_USER = process.env.EXPO_PUBLIC_LAYOUT_CHECK === "1"
  ? { id: "layout-check", name: "Test", email: "test@local", role: "admin", status: "active" }
  : null;

// Rezervă folosită doar când utilizatorul nu are încă niciun club. Nu conține
// date inventate — numele, orașul, emailul și telefonul rămân goale, ca să nu
// arătăm un club care nu există. Grupele sunt cele implicite din schema bazei.
const defaultClub = {
  id: DEFAULT_CLUB_ID,
  name: "",
  logo: "",
  city: "",
  country: "",
  email: "",
  phone: "",
  description: "",
  groups: ["U13", "U16", "U19", "Juniori", "Seniori"],
  status: "active",
  blocked: false,
  plan: "Free",
  plan_name: "Free",
  createdAt: "",
};

// Idem: fără date de abonament inventate.
const defaultSubscription = {
  id: DEFAULT_SUBSCRIPTION_ID,
  clubId: DEFAULT_CLUB_ID,
  planName: "Free",
  status: "active",
  maxPlayers: null,
  startedAt: "",
  expiresAt: "",
  createdAt: "",
};

// Taburile de administrare a platformei (super-admin în mod platformă).
const ADMIN_PLATFORM_TABS = ["Panou SaaS", "Cluburi", "Abonamente SaaS", "Utilizatori", "Mai mult"];
// Când super-adminul intră în gestiunea unui club, vede și paginile lui
// operaționale; „Panou SaaS” îl readuce în modul platformă.
const ADMIN_CLUB_TABS = ["Panou SaaS", "Dashboard", "Echipă", "Antren.", "Meciuri", "Tactici", "Statistici", "Calendar", "Sarcini", "Staff", "Finanțe", "AI", "Documente", "Echipament", "Disciplină", "Scouting", "Galerie", "Mai mult"];

const roleTabs = {
  super_admin: ADMIN_PLATFORM_TABS,
  club_owner: ["Dashboard", "Echipă", "Antren.", "Meciuri", "Tactici", "Statistici", "Calendar", "Sarcini", "Staff", "Finanțe", "AI", "Abonamente", "Documente", "Echipament", "Disciplină", "Scouting", "Galerie", "Mai mult"],
  admin: ["Dashboard", "Echipă", "Antren.", "Meciuri", "Tactici", "Statistici", "Calendar", "Sarcini", "Staff", "Finanțe", "AI", "Abonamente", "Documente", "Echipament", "Disciplină", "Scouting", "Galerie", "Mai mult"],
  coach: ["Dashboard", "Echipă", "Antren.", "Meciuri", "Tactici", "Statistici", "Calendar", "Sarcini", "AI", "Documente", "Echipament", "Disciplină", "Scouting", "Galerie", "Mai mult"],
  player: ["Dashboard", "Profil", "Antren.", "Meciuri", "Tactici", "Calendar", "Documente", "Galerie", "Mai mult"],
  parent: ["Dashboard", "Profil", "Antren.", "Meciuri", "Tactici", "Calendar", "Documente", "Galerie", "Mai mult"],
  viewer: ["Dashboard", "Calendar", "Mai mult"],
  guest: ["Dashboard", "Calendar", "Mai mult"],
};

export default function App() {
  const [splashDone, setSplashDone] = useState(false);
  // `themeKey` forțează remontarea întregului arbore după schimbarea temei, ca
  // stilurile regenerate de `applyTheme` să fie preluate de toate ecranele.
  const [themeKey, setThemeKey] = useState(0);
  // Tema și limba se citesc împreună, înainte de primul render, ca să nu se
  // vadă o clipire pe tema sau limba implicită.
  const [prefsReady, setPrefsReady] = useState(false);

  useEffect(() => {
    Promise.all([
      AsyncStorage.getItem("fc_theme")
        .then((saved) => { if (saved === "light") applyTheme("light"); })
        .catch(() => {}),
      loadSavedLanguage(),
      loadNotificationPrefs(),
    ]).finally(() => setPrefsReady(true));
  }, []);

  if (!prefsReady) return <View style={{ flex: 1, backgroundColor: colors.bg }} />;

  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{ persister: asyncStoragePersister }}
    >
      <SafeAreaProvider>
        <View style={{ flex: 1, backgroundColor: colors.bg }}>
          <StatusBar barStyle={colors.isDark ? "light-content" : "dark-content"} />
          <MainApp key={themeKey} onThemeChange={() => setThemeKey((k) => k + 1)} />
          {!splashDone && <SplashScreen onDone={() => setSplashDone(true)} />}
        </View>
      </SafeAreaProvider>
    </PersistQueryClientProvider>
  );
}

function MainApp({ onThemeChange }) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isDesktopLayout = width >= 768;

  const [authView, setAuthView] = useState(LAYOUT_CHECK_USER ? "app" : "login");
  const [currentUser, setCurrentUser] = useState(LAYOUT_CHECK_USER);
  const [tab, setTab] = useState("Dashboard");
  const [selectedClubId, setSelectedClubId] = useState(null);
  // Când super-adminul intră în gestiunea unui club anume (null = mod platformă).
  const [managingClubId, setManagingClubId] = useState(null);
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState("");
  const [registerError, setRegisterError] = useState("");

  const { data: players = [] } = useQuery({
    queryKey: ["players", selectedClubId],
    queryFn: () => supabaseService.getPlayers(selectedClubId),
    enabled: isSupabaseConfigured && !!selectedClubId,
  });
  const { data: trainings = [] } = useQuery({
    queryKey: ["trainings", selectedClubId],
    queryFn: () => supabaseService.getTrainings(selectedClubId),
    enabled: isSupabaseConfigured && !!selectedClubId,
  });
  const { data: matches = [] } = useQuery({
    queryKey: ["matches", selectedClubId],
    queryFn: () => supabaseService.getMatches(selectedClubId),
    enabled: isSupabaseConfigured && !!selectedClubId,
  });
  const { data: attendance = {} } = useQuery({
    queryKey: ["attendance", selectedClubId],
    queryFn: () => supabaseService.getAttendance(selectedClubId),
    enabled: isSupabaseConfigured && !!selectedClubId,
  });
  const { data: transactions = [] } = useQuery({
    queryKey: ["transactions", selectedClubId],
    queryFn: () => supabaseService.getTransactions(selectedClubId),
    enabled: isSupabaseConfigured && !!selectedClubId,
  });
  const { data: clubs = [] } = useQuery({
    queryKey: ["clubs"],
    queryFn: () => supabaseService.getClubs(),
    enabled: isSupabaseConfigured && !!currentUser,
  });
  const { data: memberships = [] } = useQuery({
    queryKey: ["memberships", currentUser?.id],
    queryFn: () => supabaseService.getMemberships(currentUser?.id),
    enabled: isSupabaseConfigured && !!currentUser,
  });
  const { data: invitations = [] } = useQuery({
    queryKey: ["invitations", selectedClubId],
    queryFn: () => supabaseService.getInvitations(selectedClubId),
    enabled: isSupabaseConfigured && !!selectedClubId,
  });
  const { data: subscriptions = [] } = useQuery({
    queryKey: ["subscriptions"],
    queryFn: () => supabaseService.getSubscriptions(),
    enabled: isSupabaseConfigured && !!currentUser,
  });
  const { data: tasks = [] } = useQuery({
    queryKey: ["tasks", selectedClubId],
    queryFn: () => supabaseService.getTasks(selectedClubId),
    enabled: isSupabaseConfigured && !!selectedClubId,
  });
  // Aceeași cheie ca ecranul de anunțuri, ca insigna și lista să împartă cache-ul
  // și să fie reîmprospătate de aceeași notificare realtime (`chat_messages`).
  const { data: chatMessages = [] } = useQuery({
    queryKey: ["announcements", selectedClubId],
    queryFn: () => supabaseService.getChatMessages(selectedClubId),
    enabled: isSupabaseConfigured && !!selectedClubId,
  });
  // Aceeași cheie ca ecranul de notificări: insigna și lista numără la fel.
  const { data: monthlyPayments = {} } = useQuery({
    queryKey: ["monthlyPayments", selectedClubId],
    queryFn: () => supabaseService.getMonthlyPayments(selectedClubId),
    enabled: isSupabaseConfigured && !!selectedClubId,
  });
  const { data: events = [] } = useQuery({
    queryKey: ["events", selectedClubId],
    queryFn: () => supabaseService.getEvents(selectedClubId),
    enabled: isSupabaseConfigured && !!selectedClubId,
  });

  useEffect(() => {
    if (selectedClubId) return;
    if (memberships.length > 0) {
      setSelectedClubId(memberships[0].clubId || memberships[0].club_id);
    } else if (clubs.length > 0) {
      setSelectedClubId(clubs[0].id);
    } else if (currentUser) {
      setSelectedClubId(DEFAULT_CLUB_ID);
    }
  }, [memberships, clubs, selectedClubId, currentUser]);

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) return;

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session?.user) return;

      supabase
        .from("profiles")
        .select("*")
        .eq("id", session.user.id)
        .single()
        .then(({ data: profile, error }) => {
          if (error || !profile) return;
          const role = resolveEffectiveRole(profile, null);
          setCurrentUser({
            ...profile,
            email: session.user.email,
            name: profile.full_name || profile.name || session.user.email,
            role,
          });
          setAuthView("app");
          setTab(roleTabs[role]?.[0] || "Dashboard");
        });
    });
  }, []);

  const switchClub = (newClubId) => {
    setSelectedClubId(newClubId);
    queryClient.invalidateQueries();
  };

  const selectedClub = clubs.length > 0
    ? (clubs.find((c) => c.id === selectedClubId) || clubs[0])
    : defaultClub;
  const subscription = subscriptions.find((s) => (s.clubId || s.club_id) === selectedClubId) || defaultSubscription;
  const currentMembership = memberships.find((m) => {
    const membershipUserId = m.userId || m.user_id;
    const membershipClubId = m.clubId || m.club_id;
    return membershipUserId === currentUser?.id && membershipClubId === selectedClubId;
  });

  const effectiveUser = currentUser
    ? {
        ...currentUser,
        name: currentUser.name || currentUser.full_name,
        role: resolveEffectiveRole(currentUser, currentMembership),
        clubId: selectedClubId,
      }
    : null;

  const isSuperAdmin = effectiveUser?.role === "super_admin";

  // Insigna clopoțelului numără exact ce vede utilizatorul pe ecranul de
  // notificări — inclusiv categoriile pe care le-a oprit din Setări. Înainte
  // număra doar anunțurile, indiferent de preferințe.
  const notificationPrefs = useNotificationPrefs();
  const notifications = buildNotifications({
    announcements: chatMessages,
    matches,
    trainings,
    monthlyPayments,
    myPlayer: ["player", "parent"].includes(effectiveUser?.role) ? players[0] || null : null,
    isStaff: ["super_admin", "club_owner", "admin", "coach"].includes(effectiveUser?.role),
    prefs: notificationPrefs,
  });
  const managingClub = isSuperAdmin && managingClubId ? clubs.find((c) => c.id === managingClubId) : null;

  // Super-adminul vede taburile de platformă; când intră în gestiunea unui
  // club, primește și paginile operaționale ale acelui club.
  const activeTabs = isSuperAdmin
    ? (managingClub ? ADMIN_CLUB_TABS : ADMIN_PLATFORM_TABS)
    : (roleTabs[effectiveUser?.role] || roleTabs.guest);

  // Intră în gestiunea unui club (pentru super-admin) și încarcă datele lui.
  const enterClubManagement = (targetClubId, targetTab) => {
    setManagingClubId(targetClubId);
    setSelectedClubId(targetClubId);
    queryClient.invalidateQueries();
    setTab(targetTab || "Dashboard");
  };

  // Navigare care iese automat din modul „gestiune club” la revenirea în
  // paginile de platformă.
  const navigateTab = (label) => {
    if (isSuperAdmin && ADMIN_PLATFORM_TABS.includes(label)) setManagingClubId(null);
    setTab(label);
  };

  const playerMutation = useMutation({
    mutationFn: async ({ type, payload }) => {
      if (type === "insert") return supabaseService.insertPlayer(payload);
      if (type === "update") return supabaseService.updatePlayer(payload);
      throw new Error("Tip mutation necunoscut pentru jucător.");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["players"] });
    },
    onError: (err) => {
      Alert.alert("Eroare", err.message);
    },
  });

  const attendanceMutation = useMutation({
    mutationFn: async ({ tId, pId, status }) => supabaseService.saveAttendance(tId, pId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["attendance"] });
    },
    onError: (err) => Alert.alert("Eroare prezență", err.message),
  });

  const handlePlayersChange = (updater) => {
    const next = typeof updater === "function" ? updater(players) : updater;
    if (!Array.isArray(next)) return;

    if (next.length > players.length) {
      // Limita planului era salvată și afișată în panoul de administrare, dar
      // nimic nu o impunea: se puteau adăuga oricâți jucători pe planul Free.
      const max = subscription?.maxPlayers;
      if (max != null && players.length >= max) {
        Alert.alert(
          t('plan.limitTitle'),
          t('plan.limitMsg', { plan: subscription?.planName || "", max, count: players.length }),
        );
        return;
      }
      const newPlayer = next.find((p) => !players.some((existing) => existing.id === p.id));
      if (newPlayer) {
        playerMutation.mutate({
          type: "insert",
          payload: { ...newPlayer, clubId: selectedClubId || DEFAULT_CLUB_ID },
        });
      }
      return;
    }

    const changed = next.find((p) => {
      const existing = players.find((ep) => ep.id === p.id);
      return existing && JSON.stringify(existing) !== JSON.stringify(p);
    });
    if (changed) {
      playerMutation.mutate({ type: "update", payload: changed });
    }
  };

  const handleAttendanceChange = (nextAttendance) => {
    queryClient.setQueryData(["attendance", selectedClubId], nextAttendance);

    Object.keys(nextAttendance || {}).forEach((tId) => {
      Object.keys(nextAttendance[tId] || {}).forEach((pId) => {
        const oldStatus = attendance[tId]?.[pId];
        const newStatus = nextAttendance[tId][pId];
        if (oldStatus !== newStatus) {
          attendanceMutation.mutate({
            tId: Number(tId) || tId,
            pId: Number(pId) || pId,
            status: newStatus,
          });
        }
      });
    });
  };

  const enterApp = async (profile, email) => {
    const role = resolveEffectiveRole(profile, null);
    const user = {
      ...profile,
      email: email || profile.email,
      name: profile.full_name || profile.name || email,
      role,
    };
    setCurrentUser(user);
    setTab(roleTabs[role]?.[0] || "Dashboard");

    // Utilizatorii care au deja un club (membership activ) intră direct în
    // aplicație; onboarding-ul cu "Creează club / Alătură-te" apare doar
    // pentru conturile fără niciun club.
    try {
      const userMemberships = await supabaseService.getMemberships(user.id);
      const activeMembership = (userMemberships || []).find((m) => m.status === "active");
      if (activeMembership) {
        setSelectedClubId(activeMembership.clubId || activeMembership.club_id);
        setAuthView("app");
        return;
      }
      // Cererea de alăturare așteaptă aprobarea owner-ului.
      const pendingMembership = (userMemberships || []).find((m) => m.status === "pending");
      if (pendingMembership) {
        setAuthView("pending-approval");
        return;
      }
    } catch (e) {
      console.warn("Nu am putut verifica cluburile utilizatorului:", e.message);
    }
    setAuthView("onboarding-choice");
  };

  const recheckMembership = async () => {
    if (!currentUser?.id) return;
    try {
      const userMemberships = await supabaseService.getMemberships(currentUser.id);
      const active = (userMemberships || []).find((m) => m.status === "active");
      if (active) {
        setSelectedClubId(active.clubId || active.club_id);
        queryClient.invalidateQueries();
        setAuthView("app");
      }
    } catch (e) {
      console.warn("Nu am putut reverifica statusul:", e.message);
    }
  };

  const loginWithEmail = async (email, password) => {
    setAuthLoading(true);
    setAuthError("");
    try {
      if (!isSupabaseConfigured || !supabase) {
        throw new Error(
          supabaseConfigError ||
            "Supabase nu este configurat. Adaugă EXPO_PUBLIC_SUPABASE_URL și EXPO_PUBLIC_SUPABASE_ANON_KEY."
        );
      }

      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", data.user.id)
        .single();

      // Profilul lipsește (cont creat înainte de trigger-ul de signup):
      // inserăm doar câmpurile obligatorii, iar rolul rămâne pe default-ul DB.
      if (profileError) {
        const defaultProfile = {
          id: data.user.id,
          email: data.user.email,
          full_name: data.user.email?.split("@")[0] || "User",
        };
        const { error: insertError } = await supabase
          .from("profiles")
          .insert(defaultProfile);
        if (insertError) {
          console.error("Error creating profile:", insertError);
          // Continue with default profile anyway
        }
        await enterApp(defaultProfile, data.user.email);
      } else {
        await enterApp(profile, data.user.email);
      }
    } catch (e) {
      setAuthError(e.message);
    } finally {
      setAuthLoading(false);
    }
  };

  const registerPlayer = async (form) => {
    setAuthLoading(true);
    setRegisterError("");
    try {
      await authService.signUp({
        email: form.email,
        password: form.password,
        fullName: form.name,
        groupName: form.group,
        playerNo: form.no,
        playerPosition: form.role,
        joinCode: form.clubCode,
        role: form.accountType === "parent" ? "parent" : "player",
      });
      Alert.alert(
        "Cont creat",
        `Cererea ta de alăturare ca ${form.accountType === "parent" ? "părinte" : "jucător"} a fost trimisă. Un administrator al clubului trebuie să o aprobe. Dacă e nevoie, confirmă emailul, apoi autentifică-te.`
      );
      setAuthView("login");
    } catch (e) {
      setRegisterError(e.message);
    } finally {
      setAuthLoading(false);
    }
  };

  const signInWithGoogle = async () => {
    setAuthError("");
    if (!isSupabaseConfigured || !supabase) {
      setAuthError(supabaseConfigError || "Supabase nu este configurat.");
      return;
    }
    if (Platform.OS !== "web") {
      Alert.alert("Google", "Autentificarea Google este disponibilă în versiunea web a aplicației.");
      return;
    }
    // Redirect real către Google. La revenire, sesiunea e preluată automat
    // de supabase.auth.getSession() din efectul de montare.
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin },
    });
    if (error) setAuthError(error.message);
  };

  const signUpWithEmail = async (form) => {
    if (!isSupabaseConfigured || !supabase) {
      throw new Error(
        supabaseConfigError ||
          "Supabase nu este configurat. Adaugă EXPO_PUBLIC_SUPABASE_URL și EXPO_PUBLIC_SUPABASE_ANON_KEY."
      );
    }
    await authService.signUp({ email: form.email, password: form.password, fullName: form.name });
  };

  // Aruncă erori în loc de Alert — LoginPage afișează mesajele inline (Alert e no-op pe web).
  const resetPassword = async (email) => {
    if (!isSupabaseConfigured || !supabase) {
      throw new Error(
        supabaseConfigError ||
          "Adaugă EXPO_PUBLIC_SUPABASE_URL și EXPO_PUBLIC_SUPABASE_ANON_KEY pentru resetarea parolei."
      );
    }
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim());
    if (error) throw error;
    return true;
  };

  const logout = async () => {
    if (isSupabaseConfigured && supabase) {
      await supabase.auth.signOut();
    }
    setCurrentUser(null);
    setSelectedClubId(null);
    setAuthView("login");
  };

  const toggleTask = async (id) => {
    const task = tasks.find((t) => t.id === id);
    if (!task) return;
    try {
      await supabaseService.setTaskDone(id, !task.done);
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    } catch (e) {
      Alert.alert("Eroare sarcină", e.message);
    }
  };

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) return;

    const tableToKey = {
      players: "players",
      clubs: "clubs",
      subscriptions: "subscriptions",
      chat_messages: "announcements",
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
      tactics: "tactics",
      club_tasks: "tasks",
      training_payments: "payments",
      monthly_payments: "monthlyPayments",
    };

    const channel = supabase.channel("realtime-public-tables");

    Object.keys(tableToKey).forEach((table) => {
      channel.on("postgres_changes", { event: "*", schema: "public", table }, (payload) => {
        const key = tableToKey[payload.table];
        if (!key) return;
        // Aceste chei sunt interogate global (fără club_id în cheie): memberships
        // e indexat după user_id, iar clubs/subscriptions sunt liste de platformă.
        // Invalidăm întreaga familie ca să nu ratăm actualizări.
        if (key === "memberships" || key === "clubs" || key === "subscriptions") {
          queryClient.invalidateQueries({ queryKey: [key] });
          return;
        }
        const clubId = payload.new?.club_id || payload.old?.club_id;
        if (clubId) {
          queryClient.invalidateQueries({ queryKey: [key, clubId] });
        } else {
          queryClient.invalidateQueries({ queryKey: [key] });
        }
      });
    });

    channel.subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  const pages = {
    Dashboard: (
        <DashboardScreen
          tasks={tasks}
          toggleTask={toggleTask}
          players={players}
          trainings={trainings}
          matches={matches}
          attendance={attendance}
          transactions={transactions}
          currentUser={effectiveUser}
          setTab={setTab}
          selectedClub={selectedClub}
          subscription={subscription}
          memberships={memberships}
          invitations={invitations}
          openNotifications={() => setTab("Notif.")}
        />
      ),
    "Echipă": (
      <TeamScreen
        players={players}
        setPlayers={handlePlayersChange}
        currentUser={effectiveUser}
        trainings={trainings}
        attendance={attendance}
        selectedClub={selectedClub}
        clubId={selectedClubId}
        setTab={setTab}
      />
    ),
    "Antren.": (
      <TrainingsScreen
        players={players}
        trainings={trainings}
        attendance={attendance}
        setAttendance={handleAttendanceChange}
        currentUser={effectiveUser}
        selectedClub={selectedClub}
        clubId={selectedClubId}
      />
    ),
    Meciuri: (
      <MatchesScreen
        players={players}
        matches={matches}
        currentUser={effectiveUser}
        clubId={selectedClubId}
        selectedClub={selectedClub}
      />
    ),
    Calendar: (
      <CalendarSaaS
        trainings={trainings}
        matches={matches}
        events={events}
        clubId={selectedClubId}
        currentUser={effectiveUser}
      />
    ),
    Sarcini: <TasksSaaS tasks={tasks} clubId={selectedClubId} currentUser={effectiveUser} />,
    Staff: (
      <StaffSaaS
        selectedClub={selectedClub}
        clubId={selectedClubId}
        currentUser={effectiveUser}
      />
    ),
    "Finanțe": (
      <FinancesSaaS
        players={players}
        trainings={trainings}
        transactions={transactions}
        selectedClub={selectedClub}
        clubId={selectedClubId}
        currentUser={effectiveUser}
      />
    ),
    AI: (
      <AISaaSReport
        currentUser={effectiveUser}
        selectedClub={selectedClub}
      />
    ),
    Abonamente: (
      <PricingScreen
        selectedClub={selectedClub}
        subscription={subscription}
        currentUser={effectiveUser}
        players={players}
      />
    ),
    "Panou SaaS": (
      <AdminDashboardScreen clubs={clubs} onCreateClub={() => setAuthView("create-club")} goTo={navigateTab} />
    ),
    "Cluburi": (
      <AdminClubsScreen clubs={clubs} onCreateClub={() => setAuthView("create-club")} onManageClub={enterClubManagement} />
    ),
    "Abonamente SaaS": (
      <AdminSubscriptionsScreen clubs={clubs} />
    ),
    "Utilizatori": (
      <AdminUsersScreen clubs={clubs} onManageClub={enterClubManagement} />
    ),
    "Notif.": (
      <NotificationsScreen
        currentUser={effectiveUser}
        clubId={selectedClubId}
        selectedClub={selectedClub}
        players={players}
        matches={matches}
        trainings={trainings}
      />
    ),
    "Documente": (
      <DocumentsScreen
        clubId={selectedClubId}
        selectedClub={managingClub || selectedClub}
        currentUser={effectiveUser}
      />
    ),
    "Echipament": (
      <EquipmentScreen
        clubId={selectedClubId}
        selectedClub={managingClub || selectedClub}
        currentUser={effectiveUser}
      />
    ),
    "Disciplină": (
      <DisciplineScreen
        clubId={selectedClubId}
        players={players}
        selectedClub={managingClub || selectedClub}
        currentUser={effectiveUser}
      />
    ),
    "Scouting": (
      <ScoutingScreen
        clubId={selectedClubId}
        selectedClub={managingClub || selectedClub}
        currentUser={effectiveUser}
      />
    ),
    "Tactici": (
      <TacticsScreen
        clubId={selectedClubId}
        players={players}
        selectedClub={managingClub || selectedClub}
        currentUser={effectiveUser}
      />
    ),
    "Statistici": (
      <StatsScreen
        players={players}
        matches={matches}
        attendance={attendance}
        selectedClub={managingClub || selectedClub}
        currentUser={effectiveUser}
      />
    ),
    "Galerie": (
      <MediaScreen
        clubId={selectedClubId}
        selectedClub={managingClub || selectedClub}
        currentUser={effectiveUser}
      />
    ),
    "Profil": (
      <MyProfileScreen
        currentUser={effectiveUser}
        players={players}
        trainings={trainings}
        matches={matches}
        attendance={attendance}
        clubId={selectedClubId}
        selectedClub={selectedClub}
      />
    ),
    "Mai mult": (
      <MoreScreen
        onThemeChange={onThemeChange}
        currentUser={effectiveUser}
        onLogout={logout}
        selectedClub={selectedClub}
        clubs={clubs}
        switchClub={switchClub}
        onCreateClub={() => setAuthView("create-club")}
        openNotifications={() => setTab("Notif.")}
        tabs={activeTabs}
        setTab={navigateTab}
      />
    ),
  };

  if (authView === "login") {
    return (
      <LoginPage
        onBack={() => setAuthView("login")}
        onLogin={loginWithEmail}
        onSignup={signUpWithEmail}
        loading={authLoading}
        error={authError}
        onRegister={() => {
          setAuthError("");
          setRegisterError("");
          setAuthView("register");
        }}
        onGoogle={signInWithGoogle}
        onForgot={resetPassword}
      />
    );
  }

  if (authView === "register") {
    return (
      <RegisterPlayerScreen
        onBack={() => setAuthView("login")}
        onRegister={registerPlayer}
        loading={authLoading}
        error={registerError}
      />
    );
  }

  if (authView === "onboarding-choice") {
    return (
      <OnboardingScreen
        currentUser={effectiveUser || currentUser}
        invitations={invitations}
        onCreateClub={() => setAuthView("create-club")}
        onJoinClub={() => setAuthView("join-club")}
        onAcceptInvitation={() => setAuthView("app")}
        onLogout={logout}
        openNotifications={() => setTab("Notif.")}
      />
    );
  }

  if (authView === "create-club") {
    return (
      <CreateClubScreen
        userId={currentUser?.id}
        currentUser={currentUser}
        onBack={() => setAuthView("onboarding-choice")}
        onSuccess={(newClub) => {
          queryClient.invalidateQueries({ queryKey: ["clubs"] });
          queryClient.invalidateQueries({ queryKey: ["memberships"] });
          if (newClub?.id) setSelectedClubId(newClub.id);
          if (newClub?.joinCode) {
            Alert.alert(
              "Club creat",
              `Codul de înregistrare pentru jucători este: ${newClub.joinCode}\n\nÎl găsești oricând în ecranul Staff. Dă-l jucătorilor ca să se alăture clubului.`
            );
          }
          setAuthView("app");
        }}
      />
    );
  }

  if (authView === "join-club") {
    return (
      <JoinClubScreen
        onBack={() => setAuthView("onboarding-choice")}
        onSuccess={() => setAuthView("app")}
      />
    );
  }

  if (authView === "pending-approval") {
    return (
      <View style={[styles.safe, { paddingTop: insets.top }]}>
        <StatusBar barStyle="light-content" />
        <View style={styles.pendingWrap}>
          <View style={styles.pendingCard}>
            <View style={styles.pendingIcon}>
              <Text style={{ fontSize: 34 }}>⏳</Text>
            </View>
            <Text style={styles.pendingTitle}>Cererea ta așteaptă aprobarea</Text>
            <Text style={styles.pendingText}>
              Contul tău a fost creat. Un administrator al clubului trebuie să îți aprobe alăturarea.
              Vei avea acces imediat ce ești aprobat.
            </Text>
            <Pressable style={styles.pendingPrimary} onPress={recheckMembership}>
              <Text style={styles.pendingPrimaryText}>Verifică din nou</Text>
            </Pressable>
            <Pressable style={styles.pendingGhost} onPress={logout}>
              <Text style={styles.pendingGhostText}>Ieșire</Text>
            </Pressable>
          </View>
        </View>
      </View>
    );
  }

  return (
    <ProfileContext.Provider
      value={{
        user: effectiveUser,
        selectedClub: managingClub || selectedClub,
        onLogout: logout,
        onNavigate: navigateTab,
      }}
    >
      <View style={styles.safe}>
        <StatusBar barStyle="light-content" />
        {isDesktopLayout ? (
          <View style={{ flex: 1, paddingTop: insets.top }}>
            <SaaSAppShell
              tabs={activeTabs}
              activeTab={tab}
              setTab={navigateTab}
              user={effectiveUser}
              selectedClub={managingClub || selectedClub}
              onLogout={logout}
              notificationsCount={notifications.length}
              searchData={{ players, matches, trainings, tasks }}
            >
              <ErrorBanner onRetry={() => queryClient.invalidateQueries()} style={{ marginHorizontal: 0, marginBottom: 10 }} />
              {pages[tab] || pages[activeTabs[0]] || pages.Dashboard}
            </SaaSAppShell>
          </View>
        ) : (
          <>
            <AmbientBackground />
            {/* Nici sus, nici jos containerul paginii nu ia spațiu pentru
                bare. Pus aici, el ar scurta zona de derulare, deci conținutul
                s-ar opri tăiat pe o muchie dreaptă în loc să treacă pe sub
                bară. Spațiul stă în conținutul derulabil al fiecărui ecran —
                `layout.topBarClearance` și `layout.navClearance`. */}
            <View style={styles.app}>
              {pages[tab] || pages[activeTabs[0]] || pages.Dashboard}
            </View>
            {/* Banda de eroare stă peste pagină, sub antet, ca să se vadă
                indiferent pe ce ecran a picat cererea. */}
            <View style={[styles.errorSlot, { top: insets.top + 58 }]} pointerEvents="box-none">
              <ErrorBanner onRetry={() => queryClient.invalidateQueries()} />
            </View>
            {/* Bara de sus vine după pagină, ca să stea peste ea. */}
            <MobileTopBar topInset={insets.top} onNotifications={() => navigateTab("Notif.")} notificationsCount={notifications.length} />
            <MobileBottomNav
              tabs={activeTabs}
              activeTab={tab}
              onTabPress={navigateTab}
              bottomInset={insets.bottom}
            />
          </>
        )}
      </View>
    </ProfileContext.Provider>
  );
}

const styles = themedStyles((C) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },
  // Ordine explicită, ca banda să rămână peste conținutul paginii.
  errorSlot: { position: "absolute", left: 0, right: 0, zIndex: 30 },
  app: { flex: 1 },
  appDesktop: { paddingTop: 92, paddingBottom: 24 },
  pendingWrap: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 },
  pendingCard: { width: "100%", maxWidth: 420, backgroundColor: "rgba(15,23,42,0.6)", borderRadius: 24, padding: 28, borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", alignItems: "center" },
  pendingIcon: { width: 72, height: 72, borderRadius: 36, backgroundColor: "rgba(250,204,21,0.12)", borderWidth: 1, borderColor: "rgba(250,204,21,0.3)", alignItems: "center", justifyContent: "center", marginBottom: 18 },
  pendingTitle: { color: "white", fontSize: 20, fontWeight: "900", textAlign: "center" },
  pendingText: { color: "#94A3B8", fontSize: 13, fontWeight: "600", textAlign: "center", lineHeight: 20, marginTop: 10, marginBottom: 22 },
  pendingPrimary: { width: "100%", height: 50, borderRadius: 14, backgroundColor: "#0D8BFF", alignItems: "center", justifyContent: "center" },
  pendingPrimaryText: { color: "white", fontSize: 14, fontWeight: "900" },
  pendingGhost: { width: "100%", height: 46, borderRadius: 14, alignItems: "center", justifyContent: "center", marginTop: 10 },
  pendingGhostText: { color: "#94A3B8", fontSize: 13, fontWeight: "800" },
}));

