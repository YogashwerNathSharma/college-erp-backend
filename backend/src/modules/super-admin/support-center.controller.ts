// ═══════════════════════════════════════════════════════════
// SUPPORT CENTER CONTROLLER
// ═══════════════════════════════════════════════════════════

import { Request, Response } from "express";
import * as supportService from "./support-center.service";

// ─── Tickets ─────────────────────────────────────────────

export async function getTickets(req: Request, res: Response) {
  try {
    const result = await supportService.getTickets({
      status: req.query.status as any,
      priority: req.query.priority as any,
      assignedTo: req.query.assignedTo as string,
      search: req.query.search as string,
      page: parseInt(req.query.page as string) || 1,
      limit: parseInt(req.query.limit as string) || 25,
      sortBy: req.query.sortBy as string,
      sortOrder: req.query.sortOrder as any,
    });
    res.json({ success: true, ...result });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

export async function getTicketById(req: Request, res: Response) {
  try {
    const ticket = await supportService.getTicketById(req.params.id);
    if (!ticket) return res.status(404).json({ success: false, message: "Ticket not found" });
    res.json({ success: true, ticket });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

export async function createTicket(req: Request, res: Response) {
  try {
    const ticket = await supportService.createTicket({
      ...req.body,
      reportedBy: (req as any).user?.id || req.body.reportedBy,
    });
    res.json({ success: true, ticket });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

export async function updateTicket(req: Request, res: Response) {
  try {
    const ticket = await supportService.updateTicket(req.params.id, req.body);
    res.json({ success: true, ticket });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

export async function assignTicket(req: Request, res: Response) {
  try {
    const ticket = await supportService.assignTicket(req.params.id, req.body.assigneeId);
    res.json({ success: true, ticket });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

export async function resolveTicket(req: Request, res: Response) {
  try {
    const ticket = await supportService.resolveTicket(req.params.id, req.body.resolution);
    res.json({ success: true, ticket });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

export async function addComment(req: Request, res: Response) {
  try {
    const comment = await supportService.addTicketComment(
      req.params.id,
      (req as any).user?.id || req.body.authorId,
      req.body.content
    );
    res.json({ success: true, comment });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

export async function getTicketStats(req: Request, res: Response) {
  try {
    const stats = await supportService.getTicketStats();
    res.json({ success: true, stats });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

// ─── Knowledge Base ──────────────────────────────────────

export async function getKBArticles(req: Request, res: Response) {
  try {
    const articles = await supportService.getKBArticles({
      category: req.query.category as string,
      search: req.query.search as string,
      published: req.query.published === "true" ? true : req.query.published === "false" ? false : undefined,
    });
    res.json({ success: true, articles });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

export async function getKBArticleById(req: Request, res: Response) {
  try {
    const article = await supportService.getKBArticleById(req.params.id);
    if (!article) return res.status(404).json({ success: false, message: "Article not found" });
    res.json({ success: true, article });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

export async function createKBArticle(req: Request, res: Response) {
  try {
    const article = await supportService.createKBArticle(req.body);
    res.json({ success: true, article });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

export async function updateKBArticle(req: Request, res: Response) {
  try {
    const article = await supportService.updateKBArticle(req.params.id, req.body);
    res.json({ success: true, article });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

export async function deleteKBArticle(req: Request, res: Response) {
  try {
    await supportService.deleteKBArticle(req.params.id);
    res.json({ success: true, message: "Article deleted" });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

// ─── Announcements ───────────────────────────────────────

export async function getAnnouncements(req: Request, res: Response) {
  try {
    const activeOnly = req.query.active === "true";
    const announcements = await supportService.getAnnouncements(activeOnly);
    res.json({ success: true, announcements });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

export async function createAnnouncement(req: Request, res: Response) {
  try {
    const announcement = await supportService.createAnnouncement(req.body);
    res.json({ success: true, announcement });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

export async function updateAnnouncement(req: Request, res: Response) {
  try {
    const announcement = await supportService.updateAnnouncement(req.params.id, req.body);
    res.json({ success: true, announcement });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

export async function deleteAnnouncement(req: Request, res: Response) {
  try {
    await supportService.deleteAnnouncement(req.params.id);
    res.json({ success: true, message: "Announcement deleted" });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

// ─── Maintenance Mode ────────────────────────────────────

export async function getMaintenanceStatus(req: Request, res: Response) {
  try {
    const status = await supportService.getMaintenanceStatus();
    res.json({ success: true, ...status });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

export async function toggleMaintenance(req: Request, res: Response) {
  try {
    const { enabled, message, scheduledEnd } = req.body;
    await supportService.toggleMaintenanceMode(enabled, message, scheduledEnd);
    res.json({ success: true, message: `Maintenance mode ${enabled ? "enabled" : "disabled"}` });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

// ─── System Status ───────────────────────────────────────

export async function getSystemStatus(req: Request, res: Response) {
  try {
    const status = await supportService.getSystemStatus();
    res.json({ success: true, ...status });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}
