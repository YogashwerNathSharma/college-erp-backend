
// ============================================
// LIBRARY ROUTES — API endpoints define karo
// School ERP - Library Management Module
// Pattern: /api/library/...
// ============================================

import { Router } from "express";
import { authMiddleware } from "../../middleware/auth.middleware";
import { resolveTenant } from "../../middleware/tenant.middleware";
import { allowRoles } from "../../middleware/role.middleware";
import * as libraryController from "./library.controller";

const router = Router();

// Har route pe auth aur tenant middleware lagao
router.use(authMiddleware);
router.use(resolveTenant);

// ==================== DASHBOARD ====================
// GET /api/library/dashboard — Stats dikhao (Admin, Teacher, Principal)
router.get(
  "/dashboard",
  allowRoles("ADMIN", "TEACHER", "PRINCIPAL"),
  libraryController.getDashboard
);

// ==================== BOOKS ====================
// GET /api/library/books — Saari books (Admin)
router.get(
  "/books",
  allowRoles("ADMIN", "TEACHER", "PRINCIPAL"),
  libraryController.getAllBooks
);

// GET /api/library/books/search?q= — Search books (All roles)
router.get(
  "/books/search",
  allowRoles("ADMIN", "TEACHER", "STUDENT", "PRINCIPAL", "STAFF"),
  libraryController.searchBooks
);

// GET /api/library/books/:id — Single book details
router.get(
  "/books/:id",
  allowRoles("ADMIN", "TEACHER", "PRINCIPAL"),
  libraryController.getBookById
);

// POST /api/library/books — Nayi book add karo (Admin)
router.post(
  "/books",
  allowRoles("ADMIN"),
  libraryController.createBook
);

// PUT /api/library/books/:id — Book update karo (Admin)
router.put(
  "/books/:id",
  allowRoles("ADMIN"),
  libraryController.updateBook
);

// DELETE /api/library/books/:id — Book delete karo (Admin)
router.delete(
  "/books/:id",
  allowRoles("ADMIN"),
  libraryController.deleteBook
);

// ==================== CATEGORIES ====================
// GET /api/library/categories — Saari categories
router.get(
  "/categories",
  allowRoles("ADMIN", "TEACHER", "PRINCIPAL"),
  libraryController.getAllCategories
);

// POST /api/library/categories — Nayi category (Admin)
router.post(
  "/categories",
  allowRoles("ADMIN"),
  libraryController.createCategory
);

// DELETE /api/library/categories/:id — Category delete (Admin)
router.delete(
  "/categories/:id",
  allowRoles("ADMIN"),
  libraryController.deleteCategory
);

// ==================== MEMBERS ====================
// GET /api/library/members — Saare members (Admin)
router.get(
  "/members",
  allowRoles("ADMIN", "TEACHER", "PRINCIPAL"),
  libraryController.getAllMembers
);

// GET /api/library/members/search?q= — Members search (Admin, Teacher)
router.get(
  "/members/search",
  allowRoles("ADMIN", "TEACHER"),
  libraryController.searchMembers
);

// POST /api/library/members — Naya member register (Admin)
router.post(
  "/members",
  allowRoles("ADMIN"),
  libraryController.createMember
);

// PUT /api/library/members/:id — Member update (Admin)
router.put(
  "/members/:id",
  allowRoles("ADMIN"),
  libraryController.updateMember
);

// DELETE /api/library/members/:id — Member delete (Admin)
router.delete(
  "/members/:id",
  allowRoles("ADMIN"),
  libraryController.deleteMember
);

// ==================== ISSUE / RETURN ====================
// POST /api/library/issue — Book issue karo (Admin, Teacher)
router.post(
  "/issue",
  allowRoles("ADMIN", "TEACHER"),
  libraryController.issueBook
);

// POST /api/library/return — Book return karo (Admin, Teacher)
router.post(
  "/return",
  allowRoles("ADMIN", "TEACHER"),
  libraryController.returnBook
);

// POST /api/library/renew/:issueId — Book renew karo (Admin, Teacher)
router.post(
  "/renew/:issueId",
  allowRoles("ADMIN", "TEACHER"),
  libraryController.renewBook
);

// GET /api/library/active-issues/:memberId — Member ke active issues
router.get(
  "/active-issues/:memberId",
  allowRoles("ADMIN", "TEACHER"),
  libraryController.getActiveIssuesByMember
);

// POST /api/library/lost/:issueId — Book lost mark karo (Admin)
router.post(
  "/lost/:issueId",
  allowRoles("ADMIN"),
  libraryController.markBookLost
);

// ==================== HISTORY & OVERDUE ====================
// GET /api/library/history/:memberId — Member ki puri history
router.get(
  "/history/:memberId",
  allowRoles("ADMIN", "TEACHER", "PRINCIPAL"),
  libraryController.getMemberHistory
);

// GET /api/library/overdue — Overdue books ki list
router.get(
  "/overdue",
  allowRoles("ADMIN", "TEACHER", "PRINCIPAL"),
  libraryController.getOverdueBooks
);

// ==================== REPORTS ====================
// GET /api/library/reports/most-issued — Most issued books
router.get(
  "/reports/most-issued",
  allowRoles("ADMIN", "PRINCIPAL"),
  libraryController.getMostIssuedBooks
);

// GET /api/library/reports/category-stats — Category-wise stats
router.get(
  "/reports/category-stats",
  allowRoles("ADMIN", "PRINCIPAL"),
  libraryController.getCategoryStats
);

// ==================== SETTINGS ====================
// GET /api/library/settings — Library settings fetch
router.get(
  "/settings",
  allowRoles("ADMIN"),
  libraryController.getSettings
);

// PUT /api/library/settings — Library settings update
router.put(
  "/settings",
  allowRoles("ADMIN"),
  libraryController.updateSettings
);

export default router;

// ============================================
// USAGE: In your main app.ts / server.ts file:
//
// import libraryRoutes from "./modules/library/library.routes";
// app.use("/api/library", libraryRoutes);
// ============================================

