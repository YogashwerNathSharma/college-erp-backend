# P0-11 Attendance Tenant Isolation Audit

## Scope
Audit student attendance writes, reads, reports, and dashboard queries for tenant-boundary enforcement.

## Findings

1. Attendance routes already require `authMiddleware` and `resolveTenant`.
2. Attendance writes trust client-supplied class, section, academic-year, and student IDs beyond the `tenantId` filter on attendance records.
3. A malicious tenant user could attempt to create attendance rows for another tenant's student or mismatched class/section/year references.
4. Dashboard class and absent-student enrichment queries must also remain tenant-scoped.

## Required controls

- Validate class, section, and academic year references against the authenticated tenant before attendance writes.
- Validate every submitted student belongs to the tenant and has an active enrollment matching the supplied class/section/year.
- Keep all attendance reads tenant-scoped.
- Keep dashboard enrichment queries tenant-scoped.
- Preserve existing successful same-tenant API response shapes.

## Acceptance

- Same-tenant marking/update continues to work.
- Cross-tenant or mismatched student/class/section/year references are rejected before mutation.
- Cross-tenant attendance history/report/summary/dashboard data is not returned.
- No Prisma schema change is required.
