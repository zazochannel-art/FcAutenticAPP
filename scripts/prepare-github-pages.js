const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const distDir = path.join(root, "dist");

function resolveBasePath(value) {
  return (value || "/FcAutenticAPP").replace(/\/$/, "");
}

function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(dir, entry.name);
    return entry.isDirectory() ? walk(fullPath) : [fullPath];
  });
}

// GitHub Pages servește aplicația dintr-un sub-path (/FcAutenticAPP/), nu din
// rădăcina domeniului. Orice cale absolută din build trebuie prefixată, altfel
// ajunge la rădăcina lui github.io și dă 404 — inclusiv iconițele de instalare
// pe ecranul principal, caz în care telefonul pune o iconiță generică în loc
// de logo. `manifest.json` nu apare aici: căile din el sunt relative, deci se
// rezolvă corect față de propriul URL, la orice bază.
const ABSOLUTE_ASSET_PATHS = ["_expo", "assets", "icons", "favicon\\.ico", "manifest\\.json", "metadata\\.json"];

function prefixAbsoluteAssets(content, basePath) {
  const targets = new RegExp(`(["'=(:])\\/(${ABSOLUTE_ASSET_PATHS.join("|")})`, "g");
  return content
    .replace(targets, `$1${basePath}/$2`)
    .replace(/httpServerLocation:"\/assets/g, `httpServerLocation:"${basePath}/assets`);
}

function main() {
  const basePath = resolveBasePath(process.env.GITHUB_PAGES_BASE_PATH);

  if (!fs.existsSync(distDir)) {
    throw new Error("Folderul dist nu exista. Ruleaza mai intai npm run build:web.");
  }

  for (const file of walk(distDir)) {
    if (!/\.(html|js|css)$/.test(file)) continue;
    const current = fs.readFileSync(file, "utf8");
    const next = prefixAbsoluteAssets(current, basePath);
    if (next !== current) fs.writeFileSync(file, next);
  }

  const indexPath = path.join(distDir, "index.html");
  const notFoundPath = path.join(distDir, "404.html");
  if (fs.existsSync(indexPath)) {
    fs.copyFileSync(indexPath, notFoundPath);
  }

  console.log(`GitHub Pages base path applied: ${basePath}`);
}

if (require.main === module) main();

module.exports = { prefixAbsoluteAssets, resolveBasePath };
