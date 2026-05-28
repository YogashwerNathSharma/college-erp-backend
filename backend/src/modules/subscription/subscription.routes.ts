import { Router } from "express";

import * as controller
from "./subscription.controller";

import {
  authMiddleware,
} from "../../middleware/auth.middleware";

const router = Router();

//////////////////////////////////////////////////////////////
// 🚀 SUPER ADMIN ONLY
//////////////////////////////////////////////////////////////

const superAdminOnly = (
  req: any,
  res: any,
  next: any
) => {

  if (
    req.user?.role !== "SUPER_ADMIN"
  ) {

    return res.status(403).json({
      success: false,
      message: "Access denied",
    });

  }

  next();
};

//////////////////////////////////////////////////////////////
// 🚀 GLOBAL MIDDLEWARES
//////////////////////////////////////////////////////////////

router.use(authMiddleware);

router.use(superAdminOnly);

//////////////////////////////////////////////////////////////
// 🚀 PLAN ROUTES
//////////////////////////////////////////////////////////////

router.post(
  "/plans",
  controller.createPlan
);

router.get(
  "/plans",
  controller.getPlans
);

router.get(
  "/plans/:id",
  controller.getSinglePlan
);

router.put(
  "/plans/:id",
  controller.updatePlan
);

router.delete(
  "/plans/:id",
  controller.deletePlan
);

//////////////////////////////////////////////////////////////
// 🚀 SUBSCRIPTION ROUTES
//////////////////////////////////////////////////////////////

// ASSIGN PLAN
router.post(
  "/assign",
  controller.assignSubscription
);

// GET ALL SUBSCRIPTIONS
router.get(
  "/",
  controller.getSubscriptions
);

// GET TENANT ACTIVE SUBSCRIPTION
router.get(
  "/tenant/:tenantId",
  controller.getTenantSubscription
);

// CANCEL SUBSCRIPTION
router.put(
  "/cancel/:id",
  controller.cancelSubscription
);

// RENEW SUBSCRIPTION
router.post(
  "/renew/:id",
  controller.renewSubscription
);

export default router;