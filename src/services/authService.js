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

  async signUp({ email, password, fullName, groupName, playerNo, playerPosition }) {
    // Câmpurile de jucător intră în metadata doar la înregistrarea de jucători:
    // trigger-ul din DB creează rândul de player numai când acestea există.
    const metadata = { full_name: fullName };
    if (groupName || playerPosition || playerNo) {
      metadata.group_name = groupName || "U19";
      metadata.player_no = String(playerNo || 0);
      metadata.player_position = playerPosition || "Jucător";
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
