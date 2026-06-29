const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const distDir = path.join(root, "dist");
const basePath = (process.env.GITHUB_PAGES_BASE_PATH || "/FcAutenticAPP").replace(/\/$/, "");

function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(dir, entry.name);
    return entry.isDirectory() ? walk(fullPath) : [fullPath];
  });
}

function prefixAbsoluteAssets(content) {
  return content
    .replace(/(["'=(:])\/(_expo|assets|favicon\.ico|metadata\.json)/g, `$1${basePath}/$2`)
    .replace(/httpServerLocation:"\/assets/g, `httpServerLocation:"${basePath}/assets`);
}

if (!fs.existsSync(distDir)) {
  throw new Error("Folderul dist nu exista. Ruleaza mai intai npm run build:web.");
}

for (const file of walk(distDir)) {
  if (!/\.(html|js|css)$/.test(file)) continue;
  const current = fs.readFileSync(file, "utf8");
  const next = prefixAbsoluteAssets(current);
  if (next !== current) fs.writeFileSync(file, next);
}

const indexPath = path.join(distDir, "index.html");
const notFoundPath = path.join(distDir, "404.html");
if (fs.existsSync(indexPath)) {
  fs.copyFileSync(indexPath, notFoundPath);
}

console.log(`GitHub Pages base path applied: ${basePath}`);
