const fs = require("fs");
const path = require("path");

const schemaPath = path.resolve(__dirname, "../prisma/schema.prisma");
let schema = fs.readFileSync(schemaPath, "utf8");
const modelStart = schema.indexOf("model Campus {");
if (modelStart === -1) throw new Error("Campus model not found in prisma/schema.prisma");
const modelOpen = schema.indexOf("{", modelStart);
let depth = 0;
let modelEnd = -1;
for (let i = modelOpen; i < schema.length; i += 1) {
  if (schema[i] === "{") depth += 1;
  else if (schema[i] === "}") {
    depth -= 1;
    if (depth === 0) { modelEnd = i; break; }
  }
}
if (modelEnd === -1) throw new Error("Campus model closing brace not found");
let modelBlock = schema.slice(modelStart, modelEnd);

function ensureField(block, fieldName, type) {
  const re = new RegExp(`(^\\s*${fieldName}\\s+)([^\\s]+)`, "m");
  if (re.test(block)) return block.replace(re, (_m, prefix) => `${prefix}${type}`);
  return `${block}\n  ${fieldName} ${type}`;
}
modelBlock = ensureField(modelBlock, "branchId", "String?");
modelBlock = ensureField(modelBlock, "address", "String?");
modelBlock = ensureField(modelBlock, "capacity", "Int?");
modelBlock = ensureField(modelBlock, "location", "String?");
modelBlock = ensureField(modelBlock, "facilities", "String[]");

const facilitiesRe = /(^\\s*facilities\\s+String\\[\\])(?:\\s+@default\\(\\[\\]\\))?/m;
modelBlock = modelBlock.replace(facilitiesRe, "$1 @default([])");

const body = modelBlock.endsWith("\n") ? modelBlock : `${modelBlock}\n`;
const updatedSchema = `${schema.slice(0, modelStart)}${body}${schema.slice(modelEnd)}`;
if (updatedSchema !== schema) fs.writeFileSync(schemaPath, updatedSchema, "utf8");

const configPath = path.resolve(__dirname, "../src/modules/masters/master.config.ts");
let config = fs.readFileSync(configPath, "utf8");
const campusStart = config.indexOf("key: 'campus-master'");
const campusEnd = config.indexOf("key: 'shift-master'", campusStart);
if (campusStart === -1 || campusEnd === -1) throw new Error("Campus Master config block not found");
let campusBlock = config.slice(campusStart, campusEnd);
const facilitiesMarker = "{ name: 'facilities', label: 'Facilities (comma-separated)', type: 'text' }";
if (campusBlock.includes(facilitiesMarker)) {
  campusBlock = campusBlock.replace(facilitiesMarker, "{ name: 'facilities', label: 'Facilities (comma-separated)', type: 'array' }");
  config = `${config.slice(0, campusStart)}${campusBlock}${config.slice(campusEnd)}`;
  fs.writeFileSync(configPath, config, "utf8");
}

const finalSchema = fs.readFileSync(schemaPath, "utf8");
const finalStart = finalSchema.indexOf("model Campus {");
const finalOpen = finalSchema.indexOf("{", finalStart);
let finalEnd = -1;
depth = 0;
for (let i = finalOpen; i < finalSchema.length; i += 1) {
  if (finalSchema[i] === "{") depth += 1;
  else if (finalSchema[i] === "}") {
    depth -= 1;
    if (depth === 0) { finalEnd = i; break; }
  }
}
if (finalStart === -1 || finalEnd === -1) throw new Error("Campus Master schema verification block not found");
const finalBlock = finalSchema.slice(finalStart, finalEnd);
const requiredPatterns = [
  /(^|\n)\s*branchId\s+String\?/m,
  /(^|\n)\s*address\s+String\?/m,
  /(^|\n)\s*capacity\s+Int\?/m,
  /(^|\n)\s*location\s+String\?/m,
  /(^|\n)\s*facilities\s+String\[\]\s+@default\(\[\]\)/m,
];
for (const pattern of requiredPatterns) {
  if (!pattern.test(finalBlock)) throw new Error(`Campus Master schema verification failed: ${pattern}`);
}
process.stdout.write("Campus Master schema verified: branchId/address/capacity/location/facilities are present with the required optional types.\n");
