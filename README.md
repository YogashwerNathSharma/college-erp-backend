# 🏫 College ERP — Complete System Documentation

> **RMS Academy, Bareilly, Uttar Pradesh**  
> Enterprise Resource Planning System — Full Stack (MongoDB + Express + React + Node.js)

---

## 📁 Project Structure

```
college-erp-clean/
├── backend/                 # Express + Prisma + MongoDB
│   ├── src/
│   │   ├── app.ts          # Express app setup + all route registrations
│   │   ├── server.ts       # Server entry point
│   │   ├── config/         # Swagger, DB config
│   │   ├── middleware/     # auth, tenant, security, rate-limit, error
│   │   ├── modules/        # 55 feature modules (routes + controllers)
│   │   ├── routes/         # Public site routes
│   │   ├── types/          # TypeScript interfaces
│   │   └── utils/          # Prisma client, helpers
│   ├── prisma/
│   │   ├── schema.prisma   # ★ SINGLE SOURCE OF TRUTH for all models
│   │   ├── masters/        # Reference files (NOT compiled — for documentation only)
│   │   ├── seed-masters.ts # Seeds 110 master tables
│   │   ├── seed-enterprise.ts  # Seeds operational data (students, fees, etc.)
│   │   └── seed-full-erp.ts   # ★ Combined full seed (masters + operational)
│   └── uploads/            # File uploads storage
│
├── frontend/               # React + Vite + TypeScript + Tailwind
│   ├── src/
│   │   ├── App.tsx         # Router + 142 routes
│   │   ├── pages/          # 40+ page modules
│   │   ├── components/     # Shared components (Sidebar, Navbar, Print, etc.)
│   │   ├── context/        # AuthContext (JWT management)
│   │   ├── hooks/          # usePrint, custom hooks
│   │   ├── services/       # yn-udp service, API helpers
│   │   ├── utils/          # url helper, print utilities
│   │   └── config/         # API base URL config
│   └── dist/               # Production build
│
└── yn-udp/                 # Template engine service (print templates)
    ├── client/             # Template editor UI
    └── server/             # Template rendering server
```

---

## 🔐 Authentication Flow

```
[Frontend]                          [Backend]
    │                                   │
    ├─ Login Form ───────────────────►  POST /api/auth/login
    │                                   │ verify credentials
    │  ◄─── { token, user } ────────── │ sign JWT { userId, tenantId, role }
    │                                   │
    │  axios.defaults.headers          │
    │  Authorization = "Bearer {token}" │
    │                                   │
    ├─ Any API Call ─────────────────►  authMiddleware
    │                                   │ verify JWT → req.user = { userId, tenantId, role }
    │                                   │
    │                                   resolveTenant
    │                                   │ req.user.tenantId → (req as any).tenantId
    │                                   │
    │                                   subscriptionCheckMiddleware
    │                                   │ check subscription not expired
    │                                   │
    │                                   Controller
    │  ◄─── Response ───────────────── │ uses (req as any).tenantId for all queries
```

### User Roles:
| Role | Access Level |
|------|-------------|
| `SUPER_ADMIN` | All tenants, system management |
| `ADMIN` | Full institution management |
| `TEACHER` | Attendance, marks, own classes |
| `STUDENT` | View own data via Student Portal |
| `PARENT` | View ward data |

---

## 🏗️ Module Architecture

Every backend module follows this pattern:

```
modules/{module-name}/
├── {module}.routes.ts       # Express routes + middleware
├── {module}.controller.ts   # Request handlers + business logic
└── {module}.service.ts      # (optional) Reusable logic
```

### Standard Route File Pattern:
```typescript
import { Router } from 'express';
import { authMiddleware } from '../../middleware/auth.middleware';
import { resolveTenant } from '../../middleware/tenant.middleware';
import { getAll, create, update, remove } from './module.controller';

const router = Router();
router.use(authMiddleware);    // ← Every module must have this
router.use(resolveTenant);     // ← Every module must have this

router.get('/', getAll);
router.post('/', create);
router.put('/:id', update);
router.delete('/:id', remove);

export default router;
```

### Standard Controller Pattern:
```typescript
export const getAll = async (req: Request, res: Response) => {
  const tenantId = (req as any).tenantId;  // ← ALWAYS from middleware
  const data = await prisma.model.findMany({ where: { tenantId } });
  res.json({ success: true, data });
};
```

---

## 📋 All 55 Modules

### Core Academic
| Module | API Base | Purpose |
|--------|----------|---------|
| academic | `/api/academic` | Academic year management |
| class | `/api/class` | Class CRUD (Nursery–12) |
| Section | `/api/section` | Sections (A, B, C) per class |
| subject | `/api/subjects` | Subject management |
| timetable | `/api/timetable` | Timetable scheduling |
| room | `/api/room` | Room/classroom management |

### Student Management
| Module | API Base | Purpose |
|--------|----------|---------|
| students | `/api/students` | Student CRUD, profiles |
| admission | `/api/admission` | New admission workflow |
| enrollment | `/api/enrollment` | Class-section enrollment |
| student-portal | `/api/student-portal` | Student self-service portal |

### Staff / Teacher
| Module | API Base | Purpose |
|--------|----------|---------|
| teacher | `/api/teacher` | Teacher profiles, assignments |
| teacher-leave | `/api/teacher-leave` | Leave management |
| teacher-salary | `/api/teacher-salary` | Salary management |
| teacher-performance | `/api/teacher-performance` | Performance tracking |
| teacher-document | `/api/teacher-document` | Document management |

### Fee Management
| Module | API Base | Purpose |
|--------|----------|---------|
| fees | `/api/fees` | Fee structure, collection, receipts |
| payment-gateway | `/api/payment-gateway` | Online payment integration |
| subscription | `/api/subscriptions` | SaaS subscription plans |
| subscription-payment | `/api/subscription-payments` | Subscription billing |

### Exam & Assessment
| Module | API Base | Purpose |
|--------|----------|---------|
| exam | `/api/exam` | Exam schedule, marks entry |
| grade | `/api/grade` | Grade settings, GPA calculation |

### Attendance
| Module | API Base | Purpose |
|--------|----------|---------|
| attendance | `/api/attendance` | Daily attendance marking |
| attendance-report | `/api/attendance/report` | Attendance analytics |

### Library
| Module | API Base | Purpose |
|--------|----------|---------|
| libraryManagement | `/api/library` | Books, issues, returns, fines |

### Transport
| Module | API Base | Purpose |
|--------|----------|---------|
| transport | `/api/transport` | Vehicles, routes, tracking |

### Hostel
| Module | API Base | Purpose |
|--------|----------|---------|
| hostel | `/api/hostel` | Rooms, allocation, mess |

### HR & Payroll
| Module | API Base | Purpose |
|--------|----------|---------|
| hr | `/api/hr` | Staff attendance, leaves, payroll |

### Communication
| Module | API Base | Purpose |
|--------|----------|---------|
| communication | `/api/communication` | Notices, circulars |
| notifications | `/api/notifications` | Push/SMS/Email notifications |
| notification-engine | `/api/notification-engine` | Template-based delivery |

### Enterprise Modules
| Module | API Base | Purpose |
|--------|----------|---------|
| masters | `/api/masters` | 110 master tables CRUD |
| workflow | `/api/workflows` | Approval workflows |
| form-builder | `/api/forms` | Dynamic form creation |
| report-builder | `/api/report-builder` | Custom report generation |
| dashboard-builder | `/api/dashboard-builder` | Custom dashboards |
| file-manager | `/api/files` | File upload/management |
| import-export | `/api/import-export` | Bulk data import/export |
| scheduler | `/api/scheduler` | Cron job scheduling |
| queue | `/api/queue` | Background job processing |
| search | `/api/search` | Global search |
| audit | `/api/audit` | Activity audit trail |

### Certificates & Cards
| Module | API Base | Purpose |
|--------|----------|---------|
| certificate | `/api/certificate` | TC, Character, Bonafide |
| signature | `/api/signature` | Digital signatures |
| qr-barcode | `/api/qr` | QR/Barcode generation |

### System
| Module | API Base | Purpose |
|--------|----------|---------|
| settings | `/api/settings` | School settings |
| theme | `/api/theme` | UI theme management |
| backup | `/api/backup` | Database backups |
| permissions | `/api/permissions` | Role-based access |
| ai-assistant | `/api/ai` | AI chat, predictions, insights |
| i18n | `/api/i18n` | Multi-language support |
| tenant | `/api/tenant` | Multi-tenant management |
| super-admin | `/api/super-admin` | Platform admin |

---

## 🗄️ Master Module (110 Tables)

The Master Module is a **generic CRUD system** that handles all reference/configuration data.

### How It Works:
```
Frontend (MasterModule.tsx)
    │
    ├─ GET /api/masters/categories → Lists 20 categories with models
    │
    ├─ User clicks "School Master"
    │
    ├─ GET /api/masters/school-master → Lists entries with pagination
    │
    ├─ User clicks "Add"
    │
    ├─ POST /api/masters/school-master → Creates entry
    │      Body: { name, code, address, ... }
    │      Controller auto-adds: tenantId, isActive: true
    │
    └─ All field definitions come from master.config.ts
```

### 20 Master Categories:
1. **Organization** — School, Branch, Campus, Session, Shift, Working Days, Holidays, Houses, Timings
2. **Academic** — Stream, Subject Groups, Medium, Board, Course, Period
3. **Student** — Admission Type, Category, Religion, Caste, Nationality, Blood Group, Mother Tongue, Status
4. **Staff** — Department, Designation, Employment Type, Qualification, Leave Type, Salary Grade, Bank
5. **Fee** — Fee Group, Fee Type, Concession, Scholarship, Payment Mode, Receipt Series
6. **Exam** — Exam Type, Result Type, Marking Scheme, Assessment
7. **Attendance** — Status, Late Fine, Leave Reason, Shift
8. **Library** — Publisher, Author, Language, Rack, Shelf, Book Condition
9. **Hostel** — Block, Floor, Bed Type, Hostel Type
10. **Transport** — Driver, Conductor, Fuel Type, GPS Device
11. **Inventory** — Item Category, Item Group, Unit, Brand, Supplier, Warehouse, Store, Stock Type
12. **Payroll** — Payroll Head, Salary Component, PF, ESI, Tax Slab, Increment Type
13. **Communication** — SMS Template, Email Template, WhatsApp Template, Notification Template, Notice Category
14. **Certificate** — Certificate Template, ID Card Template
15. **Security** — Role, Permission, User Type, Module, Menu, API Permission
16. **Document** — Document Type, Document Category, Approval Workflow
17. **Event** — Event Category, Venue, Event Type, Visitor Type, Purpose, Gate
18. **AI** — AI Prompt, Prediction Rule, Analytics Rule
19. **System** — Theme, Currency, TimeZone, Backup Policy, Audit Type, API Provider, Settings

---

## 🖨️ Print / PDF / Card System

### Architecture:
```
[Page Component]
    │
    ├─ usePrint() hook → manages print state
    │
    ├─ <PrintLayout> wrapper → A4 sizing, headers, footers
    │
    ├─ printViaIframe() → opens hidden iframe for print
    │
    └─ YN-UDP Templates → custom print templates (optional)
```

### Print-Enabled Features:
| Feature | File | Method |
|---------|------|--------|
| Report Card | `exams/ReportCard.tsx` | Print + PDF |
| Bulk Report Card | `exams/BulkReportCard.tsx` | Print + PDF |
| Consolidated Report | `exams/ConsolidatedReportCard.tsx` | Print + PDF |
| Admit Card | `exams/AdmitCard.tsx` | Print + PDF |
| Fee Receipt | `fees/FeeReceiptPrint.tsx` | Print |
| Student ID Card | `students/StudentIdCard.tsx` | Print + Card |
| Teacher ID Card | `teachers/TeacherIdCard.tsx` | Print + Card |
| Transfer Certificate | `certificates/TCGenerate.tsx` | Print |
| Character Certificate | `certificates/CharacterCert.tsx` | Print |
| Migration Certificate | `certificates/MigrationCert.tsx` | Print |
| Timetable | `timeTable/TimetablePrint.tsx` | Print |
| Attendance Report | `AttendancePage/AttendanceReportPage.tsx` | Print |
| Student List | `students/PrintStudents.tsx` | Print + PDF |
| Certificate Generator | `reports/CertificateGenerator.tsx` | Print |

### How Print Works:
```javascript
// In any component:
import { usePrint } from '../../hooks/usePrint';

const { handlePrint, handlePDF, isPrinting } = usePrint({
  templateSlot: 'report-card',    // Optional: YN-UDP template
  orientation: 'portrait',
});

// Trigger print
<button onClick={() => handlePrint(contentRef)}>Print</button>
<button onClick={() => handlePDF(contentRef)}>Download PDF</button>
```

---

## 🤖 AI Assistant Module

### Endpoints:
| API | Purpose |
|-----|---------|
| `POST /api/ai/chat` | Natural language queries (student count, fee status, etc.) |
| `POST /api/ai/analyze/performance` | Student performance analysis |
| `POST /api/ai/predict/attendance` | Attendance prediction + at-risk students |
| `POST /api/ai/predict/defaulters` | Fee defaulter risk assessment |
| `GET /api/ai/insights` | Auto-generated alerts & recommendations |
| `GET /api/ai/conversations` | Chat history |

### How AI Chat Works:
```
User: "How many students are there?"
    ↓
NL Parser (rule-based keywords)
    ↓
prisma.student.count({ where: { tenantId } })
    ↓
Response: "There are 300 students in the system."
```

### Supported Queries:
- Student/Teacher counts
- Pending fee amounts
- Today's attendance rate
- Upcoming exams
- Performance analysis (per student)
- Fee defaulter prediction

---

## 💰 Fee Flow

```
1. Admin creates FeeHeads (Tuition, Transport, Lab, etc.)
       ↓
2. Admin creates FeeStructure (links FeeHead → Class → Amount → Installments)
       ↓
3. System generates StudentFee records for each enrolled student
       ↓
4. Parent/Admin makes Payment
       ↓
5. Receipt generated (printable)
       ↓
6. Dashboard shows collection stats
```

---

## 📝 Exam Flow

```
1. Admin creates Exam (Unit Test, Mid Term, Final)
       ↓
2. ExamSubjects assigned (Math, Science per exam per class)
       ↓
3. ExamSchedule set (date + room + invigilator)
       ↓
4. Admit Cards generated (printable)
       ↓
5. Teacher enters Marks (MarksEntry per student per subject)
       ↓
6. System calculates grades (GradeSetting)
       ↓
7. Report Card generated (print + PDF)
       ↓
8. Results published to Student Portal
```

---

## 📋 Attendance Flow

```
1. Teacher opens class attendance page
       ↓
2. Selects Date + Class + Section
       ↓
3. Student list loaded from Enrollment
       ↓
4. Marks each: Present / Absent / Late / Half Day
       ↓
5. POST /api/attendance/mark (bulk save)
       ↓
6. Reports: Daily / Monthly / Student-wise
       ↓
7. AI: Predicts at-risk students (< 75% attendance)
```

---

## 🚀 Setup & Run

### Prerequisites:
- Node.js 18+
- MongoDB (local or Atlas)
- npm/yarn

### Quick Start:
```bash
# 1. Install dependencies
cd backend && npm install
cd ../frontend && npm install

# 2. Configure environment
cd backend
cp .env.example .env
# Set: DATABASE_URL=mongodb+srv://...
# Set: JWT_SECRET=your-secret-key

# 3. Generate Prisma Client
npx prisma generate

# 4. Seed database (optional — for demo data)
npx ts-node prisma/seed-full-erp.ts

# 5. Start backend
npm run dev
# → Server running on http://localhost:5000

# 6. Start frontend (new terminal)
cd frontend
npm run dev
# → App running on http://localhost:5173
```

### Available Seed Commands:
```bash
npm run seed-masters    # Only master tables (110 tables)
npm run seed-erp        # Full ERP (masters + 300 students + fees + exams + everything)
```

---

## 🔧 Key Technical Decisions

| Decision | Reason |
|----------|--------|
| MongoDB (not SQL) | Flexible schema, JSON-native, multi-tenant via tenantId field |
| Prisma ORM | Type-safe, auto-generated client, great DX |
| JWT Auth | Stateless, includes tenantId for multi-tenant isolation |
| Generic Master CRUD | 110 tables managed by single controller + config |
| Rule-based AI (not LLM) | Works offline, no API costs, fast, deterministic |
| iframe-based Print | Works on mobile, avoids CSP issues, reliable |
| YN-UDP Templates | Customizable print layouts per school |
| Multi-tenant by field | All data has `tenantId` — simple, no DB switching |

---

## 🌐 API Response Format

All APIs follow this standard:
```json
// Success
{
  "success": true,
  "data": { ... },
  "pagination": { "page": 1, "limit": 25, "total": 300, "totalPages": 12 }
}

// Error
{
  "success": false,
  "message": "Error description"
}
```

---

## 📂 Frontend Route Map

| Route | Page | Module |
|-------|------|--------|
| `/dashboard` | Main Dashboard | Overview stats |
| `/students` | Student List | CRUD + filters |
| `/students/new-admission` | Admission Form | New student entry |
| `/students/id-card` | ID Card Generator | Print cards |
| `/teachers` | Teacher List | CRUD |
| `/fees` | Fee Dashboard | Collection overview |
| `/fees/collect` | Fee Collection | Payment entry |
| `/attendance` | Mark Attendance | Daily marking |
| `/attendance-report` | Attendance Reports | Analytics |
| `/exams` | Exam List | Manage exams |
| `/exams/marks-entry` | Marks Entry | Enter marks |
| `/exams/report-card` | Report Card | Print/PDF |
| `/library` | Library | Books + Issues |
| `/transport` | Transport | Vehicles + Routes |
| `/hostel` | Hostel | Rooms + Allocation |
| `/hr` | HR Dashboard | Staff + Payroll |
| `/masters` | Master Module | 110 tables CRUD |
| `/settings` | Settings | School config |
| `/certificates` | Certificates | TC, CC, etc. |
| `/reports` | Reports Menu | All report links |
| `/ai` | AI Assistant | Chat + Insights |

---

## ⚡ Performance Notes

- **Compression**: gzip enabled (60-80% response size reduction)
- **Pagination**: All list APIs paginated (default 25 per page)
- **Indexing**: All tenantId fields indexed in MongoDB
- **Rate Limiting**: Global + per-route limits
- **Lazy Loading**: Frontend uses React.lazy() for code splitting
- **Chunked Inserts**: Seed uses batch createMany (500 records/batch)

---

*Last Updated: June 2026*
