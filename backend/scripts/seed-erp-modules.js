/**
 * 🌱 Seed ERP Modules
 * 
 * Run: node scripts/seed-erp-modules.js
 * 
 * Creates all standard ERP modules in the erp_modules collection.
 * Safe to run multiple times — skips existing slugs.
 */

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const ERP_MODULES = [
  // CORE (always available — cannot be disabled per tenant)
  { slug: "dashboard", name: "Dashboard", category: "Core", icon: "LayoutDashboard", isCore: true, description: "Main dashboard with analytics and overview" },
  { slug: "settings", name: "Settings", category: "Core", icon: "Settings", isCore: true, description: "System settings, user management, roles & permissions" },
  { slug: "master-data", name: "Master Data", category: "Core", icon: "Database", isCore: true, description: "Academic setup, classes, sections, subjects" },
  { slug: "notifications", name: "Notifications", category: "Core", icon: "Bell", isCore: true, description: "System notifications and alerts" },

  // ACADEMIC
  { slug: "students", name: "Students", category: "Academic", icon: "Users", description: "Student management, admissions, promotions, transfers" },
  { slug: "teachers", name: "Teachers", category: "Academic", icon: "UserCog", description: "Teacher management, attendance, salary, performance" },
  { slug: "attendance", name: "Attendance", category: "Academic", icon: "ClipboardCheck", description: "Student and staff attendance tracking" },
  { slug: "exams", name: "Examinations", category: "Academic", icon: "FileText", description: "Exam management, grading, report cards" },
  { slug: "timetable", name: "Time Table", category: "Academic", icon: "Clock", description: "Class timetable scheduling" },

  // FINANCE
  { slug: "fees", name: "Fees & Billing", category: "Finance", icon: "IndianRupee", description: "Fee collection, structures, discounts, receipts" },

  // OPERATIONS
  { slug: "transport", name: "Transport", category: "Operations", icon: "Bus", description: "Vehicle & route management, tracking" },
  { slug: "library", name: "Library", category: "Operations", icon: "Library", description: "Book management, issue/return, cataloging" },
  { slug: "hostel", name: "Hostel", category: "Operations", icon: "BedDouble", description: "Room allocation, hostel fees, mess management" },
  { slug: "inventory", name: "Inventory", category: "Operations", icon: "Package", description: "Asset management, stock tracking" },
  { slug: "gate-pass", name: "Gate Pass", category: "Operations", icon: "DoorOpen", description: "Visitor log, gate pass approvals" },

  // HR
  { slug: "hr", name: "HR & Payroll", category: "HR", icon: "UserCog", description: "Staff management, payroll, leave" },

  // COMMUNICATION
  { slug: "communication", name: "Communication", category: "Communication", icon: "MessageSquare", description: "Notices, SMS, WhatsApp, circulars" },
  { slug: "events", name: "Events & Calendar", category: "Communication", icon: "CalendarDays", description: "Event management, academic calendar" },

  // CERTIFICATES & DOCS
  { slug: "certificates", name: "Certificates", category: "Documents", icon: "Award", description: "TC, Character, Migration certificates" },
  { slug: "file-manager", name: "File Manager", category: "Documents", icon: "FileArchive", description: "Centralized document storage" },
  { slug: "id-cards", name: "ID Cards & QR", category: "Documents", icon: "IdCard", description: "Student & staff ID card generation" },

  // TOOLS
  { slug: "workflow", name: "Workflow Engine", category: "Tools", icon: "Activity", description: "Automated workflow management" },
  { slug: "form-builder", name: "Form Builder", category: "Tools", icon: "ClipboardEdit", description: "Custom form creation" },
  { slug: "report-builder", name: "Report Builder", category: "Tools", icon: "BarChart3", description: "Custom report generation" },
  { slug: "import-export", name: "Import / Export", category: "Tools", icon: "FolderOpen", description: "Bulk data import and export" },
  { slug: "scheduler", name: "Scheduler", category: "Tools", icon: "CalendarClock", description: "Task scheduling and automation" },

  // DESIGN
  { slug: "template-designer", name: "Template Designer", category: "Design", icon: "Brush", description: "Certificate and document template design" },
  { slug: "dashboard-builder", name: "Dashboard Builder", category: "Design", icon: "LayoutDashboard", description: "Custom dashboard creation" },

  // SUPPORT
  { slug: "helpdesk", name: "Help Desk", category: "Support", icon: "HelpCircle", description: "Support ticket management" },
];

async function seed() {
  console.log("🌱 Seeding ERP modules...\n");

  let created = 0;
  let skipped = 0;

  for (const mod of ERP_MODULES) {
    const existing = await prisma.erpModule.findFirst({
      where: { slug: mod.slug, isDeleted: false },
    });

    if (existing) {
      console.log(`  ⏭️  ${mod.slug} (already exists)`);
      skipped++;
      continue;
    }

    await prisma.erpModule.create({
      data: {
        name: mod.name,
        slug: mod.slug,
        description: mod.description || "",
        version: "1.0.0",
        category: mod.category,
        icon: mod.icon || "Package",
        author: "Core Team",
        license: "Standard",
        isCore: mod.isCore || false,
        isEnabled: true,
        isInstalled: true,
        price: 0,
        features: [],
        healthStatus: "healthy",
        lastHealthCheck: new Date(),
      },
    });

    console.log(`  ✅ ${mod.slug} (${mod.name})`);
    created++;
  }

  console.log(`\n📊 Done! Created: ${created}, Skipped: ${skipped}, Total: ${ERP_MODULES.length}`);
}

seed()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
