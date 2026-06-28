import { useNavigate } from "react-router-dom";
import {
  School, Calendar, IndianRupee, Bell, Users, Shield,
  Database, Palette, Plug, CreditCard, ArrowRight,
  Settings, Globe, Lock, Mail, Smartphone, Key,
  HardDrive, RefreshCw, Webhook, Receipt,
} from "lucide-react";

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// TYPES
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

interface SettingsCategory {
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  route: string;
  badge?: string;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// COMPONENT
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export default function SettingsDashboard() {
  const navigate = useNavigate();

  const settingsCategories: SettingsCategory[] = [
    {
      title: "General Settings",
      description: "School information, logo, contact details, and branding colors",
      icon: <School size={24} />,
      color: "text-blue-600",
      bgColor: "bg-blue-50 dark:bg-blue-950",
      route: "/settings/general",
    },
    {
      title: "Academic Settings",
      description: "Academic year, terms, grading scales, and promotion rules",
      icon: <Calendar size={24} />,
      color: "text-purple-600",
      bgColor: "bg-purple-50 dark:bg-purple-950",
      route: "/academic-years",
    },
    {
      title: "Fee Settings",
      description: "Payment modes, receipt format, fine rules, and reminders",
      icon: <IndianRupee size={24} />,
      color: "text-emerald-600",
      bgColor: "bg-emerald-50 dark:bg-emerald-950",
      route: "/fees/settings",
    },
    {
      title: "Notification Settings",
      description: "SMS gateway, email SMTP, WhatsApp API, push notifications",
      icon: <Bell size={24} />,
      color: "text-orange-600",
      bgColor: "bg-orange-50 dark:bg-orange-950",
      route: "/settings/notifications",
    },
    {
      title: "User Management",
      description: "Manage admin users, roles, and access permissions",
      icon: <Users size={24} />,
      color: "text-teal-600",
      bgColor: "bg-teal-50 dark:bg-teal-950",
      route: "/settings/users",
    },
    {
      title: "Security",
      description: "Password policies, two-factor authentication, session settings",
      icon: <Shield size={24} />,
      color: "text-red-600",
      bgColor: "bg-red-50 dark:bg-red-950",
      route: "/settings/security",
      badge: "Important",
    },
    {
      title: "Backup & Recovery",
      description: "Automated backups, manual backup, restore data, scheduling",
      icon: <Database size={24} />,
      color: "text-amber-600",
      bgColor: "bg-amber-50 dark:bg-amber-950",
      route: "/backup",
    },
    {
      title: "Theme & Appearance",
      description: "Colors, dark mode, fonts, sidebar style, and layout preferences",
      icon: <Palette size={24} />,
      color: "text-pink-600",
      bgColor: "bg-pink-50 dark:bg-pink-950",
      route: "/settings/theme",
    },
    {
      title: "Integrations",
      description: "Payment gateway (Razorpay), SMS API, WhatsApp Business, email",
      icon: <Plug size={24} />,
      color: "text-indigo-600",
      bgColor: "bg-indigo-50 dark:bg-indigo-950",
      route: "/settings/integrations",
    },
    {
      title: "Subscription & Billing",
      description: "Current plan, usage, invoices, upgrade, and payment history",
      icon: <CreditCard size={24} />,
      color: "text-cyan-600",
      bgColor: "bg-cyan-50 dark:bg-cyan-950",
      route: "/settings/subscription",
    },
  ];

  // Quick Settings - frequently accessed
  const quickSettings = [
    { icon: <Globe size={16} />, label: "School Profile", route: "/settings/general" },
    { icon: <Lock size={16} />, label: "Change Password", route: "/settings/security" },
    { icon: <Mail size={16} />, label: "Email Config", route: "/settings/notifications" },
    { icon: <Smartphone size={16} />, label: "SMS Gateway", route: "/settings/notifications" },
    { icon: <Key size={16} />, label: "API Keys", route: "/settings/integrations" },
    { icon: <HardDrive size={16} />, label: "Storage", route: "/backup" },
    { icon: <RefreshCw size={16} />, label: "Sync Settings", route: "/settings/integrations" },
    { icon: <Webhook size={16} />, label: "Webhooks", route: "/settings/integrations" },
    { icon: <Receipt size={16} />, label: "Receipt Format", route: "/fees/settings" },
  ];

  return (
    <div className="space-y-6">
      {/* ── Page Header ── */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Settings</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Manage your school ERP configuration and preferences</p>
      </div>

      {/* ── Quick Settings Bar ── */}
      <div className="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-slate-700">
        <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">Quick Access</h3>
        <div className="flex flex-wrap gap-2">
          {quickSettings.map((item, idx) => (
            <button
              key={idx}
              onClick={() => navigate(item.route)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 dark:border-slate-600 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700 hover:border-blue-300 dark:hover:border-blue-700 transition-all"
            >
              <span className="text-gray-400">{item.icon}</span>
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Settings Categories Grid ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-2 gap-4">
        {settingsCategories.map((category, idx) => (
          <div
            key={idx}
            onClick={() => navigate(category.route)}
            className="bg-white dark:bg-slate-800 rounded-xl p-5 shadow-sm border border-gray-100 dark:border-slate-700 hover:shadow-md hover:border-blue-200 dark:hover:border-blue-800 cursor-pointer transition-all group relative"
          >
            {category.badge && (
              <span className="absolute top-3 right-3 px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
                {category.badge}
              </span>
            )}
            <div className="flex items-start gap-4">
              <div className={`w-12 h-12 rounded-xl ${category.bgColor} ${category.color} flex items-center justify-center flex-shrink-0`}>
                {category.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white">{category.title}</h3>
                  <ArrowRight size={16} className="text-gray-300 dark:text-gray-600 group-hover:text-blue-500 group-hover:translate-x-1 transition-all flex-shrink-0" />
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">{category.description}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ── System Information ── */}
      <div className="bg-white dark:bg-slate-800 rounded-xl p-5 shadow-sm border border-gray-100 dark:border-slate-700">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <Settings size={16} className="text-gray-400" />
          System Information
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-3 rounded-lg bg-gray-50 dark:bg-slate-700/50">
            <p className="text-xs text-gray-500 dark:text-gray-400">Version</p>
            <p className="text-sm font-semibold text-gray-900 dark:text-white mt-0.5">v3.2.1</p>
          </div>
          <div className="p-3 rounded-lg bg-gray-50 dark:bg-slate-700/50">
            <p className="text-xs text-gray-500 dark:text-gray-400">Last Updated</p>
            <p className="text-sm font-semibold text-gray-900 dark:text-white mt-0.5">27 Jun 2026</p>
          </div>
          <div className="p-3 rounded-lg bg-gray-50 dark:bg-slate-700/50">
            <p className="text-xs text-gray-500 dark:text-gray-400">Database</p>
            <p className="text-sm font-semibold text-gray-900 dark:text-white mt-0.5">MongoDB Atlas</p>
          </div>
          <div className="p-3 rounded-lg bg-gray-50 dark:bg-slate-700/50">
            <p className="text-xs text-gray-500 dark:text-gray-400">Hosting</p>
            <p className="text-sm font-semibold text-gray-900 dark:text-white mt-0.5">Render.com</p>
          </div>
        </div>
      </div>

      {/* ── Danger Zone ── */}
      <div className="bg-white dark:bg-slate-800 rounded-xl p-5 shadow-sm border border-red-200 dark:border-red-900/50">
        <h3 className="text-sm font-semibold text-red-700 dark:text-red-400 mb-2">Danger Zone</h3>
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
          These actions are irreversible. Please proceed with caution.
        </p>
        <div className="flex flex-wrap gap-3">
          <button className="px-4 py-2 text-sm border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
            Reset All Settings
          </button>
          <button className="px-4 py-2 text-sm border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
            Clear Cache
          </button>
          <button className="px-4 py-2 text-sm border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
            Delete All Data
          </button>
        </div>
      </div>
    </div>
  );
}
