/**
 * 🏠 Portal Service
 * 
 * Determines which portal/layout a user should see based on their role.
 * Returns portal config including sidebar menu, home route, and available features.
 */

// ═══ Portal definitions per role ═══
export interface PortalConfig {
  portalId: string;
  portalName: string;
  homeRoute: string;
  layout: "super-admin" | "admin" | "teacher" | "student" | "parent" | "staff-workspace";
  sidebarSections: SidebarSection[];
  features: string[];
}

interface SidebarSection {
  section: string;
  items: SidebarItem[];
}

interface SidebarItem {
  name: string;
  icon: string;
  path?: string;
  children?: { name: string; icon: string; path: string }[];
}

// ═══ Portal configurations ═══
const PORTAL_CONFIGS: Record<string, PortalConfig> = {
  SUPER_ADMIN: {
    portalId: "super-admin",
    portalName: "Super Admin",
    homeRoute: "/super-admin/dashboard",
    layout: "super-admin",
    features: ["*"],
    sidebarSections: [], // Super Admin uses existing hardcoded sidebar
  },

  ADMIN: {
    portalId: "admin",
    portalName: "School Admin",
    homeRoute: "/dashboard",
    layout: "admin",
    features: ["*"],
    sidebarSections: [], // Admin uses existing sidebar + module filtering
  },

  PRINCIPAL: {
    portalId: "principal",
    portalName: "Principal Portal",
    homeRoute: "/principal/dashboard",
    layout: "admin", // Reuses admin layout with filtered sidebar
    features: [
      "dashboard", "students", "teachers", "attendance", "exams",
      "fees.view", "reports", "timetable", "communication", "leave.approve",
    ],
    sidebarSections: [
      {
        section: "",
        items: [
          { name: "Dashboard", icon: "LayoutDashboard", path: "/principal/dashboard" },
        ],
      },
      {
        section: "ACADEMICS",
        items: [
          { name: "Students", icon: "Users", path: "/students" },
          { name: "Teachers", icon: "UserCog", path: "/teachers" },
          {
            name: "Attendance",
            icon: "ClipboardCheck",
            children: [
              { name: "Dashboard", icon: "ClipboardEdit", path: "/attendance-dashboard" },
              { name: "Reports", icon: "BarChart3", path: "/attendance-report" },
            ],
          },
          {
            name: "Exams & Results",
            icon: "FileText",
            children: [
              { name: "All Exams", icon: "FileText", path: "/exams" },
              { name: "Reports", icon: "BarChart3", path: "/exam-reports" },
            ],
          },
        ],
      },
      {
        section: "MANAGEMENT",
        items: [
          { name: "Fee Overview", icon: "IndianRupee", path: "/fees/dashboard" },
          { name: "Leave Approvals", icon: "Clock", path: "/teacher-leave" },
          { name: "Reports", icon: "BarChart3", path: "/reports" },
          { name: "Time Table", icon: "CalendarClock", path: "/timeTable" },
          { name: "Communication", icon: "MessageSquare", path: "/communication" },
        ],
      },
    ],
  },

  TEACHER: {
    portalId: "teacher",
    portalName: "Teacher Portal",
    homeRoute: "/teacher/dashboard",
    layout: "teacher",
    features: [
      "attendance.mark", "attendance.view", "marks.entry", "marks.view",
      "timetable.view", "homework", "leave.apply", "communication.view",
    ],
    sidebarSections: [
      {
        section: "",
        items: [
          { name: "Dashboard", icon: "LayoutDashboard", path: "/teacher/dashboard" },
        ],
      },
      {
        section: "MY CLASSES",
        items: [
          { name: "My Students", icon: "Users", path: "/teacher/my-students" },
          { name: "Attendance", icon: "ClipboardCheck", path: "/teacher/attendance" },
          { name: "Marks Entry", icon: "FileText", path: "/teacher/marks" },
          { name: "Homework", icon: "BookOpen", path: "/teacher/homework" },
        ],
      },
      {
        section: "SCHEDULE",
        items: [
          { name: "My Timetable", icon: "CalendarClock", path: "/teacher/timetable" },
          { name: "Exam Schedule", icon: "Calendar", path: "/teacher/exams" },
        ],
      },
      {
        section: "PERSONAL",
        items: [
          { name: "My Leave", icon: "Clock", path: "/teacher/leave" },
          { name: "My Salary", icon: "Wallet", path: "/teacher/salary" },
          { name: "Notices", icon: "Bell", path: "/teacher/notices" },
          { name: "My Profile", icon: "UserCog", path: "/teacher/profile" },
        ],
      },
    ],
  },

  ACCOUNTANT: {
    portalId: "accountant",
    portalName: "Accounts Portal",
    homeRoute: "/accountant/dashboard",
    layout: "staff-workspace",
    features: ["fees", "reports.finance"],
    sidebarSections: [
      {
        section: "",
        items: [
          { name: "Dashboard", icon: "LayoutDashboard", path: "/accountant/dashboard" },
        ],
      },
      {
        section: "FEES & FINANCE",
        items: [
          { name: "Fee Collection", icon: "IndianRupee", path: "/fees/collection" },
          { name: "Fee Structures", icon: "Layers", path: "/fees/structures" },
          { name: "Receipts", icon: "FileText", path: "/fees/receipts" },
          { name: "Student Ledger", icon: "BookOpenCheck", path: "/fees/ledger" },
          { name: "Discounts", icon: "CreditCard", path: "/fees/discounts" },
          { name: "Fine Rules", icon: "FileText", path: "/fees/fine-rules" },
          { name: "Reminders", icon: "Bell", path: "/fees/reminders" },
        ],
      },
      {
        section: "REPORTS",
        items: [
          { name: "Fee Reports", icon: "BarChart3", path: "/fees/reports" },
          { name: "Collection Summary", icon: "PieChart", path: "/fees/dashboard" },
        ],
      },
    ],
  },

  LIBRARIAN: {
    portalId: "librarian",
    portalName: "Library Portal",
    homeRoute: "/librarian/dashboard",
    layout: "staff-workspace",
    features: ["library"],
    sidebarSections: [
      {
        section: "",
        items: [
          { name: "Dashboard", icon: "LayoutDashboard", path: "/librarian/dashboard" },
        ],
      },
      {
        section: "LIBRARY",
        items: [
          { name: "Book Catalog", icon: "Library", path: "/library" },
          { name: "Issue / Return", icon: "BookOpen", path: "/library/issue" },
          { name: "Due Books", icon: "Clock", path: "/library/due" },
          { name: "Reports", icon: "BarChart3", path: "/library/reports" },
        ],
      },
    ],
  },

  HR_MANAGER: {
    portalId: "hr",
    portalName: "HR Portal",
    homeRoute: "/hr/dashboard",
    layout: "staff-workspace",
    features: ["hr", "teachers.view", "leave.approve", "salary"],
    sidebarSections: [
      {
        section: "",
        items: [
          { name: "Dashboard", icon: "LayoutDashboard", path: "/hr/dashboard" },
        ],
      },
      {
        section: "STAFF MANAGEMENT",
        items: [
          { name: "Staff List", icon: "Users", path: "/hr/staff" },
          { name: "Payroll", icon: "Wallet", path: "/hr/payroll" },
          { name: "Leave Management", icon: "Clock", path: "/hr/leave" },
          { name: "Staff Attendance", icon: "ClipboardCheck", path: "/hr/attendance" },
          { name: "Documents", icon: "FolderOpen", path: "/hr/documents" },
        ],
      },
    ],
  },

  RECEPTIONIST: {
    portalId: "reception",
    portalName: "Reception Portal",
    homeRoute: "/reception/dashboard",
    layout: "staff-workspace",
    features: ["admission", "gate-pass", "communication.view"],
    sidebarSections: [
      {
        section: "",
        items: [
          { name: "Dashboard", icon: "LayoutDashboard", path: "/reception/dashboard" },
        ],
      },
      {
        section: "ADMISSIONS",
        items: [
          { name: "New Inquiry", icon: "UserPlus", path: "/reception/inquiry" },
          { name: "New Admission", icon: "UserCheck", path: "/students/new-admission" },
          { name: "Admission Status", icon: "FileText", path: "/students/admission-approval" },
        ],
      },
      {
        section: "FRONT DESK",
        items: [
          { name: "Visitor Log", icon: "Users", path: "/gate-pass" },
          { name: "Pending Passes", icon: "Clock", path: "/gate-pass/pending" },
          { name: "Notices", icon: "Bell", path: "/communication" },
        ],
      },
    ],
  },

  PARENT: {
    portalId: "parent",
    portalName: "Parent Portal",
    homeRoute: "/parent/dashboard",
    layout: "parent",
    features: ["attendance.view", "marks.view", "fees.view", "fees.pay", "communication.view"],
    sidebarSections: [
      {
        section: "",
        items: [
          { name: "Dashboard", icon: "LayoutDashboard", path: "/parent/dashboard" },
        ],
      },
      {
        section: "MY CHILD",
        items: [
          { name: "Attendance", icon: "ClipboardCheck", path: "/parent/attendance" },
          { name: "Results", icon: "FileText", path: "/parent/results" },
          { name: "Timetable", icon: "CalendarClock", path: "/parent/timetable" },
          { name: "Homework", icon: "BookOpen", path: "/parent/homework" },
        ],
      },
      {
        section: "FINANCE",
        items: [
          { name: "Fee Dues", icon: "IndianRupee", path: "/parent/fees" },
          { name: "Receipts", icon: "FileText", path: "/parent/receipts" },
        ],
      },
      {
        section: "SCHOOL",
        items: [
          { name: "Notices", icon: "Bell", path: "/parent/notices" },
          { name: "PTM Schedule", icon: "Calendar", path: "/parent/ptm" },
          { name: "My Profile", icon: "UserCog", path: "/parent/profile" },
        ],
      },
    ],
  },

  STUDENT: {
    portalId: "student",
    portalName: "Student Portal",
    homeRoute: "/student/dashboard",
    layout: "student",
    features: ["attendance.view", "marks.view", "fees.view", "timetable.view"],
    sidebarSections: [], // Student portal is a separate app
  },

  // Fallback for any unknown role
  STAFF: {
    portalId: "staff",
    portalName: "Staff Portal",
    homeRoute: "/staff/dashboard",
    layout: "staff-workspace",
    features: ["attendance.view", "leave.apply", "communication.view"],
    sidebarSections: [
      {
        section: "",
        items: [
          { name: "Dashboard", icon: "LayoutDashboard", path: "/staff/dashboard" },
          { name: "My Attendance", icon: "ClipboardCheck", path: "/staff/attendance" },
          { name: "My Leave", icon: "Clock", path: "/staff/leave" },
          { name: "Notices", icon: "Bell", path: "/staff/notices" },
          { name: "My Profile", icon: "UserCog", path: "/staff/profile" },
        ],
      },
    ],
  },
};

/**
 * Get portal configuration for a user role
 */
export const getPortalConfig = (role: string): PortalConfig => {
  return PORTAL_CONFIGS[role] || PORTAL_CONFIGS["STAFF"];
};

/**
 * Get all available portal types (for Super Admin)
 */
export const getAllPortalTypes = () => {
  return Object.entries(PORTAL_CONFIGS).map(([role, config]) => ({
    role,
    portalId: config.portalId,
    portalName: config.portalName,
    layout: config.layout,
    homeRoute: config.homeRoute,
    featureCount: config.features.length,
    menuSections: config.sidebarSections.length,
  }));
};
