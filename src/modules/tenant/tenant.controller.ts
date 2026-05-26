import { Request, Response } from "express";
import prisma from "../../utils/prisma";
import { updateTenantImagesService } from "./tenant.service";
import {
  getTenants,
  getTenantById,
} from "./tenant.service";

// 🔥 BASE URL (change in production)
const BASE_URL = "http://localhost:5000";

// ✅ Create Tenant (with logo + background)
export const create = async (req: any, res: Response) => {
  try {
    const { name, type } = req.body;

    const files = req.files as any;

    const logoFile = files?.logo?.[0]?.filename || null;
    const bgFile = files?.background?.[0]?.filename || null;

    const tenant = await prisma.tenant.create({
      data: {
        name,
        type,
        logoUrl: logoFile ? `${BASE_URL}/uploads/${logoFile}` : null,
        backgroundUrl: bgFile
          ? `${BASE_URL}/uploads/${bgFile}`
          : null,
      },
    });

    res.status(201).json({
      success: true,
      data: tenant,
    });
  } catch (error: any) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Error creating tenant",
    });
  }
};

// ✅ Get All Tenants
export const getAll = async (req: Request, res: Response) => {
  try {
    const tenants = await getTenants();

    res.json({
      success: true,
      data: tenants,
    });
  } catch (e: any) {
    res.status(500).json({ success: false, message: e.message });
  }
};

// ✅ Get Single Tenant
export const getOne = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;

    const tenant = await getTenantById(id);

    if (!tenant) {
      return res.status(404).json({
        success: false,
        message: "Tenant not found",
      });
    }

    res.json({
      success: true,
      data: tenant,
    });
  } catch (e: any) {
    res.status(500).json({ success: false, message: e.message });
  }
};

// ✅ Update Tenant Images (logo + background)
export const uploadTenantImages = async (req: any, res: Response) => {
  try {
    const tenantId = req.user?.tenantId;

    const logo = req.files?.logo?.[0];
    const background = req.files?.background?.[0];

    const updatedTenant = await updateTenantImagesService({
      tenantId,
      logoUrl: logo ? `${BASE_URL}/uploads/${logo.filename}` : undefined,
      backgroundUrl: background
        ? `${BASE_URL}/uploads/${background.filename}`
        : undefined,
    });

    res.json({
      success: true,
      message: "Images uploaded successfully",
      data: updatedTenant,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};