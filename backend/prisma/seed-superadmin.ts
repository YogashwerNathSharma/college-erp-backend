// @ts-nocheck
// ═══════════════════════════════════════════════════════════════════════════
// SUPER ADMIN SEED - Creates Tenant + SuperAdmin + Admin user
// ═══════════════════════════════════════════════════════════════════════════
// RUN: npx ts-node prisma/seed-superadmin.ts
// ═══════════════════════════════════════════════════════════════════════════
// This is the FIRST seed to run on a fresh database.
// It creates:
//   1. Tenant (School/College)
//   2. Super Admin user (platform-level)
//   3. Admin user (tenant-level)
//   4. Subscription Plan + Tenant Subscription
// ═══════════════════════════════════════════════════════════════════════════

import { PrismaClient } from "@prisma/client";
import * as bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  console.log("\n═══════════════════════════════════════════════════════");
  console.log("  🔐 SUPER ADMIN SEED");
  console.log("═══════════════════════════════════════════════════════\n");

  // ─────────────────────────────────────────────
  // STEP 1: Create Tenant (School/College)
  // ─────────────────────────────────────────────
  console.log("📌 Step 1: Creating Tenant...");

  const existingTenant = await prisma.tenant.findFirst({ where: { isDeleted: false } });

  let tenant;
  if (existingTenant) {
    tenant = existingTenant;
    console.log(`  ✅ Tenant already exists: ${tenant.name} (${tenant.id})`);
  } else {
    tenant = await prisma.tenant.create({
      data: {
        name: "RMS Academy",
        type: "school",
        email: "info@rmsacademy.edu",
        phone: "9876543210",
        address: "Divna Road, Bareilly, UP - 243001",
        primaryColor: "#4f46e5",
        logoUrl: null,
        isActive: true,
        isDeleted: false,
        maxStudents: 5000,
        maxTeachers: 200,
        maxAdmins: 10,
        maxStorageInGB: 50,
        plan: "enterprise",
        subscriptionStatus: "active",
        monthlyFee: 0,
      },
    });
    console.log(`  ✅ Tenant created: ${tenant.name} (${tenant.id})`);
  }

  const tenantId = tenant.id;

  // ─────────────────────────────────────────────
  // STEP 2: Create Super Admin (Platform Level)
  // ─────────────────────────────────────────────
  console.log("\n📌 Step 2: Creating Super Admin...");

  const superAdminPassword = await bcrypt.hash("SuperAdmin@123", 10);

  const existingSuperAdmin = await prisma.user.findFirst({
    where: { role: "SUPER_ADMIN" },
  });

  let superAdmin;
  if (existingSuperAdmin) {
    superAdmin = existingSuperAdmin;
    console.log(`  ✅ Super Admin already exists: ${superAdmin.email}`);
  } else {
    superAdmin = await prisma.user.create({
      data: {
        name: "Super Admin",
        email: "superadmin@erp.com",
        password: superAdminPassword,
        role: "SUPER_ADMIN",
        phone: "9999999999",
        status: "ACTIVE",
        tenantId: null, // Super Admin is platform-level (no tenant)
        isActive: true,
        isDeleted: false,
        isFirstLogin: false,
        twoFactorEnabled: false,
      },
    });
    console.log(`  ✅ Super Admin created: ${superAdmin.email}`);
  }

  // ─────────────────────────────────────────────
  // STEP 3: Create Admin User (Tenant Level)
  // ─────────────────────────────────────────────
  console.log("\n📌 Step 3: Creating Admin User...");

  const adminPassword = await bcrypt.hash("Admin@123", 10);

  const existingAdmin = await prisma.user.findFirst({
    where: { role: "ADMIN", tenantId },
  });

  let adminUser;
  if (existingAdmin) {
    adminUser = existingAdmin;
    console.log(`  ✅ Admin already exists: ${adminUser.email}`);
  } else {
    adminUser = await prisma.user.create({
      data: {
        name: "Admin",
        email: "admin@rms.com",
        password: adminPassword,
        role: "ADMIN",
        phone: "9876543211",
        status: "ACTIVE",
        tenantId: tenantId,
        isActive: true,
        isDeleted: false,
        isFirstLogin: false,
        twoFactorEnabled: false,
      },
    });
    console.log(`  ✅ Admin created: ${adminUser.email}`);
  }

  // ─────────────────────────────────────────────
  // STEP 4: Create Principal User
  // ─────────────────────────────────────────────
  console.log("\n📌 Step 4: Creating Principal User...");

  const principalPassword = await bcrypt.hash("Principal@123", 10);

  const existingPrincipal = await prisma.user.findFirst({
    where: { role: "PRINCIPAL", tenantId },
  });

  let principalUser;
  if (existingPrincipal) {
    principalUser = existingPrincipal;
    console.log(`  ✅ Principal already exists: ${principalUser.email}`);
  } else {
    principalUser = await prisma.user.create({
      data: {
        name: "Dr. Rajesh Kumar",
        email: "principal@rms.com",
        password: principalPassword,
        role: "PRINCIPAL",
        phone: "9876543212",
        status: "ACTIVE",
        tenantId: tenantId,
        isActive: true,
        isDeleted: false,
        isFirstLogin: false,
        twoFactorEnabled: false,
      },
    });
    console.log(`  ✅ Principal created: ${principalUser.email}`);
  }

  // ─────────────────────────────────────────────
  // STEP 5: Create Subscription Plan
  // ─────────────────────────────────────────────
  console.log("\n📌 Step 5: Creating Subscription Plan...");

  const existingPlan = await prisma.subscriptionPlan.findFirst({
    where: { slug: "enterprise" },
  });

  let plan;
  if (existingPlan) {
    plan = existingPlan;
    console.log(`  ✅ Plan already exists: ${plan.name}`);
  } else {
    plan = await prisma.subscriptionPlan.create({
      data: {
        name: "Enterprise Plan",
        slug: "enterprise",
        description: "Full access to all ERP modules",
        price: 0,
        durationInDays: 1825,
        currency: "INR",
        maxStudents: 5000,
        maxTeachers: 200,
        maxAdmins: 10,
        maxStorageInGB: 50,
        features: [
          "Student Management",
          "Teacher Management",
          "Fee Management",
          "Attendance",
          "Exam & Results",
          "Timetable",
          "Transport",
          "Library",
          "Hostel",
          "HR & Payroll",
          "Communication",
          "Certificates",
          "Reports",
          "AI Assistant",
          "Dashboard Builder",
          "Inventory",
          "Gate Pass",
          "Events & Calendar",
        ],
        isActive: true,
      },
    });
    console.log(`  ✅ Plan created: ${plan.name}`);
  }

  // ─────────────────────────────────────────────
  // STEP 6: Create Tenant Subscription
  // ─────────────────────────────────────────────
  console.log("\n📌 Step 6: Creating Tenant Subscription...");

  const existingSub = await prisma.tenantSubscription.findFirst({
    where: { tenantId, isActive: true },
  });

  if (existingSub) {
    console.log(`  ✅ Subscription already exists: ${existingSub.subscriptionCode}`);
  } else {
    const sub = await prisma.tenantSubscription.create({
      data: {
        tenantId: tenantId,
        planId: plan.id,
        subscriptionCode: "ENT-2025-001",
        startDate: new Date("2025-01-01"),
        endDate: new Date("2030-12-31"),
        status: "ACTIVE",
        isActive: true,
        amount: 0,
        currency: "INR",
        paymentStatus: "PAID",
        autoRenew: false,
        maxStudents: 5000,
        maxTeachers: 200,
        maxAdmins: 10,
        maxStorageInGB: 50,
      },
    });
    console.log(`  ✅ Subscription created: ${sub.subscriptionCode}`);
  }

  // ─────────────────────────────────────────────
  // SUMMARY
  // ─────────────────────────────────────────────
  console.log("\n═══════════════════════════════════════════════════════");
  console.log("  ✅ SEED COMPLETE!");
  console.log("═══════════════════════════════════════════════════════");
  console.log(`
  📋 Login Credentials:
  ┌─────────────────────────────────────────────────────────┐
  │ Role        │ Email                      │ Password      │
  ├─────────────┼────────────────────────────┼───────────────┤
  │ SUPER_ADMIN │ superadmin@rmsacademy.edu   │ SuperAdmin@123│
  │ ADMIN       │ admin@rmsacademy.edu        │ Admin@123     │
  │ PRINCIPAL   │ principal@rmsacademy.edu    │ Principal@123 │
  └─────────────────────────────────────────────────────────┘

  🏫 Tenant: ${tenant.name} (${tenantId})
  📦 Plan: Enterprise (unlimited until 2030)
  `);
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
