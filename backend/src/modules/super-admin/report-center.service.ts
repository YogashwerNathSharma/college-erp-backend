// ═══════════════════════════════════════════════════════════
// REPORT CENTER SERVICE - Enterprise Analytics & Reporting
// ═══════════════════════════════════════════════════════════

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// ─── Types ───────────────────────────────────────────────
export interface ReportFilter {
  startDate?: string;
  endDate?: string;
  tenantId?: string;
  granularity?: "day" | "week" | "month" | "quarter" | "year";
}

// ─── Revenue Reports ─────────────────────────────────────
export async function getRevenueReport(filter: ReportFilter) {
  const { startDate, endDate, granularity = "month" } = filter;

  const where: any = {};
  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate) where.createdAt.gte = new Date(startDate);
    if (endDate) where.createdAt.lte = new Date(endDate);
  }

  const payments = await prisma.payment.findMany({
    where: { ...where, status: "completed" },
    select: { amount: true, createdAt: true, tenantId: true, type: true },
    orderBy: { createdAt: "asc" },
  });

  // Aggregate by period
  const periodData: Record<string, { revenue: number; transactions: number }> = {};

  payments.forEach((p) => {
    const date = p.createdAt;
    let key: string;
    switch (granularity) {
      case "day":
        key = date.toISOString().split("T")[0];
        break;
      case "week":
        const weekStart = new Date(date);
        weekStart.setDate(weekStart.getDate() - weekStart.getDay());
        key = weekStart.toISOString().split("T")[0];
        break;
      case "month":
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
        break;
      case "quarter":
        key = `${date.getFullYear()}-Q${Math.ceil((date.getMonth() + 1) / 3)}`;
        break;
      case "year":
        key = `${date.getFullYear()}`;
        break;
      default:
        key = date.toISOString().split("T")[0];
    }

    if (!periodData[key]) periodData[key] = { revenue: 0, transactions: 0 };
    periodData[key].revenue += p.amount;
    periodData[key].transactions++;
  });

  const totalRevenue = payments.reduce((sum, p) => sum + p.amount, 0);
  const avgTransaction = payments.length > 0 ? totalRevenue / payments.length : 0;

  // Revenue by type
  const byType: Record<string, number> = {};
  payments.forEach((p) => {
    const type = p.type || "subscription";
    byType[type] = (byType[type] || 0) + p.amount;
  });

  return {
    summary: {
      totalRevenue,
      totalTransactions: payments.length,
      avgTransaction: Math.round(avgTransaction * 100) / 100,
      byType,
    },
    chartData: Object.entries(periodData)
      .map(([period, data]) => ({ period, ...data }))
      .sort((a, b) => a.period.localeCompare(b.period)),
  };
}

// ─── Tenant Reports ──────────────────────────────────────
export async function getTenantReport(filter: ReportFilter) {
  const tenants = await prisma.tenant.findMany({
    select: {
      id: true,
      name: true,
      plan: true,
      isActive: true,
      createdAt: true,
      _count: { select: { users: true } },
    },
    orderBy: { createdAt: "desc" },
  }); as any[]

  const now = new Date();
  const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

  const newThisMonth = tenants.filter((t) => t.createdAt >= thisMonth).length;
  const newLastMonth = tenants.filter((t) => t.createdAt >= lastMonth && t.createdAt < thisMonth).length;
  const growth = newLastMonth > 0 ? Math.round(((newThisMonth - newLastMonth) / newLastMonth) * 100) : 100;

  // Monthly growth chart
  const monthlyGrowth: Record<string, number> = {};
  tenants.forEach((t) => {
    const key = `${t.createdAt.getFullYear()}-${String(t.createdAt.getMonth() + 1).padStart(2, "0")}`;
    monthlyGrowth[key] = (monthlyGrowth[key] || 0) + 1;
  });

  // Plan distribution
  const planDistribution: Record<string, number> = {};
  tenants.forEach((t) => {
    const plan = t.plan || "free";
    planDistribution[plan] = (planDistribution[plan] || 0) + 1;
  });

  return {
    summary: {
      totalTenants: tenants.length,
      activeTenants: tenants.filter((t) => t.isActive).length,
      inactiveTenants: tenants.filter((t) => !t.isActive).length,
      newThisMonth,
      growth,
      avgUsersPerTenant: Math.round(tenants.reduce((sum, t) => sum + t._count.users, 0) / tenants.length),
    },
    planDistribution,
    monthlyGrowth: Object.entries(monthlyGrowth)
      .map(([month, count]) => ({ month, count }))
      .sort((a, b) => a.month.localeCompare(b.month))
      .slice(-12),
    topTenants: tenants
      .sort((a, b) => b._count.users - a._count.users)
      .slice(0, 10)
      .map((t) => ({ id: t.id, name: t.name, plan: t.plan, users: t._count.users, active: t.isActive })),
  };
}

// ─── Usage Reports ───────────────────────────────────────
export async function getUsageReport(filter: ReportFilter) {
  const { startDate, endDate } = filter;

  const where: any = {};
  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate) where.createdAt.gte = new Date(startDate);
    if (endDate) where.createdAt.lte = new Date(endDate);
  }

  // API usage from audit logs
  const apiLogs = await prisma.auditLog.findMany({
    where: { ...where, type: "api" },
    select: { endpoint: true, method: true, createdAt: true, duration: true },
  });

  // Top endpoints
  const endpointCounts: Record<string, number> = {};
  apiLogs.forEach((log) => {
    const key = `${log.method || "GET"} ${log.endpoint || "/unknown"}`;
    endpointCounts[key] = (endpointCounts[key] || 0) + 1;
  });

  const topEndpoints = Object.entries(endpointCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([endpoint, count]) => ({ endpoint, count }));

  // Daily API calls
  const dailyCalls: Record<string, number> = {};
  apiLogs.forEach((log) => {
    const day = log.createdAt.toISOString().split("T")[0];
    dailyCalls[day] = (dailyCalls[day] || 0) + 1;
  });

  const avgResponseTime =
    apiLogs.length > 0
      ? Math.round(apiLogs.reduce((sum, l) => sum + (l.duration || 0), 0) / apiLogs.length)
      : 0;

  // Storage usage per tenant
  const tenants = await prisma.tenant.findMany({
    select: { id: true, name: true, storageUsed: true, storageLimit: true },
  });

  return {
    summary: {
      totalApiCalls: apiLogs.length,
      avgResponseTime,
      topEndpoints,
      totalStorage: tenants.reduce((sum, t) => sum + (t.storageUsed || 0), 0),
    },
    dailyApiCalls: Object.entries(dailyCalls)
      .map(([date, calls]) => ({ date, calls }))
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-30),
    storageByTenant: tenants
      .filter((t) => (t.storageUsed || 0) > 0)
      .sort((a, b) => (b.storageUsed || 0) - (a.storageUsed || 0))
      .slice(0, 10)
      .map((t) => ({
        tenant: t.name,
        used: t.storageUsed || 0,
        limit: t.storageLimit || 0,
        percentage: t.storageLimit ? Math.round(((t.storageUsed || 0) / t.storageLimit) * 100) : 0,
      })),
  };
}

// ─── Login Reports ───────────────────────────────────────
export async function getLoginReport(filter: ReportFilter) {
  const { startDate, endDate } = filter;

  const where: any = { action: { in: ["LOGIN", "LOGIN_SUCCESS", "LOGIN_FAILED"] } };
  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate) where.createdAt.gte = new Date(startDate);
    if (endDate) where.createdAt.lte = new Date(endDate);
  }

  const loginLogs = await prisma.auditLog.findMany({
    where,
    select: {
      action: true,
      createdAt: true,
      ipAddress: true,
      userAgent: true,
      userId: true,
      userName: true,
      metadata: true,
    },
    orderBy: { createdAt: "desc" },
    take: 5000,
  }); as any[]

  const successful = loginLogs.filter((l) => l.action !== "LOGIN_FAILED").length;
  const failed = loginLogs.filter((l) => l.action === "LOGIN_FAILED").length;

  // By hour
  const byHour: Record<number, number> = {};
  loginLogs.forEach((l) => {
    const hour = l.createdAt.getHours();
    byHour[hour] = (byHour[hour] || 0) + 1;
  });

  // By device (from user agent)
  const byDevice: Record<string, number> = { desktop: 0, mobile: 0, tablet: 0, other: 0 };
  loginLogs.forEach((l) => {
    const ua = (l.userAgent || "").toLowerCase();
    if (ua.includes("mobile") || ua.includes("android") || ua.includes("iphone")) {
      byDevice.mobile++;
    } else if (ua.includes("tablet") || ua.includes("ipad")) {
      byDevice.tablet++;
    } else if (ua.includes("mozilla") || ua.includes("chrome") || ua.includes("safari")) {
      byDevice.desktop++;
    } else {
      byDevice.other++;
    }
  });

  // Daily logins
  const dailyLogins: Record<string, { success: number; failed: number }> = {};
  loginLogs.forEach((l) => {
    const day = l.createdAt.toISOString().split("T")[0];
    if (!dailyLogins[day]) dailyLogins[day] = { success: 0, failed: 0 };
    if (l.action === "LOGIN_FAILED") dailyLogins[day].failed++;
    else dailyLogins[day].success++;
  });

  // Top IPs with failed logins
  const failedByIp: Record<string, number> = {};
  loginLogs
    .filter((l) => l.action === "LOGIN_FAILED")
    .forEach((l) => {
      const ip = l.ipAddress || "unknown";
      failedByIp[ip] = (failedByIp[ip] || 0) + 1;
    });

  return {
    summary: {
      totalLogins: loginLogs.length,
      successful,
      failed,
      successRate: loginLogs.length > 0 ? Math.round((successful / loginLogs.length) * 100) : 100,
    },
    byHour: Array.from({ length: 24 }, (_, i) => ({ hour: i, count: byHour[i] || 0 })),
    byDevice,
    dailyLogins: Object.entries(dailyLogins)
      .map(([date, data]) => ({ date, ...data }))
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-30),
    suspiciousIps: Object.entries(failedByIp)
      .filter(([, count]) => count >= 5)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([ip, attempts]) => ({ ip, attempts })),
  };
}

// ─── Subscription Reports ────────────────────────────────
export async function getSubscriptionReport(filter: ReportFilter) {
  const tenants = await prisma.tenant.findMany({
    select: {
      id: true,
      name: true,
      plan: true,
      subscriptionStatus: true,
      subscriptionStart: true,
      subscriptionEnd: true,
      monthlyFee: true,
      createdAt: true,
      isActive: true,
    },
  });

  // MRR calculation
  const activeSubs = tenants.filter((t) => t.subscriptionStatus === "active" && t.monthlyFee);
  const mrr = activeSubs.reduce((sum, t) => sum + (t.monthlyFee || 0), 0);
  const arr = mrr * 12;

  // Churn - tenants that became inactive
  const now = new Date();
  const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const churned = tenants.filter(
    (t) => !t.isActive && t.subscriptionEnd && t.subscriptionEnd >= lastMonth
  ).length;
  const churnRate = activeSubs.length > 0 ? Math.round((churned / activeSubs.length) * 100) : 0;

  // LTV estimate (avg monthly fee * avg lifetime in months)
  const avgMonthlyFee = activeSubs.length > 0
    ? activeSubs.reduce((sum, t) => sum + (t.monthlyFee || 0), 0) / activeSubs.length
    : 0;
  const avgLifetimeMonths = tenants.length > 0
    ? tenants.reduce((sum, t) => {
        const start = t.subscriptionStart || t.createdAt;
        const end = t.subscriptionEnd || now;
        return sum + Math.max(1, Math.round((end.getTime() - start.getTime()) / (30 * 24 * 60 * 60 * 1000)));
      }, 0) / tenants.length
    : 0;
  const ltv = Math.round(avgMonthlyFee * avgLifetimeMonths);

  // Plan distribution
  const planRevenue: Record<string, { count: number; revenue: number }> = {};
  tenants.forEach((t) => {
    const plan = t.plan || "free";
    if (!planRevenue[plan]) planRevenue[plan] = { count: 0, revenue: 0 };
    planRevenue[plan].count++;
    planRevenue[plan].revenue += t.monthlyFee || 0;
  });

  // MRR trend (mock last 12 months based on current data)
  const mrrTrend = Array.from({ length: 12 }, (_, i) => {
    const date = new Date(now.getFullYear(), now.getMonth() - 11 + i, 1);
    const activeAtDate = tenants.filter(
      (t) => t.createdAt <= date && (t.isActive || (t.subscriptionEnd && t.subscriptionEnd > date))
    );
    return {
      month: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`,
      mrr: activeAtDate.reduce((sum, t) => sum + (t.monthlyFee || 0), 0),
      subscribers: activeAtDate.length,
    };
  });

  return {
    summary: {
      mrr,
      arr,
      churnRate,
      ltv,
      activeSubscriptions: activeSubs.length,
      avgMonthlyFee: Math.round(avgMonthlyFee * 100) / 100,
    },
    planRevenue,
    mrrTrend,
    churnedTenants: tenants
      .filter((t) => !t.isActive)
      .slice(0, 10)
      .map((t) => ({
        name: t.name,
        plan: t.plan,
        churned: t.subscriptionEnd,
        lifetime: t.subscriptionStart
          ? Math.round(
              ((t.subscriptionEnd || now).getTime() - t.subscriptionStart.getTime()) /
                (30 * 24 * 60 * 60 * 1000)
            )
          : 0,
      })),
  };
}

// ─── System Reports ──────────────────────────────────────
export async function getSystemReport() {
  const [totalUsers, totalTenants, totalLogs, dbSize] = await Promise.all([
    prisma.user.count(),
    prisma.tenant.count(),
    prisma.auditLog.count(),
    prisma.$runCommandRaw({ dbStats: 1 }),
  ]);

  return {
    summary: {
      totalUsers,
      totalTenants,
      totalLogs,
      dbSizeBytes: (dbSize as any)?.dataSize || 0,
      dbSizeMB: Math.round(((dbSize as any)?.dataSize || 0) / (1024 * 1024)),
      uptime: process.uptime(),
      nodeVersion: process.version,
      memoryUsage: process.memoryUsage(),
    },
  };
}

// ─── Export Report ───────────────────────────────────────
export async function exportReport(reportType: string, filter: ReportFilter, format: string) {
  let data: any;

  switch (reportType) {
    case "revenue":
      data = await getRevenueReport(filter);
      break;
    case "tenants":
      data = await getTenantReport(filter);
      break;
    case "usage":
      data = await getUsageReport(filter);
      break;
    case "login":
      data = await getLoginReport(filter);
      break;
    case "subscription":
      data = await getSubscriptionReport(filter);
      break;
    case "system":
      data = await getSystemReport();
      break;
    default:
      data = {};
  }

  if (format === "csv") {
    // Flatten the chart data for CSV export
    const chartData = data.chartData || data.dailyLogins || data.mrrTrend || [];
    if (chartData.length === 0) {
      return { data: "No data available", contentType: "text/csv", filename: `${reportType}-report.csv` };
    }
    const headers = Object.keys(chartData[0]);
    const csv = [
      headers.join(","),
      ...chartData.map((row: any) => headers.map((h) => `"${row[h] ?? ""}"`).join(",")),
    ].join("\n");
    return { data: csv, contentType: "text/csv", filename: `${reportType}-report-${Date.now()}.csv` };
  }

  return { data, contentType: "application/json", filename: `${reportType}-report-${Date.now()}.json` };
}
