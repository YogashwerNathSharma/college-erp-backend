# P0-10 Fee & Payment Tenant Isolation — Security Test Plan

## Scope

Validate that fee and online-payment APIs cannot cross tenant boundaries and that normal same-tenant flows remain unchanged.

## Test Matrix

| ID | Scenario | Expected |
|---|---|---|
| P010-01 | Same-tenant fee assignment | Allowed |
| P010-02 | Same-tenant fee collection | Allowed |
| P010-03 | Same-tenant student-fee lookup | Allowed |
| P010-04 | Same-tenant payment order using valid student | Allowed |
| P010-05 | Cross-tenant student reference in payment order/link | Reject |
| P010-06 | Cross-tenant fee reference in payment order | Reject |
| P010-07 | studentId and feeId belong to different students | Reject |
| P010-08 | Fee route without tenant context | Reject |
| P010-09 | Cross-tenant fee collection using another tenant's studentFeeId | Reject |
| P010-10 | Cross-tenant payment transaction query | No foreign-tenant records returned |

## Acceptance Criteria

1. No test may create, modify, refund, or expose another tenant's payment/fee data.
2. Existing valid same-tenant fee collection and payment flows continue to work.
3. Webhook remains unauthenticated at the HTTP layer because the gateway calls it directly; webhook ownership must continue to be derived from the stored payment/order and verified gateway signature.
4. Validation must happen before creating an online payment record.
5. No Prisma schema changes are required for this phase.

## Manual/API Security Test

Use two test tenants (Tenant A and Tenant B) and valid records belonging to each. Authenticate as Tenant A and intentionally submit Tenant B's student/fee IDs to the protected endpoints. Expected result is a 4xx response and no database mutation in Tenant B.

## Regression

After security tests pass, perform normal UI smoke tests for:

- Fee assignment
- Fee collection
- Receipt generation
- Defaulter list
- Daily collection
- Payment gateway order creation
- Payment verification
- Payment links

Do not merge P0-10 solely on manual success; retain these cases as the regression checklist for future changes.
