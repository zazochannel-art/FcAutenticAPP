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

import { isSupabaseConfigured, supabase, supabaseConfigError } from "./src/config/supabaseClient";
import { supabaseService, DEFAULT_CLUB_ID } from "./src/services/supabaseService";
import { authService } from "./src/services/authService";

const queryClient = new QueryClient({
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
import MoreScreen from "./src/screens/MoreScreen";
import SaasAdminScreen from "./src/screens/SaasAdminScreen";
import AISaaSReport from "./src/screens/AISaaSReport";
import PricingScreen from "./src/screens/PricingScreen";
import StaffSaaS from "./src/screens/StaffSaaS";
import TasksSaaS from "./src/screens/TasksSaaS";
import { MobileBottomNav } from "./src/components/ui/mobile-bottom-nav";
import { SaaSAppShell } from "./src/components/SaaSShell";
import SplashScreen from "./src/components/SplashScreen";

const DEFAULT_SUBSCRIPTION_ID = "sub-fc-autentic-free";

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
  plan_name: "Free",
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


function normalizeMembershipRole(role) {
  if (role === "owner") return "club_owner";
  return role;
}

function resolveEffectiveRole(profile, membership) {
  if (profile?.platform_role === "super_admin") return "super_admin";
  if (profile?.role === "super_admin") return "super_admin";
  if (membership?.role) return normalizeMembershipRole(membership.role);
  if (profile?.role === "admin") return "admin";
  if (profile?.platform_role) return profile.platform_role;
  return "viewer";
}

const roleTabs = {
  super_admin: ["Dashboard", "Echipă", "Antren.", "Meciuri", "Calendar", "Sarcini", "Staff", "Finanțe", "AI", "Abonamente", "Admin SaaS", "Mai mult"],
  club_owner: ["Dashboard", "Echipă", "Antren.", "Meciuri", "Calendar", "Sarcini", "Staff", "Finanțe", "AI", "Abonamente", "Mai mult"],
  admin: ["Dashboard", "Echipă", "Antren.", "Meciuri", "Calendar", "Sarcini", "Staff", "Finanțe", "AI", "Abonamente", "Mai mult"],
  coach: ["Dashboard", "Echipă", "Antren.", "Meciuri", "Calendar", "Sarcini", "AI", "Mai mult"],
  player: ["Dashboard", "Antren.", "Meciuri", "Calendar", "Mai mult"],
  parent: ["Dashboard", "Antren.", "Meciuri", "Calendar", "Mai mult"],
  viewer: ["Dashboard", "Calendar", "Mai mult"],
  guest: ["Dashboard", "Calendar", "Mai mult"],
};

export default function App() {
  const [splashDone, setSplashDone] = useState(false);
  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{ persister: asyncStoragePersister }}
    >
      <SafeAreaView style={{ flex: 1, backgroundColor: "#020617" }}>
        <StatusBar barStyle="light-content" />
        <MainApp />
        {!splashDone && <SplashScreen onDone={() => setSplashDone(true)} />}
      </SafeAreaView>
    </PersistQueryClientProvider>
  );
}

function MainApp() {
  const queryClient = useQueryClient();
  const { width } = useWindowDimensions();
  const isDesktopLayout = width >= 768;

  const [authView, setAuthView] = useState("login");
  const [currentUser, setCurrentUser] = useState(null);
  const [tab, setTab] = useState("Dashboard");
  const [clubSettings] = useState({ clubName: "FC Autentic" });
  const [selectedClubId, setSelectedClubId] = useState(null);
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

  const baseTabs = roleTabs[effectiveUser?.role] || roleTabs.guest;
  const activeTabs = baseTabs;

  const playerMutation = useMutation({
    mutationFn: async ({ type, payload }) => {
      if (type === "insert") return supabaseService.insertPlayer(payload);
      if (type === "update") return supabaseService.updatePlayer(payload);
      throw new Error("Tip mutation necunoscut pentru jucător.");
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["players"] });
    },
    onError: (err, variables) => {
      Alert.alert("Eroare", err.message);
    },
  });

  const attendanceMutation = useMutation({
    mutationFn: async ({ tId, pId, status }) => supabaseService.saveAttendance(tId, pId, status),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["attendance"] });
    },
    onError: (err) => Alert.alert("Eroare prezență", err.message),
  });

  const handlePlayersChange = (updater) => {
    const next = typeof updater === "function" ? updater(players) : updater;
    if (!Array.isArray(next)) return;

    if (next.length > players.length) {
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
      });
      Alert.alert(
        "Cont creat",
        "Cererea ta de alăturare a fost trimisă. Un administrator al clubului trebuie să o aprobe. Dacă e nevoie, confirmă emailul, apoi autentifică-te."
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
      club_tasks: "tasks",
      training_payments: "payments",
      monthly_payments: "monthlyPayments",
    };

    const channel = supabase.channel("realtime-public-tables");

    Object.keys(tableToKey).forEach((table) => {
      channel.on("postgres_changes", { event: "*", schema: "public", table }, (payload) => {
        const key = tableToKey[payload.table];
        if (!key) return;
        // Cheile pentru memberships nu sunt indexate după club_id, ci după user_id —
        // invalidăm întreaga familie ca să nu ratăm actualizări.
        if (key === "memberships") {
          queryClient.invalidateQueries({ queryKey: ["memberships"] });
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
          clubSettings={clubSettings}
          currentUser={effectiveUser}
          setTab={setTab}
          selectedClub={selectedClub}
          subscription={subscription}
          memberships={memberships}
          invitations={invitations}
          openNotifications={() => setTab("Mai mult")}
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
        setTab={setTab}
        openNotifications={() => setTab("Mai mult")}
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
        openNotifications={() => setTab("Mai mult")}
      />
    ),
    Meciuri: (
      <MatchesScreen
        players={players}
        matches={matches}
        currentUser={effectiveUser}
        clubId={selectedClubId}
        openNotifications={() => setTab("Mai mult")}
      />
    ),
    Calendar: (
      <CalendarSaaS
        trainings={trainings}
        matches={matches}
        events={events}
        clubId={selectedClubId}
        currentUser={effectiveUser}
        openNotifications={() => setTab("Mai mult")}
      />
    ),
    Sarcini: <TasksSaaS tasks={tasks} clubId={selectedClubId} currentUser={effectiveUser} />,
    Staff: (
      <StaffSaaS
        selectedClub={selectedClub}
        clubId={selectedClubId}
        currentUser={effectiveUser}
        openNotifications={() => setTab("Mai mult")}
      />
    ),
    "Finanțe": (
      <FinancesSaaS
        players={players}
        trainings={trainings}
        transactions={transactions}
        clubId={selectedClubId}
        currentUser={effectiveUser}
        clubSettings={clubSettings}
        openNotifications={() => setTab("Mai mult")}
      />
    ),
    AI: (
      <AISaaSReport
        currentUser={effectiveUser}
        selectedClub={selectedClub}
        openNotifications={() => setTab("Mai mult")}
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
    "Admin SaaS": (
      <SaasAdminScreen clubs={clubs} players={players} memberships={memberships} onCreateClub={() => setAuthView("create-club")} openNotifications={() => setTab("Mai mult")} />
    ),
    "Notif.": (
      <NotificationsScreen currentUser={effectiveUser} openNotifications={() => setTab("Notif.")} />
    ),
    "Mai mult": (
      <MoreScreen
        currentUser={effectiveUser}
        onLogout={logout}
        selectedClub={selectedClub}
        clubs={clubs}
        switchClub={switchClub}
        onCreateClub={() => setAuthView("create-club")}
        openNotifications={() => setTab("Notif.")}
        tabs={activeTabs}
        setTab={setTab}
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
        openNotifications={() => setTab("Mai mult")}
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
      <SafeAreaView style={styles.safe}>
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
      </SafeAreaView>
    );
  }

  const tabIconsMapping = {
    Dashboard: "LayoutGrid",
    "Echipă": "Users",
    "Antren.": "Dumbbell",
    Meciuri: "Trophy",
    Calendar: "CalendarDays",
    Sarcini: "ListChecks",
    Staff: "UserCog",
    "Finanțe": "Wallet",
    AI: "Sparkles",
    Abonamente: "CreditCard",
    "Admin SaaS": "ShieldCheck",
    "Mai mult": "Menu",
  };

  const navTabs = activeTabs.map((label) => ({
    title: label,
    icon: tabIconsMapping[label] || "Circle",
  }));

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" />
      {isDesktopLayout ? (
        <SaaSAppShell
          tabs={activeTabs}
          activeTab={tab}
          setTab={setTab}
          user={effectiveUser}
          selectedClub={selectedClub}
        >
          {pages[tab] || pages.Dashboard}
        </SaaSAppShell>
      ) : (
        <>
          <View style={styles.app}>{pages[tab] || pages.Dashboard}</View>
          <MobileBottomNav
            tabs={activeTabs}
            activeTab={tab}
            onTabPress={(label) => setTab(label)}
          />
        </>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#020617" },
  app: { flex: 1, paddingBottom: Platform.OS === "ios" ? 100 : 80 },
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
});

