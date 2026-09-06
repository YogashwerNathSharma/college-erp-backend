const fs = require("fs");
const path = require("path");

const schemaPath = path.resolve(__dirname, "../prisma/schema.prisma");
const schema = fs.readFileSync(schemaPath, "utf8");

const modelStart = schema.indexOf("model School {");
if (modelStart === -1) {
  throw new Error("School model not found in prisma/schema.prisma");
}

const modelEnd = schema.indexOf("\n}", modelStart);
if (modelEnd === -1) {
  throw new Error("School model closing brace not found");
}

const modelBlock = schema.slice(modelStart, modelEnd);
const requiredFields = [
  "address",
  "city",
  "state",
  "pincode",
  "phone",
  "email",
  "website",
  "logo",
  "affiliation",
  "establishedYear",
  "principalName",
];

const missing = requiredFields.filter((field) => !new RegExp(`^\\s+${field}\\s+`, "m").test(modelBlock));
if (missing.length === 0) {
  process.stdout.write("School Master fields already present.\n");
  process.exit(0);
}

const insertAfter = "  code      String?\n";
if (!modelBlock.includes(insertAfter)) {
  throw new Error("Expected School model anchor field was not found");
}

const schoolFields = [
  "  address         String?",
  "  city            String?",
  "  state           String?",
  "  pincode         String?",
  "  phone           String?",
  "  email           String?",
  "  website         String?",
  "  logo            String?",
  "  affiliation     String?",
  "  establishedYear Int?",
  "  principalName   String?",
].join("\n");

const updatedModel = modelBlock.replace(insertAfter, `${insertAfter}${schoolFields}\n`);
const updatedSchema = `${schema.slice(0, modelStart)}${updatedModel}${schema.slice(modelEnd)}`;
fs.writeFileSync(schemaPath, updatedSchema, "utf8");
process.stdout.write(`Added School Master fields: ${missing.join(", ")}\n`);
