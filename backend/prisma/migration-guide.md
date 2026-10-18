# Migration Guide — Enterprise Student Module Schema Upgrade

## Overview

This guide explains how to apply the additive schema migration to upgrade your Student Module to enterprise-grade. All changes are **additive only** — no existing fields or models are removed or renamed.

---

## Prerequisites

- Node.js 18+
- Prisma CLI installed (`npx prisma`)
- Access to your MongoDB instance
- Backup your database before proceeding

---

## Step-by-Step Instructions

### 1. Backup Your Database

```bash
# MongoDB Atlas
mongodump --uri="your_connection_string" --out=./backup_$(date +%Y%m%d)

# Local MongoDB
mongodump --db=your_db_name --out=./backup_$(date +%Y%m%d)
```

### 2. Update `schema.prisma`

Open `backend/prisma/schema.prisma` and make the following additions:

#### A. Add New Fields to `model Student { ... }`

Place these fields **after the existing `customFields` field** and **before the closing `}`**:

```prisma
  // ── Personal Information (Enhanced) ──
  middleName            String?
  signatureUrl          String?
  motherTongue          String?
  identificationMarks   String?

  // ── Registration & ID Numbers ──
  registrationNo        String?
  boardRegNo            String?
  penNumber             String?
  apaarId               String?
  passportNo            String?
  birthCertNo           String?

  // ── Contact (Enhanced) ──
  whatsApp              String?

  // ── Structured Address ──
  permanentAddress      Json?
  correspondenceAddress Json?

  // ── Admission Workflow ──
  admissionType         String?
  admissionStatus       String?
  verifiedBy            String?
  verifiedAt            DateTime?
  approvedBy            String?
  approvedAt            DateTime?

  // ── Father (Enhanced) ──
  fatherEmail           String?
  fatherQualification   String?
  fatherAnnualIncome    Float?
  fatherPhotoUrl        String?
  fatherWhatsApp        String?
  fatherOfficeAddress   String?

  // ── Mother (Enhanced) ──
  motherEmail           String?
  motherQualification   String?
  motherPhotoUrl        String?
  motherWhatsApp        String?

  // ── Guardian (Enhanced) ──
  guardianOccupation    String?
  guardianEmail         String?
  guardianWhatsApp      String?
  guardianPhotoUrl      String?

  // ── Academic Placement ──
  houseId               String?   @db.ObjectId
  shiftId               String?   @db.ObjectId
  streamId              String?   @db.ObjectId
  mediumId              String?   @db.ObjectId
  subjectGroupId        String?   @db.ObjectId

  // ── Previous Education (Enhanced) ──
  previousResult        String?
  previousPercentage    Float?
  tcNumber              String?
  tcDate                DateTime?
  migrationNo           String?
  migrationDate         DateTime?

  // ── Medical (Enhanced) ──
  height                Float?
  weight                Float?
  bmi                   Float?
  disabilities          String[]
  insuranceProvider     String?
  insuranceExpiry       DateTime?
  doctorName            String?
  doctorPhone           String?

  // ── Status Audit ──
  statusChangedAt       DateTime?
  statusChangedBy       String?
  statusReason          String?

  // ── Record Audit ──
  deletedBy             String?
  createdBy             String?
  updatedBy             String?

  // ── New Relations ──
  vaccinations          StudentVaccination[]
  siblings              StudentSibling[]
  communicationLogs     StudentCommunicationLog[]
  credential            StudentCredential?
```

#### B. Add New Indexes to `model Student`

Add these **after** the existing `@@index` lines:

```prisma
  @@unique([aadharNo, tenantId])
  @@index([tenantId, dob])
  @@index([fatherPhone, tenantId])
  @@index([phone, tenantId])
  @@index([registrationNo, tenantId])
  @@index([tenantId, admissionStatus])
  @@index([tenantId, houseId])
```

> ⚠️ **NOTE**: The `@@unique([aadharNo, tenantId])` index will fail if you have existing duplicate Aadhaar numbers. Clean duplicates first or make it a regular `@@index` initially.

#### C. Add New Fields to `model StudentDocument`

Add these fields inside the existing `StudentDocument` model:

```prisma
  expiryDate            DateTime?
  verificationStatus    String?
  verifiedBy            String?
  verifiedAt            DateTime?
  documentCategory      String?
  isRequired            Boolean       @default(false)
```

#### D. Add New Models

Copy all 5 new models from `schema-migration-additions.prisma` (Section C) to the end of your `schema.prisma` file:

- `StudentVaccination`
- `StudentSibling`
- `StudentCommunicationLog`
- `StudentCredential`
- `StudentSavedFilter`

#### E. Add Relations to `Tenant` model

Inside the `model Tenant { ... }` block, add:

```prisma
  studentVaccinations      StudentVaccination[]
  studentSiblings          StudentSibling[]
  studentCommunicationLogs StudentCommunicationLog[]
  studentCredentials       StudentCredential[]
  studentSavedFilters      StudentSavedFilter[]
```

### 3. Validate Schema

```bash
cd backend
npx prisma validate
```

Fix any errors reported. Common issues:
- Missing `@db.ObjectId` on ObjectId fields
- Duplicate field names (check no field was added twice)
- Missing relation references

### 4. Generate Prisma Client

```bash
npx prisma generate
```

### 5. Push to Database

Since MongoDB doesn't use traditional SQL migrations, use `db push`:

```bash
npx prisma db push
```

This will:
- Add new fields (with `null` as default for optional fields)
- Create new collections for new models
- Create new indexes

### 6. Verify

```bash
# Open Prisma Studio to verify
npx prisma studio
```

Check:
- Student collection has all new fields
- New collections exist (StudentVaccination, StudentSibling, etc.)
- Indexes are created

---

## Handling Existing Data

Since all new fields are **optional** (`String?`, `Float?`, `DateTime?`, `Json?`), existing records will have `null` for these fields automatically. No data migration script is needed.

For the `disabilities String[]` field (array), existing records will have an empty array `[]`.

---

## Index Considerations

### Aadhaar Uniqueness

If you have existing students with duplicate or null Aadhaar numbers, the `@@unique([aadharNo, tenantId])` constraint will fail. Options:

1. **Clean first**: Remove duplicate Aadhaar values before applying
2. **Use sparse index**: Change to `@@index([aadharNo, tenantId])` (non-unique) initially, add uniqueness later after data cleanup
3. **Allow nulls**: MongoDB unique indexes allow multiple `null` values by default with Prisma, so only non-null duplicates will conflict

### Performance Impact

New indexes will be created in the background on MongoDB. For collections with millions of records, this may take time. Monitor with:

```bash
db.Student.getIndexes()
```

---

## Rollback Plan

If you need to rollback:

1. The new fields won't affect existing code (they're all optional)
2. To remove: edit schema.prisma, remove the added fields/models, run `prisma generate`
3. Optionally clean the database: `db.Student.updateMany({}, { $unset: { middleName: 1, signatureUrl: 1, ... } })`

---

## Post-Migration Checklist

- [ ] Schema validates without errors
- [ ] Prisma client generated successfully
- [ ] Database push completed
- [ ] Existing API endpoints still work
- [ ] Existing frontend pages load correctly
- [ ] New fields visible in Prisma Studio
- [ ] New collections created
- [ ] Indexes confirmed via MongoDB shell/Atlas
- [ ] Backup verified and stored safely

---

## New Field Summary

| Category | Fields Added | Count |
|----------|-------------|-------|
| Personal | middleName, signatureUrl, motherTongue, identificationMarks | 4 |
| Registration | registrationNo, boardRegNo, penNumber, apaarId, passportNo, birthCertNo | 6 |
| Contact | whatsApp | 1 |
| Address | permanentAddress, correspondenceAddress | 2 |
| Admission | admissionType, admissionStatus, verifiedBy, verifiedAt, approvedBy, approvedAt | 6 |
| Father | fatherEmail, fatherQualification, fatherAnnualIncome, fatherPhotoUrl, fatherWhatsApp, fatherOfficeAddress | 6 |
| Mother | motherEmail, motherQualification, motherPhotoUrl, motherWhatsApp | 4 |
| Guardian | guardianOccupation, guardianEmail, guardianWhatsApp, guardianPhotoUrl | 4 |
| Academic | houseId, shiftId, streamId, mediumId, subjectGroupId | 5 |
| Previous Education | previousResult, previousPercentage, tcNumber, tcDate, migrationNo, migrationDate | 6 |
| Medical | height, weight, bmi, disabilities, insuranceProvider, insuranceExpiry, doctorName, doctorPhone | 8 |
| Status Audit | statusChangedAt, statusChangedBy, statusReason | 3 |
| Record Audit | deletedBy, createdBy, updatedBy | 3 |
| **Total New Student Fields** | | **58** |
| StudentDocument Fields | expiryDate, verificationStatus, verifiedBy, verifiedAt, documentCategory, isRequired | 6 |
| **New Models** | StudentVaccination, StudentSibling, StudentCommunicationLog, StudentCredential, StudentSavedFilter | 5 |
| **New Indexes** | 7 indexes on Student model | 7 |
