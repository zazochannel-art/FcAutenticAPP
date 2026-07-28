import { useCallback, useSyncExternalStore } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { dictionaries, ro } from "./translations";

export const STORAGE_KEY = "fc_lang";

// Codul afișat în selector și cheia dicționarului. Sunt separate pentru că
// eticheta („RU") nu coincide cu cheia („ru").
export const LANGUAGES = [
  { key: "ro", label: "Ro" },
  { key: "ru", label: "RU" },
  { key: "en", label: "En" },
];

export const DEFAULT_LANGUAGE = "ro";

// Un store minimal, în afara React: limba se schimbă rar, iar componentele se
// abonează prin `useSyncExternalStore`. Nu e nevoie de context sau de
// remontarea aplicației, ca la temă — textele se recalculează la render.
let current = DEFAULT_LANGUAGE;
const listeners = new Set();

function emit() {
  listeners.forEach((listener) => listener());
}

function subscribe(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getLanguage() {
  return current;
}

export function isSupported(lang) {
  return Object.prototype.hasOwnProperty.call(dictionaries, lang);
}

export function setLanguage(lang, { persist = true } = {}) {
  if (!isSupported(lang) || lang === current) return;
  current = lang;
  if (persist) AsyncStorage.setItem(STORAGE_KEY, lang).catch(() => {});
  emit();
}

// Se apelează o dată, la pornire, înainte de primul render — ca limba salvată
// să fie deja activă și să nu se vadă o clipire în română.
export async function loadSavedLanguage() {
  try {
    const saved = await AsyncStorage.getItem(STORAGE_KEY);
    if (isSupported(saved)) setLanguage(saved, { persist: false });
  } catch {
    // AsyncStorage indisponibil — rămânem pe limba implicită
  }
  return current;
}

// Româna e referința: o cheie lipsă dintr-o altă limbă cade înapoi pe `ro`,
// iar o cheie inexistentă se întoarce ca atare, ca să fie vizibilă la testare.
export function translate(key, lang = current) {
  const dict = dictionaries[lang] || ro;
  return dict[key] ?? ro[key] ?? key;
}

export function useTranslation() {
  const lang = useSyncExternalStore(subscribe, getLanguage, getLanguage);
  const t = useCallback((key) => translate(key, lang), [lang]);
  return { t, lang, setLanguage };
}
