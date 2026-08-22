# 🏫 College ERP — Multi-Tenant SaaS Platform

> **Production Deployment: RMS Academy, Bareilly, UP** **1,790+ Real Students** | **50+ Teachers** | **2 Active Tenants** Full-Stack Enterprise Resource Planning — MongoDB + Express + React + Node.js (TypeScript)



![License](https://img.shields.io/badge/License-Private-red)



![Stack](https://img.shields.io/badge/Stack-MERN-blue)



![Students](https://img.shields.io/badge/Students-1790+-green)



![Tenants](https://img.shields.io/badge/Multi--Tenant-SaaS-purple)

---

## 📊 Platform Statistics (Live)

| Metric | Value |
| --- | --- |
| Total Students (Real Data) | **1,790+** |
| Total Teachers | **50+** |
| Active Tenants | **2** (RMS Academy, Ashvi Coaching) |
| Backend Modules | **55** |
| Frontend Pages | **49** |
| API Routes | **200+** |
| Super Admin Sub-Modules | **16** |
| Prisma Models | **110+** |

---

## 📁 Project Structure

```
college-erp-clean/
├── backend/                    # Express + Prisma + MongoDB (TypeScript)
│   ├── src/
│   │   ├── app.ts             # Express app + route registration
│   │   ├── server.ts          # Entry point
│   │   ├── config/            # Cloudinary, Logger, CORS, Queue, Swagger
│   │   ├── middleware/        # Auth, Tenant, Subscription, Rate-Limit, Error
│   │   ├── modules/           # 55 feature modules (see below)
│   │   ├── routes/            # Public site routes
│   │   ├── types/             # TypeScript interfaces (express.d.ts)
│   │   └── utils/             # Prisma client, Cache, Audit helpers
│   ├── prisma/
│   │   ├── schema.prisma      # ★ Single source of truth — all models
│   │   ├── masters/           # 18 reference schema files (documentation)
│   │   ├── migrations/        # Prisma migrate history
│   │   ├── seed.ts            # Base seed
│   │   ├── seed-superadmin.ts # Super admin bootstrap
│   │   ├── seed-classes.ts    # Class/section seed
│   │   └── seed-classes-2026-27.ts  # Current session seed
│   └── scripts/               # Utility scripts (debug, cleanup, counters)
│
├── frontend/                   # React + Vite + TypeScript + Tailwind CSS
│   ├── src/
│   │   ├── App.tsx            # Router (150+ routes)
│   │   ├── pages/             # 49 page modules (see below)
│   │   ├── components/        # Shared: Sidebar, Navbar, DataTable, Charts
│   │   ├── context/           # AuthContext (JWT), ThemeContext
│   │   ├── hooks/             # usePrint, useDebounce, custom hooks
│   │   ├── services/          # API service helpers
│   │   └── utils/             # URL helper, print utilities
│   └── dist/                  # Production build
│
├── student-portal/             # Separate React app — Student self-service
│   └── src/                   # Auth, Dashboard, Results, Attendance, Fees
│
├── shared/                     # Shared TypeScript types & constants
│   └── src/
│       ├── types/             # student, teacher, fee, exam, common types
│       └── constants/         # roles, permissions
│
├── yn-udp/                     # Template Engine (Print/PDF system)
│   ├── client/                # Template editor UI (React)
│   └── server/                # Template rendering server (Express)
│
├── convex/                     # Real-time backend (Convex)
├── scripts/                    # deploy.sh, seed.sh
├── security/                   # Security documentation
├── docs/                       # API docs, Testing checklist, Deployment guides
├── docker-compose.yml          # MongoDB 7 + Redis 7 + Mongo Express
├── package.json                # Monorepo workspace scripts
└── tsconfig.json               # Root TypeScript config

```

---

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          SUPER ADMIN LAYER                               │
│  Dashboard │ Tenant Mgmt │ IAM │ Monitoring │ Billing │ Module Control  │
└──────────────────────────────────┬──────────────────────────────────────┘
                                   │
┌──────────────────────────────────▼──────────────────────────────────────┐
│                         MULTI-TENANT SaaS LAYER                          │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                    │
│  │ RMS Academy │  │Ashvi Coaching│  │  Tenant N   │                    │
│  │ 1702 students│  │ 0 students  │  │    ...      │                    │
│  └─────────────┘  └─────────────┘  └─────────────┘                    │
└──────────────────────────────────┬──────────────────────────────────────┘
                                   │
┌──────────────────────────────────▼──────────────────────────────────────┐
│                            BACKEND (Express + TypeScript)                 │
│                                                                          │
│  Auth → Tenant Resolver → Subscription Check → Module Routes             │
│                                                                          │
│  Middleware Stack:                                                        │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │ CORS → Rate-Limit → Auth(JWT) → TenantResolve → SubscriptionCheck │ │
│  └────────────────────────────────────────────────────────────────────┘ │
│                                                                          │
│  55 Modules │ Prisma ORM │ MongoDB │ Redis (Queue/Cache)                │
│  Cloudinary (uploads) │ Razorpay (payments) │ BullMQ (jobs)             │
└──────────────────────────────────┬──────────────────────────────────────┘
                                   │
┌──────────────────────────────────▼──────────────────────────────────────┐
│                          FRONTEND APPS                                    │
│                                                                          │
│  ┌──────────────────┐  ┌─────────────────┐  ┌──────────────────┐      │
│  │  Admin Panel      │  │  Student Portal  │  │  YN-UDP Editor   │      │
│  │  (React + Vite)   │  │  (React + Vite)  │  │  (Print Engine)  │      │
│  │  Port: 5174       │  │  Port: 5175      │  │  Port: 5176      │      │
│  └──────────────────┘  └─────────────────┘  └──────────────────┘      │
└─────────────────────────────────────────────────────────────────────────┘

```

---

## 🔐 Authentication & Authorization

### Multi-Level Auth System

| Role | Access | Description |
| --- | --- | --- |
| `SUPER_ADMIN` | Platform-wide | All tenants, system settings, billing, monitoring |
| `ADMIN` | Tenant-scoped | Full institution management |
| `TEACHER` | Role-scoped | Attendance, marks, own classes, leave, salary |
| `STUDENT` | Self-scoped | View own data via Student Portal |
| `PARENT` | Ward-scoped | View ward data |

### Auth Flow

```
Login → JWT (userId, tenantId, role) → Every API → authMiddleware → resolveTenant → Controller

```

### Tenant Registration

- **Super Admin creates tenant** → Auto-creates admin user → Shows credentials
- **Self-registration** → Creates tenant + admin → Default password=[REDACTED_PASSWORD] first login → Force password change

### Security Features

- Login rate limiting (10 failures → 15min lockout)
- OTP-based password reset
- IP tracking + device fingerprinting (fraud prevention for free plans)
- Subscription expiry check on every request
- JWT refresh tokens

---

## 📋 All 55 Backend Modules

### Core Academic

| Module | Path | Purpose |
| --- | --- | --- |
| academic | `modules/academic/` | Academic year & session management |
| class | `modules/class/` | Class CRUD (Nursery–12) |
| Section | `modules/Section/` | Sections (A, B, C) per class |
| subject | `modules/subject/` | Subject management |
| timetable | `modules/timetable/` | Timetable scheduling |
| room | `modules/room/` | Room/classroom management |

### Student Management

| Module | Path | Purpose |
| --- | --- | --- |
| students | `modules/students/` | Student CRUD, profiles, bulk import (1790+ real records) |
| admission | `modules/admission/` | Admission workflow with auto-counter |
| enrollment | `modules/enrollment/` | Class-section enrollment |
| student-portal | `modules/student-portal/` | Student self-service (separate app) |

### Staff / Teacher

| Module | Path | Purpose |
| --- | --- | --- |
| teacher | `modules/teacher/` | Profiles, assignments, dashboard, communication |
| teacher (leave) | `modules/teacher/leave.*` | Leave management |
| teacher (salary) | `modules/teacher/salary.*` | Salary/payroll |
| teacher (performance) | `modules/teacher/performance.*` | Performance tracking |
| teacher (document) | `modules/teacher/document.*` | Document management |
| teacher (settings) | `modules/teacher/settings.*` | Per-teacher settings |
| teacher (report) | `modules/teacher/report.*` | Teacher reports |

### Fee & Payments

| Module | Path | Purpose |
| --- | --- | --- |
| fees | `modules/fees/` | Fee structure, collection, receipts, concessions |
| payment-gateway | `modules/payment-gateway/` | Razorpay integration |
| subscription | `modules/subscription/` | SaaS plans (Free trial + Paid) |
| subscription-payment | `modules/subscription-payment/` | Subscription billing & Razorpay orders |

### Exam & Assessment

| Module | Path | Purpose |
| --- | --- | --- |
| exam | `modules/exam/` | Exam schedule, marks entry, report cards |
| grade | `modules/grade/` | Grade settings, GPA calculation |

### Attendance

| Module | Path | Purpose |
| --- | --- | --- |
| attendance | `modules/attendance/` | Daily marking, reports, analytics |

### Library, Transport, Hostel

| Module | Path | Purpose |
| --- | --- | --- |
| libraryManagement | `modules/libraryManagement/` | Books, issues, returns, fines |
| transport | `modules/transport/` | Vehicles, routes, GPS tracking |
| hostel | `modules/hostel/` | Rooms, allocation, mess management |

### HR & Staff

| Module | Path | Purpose |
| --- | --- | --- |
| hr | `modules/hr/` | Staff attendance, leaves, payroll, recruitment |

### Communication

| Module | Path | Purpose |
| --- | --- | --- |
| communication | `modules/communication/` | SMS, Email, WhatsApp helpers |
| notifications | `modules/notifications/` | Push notifications |
| notification-engine | `modules/notification-engine/` | Template-based delivery |

### Enterprise Modules

| Module | Path | Purpose |
| --- | --- | --- |
| masters | `modules/masters/` | 110 master tables — generic CRUD |
| workflow | `modules/workflow/` | Approval workflows |
| form-builder | `modules/form-builder/` | Dynamic form creation |
| report-builder | `modules/report-builder/` | Custom report generation |
| dashboard-builder | `modules/dashboard-builder/` | Custom dashboards |
| file-manager | `modules/file-manager/` | File upload/management |
| import-export | `modules/import-export/` | Bulk data import/export (Excel) |
| scheduler | `modules/scheduler/` | Cron job scheduling |
| queue | `modules/queue/` | Background jobs (BullMQ + Redis) |
| search | `modules/search/` | Global search |
| audit | `modules/audit/` | Activity audit trail |
| reports | `modules/reports/` | Pre-built report templates |
| events | `modules/events/` | Event management |
| gate-pass | `modules/gate-pass/` | Visitor gate pass system |
| helpdesk | `modules/helpdesk/` | Ticket/support system |
| inventory | `modules/inventory/` | Inventory management |

### Certificates & ID Cards

| Module | Path | Purpose |
| --- | --- | --- |
| certificate | `modules/certificate/` | TC, Character, Bonafide, Migration |
| digital-signature | `modules/digital-signature/` | Digital signatures |
| signature | `modules/signature/` | Signature management |
| qr-barcode | `modules/qr-barcode/` | QR/Barcode generation for ID cards |

### System & Platform

| Module | Path | Purpose |
| --- | --- | --- |
| auth | `modules/auth/` | Login, Register, Password Reset, Super Admin bootstrap |
| settings | `modules/settings/` | School/institution settings |
| theme | `modules/theme/` | UI theme (per-tenant customization) |
| tenant | `modules/tenant/` | Tenant CRUD, subscription, images |
| permissions | `modules/permissions/` | Role-based access control |
| i18n | `modules/i18n/` | Multi-language support |
| dashboard | `modules/dashboard/` | Admin dashboard stats |
| ai-assistant | `modules/ai-assistant/` | AI chat, predictions, insights |
| backup | `modules/backup/` | Database backup management |

---

## 🛡️ Super Admin Panel (16 Sub-Modules)

| Module | Backend File | Frontend Page | Purpose |
| --- | --- | --- | --- |
| Dashboard | `superAdmin.controller.ts` | `SuperAdminDashboard.tsx` | Platform stats, revenue |
| Tenant Management | `superAdmin.controller.ts` | `TenantsPage.tsx` | CRUD, clone, impersonate, toggle |
| Subscription & Billing | `subscription-management.*` | `SubscriptionManagement.tsx` | Plans, invoices, revenue |
| User Management | `user-management.*` | `UserManagement.tsx` | Cross-tenant user ops |
| IAM & Permissions | `iam.*` | `IAMPage.tsx` | Roles, permissions, policies |
| Module Management | `module-management.*` | `ModuleManagement.tsx` | Enable/disable per tenant |
| Plugin Management | `plugin-management.*` | `PluginManagement.tsx` | Plugin marketplace |
| Monitoring | `monitoring.*` | `MonitoringPage.tsx` | System health, logs |
| Audit Center | `audit-center.*` | `AuditCenter.tsx` | Activity audit trail |
| Report Center | `report-center.*` | `ReportCenter.tsx` | Platform-wide reports |
| Notification Center | `notification-center.*` | `NotificationCenter.tsx` | Push/SMS/Email management |
| Security Center | `security.*` | `SecurityCenter.tsx` | Threats, firewall, sessions |
| Support Center | `support-center.*` | `SupportCenter.tsx` | Help desk, tickets |
| Theme Management | `theme-management.*` | `ThemeManagement.tsx` | Global themes |
| Database Management | `database.*` | `DatabaseManagement.tsx` | DB ops, backups |
| System Settings | `settings.routes.ts` | `SystemSettings.tsx` | Platform config |

---

## 🖥️ Frontend Pages (49 Modules)

```
pages/
├── superAdmin/          # 19 pages (Super Admin panel)
├── students/            # Student CRUD, ID cards, profiles
├── teachers/            # Teacher management
├── admission/           # Admission workflow
├── fees/                # Fee structure, collection, receipts
├── exams/               # Exam management, marks, report cards
├── AttendancePage/      # Attendance marking & reports
├── classes/             # Class management
├── Sections/            # Section management
├── Subjects/            # Subject management
├── timeTable/           # Timetable management
├── academic-year/       # Academic year management
├── certificates/        # TC, Character, Migration certificates
├── communication/       # Notices, circulars
├── transport/           # Vehicle tracking
├── hostel/              # Hostel management
├── library/             # Library management
├── hr/                  # HR & Payroll
├── events/              # Event management
├── gate-pass/           # Visitor management
├── helpdesk/            # Ticket system
├── inventory/           # Stock management
├── masters/             # 110 master tables CRUD UI
├── reports/             # Reports & analytics
├── workflow/            # Approval workflows
├── form-builder/        # Dynamic forms
├── report-builder/      # Custom reports
├── dashboard-builder/   # Custom dashboards
├── file-manager/        # File management
├── import-export/       # Bulk import/export
├── scheduler/           # Cron scheduling
├── queue/               # Job queue monitoring
├── notifications/       # Notification center
├── subscriptions/       # Subscription management
├── payment-gateway/     # Payment processing
├── settings/            # Institution settings
├── principal/           # Principal dashboard
├── designer/            # Template designer
├── digital-signature/   # Digital signature
├── qr-barcode/          # QR/Barcode generation
├── ai-assistant/        # AI chat interface
├── audit/               # Audit trail viewer
├── backup/              # Backup management
├── i18n/                # Language management
├── login/               # Login, Register, Forgot Password
├── yn-udp/              # Template editor
└── TenantDashboard.tsx  # Tenant admin dashboard

```

---

## 🖨️ Print / PDF / Card System

### Architecture

```
Page Component → usePrint() hook → PrintLayout wrapper → printViaIframe()
                                                      → YN-UDP Templates (custom layouts)

```

### Print-Enabled Features

- Report Cards (Single + Bulk + Consolidated)
- Admit Cards
- Fee Receipts
- Student & Teacher ID Cards
- Transfer Certificate, Character Certificate, Migration Certificate
- Timetable Print
- Attendance Reports
- Student Lists (Print + PDF)
- Custom Certificate Generator

---

## 🤖 AI Assistant

| Endpoint | Purpose |
| --- | --- |
| `POST /api/ai/chat` | Natural language queries |
| `POST /api/ai/analyze/performance` | Student performance analysis |
| `POST /api/ai/predict/attendance` | At-risk students (< 75%) |
| `POST /api/ai/predict/defaulters` | Fee defaulter prediction |
| `GET /api/ai/insights` | Auto-generated alerts |

Rule-based NL parser — works offline, no API costs, deterministic results.

---

## 💰 Subscription & Billing

### SaaS Model

```
Free Trial (auto-assigned on registration, fraud-checked)
    ↓
Paid Plans (via Razorpay)
    ↓
Subscription Check Middleware → Block expired tenants

```

### Features

- Multiple plans with resource limits (students, teachers, admins, storage)
- Razorpay order creation + webhook verification
- Subscription expiry enforcement on every API call
- Free trial fraud detection (IP + device fingerprint + email/phone matching)

---

## 🐳 Infrastructure

### Docker Compose Services

| Service | Image | Port | Purpose |
| --- | --- | --- | --- |
| MongoDB | `mongo:7` | 27017 | Primary database |
| Redis | `redis:7-alpine` | 6379 | Queue, caching, sessions |
| Mongo Express | `mongo-express` | 8081 | DB admin UI |

### Tech Stack

| Layer | Technology |
| --- | --- |
| Runtime | Node.js 18+ |
| Language | TypeScript (strict) |
| Backend Framework | Express.js |
| ORM | Prisma (MongoDB connector) |
| Database | MongoDB 7 (Atlas / Local) |
| Cache/Queue | Redis + BullMQ |
| Frontend | React 18 + Vite + Tailwind CSS |
| Auth | JWT (Access + Refresh tokens) |
| File Storage | Cloudinary |
| Payments | Razorpay |
| Print Engine | YN-UDP (custom iframe-based) |

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- MongoDB (local or Atlas)
- Redis (for queue/cache)

### Installation

```bash
# Clone
git clone https://github.com/YogashwerNathSharma/college-erp-backend.git
cd college-erp-clean

# Install all dependencies
npm run install:all

# Configure backend
cd backend
cp .env.example .env
# Set: DATABASE_URL, JWT_SECRET, CLOUDINARY_*, RAZORPAY_*

# Generate Prisma Client
npx prisma generate

# Seed Super Admin
npx ts-node prisma/seed-superadmin.ts

# Seed Classes (required before student import)
npx ts-node prisma/seed-classes-2026-27.ts

```

### Run Development

```bash
# Terminal 1: Backend (port 5000)
npm run dev:backend

# Terminal 2: Frontend (port 5174)
npm run dev:frontend

# Terminal 3: Student Portal (port 5175)
npm run dev:student

# Terminal 4: Template Engine (port 5176)
npm run dev:udp

```

### Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev:backend` | Start backend in dev mode |
| `npm run dev:frontend` | Start admin frontend |
| `npm run dev:student` | Start student portal |
| `npm run dev:udp` | Start template engine |
| `npm run build` | Build frontend for production |
| `npm run seed` | Run database seed |
| `npm run install:all` | Install deps for all packages |

---

## 🔧 Key Technical Decisions

| Decision | Reason |
| --- | --- |
| MongoDB (not SQL) | Flexible schema, JSON-native, multi-tenant via tenantId |
| Prisma ORM | Type-safe, auto-generated client, excellent DX |
| JWT Auth (30min expiry) | Stateless, includes tenantId for tenant isolation |
| Generic Master CRUD | 110 tables managed by single controller + config |
| Rule-based AI (not LLM) | Offline, no API cost, fast, deterministic |
| iframe-based Print | Mobile-friendly, no CSP issues |
| YN-UDP Templates | Per-school customizable print layouts |
| Multi-tenant by field | All data has `tenantId` — simple, no DB switching |
| Separate Student Portal | Dedicated UX for students, isolated codebase |
| Docker Compose | One-command infra setup for dev |
| Monorepo (workspace) | Shared types, single git history |

---

## 🌐 API Response Format

```json
// Success
{
  "success": true,
  "data": { ... },
  "pagination": { "page": 1, "limit": 25, "total": 1790, "totalPages": 72 }
}

// Error
{
  "success": false,
  "message": "Error description"
}

```

---

## 📂 Documentation

| File | Purpose |
| --- | --- |
| `docs/API.md` | API endpoint documentation |
| `docs/FEE_MODULE_DEPLOYMENT_GUIDE.md` | Fee module deployment |
| `docs/TESTING_CHECKLIST.md` | QA testing checklist |
| `docs/seed-data-note.md` | Seed data notes |
| `security/p0-07-payment-idempotency.md` | Payment security |
| `INTEGRATION_GUIDE.md` | Integration guide |

---

## 👨‍💻 Developer

**YogashwerNath Sharma**

- GitHub: [YogashwerNathSharma](https://github.com/YogashwerNathSharma)
- Deployed for: RMS Academy, Bareilly, Uttar Pradesh

---

> **Note**: This is a production system with **1,790+ real student records**. Handle data with care. All API access is tenant-isolated and subscription-gated.

