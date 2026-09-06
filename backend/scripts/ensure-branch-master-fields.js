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
const requiredFields = ["address", "city", "state", "pincode", "phone", "email", "isMain"];
const missing = requiredFields.filter((field) => !new RegExp(`^\\s+${field}\\s+`, "m").test(modelBlock));

if (missing.length === 0) {
  process.stdout.write("Branch Master fields already present.\n");
  process.exit(0);
}

const codeMatch = modelBlock.match(/^\\s+code\\s+String\\??\\s*$/m);
if (!codeMatch) {
  throw new Error("Expected Branch model code field was not found");
}

const insertAfter = codeMatch[0];
const branchFields = [
  "  address   String?",
  "  city      String?",
  "  state     String?",
  "  pincode   String?",
  "  phone     String?",
  "  email     String?",
  "  isMain    Boolean  @default(false)",
].join("\\n");

const updatedModel = modelBlock.replace(insertAfter, `${insertAfter}\n${branchFields}`);
const updatedSchema = `${schema.slice(0, modelStart)}${updatedModel}${schema.slice(modelEnd)}`;
fs.writeFileSync(schemaPath, updatedSchema, "utf8");
process.stdout.write(`Added Branch Master fields: ${missing.join(", ")}\\n`);
