import { colors, palettes, themedStyles, applyTheme } from "../theme";

describe("sistemul de teme", () => {
  afterEach(() => applyTheme("dark"));

  it("pornește pe tema închisă", () => {
    expect(colors.bg).toBe(palettes.dark.bg);
    expect(colors.isDark).toBe(true);
  });

  it("applyTheme mută valorile în același obiect `colors`", () => {
    const ref = colors; // referința pe care o au toate modulele importatoare
    applyTheme("light");
    expect(ref).toBe(colors); // aceeași referință
    expect(ref.bg).toBe(palettes.light.bg);
    expect(ref.text).toBe(palettes.light.text);
    expect(ref.isDark).toBe(false);
  });

  it("regenerează stilurile înregistrate, păstrând referința", () => {
    const styles = themedStyles((C) => ({
      card: { backgroundColor: C.card, color: C.text },
    }));
    const ref = styles;
    expect(styles.card.backgroundColor).toBe(palettes.dark.card);

    applyTheme("light");
    expect(ref).toBe(styles); // referința nu se schimbă
    expect(styles.card.backgroundColor).toBe(palettes.light.card);
    expect(styles.card.color).toBe(palettes.light.text);
  });

  // Instalată pe ecranul principal, aplicația nu primește tot ecranul: iOS
  // vopsește singur marginea de sus și pe cea de jos, cu `theme-color`. Dacă
  // rămâne pe varianta întunecată din manifest, pe tema luminoasă ies două
  // benzi negre. Deci culoarea trebuie să urmeze fundalul temei curente.
  it("ține `theme-color` sincronizat cu fundalul temei", () => {
    const meta = { name: "theme-color", content: null };
    const realDocument = global.document;
    global.document = {
      querySelector: (sel) => (sel === 'meta[name="theme-color"]' ? meta : null),
      createElement: () => ({ setAttribute() {} }),
      head: { appendChild() {} },
    };
    meta.setAttribute = (k, v) => { meta[k] = v; };

    try {
      applyTheme("light");
      expect(meta.content).toBe(palettes.light.bg);

      applyTheme("dark");
      expect(meta.content).toBe(palettes.dark.bg);
    } finally {
      global.document = realDocument;
    }
  });

  it("nu cade când nu există `document` (nativ)", () => {
    expect(typeof global.document).toBe("undefined");
    expect(() => applyTheme("light")).not.toThrow();
  });

  it("revine corect la tema închisă", () => {
    applyTheme("light");
    applyTheme("dark");
    expect(colors.bg).toBe(palettes.dark.bg);
    expect(colors.isDark).toBe(true);
  });

  it("cade pe tema închisă pentru un nume necunoscut", () => {
    applyTheme("inexistenta");
    expect(colors.bg).toBe(palettes.dark.bg);
  });

  it("ambele palete au exact aceleași chei", () => {
    expect(Object.keys(palettes.light).sort()).toEqual(Object.keys(palettes.dark).sort());
  });
});
