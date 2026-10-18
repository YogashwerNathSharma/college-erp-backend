import express from "express";
import { authMiddleware } from "../../middleware/auth.middleware";
import {
  getHelpdeskDashboard,
  getAllTickets,
  getTicketById,
  createTicket,
  updateTicket,
  addTicketComment,
  deleteTicket,
  getTicketCategories,
  createTicketCategory,
  deleteTicketCategory,
} from "./helpdesk.controller";

const router = express.Router();

// Dashboard
router.get("/dashboard", authMiddleware, getHelpdeskDashboard);

// Categories
router.get("/categories", authMiddleware, getTicketCategories);
router.post("/categories", authMiddleware, createTicketCategory);
router.delete("/categories/:id", authMiddleware, deleteTicketCategory);

// Tickets CRUD
router.get("/tickets", authMiddleware, getAllTickets);
router.get("/tickets/:id", authMiddleware, getTicketById);
router.post("/tickets", authMiddleware, createTicket);
router.put("/tickets/:id", authMiddleware, updateTicket);
router.post("/tickets/:id/comments", authMiddleware, addTicketComment);
router.delete("/tickets/:id", authMiddleware, deleteTicket);

export default router;
