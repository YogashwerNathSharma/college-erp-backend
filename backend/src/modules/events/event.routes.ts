import express from "express";
import { authMiddleware } from "../../middleware/auth.middleware";
import {
  getEventDashboard,
  getAllEvents,
  getEventById,
  createEvent,
  updateEvent,
  deleteEvent,
  getEventCategories,
  createEventCategory,
  deleteEventCategory,
} from "./event.controller";

const router = express.Router();

// Dashboard
router.get("/dashboard", authMiddleware, getEventDashboard);

// Categories (must be before /:id to avoid conflict)
router.get("/categories", authMiddleware, getEventCategories);
router.post("/categories", authMiddleware, createEventCategory);
router.delete("/categories/:id", authMiddleware, deleteEventCategory);

// CRUD
router.get("/", authMiddleware, getAllEvents);
router.get("/:id", authMiddleware, getEventById);
router.post("/", authMiddleware, createEvent);
router.put("/:id", authMiddleware, updateEvent);
router.delete("/:id", authMiddleware, deleteEvent);

export default router;
