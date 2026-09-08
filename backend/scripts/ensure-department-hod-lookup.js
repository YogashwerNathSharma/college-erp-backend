const fs = require("fs");
const path = require("path");

const configPath = path.resolve(__dirname, "../src/modules/masters/master.config.ts");
let config = fs.readFileSync(configPath, "utf8");

const from = "{ name: 'hodId', label: 'HOD (User ID)', type: 'text' },";
const to = "{ name: 'hodId', label: 'HOD / Teacher', type: 'lookup', lookupUrl: '/api/teacher', lookupLabelField: 'name', lookupValueField: 'id' },";

if (config.includes(from)) {
  config = config.replace(from, to);
  fs.writeFileSync(configPath, config, "utf8");
}

const finalConfig = fs.readFileSync(configPath, "utf8");
const requiredMarker = "{ name: 'hodId', label: 'HOD / Teacher', type: 'lookup', lookupUrl: '/api/teacher', lookupLabelField: 'name', lookupValueField: 'id' },";
if (!finalConfig.includes(requiredMarker)) {
  throw new Error("Department Master HOD lookup verification failed");
}

process.stdout.write("Department Master verified: HOD field uses the tenant-scoped Teacher name dropdown.\n");
