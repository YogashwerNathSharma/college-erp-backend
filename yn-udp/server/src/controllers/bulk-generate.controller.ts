/**
 * YN-UDP Bulk Generate Controller
 * Backend endpoints for bulk PDF generation from templates
 * 
 * Dependencies: pdf-lib, archiver (for ZIP), prisma client
 */

import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { PDFDocument } from 'pdf-lib';
import archiver from 'archiver';
import { Readable } from 'stream';
import { processTemplate, extractPlaceholders, validateData, TemplateData } from '../utils/templateEngine';
import { generateSinglePDF, generateBulkPDFs, PAGE_SIZES, GenerateOptions } from '../utils/pdfGenerator';

const prisma = new PrismaClient();

// ─── Types ────────────────────────────────────────────────────────────────────

interface BulkGenerateBody {
  filters: {
    classId?: string;
    sectionId?: string;
    studentIds?: string[];
    staffIds?: string[];
    dataSource?: 'students' | 'staff' | 'custom';
    customData?: any[];
  };
  format: 'combined' | 'individual' | 'zip';
  outputPageSize?: string; // e.g., 'A4_PORTRAIT', 'ID_CARD_CR80'
  itemsPerPage?: number;
  fileNameTemplate?: string;
}

interface PreviewBody {
  filters: {
    classId?: string;
    sectionId?: string;
    dataSource?: 'students' | 'staff';
  };
  limit?: number;
}

// ─── Bulk Generate Endpoint ───────────────────────────────────────────────────

/**
 * POST /api/templates/:id/bulk-generate
 * Generate PDFs for multiple records using a template
 */
export const bulkGenerate = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id: templateId } = req.params;
    const body = req.body as BulkGenerateBody;
    const { filters, format, outputPageSize, itemsPerPage, fileNameTemplate } = body;
    const tenantId = (req as any).tenantId;

    // 1. Fetch template
    const template = await prisma.udpTemplate.findFirst({
      where: { id: templateId, tenantId, isDeleted: false },
    });

    if (!template) {
      res.status(404).json({ error: 'Template not found' });
      return;
    }

    const canvasJSON = template.canvasJSON as any;

    // 2. Fetch data records based on filters
    const records = await fetchRecords(filters, tenantId);

    if (records.length === 0) {
      res.status(400).json({ error: 'No records found matching the filters' });
      return;
    }

    // 3. Determine page size
    const pageSize = outputPageSize
      ? (PAGE_SIZES as any)[outputPageSize] || PAGE_SIZES.A4_PORTRAIT
      : { width: canvasJSON.width || 595, height: canvasJSON.height || 842 };

    // 4. Generate PDFs
    const options: GenerateOptions = {
      format,
      pageSize,
      itemsPerPage: itemsPerPage || 1,
      fileName: fileNameTemplate,
    };

    const result = await generateBulkPDFs(canvasJSON, records, options);

    // 5. Return based on format
    if (format === 'combined' && result.combinedBuffer) {
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="bulk-${template.name}.pdf"`);
      res.send(result.combinedBuffer);
      return;
    }

    if (format === 'zip' || (format === 'individual' && result.pdfs.length > 1)) {
      // Create ZIP archive
      res.setHeader('Content-Type', 'application/zip');
      res.setHeader('Content-Disposition', `attachment; filename="bulk-${template.name}.zip"`);

      const archive = archiver('zip', { zlib: { level: 6 } });
      archive.pipe(res);

      for (const pdf of result.pdfs) {
        archive.append(pdf.buffer, { name: pdf.fileName });
      }

      await archive.finalize();
      return;
    }

    // Single individual PDF
    if (result.pdfs.length === 1) {
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${result.pdfs[0].fileName}"`);
      res.send(result.pdfs[0].buffer);
      return;
    }

    res.status(500).json({ error: 'Failed to generate PDFs' });
  } catch (error: any) {
    console.error('Bulk generate error:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
};

// ─── Preview Endpoint ─────────────────────────────────────────────────────────

/**
 * POST /api/templates/:id/bulk-preview
 * Preview first N records filled into template (returns base64 images)
 */
export const bulkPreview = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id: templateId } = req.params;
    const body = req.body as PreviewBody;
    const { filters, limit = 3 } = body;
    const tenantId = (req as any).tenantId;

    // Fetch template
    const template = await prisma.udpTemplate.findFirst({
      where: { id: templateId, tenantId, isDeleted: false },
    });

    if (!template) {
      res.status(404).json({ error: 'Template not found' });
      return;
    }

    const canvasJSON = template.canvasJSON as any;

    // Fetch limited records for preview
    const records = await fetchRecords(
      { ...filters, dataSource: filters.dataSource || 'students' },
      tenantId,
      limit
    );

    // Process each record and return the processed canvas JSONs
    const previews = records.map((record, index) => ({
      index,
      record: {
        name: record.name || record.firstName + ' ' + record.lastName,
        id: record.id,
      },
      processedCanvas: processTemplate(canvasJSON, record),
    }));

    res.json({
      success: true,
      totalAvailable: records.length,
      previews,
      placeholders: extractPlaceholders(canvasJSON),
    });
  } catch (error: any) {
    console.error('Bulk preview error:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
};

// ─── Data Count Endpoint ──────────────────────────────────────────────────────

/**
 * POST /api/templates/:id/bulk-count
 * Get count of records matching filters (for UI feedback before generating)
 */
export const bulkCount = async (req: Request, res: Response): Promise<void> => {
  try {
    const { filters } = req.body;
    const tenantId = (req as any).tenantId;

    let count = 0;
    const dataSource = filters.dataSource || 'students';

    if (dataSource === 'students') {
      const where: any = { tenantId, isDeleted: false };
      if (filters.classId) where.classId = filters.classId;
      if (filters.sectionId) where.sectionId = filters.sectionId;
      count = await prisma.student.count({ where });
    } else if (dataSource === 'staff') {
      const where: any = { tenantId, isDeleted: false };
      if (filters.departmentId) where.departmentId = filters.departmentId;
      count = await prisma.staff.count({ where });
    } else if (dataSource === 'custom' && filters.customData) {
      count = filters.customData.length;
    }

    res.json({ success: true, count });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

// ─── Progress Tracking (SSE) ──────────────────────────────────────────────────

/**
 * GET /api/templates/:id/bulk-generate/progress/:jobId
 * Server-Sent Events for progress tracking during bulk generation
 */
export const bulkProgress = async (req: Request, res: Response): Promise<void> => {
  const { jobId } = req.params;

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  // In production, this would read from a Redis/memory store
  // For now, simulate progress updates
  let progress = 0;
  const interval = setInterval(() => {
    progress += 10;
    res.write(`data: ${JSON.stringify({ jobId, progress, status: progress >= 100 ? 'complete' : 'processing' })}\n\n`);

    if (progress >= 100) {
      clearInterval(interval);
      res.end();
    }
  }, 500);

  req.on('close', () => {
    clearInterval(interval);
  });
};

// ─── Helper: Fetch Records ────────────────────────────────────────────────────

/**
 * Fetch records from the ERP database based on filters
 * Maps database fields to template-friendly flat structure
 */
async function fetchRecords(
  filters: BulkGenerateBody['filters'],
  tenantId: string,
  limit?: number
): Promise<TemplateData[]> {
  const dataSource = filters.dataSource || 'students';

  if (dataSource === 'custom' && filters.customData) {
    return filters.customData;
  }

  if (dataSource === 'students') {
    const where: any = { tenantId, isDeleted: false };
    if (filters.classId) where.classId = filters.classId;
    if (filters.sectionId) where.sectionId = filters.sectionId;
    if (filters.studentIds?.length) where.id = { in: filters.studentIds };

    const students = await prisma.student.findMany({
      where,
      take: limit,
      include: {
        class: true,
        section: true,
      },
      orderBy: { firstName: 'asc' },
    });

    // Map to template-friendly format
    return students.map((s: any) => ({
      // Basic info
      id: s.id,
      name: `${s.firstName} ${s.lastName || ''}`.trim(),
      firstName: s.firstName,
      lastName: s.lastName || '',
      admission_no: s.admissionNo || s.registrationNo || '',
      roll_no: s.rollNo || '',
      dob: s.dob ? formatDate(s.dob) : '',
      gender: s.gender || '',
      blood_group: s.bloodGroup || '',
      religion: s.religion || '',
      caste: s.caste || '',
      category: s.category || '',
      nationality: s.nationality || 'Indian',
      aadhar_no: s.aadharNo || '',

      // Academic
      class_name: s.class?.name || '',
      section_name: s.section?.name || '',
      session: s.session || getCurrentSession(),

      // Contact
      phone: s.phone || s.mobile || '',
      email: s.email || '',
      address: s.address || '',

      // Parent info
      father_name: s.fatherName || '',
      mother_name: s.motherName || '',
      guardian_name: s.guardianName || '',
      father_phone: s.fatherPhone || '',
      mother_phone: s.motherPhone || '',

      // Photos
      student_photo: s.photo || '',
      
      // Dates
      admission_date: s.admissionDate ? formatDate(s.admissionDate) : '',
      
      // School info (from tenant)
      school_name: 'R.M.S. ACADEMY',
      school_address: '',
      school_phone: '',
      school_logo: '',

      // Certificate specific
      sr_no: s.srNo || s.admissionNo || '',
      leaving_date: '',
      conduct: 'Good',
      result: '',
    }));
  }

  if (dataSource === 'staff') {
    const where: any = { tenantId, isDeleted: false };
    if (filters.staffIds?.length) where.id = { in: filters.staffIds };

    const staff = await prisma.staff.findMany({
      where,
      take: limit,
      include: {
        department: true,
        designation: true,
      },
      orderBy: { firstName: 'asc' },
    });

    return staff.map((s: any) => ({
      id: s.id,
      name: `${s.firstName} ${s.lastName || ''}`.trim(),
      firstName: s.firstName,
      lastName: s.lastName || '',
      employee_id: s.employeeId || '',
      designation: s.designation?.name || s.designationName || '',
      department: s.department?.name || s.departmentName || '',
      phone: s.phone || s.mobile || '',
      email: s.email || '',
      dob: s.dob ? formatDate(s.dob) : '',
      gender: s.gender || '',
      blood_group: s.bloodGroup || '',
      address: s.address || '',
      joining_date: s.joiningDate ? formatDate(s.joiningDate) : '',
      staff_photo: s.photo || '',
      aadhar_no: s.aadharNo || '',
      qualification: s.qualification || '',
      experience: s.experience || '',
      
      school_name: 'R.M.S. ACADEMY',
      school_logo: '',
    }));
  }

  return [];
}

// ─── Utility Helpers ──────────────────────────────────────────────────────────

function formatDate(date: Date | string): string {
  const d = new Date(date);
  const day = d.getDate().toString().padStart(2, '0');
  const month = (d.getMonth() + 1).toString().padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

function getCurrentSession(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  // Academic session: April to March
  if (month >= 3) {
    return `${year}-${(year + 1).toString().slice(-2)}`;
  }
  return `${year - 1}-${year.toString().slice(-2)}`;
}

// ─── Routes Setup ─────────────────────────────────────────────────────────────

/**
 * Register bulk generation routes
 * Usage in app.ts: 
 *   import { registerBulkGenerateRoutes } from './controllers/bulk-generate.controller';
 *   registerBulkGenerateRoutes(app);
 */
export function registerBulkGenerateRoutes(app: any) {
  const router = require('express').Router();

  router.post('/templates/:id/bulk-generate', bulkGenerate);
  router.post('/templates/:id/bulk-preview', bulkPreview);
  router.post('/templates/:id/bulk-count', bulkCount);
  router.get('/templates/:id/bulk-generate/progress/:jobId', bulkProgress);

  app.use('/api/udp', router);
}

export default {
  bulkGenerate,
  bulkPreview,
  bulkCount,
  bulkProgress,
  registerBulkGenerateRoutes,
};
