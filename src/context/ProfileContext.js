import { createContext, useContext } from "react";

// Furnizează datele de profil (user, club, logout, navigare) barelor de sus
// din ecrane, fără a le trece prin props la fiecare ecran.
export const ProfileContext = createContext(null);

export function useProfile() {
  return useContext(ProfileContext);
}
