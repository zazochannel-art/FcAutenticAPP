#!/usr/bin/env node
/* eslint-env node */
/**
 * Verifică pe un ecran de telefon că nimic nu iese lateral din pagină.
 *
 * Problema pe care o păzește: în React Native `flexShrink` e implicit 0, spre
 * deosebire de web. O coloană cu `flexBasis: 420` rămâne lată de 420 și pe un
 * ecran unde sunt 358 disponibili, iar tot ce e în ea se taie la margine. Bug-ul
 * a stat ascuns pe patru ecrane până a fost văzut într-o captură de pe telefon.
 *
 * Se rulează peste un build de web deja servit:
 *   npm run build:web && npx serve -s dist -l 4173 &
 *   node scripts/check-mobile-layout.js
 *
 * Iese cu cod diferit de zero dacă găsește ceva, ca să poată pica în CI.
 */

const { chromium } = require("playwright");

const URL = process.env.CHECK_URL || "http://localhost:4173/";
const WIDTH = 390;
const HEIGHT = 844;

// Câțiva pixeli toleranță: umbrele și marginile rotunjite pot depăși cu puțin
// fără ca nimic să se taie vizual.
const TOLERANCE = 2;

async function overflowingElements(page) {
  return page.evaluate((limit) => {
    const bad = [];
    document.querySelectorAll("div, span").forEach((el) => {
      const r = el.getBoundingClientRect();
      if (r.width <= 0 || r.height <= 0) return;
      if (r.right <= limit && r.left >= -0.5) return;
      // Derularea pe orizontală e intenționată în unele locuri (filtrele de
      // grupă, de exemplu): dacă un părinte derulează, copilul are voie să iasă.
      let node = el;
      while (node && node !== document.body) {
        const cs = getComputedStyle(node);
        if (cs.overflowX === "auto" || cs.overflowX === "scroll") return;
        node = node.parentElement;
      }
      bad.push({
        right: Math.round(r.right),
        width: Math.round(r.width),
        text: (el.innerText || "").split("\n")[0].slice(0, 40),
      });
    });
    return bad;
  }, WIDTH + TOLERANCE);
}

(async () => {
  const browser = await chromium.launch({
    executablePath: process.env.CHROMIUM_PATH || undefined,
    args: ["--no-sandbox"],
  });
  const page = await browser.newPage({ viewport: { width: WIDTH, height: HEIGHT } });

  const jsErrors = [];
  page.on("pageerror", (e) => jsErrors.push(String(e)));

  await page.goto(URL, { waitUntil: "networkidle" });
  await page.waitForTimeout(3500);

  const problems = [];

  const check = async (label) => {
    const bad = await overflowingElements(page);
    if (bad.length) {
      problems.push(`${label}: ${bad.length} element(e) ies din ecran — ` +
        bad.slice(0, 3).map((b) => `„${b.text}” (până la ${b.right}px)`).join(", "));
    }
  };

  await check("pagina de pornire");

  // Parcurg fiecare tab din bara de jos, plus foaia „toate paginile”.
  const tabs = page.locator('[role="tab"]');
  const count = await tabs.count();
  for (let i = 0; i < count; i += 1) {
    await tabs.nth(i).click().catch(() => {});
    await page.waitForTimeout(1100);
    await check(`tabul ${i + 1}`);
  }

  await browser.close();

  if (jsErrors.length) problems.push(`excepții JS: ${jsErrors.join(" | ")}`);

  if (problems.length) {
    console.error("Verificarea aspectului pe telefon a găsit probleme:\n");
    problems.forEach((p) => console.error("  • " + p));
    process.exit(1);
  }

  console.log(`Aspect verificat la ${WIDTH}x${HEIGHT}: nimic nu iese din ecran.`);
})();
