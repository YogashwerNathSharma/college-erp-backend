import { Request, Response } from "express";
import prisma from "../../utils/prisma";
import { updateTenantImagesService } from "./tenant.service";
import {
  getTenants,
  getTenantById,
} from "./tenant.service";
import bcrypt from "bcrypt";
// 🔥 BASE URL (ENV SAFE)
const BASE_URL = process.env.BASE_URL || "http://localhost:5000";

/////////////////////////
// CREATE TENANT
/////////////////////////
export const create = async (req: any, res: Response) => {
  try {
    const { name, type } = req.body;

    if (!name || !type) {
      return res.status(400).json({
        success: false,
        message: "Name and type are required",
      });
    }

    const files = req.files || {};

    const logoFile = files?.logo?.[0]?.filename || null;
    const bgFile = files?.background?.[0]?.filename || null;

    // ✅ 1. CREATE TENANT
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

    // ✅ 2. AUTO ADMIN EMAIL
    const email =
      name.toLowerCase().replace(/\s/g, "") + "@admin.com";

    // ✅ 3. AUTO PASSWORD
    //const rawPassword = Math.random().toString(36).slice(-8);
    //const hashedPassword = await bcrypt.hash(rawPassword, 10);
    
const rawPassword = "123456";  // 🔥 FIX: Predictable default password
const hashedPassword = await bcrypt.hash(rawPassword, 10);



    // ✅ 4. CREATE ADMIN USER
    await prisma.user.create({
      data: {
        name: "Admin",
        email,
        password: hashedPassword,
        role: "ADMIN",
        tenantId: tenant.id,
      },
    });

    // ✅ 5. RESPONSE WITH CREDENTIALS
    return res.status(201).json({
      success: true,
      data: tenant,
      admin: {
        email,
        password: rawPassword, // 👈 only shown once
      },
    });

  } catch (error: any) {
    console.error("CREATE TENANT ERROR:", error);

    return res.status(500).json({
      success: false,
      message: error.message || "Error creating tenant",
    });
  }
};
/////////////////////////
// UPDATE TENANT (🔥 REQUIRED)
/////////////////////////
export const update = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;

    const { name, type, isActive } = req.body;

    const tenant = await prisma.tenant.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(type && { type }),
        ...(typeof isActive === "boolean" && { isActive }),
      },
    });

    return res.json({
      success: true,
      data: tenant,
    });

  } catch (error: any) {
    console.error("UPDATE TENANT ERROR:", error);

    return res.status(500).json({
      success: false,
      message: error.message || "Error updating tenant",
    });
  }
};
/////////////////////////
// GET ALL TENANTS
/////////////////////////
export const getAll = async (req: Request, res: Response) => {
  try {
    const tenants = await getTenants();

    return res.json({
      success: true,
      data: tenants,
    });

  } catch (e: any) {
    console.error("GET TENANTS ERROR:", e);

    return res.status(500).json({
      success: false,
      message: e.message,
    });
  }
};

/////////////////////////
// GET SINGLE TENANT
/////////////////////////
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

    return res.json({
      success: true,
      data: tenant,
    });

  } catch (e: any) {
    console.error("GET TENANT ERROR:", e);

    return res.status(500).json({
      success: false,
      message: e.message,
    });
  }
};

/////////////////////////
// UPLOAD IMAGES
/////////////////////////
export const uploadTenantImages = async (req: any, res: Response) => {
  try {
    // 🔥 SUPER ADMIN SUPPORT
    const tenantId =
      req.user?.role === "SUPER_ADMIN"
        ? req.query.tenantId
        : req.user?.tenantId;

    if (!tenantId) {
      return res.status(400).json({
        success: false,
        message: "tenantId required",
      });
    }

    const files = req.files || {};

    const logo = files?.logo?.[0];
    const background = files?.background?.[0];

    const updatedTenant = await updateTenantImagesService({
      tenantId,
      logoUrl: logo
        ? `${BASE_URL}/uploads/${logo.filename}`
        : undefined,
      backgroundUrl: background
        ? `${BASE_URL}/uploads/${background.filename}`
        : undefined,
    });

    return res.json({
      success: true,
      message: "Images uploaded successfully",
      data: updatedTenant,
    });

  } catch (error: any) {
    console.error("UPLOAD IMAGE ERROR:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};