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
process.stdout.write("Subject Group Master schema verified: subjects defaults to an empty array.\n");
