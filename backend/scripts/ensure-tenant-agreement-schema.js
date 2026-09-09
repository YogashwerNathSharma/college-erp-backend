const fs = require("fs");
const path = require("path");

const schemaPath = path.join(__dirname, "../prisma/schema.prisma");
const marker = "model TenantAgreement {";
const model = `\n\n// ═══════════════════════════════════════════════════════════════════════════════\n// TENANT SAAS AGREEMENT & ACCEPTANCE\n// Owner: Yogashwer Nath Sharma | YN Software\n// Stores versioned acceptance for each tenant without transferring source-code IP.\n// ═══════════════════════════════════════════════════════════════════════════════\n\nmodel TenantAgreement {\n  id                String   @id @default(auto()) @map("_id") @db.ObjectId\n  tenantId          String   @db.ObjectId\n  agreementVersion  String\n  agreementTitle    String\n  acceptedAt        DateTime @default(now())\n  acceptedByName    String\n  acceptedByEmail   String\n  acceptedByUserId  String   @db.ObjectId\n  acceptedIp        String?\n  userAgent         String?\n  createdAt         DateTime @default(now())\n  updatedAt         DateTime @updatedAt\n\n  @@index([tenantId])\n  @@index([tenantId, agreementVersion])\n  @@map("tenant_agreements")\n}\n`;

let schema = fs.readFileSync(schemaPath, "utf8");
if (!schema.includes(marker)) {
  schema += model;
  fs.writeFileSync(schemaPath, schema, "utf8");
  console.log("[tenant-agreement] Added TenantAgreement model to schema.prisma");
} else {
  console.log("[tenant-agreement] TenantAgreement model already present");
}
