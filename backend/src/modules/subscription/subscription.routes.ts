
import { Router } from "express";

import * as controller from "./subscription.controller";

import {
  authMiddleware,
} from "../../middleware/auth.middleware";
import {
  getExpiringSubscriptions,
  getGracePeriodSubscriptions,
  getSubscriptionStats,
} from "./subscription-reminder.service";

const router = Router();

//////////////////////////////////////////////////////////////
// 🔥 GET PLANS — Accessible to logged-in users (even expired)
// (authMiddleware only, no superAdminOnly for GET plans)
//////////////////////////////////////////////////////////////

router.get(
  "/plans",
  authMiddleware,
  controller.getPlans
);

router.get(
  "/plans/:id",
  authMiddleware,
  controller.getSinglePlan
);

//////////////////////////////////////////////////////////////
// 🔥 ASSIGN SUBSCRIPTION — Accessible to logged-in users
// (so expired users can subscribe to a new plan)
//////////////////////////////////////////////////////////////

router.post(
  "/assign",
  authMiddleware,
  controller.assignSubscription
);

//////////////////////////////////////////////////////////////
// 🔥 GET TENANT SUBSCRIPTION — Accessible to logged-in users
//////////////////////////////////////////////////////////////

router.get(
  "/tenant/:tenantId",
  authMiddleware,
  controller.getTenantSubscription
);

//////////////////////////////////////////////////////////////
// 🚀 SUPER ADMIN ONLY ROUTES BELOW
//////////////////////////////////////////////////////////////

const superAdminOnly = (
  req: any,
  res: any,
  next: any
) => {
  if (req.user?.role !== "SUPER_ADMIN") {
    return res.status(403).json({
      success: false,
      message: "Access denied",
    });
  }
  next();
};

// CREATE/UPDATE/DELETE PLANS — SuperAdmin only
router.post(
  "/plans",
  authMiddleware,
  superAdminOnly,
  controller.createPlan
);

router.put(
  "/plans/:id",
  authMiddleware,
  superAdminOnly,
  controller.updatePlan
);

router.delete(
  "/plans/:id",
  authMiddleware,
  superAdminOnly,
  controller.deletePlan
);

// GET ALL SUBSCRIPTIONS — SuperAdmin only
router.get(
  "/",
  authMiddleware,
  superAdminOnly,
  controller.getSubscriptions
);

// CANCEL SUBSCRIPTION — SuperAdmin only
router.put(
  "/cancel/:id",
  authMiddleware,
  superAdminOnly,
  controller.cancelSubscription
);

// RENEW SUBSCRIPTION — SuperAdmin only
router.put(
  "/renew/:id",
  authMiddleware,
  superAdminOnly,
  controller.renewSubscription
);

// ─────────────────────────────────────────────────────────────
// SUBSCRIPTION REMINDER / STATUS ENDPOINTS (Super Admin only)
// ─────────────────────────────────────────────────────────────

// GET /api/subscriptions/expiring?days=7  — Tenants expiring within N days
router.get(
  "/expiring",
  authMiddleware,
  superAdminOnly,
  async (req: any, res: any) => {
    try {
      const days = parseInt(req.query.days as string) || 7;
      const data = await getExpiringSubscriptions(days);
      res.json({ success: true, data, count: data.length });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
);

// GET /api/subscriptions/grace-period  — Tenants in grace period
router.get(
  "/grace-period",
  authMiddleware,
  superAdminOnly,
  async (req: any, res: any) => {
    try {
      const data = await getGracePeriodSubscriptions();
      res.json({ success: true, data, count: data.length });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
);

// GET /api/subscriptions/stats  — Summary stats
router.get(
  "/stats",
  authMiddleware,
  superAdminOnly,
  async (req: any, res: any) => {
    try {
      const data = await getSubscriptionStats();
      res.json({ success: true, data });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
);

export default router;

