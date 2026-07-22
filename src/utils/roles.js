// Rezolvarea rolului efectiv al unui utilizator, pe baza profilului și a
// membership-ului de club. Funcții pure, testabile independent de UI.

export function normalizeMembershipRole(role) {
  if (role === "owner") return "club_owner";
  return role;
}

export function resolveEffectiveRole(profile, membership) {
  if (profile?.platform_role === "super_admin") return "super_admin";
  if (profile?.role === "super_admin") return "super_admin";
  if (membership?.role) return normalizeMembershipRole(membership.role);
  if (profile?.role === "admin") return "admin";
  if (profile?.platform_role) return profile.platform_role;
  return "viewer";
}
