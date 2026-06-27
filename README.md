# College ERP - Multi-Tenant School Management System

A comprehensive, multi-tenant Enterprise Resource Planning (ERP) system for educational institutions built with modern web technologies.

## 🏗️ Architecture

```
college-erp/
├── backend/          # Express.js + Prisma + MongoDB API server
├── frontend/         # React + Vite admin dashboard
├── student-portal/   # React + Vite student-facing portal
├── shared/           # Shared types, validators, constants
├── yn-udp/           # Template designer (UDP protocol)
├── scripts/          # DevOps & seed scripts
└── docs/             # API documentation
```

## 🚀 Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Node.js, Express 5, TypeScript |
| Database | MongoDB (Prisma ORM) |
| Cache | Redis |
| Frontend | React 18, Vite, Tailwind CSS |
| Student Portal | React 18, Vite, Tailwind CSS |
| Auth | JWT (role-based) |
| Payments | Razorpay |
| File Storage | Local / AWS S3 |

## 📦 Monorepo Structure

This project uses **npm workspaces** for package management.

### Prerequisites

- Node.js >= 18
- npm >= 9
- Docker & Docker Compose (for MongoDB + Redis)

### Quick Start

```bash
# 1. Clone the repository
git clone <repo-url>
cd college-erp

# 2. Install all dependencies
npm install

# 3. Start infrastructure (MongoDB + Redis)
docker-compose up -d

# 4. Copy environment file
cp .env.example .env

# 5. Seed the database
npm run seed

# 6. Start development servers
npm run dev:backend    # API server on :5000
npm run dev:frontend   # Admin dashboard on :5173
npm run dev:student    # Student portal on :5174
```

## 🔐 Roles & Access

| Role | Access |
|------|--------|
| SUPER_ADMIN | Platform-wide management, tenant CRUD |
| TENANT_ADMIN | School-level management |
| PRINCIPAL | School oversight, approvals |
| TEACHER | Class management, marks entry |
| STUDENT | View-only portal (results, fees, attendance) |

## 📚 Modules

- **Students** - Admission, profiles, promotion, ID cards
- **Teachers** - Staff management, assignments, performance
- **Fees** - Structure, collection, receipts, reminders
- **Exams** - Creation, marks entry, report cards, admit cards
- **Attendance** - Daily tracking, reports, analytics
- **Timetable** - Class scheduling, teacher allocation
- **Library** - Book management, issue/return
- **Transport** - Route management, vehicle tracking
- **Hostel** - Room allocation, mess management
- **HR** - Staff payroll, leave management
- **Communication** - SMS, WhatsApp, circulars, notice board
- **Certificates** - TC, character, migration certificates
- **Inventory** - Asset management, stock tracking
- **Reports** - Analytics, exportable reports

## 📖 API Documentation

After starting the backend, visit: `http://localhost:5000/api-docs`

## 🧪 Testing

```bash
npm test              # Run all tests
npm run test:backend  # Backend tests only
```

## 📄 License

Private - All rights reserved.
