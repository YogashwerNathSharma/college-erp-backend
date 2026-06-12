import { Request, Response } from "express";
import prisma from "../../utils/prisma";
import {
  getTenants,
  getTenantById,
  updateTenantImagesService,
  getMySubscriptionService,
  getAllPlansService,
  tenantSelfSubscribeService,
} from "./tenant.service";
import bcrypt from "bcrypt";

// BASE URL (ENV SAFE)
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

    // 1. CREATE TENANT
    const tenant = await prisma.tenant.create({
      data: {
        name,
        type,
        logoUrl: logoFile ? `${BASE_URL}/uploads/${logoFile}` : null,
        backgroundUrl: bgFile ? `${BASE_URL}/uploads/${bgFile}` : null,
      },
    });

    

    // 2. AUTO ADMIN EMAIL
    const email = name.toLowerCase().replace(/\s/g, "") + "@admin.com";

    // 3. AUTO DEFAULT CREDENTIALS
    const rawPwd = "Admin@123";
    const hashedPwd = await bcrypt.hash(rawPwd, 10);
    // 4. CREATE ADMIN USER
    await prisma.user.create({
      data: {
        name: "Admin",
        email,
        password: hashedPwd,
        role: "ADMIN",
        tenantId: tenant.id,
      },
    });
    
    // 5. AUTO ASSIGN FREE PLAN (status: ACTIVE, isActive: true)
    const freePlan = await prisma.subscriptionPlan.findFirst({
      where: { price: 0, isActive: true },
    });
console.log("FREE PLAN =", freePlan);
    if (freePlan) {
      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + freePlan.durationInDays);

      await prisma.tenantSubscription.create({
        data: {
          tenantId: tenant.id,
          planId: freePlan.id,
          subscriptionCode: `SUB-FREE-${Date.now()}`,
          startDate,
          endDate,
          status: "ACTIVE",
          isActive: true,
          amount: 0,
          paymentStatus: "PAID",
          maxStudents: freePlan.maxStudents,
          maxTeachers: freePlan.maxTeachers,
          maxAdmins: freePlan.maxAdmins,
          maxStorageInGB: freePlan.maxStorageInGB,
        },
      });

      // Also update tenant limits
      await prisma.tenant.update({
        where: { id: tenant.id },
        data: {
          maxStudents: freePlan.maxStudents,
          maxTeachers: freePlan.maxTeachers,
          maxAdmins: freePlan.maxAdmins,
          maxStorageInGB: freePlan.maxStorageInGB,
        },
      });
    }

    // 6. RESPONSE WITH CREDENTIALS
    return res.status(201).json({
      success: true,
      data: tenant,
      admin: {
        email,
        defaultPassword: rawPwd,
      },
      freeTrial: freePlan ? true : false,
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
// UPDATE TENANT
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

    return res.json({ success: true, data: tenant });

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
    return res.json({ success: true, data: tenants });
  } catch (e: any) {
    console.error("GET TENANTS ERROR:", e);
    return res.status(500).json({ success: false, message: e.message });
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

    return res.json({ success: true, data: tenant });

  } catch (e: any) {
    console.error("GET TENANT ERROR:", e);
    return res.status(500).json({ success: false, message: e.message });
  }
};

/////////////////////////
// UPLOAD IMAGES
/////////////////////////

export const uploadTenantImages = async (req: any, res: Response) => {
  try {
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
      logoUrl: logo ? `${BASE_URL}/uploads/${logo.filename}` : undefined,
      backgroundUrl: background ? `${BASE_URL}/uploads/${background.filename}` : undefined,
    });

    return res.json({
      success: true,
      message: "Images uploaded successfully",
      data: updatedTenant,
    });

  } catch (error: any) {
    console.error("UPLOAD IMAGE ERROR:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

//////////////////////////////////////////////////////
// GET MY SUBSCRIPTION (Tenant Dashboard)
//////////////////////////////////////////////////////

export const getMySubscription = async (req: any, res: Response) => {
  try {
    const tenantId = req.user?.tenantId;

    if (!tenantId) {
      return res.status(400).json({
        success: false,
        message: "Tenant ID not found in token",
      });
    }

    // Find active subscription for this tenant
    const subscription = await prisma.tenantSubscription.findFirst({
      where: {
        tenantId,
        isActive: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    if (!subscription) {
      return res.status(200).json({ success: true, data: null });
    }

    // Get plan name
    const plan = await prisma.subscriptionPlan.findUnique({
      where: { id: subscription.planId },
    });

    // Calculate days remaining
    const now = new Date();
    const end = new Date(subscription.endDate);
    const diffTime = end.getTime() - now.getTime();
    const daysRemaining = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));

    const data = {
      id: subscription.id,
      planName: plan?.name || "Unknown Plan",
      amount: subscription.amount || 0,
      status: subscription.status,
      startDate: subscription.startDate,
      endDate: subscription.endDate,
      daysRemaining,
      maxStudents: subscription.maxStudents,
      maxTeachers: subscription.maxTeachers,
      maxAdmins: subscription.maxAdmins,
      maxStorageInGB: subscription.maxStorageInGB,
    };

    return res.status(200).json({ success: true, data });

  } catch (error: any) {
    console.error("GET MY SUBSCRIPTION ERROR:", error);
    return res.status(400).json({ success: false, message: error.message });
  }
};

//////////////////////////////////////////////////////
// GET ALL PLANS (For tenant to browse and buy)
//////////////////////////////////////////////////////

export const getAllPlans = async (req: Request, res: Response) => {
  try {
    const data = await getAllPlansService();
    return res.status(200).json({ success: true, data });
  } catch (error: any) {
    console.error("GET PLANS ERROR:", error);
    return res.status(400).json({ success: false, message: error.message });
  }
};

//////////////////////////////////////////////////////
// SELF SUBSCRIBE (Tenant buys plan + creates order)
//////////////////////////////////////////////////////

export const selfSubscribe = async (req: any, res: Response) => {
  try {
    const tenantId = req.user?.tenantId;
    const { planId } = req.body;

    if (!tenantId) {
      return res.status(400).json({
        success: false,
        message: "Tenant ID not found in token",
      });
    }

    if (!planId) {
      return res.status(400).json({
        success: false,
        message: "Plan ID is required",
      });
    }

    const data = await tenantSelfSubscribeService(tenantId, planId);

    return res.status(200).json({ success: true, data });

  } catch (error: any) {
    console.error("SELF SUBSCRIBE ERROR:", error);
    return res.status(400).json({ success: false, message: error.message });
  }
};