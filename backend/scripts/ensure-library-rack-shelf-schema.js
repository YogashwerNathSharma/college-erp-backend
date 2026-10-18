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

// Check if LibraryShelf already has the required fields
const libShelfBlock = getModelBlock(schema, "LibraryShelf").block;
const hasRackId = libShelfBlock.includes("rackId");
const hasLevel = libShelfBlock.includes("level");

if (!hasRackId || !hasLevel) {
  // Only modify if needed
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
      // Find the tenant relation line and add after it
      const tenantIdx = patched.indexOf("tenant    Tenant");
      if (tenantIdx >= 0) {
        const lineEnd = patched.indexOf("\n", tenantIdx);
        const afterLine = patched.indexOf("\n", lineEnd + 1);
        patched = patched.slice(0, afterLine) + "\n  rackId    String?   @db.ObjectId\n  rack       Rack?     @relation(fields: [rackId], references: [id])" + patched.slice(afterLine);
      }
    }

    if (!patched.includes("  level     Int?")) {
      const isActiveMarker = "  isActive";
      const idx = patched.indexOf(isActiveMarker);
      if (idx >= 0) {
        patched = patched.slice(0, idx) + "  level     Int?\n" + patched.slice(idx);
      }
    }

    if (!patched.includes("@@index([rackId])")) {
      const close = patched.lastIndexOf("\n}");
      if (close >= 0) {
        patched = patched.slice(0, close) + "\n  @@index([rackId])" + patched.slice(close);
      }
    }

    schema = schema.slice(0, start) + patched + schema.slice(end);
  }

  fs.writeFileSync(schemaPath, schema, "utf8");
}

const verify = fs.readFileSync(schemaPath, "utf8");
const checks = [
  "model Rack {",
  "model LibraryShelf {",
  "tenant    Tenant",
  "isActive  Boolean",
];

for (const marker of checks) {
  if (!verify.includes(marker)) throw new Error(`Library Rack/Shelf schema verification failed: ${marker}`);
}

process.stdout.write("Library Rack/Shelf Prisma schema verified.\n");
