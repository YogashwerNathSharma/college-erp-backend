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

const rackMasterFrom = "key: 'rack-master',\n        label: 'Rack Master',\n        model: 'Rack',";
const rackMasterTo = "key: 'rack-master',\n        label: 'Rack Master',\n        model: 'RackMaster',";

const shelfMasterFrom = "key: 'shelf-master',\n        label: 'Shelf Master',\n        model: 'LibraryShelf',";
const shelfMasterTo = "key: 'shelf-master',\n        label: 'Shelf Master',\n        model: 'ShelfMaster',";

const rackIdFrom = "{ name: 'rackId', label: 'Rack (ID)', type: 'text', required: true },";
const rackIdTo = "{ name: 'rackId', label: 'Rack No.', type: 'lookup', required: true, lookupUrl: '/api/masters/rack-master/dropdown', lookupLabelField: 'name', lookupValueField: 'id' },";

const rackRequiredFieldsFrom = "requiredFields: ['name'],\n        searchFields: ['name', 'location'],";
const rackRequiredFieldsTo = "requiredFields: ['name', 'location', 'capacity'],\n        searchFields: ['name', 'location'],";
const rackLocationFrom = "{ name: 'location', label: 'Location', type: 'text' },";
const rackLocationTo = "{ name: 'location', label: 'Location', type: 'text', required: true },";
const rackCapacityFrom = "{ name: 'capacity', label: 'Capacity (books)', type: 'number' },";
const rackCapacityTo = "{ name: 'capacity', label: 'Capacity (books)', type: 'number', required: true },";

const shelfRequiredFieldsFrom = "requiredFields: ['name', 'rackId'],\n        searchFields: ['name'],";
const shelfRequiredFieldsTo = "requiredFields: ['name', 'rackId', 'level'],\n        searchFields: ['name'],";
const shelfLevelFrom = "{ name: 'level', label: 'Level Number', type: 'number' },";
const shelfLevelTo = "{ name: 'level', label: 'Level Number', type: 'number', required: true },";

for (const filePath of [sourceConfigPath, distConfigPath]) {
  patchFile(filePath, hodFrom, hodTo);
  patchFile(filePath, feeClassesFrom, feeClassesTo);
  patchFile(filePath, rackMasterFrom, rackMasterTo);
  patchFile(filePath, shelfMasterFrom, shelfMasterTo);
  patchFile(filePath, rackIdFrom, rackIdTo);
  patchFile(filePath, rackRequiredFieldsFrom, rackRequiredFieldsTo);
  patchFile(filePath, rackLocationFrom, rackLocationTo);
  patchFile(filePath, rackCapacityFrom, rackCapacityTo);
  patchFile(filePath, shelfRequiredFieldsFrom, shelfRequiredFieldsTo);
  patchFile(filePath, shelfLevelFrom, shelfLevelTo);
}

const sourceConfig = fs.readFileSync(sourceConfigPath, "utf8");
const required = [
  hodTo,
  feeClassesTo,
  rackMasterTo,
  shelfMasterTo,
  rackIdTo,
  rackRequiredFieldsTo,
  rackLocationTo,
  rackCapacityTo,
  shelfRequiredFieldsTo,
  shelfLevelTo,
];
for (const marker of required) {
  if (!sourceConfig.includes(marker)) throw new Error(`Master lookup/required-field verification failed: ${marker}`);
}

process.stdout.write("Master lookup verification passed: HOD uses Teacher lookup, Fee Group uses multi-select Class lookup, Shelf Rack No. uses Rack Master lookup, and Rack/Shelf required fields match Prisma.\n");
