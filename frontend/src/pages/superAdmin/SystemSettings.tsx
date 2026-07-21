import { useState, useEffect } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import {
  Settings, Mail, MessageSquare, Smartphone, Bell, Globe,
  Cloud, Database, Clock, Shield, Save, TestTube, ToggleLeft, ToggleRight,
  Palette, Server, Key, RefreshCw, CheckCircle, AlertCircle,
} from "lucide-react";
import PageHeader from "../../components/enterprise/PageHeader";
import LoadingSkeleton from "../../components/enterprise/LoadingSkeleton";

// ═══════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════

type CronJob = {
  id: string;
  name: string;
  schedule: string;
  enabled: boolean;
  lastRun: string;
  status: string;
};

// ═══════════════════════════════════════════════════
// TAB DATA
// ═══════════════════════════════════════════════════

const tabs = [
  { id: "application", label: "Application", icon: <Settings className="w-4 h-4" /> },
  { id: "smtp", label: "SMTP / Email", icon: <Mail className="w-4 h-4" /> },
  { id: "sms", label: "SMS Gateway", icon: <Smartphone className="w-4 h-4" /> },
  { id: "whatsapp", label: "WhatsApp", icon: <MessageSquare className="w-4 h-4" /> },
  { id: "firebase", label: "Firebase", icon: <Bell className="w-4 h-4" /> },
  { id: "oauth", label: "OAuth Providers", icon: <Key className="w-4 h-4" /> },
  { id: "storage", label: "Cloud Storage", icon: <Cloud className="w-4 h-4" /> },
  { id: "backup", label: "Backup", icon: <Database className="w-4 h-4" /> },
  { id: "cache", label: "Cache", icon: <Server className="w-4 h-4" /> },
  { id: "cron", label: "Cron Jobs", icon: <Clock className="w-4 h-4" /> },
  { id: "localization", label: "Localization", icon: <Globe className="w-4 h-4" /> },
];

// ═══════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════

export default function SystemSettings() {
  const [activeTab, setActiveTab] = useState("application");
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [cronJobs, setCronJobs] = useState<CronJob[]>([]);

  const fetchSettings = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get("/api/super-admin/system-settings", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSettings(res.data.data);
    } catch (err: any) {
      toast.error("Failed to load settings");
    } finally {
      setLoading(false);
    }
  };

  const fetchCronJobs = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get("/api/super-admin/system-settings/cron-jobs", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setCronJobs(res.data.data);
    } catch {}
  };

  useEffect(() => {
    fetchSettings();
    fetchCronJobs();
  }, []);

  const saveSettings = async (section: string, data: any) => {
    setSaving(true);
    try {
      const token = localStorage.getItem("token");
      await axios.put(`/api/super-admin/system-settings/${section}`, data, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("Settings saved successfully");
      fetchSettings();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const testSmtp = async () => {
    const email = prompt("Enter test email address:");
    if (!email) return;
    try {
      const token = localStorage.getItem("token");
      await axios.post("/api/super-admin/system-settings/smtp/test", { testEmail: email }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success(`Test email sent to ${email}`);
    } catch {
      toast.error("SMTP test failed");
    }
  };

  const toggleCronJob = async (id: string) => {
    try {
      const token = localStorage.getItem("token");
      await axios.patch(`/api/super-admin/system-settings/cron-jobs/${id}/toggle`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setCronJobs((prev) => prev.map((j) => j.id === id ? { ...j, enabled: !j.enabled } : j));
      toast.success("Cron job updated");
    } catch {
      toast.error("Failed to toggle cron job");
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <LoadingSkeleton variant="card" count={4} />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-[1400px] mx-auto">
      <PageHeader
        title="System Settings"
        subtitle="Configure platform-wide settings for all tenants"
        icon={<Settings className="w-5 h-5" />}
        breadcrumbs={[{ label: "Settings", path: "/super-admin/settings" }, { label: "System Settings" }]}
      />

      <div className="flex flex-col lg:flex-row gap-6">
        {/* SIDEBAR TABS */}
        <div className="lg:w-64 flex-shrink-0">
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
            <div className="p-3 space-y-1">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-sm font-medium rounded-lg transition-all ${
                    activeTab === tab.id
                      ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-300"
                      : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
                  }`}
                >
                  {tab.icon}
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* CONTENT AREA */}
        <div className="flex-1 min-w-0">
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
            {activeTab === "application" && <ApplicationSettings settings={settings} onSave={saveSettings} saving={saving} />}
            {activeTab === "smtp" && <SmtpSettings settings={settings} onSave={saveSettings} saving={saving} onTest={testSmtp} />}
            {activeTab === "sms" && <SmsSettings settings={settings} onSave={saveSettings} saving={saving} />}
            {activeTab === "whatsapp" && <WhatsAppSettings settings={settings} onSave={saveSettings} saving={saving} />}
            {activeTab === "firebase" && <FirebaseSettings settings={settings} onSave={saveSettings} saving={saving} />}
            {activeTab === "oauth" && <OAuthSettings settings={settings} onSave={saveSettings} saving={saving} />}
            {activeTab === "storage" && <StorageSettings settings={settings} onSave={saveSettings} saving={saving} />}
            {activeTab === "backup" && <BackupSettings settings={settings} onSave={saveSettings} saving={saving} />}
            {activeTab === "cache" && <CacheSettings settings={settings} onSave={saveSettings} saving={saving} />}
            {activeTab === "cron" && <CronJobSettings jobs={cronJobs} onToggle={toggleCronJob} />}
            {activeTab === "localization" && <LocalizationSettings settings={settings} onSave={saveSettings} saving={saving} />}
          </div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════
// SHARED FORM COMPONENTS
// ═══════════════════════════════════════════════════

function FormField({ label, children, description }: { label: string; children: React.ReactNode; description?: string }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">{label}</label>
      {children}
      {description && <p className="text-xs text-slate-400 dark:text-slate-500">{description}</p>}
    </div>
  );
}

function Input({ value, onChange, type = "text", placeholder, disabled }: any) {
  return (
    <input
      type={type}
      value={value || ""}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      disabled={disabled}
      className="w-full px-3 py-2.5 text-sm border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:opacity-50 transition-colors"
    />
  );
}

function Toggle({ enabled, onChange, label }: { enabled: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button
      onClick={() => onChange(!enabled)}
      className="flex items-center gap-3"
    >
      {enabled ? (
        <ToggleRight className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
      ) : (
        <ToggleLeft className="w-8 h-8 text-slate-400" />
      )}
      <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{label}</span>
    </button>
  );
}

function SaveButton({ onClick, saving, label = "Save Changes" }: { onClick: () => void; saving: boolean; label?: string }) {
  return (
    <button
      onClick={onClick}
      disabled={saving}
      className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
    >
      {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
      {saving ? "Saving..." : label}
    </button>
  );
}

function SectionTitle({ title, description }: { title: string; description?: string }) {
  return (
    <div className="mb-6">
      <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{title}</h3>
      {description && <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{description}</p>}
    </div>
  );
}

// ═══════════════════════════════════════════════════
// APPLICATION SETTINGS
// ═══════════════════════════════════════════════════

function ApplicationSettings({ settings, onSave, saving }: any) {
  const [form, setForm] = useState({
    appName: settings?.appName || "",
    appUrl: settings?.appUrl || "",
    timezone: settings?.timezone || "Asia/Kolkata",
    currency: settings?.currency || "INR",
    language: settings?.language || "en",
  });

  return (
    <div>
      <SectionTitle title="Application Settings" description="Basic platform configuration" />
      <div className="space-y-5">
        <FormField label="Application Name">
          <Input value={form.appName} onChange={(v: string) => setForm({ ...form, appName: v })} placeholder="My ERP Platform" />
        </FormField>
        <FormField label="Application URL">
          <Input value={form.appUrl} onChange={(v: string) => setForm({ ...form, appUrl: v })} placeholder="https://erp.example.com" />
        </FormField>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <FormField label="Timezone">
            <select
              value={form.timezone}
              onChange={(e) => setForm({ ...form, timezone: e.target.value })}
              className="w-full px-3 py-2.5 text-sm border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
            >
              <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
              <option value="UTC">UTC</option>
              <option value="America/New_York">America/New_York (EST)</option>
              <option value="Europe/London">Europe/London (GMT)</option>
              <option value="Asia/Dubai">Asia/Dubai (GST)</option>
            </select>
          </FormField>
          <FormField label="Currency">
            <select
              value={form.currency}
              onChange={(e) => setForm({ ...form, currency: e.target.value })}
              className="w-full px-3 py-2.5 text-sm border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
            >
              <option value="INR">INR (₹)</option>
              <option value="USD">USD ($)</option>
              <option value="EUR">EUR (€)</option>
              <option value="GBP">GBP (£)</option>
              <option value="AED">AED (د.إ)</option>
            </select>
          </FormField>
          <FormField label="Default Language">
            <select
              value={form.language}
              onChange={(e) => setForm({ ...form, language: e.target.value })}
              className="w-full px-3 py-2.5 text-sm border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
            >
              <option value="en">English</option>
              <option value="hi">Hindi</option>
              <option value="ur">Urdu</option>
              <option value="ta">Tamil</option>
              <option value="te">Telugu</option>
            </select>
          </FormField>
        </div>
        <div className="pt-4">
          <SaveButton onClick={() => onSave("application", form)} saving={saving} />
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════
// SMTP SETTINGS
// ═══════════════════════════════════════════════════

function SmtpSettings({ settings, onSave, saving, onTest }: any) {
  const [form, setForm] = useState({
    smtpHost: settings?.smtpHost || "",
    smtpPort: settings?.smtpPort || 587,
    smtpUser: settings?.smtpUser || "",
    smtpPass: settings?.smtpPass || "",
    smtpFrom: settings?.smtpFrom || "",
  });

  return (
    <div>
      <SectionTitle title="SMTP / Email Configuration" description="Configure outgoing email settings" />
      <div className="space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField label="SMTP Host">
            <Input value={form.smtpHost} onChange={(v: string) => setForm({ ...form, smtpHost: v })} placeholder="smtp.gmail.com" />
          </FormField>
          <FormField label="SMTP Port">
            <Input value={form.smtpPort} onChange={(v: string) => setForm({ ...form, smtpPort: parseInt(v) || 587 })} type="number" placeholder="587" />
          </FormField>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField label="Username">
            <Input value={form.smtpUser} onChange={(v: string) => setForm({ ...form, smtpUser: v })} placeholder="your-email@gmail.com" />
          </FormField>
          <FormField label="Password">
            <Input value={form.smtpPass} onChange={(v: string) => setForm({ ...form, smtpPass: v })} type="password" placeholder="App password" />
          </FormField>
        </div>
        <FormField label="From Email" description="Email address shown as sender">
          <Input value={form.smtpFrom} onChange={(v: string) => setForm({ ...form, smtpFrom: v })} placeholder="noreply@yourplatform.com" />
        </FormField>
        <div className="flex items-center gap-3 pt-4">
          <SaveButton onClick={() => onSave("smtp", form)} saving={saving} />
          <button
            onClick={onTest}
            className="flex items-center gap-2 px-4 py-2.5 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300 text-sm font-medium rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            <TestTube className="w-4 h-4" />
            Send Test Email
          </button>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════
// SMS SETTINGS
// ═══════════════════════════════════════════════════

function SmsSettings({ settings, onSave, saving }: any) {
  const [form, setForm] = useState({
    smsProvider: settings?.smsProvider || "none",
    smsApiKey: settings?.smsApiKey || "",
    smsSenderId: settings?.smsSenderId || "",
  });

  return (
    <div>
      <SectionTitle title="SMS Gateway" description="Configure SMS provider for OTP and notifications" />
      <div className="space-y-5">
        <FormField label="Provider">
          <select
            value={form.smsProvider}
            onChange={(e) => setForm({ ...form, smsProvider: e.target.value })}
            className="w-full px-3 py-2.5 text-sm border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
          >
            <option value="none">None (Disabled)</option>
            <option value="twilio">Twilio</option>
            <option value="msg91">MSG91</option>
            <option value="textlocal">TextLocal</option>
            <option value="aws_sns">AWS SNS</option>
          </select>
        </FormField>
        <FormField label="API Key">
          <Input value={form.smsApiKey} onChange={(v: string) => setForm({ ...form, smsApiKey: v })} placeholder="Your API Key" />
        </FormField>
        <FormField label="Sender ID" description="6-character alphanumeric sender ID">
          <Input value={form.smsSenderId} onChange={(v: string) => setForm({ ...form, smsSenderId: v })} placeholder="MYERPS" />
        </FormField>
        <div className="pt-4">
          <SaveButton onClick={() => onSave("sms", form)} saving={saving} />
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════
// WHATSAPP SETTINGS
// ═══════════════════════════════════════════════════

function WhatsAppSettings({ settings, onSave, saving }: any) {
  const [form, setForm] = useState({
    whatsappEnabled: settings?.whatsappEnabled || false,
    whatsappApiKey: settings?.whatsappApiKey || "",
    whatsappPhoneId: settings?.whatsappPhoneId || "",
  });

  return (
    <div>
      <SectionTitle title="WhatsApp Business API" description="Send notifications via WhatsApp" />
      <div className="space-y-5">
        <Toggle enabled={form.whatsappEnabled} onChange={(v) => setForm({ ...form, whatsappEnabled: v })} label="Enable WhatsApp Notifications" />
        <FormField label="API Key / Access Token">
          <Input value={form.whatsappApiKey} onChange={(v: string) => setForm({ ...form, whatsappApiKey: v })} placeholder="WhatsApp Cloud API Token" />
        </FormField>
        <FormField label="Phone Number ID">
          <Input value={form.whatsappPhoneId} onChange={(v: string) => setForm({ ...form, whatsappPhoneId: v })} placeholder="1234567890" />
        </FormField>
        <div className="pt-4">
          <SaveButton onClick={() => onSave("whatsapp", form)} saving={saving} />
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════
// FIREBASE SETTINGS
// ═══════════════════════════════════════════════════

function FirebaseSettings({ settings, onSave, saving }: any) {
  const [form, setForm] = useState({
    firebaseEnabled: settings?.firebaseEnabled || false,
    firebaseProjectId: settings?.firebaseProjectId || "",
    firebaseServerKey: settings?.firebaseServerKey || "",
  });

  return (
    <div>
      <SectionTitle title="Firebase (Push Notifications)" description="Configure Firebase Cloud Messaging" />
      <div className="space-y-5">
        <Toggle enabled={form.firebaseEnabled} onChange={(v) => setForm({ ...form, firebaseEnabled: v })} label="Enable Push Notifications" />
        <FormField label="Project ID">
          <Input value={form.firebaseProjectId} onChange={(v: string) => setForm({ ...form, firebaseProjectId: v })} placeholder="my-project-12345" />
        </FormField>
        <FormField label="Server Key (Legacy)">
          <Input value={form.firebaseServerKey} onChange={(v: string) => setForm({ ...form, firebaseServerKey: v })} type="password" placeholder="AAAA..." />
        </FormField>
        <div className="pt-4">
          <SaveButton onClick={() => onSave("firebase", form)} saving={saving} />
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════
// OAUTH SETTINGS
// ═══════════════════════════════════════════════════

function OAuthSettings({ settings, onSave, saving }: any) {
  const [form, setForm] = useState({
    googleLoginEnabled: settings?.googleLoginEnabled || false,
    googleClientId: settings?.googleClientId || "",
    googleClientSecret: settings?.googleClientSecret || "",
    microsoftLoginEnabled: settings?.microsoftLoginEnabled || false,
    microsoftClientId: settings?.microsoftClientId || "",
    microsoftClientSecret: settings?.microsoftClientSecret || "",
    facebookLoginEnabled: settings?.facebookLoginEnabled || false,
    facebookAppId: settings?.facebookAppId || "",
    facebookAppSecret: settings?.facebookAppSecret || "",
  });

  return (
    <div>
      <SectionTitle title="OAuth Providers" description="Enable social login for users" />
      <div className="space-y-8">
        {/* Google */}
        <div className="p-4 rounded-lg border border-slate-200 dark:border-slate-700 space-y-4">
          <Toggle enabled={form.googleLoginEnabled} onChange={(v) => setForm({ ...form, googleLoginEnabled: v })} label="Google Login" />
          {form.googleLoginEnabled && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <FormField label="Client ID">
                <Input value={form.googleClientId} onChange={(v: string) => setForm({ ...form, googleClientId: v })} placeholder="xxxx.apps.googleusercontent.com" />
              </FormField>
              <FormField label="Client Secret">
                <Input value={form.googleClientSecret} onChange={(v: string) => setForm({ ...form, googleClientSecret: v })} type="password" placeholder="GOCSPX-..." />
              </FormField>
            </div>
          )}
        </div>

        {/* Microsoft */}
        <div className="p-4 rounded-lg border border-slate-200 dark:border-slate-700 space-y-4">
          <Toggle enabled={form.microsoftLoginEnabled} onChange={(v) => setForm({ ...form, microsoftLoginEnabled: v })} label="Microsoft Login" />
          {form.microsoftLoginEnabled && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <FormField label="Client ID">
                <Input value={form.microsoftClientId} onChange={(v: string) => setForm({ ...form, microsoftClientId: v })} placeholder="Application (client) ID" />
              </FormField>
              <FormField label="Client Secret">
                <Input value={form.microsoftClientSecret} onChange={(v: string) => setForm({ ...form, microsoftClientSecret: v })} type="password" placeholder="Client secret value" />
              </FormField>
            </div>
          )}
        </div>

        {/* Facebook */}
        <div className="p-4 rounded-lg border border-slate-200 dark:border-slate-700 space-y-4">
          <Toggle enabled={form.facebookLoginEnabled} onChange={(v) => setForm({ ...form, facebookLoginEnabled: v })} label="Facebook Login" />
          {form.facebookLoginEnabled && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <FormField label="App ID">
                <Input value={form.facebookAppId} onChange={(v: string) => setForm({ ...form, facebookAppId: v })} placeholder="Facebook App ID" />
              </FormField>
              <FormField label="App Secret">
                <Input value={form.facebookAppSecret} onChange={(v: string) => setForm({ ...form, facebookAppSecret: v })} type="password" placeholder="App secret" />
              </FormField>
            </div>
          )}
        </div>

        <SaveButton onClick={() => onSave("oauth", form)} saving={saving} />
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════
// STORAGE SETTINGS
// ═══════════════════════════════════════════════════

function StorageSettings({ settings, onSave, saving }: any) {
  const [form, setForm] = useState({
    storageProvider: settings?.storageProvider || "local",
    s3Bucket: settings?.s3Bucket || "",
    s3Region: settings?.s3Region || "",
    s3AccessKey: settings?.s3AccessKey || "",
    s3SecretKey: settings?.s3SecretKey || "",
  });

  return (
    <div>
      <SectionTitle title="Cloud Storage" description="Configure file storage provider" />
      <div className="space-y-5">
        <FormField label="Storage Provider">
          <select
            value={form.storageProvider}
            onChange={(e) => setForm({ ...form, storageProvider: e.target.value })}
            className="w-full px-3 py-2.5 text-sm border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
          >
            <option value="local">Local Storage</option>
            <option value="cloudinary">Cloudinary</option>
            <option value="s3">AWS S3</option>
            <option value="gcs">Google Cloud Storage</option>
            <option value="azure">Azure Blob Storage</option>
          </select>
        </FormField>
        {form.storageProvider === "s3" && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField label="Bucket Name">
                <Input value={form.s3Bucket} onChange={(v: string) => setForm({ ...form, s3Bucket: v })} placeholder="my-erp-bucket" />
              </FormField>
              <FormField label="Region">
                <Input value={form.s3Region} onChange={(v: string) => setForm({ ...form, s3Region: v })} placeholder="ap-south-1" />
              </FormField>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField label="Access Key ID">
                <Input value={form.s3AccessKey} onChange={(v: string) => setForm({ ...form, s3AccessKey: v })} placeholder="AKIA..." />
              </FormField>
              <FormField label="Secret Access Key">
                <Input value={form.s3SecretKey} onChange={(v: string) => setForm({ ...form, s3SecretKey: v })} type="password" placeholder="Secret key" />
              </FormField>
            </div>
          </>
        )}
        <div className="pt-4">
          <SaveButton onClick={() => onSave("storage", form)} saving={saving} />
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════
// BACKUP SETTINGS
// ═══════════════════════════════════════════════════

function BackupSettings({ settings, onSave, saving }: any) {
  const [form, setForm] = useState({
    backupEnabled: settings?.backupEnabled || false,
    backupSchedule: settings?.backupSchedule || "0 2 * * *",
    backupRetentionDays: settings?.backupRetentionDays || 30,
  });

  return (
    <div>
      <SectionTitle title="Backup Configuration" description="Automated database and file backup settings" />
      <div className="space-y-5">
        <Toggle enabled={form.backupEnabled} onChange={(v) => setForm({ ...form, backupEnabled: v })} label="Enable Automatic Backups" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField label="Backup Schedule (Cron)" description="Default: Daily at 2 AM">
            <Input value={form.backupSchedule} onChange={(v: string) => setForm({ ...form, backupSchedule: v })} placeholder="0 2 * * *" />
          </FormField>
          <FormField label="Retention Period (Days)">
            <Input value={form.backupRetentionDays} onChange={(v: string) => setForm({ ...form, backupRetentionDays: parseInt(v) || 30 })} type="number" placeholder="30" />
          </FormField>
        </div>
        <div className="pt-4">
          <SaveButton onClick={() => onSave("backup", form)} saving={saving} />
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════
// CACHE SETTINGS
// ═══════════════════════════════════════════════════

function CacheSettings({ settings, onSave, saving }: any) {
  const [form, setForm] = useState({
    cacheProvider: settings?.cacheProvider || "memory",
    redisHost: settings?.redisHost || "",
    redisPort: settings?.redisPort || 6379,
    redisPassword: settings?.redisPassword || "",
  });

  return (
    <div>
      <SectionTitle title="Cache Configuration" description="Configure caching for improved performance" />
      <div className="space-y-5">
        <FormField label="Cache Provider">
          <select
            value={form.cacheProvider}
            onChange={(e) => setForm({ ...form, cacheProvider: e.target.value })}
            className="w-full px-3 py-2.5 text-sm border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
          >
            <option value="memory">In-Memory (Default)</option>
            <option value="redis">Redis</option>
          </select>
        </FormField>
        {form.cacheProvider === "redis" && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <FormField label="Redis Host">
              <Input value={form.redisHost} onChange={(v: string) => setForm({ ...form, redisHost: v })} placeholder="localhost" />
            </FormField>
            <FormField label="Redis Port">
              <Input value={form.redisPort} onChange={(v: string) => setForm({ ...form, redisPort: parseInt(v) || 6379 })} type="number" placeholder="6379" />
            </FormField>
            <FormField label="Redis Password">
              <Input value={form.redisPassword} onChange={(v: string) => setForm({ ...form, redisPassword: v })} type="password" placeholder="Optional" />
            </FormField>
          </div>
        )}
        <div className="pt-4">
          <SaveButton onClick={() => onSave("cache", form)} saving={saving} />
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════
// CRON JOB SETTINGS
// ═══════════════════════════════════════════════════

function CronJobSettings({ jobs, onToggle }: { jobs: CronJob[]; onToggle: (id: string) => void }) {
  return (
    <div>
      <SectionTitle title="Cron Jobs" description="Manage scheduled background tasks" />
      <div className="space-y-3">
        {jobs.map((job) => (
          <div
            key={job.id}
            className="flex items-center justify-between p-4 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-indigo-200 dark:hover:border-indigo-800 transition-colors"
          >
            <div className="flex items-center gap-3">
              <button onClick={() => onToggle(job.id)}>
                {job.enabled ? (
                  <ToggleRight className="w-7 h-7 text-indigo-600 dark:text-indigo-400" />
                ) : (
                  <ToggleLeft className="w-7 h-7 text-slate-400" />
                )}
              </button>
              <div>
                <p className="text-sm font-medium text-slate-900 dark:text-white">{job.name}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">{job.schedule}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className={`flex items-center gap-1 text-xs font-medium ${
                job.status === "success" ? "text-emerald-600 dark:text-emerald-400" : "text-slate-400"
              }`}>
                {job.status === "success" ? <CheckCircle className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
                {job.status}
              </span>
              <span className="text-xs text-slate-400 dark:text-slate-500">
                {new Date(job.lastRun).toLocaleDateString()}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════
// LOCALIZATION SETTINGS
// ═══════════════════════════════════════════════════

function LocalizationSettings({ settings, onSave, saving }: any) {
  const [form, setForm] = useState({
    language: settings?.language || "en",
    rtlEnabled: settings?.rtlEnabled || false,
    availableLanguages: (() => {
      try { return JSON.parse(settings?.availableLanguages || "[]"); } catch { return ["en"]; }
    })(),
  });

  const allLanguages = [
    { code: "en", name: "English" },
    { code: "hi", name: "Hindi" },
    { code: "ur", name: "Urdu" },
    { code: "ta", name: "Tamil" },
    { code: "te", name: "Telugu" },
    { code: "bn", name: "Bengali" },
    { code: "mr", name: "Marathi" },
    { code: "gu", name: "Gujarati" },
    { code: "kn", name: "Kannada" },
    { code: "ml", name: "Malayalam" },
    { code: "ar", name: "Arabic" },
    { code: "fr", name: "French" },
  ];

  const toggleLanguage = (code: string) => {
    setForm((prev: any) => ({
      ...prev,
      availableLanguages: prev.availableLanguages.includes(code)
        ? prev.availableLanguages.filter((c: string) => c !== code)
        : [...prev.availableLanguages, code],
    }));
  };

  return (
    <div>
      <SectionTitle title="Localization" description="Language and internationalization settings" />
      <div className="space-y-5">
        <Toggle enabled={form.rtlEnabled} onChange={(v) => setForm({ ...form, rtlEnabled: v })} label="Enable RTL (Right-to-Left) Layout" />

        <FormField label="Available Languages" description="Select which languages are available to tenants">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 mt-2">
            {allLanguages.map((lang) => (
              <label
                key={lang.code}
                className={`flex items-center gap-2 p-2.5 rounded-lg border cursor-pointer transition-colors ${
                  form.availableLanguages.includes(lang.code)
                    ? "border-indigo-300 bg-indigo-50 dark:border-indigo-700 dark:bg-indigo-900/20"
                    : "border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600"
                }`}
              >
                <input
                  type="checkbox"
                  checked={form.availableLanguages.includes(lang.code)}
                  onChange={() => toggleLanguage(lang.code)}
                  className="w-4 h-4 text-indigo-600 rounded border-slate-300 dark:border-slate-600"
                />
                <span className="text-sm text-slate-700 dark:text-slate-300">{lang.name}</span>
              </label>
            ))}
          </div>
        </FormField>

        <div className="pt-4">
          <SaveButton onClick={() => onSave("application", { ...form, availableLanguages: form.availableLanguages })} saving={saving} />
        </div>
      </div>
    </div>
  );
}
