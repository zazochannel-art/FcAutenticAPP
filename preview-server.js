const fs = require("fs");
const http = require("http");
const path = require("path");

const root = path.join(__dirname, "dist");
const host = process.env.HOST || "0.0.0.0";
const port = Number(process.env.PORT || 4173);
const types = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".ico": "image/x-icon",
  ".js": "text/javascript; charset=utf-8",
  ".png": "image/png",
  ".ttf": "font/ttf",
};

http
  .createServer((request, response) => {
    const pathname = decodeURIComponent(request.url.split("?")[0]);
    const relativePath = pathname === "/" ? "index.html" : pathname.slice(1);
    const filePath = path.join(root, relativePath);

    fs.readFile(filePath, (error, data) => {
      if (error) {
        response.writeHead(404);
        response.end("Not found");
        return;
      }

      response.writeHead(200, {
        "Content-Type": types[path.extname(filePath)] || "application/octet-stream",
        "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
        "Pragma": "no-cache",
        "Expires": "0",
      });
      response.end(data);
    });
  })
  .listen(port, host, () => {
    console.log(`FC Autentic preview: http://${host === "0.0.0.0" ? "localhost" : host}:${port}/`);
    console.log("Pentru telefon, folosește IP-ul calculatorului în aceeași rețea Wi‑Fi.");
  });
