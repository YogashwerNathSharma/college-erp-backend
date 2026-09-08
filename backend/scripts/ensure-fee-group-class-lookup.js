const fs = require("fs");
const path = require("path");

const sourceConfigPath = path.resolve(__dirname, "../src/modules/masters/master.config.ts");
const distConfigPath = path.resolve(__dirname, "../dist/modules/masters/master.config.js");

const fieldFrom = "{ name: 'classes', label: 'Applicable Classes (comma-separated IDs)', type: 'text' },";
const fieldTo = "{ name: 'classes', label: 'Applicable Classes', type: 'lookup', lookupUrl: '/api/class', lookupLabelField: 'name', lookupValueField: 'id', multiple: true },";
const interfaceFrom = "  lookupValueField?: string; // Field to use as value (default: 'id')\n";
const interfaceTo = "  lookupValueField?: string; // Field to use as value (default: 'id')\n  multiple?: boolean;\n";

function patchFile(filePath) {
  if (!fs.existsSync(filePath)) return false;
  let content = fs.readFileSync(filePath, "utf8");
  let changed = false;
  if (content.includes(interfaceFrom) && !content.includes("  multiple?: boolean;")) {
    content = content.replace(interfaceFrom, interfaceTo);
    changed = true;
  }
  if (content.includes(fieldFrom)) {
    content = content.replace(fieldFrom, fieldTo);
    changed = true;
  }
  if (changed) fs.writeFileSync(filePath, content, "utf8");
  return content.includes(fieldTo) && content.includes("  multiple?: boolean;");
}

patchFile(sourceConfigPath);
patchFile(distConfigPath);

const sourceConfig = fs.readFileSync(sourceConfigPath, "utf8");
if (!sourceConfig.includes(fieldTo) || !sourceConfig.includes("  multiple?: boolean;")) {
  throw new Error("Fee Group Master class lookup verification failed");
}

process.stdout.write("Fee Group Master verified: Applicable Classes uses the Class name multi-select lookup.\n");
