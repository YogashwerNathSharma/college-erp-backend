const fs = require("fs");
const path = require("path");

const schemaPath = path.resolve(__dirname, "../prisma/schema.prisma");
const schema = fs.readFileSync(schemaPath, "utf8");

const modelStart = schema.indexOf("model Campus {");
if (modelStart === -1) {
  throw new Error("Campus model not found in prisma/schema.prisma");
}

const modelEnd = schema.indexOf("\n}", modelStart);
if (modelEnd === -1) {
  throw new Error("Campus model closing brace not found");
}

const modelBlock = schema.slice(modelStart, modelEnd);
const fieldDefinitions = {
  branchId: "  branchId   String?   @db.ObjectId",
  address: "  address    String?",
};

const missing = Object.keys(fieldDefinitions).filter(
  (field) => !new RegExp(`^\\s+${field}\\s+`, "m").test(modelBlock)
);

if (missing.length === 0) {
  process.stdout.write("Campus Master fields already present.\n");
  process.exit(0);
}

const additions = missing.map((field) => fieldDefinitions[field]).join("\n");
const updatedModel = `${modelBlock}\n${additions}`;
const updatedSchema = `${schema.slice(0, modelStart)}${updatedModel}${schema.slice(modelEnd)}`;
fs.writeFileSync(schemaPath, updatedSchema, "utf8");
process.stdout.write(`Added Campus Master fields: ${missing.join(", ")}\n`);
