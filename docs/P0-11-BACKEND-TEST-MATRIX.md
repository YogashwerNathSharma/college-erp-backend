# P0-11 Backend Security Test Matrix

This matrix is the required API-level verification before merging P0-11.

## Tenant A authenticated context

| Case | Request | Expected | DB mutation |
|---|---|---|---|
| A1 | Valid A student + A class + A section + A academic year | 200 | Allowed |
| A2 | A token + B student | 4xx | None |
| A3 | A token + B class | 4xx | None |
| A4 | A token + B section | 4xx | None |
| A5 | A token + B academic year | 4xx | None |
| A6 | A student + mismatched A class/section/year enrollment | 4xx | None |
| A7 | Valid A attendance update | 200 | Allowed |
| A8 | A token + B student attendance history | Empty/tenant-safe response | None |
| A9 | A token + B student monthly report | Empty/tenant-safe response | None |
| A10 | A token + B student academic summary | Empty/tenant-safe response | None |
| A11 | A token + B class/section dashboard references | No B data exposed | None |

## Acceptance

- All cross-tenant mutation attempts are rejected before `createMany`/update mutation.
- No Tenant B record is created or modified by Tenant A.
- Same-tenant marking and update remain successful.
- Read/report endpoints never return foreign-tenant attendance records.
- Results must be verified against the database, not only HTTP status codes.

## Execution

Run against a non-production/staging database with two dedicated test tenants. Record request, response status/body, and before/after database counts for each case. Do not use production data.
