import { useSyncExternalStore } from "react";

// Doar 3 din 25 de ecrane tratau eșecul unei cereri. Restul arătau „nu există
// date” și când Supabase era picat sau când o politică de acces bloca citirea —
// utilizatorul credea că i-au dispărut datele.
//
// În loc să adaug o stare de eroare în fiecare ecran, o prind într-un singur
// loc: cache-ul de interogări raportează aici, iar carcasa aplicației arată o
// bandă. Așa acoperim orice cerere, inclusiv pe cele adăugate mai târziu.

let current = null;
const listeners = new Set();

function emit() {
  listeners.forEach((l) => l());
}

function subscribe(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot() {
  return current;
}

export function reportQueryError(error) {
  const message = error?.message || String(error || "");
  // Aceeași eroare la rând (mai multe cereri cad odată când rețeaua pică) nu
  // trebuie să clipească banda de fiecare dată.
  if (current?.message === message) return;
  current = { message, at: Date.now() };
  emit();
}

export function clearQueryError() {
  if (!current) return;
  current = null;
  emit();
}

export function useQueryError() {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}
