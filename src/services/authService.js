import { requireSupabase } from "../config/supabaseClient";

export const authService = {
  async getSession() {
    const { data, error } = await requireSupabase().auth.getSession();
    if (error) throw error;
    return data.session;
  },

  async signIn(email, password) {
    const { data, error } = await requireSupabase().auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  },

  async signUp({ email, password, fullName, groupName, playerNo, playerPosition, joinCode, role = "player" }) {
    // Datele de jucător + codul de club intră în metadata; trigger-ul din DB
    // (handle_new_player_signup) creează membership-ul pending în clubul
    // identificat prin cod, cu rolul dorit (jucător sau părinte). Fără cod se
    // creează doar un profil.
    const desiredRole = role === "parent" ? "parent" : "player";
    const metadata = { full_name: fullName, desired_role: desiredRole };
    if (groupName) {
      // Pentru părinte, grupa reprezintă grupa copilului (opțional).
      metadata.group_name = groupName;
    }
    if (desiredRole === "player" && (playerPosition || playerNo)) {
      metadata.player_no = String(playerNo || 0);
      metadata.player_position = playerPosition || "Jucător";
    }
    if (joinCode) {
      metadata.join_code = String(joinCode).trim().toUpperCase();
    }
    const { data, error } = await requireSupabase().auth.signUp({
      email,
      password,
      options: { data: metadata },
    });
    if (error) throw error;
    return data;
  },

  async signOut() {
    const { error } = await requireSupabase().auth.signOut();
    if (error) throw error;
    return true;
  },

  async getMyProfile() {
    const { data: userData, error: userError } = await requireSupabase().auth.getUser();
    if (userError) throw userError;
    const userId = userData.user?.id;
    if (!userId) return null;

    const { data, error } = await requireSupabase().from("profiles").select("*").eq("id", userId).single();
    if (error) throw error;
    return data;
  },
};
