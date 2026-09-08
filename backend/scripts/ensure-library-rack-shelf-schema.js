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

{
  const { start, end, block } = getModelBlock(schema, "Rack");
  if (!block.includes("shelves LibraryShelf[]")) {
    const marker = "  isActive Boolean       @default(true)";
    if (!block.includes(marker)) throw new Error("Rack isActive marker not found; refusing schema rewrite");
    const patched = block.replace(marker, "  shelves LibraryShelf[]\n\n" + marker);
    schema = schema.slice(0, start) + patched + schema.slice(end);
  }
}

{
  const { start, end, block } = getModelBlock(schema, "LibraryShelf");
  let patched = block;

  if (!patched.includes("rackId")) {
    const tenantRelation = /  tenant\s+Tenant\s+@relation\([^\n]+\)\n/;
    if (!tenantRelation.test(patched)) throw new Error("LibraryShelf tenant relation marker not found; refusing schema rewrite");
    patched = patched.replace(
      tenantRelation,
      "$&  rackId    String?   @db.ObjectId\n  rack       Rack?     @relation(fields: [rackId], references: [id])\n"
    );
  }

  if (!patched.includes("  level     Int?")) {
    const isActiveMarker = "  isActive";
    const idx = patched.indexOf(isActiveMarker);
    if (idx < 0) throw new Error("LibraryShelf isActive marker not found; refusing schema rewrite");
    patched = patched.slice(0, idx) + "  level     Int?\n" + patched.slice(idx);
  }

  if (!patched.includes("@@index([rackId])")) {
    const close = patched.lastIndexOf("\n}");
    if (close < 0) throw new Error("LibraryShelf closing marker not found; refusing schema rewrite");
    patched = patched.slice(0, close) + "\n  @@index([rackId])" + patched.slice(close);
  }

  schema = schema.slice(0, start) + patched + schema.slice(end);
}

fs.writeFileSync(schemaPath, schema, "utf8");

const verify = fs.readFileSync(schemaPath, "utf8");
const checks = [
  "model Rack {",
  "shelves LibraryShelf[]",
  "model LibraryShelf {",
  "rackId    String?   @db.ObjectId",
  "rack       Rack?     @relation(fields: [rackId], references: [id])",
  "level     Int?",
  "@@index([rackId])",
];
for (const marker of checks) {
  if (!verify.includes(marker)) throw new Error(`Library Rack/Shelf schema verification failed: ${marker}`);
}

process.stdout.write("Library Rack/Shelf Prisma schema verified: Rack is the active rack model and LibraryShelf has rackId relation + level.\n");
