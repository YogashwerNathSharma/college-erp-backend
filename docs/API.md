# College ERP - API Documentation

## Base URL

```
Development: http://localhost:5000/api
Production: https://college-erp-backend-91zi.onrender.com/api
```

## Authentication

All protected endpoints require a Bearer token in the Authorization header:

```
Authorization: Bearer <token>
```

### Login

```
POST /api/auth/login
Body: { "email": "string", "password": "string" }
Response: { "token": "string", "user": { ... } }
```

### Roles
- `SUPER_ADMIN` - Platform management
- `TENANT_ADMIN` - School management
- `PRINCIPAL` - School oversight
- `TEACHER` - Class management
- `STUDENT` - View-only access

---

## Endpoints

### Students

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/students` | List all students (paginated) |
| GET | `/students/:id` | Get student by ID |
| POST | `/students` | Create student |
| PUT | `/students/:id` | Update student |
| DELETE | `/students/:id` | Delete student |
| POST | `/students/promote` | Promote students |
| GET | `/students/search` | Search students |

### Teachers

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/teachers` | List all teachers |
| GET | `/teachers/:id` | Get teacher by ID |
| POST | `/teachers` | Create teacher |
| PUT | `/teachers/:id` | Update teacher |
| DELETE | `/teachers/:id` | Delete teacher |

### Fees

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/fees/heads` | List fee heads |
| POST | `/fees/heads` | Create fee head |
| GET | `/fees/structures` | List fee structures |
| POST | `/fees/structures` | Create fee structure |
| POST | `/fees/collect` | Collect fee payment |
| GET | `/fees/receipts` | List receipts |
| GET | `/fees/defaulters` | Get defaulters list |
| GET | `/fees/dashboard` | Fee analytics |

### Exams

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/exams` | List exams |
| POST | `/exams` | Create exam |
| POST | `/exams/:id/subjects` | Add exam subjects |
| POST | `/exams/:id/marks` | Enter marks |
| GET | `/exams/:id/results` | Get results |
| POST | `/exams/:id/publish` | Publish results |

### Attendance

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/attendance/mark` | Mark attendance |
| GET | `/attendance/report` | Get attendance report |
| GET | `/attendance/student/:id` | Student attendance |

### Communication

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/communication/notices` | List notices |
| POST | `/communication/notices` | Create notice |
| POST | `/communication/sms/send` | Send SMS |
| POST | `/communication/whatsapp/send` | Send WhatsApp |

### HR

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/hr/staff` | List staff |
| GET | `/hr/payroll` | Get payroll |
| POST | `/hr/payroll/process` | Process payroll |
| GET | `/hr/leaves` | List leave requests |
| PATCH | `/hr/leaves/:id` | Approve/reject leave |

### Hostel

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/hostel/rooms` | List rooms |
| POST | `/hostel/rooms/allocate` | Allocate room |
| GET | `/hostel/fees` | Hostel fees |
| GET | `/hostel/mess/menu` | Mess menu |

### Certificates

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/certificates/tc` | Generate TC |
| POST | `/certificates/character` | Character cert |
| POST | `/certificates/migration` | Migration cert |

### Inventory

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/inventory/assets` | List assets |
| POST | `/inventory/issue` | Issue asset |
| POST | `/inventory/return/:id` | Return asset |
| GET | `/inventory/stock` | Get stock levels |

---

## Query Parameters

### Pagination
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 20, max: 100)
- `search` - Search query
- `sortBy` - Sort field
- `sortOrder` - `asc` or `desc`

### Filtering
Specific filters vary by endpoint (classId, status, etc.)

---

## Error Responses

```json
{
  "success": false,
  "message": "Error description",
  "error": "VALIDATION_ERROR"
}
```

### Status Codes
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error
