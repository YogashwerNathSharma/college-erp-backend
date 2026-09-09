const fs = require("fs");
const path = require("path");

const schemaPath = path.join(__dirname, "..", "prisma", "schema.prisma");
let schema = fs.readFileSync(schemaPath, "utf8");
let changed = false;

// Student class membership is stored in Enrollment, not Student.classId.
// Remove the stale composite index before Prisma validation/generation.
const invalidStudentIndex = "  @@index([tenantId, academicYearId, classId, status])\n";
if (schema.includes(invalidStudentIndex)) {
  schema = schema.replace(invalidStudentIndex, "");
  changed = true;
  console.log("Student Prisma schema verified: removed invalid classId index.");
}

// Prisma rejects a field-level @unique together with an identical @@index/@@unique
// on the same model. Several tenant-scoped singleton settings had both forms.
// Also remove exact duplicate index/unique declarations inside a model block.
const modelPattern = /model\s+\w+\s*\{[\s\S]*?\n\}/g;
schema = schema.replace(modelPattern, (modelBlock) => {
  let updated = modelBlock;

  const tenantIdLine = updated.match(/^\s*tenantId\s+[^\n]*@unique[^\n]*$/m);
  if (tenantIdLine) {
    const before = updated;
    updated = updated.replace(/^\s*@@index\(\[tenantId\]\)\s*\n/gm, "");
    updated = updated.replace(/^\s*@@unique\(\[tenantId\]\)\s*\n/gm, "");
    if (updated !== before) {
      changed = true;
      console.log("Prisma schema verified: removed redundant tenantId index from singleton model.");
    }
  }

  const seenAttributes = new Set();
  updated = updated.replace(/^(\s*@@(?:index|unique)\([^\n]+\)\s*)$/gm, (line) => {
    const normalized = line.trim();
    if (seenAttributes.has(normalized)) {
      changed = true;
      console.log(`Prisma schema verified: removed duplicate ${normalized}.`);
      return "";
    }
    seenAttributes.add(normalized);
    return line;
  });

  return updated;
});

if (changed) {
  fs.writeFileSync(schemaPath, schema);
} else {
  console.log("Prisma schema verified: no known duplicate or invalid indexes found.");
}
