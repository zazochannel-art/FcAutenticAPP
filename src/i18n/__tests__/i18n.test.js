import { dictionaries, ro, ru, en } from "../translations";
import { translate, isSupported, LANGUAGES, DEFAULT_LANGUAGE } from "../index";

describe("dicționare", () => {
  it("acoperă aceleași chei în toate limbile", () => {
    const roKeys = Object.keys(ro).sort();
    expect(Object.keys(ru).sort()).toEqual(roKeys);
    expect(Object.keys(en).sort()).toEqual(roKeys);
  });

  it("nu lasă nicio traducere goală", () => {
    const empty = Object.entries(dictionaries).flatMap(([lang, dict]) =>
      Object.entries(dict)
        .filter(([, value]) => typeof value !== "string" || value.trim().length === 0)
        .map(([key]) => `${lang}.${key}`),
    );
    expect(empty).toEqual([]);
  });

  it("traduce efectiv — valorile diferă de română", () => {
    // Câteva chei sunt identice pe bună dreptate („ADMIN"); verificăm că
    // majoritatea covârșitoare chiar s-a schimbat, ca să prindem un dicționar
    // copiat din greșeală.
    const keys = Object.keys(ro);
    const differing = keys.filter((k) => ru[k] !== ro[k]).length;
    expect(differing).toBeGreaterThan(keys.length * 0.9);
  });

  it("expune exact limbile din selector", () => {
    expect(LANGUAGES.map((l) => l.key)).toEqual(Object.keys(dictionaries));
    expect(LANGUAGES.map((l) => l.label)).toEqual(["Ro", "RU", "En"]);
  });
});

describe("translate", () => {
  it("întoarce textul din limba cerută", () => {
    expect(translate("login.titleLogin", "ro")).toBe("Bine ai revenit");
    expect(translate("login.titleLogin", "ru")).toBe("С возвращением");
    expect(translate("login.titleLogin", "en")).toBe("Welcome back");
  });

  it("cade înapoi pe română pentru o limbă necunoscută", () => {
    expect(translate("login.titleLogin", "de")).toBe(ro["login.titleLogin"]);
  });

  it("întoarce cheia dacă nu există traducere", () => {
    expect(translate("cheie.inexistenta", "ro")).toBe("cheie.inexistenta");
  });

  it("folosește româna ca limbă implicită", () => {
    expect(DEFAULT_LANGUAGE).toBe("ro");
    expect(translate("login.titleLogin")).toBe(ro["login.titleLogin"]);
  });
});

describe("isSupported", () => {
  it("acceptă doar limbile definite", () => {
    expect(isSupported("ro")).toBe(true);
    expect(isSupported("ru")).toBe(true);
    expect(isSupported("en")).toBe(true);
    expect(isSupported("de")).toBe(false);
    expect(isSupported(null)).toBe(false);
    expect(isSupported(undefined)).toBe(false);
  });
});
