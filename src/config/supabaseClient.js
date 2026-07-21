import "react-native-url-polyfill/auto";
import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

// Pe web detectăm sesiunea din URL după redirect-ul OAuth (Google).
const isWeb = Platform.OS === "web";

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const supabaseConfigError = !isSupabaseConfigured
  ? "Supabase nu este configurat. Creează fișierul .env și adaugă EXPO_PUBLIC_SUPABASE_URL și EXPO_PUBLIC_SUPABASE_ANON_KEY."
  : null;

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        storage: AsyncStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: isWeb,
      },
    })
  : null;

export function requireSupabase() {
  if (!supabase) {
    throw new Error(supabaseConfigError);
  }
  return supabase;
}
