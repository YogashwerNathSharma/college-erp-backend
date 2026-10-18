# P0-11 Attendance Security Audit

Attendance routes are authenticated and tenant-resolved. Service queries include tenantId. Hardening target: validate class/section/academic-year ownership and student enrollment before writes so attendance cannot be written across tenant/class/section/year boundaries.