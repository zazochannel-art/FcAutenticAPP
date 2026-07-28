const { prefixAbsoluteAssets, resolveBasePath } = require("../prepare-github-pages");

const BASE = "/FcAutenticAPP";

describe("prefixAbsoluteAssets", () => {
  // Regresie: iconițele de instalare pe ecranul principal erau absolute de la
  // rădăcină, dar GitHub Pages servește aplicația din /FcAutenticAPP/, deci
  // ajungeau în 404 și telefonul afișa o iconiță generică în locul logoului.
  it("prefixează linkurile de instalare pe ecranul principal", () => {
    const html = [
      '<link rel="manifest" href="/manifest.json" />',
      '<link rel="apple-touch-icon" sizes="180x180" href="/icons/apple-touch-icon.png" />',
      '<link rel="icon" type="image/png" sizes="192x192" href="/icons/icon-192.png" />',
      '<link rel="icon" href="/favicon.ico" sizes="any" />',
    ].join("\n");

    expect(prefixAbsoluteAssets(html, BASE)).toBe([
      '<link rel="manifest" href="/FcAutenticAPP/manifest.json" />',
      '<link rel="apple-touch-icon" sizes="180x180" href="/FcAutenticAPP/icons/apple-touch-icon.png" />',
      '<link rel="icon" type="image/png" sizes="192x192" href="/FcAutenticAPP/icons/icon-192.png" />',
      '<link rel="icon" href="/FcAutenticAPP/favicon.ico" sizes="any" />',
    ].join("\n"));
  });

  it("prefixează bundle-ul și fișierele statice", () => {
    const html = '<script src="/_expo/static/js/web/AppEntry-abc.js" defer></script>';
    expect(prefixAbsoluteAssets(html, BASE)).toContain('src="/FcAutenticAPP/_expo/static/js/web/AppEntry-abc.js"');

    const bundle = 'httpServerLocation:"/assets/assets"';
    expect(prefixAbsoluteAssets(bundle, BASE)).toBe('httpServerLocation:"/FcAutenticAPP/assets/assets"');
  });

  it("nu atinge URL-urile absolute externe", () => {
    const html = '<a href="https://example.com/assets/x.png">x</a>';
    expect(prefixAbsoluteAssets(html, BASE)).toBe(html);
  });

  it("nu prefixează de două ori la o a doua trecere", () => {
    const html = '<link rel="manifest" href="/manifest.json" />';
    const once = prefixAbsoluteAssets(html, BASE);
    expect(prefixAbsoluteAssets(once, BASE)).toBe(once);
  });
});

describe("resolveBasePath", () => {
  it("folosește /FcAutenticAPP când variabila lipsește", () => {
    expect(resolveBasePath(undefined)).toBe("/FcAutenticAPP");
    expect(resolveBasePath("")).toBe("/FcAutenticAPP");
  });

  it("taie slash-ul final", () => {
    expect(resolveBasePath("/altceva/")).toBe("/altceva");
  });
});
