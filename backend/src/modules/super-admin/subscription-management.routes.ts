import { Router } from "express";
import { authMiddleware } from "../../middleware/auth.middleware";
import { allowRoles } from "../../middleware/role.middleware";
import {
  getPlans,
  createPlan,
  updatePlan,
  deletePlan,
  duplicatePlan,
  getBillingHistory,
  getInvoices,
  getInvoiceDetail,
  getCoupons,
  createCoupon,
  updateCoupon,
  deleteCoupon,
  toggleCouponStatus,
  getRefunds,
  processRefund,
  updateRefundStatus,
  getTaxConfig,
  updateTaxConfig,
  getRevenueAnalytics,
  getExpiringSubscriptions,
  bulkRenewSubscriptions,
  getSubscriptionStats,
} from "./subscription-management.controller";

const router = Router();

// All routes require SUPER_ADMIN
router.use(authMiddleware, allowRoles("SUPER_ADMIN"));

// ══════════════════════════════════════════════════════════════
// PLANS
// ══════════════════════════════════════════════════════════════
router.get("/plans", getPlans);
router.post("/plans", createPlan);
router.put("/plans/:id", updatePlan);
router.delete("/plans/:id", deletePlan);
router.post("/plans/:id/duplicate", duplicatePlan);

// ══════════════════════════════════════════════════════════════
// BILLING HISTORY
// ══════════════════════════════════════════════════════════════
router.get("/billing", getBillingHistory);

// ══════════════════════════════════════════════════════════════
// INVOICES
// ══════════════════════════════════════════════════════════════
router.get("/invoices", getInvoices);
router.get("/invoices/:id", getInvoiceDetail);
router.post("/invoices/generate", getInvoiceDetail); // Generate reuses detail

// ══════════════════════════════════════════════════════════════
// COUPONS & PROMOS
// ══════════════════════════════════════════════════════════════
router.get("/coupons", getCoupons);
router.post("/coupons", createCoupon);
router.put("/coupons/:id", updateCoupon);
router.delete("/coupons/:id", deleteCoupon);
router.patch("/coupons/:id/toggle", toggleCouponStatus);

// ══════════════════════════════════════════════════════════════
// TAX / GST CONFIGURATION
// ══════════════════════════════════════════════════════════════
router.get("/tax", getTaxConfig);
router.put("/tax", updateTaxConfig);

// ══════════════════════════════════════════════════════════════
// REFUNDS
// ══════════════════════════════════════════════════════════════
router.get("/refunds", getRefunds);
router.post("/refunds/:id/process", processRefund);
router.put("/refunds/:id/status", updateRefundStatus);

// ══════════════════════════════════════════════════════════════
// ANALYTICS
// ══════════════════════════════════════════════════════════════
router.get("/analytics", getRevenueAnalytics);

// ══════════════════════════════════════════════════════════════
// RENEWALS & STATS
// ══════════════════════════════════════════════════════════════
router.get("/expiring", getExpiringSubscriptions);
router.post("/bulk-renew", bulkRenewSubscriptions);
router.get("/stats", getSubscriptionStats);

export default router;
