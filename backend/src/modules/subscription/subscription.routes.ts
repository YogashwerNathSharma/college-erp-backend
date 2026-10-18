
import { Router } from "express";

import * as controller from "./subscription.controller";

import {
  authMiddleware,
} from "../../middleware/auth.middleware";

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

export default router;

