# 🎨 YN-UDP — Visual Template Designer

A PowerPoint/Paint-style drag-and-drop template designer for creating **Certificates**, **ID Cards**, **Report Cards**, and **Custom Documents**.

Users design templates visually — positioning text, shapes, images, lines, database field placeholders — and save them. At print time, the placeholders get replaced with real student/school data from the ERP database.

---

## 📁 Architecture (Microservice)

```
yn-udp/
├── client/          ← React + Vite + TailwindCSS + Fabric.js
├── server/          ← Express + Prisma + MongoDB API
└── package.json     ← Root workspace scripts
```

| Component | Port | Tech |
|-----------|------|------|
| Client | 5173 | React 18, Vite 5, Fabric.js 5, TailwindCSS |
| Server | 5001 | Express 4, Prisma 6, MongoDB |

---

## 🚀 Quick Start

### 1. Install Dependencies

```bash
cd yn-udp

# Install root (concurrently)
npm install

# Install client + server
npm run install:all
```

### 2. Setup Environment

```bash
# Server
cp server/.env.example server/.env
# Edit server/.env → set your DATABASE_URL (same MongoDB as main ERP)

# Client
cp client/.env.example client/.env
# Edit client/.env → set VITE_TENANT_ID to your tenant's ObjectId
```

### 3. Setup Prisma

```bash
cd server
npx prisma generate
npx prisma db push
cd ..
```

### 4. Run Development

```bash
npm run dev
```

This starts both client (port 5173) and server (port 5001) concurrently.

- **Designer UI**: http://localhost:5173
- **API Health**: http://localhost:5001/api/health

---

## 🎯 Features

### Canvas Editor (PowerPoint-like)
- ✅ Drag & Drop elements (text, shapes, images, lines)
- ✅ Resize, rotate, reposition with handles
- ✅ Multi-select (Shift+Click)
- ✅ Copy/Paste (Ctrl+C/V)
- ✅ Undo/Redo (Ctrl+Z / Ctrl+Y)
- ✅ Zoom In/Out
- ✅ Grid toggle
- ✅ Layer management (z-index)
- ✅ Properties panel (font, color, size, position, opacity)
- ✅ Background color/image
- ✅ Watermark text
- ✅ Page size presets (A4, ID Card, Letter, Custom)

### Database Field Placeholders
Insert dynamic fields that get replaced with real data:
- **Student**: `{{student_name}}`, `{{class_name}}`, `{{roll_number}}`, `{{photo}}`, etc.
- **School**: `{{school_name}}`, `{{school_logo}}`, `{{principal_name}}`, etc.
- **Exam**: `{{exam_name}}`, `{{marks_obtained}}`, `{{grade}}`, etc.
- **Fee**: `{{total_fee}}`, `{{paid_amount}}`, `{{receipt_no}}`, etc.
- **General**: `{{current_date}}`, `{{academic_year}}`, `{{qr_code}}`, etc.

### Template Types
- 📜 **Certificate** — Character, Transfer, Bonafide, etc.
- 🪪 **ID Card** — Student ID, Staff ID
- 📊 **Report Card** — Exam results layout
- 📋 **Custom** — Any document layout

---

## 📡 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/templates?tenantId=xxx&type=yyy` | List templates |
| GET | `/api/templates/:id` | Get template with canvas JSON |
| POST | `/api/templates` | Create new template |
| PUT | `/api/templates/:id` | Update template |
| DELETE | `/api/templates/:id` | Soft delete |
| POST | `/api/templates/:id/duplicate` | Duplicate template |
| POST | `/api/templates/:id/render` | Render with real data |

### Render API Example:
```json
POST /api/templates/:id/render
{
  "data": {
    "student_name": "Aarav Sharma",
    "class_name": "VIII",
    "roll_number": "12",
    "school_name": "DPS Bareilly"
  }
}
```
Returns the canvas JSON with all `{{placeholders}}` replaced with actual values.

---

## 🔗 ERP Integration

### Option 1: iframe Embed
```html
<iframe src="http://localhost:5173/editor/TEMPLATE_ID" width="100%" height="800px" />
```

### Option 2: API Integration
Main ERP backend fetches templates via API:
```typescript
// In ERP backend — when printing certificate for a student
const template = await fetch(`http://localhost:5001/api/templates/${templateId}`);
const rendered = await fetch(`http://localhost:5001/api/templates/${templateId}/render`, {
  method: 'POST',
  body: JSON.stringify({ data: studentData })
});
// Use rendered canvasJSON to generate PDF/image
```

### Option 3: Sidebar Link
Add to ERP sidebar:
```
{ name: "Template Designer", path: "http://localhost:5173", icon: Palette }
```

---

## 🔐 Environment Variables

### Server (`server/.env`)
| Variable | Description | Example |
|----------|-------------|---------|
| DATABASE_URL | MongoDB connection string | `mongodb+srv://...` |
| PORT | Server port | `5001` |
| JWT_SECRET | Shared JWT secret with ERP | `your-secret-key` |
| CORS_ORIGIN | Allowed frontend origin | `http://localhost:5173` |

### Client (`client/.env`)
| Variable | Description | Example |
|----------|-------------|---------|
| VITE_API_URL | API base URL (empty = proxy) | `` |
| VITE_TENANT_ID | Your tenant ObjectId | `6a20567f17915b09d64bc57a` |

---

## 🏗️ Database Schema

```prisma
model DesignTemplate {
  id          String   @id @default(auto()) @map("_id") @db.ObjectId
  tenantId    String   @db.ObjectId
  name        String
  type        String   // certificate, id-card, report-card, custom
  category    String?
  canvasJSON  Json     // Full Fabric.js canvas serialization
  pageWidth   Int      @default(794)
  pageHeight  Int      @default(1123)
  orientation String   @default("portrait")
  thumbnail   String?  // Base64 for grid preview
  isDefault   Boolean  @default(false)
  isActive    Boolean  @default(true)
  isDeleted   Boolean  @default(false)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

---

## 📋 Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| Ctrl+S | Save template |
| Ctrl+Z | Undo |
| Ctrl+Y | Redo |
| Ctrl+C | Copy selected |
| Ctrl+V | Paste |
| Delete | Remove selected |
| Double-click text | Edit text inline |

---

## 🛣️ Roadmap
- [ ] Drag-to-draw shapes (freehand drawing)
- [ ] Template marketplace (share between tenants)
- [ ] PDF export engine
- [ ] Batch print (multiple students at once)
- [ ] QR Code generator integration
- [ ] Template version history

---

Built with ❤️ for College ERP
