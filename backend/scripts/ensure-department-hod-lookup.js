const fs = require("fs");
const path = require("path");

const sourceConfigPath = path.resolve(__dirname, "../src/modules/masters/master.config.ts");
const distConfigPath = path.resolve(__dirname, "../dist/modules/masters/master.config.js");

const sourceFrom = "{ name: 'hodId', label: 'HOD (User ID)', type: 'text' },";
const sourceTo = "{ name: 'hodId', label: 'HOD / Teacher', type: 'lookup', lookupUrl: '/api/teacher', lookupLabelField: 'name', lookupValueField: 'id' },";

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

patchFile(sourceConfigPath, sourceFrom, sourceTo);

// Also patch an already-built backend so deployments that reuse dist cannot
// serve the old text-field configuration.
if (fs.existsSync(distConfigPath)) {
  patchFile(
    distConfigPath,
    "{ name: 'hodId', label: 'HOD (User ID)', type: 'text' },",
    "{ name: 'hodId', label: 'HOD / Teacher', type: 'lookup', lookupUrl: '/api/teacher', lookupLabelField: 'name', lookupValueField: 'id' },"
  );
}

const sourceConfig = fs.readFileSync(sourceConfigPath, "utf8");
if (!sourceConfig.includes(sourceTo)) {
  throw new Error("Department Master HOD lookup verification failed in source config");
}

process.stdout.write("Department Master verified: HOD field uses the tenant-scoped Teacher name dropdown.\n");
