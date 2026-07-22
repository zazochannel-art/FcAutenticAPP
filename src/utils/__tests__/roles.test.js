import { normalizeMembershipRole, resolveEffectiveRole } from "../roles";

describe("normalizeMembershipRole", () => {
  test("mapează 'owner' la 'club_owner'", () => {
    expect(normalizeMembershipRole("owner")).toBe("club_owner");
  });
  test("lasă neschimbate celelalte roluri", () => {
    expect(normalizeMembershipRole("coach")).toBe("coach");
    expect(normalizeMembershipRole("player")).toBe("player");
  });
});

describe("resolveEffectiveRole", () => {
  test("platform_role super_admin are prioritate", () => {
    expect(resolveEffectiveRole({ platform_role: "super_admin", role: "player" }, { role: "coach" })).toBe("super_admin");
  });
  test("role super_admin pe profil întoarce super_admin", () => {
    expect(resolveEffectiveRole({ role: "super_admin" }, null)).toBe("super_admin");
  });
  test("rolul din membership are prioritate față de profil (și e normalizat)", () => {
    expect(resolveEffectiveRole({ role: "player" }, { role: "owner" })).toBe("club_owner");
    expect(resolveEffectiveRole({ role: "player" }, { role: "coach" })).toBe("coach");
  });
  test("fără membership, cade pe rolul de admin al profilului", () => {
    expect(resolveEffectiveRole({ role: "admin" }, null)).toBe("admin");
  });
  test("fără nimic relevant, întoarce viewer", () => {
    expect(resolveEffectiveRole({}, null)).toBe("viewer");
    expect(resolveEffectiveRole(null, null)).toBe("viewer");
  });
  test("platform_role generic e folosit ca ultim fallback", () => {
    expect(resolveEffectiveRole({ platform_role: "support" }, null)).toBe("support");
  });
});
