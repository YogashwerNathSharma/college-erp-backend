# P0-08 — Student Admission Tenant Reference Audit

Status: AUDIT ONLY — no application code changed.

Finding: `createStudent()` scopes the new Student to `req.tenantId`, but class/section/academicYear and caller-supplied master IDs are accepted as raw IDs. These related records should be validated against the same tenant before cross-tenant references are created.

Safety rule: do not merge a code fix until the complete current `student.service.ts` is available for an exact, minimal patch and the affected admission flow can be validated.

Target fix:
- Validate academicYearId belongs to tenantId.
- When classId/sectionId are supplied, validate both belong to tenantId.
- Validate supplied religionId/casteId/categoryId/nationalityId belong to tenantId.
- Preserve existing API shape and successful same-tenant admission behavior.
- No schema migration.
