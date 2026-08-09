# P0 consolidated security hardening

This branch consolidates the verified P0 authentication hardening changes on top of the current `main` branch without carrying stale PR branches forward.

Scope:
- P0-01: one-time public Super Admin bootstrap protection (already present on main)
- P0-02: remove shared default passwords and password debug logging
- P0-03: secure password reset OTP handling
- P0-04: login brute-force protection
- P0-05: tenant user registration authorization and tenantId isolation

The marker file is temporary and will be removed before merge.
