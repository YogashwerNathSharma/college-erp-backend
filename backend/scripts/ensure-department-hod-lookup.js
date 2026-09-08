const fs = require("fs");
const path = require("path");

const sourceConfigPath = path.resolve(__dirname, "../src/modules/masters/master.config.ts");
const distConfigPath = path.resolve(__dirname, "../dist/modules/masters/master.config.js");

function patchFile(filePath, from, to) {
  if (!fs.existsSync(filePath)) return false;
  let content = fs.readFileSync(filePath, "utf8");
  if (content.includes(from)) {
    content = content.replace(from, to);
    fs.writeFileSync(filePath, content, "utf8");
    return true;
  }
  return content.includes(to);
}

const hodFrom = "{ name: 'hodId', label: 'HOD (User ID)', type: 'text' },";
const hodTo = "{ name: 'hodId', label: 'HOD / Teacher', type: 'lookup', lookupUrl: '/api/teacher', lookupLabelField: 'name', lookupValueField: 'id' },";

const feeClassesFrom = "{ name: 'classes', label: 'Applicable Classes (comma-separated IDs)', type: 'text' },";
const feeClassesTo = "{ name: 'classes', label: 'Applicable Classes', type: 'lookup', lookupUrl: '/api/class', lookupLabelField: 'name', lookupValueField: 'id', multiple: true },";

patchFile(sourceConfigPath, hodFrom, hodTo);
patchFile(sourceConfigPath, feeClassesFrom, feeClassesTo);

if (fs.existsSync(distConfigPath)) {
  patchFile(distConfigPath, hodFrom, hodTo);
  patchFile(distConfigPath, feeClassesFrom, feeClassesTo);
}

const sourceConfig = fs.readFileSync(sourceConfigPath, "utf8");
if (!sourceConfig.includes(hodTo)) {
  throw new Error("Department Master HOD lookup verification failed in source config");
}
if (!sourceConfig.includes(feeClassesTo)) {
  throw new Error("Fee Group Master class lookup verification failed in source config");
}

process.stdout.write("Master lookup verification passed: HOD uses Teacher lookup and Fee Group uses multi-select Class lookup.\n");
