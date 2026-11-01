
// ============================================
// LIBRARY ROUTES — API endpoints define karo
// School ERP - Library Management Module
// Pattern: /api/library/...
// ============================================

import { Router } from "express";
import { authMiddleware } from "../../middleware/auth.middleware";
import { resolveTenant } from "../../middleware/tenant.middleware";
import { resolveAcademicYear } from "../../middleware/academicYear.middleware";
import { allowRoles } from "../../middleware/role.middleware";
import * as libraryController from "./library.controller";
import { requirePermission } from "../../middleware/permission.middleware";

const router = Router();

// Har route pe auth aur tenant middleware lagao
router.use(authMiddleware);
router.use(resolveTenant, resolveAcademicYear);

// ==================== DASHBOARD ====================
// GET /api/library/dashboard — Stats dikhao (Admin, Teacher, Principal)
router.get(
  "/dashboard",
  requirePermission("library.view"),
  libraryController.getDashboard
);

// ==================== BOOKS ====================
// GET /api/library/books — Saari books (Admin)
router.get(
  "/books",
  requirePermission("library.view"),
  libraryController.getAllBooks
);

// GET /api/library/books/search?q= — Search books (All roles)
router.get(
  "/books/search",
  requirePermission("library.view"),
  libraryController.searchBooks
);

// GET /api/library/books/:id — Single book details
router.get(
  "/books/:id",
  requirePermission("library.view"),
  libraryController.getBookById
);

// POST /api/library/books — Nayi book add karo (Admin)
router.post(
  "/books",
  requirePermission("library.manage"),
  libraryController.createBook
);

// PUT /api/library/books/:id — Book update karo (Admin)
router.put(
  "/books/:id",
  requirePermission("library.manage"),
  libraryController.updateBook
);

// DELETE /api/library/books/:id — Book delete karo (Admin)
router.delete(
  "/books/:id",
  requirePermission("library.manage"),
  libraryController.deleteBook
);

// ==================== CATEGORIES ====================
// GET /api/library/categories — Saari categories
router.get(
  "/categories",
  requirePermission("library.view"),
  libraryController.getAllCategories
);

// POST /api/library/categories — Nayi category (Admin)
router.post(
  "/categories",
  requirePermission("library.manage"),
  libraryController.createCategory
);

// DELETE /api/library/categories/:id — Category delete (Admin)
router.delete(
  "/categories/:id",
  requirePermission("library.manage"),
  libraryController.deleteCategory
);

// ==================== MEMBERS ====================
// GET /api/library/members — Saare members (Admin)
router.get(
  "/members",
  requirePermission("library.view"),
  libraryController.getAllMembers
);

// GET /api/library/members/search?q= — Members search (Admin, Teacher)
router.get(
  "/members/search",
  requirePermission("library.manage"),
  libraryController.searchMembers
);

// POST /api/library/members — Naya member register (Admin)
router.post(
  "/members",
  requirePermission("library.manage"),
  libraryController.createMember
);

// PUT /api/library/members/:id — Member update (Admin)
router.put(
  "/members/:id",
  requirePermission("library.manage"),
  libraryController.updateMember
);

// DELETE /api/library/members/:id — Member delete (Admin)
router.delete(
  "/members/:id",
  requirePermission("library.manage"),
  libraryController.deleteMember
);

// ==================== ISSUE / RETURN ====================
// POST /api/library/issue — Book issue karo (Admin, Teacher)
router.post(
  "/issue",
  requirePermission("library.manage"),
  libraryController.issueBook
);

// POST /api/library/return — Book return karo (Admin, Teacher)
router.post(
  "/return",
  requirePermission("library.manage"),
  libraryController.returnBook
);

// POST /api/library/renew/:issueId — Book renew karo (Admin, Teacher)
router.post(
  "/renew/:issueId",
  requirePermission("library.manage"),
  libraryController.renewBook
);

// GET /api/library/active-issues/:memberId — Member ke active issues
router.get(
  "/active-issues/:memberId",
  requirePermission("library.manage"),
  libraryController.getActiveIssuesByMember
);

// POST /api/library/lost/:issueId — Book lost mark karo (Admin)
router.post(
  "/lost/:issueId",
  requirePermission("library.manage"),
  libraryController.markBookLost
);

// ==================== HISTORY & OVERDUE ====================
// GET /api/library/history/:memberId — Member ki puri history
router.get(
  "/history/:memberId",
  requirePermission("library.view"),
  libraryController.getMemberHistory
);

// GET /api/library/overdue — Overdue books ki list
router.get(
  "/overdue",
  requirePermission("library.view"),
  libraryController.getOverdueBooks
);

// ==================== REPORTS ====================
// GET /api/library/reports/most-issued — Most issued books
router.get(
  "/reports/most-issued",
  requirePermission("library.manage"),
  libraryController.getMostIssuedBooks
);

// GET /api/library/reports/category-stats — Category-wise stats
router.get(
  "/reports/category-stats",
  requirePermission("library.manage"),
  libraryController.getCategoryStats
);

// ==================== SETTINGS ====================
// GET /api/library/settings — Library settings fetch
router.get(
  "/settings",
  requirePermission("library.manage"),
  libraryController.getSettings
);

// PUT /api/library/settings — Library settings update
router.put(
  "/settings",
  requirePermission("library.manage"),
  libraryController.updateSettings
);

export default router;

// ============================================
// USAGE: In your main app.ts / server.ts file:
//
// import libraryRoutes from "./modules/library/library.routes";
// app.use("/api/library", libraryRoutes);
// ============================================

