const fs = require("fs");
const path = require("path");

const schemaPath = path.resolve(__dirname, "../prisma/schema.prisma");

function getModelBlock(source, modelName) {
  const start = source.indexOf(`model ${modelName} {`);
  if (start < 0) throw new Error(`Prisma model ${modelName} not found`);
  const nextModel = source.indexOf("\nmodel ", start + 1);
  const end = nextModel >= 0 ? nextModel : source.length;
  return { start, end, block: source.slice(start, end) };
}

let schema = fs.readFileSync(schemaPath, "utf8");

// Check if Rack already has shelves and LibraryShelf has rackId
const rackBlock = getModelBlock(schema, "Rack").block;
const libShelfBlock = getModelBlock(schema, "LibraryShelf").block;

const hasShelves = rackBlock.includes("LibraryShelf[]");
const hasRackId = libShelfBlock.includes("rackId");

// Only proceed with modifications if fields are missing
if (!hasShelves || !hasRackId) {
  // Add shelves to Rack if missing
  if (!hasShelves) {
    const { start, end, block } = getModelBlock(schema, "Rack");
    const marker = "  isActive Boolean       @default(true)";
    if (!block.includes(marker)) throw new Error("Rack isActive marker not found");
    const patched = block.replace(marker, "  shelves LibraryShelf[]\n\n" + marker);
    schema = schema.slice(0, start) + patched + schema.slice(end);
  }

  // Add rackId and rack relation to LibraryShelf if missing
  if (!hasRackId) {
    const { start, end, block } = getModelBlock(schema, "LibraryShelf");
    const tenantIdx = block.indexOf("tenant");
    const lineEnd = block.indexOf("\n", tenantIdx);
    const afterLine = block.indexOf("\n", lineEnd + 1);
    let patched = block.slice(0, afterLine) + "\n  rackId    String?   @db.ObjectId\n  rack      Rack?     @relation(fields: [rackId], references: [id])" + block.slice(afterLine);
    schema = schema.slice(0, start) + patched + schema.slice(end);
  }

  fs.writeFileSync(schemaPath, schema, "utf8");
}

// Verify the schema is valid
const verify = fs.readFileSync(schemaPath, "utf8");
const checks = [
  "model Rack {",
  "model LibraryShelf {",
  "tenant",
  "isActive",
];

for (const marker of checks) {
  if (!verify.includes(marker)) throw new Error(`Library schema verification failed: ${marker}`);
}

process.stdout.write("Library Rack/Shelf Prisma schema verified.\n");
