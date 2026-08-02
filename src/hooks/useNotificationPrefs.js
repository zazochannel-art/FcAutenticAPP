import { useSyncExternalStore } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { NOTIFICATION_KINDS } from "../utils/notifications";

// Preferințele de notificări stăteau doar în ecranul de Setări, salvate în
// memoria telefonului, și nimic altceva nu le citea — comutatoarele nu opreau
// nimic. Aici devin un magazin comun: Setările le schimbă, iar restul
// aplicației se abonează la aceeași sursă și se redesenează singur.

const STORAGE_KEY = "fc_notif_prefs";

const DEFAULTS = Object.freeze(
  NOTIFICATION_KINDS.reduce((acc, kind) => ({ ...acc, [kind]: true }), {}),
);

let prefs = DEFAULTS;
const listeners = new Set();

function emit() {
  listeners.forEach((l) => l());
}

function subscribe(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot() {
  return prefs;
}

export async function loadNotificationPrefs() {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return prefs;
    const saved = JSON.parse(raw);
    // Doar cheile cunoscute: o valoare rămasă de la o versiune veche n-are ce
    // căuta în starea curentă.
    const next = { ...DEFAULTS };
    NOTIFICATION_KINDS.forEach((kind) => {
      if (typeof saved?.[kind] === "boolean") next[kind] = saved[kind];
    });
    prefs = next;
    emit();
  } catch (_) { /* preferințele lipsă cad pe valorile implicite */ }
  return prefs;
}

export function toggleNotificationPref(kind) {
  if (!NOTIFICATION_KINDS.includes(kind)) return;
  prefs = { ...prefs, [kind]: !prefs[kind] };
  emit();
  AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(prefs)).catch(() => {});
}

export function getNotificationPrefs() {
  return prefs;
}

export function useNotificationPrefs() {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}
