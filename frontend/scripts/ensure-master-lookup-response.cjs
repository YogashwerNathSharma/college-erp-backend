const fs = require("fs");
const path = require("path");

const filePath = path.resolve(__dirname, "../src/pages/masters/MasterForm.tsx");
const source = fs.readFileSync(filePath, "utf8");

// Verification-only guard. Lookup response normalization is implemented in
// MasterForm itself; this script must never rewrite the form during builds.
const required = [
  "const raw = res.data?.data?.data ?? res.data?.data ?? res.data ?? [];",
  "const data = Array.isArray(raw) ? raw : [];",
  "function LookupField",
];

for (const marker of required) {
  if (!source.includes(marker)) {
    throw new Error(`MasterForm lookup response verification failed: ${marker}`);
  }
}

process.stdout.write("Master form lookup responses verified.\n");
