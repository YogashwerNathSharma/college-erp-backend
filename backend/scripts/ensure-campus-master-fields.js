const fs = require("fs");
const path = require("path");

const schemaPath = path.resolve(__dirname, "../prisma/schema.prisma");
let schema = fs.readFileSync(schemaPath, "utf8");

const modelStart = schema.indexOf("model Campus {");
if (modelStart === -1) {
  throw new Error("Campus model not found in prisma/schema.prisma");
}

const modelEnd = schema.indexOf("\n}", modelStart);
if (modelEnd === -1) {
  throw new Error("Campus model closing brace not found");
}

let modelBlock = schema.slice(modelStart, modelEnd);
const fieldDefinitions = {
  branchId: "  branchId   String?",
  address: "  address    String?",
};

const missing = Object.keys(fieldDefinitions).filter(
  (field) => !new RegExp(`^\\s+${field}\\s+`, "m").test(modelBlock)
);

if (missing.length > 0) {
  const additions = missing.map((field) => fieldDefinitions[field]).join("\n");
  modelBlock = `${modelBlock}\n${additions}`;
}

// The Master form intentionally requires only Campus Name. Keep legacy
// location/capacity/facilities data compatible while allowing a clean create
// from the configured Campus Master fields.
modelBlock = modelBlock.replace(/^(\\s+capacity\\s+)Int(\\s*)$/m, "$1Int?$2");
modelBlock = modelBlock.replace(/^(\\s+location\\s+)String(\\s*)$/m, "$1String?$2");
modelBlock = modelBlock.replace(/^(\\s+facilities\\s+)String\\[\\](\\s*)$/m, "$1String[] @default([])$2");

const updatedSchema = `${schema.slice(0, modelStart)}${modelBlock}${schema.slice(modelEnd)}`;
if (updatedSchema !== schema) {
  fs.writeFileSync(schemaPath, updatedSchema, "utf8");
}

process.stdout.write(
  missing.length > 0
    ? `Added Campus Master fields: ${missing.join(", ")}\n`
    : "Campus Master fields already present.\n"
);
