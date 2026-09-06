// ═══════════════════════════════════════════════════════════════════
// MASTER MODULE - GENERIC CRUD CONTROLLER
// Handles all 95+ master collections via dynamic model resolution
// ═══════════════════════════════════════════════════════════════════

import { Request, Response } from 'express';
import prisma from '../../utils/prisma';
import { MASTER_CATEGORIES, getMasterConfig, getAllMasterKeys } from './master.config';

function getPrismaDelegate(modelName: string): any {
  const key = modelName.charAt(0).toLowerCase() + modelName.slice(1);
  return (prisma as any)[key];
}

function normalizeMasterField(modelKey: string, field: string, value: any): any {
  if (modelKey === 'campus-master' && field === 'facilities') {
    if (Array.isArray(value)) return value.map((item) => String(item).trim()).filter(Boolean);
    return String(value)
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
  }
  return value;
}

// ─────────────────────────────────────────────────────────────────
// GET /api/masters/categories
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

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 25;
    const search = (req.query.search as string) || '';
    const sortField = (req.query.sortField as string) || 'createdAt';
    const sortOrder = (req.query.sortOrder as string) || 'desc';
    const showInactive = req.query.showInactive === 'true';
    const skip = (page - 1) * limit;

    const where: any = {};
    if (tenantId) where.tenantId = tenantId;

    if (!showInactive) where.isActive = true;

    if (search && config.searchFields?.length > 0) {
      where.OR = config.searchFields.map(field => ({
        [field]: { contains: search, mode: 'insensitive' },
      }));
    }

    let entries: any[] = [];
    let total = 0;
    try {
      [entries, total] = await Promise.all([
        delegate.findMany({
          where,
          skip,
          take: limit,
          orderBy: { [sortField]: sortOrder },
        }),
        delegate.count({ where }),
      ]);
    } catch (queryErr: any) {
      console.warn(`Master query for ${config.model} failed, retrying safely:`, queryErr.message);
      const safeWhere: any = {};
      if (tenantId) safeWhere.tenantId = tenantId;
      if (search && config.searchFields?.length > 0) {
        safeWhere.OR = config.searchFields.map(field => ({
          [field]: { contains: search, mode: 'insensitive' },
        }));
      }
      try {
        [entries, total] = await Promise.all([
          delegate.findMany({ where: safeWhere, skip, take: limit }),
          delegate.count({ where: safeWhere }),
        ]);
      } catch (retryErr: any) {
        console.warn(`Master retry for ${config.model} also failed:`, retryErr.message);
        try {
          entries = await delegate.findMany({ skip, take: limit });
          total = await delegate.count();
        } catch (finalErr: any) {
          return res.status(500).json({ success: false, message: `Cannot query ${config.label}: ${finalErr.message}` });
        }
      }
    }

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

export async function getEntry(req: Request, res: Response) {
  try {
    const modelKey = req.params.modelName as string;
    const id = req.params.id as string;
    const tenantId = (req as any).tenantId as string;

    const config = getMasterConfig(modelKey);
    if (!config) return res.status(400).json({ success: false, message: `Unknown master: ${modelKey}` });

    const delegate = getPrismaDelegate(config.model);
    const entry = await delegate.findFirst({ where: { id, tenantId } });

    if (!entry) return res.status(404).json({ success: false, message: 'Entry not found' });

    res.json({ success: true, data: entry });
  } catch (error: any) {
    console.error('Error fetching entry:', error);
    res.status(500).json({ success: false, message: error.message });
  }
}

export async function createEntry(req: Request, res: Response) {
  try {
    const modelKey = req.params.modelName as string;
    const tenantId = (req as any).tenantId as string;

    const config = getMasterConfig(modelKey);
    if (!config) return res.status(400).json({ success: false, message: `Unknown master: ${modelKey}` });

    const missingFields = config.requiredFields.filter(f => !req.body[f]);
    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Missing required fields: ${missingFields.join(', ')}`,
      });
    }

    const delegate = getPrismaDelegate(config.model);
    const allowedFields = config.fields.map(f => f.name);
    const data: any = {};
    if (tenantId) data.tenantId = tenantId;
    data.isActive = true;

    for (const field of allowedFields) {
      if (req.body[field] !== undefined && req.body[field] !== '') {
        const fieldConfig = config.fields.find(f => f.name === field);
        const value = normalizeMasterField(modelKey, field, req.body[field]);

        if (fieldConfig?.type === 'number') {
          data[field] = Number(value);
        } else if (fieldConfig?.type === 'boolean') {
          data[field] = Boolean(value);
        } else if (fieldConfig?.type === 'date' || fieldConfig?.type === 'datetime') {
          data[field] = new Date(value);
        } else if (fieldConfig?.type === 'array') {
          data[field] = Array.isArray(value)
            ? value
            : String(value).split(',').map((s: string) => s.trim()).filter(Boolean);
        } else if (fieldConfig?.type === 'select' && fieldConfig.options?.length &&
          fieldConfig.options.every(opt => !isNaN(Number(opt.value)))) {
          data[field] = Number(value);
        } else {
          data[field] = value;
        }
      }
    }

    let entry;
    try {
      entry = await delegate.create({ data });
    } catch (createErr: any) {
      if (createErr.message?.includes('isActive')) {
        delete data.isActive;
        entry = await delegate.create({ data });
      } else {
        throw createErr;
      }
    }

    res.status(201).json({ success: true, data: entry, message: 'Entry created successfully' });
  } catch (error: any) {
    console.error('Error creating entry:', error);
    if (error.code === 'P2002') return res.status(409).json({ success: false, message: 'Duplicate entry. This record already exists.' });
    res.status(500).json({ success: false, message: error.message });
  }
}

export async function updateEntry(req: Request, res: Response) {
  try {
    const modelKey = req.params.modelName as string;
    const id = req.params.id as string;
    const tenantId = (req as any).tenantId as string;

    const config = getMasterConfig(modelKey);
    if (!config) return res.status(400).json({ success: false, message: `Unknown master: ${modelKey}` });

    const delegate = getPrismaDelegate(config.model);
    const existing = await delegate.findFirst({ where: { id, tenantId } });
    if (!existing) return res.status(404).json({ success: false, message: 'Entry not found' });

    const allowedFields = config.fields.map(f => f.name);
    const data: any = {};

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        const fieldConfig = config.fields.find(f => f.name === field);
        const value = normalizeMasterField(modelKey, field, req.body[field]);

        if (fieldConfig?.type === 'number') {
          data[field] = Number(value);
        } else if (fieldConfig?.type === 'boolean') {
          data[field] = Boolean(value);
        } else if (fieldConfig?.type === 'date' || fieldConfig?.type === 'datetime') {
          data[field] = new Date(value);
        } else if (fieldConfig?.type === 'array') {
          data[field] = Array.isArray(value)
            ? value
            : String(value).split(',').map((s: string) => s.trim()).filter(Boolean);
        } else if (fieldConfig?.type === 'select' && fieldConfig.options?.length &&
          fieldConfig.options.every(opt => !isNaN(Number(opt.value)))) {
          data[field] = Number(value);
        } else {
          data[field] = value;
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

export async function deleteEntry(req: Request, res: Response) {
  try {
    const modelKey = req.params.modelName as string;
    const id = req.params.id as string;
    const tenantId = (req as any).tenantId as string;

    const config = getMasterConfig(modelKey);
    if (!config) return res.status(400).json({ success: false, message: `Unknown master: ${modelKey}` });

    const delegate = getPrismaDelegate(config.model);
    const existing = await delegate.findFirst({ where: { id, tenantId } });
    if (!existing) return res.status(404).json({ success: false, message: 'Entry not found' });

    try {
      await delegate.update({ where: { id }, data: { isActive: false } });
    } catch (delErr: any) {
      if (delErr.message?.includes('isActive')) await delegate.delete({ where: { id } });
      else throw delErr;
    }

    res.json({ success: true, message: 'Entry deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting entry:', error);
    res.status(500).json({ success: false, message: error.message });
  }
}

export async function toggleEntry(req: Request, res: Response) {
  try {
    const modelKey = req.params.modelName as string;
    const id = req.params.id as string;
    const tenantId = (req as any).tenantId as string;

    const config = getMasterConfig(modelKey);
    if (!config) return res.status(400).json({ success: false, message: `Unknown master: ${modelKey}` });

    const delegate = getPrismaDelegate(config.model);
    const existing = await delegate.findFirst({ where: { id, tenantId } });
    if (!existing) return res.status(404).json({ success: false, message: 'Entry not found' });

    let entry;
    try {
      entry = await delegate.update({ where: { id }, data: { isActive: !existing.isActive } });
    } catch (toggleErr: any) {
      if (toggleErr.message?.includes('isActive')) {
        return res.status(400).json({ success: false, message: 'This model does not support active/inactive toggle' });
      }
      throw toggleErr;
    }

    res.json({ success: true, data: entry, message: 'Status updated successfully' });
  } catch (error: any) {
    console.error('Error toggling entry:', error);
    res.status(500).json({ success: false, message: error.message });
  }
}
