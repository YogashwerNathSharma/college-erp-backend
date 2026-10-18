
// ============================================
// LIBRARY CONTROLLER — Request handlers with error handling
// School ERP - Library Management Module
// ============================================

import { Response } from "express";
import * as libraryService from "./library.service";

// ==================== DASHBOARD ====================
// Dashboard stats dikhao — admin/principal/teacher ke liye
export const getDashboard = async (req: any, res: Response) => {
  try {
    console.log("📊 [Controller] Dashboard stats request aaya");
    const stats = await libraryService.getDashboardStats(req.tenantId!);
    res.json({ success: true, data: stats });
  } catch (error: any) {
    console.error("❌ Dashboard fetch error:", error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==================== BOOKS ====================
// Saari books fetch karo with filters
export const getAllBooks = async (req: any, res: Response) => {
  try {
    const { page, limit, search, categoryId, author, language, available } = req.query;
    console.log("📚 [Controller] Books list request — Query:", req.query);

    const filters = {
      page: page ? parseInt(page as string) : 1,
      limit: limit ? parseInt(limit as string) : 10,
      search: search as string,
      categoryId: categoryId as string,
      author: author as string,
      language: language as string,
      available: available !== undefined ? available === "true" : undefined,
    };

    const result = await libraryService.getAllBooks(req.tenantId!, filters);
    res.json({ success: true, data: result });
  } catch (error: any) {
    console.error("❌ Books fetch error:", error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Single book fetch karo
export const getBookById = async (req: any, res: Response) => {
  try {
    const { id } = req.params;
    console.log("📖 [Controller] Book details request — ID:", id);
    const book = await libraryService.getBookById(req.tenantId!, id);
    res.json({ success: true, data: book });
  } catch (error: any) {
    console.error("❌ Book fetch error:", error.message);
    res.status(404).json({ success: false, message: error.message });
  }
};

// Nayi book create karo
export const createBook = async (req: any, res: Response) => {
  try {
    console.log("📖 [Controller] New book create request:", req.body.title);
    const book = await libraryService.createBook(req.tenantId!, req.body);
    res.status(201).json({ success: true, data: book, message: "Book added successfully!" });
  } catch (error: any) {
    console.error("❌ Book create error:", error.message);
    res.status(400).json({ success: false, message: error.message });
  }
};

// Book update karo
export const updateBook = async (req: any, res: Response) => {
  try {
    const { id } = req.params;
    console.log("✏️ [Controller] Book update request — ID:", id);
    const book = await libraryService.updateBook(req.tenantId!, id, req.body);
    res.json({ success: true, data: book, message: "Book updated successfully!" });
  } catch (error: any) {
    console.error("❌ Book update error:", error.message);
    res.status(400).json({ success: false, message: error.message });
  }
};

// Book delete karo
export const deleteBook = async (req: any, res: Response) => {
  try {
    const { id } = req.params;
    console.log("🗑️ [Controller] Book delete request — ID:", id);
    await libraryService.deleteBook(req.tenantId!, id);
    res.json({ success: true, message: "Book deleted successfully!" });
  } catch (error: any) {
    console.error("❌ Book delete error:", error.message);
    res.status(400).json({ success: false, message: error.message });
  }
};

// Books search — universal search for all roles
export const searchBooks = async (req: any, res: Response) => {
  try {
    const { q } = req.query;
    console.log("🔍 [Controller] Book search request — Query:", q);
    const books = await libraryService.searchBooks(req.tenantId!, q as string);
    res.json({ success: true, data: books });
  } catch (error: any) {
    console.error("❌ Book search error:", error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==================== CATEGORIES ====================
// Saari categories fetch karo
export const getAllCategories = async (req: any, res: Response) => {
  try {
    console.log("📂 [Controller] Categories fetch request");
    const categories = await libraryService.getAllCategories(req.tenantId!);
    res.json({ success: true, data: categories });
  } catch (error: any) {
    console.error("❌ Categories fetch error:", error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Nayi category create karo
export const createCategory = async (req: any, res: Response) => {
  try {
    console.log("📂 [Controller] New category create request:", req.body.name);
    const category = await libraryService.createCategory(req.tenantId!, req.body);
    res.status(201).json({ success: true, data: category, message: "Category created!" });
  } catch (error: any) {
    console.error("❌ Category create error:", error.message);
    res.status(400).json({ success: false, message: error.message });
  }
};

// Category delete karo
export const deleteCategory = async (req: any, res: Response) => {
  try {
    const { id } = req.params;
    console.log("🗑️ [Controller] Category delete request — ID:", id);
    const result = await libraryService.deleteCategory(req.tenantId!, id);
    res.json({ success: true, ...result });
  } catch (error: any) {
    console.error("❌ Category delete error:", error.message);
    res.status(400).json({ success: false, message: error.message });
  }
};

// ==================== MEMBERS ====================
// Saare members fetch karo
export const getAllMembers = async (req: any, res: Response) => {
  try {
    const { page, limit, search, memberType, status } = req.query;
    console.log("👥 [Controller] Members list request — Query:", req.query);

    const filters = {
      page: page ? parseInt(page as string) : 1,
      limit: limit ? parseInt(limit as string) : 10,
      search: search as string,
      memberType: memberType as string,
      status: status as string,
    };

    const result = await libraryService.getAllMembers(req.tenantId!, filters);
    res.json({ success: true, data: result });
  } catch (error: any) {
    console.error("❌ Members fetch error:", error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Naya member create karo
export const createMember = async (req: any, res: Response) => {
  try {
    console.log("👤 [Controller] New member create request:", req.body.name);
    const member = await libraryService.createMember(req.tenantId!, req.body);
    res.status(201).json({ success: true, data: member, message: "Member registered successfully!" });
  } catch (error: any) {
    console.error("❌ Member create error:", error.message);
    res.status(400).json({ success: false, message: error.message });
  }
};

// Member update karo
export const updateMember = async (req: any, res: Response) => {
  try {
    const { id } = req.params;
    console.log("✏️ [Controller] Member update request — ID:", id);
    const member = await libraryService.updateMember(req.tenantId!, id, req.body);
    res.json({ success: true, data: member, message: "Member updated successfully!" });
  } catch (error: any) {
    console.error("❌ Member update error:", error.message);
    res.status(400).json({ success: false, message: error.message });
  }
};

// Member delete karo
export const deleteMember = async (req: any, res: Response) => {
  try {
    const { id } = req.params;
    console.log("🗑️ [Controller] Member delete request — ID:", id);
    const result = await libraryService.deleteMember(req.tenantId!, id);
    res.json({ success: true, ...result });
  } catch (error: any) {
    console.error("❌ Member delete error:", error.message);
    res.status(400).json({ success: false, message: error.message });
  }
};

// Members search — quick search for issue/return forms
export const searchMembers = async (req: any, res: Response) => {
  try {
    const { q } = req.query;
    console.log("🔍 [Controller] Member search request — Query:", q);
    const members = await libraryService.searchMembers(req.tenantId!, q as string);
    res.json({ success: true, data: members });
  } catch (error: any) {
    console.error("❌ Member search error:", error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==================== ISSUE / RETURN ====================
// Book issue karo
export const issueBook = async (req: any, res: Response) => {
  try {
    const { bookId, memberId, remarks } = req.body;
    console.log("📤 [Controller] Book issue request — Book:", bookId, "Member:", memberId);

    const issue = await libraryService.issueBook(req.tenantId!, {
      bookId,
      memberId,
      issuedBy: req.user?.name || "Admin",
      remarks,
    });

    res.status(201).json({ success: true, data: issue, message: "Book issued successfully!" });
  } catch (error: any) {
    console.error("❌ Book issue error:", error.message);
    res.status(400).json({ success: false, message: error.message });
  }
};

// Book return karo
export const returnBook = async (req: any, res: Response) => {
  try {
    const { issueId, fineStatus, remarks } = req.body;
    console.log("📥 [Controller] Book return request — Issue ID:", issueId);

    const returned = await libraryService.returnBook(req.tenantId!, {
      issueId,
      returnedBy: req.user?.name || "Admin",
      fineStatus,
      remarks,
    });

    res.json({ success: true, data: returned, message: "Book returned successfully!" });
  } catch (error: any) {
    console.error("❌ Book return error:", error.message);
    res.status(400).json({ success: false, message: error.message });
  }
};

// Book renew karo
export const renewBook = async (req: any, res: Response) => {
  try {
    const { issueId } = req.params;
    console.log("🔄 [Controller] Book renew request — Issue ID:", issueId);
    const renewed = await libraryService.renewBook(req.tenantId!, issueId);
    res.json({ success: true, data: renewed, message: "Book renewed successfully!" });
  } catch (error: any) {
    console.error("❌ Book renew error:", error.message);
    res.status(400).json({ success: false, message: error.message });
  }
};

// Member ka active issues fetch karo (for return form)
export const getActiveIssuesByMember = async (req: any, res: Response) => {
  try {
    const { memberId } = req.params;
    console.log("📋 [Controller] Active issues for member:", memberId);
    const issues = await libraryService.getActiveIssuesByMember(req.tenantId!, memberId);
    res.json({ success: true, data: issues });
  } catch (error: any) {
    console.error("❌ Active issues fetch error:", error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Book lost mark karo
export const markBookLost = async (req: any, res: Response) => {
  try {
    const { issueId } = req.params;
    console.log("❌ [Controller] Mark book lost — Issue ID:", issueId);
    const result = await libraryService.markBookLost(req.tenantId!, issueId, req.user?.name || "Admin");
    res.json({ success: true, data: result, message: "Book marked as lost. Fine applied." });
  } catch (error: any) {
    console.error("❌ Mark lost error:", error.message);
    res.status(400).json({ success: false, message: error.message });
  }
};

// ==================== HISTORY & OVERDUE ====================
// Member ki history dikhao
export const getMemberHistory = async (req: any, res: Response) => {
  try {
    const { memberId } = req.params;
    console.log("📜 [Controller] Member history request — ID:", memberId);
    const history = await libraryService.getMemberHistory(req.tenantId!, memberId);
    res.json({ success: true, data: history });
  } catch (error: any) {
    console.error("❌ History fetch error:", error.message);
    res.status(400).json({ success: false, message: error.message });
  }
};

// Overdue books list dikhao
export const getOverdueBooks = async (req: any, res: Response) => {
  try {
    console.log("⚠️ [Controller] Overdue books request");
    const overdueList = await libraryService.getOverdueBooks(req.tenantId!);
    res.json({ success: true, data: overdueList });
  } catch (error: any) {
    console.error("❌ Overdue fetch error:", error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==================== REPORTS ====================
// Most issued books report
export const getMostIssuedBooks = async (req: any, res: Response) => {
  try {
    const { limit } = req.query;
    console.log("📊 [Controller] Most issued books report request");
    const report = await libraryService.getMostIssuedBooks(
      req.tenantId!,
      limit ? parseInt(limit as string) : 10
    );
    res.json({ success: true, data: report });
  } catch (error: any) {
    console.error("❌ Report error:", error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Category stats report
export const getCategoryStats = async (req: any, res: Response) => {
  try {
    console.log("📊 [Controller] Category stats report request");
    const stats = await libraryService.getCategoryStats(req.tenantId!);
    res.json({ success: true, data: stats });
  } catch (error: any) {
    console.error("❌ Report error:", error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==================== SETTINGS ====================
// Settings fetch karo
export const getSettings = async (req: any, res: Response) => {
  try {
    console.log("⚙️ [Controller] Settings fetch request");
    const settings = await libraryService.getLibrarySettings(req.tenantId!);
    res.json({ success: true, data: settings });
  } catch (error: any) {
    console.error("❌ Settings fetch error:", error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Settings update karo
export const updateSettings = async (req: any, res: Response) => {
  try {
    console.log("⚙️ [Controller] Settings update request:", req.body);
    const settings = await libraryService.updateLibrarySettings(req.tenantId!, req.body);
    res.json({ success: true, data: settings, message: "Settings updated successfully!" });
  } catch (error: any) {
    console.error("❌ Settings update error:", error.message);
    res.status(400).json({ success: false, message: error.message });
  }
};

