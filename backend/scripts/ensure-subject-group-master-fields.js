const fs = require("fs");
const path = require("path");

const schemaPath = path.resolve(__dirname, "../prisma/schema.prisma");
let schema = fs.readFileSync(schemaPath, "utf8");

const modelStart = schema.indexOf("model SubjectGroup {");
if (modelStart === -1) throw new Error("SubjectGroup model not found in prisma/schema.prisma");

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
if (modelEnd === -1) throw new Error("SubjectGroup model closing brace not found");

let modelBlock = schema.slice(modelStart, modelEnd);
const subjectsRe = /(^\s*subjects\s+)String\[\](?:\s+@default\(\[\]\))?/m;
if (subjectsRe.test(modelBlock)) {
  modelBlock = modelBlock.replace(subjectsRe, "$1String[] @default([])");
} else {
  modelBlock = `${modelBlock}\n  subjects String[] @default([])`;
}

const body = modelBlock.endsWith("\n") ? modelBlock : `${modelBlock}\n`;
const updatedSchema = `${schema.slice(0, modelStart)}${body}${schema.slice(modelEnd)}`;
if (updatedSchema !== schema) fs.writeFileSync(schemaPath, updatedSchema, "utf8");

// Subject Group relations must use the existing lightweight master dropdowns.
// This prevents users from typing display numbers/labels instead of real ObjectIds.
const configPath = path.resolve(__dirname, "../src/modules/masters/master.config.ts");
let config = fs.readFileSync(configPath, "utf8");
const replacements = [
  [
    "{ name: 'classId', label: 'Class (ID)', type: 'text' },",
    "{ name: 'classId', label: 'Class', type: 'lookup', lookupUrl: '/api/masters/Class/dropdown', lookupLabelField: 'name', lookupValueField: 'id' },",
  ],
  [
    "{ name: 'streamId', label: 'Stream (ID)', type: 'text' },",
    "{ name: 'streamId', label: 'Stream', type: 'lookup', lookupUrl: '/api/masters/Stream/dropdown', lookupLabelField: 'name', lookupValueField: 'id' },",
  ],
  [
    "{ name: 'subjects', label: 'Subject IDs (comma-separated)', type: 'text' },",
    "{ name: 'subjects', label: 'Subjects', type: 'array', lookupUrl: '/api/masters/Subject/dropdown', lookupLabelField: 'name', lookupValueField: 'id' },",
  ],
  [
    "{ name: 'subjects', label: 'Subject IDs (comma-separated)', type: 'array' },",
    "{ name: 'subjects', label: 'Subjects', type: 'array', lookupUrl: '/api/masters/Subject/dropdown', lookupLabelField: 'name', lookupValueField: 'id' },",
  ],
];
for (const [from, to] of replacements) {
  if (config.includes(from)) config = config.replace(from, to);
}
fs.writeFileSync(configPath, config, "utf8");

const finalSchema = fs.readFileSync(schemaPath, "utf8");
const finalStart = finalSchema.indexOf("model SubjectGroup {");
const finalOpen = finalSchema.indexOf("{", finalStart);
depth = 0;
let finalEnd = -1;
for (let i = finalOpen; i < finalSchema.length; i += 1) {
  if (finalSchema[i] === "{") depth += 1;
  else if (finalSchema[i] === "}") {
    depth -= 1;
    if (depth === 0) { finalEnd = i; break; }
  }
}
if (finalStart === -1 || finalEnd === -1) throw new Error("SubjectGroup schema verification block not found");
const finalBlock = finalSchema.slice(finalStart, finalEnd);
if (!/(^|\n)\s*subjects\s+String\[\]\s+@default\(\[\]\)/m.test(finalBlock)) {
  throw new Error("Subject Group Master schema verification failed: subjects String[] @default([])");
}

const finalConfig = fs.readFileSync(configPath, "utf8");
const requiredConfigMarkers = [
  "{ name: 'classId', label: 'Class', type: 'lookup', lookupUrl: '/api/masters/Class/dropdown'",
  "{ name: 'streamId', label: 'Stream', type: 'lookup', lookupUrl: '/api/masters/Stream/dropdown'",
  "{ name: 'subjects', label: 'Subjects', type: 'array', lookupUrl: '/api/masters/Subject/dropdown'",
];
for (const marker of requiredConfigMarkers) {
  if (!finalConfig.includes(marker)) {
    throw new Error(`Subject Group Master config verification failed: ${marker}`);
  }
}

process.stdout.write("Subject Group Master verified: Class/Stream use relational dropdowns and Subjects use a subject lookup list.\n");
