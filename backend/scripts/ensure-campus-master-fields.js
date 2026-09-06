const fs = require("fs");
const path = require("path");

const schemaPath = path.resolve(__dirname, "../prisma/schema.prisma");
let schema = fs.readFileSync(schemaPath, "utf8");

const modelStart = schema.indexOf("model Campus {");
if (modelStart === -1) throw new Error("Campus model not found in prisma/schema.prisma");
const modelEnd = schema.indexOf("\n}", modelStart);
if (modelEnd === -1) throw new Error("Campus model closing brace not found");

let modelBlock = schema.slice(modelStart, modelEnd);
const fieldDefinitions = {
  branchId: "  branchId   String?",
  address: "  address    String?",
};

const hasField = (name) => modelBlock.split("\n").some((line) => line.trimStart().startsWith(`${name} `));
const missing = Object.keys(fieldDefinitions).filter((field) => !hasField(field));
if (missing.length) modelBlock += `\n${missing.map((field) => fieldDefinitions[field]).join("\n")}`;

// Campus Master requires only name, so legacy required fields must remain optional.
const lines = modelBlock.split("\n").map((line) => {
  const trimmed = line.trim();
  if (trimmed.startsWith("capacity ") && trimmed === "capacity  Int") return line.replace(/Int$/, "Int?");
  if (trimmed.startsWith("location ") && trimmed === "location  String") return line.replace(/String$/, "String?");
  if (trimmed.startsWith("facilities ") && trimmed === "facilities String[]") return `${line} @default([])`;
  return line;
});
modelBlock = lines.join("\n");

const updatedSchema = `${schema.slice(0, modelStart)}${modelBlock}${schema.slice(modelEnd)}`;
if (updatedSchema !== schema) fs.writeFileSync(schemaPath, updatedSchema, "utf8");

// Keep the backend config aligned with the String[] Prisma representation.
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
const campusFinalStart = finalSchema.indexOf("model Campus {");
const campusFinalEnd = finalSchema.indexOf("\n}", campusFinalStart);
const finalBlock = finalSchema.slice(campusFinalStart, campusFinalEnd);
for (const marker of ["branchId   String?", "address    String?", "capacity  Int?", "location  String?", "facilities String[] @default([])"]) {
  if (!finalBlock.includes(marker)) throw new Error(`Campus Master schema verification failed: ${marker}`);
}

process.stdout.write(`Campus Master schema verified: ${missing.length ? `added ${missing.join(", ")}` : "fields already present"}.\n`);
