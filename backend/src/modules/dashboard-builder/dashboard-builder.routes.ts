import { Router } from "express";
import {
  getLayouts,
  getLayoutById,
  createLayout,
  updateLayout,
  deleteLayout,
  getWidgets,
  createWidget,
  deleteWidget,
  getWidgetData,
} from "./dashboard-builder.controller";

import { authMiddleware } from '../../middleware/auth.middleware';
import { resolveTenant } from '../../middleware/tenant.middleware';

const router = Router();

// Auth + Tenant middleware
router.use(authMiddleware);
router.use(resolveTenant);


// Layout CRUD
router.get("/layouts", getLayouts);
router.get("/layouts/:id", getLayoutById);
router.post("/layouts", createLayout);
router.put("/layouts/:id", updateLayout);
router.delete("/layouts/:id", deleteLayout);

// Widget catalog
router.get("/widgets", getWidgets);
router.post("/widgets", createWidget);
router.delete("/widgets/:id", deleteWidget);

// Widget data provider
router.get("/data/:widgetType", getWidgetData);

export default router;
