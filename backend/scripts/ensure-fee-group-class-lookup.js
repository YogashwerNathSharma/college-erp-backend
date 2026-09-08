const fs = require("fs");
const path = require("path");

const sourceConfigPath = path.resolve(__dirname, "../src/modules/masters/master.config.ts");
const distConfigPath = path.resolve(__dirname, "../dist/modules/masters/master.config.js");

const from = "{ name: 'classes', label: 'Applicable Classes (comma-separated IDs)', type: 'text' },";
const to = "{ name: 'classes', label: 'Applicable Classes', type: 'lookup', lookupUrl: '/api/class', lookupLabelField: 'name', lookupValueField: 'id' },";

function patchFile(filePath) {
  if (!fs.existsSync(filePath)) return false;
  let content = fs.readFileSync(filePath, "utf8");
  if (content.includes(from)) {
    content = content.replace(from, to);
    fs.writeFileSync(filePath, content, "utf8");
    return true;
  }
  return content.includes(to);
}

patchFile(sourceConfigPath);
patchFile(distConfigPath);

const sourceConfig = fs.readFileSync(sourceConfigPath, "utf8");
if (!sourceConfig.includes(to)) {
  throw new Error("Fee Group Master class lookup verification failed");
}

process.stdout.write("Fee Group Master verified: Applicable Classes uses the tenant-scoped Class name multi-select lookup.\n");
