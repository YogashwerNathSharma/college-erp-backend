const fs = require("fs");
const path = require("path");

const schemaPath = path.resolve(__dirname, "../prisma/schema.prisma");
let schema = fs.readFileSync(schemaPath, "utf8");

const modelStart = schema.indexOf("model Campus {");
if (modelStart === -1) throw new Error("Campus model not found in prisma/schema.prisma");

// Find the actual end of the model instead of relying on a specific closing-brace layout.
const modelOpen = schema.indexOf("{", modelStart);
let depth = 0;
let modelEnd = -1;
for (let i = modelOpen; i < schema.length; i += 1) {
  if (schema[i] === "{") depth += 1;
  else if (schema[i] === "}") {
    depth -= 1;
    if (depth === 0) {
      modelEnd = i;
      break;
    }
  }
}
if (modelEnd === -1) throw new Error("Campus model closing brace not found");

let modelBlock = schema.slice(modelStart, modelEnd);

function ensureField(block, fieldName, type) {
  const fieldRegex = new RegExp(`(^\\s*${fieldName}\\s+)([^\\s]+)`, "m");
  if (fieldRegex.test(block)) {
    return block.replace(fieldRegex, (_match, prefix, currentType) => {
      if (currentType === type) return `${prefix}${currentType}`;
      if (fieldName === "facilities" && currentType === "String[]") return `${prefix}${currentType}`;
      return `${prefix}${type}`;
    });
  }
  return `${block}\n  ${fieldName} ${type}`;
}

// Campus Master requires only name. Keep legacy Campus fields optional.
modelBlock = ensureField(modelBlock, "branchId", "String?");
modelBlock = ensureField(modelBlock, "address", "String?");
modelBlock = ensureField(modelBlock, "capacity", "Int?");
modelBlock = ensureField(modelBlock, "location", "String?");
modelBlock = ensureField(modelBlock, "facilities", "String[]");

// Ensure facilities has a safe empty-array default without duplicating the attribute.
const facilitiesLine = /^\s*facilities\s+String\[\](.*)$/m;
if (facilitiesLine.test(modelBlock)) {
  modelBlock = modelBlock.replace(facilitiesLine, (_match, suffix) => {
    if (suffix.includes("@default([])")) return _match;
    return `${_match} @default([])`;
  });
}

const updatedSchema = `${schema.slice(0, modelStart)}${modelBlock}${schema.slice(modelEnd)}`;
if (updatedSchema !== schema) fs.writeFileSync(schemaPath, updatedSchema, "utf8");

// Keep the backend config aligned with Prisma's String[] representation.
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

// Verify field names and Prisma types, independent of indentation/comments/attributes.
const finalSchema = fs.readFileSync(schemaPath, "utf8");
const finalStart = finalSchema.indexOf("model Campus {");
const finalOpen = finalSchema.indexOf("{", finalStart);
let finalEnd = -1;
depth = 0;
for (let i = finalOpen; i < finalSchema.length; i += 1) {
  if (finalSchema[i] === "{") depth += 1;
  else if (finalSchema[i] === "}") {
    depth -= 1;
    if (depth === 0) {
      finalEnd = i;
      break;
    }
  }
}
if (finalStart === -1 || finalEnd === -1) throw new Error("Campus Master schema verification block not found");
const finalBlock = finalSchema.slice(finalStart, finalEnd);
const requiredPatterns = [
  /(^|\n)\s*branchId\s+String\?/m,
  /(^|\n)\s*address\s+String\?/m,
  /(^|\n)\s*capacity\s+Int\?/m,
  /(^|\n)\s*location\s+String\?/m,
  /(^|\n)\s*facilities\s+String\[\]\s+.*@default\(\[\]\)/m,
];
for (const pattern of requiredPatterns) {
  if (!pattern.test(finalBlock)) throw new Error(`Campus Master schema verification failed: ${pattern}`);
}

process.stdout.write("Campus Master schema verified: branchId/address/capacity/location/facilities are present with the required optional types.\n");
