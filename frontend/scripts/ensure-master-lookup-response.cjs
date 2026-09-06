const fs = require("fs");
const path = require("path");

const filePath = path.resolve(__dirname, "../src/pages/masters/MasterForm.tsx");
let source = fs.readFileSync(filePath, "utf8");

const oldLine = "        const data = res.data?.data || res.data || [];";
const newLine = "        const data = res.data?.data?.data || res.data?.data || res.data || [];";

if (source.includes(oldLine)) {
  source = source.replace(oldLine, newLine);
} else if (!source.includes(newLine)) {
  throw new Error("MasterForm lookup response anchor not found; refusing unrelated changes.");
}

if (!source.includes(newLine)) {
  throw new Error("MasterForm nested lookup normalization verification failed.");
}

fs.writeFileSync(filePath, source, "utf8");
process.stdout.write("Master form lookup responses normalized for nested API data.\n");
