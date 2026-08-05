import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { useState } from "react";
import {
  LayoutDashboard, Users, UserPlus, Zap, ClipboardCheck, BookOpen, Award,
  ArrowRightLeft, FileText, MessageSquare, Copy, Settings, Printer,
  BarChart2, CreditCard, Bookmark, Trash2, ChevronDown, ChevronUp,
  BellRing, LogOut, Menu, X, GraduationCap, IndianRupee, Receipt,
  ListChecks, Layers
} from "lucide-react";
import { cn } from "@/lib/utils.ts";

type NavItem = {
  label: string;
  icon: React.ReactNode;
  path?: string;
};

const studentNav: NavItem[] = [
  { label: "Dashboard", icon: <LayoutDashboard size={16} />, path: "/students/dashboard" },
  { label: "All Students", icon: <Users size={16} />, path: "/students" },
  { label: "New Admission", icon: <UserPlus size={16} />, path: "/students/new-admission" },
  { label: "Quick Admission", icon: <Zap size={16} />, path: "/students/quick-admission" },
  { label: "Admission Approval", icon: <ClipboardCheck size={16} />, path: "/students/admission-approval" },
  { label: "Old Student Entry", icon: <BookOpen size={16} />, path: "/students/old-entry" },
  { label: "Promotion", icon: <Award size={16} />, path: "/students/promotion" },
  { label: "Transfer", icon: <ArrowRightLeft size={16} />, path: "/students/transfer" },
  { label: "Certificates", icon: <FileText size={16} />, path: "/students/certificates" },
  { label: "Communication", icon: <MessageSquare size={16} />, path: "/students/communication" },
  { label: "Duplicates", icon: <Copy size={16} />, path: "/students/duplicates" },
  { label: "Age Settings", icon: <Settings size={16} />, path: "/students/age-settings" },
  { label: "Print List", icon: <Printer size={16} />, path: "/students/print" },
  { label: "Reports", icon: <BarChart2 size={16} />, path: "/students/reports" },
  { label: "ID Card", icon: <CreditCard size={16} />, path: "/students/id-card" },
  { label: "Saved Filters", icon: <Bookmark size={16} />, path: "/students/saved-filters" },
  { label: "Recycle Bin", icon: <Trash2 size={16} />, path: "/students/recycle-bin" },
];

const feeNav: NavItem[] = [
  { label: "Fee Dashboard", icon: <LayoutDashboard size={16} />, path: "/fees/dashboard" },
  { label: "Collect Fee", icon: <IndianRupee size={16} />, path: "/fees/collect" },
  { label: "Fee Payments", icon: <ListChecks size={16} />, path: "/fees/payments" },
  { label: "Fee Structure", icon: <Layers size={16} />, path: "/fees/structure" },
  { label: "Fee Receipt", icon: <Receipt size={16} />, path: "/fees/receipt" },
];

function NavLink({ item }: { item: NavItem }) {
  const location = useLocation();
  const navigate = useNavigate();
  const isActive = item.path ? location.pathname === item.path : false;

  if (!item.path) return null;

  return (
    <button
      onClick={() => navigate(item.path!)}
      className={cn(
        "flex items-center gap-3 w-full px-4 py-2 text-sm rounded-md transition-colors cursor-pointer text-left",
        isActive
          ? "bg-accent text-primary font-medium"
          : "text-sidebar-foreground hover:bg-accent hover:text-foreground"
      )}
    >
      <span className={cn(isActive ? "text-primary" : "text-muted-foreground")}>
        {item.icon}
      </span>
      {item.label}
    </button>
  );
}

function SectionGroup({
  label, icon, items, expanded, onToggle,
}: {
  label: string;
  icon: React.ReactNode;
  items: NavItem[];
  expanded: boolean;
  onToggle: () => void;
}) {
  return (
    <>
      <button
        onClick={onToggle}
        className="flex items-center justify-between w-full px-3 py-2 text-xs font-semibold uppercase tracking-widest text-primary rounded-md hover:bg-accent cursor-pointer mt-1"
      >
        <div className="flex items-center gap-2">{icon}{label}</div>
        {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
      </button>
      {expanded && items.map((item) => <NavLink key={item.label} item={item} />)}
    </>
  );
}

export default function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [studentsExpanded, setStudentsExpanded] = useState(true);
  const [feesExpanded, setFeesExpanded] = useState(true);

  const sidebarContent = (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-3 px-4 py-4 border-b border-sidebar-border">
        <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center shrink-0">
          <GraduationCap size={20} className="text-primary-foreground" />
        </div>
        <div>
          <div className="font-bold text-sm text-foreground leading-tight">RMS Academy</div>
          <div className="text-[10px] text-muted-foreground">ERP System</div>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto py-2 px-2 space-y-0.5">
        <SectionGroup
          label="Students"
          icon={<Users size={14} />}
          items={studentNav}
          expanded={studentsExpanded}
          onToggle={() => setStudentsExpanded((v) => !v)}
        />
        <SectionGroup
          label="Fees"
          icon={<IndianRupee size={14} />}
          items={feeNav}
          expanded={feesExpanded}
          onToggle={() => setFeesExpanded((v) => !v)}
        />
      </nav>

      <div className="border-t border-sidebar-border p-2 space-y-0.5">
        <button className="flex items-center gap-3 w-full px-4 py-2 text-sm text-sidebar-foreground hover:bg-accent rounded-md cursor-pointer">
          <BellRing size={16} className="text-muted-foreground" />
          Notifications
        </button>
        <button className="flex items-center gap-3 w-full px-4 py-2 text-sm text-destructive hover:bg-accent rounded-md cursor-pointer">
          <LogOut size={16} />
          Logout
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <aside className="hidden md:flex flex-col w-60 bg-sidebar border-r border-sidebar-border shrink-0">
        {sidebarContent}
      </aside>

      {sidebarOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={() => setSidebarOpen(false)} />
          <aside className="absolute left-0 top-0 bottom-0 w-64 bg-sidebar border-r border-sidebar-border z-10">
            <button className="absolute top-3 right-3 text-muted-foreground hover:text-foreground cursor-pointer" onClick={() => setSidebarOpen(false)}>
              <X size={18} />
            </button>
            {sidebarContent}
          </aside>
        </div>
      )}

      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <header className="md:hidden flex items-center justify-between px-4 py-3 border-b border-border bg-card shrink-0">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(true)} className="text-muted-foreground cursor-pointer">
              <Menu size={20} />
            </button>
            <span className="font-bold text-sm text-foreground">RMS Academy</span>
          </div>
          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-xs font-bold text-primary-foreground">A</div>
        </header>

        <header className="hidden md:flex items-center justify-end px-6 py-3 border-b border-border bg-card shrink-0">
          <div className="flex items-center gap-3">
            <button className="relative text-muted-foreground hover:text-foreground cursor-pointer">
              <BellRing size={18} />
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-destructive rounded-full" />
            </button>
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-xs font-bold text-primary-foreground">A</div>
          </div>
        </header>

        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
