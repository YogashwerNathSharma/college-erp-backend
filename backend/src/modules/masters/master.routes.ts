// ═══════════════════════════════════════════════════════════════════
// MASTER MODULE - ROUTES
// ═══════════════════════════════════════════════════════════════════

import { Router } from 'express';
import {
  getCategories,
  listEntries,
  getEntry,
  createEntry,
  updateEntry,
  deleteEntry,
  toggleEntry,
  bulkCreate,
  exportEntries,
  cloneEntry,
  reorderEntries,
  getDropdown,
} from './master.controller';

const router = Router();

// ─────────────────────────────────────────────
// Categories (no modelName param)
// ─────────────────────────────────────────────
router.get('/categories', getCategories);

// ─────────────────────────────────────────────
// CRUD operations per model
// ─────────────────────────────────────────────

// List entries with pagination, search, sort
router.get('/:modelName', listEntries);

// Get dropdown options (lightweight - just id + name)
router.get('/:modelName/dropdown', getDropdown);

// Export all entries
router.get('/:modelName/export', exportEntries);

// Get single entry
router.get('/:modelName/:id', getEntry);

// Create new entry
router.post('/:modelName', createEntry);

// Bulk create (import)
router.post('/:modelName/bulk', bulkCreate);

// Clone an entry
router.post('/:modelName/:id/clone', cloneEntry);

// Update entry
router.put('/:modelName/:id', updateEntry);

// Toggle active/inactive
router.put('/:modelName/:id/toggle', toggleEntry);

// Reorder entries
router.put('/:modelName/reorder', reorderEntries);

// Soft delete
router.delete('/:modelName/:id', deleteEntry);

export default router;
