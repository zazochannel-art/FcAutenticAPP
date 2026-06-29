const romanianMap = {
  ă: "a", â: "a", î: "i", ș: "s", ş: "s", ț: "t", ţ: "t",
  Ă: "A", Â: "A", Î: "I", Ș: "S", Ş: "S", Ț: "T", Ţ: "T",
  "–": "-", "—": "-", "„": "\"", "”": "\"", "“": "\"", "’": "'",
};

export function normalizePdfText(text) {
  return String(text || "").replace(/[ăâîșşțţĂÂÎȘŞȚŢ–—„”“’]/g, (char) => romanianMap[char] || char);
}

export function escapePdfText(text) {
  return normalizePdfText(text).replace(/[\\()]/g, "\\$&").replace(/[^\x20-\x7E]/g, "");
}

export function safeReportFileName(title) {
  return normalizePdfText(title).toLowerCase().replace(/[^a-z0-9]+/gi, "-").replace(/^-+|-+$/g, "") || "raport";
}

export function buildSimplePdf(title, body) {
  const lines = [`FC Autentic - ${normalizePdfText(title)}`, "", ...normalizePdfText(body).split("\n")].slice(0, 54);
  const content = [
    "BT",
    "/F1 16 Tf",
    "50 790 Td",
    ...lines.map((line, index) => `${index ? "0 -16 Td " : ""}(${escapePdfText(line).slice(0, 92)}) Tj`),
    "ET",
  ].join("\n");
  const objects = [
    "1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj",
    "2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj",
    "3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >> endobj",
    "4 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj",
    `5 0 obj << /Length ${content.length} >> stream\n${content}\nendstream endobj`,
  ];
  let pdf = "%PDF-1.4\n";
  const offsets = [0];
  objects.forEach((object) => {
    offsets.push(pdf.length);
    pdf += `${object}\n`;
  });
  const xref = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  offsets.slice(1).forEach((offset) => {
    pdf += `${String(offset).padStart(10, "0")} 00000 n \n`;
  });
  pdf += `trailer << /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
  return pdf;
}
