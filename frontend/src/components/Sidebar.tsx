import { useState, useEffect, useCallback } from "react";

import axios from "axios";

import { NavLink, useLocation } from "react-router-dom";

import { getFullUrl } from "../utils/url";



import {

LayoutDashboard,

Users,

UserPlus,

UserCog,

School,

BookOpen,

ClipboardCheck,

FileText,

IndianRupee,

Bus,

Library,

BarChart3,

Settings,

Building2,

CreditCard,

Calendar,

Layers,

IdCard,

FileClockIcon,

ChevronRight,

ChevronDown,

Bell,

BookOpenCheck,

PieChart,

UserCheck,

GraduationCap,

CalendarClock,

Grid3X3,

Star,

FolderOpen,

MessageSquare,

Clock,

Wallet,

ClipboardEdit,

PenTool,

Database,

Palette,

Brush,

X,

Award,

Package,

BedDouble,

Send,

MapPin,

LogOut,

ChevronLeft,

DoorOpen,

CalendarDays,

HelpCircle,

FileArchive,

ShieldCheck,

Activity,

Ticket,

} from "lucide-react";



//////////////////////////////////////////////////

// 🎯 MENU TYPES

//////////////////////////////////////////////////

type MenuItem = {

name: string;

icon: any;

path?: string;

badge?: number;

children?: { name: string; icon: any; path: string }[];

};



type SectionGroup = {

section: string;

items: MenuItem[];

};



//////////////////////////////////////////////////

// 🎯 TENANT MENU

//////////////////////////////////////////////////

const tenantMenu: SectionGroup[] = [

{

section: "",

items: [

{ name: "Dashboard", icon: <LayoutDashboard size={20} />, path: "/dashboard" },

],

},

{

section: "MASTER DATA",

items: [

{

name: "Masters",

icon: <Database size={20} />,

children: [

{ name: "All Masters", icon: <Database size={16} />, path: "/masters" },

{ name: "Organization", icon: <Building2 size={16} />, path: "/masters/organization" },

{ name: "Academic", icon: <GraduationCap size={16} />, path: "/masters/academic" },

{ name: "Student", icon: <Users size={16} />, path: "/masters/student" },

{ name: "Staff", icon: <UserCog size={16} />, path: "/masters/staff" },

{ name: "Fee", icon: <IndianRupee size={16} />, path: "/masters/fee" },

{ name: "Examination", icon: <FileText size={16} />, path: "/masters/examination" },

{ name: "Attendance", icon: <ClipboardCheck size={16} />, path: "/masters/attendance" },

{ name: "Library", icon: <Library size={16} />, path: "/masters/library" },

{ name: "Hostel", icon: <BedDouble size={16} />, path: "/masters/hostel" },

{ name: "Transport", icon: <Bus size={16} />, path: "/masters/transport" },

{ name: "Inventory", icon: <Package size={16} />, path: "/masters/inventory" },

{ name: "HR & Payroll", icon: <Wallet size={16} />, path: "/masters/hr" },

{ name: "Communication", icon: <MessageSquare size={16} />, path: "/masters/communication" },

{ name: "Certificate", icon: <Award size={16} />, path: "/masters/certificate" },

{ name: "Security", icon: <ShieldCheck size={16} />, path: "/masters/security" },

{ name: "Document", icon: <FileArchive size={16} />, path: "/masters/document" },

{ name: "Event", icon: <CalendarDays size={16} />, path: "/masters/event" },

{ name: "Visitor", icon: <DoorOpen size={16} />, path: "/masters/visitor" },

{ name: "System", icon: <Settings size={16} />, path: "/masters/system" },

],

},

{

name: "Academic Setup",

icon: <School size={20} />,

children: [

{ name: "Academic Year", icon: <Calendar size={16} />, path: "/academic-years" },

{ name: "Classes", icon: <School size={16} />, path: "/classes" },

{ name: "Sections", icon: <Layers size={16} />, path: "/sections" },

{ name: "Subjects", icon: <BookOpen size={16} />, path: "/subjects" },

{ name: "Signature Master", icon: <PenTool size={16} />, path: "/signature-master" },

{ name: "Rooms", icon: <School size={16} />, path: "/rooms" },

],

},

],

},

{

section: "ACADEMICS",

items: [

{

name: "Students",

icon: <Users size={20} />,

children: [

{ name: "Dashboard", icon: <LayoutDashboard size={16} />, path: "/student-dashboard" },

{ name: "All Students", icon: <Users size={16} />, path: "/students" },

{ name: "New Admission", icon: <UserCheck size={16} />, path: "/students/new-admission" },

{ name: "Old Student Entry", icon: <FileText size={16} />, path: "/students/old-entry" },

{ name: "Promotion", icon: <GraduationCap size={16} />, path: "/students/promotion" },

{ name: "Age Settings", icon: <Calendar size={16} />, path: "/students/age-settings" },

{ name: "Print List", icon: <FileText size={16} />, path: "/students/print" },

{ name: "Reports", icon: <BarChart3 size={16} />, path: "/students/reports" },

{ name: "ID Card", icon: <IdCard size={16} />, path: "/students/id-card" },

{ name: "Recycle Bin", icon: <FolderOpen size={16} />, path: "/students/recycle-bin" },

],

},

{

name: "Teachers",

icon: <UserCog size={20} />,

children: [

{ name: "Dashboard", icon: <LayoutDashboard size={16} />, path: "/teacher-dashboard" },

{ name: "All Teachers", icon: <UserCog size={16} />, path: "/teachers" },

{ name: "Assign Subject", icon: <BookOpen size={16} />, path: "/assign-subject" },

{ name: "Timetable", icon: <CalendarClock size={16} />, path: "/teacher-timetable" },

{ name: "Attendance", icon: <ClipboardCheck size={16} />, path: "/teacher-attendance" },

{ name: "Leave", icon: <Clock size={16} />, path: "/teacher-leave" },

{ name: "Salary", icon: <Wallet size={16} />, path: "/teacher-salary" },

{ name: "Performance", icon: <Star size={16} />, path: "/teacher-performance" },

{ name: "Documents", icon: <FolderOpen size={16} />, path: "/teacher-documents" },

{ name: "Reports", icon: <BarChart3 size={16} />, path: "/teacher-reports" },

{ name: "ID Card", icon: <IdCard size={16} />, path: "/teacher-id-card" },

],

},

{

name: "Attendance",

icon: <ClipboardCheck size={20} />,

children: [

{ name: "Dashboard", path: "/attendance-dashboard", icon: <ClipboardEdit size={16} /> },

{ name: "Mark Attendance", path: "/attendance", icon: <ClipboardCheck size={16} /> },

{ name: "Reports", path: "/attendance-report", icon: <BarChart3 size={16} /> },

],

},

{

name: "Exams",

icon: <FileText size={20} />,

children: [

{ name: "Dashboard", icon: <LayoutDashboard size={16} />, path: "/exam-dashboard" },

{ name: "All Exams", icon: <FileText size={16} />, path: "/exams" },

{ name: "Grade Settings", icon: <ClipboardCheck size={16} />, path: "/grade-settings" },

{ name: "Reports", icon: <BarChart3 size={16} />, path: "/exam-reports" },

{ name: "Seating Plan", icon: <Grid3X3 size={16} />, path: "/exam-seating-plan" },

{ name: "Admit Card", icon: <CreditCard size={16} />, path: "/exam-admit-card" },

],

},

{ name: "Time Table", icon: <FileClockIcon size={20} />, path: "/timeTable" },

],

},

{

section: "FINANCE",

items: [

{

name: "Fees",

icon: <IndianRupee size={20} />,

children: [

{ name: "Dashboard", icon: <PieChart size={16} />, path: "/fees/dashboard" },

{ name: "Collection", icon: <IndianRupee size={16} />, path: "/fees/collection" },

{ name: "Fee Heads", icon: <BookOpen size={16} />, path: "/fees/heads" },

{ name: "Fee Structure", icon: <Layers size={16} />, path: "/fees/structures" },

{ name: "Assign Structure", icon: <UserCheck size={16} />, path: "/fees/assign" },

{ name: "Discounts", icon: <CreditCard size={16} />, path: "/fees/discounts" },

{ name: "Fine Rules", icon: <FileText size={16} />, path: "/fees/fine-rules" },

{ name: "Reports", icon: <BarChart3 size={16} />, path: "/fees/reports" },

{ name: "Receipts", icon: <FileText size={16} />, path: "/fees/receipts" },

{ name: "Student Ledger", icon: <BookOpenCheck size={16} />, path: "/fees/ledger" },

{ name: "Reminders", icon: <Bell size={16} />, path: "/fees/reminders" },

{ name: "Settings", icon: <Settings size={16} />, path: "/fees/settings" },

],

},

{ name: "Payment Gateway", icon: <CreditCard size={20} />, path: "/payment-gateway" },

],

},

{

section: "OPERATIONS",

items: [

{ name: "Transport", icon: <Bus size={20} />, path: "/transport" },

{ name: "Library", icon: <Library size={20} />, path: "/library" },

{

name: "Hostel",

icon: <BedDouble size={20} />,

children: [

{ name: "Room Allocation", icon: <BedDouble size={16} />, path: "/hostel/rooms" },

{ name: "Hostel Fees", icon: <IndianRupee size={16} />, path: "/hostel/fees" },

{ name: "Mess Management", icon: <Package size={16} />, path: "/hostel/mess" },

],

},

{

name: "Inventory",

icon: <Package size={20} />,

children: [

{ name: "Asset List", icon: <Package size={16} />, path: "/inventory/assets" },

{ name: "Issue Assets", icon: <Send size={16} />, path: "/inventory/issue" },

{ name: "Stock Management", icon: <Database size={16} />, path: "/inventory/stock" },

],

},

{

name: "Gate Pass",

icon: <DoorOpen size={20} />,

children: [

{ name: "Visitor Log", icon: <Users size={16} />, path: "/gate-pass" },

{ name: "Pending Approvals", icon: <Clock size={16} />, path: "/gate-pass/pending" },

],

},

],

},

{

section: "HR & STAFF",

items: [

{

name: "HR",

icon: <UserCog size={20} />,

children: [

{ name: "Staff List", icon: <Users size={16} />, path: "/hr/staff" },

{ name: "Payroll", icon: <Wallet size={16} />, path: "/hr/payroll" },

{ name: "Leave Management", icon: <Clock size={16} />, path: "/hr/leave" },

{ name: "Staff Attendance", icon: <ClipboardCheck size={16} />, path: "/hr/attendance" },

],

},

],

},

{

section: "COMMUNICATION",

items: [

{

name: "Communication",

icon: <MessageSquare size={20} />,

children: [

{ name: "Notice Board", icon: <FileText size={16} />, path: "/communication/notices" },

{ name: "Send SMS", icon: <Send size={16} />, path: "/communication/sms" },

{ name: "WhatsApp", icon: <MessageSquare size={16} />, path: "/communication/whatsapp" },

{ name: "Circular", icon: <FileText size={16} />, path: "/communication/circular" },

],

},

{ name: "Notifications", icon: <Bell size={20} />, path: "/notifications" },

{

name: "Events",

icon: <CalendarDays size={20} />,

children: [

{ name: "All Events", icon: <CalendarDays size={16} />, path: "/events" },

{ name: "Calendar", icon: <Calendar size={16} />, path: "/academic-calendar" },

],

},

],

},

{

section: "CERTIFICATES & DOCS",

items: [

{

name: "Certificates",

icon: <Award size={20} />,

children: [

{ name: "Transfer Certificate", icon: <FileText size={16} />, path: "/certificates/tc" },

{ name: "Character Cert", icon: <Award size={16} />, path: "/certificates/character" },

{ name: "Migration Cert", icon: <FileText size={16} />, path: "/certificates/migration" },

],

},

{ name: "File Manager", icon: <FileArchive size={20} />, path: "/file-manager" },

{ name: "ID Cards", icon: <IdCard size={20} />, path: "/qr-barcode" },

],

},

{

section: "TOOLS & ENGINES",

items: [

{ name: "Workflow", icon: <Activity size={20} />, path: "/workflow" },

{ name: "Form Builder", icon: <ClipboardEdit size={20} />, path: "/form-builder" },

{ name: "Report Builder", icon: <BarChart3 size={20} />, path: "/report-builder" },

{ name: "Import / Export", icon: <FolderOpen size={20} />, path: "/import-export" },

{ name: "Scheduler", icon: <CalendarClock size={20} />, path: "/scheduler" },

],

},

{

section: "ANALYTICS",

items: [

{ name: "Reports", icon: <BarChart3 size={20} />, path: "/reports" },

{ name: "Audit Log", icon: <Activity size={20} />, path: "/audit" },

],

},

{

section: "DESIGN",

items: [

{ name: "Template Designer", icon: <Brush size={20} />, path: "/yn-udp" },

{ name: "Dashboard Builder", icon: <LayoutDashboard size={20} />, path: "/dashboard-builder" },

],

},

{

section: "SYSTEM",

items: [

{

name: "Settings",

icon: <Settings size={20} />,

children: [

{ name: "General", path: "/settings", icon: <Settings size={16} /> },

{ name: "Subscription", path: "/settings/subscription", icon: <CreditCard size={16} /> },

{ name: "User Management", path: "/settings/users", icon: <UserPlus size={16} /> },

{ name: "Roles & Permissions", path: "/settings/roles", icon: <ShieldCheck size={16} /> },

{ name: "Theme", path: "/settings/theme", icon: <Palette size={16} /> },

{ name: "Languages", path: "/languages", icon: <MapPin size={16} /> },

{ name: "Data Backup", path: "/backup", icon: <Database size={16} /> },

{ name: "Audit Log", path: "/audit", icon: <Activity size={16} /> },

],

},

{ name: "Help Desk", icon: <HelpCircle size={20} />, path: "/helpdesk" },

],

},

];



const superAdminMenu: SectionGroup[] = [

{

section: "",

items: [

{ name: "Dashboard", icon: <LayoutDashboard size={20} />, path: "/dashboard" },

],

},

{

section: "SaaS Control",

items: [

{ name: "Tenants", icon: <Building2 size={20} />, path: "/tenants" },

{ name: "Subscriptions", icon: <CreditCard size={20} />, path: "/subscriptions" },

],

},

{

section: "Analytics",

items: [

{ name: "Reports", icon: <BarChart3 size={20} />, path: "/reports" },

],

},

{

section: "System",

items: [

{ name: "Settings", icon: <Settings size={20} />, path: "/settings" },

],

},

];



type SidebarProps = {

tenant?: any;

sidebarOpen?: boolean;

onClose?: () => void;

};



export default function Sidebar({ tenant, sidebarOpen = false, onClose }: SidebarProps) {

const user = JSON.parse(localStorage.getItem("user") || "{}");

const localTenant = JSON.parse(localStorage.getItem("tenant") || "{}");

const [devProfile, setDevProfile] = useState<any>(null);



const [activeSubMenu, setActiveSubMenu] = useState<MenuItem | null>(null);



const isSuperAdmin = user?.role === "SUPER_ADMIN";

const safeTenant = tenant || localTenant || {};



const sidebarTitle = isSuperAdmin ? "Super Admin" : safeTenant?.name || "School Name";

const sidebarLogo = isSuperAdmin ? "/super-admin-logo.png" : getFullUrl(safeTenant?.logoUrl);

const menu = isSuperAdmin ? superAdminMenu : tenantMenu;



useEffect(() => {

if (isSuperAdmin) return;

const cached = localStorage.getItem("devProfile");

if (cached) {

try { setDevProfile(JSON.parse(cached)); } catch {}

}

axios.get("/api/developer-profile").then((res) => {

const data = res.data?.data;

if (data) {

setDevProfile(data);

localStorage.setItem("devProfile", JSON.stringify(data));

}

}).catch(() => {});

}, [isSuperAdmin]);



useEffect(() => {

if (!sidebarOpen) {

setActiveSubMenu(null);

}

}, [sidebarOpen]);



const handleMobileNavClick = useCallback(() => {

setActiveSubMenu(null);

if (onClose) onClose();

}, [onClose]);



// Reset sub-menu panel when sidebar closes

useEffect(() => {

if (!sidebarOpen) {

setActiveSubMenu(null);

}

}, [sidebarOpen]);



const handleLogout = () => {

localStorage.removeItem("token");

localStorage.removeItem("user");

localStorage.removeItem("tenant");

window.location.href = "/";

};



return (

<>

{/* ════════════════════════════════════════════════════════════════ */}

{/* DESKTOP SIDEBAR (Unchanged) */}

{/* ════════════════════════════════════════════════════════════════ */}

<aside

className="sidebar-desktop hidden md:flex fixed left-0 top-0 h-screen z-40 flex-col print:hidden w-[260px]"

style={{

background: "linear-gradient(180deg, #1e2a4a 0%, #152038 50%, #0f1729 100%)",

}}

>

<div className="relative flex-shrink-0 border-b border-white/10">

{getFullUrl(safeTenant?.backgroundUrl) && (

<div

className="absolute inset-0 opacity-20"

style={{

backgroundImage: `url(${getFullUrl(safeTenant?.backgroundUrl)})`,

backgroundSize: "cover",

backgroundPosition: "center",

}}

/>

)}

<div className="relative z-10 flex items-center gap-3 p-4">

{sidebarLogo ? (

<img

src={sidebarLogo}

alt="Logo"

className="w-11 h-11 object-contain rounded-lg flex-shrink-0 border-2 border-amber-400/40 shadow-lg shadow-amber-900/20"

crossOrigin="anonymous"

onError={(e: any) => { e.target.style.display = "none"; }}

/>

) : (

<div className="w-11 h-11 rounded-xl bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center text-white font-bold text-lg border-2 border-amber-400/50 shadow-lg shadow-amber-900/20 flex-shrink-0">

{isSuperAdmin ? "S" : safeTenant?.name?.charAt(0) || "T"}

</div>

)}

<div className="min-w-0 flex-1">

<h1 className="text-sm font-bold text-white leading-tight truncate">

{safeTenant?.name || sidebarTitle}

</h1>

<p className="text-[10px] text-amber-400/80 font-medium mt-0.5 truncate">

{isSuperAdmin ? "System Control" : "Institution ERP"}

</p>

</div>

</div>

</div>



<div className="flex-1 overflow-y-auto px-2 py-3 sidebar-scroll">

<style>{`

.sidebar-scroll::-webkit-scrollbar { width: 4px; }

.sidebar-scroll::-webkit-scrollbar-track { background: transparent; }

.sidebar-scroll::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 4px; }

.sidebar-scroll::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.2); }

`}</style>



{menu.map((group, gi) => (

<div key={gi} className="mb-1">

{group.section && (

<p className="text-[10px] text-slate-500 mt-4 mb-1.5 px-3 uppercase tracking-[1.2px] font-bold select-none">

{group.section}

</p>

)}

{group.items.map((item, i) =>

item.children ? (

<ParentNavItem key={i} item={item} collapsed={false} isMobile={false} />

) : (

<NavItem key={i} to={item.path!} icon={item.icon} label={item.name} badge={item.badge} collapsed={false} />

)

)}

</div>

))}

</div>

</aside>



{/* ════════════════════════════════════════════════════════════════ */}

{/* MOBILE SIDEBAR — Premium Modern Glassmorphism */}

{/* ════════════════════════════════════════════════════════════════ */}
