// ═══════════════════════════════════════════════════════════════════
// MASTER MODULE - GENERIC CRUD CONTROLLER
// Handles all 95+ master collections via dynamic model resolution
// ═══════════════════════════════════════════════════════════════════

import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { MASTER_CATEGORIES, getMasterConfig, getAllMasterKeys } from './master.config';

const prisma = new PrismaClient();

// ─────────────────────────────────────────────────────────────────
// Helper: Get Prisma model delegate dynamically
// ─────────────────────────────────────────────────────────────────
function getPrismaDelegate(modelName: string): any {
  const key = modelName.charAt(0).toLowerCase() + modelName.slice(1);
  return (prisma as any)[key];
}

// ─────────────────────────────────────────────────────────────────
// GET /api/masters/categories
// Returns all master categories with model counts
// ─────────────────────────────────────────────────────────────────
export async function getCategories(req: Request, res: Response) {
  try {
    const categories = MASTER_CATEGORIES.map(cat => ({
      id: cat.id,
      label: cat.label,
      icon: cat.icon,
      description: cat.description,
      modelCount: cat.models.length,
      models: cat.models.map(m => ({
        key: m.key,
        label: m.label,
        icon: m.icon,
        description: m.description,
      })),
    }));

    res.json({ success: true, data: categories });
  } catch (error: any) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ success: false, message: error.message });
  }
}

// ─────────────────────────────────────────────────────────────────
// GET /api/masters/:modelName
// List all entries with pagination, search, sort, and filters
// ─────────────────────────────────────────────────────────────────
export async function listEntries(req: Request, res: Response) {
  try {
    const modelKey = req.params.modelName as string;
    const tenantId = (req as any).tenantId as string;

    const config = getMasterConfig(modelKey);
    if (!config) {
      return res.status(400).json({ success: false, message: `Unknown master: ${modelKey}` });
    }

    const delegate = getPrismaDelegate(config.model);
    if (!delegate) {
      return res.status(400).json({ success: false, message: `Prisma model not found: ${config.model}` });
    }

    // Query parameters
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 25;
    const search = (req.query.search as string) || '';
    const sortField = (req.query.sortField as string) || 'createdAt';
    const sortOrder = (req.query.sortOrder as string) || 'desc';
    const showInactive = req.query.showInactive === 'true';

    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = { tenantId };

    // Only show active unless explicitly requested
    if (!showInactive) {
      where.isActive = true;
    }

    // Search across configured search fields
    if (search && config.searchFields.length > 0) {
      where.OR = config.searchFields.map(field => ({
        [field]: { contains: search, mode: 'insensitive' },
      }));
    }

    // Execute query with pagination
    const [entries, total] = await Promise.all([
      delegate.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortField]: sortOrder },
      }),
      delegate.count({ where }),
    ]);

    res.json({
      success: true,
      data: entries,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1,
      },
      config: {
        key: config.key,
        label: config.label,
        fields: config.fields,
        requiredFields: config.requiredFields,
      },
    });
  } catch (error: any) {
    console.error('Error listing entries:', error);
    res.status(500).json({ success: false, message: error.message });
  }
}

// ─────────────────────────────────────────────────────────────────
// GET /api/masters/:modelName/:id
// Get single entry by ID
// ─────────────────────────────────────────────────────────────────
export async function getEntry(req: Request, res: Response) {
  try {
    const modelKey = req.params.modelName as string;
    const id = req.params.id as string;
    const tenantId = (req as any).tenantId as string;

    const config = getMasterConfig(modelKey);
    if (!config) {
      return res.status(400).json({ success: false, message: `Unknown master: ${modelKey}` });
    }

    const delegate = getPrismaDelegate(config.model);
    const entry = await delegate.findFirst({
      where: { id, tenantId },
    });

    if (!entry) {
      return res.status(404).json({ success: false, message: 'Entry not found' });
    }

    res.json({ success: true, data: entry });
  } catch (error: any) {
    console.error('Error fetching entry:', error);
    res.status(500).json({ success: false, message: error.message });
  }
}

// ─────────────────────────────────────────────────────────────────
// POST /api/masters/:modelName
// Create a new entry
// ─────────────────────────────────────────────────────────────────
export async function createEntry(req: Request, res: Response) {
  try {
    const modelKey = req.params.modelName as string;
    const tenantId = (req as any).tenantId as string;

    const config = getMasterConfig(modelKey);
    if (!config) {
      return res.status(400).json({ success: false, message: `Unknown master: ${modelKey}` });
    }

    // Validate required fields
    const missingFields = config.requiredFields.filter(f => !req.body[f]);
    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Missing required fields: ${missingFields.join(', ')}`,
      });
    }

    const delegate = getPrismaDelegate(config.model);

    // Build data object - only include fields defined in config
    const allowedFields = config.fields.map(f => f.name);
    const data: any = { tenantId, isActive: true };

    for (const field of allowedFields) {
      if (req.body[field] !== undefined && req.body[field] !== '') {
        const fieldConfig = config.fields.find(f => f.name === field);

        // Type conversion
        if (fieldConfig?.type === 'number') {
          data[field] = Number(req.body[field]);
        } else if (fieldConfig?.type === 'boolean') {
          data[field] = Boolean(req.body[field]);
        } else if (fieldConfig?.type === 'array') {
          data[field] = Array.isArray(req.body[field])
            ? req.body[field]
            : req.body[field].split(',').map((s: string) => s.trim());
        } else {
          data[field] = req.body[field];
        }
      }
    }

    const entry = await delegate.create({ data });

    res.status(201).json({ success: true, data: entry, message: 'Entry created successfully' });
  } catch (error: any) {
    console.error('Error creating entry:', error);
    if (error.code === 'P2002') {
      return res.status(409).json({ success: false, message: 'Duplicate entry. This record already exists.' });
    }
    res.status(500).json({ success: false, message: error.message });
  }
}

// ─────────────────────────────────────────────────────────────────
// PUT /api/masters/:modelName/:id
// Update an existing entry
// ─────────────────────────────────────────────────────────────────
export async function updateEntry(req: Request, res: Response) {
  try {
    const modelKey = req.params.modelName as string;
    const id = req.params.id as string;
    const tenantId = (req as any).tenantId as string;

    const config = getMasterConfig(modelKey);
    if (!config) {
      return res.status(400).json({ success: false, message: `Unknown master: ${modelKey}` });
    }

    const delegate = getPrismaDelegate(config.model);

    // Verify ownership
    const existing = await delegate.findFirst({ where: { id, tenantId } });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Entry not found' });
    }

    // Build update data
    const allowedFields = config.fields.map(f => f.name);
    const data: any = {};

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        const fieldConfig = config.fields.find(f => f.name === field);

        if (fieldConfig?.type === 'number') {
          data[field] = Number(req.body[field]);
        } else if (fieldConfig?.type === 'boolean') {
          data[field] = Boolean(req.body[field]);
        } else if (fieldConfig?.type === 'array') {
          data[field] = Array.isArray(req.body[field])
            ? req.body[field]
            : req.body[field].split(',').map((s: string) => s.trim());
        } else {
          data[field] = req.body[field];
        }
      }
    }

    const entry = await delegate.update({
      where: { id },
      data,
    });

    res.json({ success: true, data: entry, message: 'Entry updated successfully' });
  } catch (error: any) {
    console.error('Error updating entry:', error);
    res.status(500).json({ success: false, message: error.message });
  }
}

// ─────────────────────────────────────────────────────────────────
// DELETE /api/masters/:modelName/:id
// Soft delete (set isActive: false)
// ─────────────────────────────────────────────────────────────────
export async function deleteEntry(req: Request, res: Response) {
  try {
    const modelKey = req.params.modelName as string;
    const id = req.params.id as string;
    const tenantId = (req as any).tenantId as string;

    const config = getMasterConfig(modelKey);
    if (!config) {
      return res.status(400).json({ success: false, message: `Unknown master: ${modelKey}` });
    }

    const delegate = getPrismaDelegate(config.model);

    // Verify ownership
    const existing = await delegate.findFirst({ where: { id, tenantId } });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Entry not found' });
    }

    // Soft delete
    await delegate.update({
      where: { id },
      data: { isActive: false },
    });

    res.json({ success: true, message: 'Entry deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting entry:', error);
    res.status(500).json({ success: false, message: error.message });
  }
}

// ─────────────────────────────────────────────────────────────────
// PUT /api/masters/:modelName/:id/toggle
// Toggle isActive status
// ─────────────────────────────────────────────────────────────────
export async function toggleEntry(req: Request, res: Response) {
  try {
    const modelKey = req.params.modelName as string;
    const id = req.params.id as string;
    const tenantId = (req as any).tenantId as string;

    const config = getMasterConfig(modelKey);
    if (!config) {
      return res.status(400).json({ success: false, message: `Unknown master: ${modelKey}` });
    }

    const delegate = getPrismaDelegate(config.model);

    const existing = await delegate.findFirst({ where: { id, tenantId } });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Entry not found' });
    }

    const entry = await delegate.update({
      where: { id },
      data: { isActive: !existing.isActive },
    });

    res.json({
      success: true,
      data: entry,
      message: `Entry ${entry.isActive ? 'activated' : 'deactivated'} successfully`,
    });
  } catch (error: any) {
    console.error('Error toggling entry:', error);
    res.status(500).json({ success: false, message: error.message });
  }
}

// ─────────────────────────────────────────────────────────────────
// POST /api/masters/:modelName/bulk
// Bulk create entries from import
// ─────────────────────────────────────────────────────────────────
export async function bulkCreate(req: Request, res: Response) {
  try {
    const modelKey = req.params.modelName as string;
    const tenantId = (req as any).tenantId as string;

    const config = getMasterConfig(modelKey);
    if (!config) {
      return res.status(400).json({ success: false, message: `Unknown master: ${modelKey}` });
    }

    const { entries } = req.body;
    if (!Array.isArray(entries) || entries.length === 0) {
      return res.status(400).json({ success: false, message: 'entries array is required' });
    }

    if (entries.length > 500) {
      return res.status(400).json({ success: false, message: 'Maximum 500 entries per batch' });
    }

    const delegate = getPrismaDelegate(config.model);
    const allowedFields = config.fields.map(f => f.name);

    const results = { success: 0, failed: 0, errors: [] as any[] };

    for (let i = 0; i < entries.length; i++) {
      try {
        const row = entries[i];

        // Validate required fields
        const missing = config.requiredFields.filter(f => !row[f]);
        if (missing.length > 0) {
          results.failed++;
          results.errors.push({ row: i + 1, error: `Missing: ${missing.join(', ')}` });
          continue;
        }

        // Build data
        const data: any = { tenantId, isActive: true };
        for (const field of allowedFields) {
          if (row[field] !== undefined && row[field] !== '') {
            data[field] = row[field];
          }
        }

        await delegate.create({ data });
        results.success++;
      } catch (err: any) {
        results.failed++;
        results.errors.push({ row: i + 1, error: err.message });
      }
    }

    res.json({
      success: true,
      message: `Imported ${results.success} entries. ${results.failed} failed.`,
      data: results,
    });
  } catch (error: any) {
    console.error('Error bulk creating:', error);
    res.status(500).json({ success: false, message: error.message });
  }
}

// ─────────────────────────────────────────────────────────────────
// GET /api/masters/:modelName/export
// Export all entries as JSON
// ─────────────────────────────────────────────────────────────────
export async function exportEntries(req: Request, res: Response) {
  try {
    const modelKey = req.params.modelName as string;
    const tenantId = (req as any).tenantId as string;

    const config = getMasterConfig(modelKey);
    if (!config) {
      return res.status(400).json({ success: false, message: `Unknown master: ${modelKey}` });
    }

    const delegate = getPrismaDelegate(config.model);

    const entries = await delegate.findMany({
      where: { tenantId, isActive: true },
      orderBy: { createdAt: 'desc' },
    });

    // Remove internal fields for export
    const exportData = entries.map((entry: any) => {
      const { id, tenantId: _tid, isActive, createdAt, updatedAt, ...rest } = entry;
      return rest;
    });

    res.json({
      success: true,
      data: exportData,
      meta: {
        model: config.label,
        count: exportData.length,
        exportedAt: new Date().toISOString(),
      },
    });
  } catch (error: any) {
    console.error('Error exporting entries:', error);
    res.status(500).json({ success: false, message: error.message });
  }
}

// ─────────────────────────────────────────────────────────────────
// POST /api/masters/:modelName/:id/clone
// Clone an existing entry
// ─────────────────────────────────────────────────────────────────
export async function cloneEntry(req: Request, res: Response) {
  try {
    const modelKey = req.params.modelName as string;
    const id = req.params.id as string;
    const tenantId = (req as any).tenantId as string;

    const config = getMasterConfig(modelKey);
    if (!config) {
      return res.status(400).json({ success: false, message: `Unknown master: ${modelKey}` });
    }

    const delegate = getPrismaDelegate(config.model);

    const existing = await delegate.findFirst({ where: { id, tenantId } });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Entry not found' });
    }

    // Remove system fields and create a copy
    const { id: _id, createdAt, updatedAt, ...data } = existing;

    // Append " (Copy)" to name field if exists
    if (data.name) {
      data.name = `${data.name} (Copy)`;
    }

    const clone = await delegate.create({ data });

    res.status(201).json({ success: true, data: clone, message: 'Entry cloned successfully' });
  } catch (error: any) {
    console.error('Error cloning entry:', error);
    res.status(500).json({ success: false, message: error.message });
  }
}

// ─────────────────────────────────────────────────────────────────
// PUT /api/masters/:modelName/reorder
// Reorder entries (if model has 'order' field)
// ─────────────────────────────────────────────────────────────────
export async function reorderEntries(req: Request, res: Response) {
  try {
    const modelKey = req.params.modelName as string;
    const tenantId = (req as any).tenantId as string;

    const config = getMasterConfig(modelKey);
    if (!config) {
      return res.status(400).json({ success: false, message: `Unknown master: ${modelKey}` });
    }

    const { orderedIds } = req.body;
    if (!Array.isArray(orderedIds)) {
      return res.status(400).json({ success: false, message: 'orderedIds array is required' });
    }

    const delegate = getPrismaDelegate(config.model);

    // Update order for each entry
    const updates = orderedIds.map((id: string, index: number) =>
      delegate.update({
        where: { id },
        data: { order: index + 1 },
      })
    );

    await Promise.all(updates);

    res.json({ success: true, message: 'Reorder successful' });
  } catch (error: any) {
    console.error('Error reordering:', error);
    res.status(500).json({ success: false, message: error.message });
  }
}

// ─────────────────────────────────────────────────────────────────
// GET /api/masters/:modelName/dropdown
// Get entries as dropdown options (id + name only)
// ─────────────────────────────────────────────────────────────────
export async function getDropdown(req: Request, res: Response) {
  try {
    const modelKey = req.params.modelName as string;
    const tenantId = (req as any).tenantId as string;

    const config = getMasterConfig(modelKey);
    if (!config) {
      return res.status(400).json({ success: false, message: `Unknown master: ${modelKey}` });
    }

    const delegate = getPrismaDelegate(config.model);

    const entries = await delegate.findMany({
      where: { tenantId, isActive: true },
      select: { id: true, name: true, code: true },
      orderBy: { name: 'asc' },
    });

    res.json({ success: true, data: entries });
  } catch (error: any) {
    console.error('Error fetching dropdown:', error);
    res.status(500).json({ success: false, message: error.message });
  }
}
