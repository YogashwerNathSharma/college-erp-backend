import { Request, Response } from "express";
import {
  getAllPlansService,
  createPlanService,
  updatePlanService,
  deletePlanService,
  duplicatePlanService,
  getBillingHistoryService,
  getInvoicesService,
  getInvoiceDetailService,
  getCouponsService,
  createCouponService,
  updateCouponService,
  deleteCouponService,
  toggleCouponStatusService,
  getRefundsService,
  processRefundService,
  updateRefundStatusService,
  getTaxConfigService,
  updateTaxConfigService,
  getRevenueAnalyticsService,
  getExpiringSubscriptionsService,
  bulkRenewSubscriptionsService,
  getSubscriptionStatsService,
} from "./subscription-management.service";

// ══════════════════════════════════════════════════════════════
// PLANS
// ══════════════════════════════════════════════════════════════

export const getPlans = async (req: Request, res: Response) => {
  try {
    const includeInactive = req.query.includeInactive === "true";
    const plans = await getAllPlansService(includeInactive);
    return res.status(200).json({ success: true, data: plans });
  } catch (error: any) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

export const createPlan = async (req: Request, res: Response) => {
  try {
    const plan = await createPlanService(req.body);
    return res.status(201).json({ success: true, data: plan });
  } catch (error: any) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

export const updatePlan = async (req: Request, res: Response) => {
  try {
    const plan = await updatePlanService(req.params.id, req.body);
    return res.status(200).json({ success: true, data: plan });
  } catch (error: any) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

export const deletePlan = async (req: Request, res: Response) => {
  try {
    await deletePlanService(req.params.id);
    return res.status(200).json({ success: true, message: "Plan deleted" });
  } catch (error: any) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

export const duplicatePlan = async (req: Request, res: Response) => {
  try {
    const plan = await duplicatePlanService(req.params.id);
    return res.status(201).json({ success: true, data: plan });
  } catch (error: any) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

// ══════════════════════════════════════════════════════════════
// BILLING HISTORY
// ══════════════════════════════════════════════════════════════

export const getBillingHistory = async (req: Request, res: Response) => {
  try {
    const { status, tenantId, startDate, endDate, page, limit } = req.query;
    const result = await getBillingHistoryService({
      status: status as string,
      tenantId: tenantId as string,
      startDate: startDate as string,
      endDate: endDate as string,
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
    });
    return res.status(200).json({ success: true, ...result });
  } catch (error: any) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

// ══════════════════════════════════════════════════════════════
// INVOICES
// ══════════════════════════════════════════════════════════════

export const getInvoices = async (req: Request, res: Response) => {
  try {
    const { status, tenantId, page, limit } = req.query;
    const result = await getInvoicesService({
      status: status as string,
      tenantId: tenantId as string,
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
    });
    return res.status(200).json({ success: true, ...result });
  } catch (error: any) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

export const getInvoiceDetail = async (req: Request, res: Response) => {
  try {
    const invoice = await getInvoiceDetailService(req.params.id);
    return res.status(200).json({ success: true, data: invoice });
  } catch (error: any) {
    return res.status(404).json({ success: false, message: error.message });
  }
};

// ══════════════════════════════════════════════════════════════
// COUPONS
// ══════════════════════════════════════════════════════════════

export const getCoupons = async (req: Request, res: Response) => {
  try {
    const coupons = await getCouponsService();
    return res.status(200).json({ success: true, data: coupons });
  } catch (error: any) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

export const createCoupon = async (req: Request, res: Response) => {
  try {
    const coupon = await createCouponService(req.body);
    return res.status(201).json({ success: true, data: coupon });
  } catch (error: any) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

export const updateCoupon = async (req: Request, res: Response) => {
  try {
    const coupon = await updateCouponService(req.params.id, req.body);
    return res.status(200).json({ success: true, data: coupon });
  } catch (error: any) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

export const deleteCoupon = async (req: Request, res: Response) => {
  try {
    await deleteCouponService(req.params.id);
    return res.status(200).json({ success: true, message: "Coupon deleted" });
  } catch (error: any) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

export const toggleCouponStatus = async (req: Request, res: Response) => {
  try {
    const coupon = await toggleCouponStatusService(req.params.id);
    return res.status(200).json({ success: true, data: coupon });
  } catch (error: any) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

// ══════════════════════════════════════════════════════════════
// REFUNDS
// ══════════════════════════════════════════════════════════════

export const getRefunds = async (req: Request, res: Response) => {
  try {
    const { status, page, limit } = req.query;
    const result = await getRefundsService({
      status: status as string,
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
    });
    return res.status(200).json({ success: true, ...result });
  } catch (error: any) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

export const processRefund = async (req: Request, res: Response) => {
  try {
    const refund = await processRefundService(req.body);
    return res.status(201).json({ success: true, data: refund });
  } catch (error: any) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

export const updateRefundStatus = async (req: Request, res: Response) => {
  try {
    const { status } = req.body;
    const refund = await updateRefundStatusService(req.params.id, status);
    return res.status(200).json({ success: true, data: refund });
  } catch (error: any) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

// ══════════════════════════════════════════════════════════════
// TAX CONFIGURATION
// ══════════════════════════════════════════════════════════════

export const getTaxConfig = async (req: Request, res: Response) => {
  try {
    const config = await getTaxConfigService();
    return res.status(200).json({ success: true, data: config });
  } catch (error: any) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

export const updateTaxConfig = async (req: Request, res: Response) => {
  try {
    const config = await updateTaxConfigService(req.body);
    return res.status(200).json({ success: true, data: config });
  } catch (error: any) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

// ══════════════════════════════════════════════════════════════
// REVENUE ANALYTICS
// ══════════════════════════════════════════════════════════════

export const getRevenueAnalytics = async (req: Request, res: Response) => {
  try {
    const period = (req.query.period as string) || "12months";
    const analytics = await getRevenueAnalyticsService(period);
    return res.status(200).json({ success: true, data: analytics });
  } catch (error: any) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

// ══════════════════════════════════════════════════════════════
// RENEWALS
// ══════════════════════════════════════════════════════════════

export const getExpiringSubscriptions = async (req: Request, res: Response) => {
  try {
    const days = req.query.days ? Number(req.query.days) : 30;
    const subscriptions = await getExpiringSubscriptionsService(days);
    return res.status(200).json({ success: true, data: subscriptions });
  } catch (error: any) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

export const bulkRenewSubscriptions = async (req: Request, res: Response) => {
  try {
    const { ids } = req.body;
    if (!ids || !Array.isArray(ids)) {
      return res.status(400).json({ success: false, message: "ids array is required" });
    }
    const results = await bulkRenewSubscriptionsService(ids);
    return res.status(200).json({ success: true, data: results });
  } catch (error: any) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

// ══════════════════════════════════════════════════════════════
// STATS
// ══════════════════════════════════════════════════════════════

export const getSubscriptionStats = async (req: Request, res: Response) => {
  try {
    const stats = await getSubscriptionStatsService();
    return res.status(200).json({ success: true, data: stats });
  } catch (error: any) {
    return res.status(400).json({ success: false, message: error.message });
  }
};
