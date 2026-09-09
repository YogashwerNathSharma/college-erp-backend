const fs = require("fs");
const path = require("path");

const schemaPath = path.join(__dirname, "..", "prisma", "schema.prisma");
let schema = fs.readFileSync(schemaPath, "utf8");

// Student class membership is stored in Enrollment, not Student.classId.
// Remove the stale composite index before Prisma validation/generation.
const invalidIndex = "  @@index([tenantId, academicYearId, classId, status])\n";
if (schema.includes(invalidIndex)) {
  schema = schema.replace(invalidIndex, "");
  fs.writeFileSync(schemaPath, schema);
  console.log("Student Prisma schema verified: removed invalid classId index.");
} else {
  console.log("Student Prisma schema verified: no invalid classId index found.");
}
