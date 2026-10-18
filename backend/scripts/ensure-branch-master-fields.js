const fs = require("fs");
const path = require("path");

const schemaPath = path.resolve(__dirname, "../prisma/schema.prisma");
const schema = fs.readFileSync(schemaPath, "utf8");

const modelStart = schema.indexOf("model Branch {");
if (modelStart === -1) {
  throw new Error("Branch model not found in prisma/schema.prisma");
}

const modelEnd = schema.indexOf("\n}", modelStart);
if (modelEnd === -1) {
  throw new Error("Branch model closing brace not found");
}

const modelBlock = schema.slice(modelStart, modelEnd);
const fieldDefinitions = {
  address: "  address   String?",
  city: "  city      String?",
  state: "  state     String?",
  pincode: "  pincode   String?",
  phone: "  phone     String?",
  email: "  email     String?",
  isMain: "  isMain    Boolean  @default(false)",
};

const missing = Object.keys(fieldDefinitions).filter(
  (field) => !new RegExp(`^\\s+${field}\\s+`, "m").test(modelBlock)
);

if (missing.length === 0) {
  process.stdout.write("Branch Master fields already present.\n");
  process.exit(0);
}

const additions = missing.map((field) => fieldDefinitions[field]).join("\n");
const updatedModel = `${modelBlock}\n${additions}`;
const updatedSchema = `${schema.slice(0, modelStart)}${updatedModel}${schema.slice(modelEnd)}`;
fs.writeFileSync(schemaPath, updatedSchema, "utf8");
process.stdout.write(`Added Branch Master fields: ${missing.join(", ")}\n`);
