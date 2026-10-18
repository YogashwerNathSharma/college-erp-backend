import prisma from "../../utils/prisma";

//////////////////////////////////////////////////////
// GET REPORTS DATA
//////////////////////////////////////////////////////

export const getReportsDataService = async () => {

  //////////////////////////////////////////////////////
  // 1. STATS
  //////////////////////////////////////////////////////

  const totalRevenue = await prisma.subscriptionPayment.aggregate({
    where: { status: "PAID" },
    _sum: { amount: true },
  });

  const totalTenants = await prisma.tenant.count();

  const activeSubscriptions = await prisma.tenantSubscription.count({
    where: { isActive: true },
  });

  const pendingPayments = await prisma.subscriptionPayment.count({
    where: { status: "PENDING" },
  });

  //////////////////////////////////////////////////////
  // 2. MONTHLY REVENUE (Last 12 months)
  //////////////////////////////////////////////////////

  const twelveMonthsAgo = new Date();
  twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

  const payments = await prisma.subscriptionPayment.findMany({
    where: {
      status: "PAID",
      paidAt: { gte: twelveMonthsAgo },
    },
    select: {
      amount: true,
      paidAt: true,
    },
  });

  // Group by month
  const monthlyMap: Record<string, number> = {};
  const months = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
  ];

  payments.forEach((p) => {
    if (p.paidAt) {
      const date = new Date(p.paidAt);
      const key = `${months[date.getMonth()]} ${date.getFullYear()}`;
      monthlyMap[key] = (monthlyMap[key] || 0) + p.amount;
    }
  });

  // Convert to array (last 12 months ordered)
  const monthlyRevenue: { month: string; revenue: number }[] = [];
  for (let i = 11; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    const key = `${months[d.getMonth()]} ${d.getFullYear()}`;
    monthlyRevenue.push({
      month: key,
      revenue: monthlyMap[key] || 0,
    });
  }

  //////////////////////////////////////////////////////
// 3. PAYMENT HISTORY
//////////////////////////////////////////////////////

let paymentHistory: any[] = [];
try {
  // Step 1: Get valid subscription IDs that HAVE a valid planId
  const validSubs = await prisma.tenantSubscription.findMany({
    where: {
      planId: { not: undefined },
    },
    select: { id: true, planId: true },
  });

  // Step 2: Verify planIds exist in SubscriptionPlan
  const allPlans = await prisma.subscriptionPlan.findMany({
    select: { id: true },
  });
  const validPlanIds = allPlans.map((p) => p.id);

  const validSubIds = validSubs
    .filter((s) => validPlanIds.includes(s.planId))
    .map((s) => s.id);

  // Step 3: Fetch payments only for valid subscriptions
  if (validSubIds.length > 0) {
    const historyPayments = await prisma.subscriptionPayment.findMany({
      where: {
        subscriptionId: { in: validSubIds },
      },
      include: {
        subscription: {
          include: {
            tenant: true,
            plan: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    paymentHistory = historyPayments.map((p) => ({
      id: p.id,
      tenantName: p.subscription?.tenant?.name || "Unknown",
      planName: p.subscription?.plan?.name || "N/A",
      amount: p.amount,
      currency: p.currency || "INR",
      status: p.status,
      gateway: p.gateway || "razorpay",
      paidAt: p.paidAt || null,
      createdAt: p.createdAt,
      razorpayPaymentId: p.razorpayPaymentId || null,
    }));
  }
} catch (err) {
  console.error("Payment history fetch error:", err);
  paymentHistory = [];
}

  //////////////////////////////////////////////////////
  // 4. TENANT-WISE REVENUE
  //////////////////////////////////////////////////////

  const tenantRevenue = await prisma.subscriptionPayment.groupBy({
    by: ["subscriptionId"],
    where: { status: "PAID" },
    _sum: { amount: true },
  });

  const subscriptionIds = tenantRevenue.map((t) => t.subscriptionId);
  const subscriptions = await prisma.tenantSubscription.findMany({
    where: { id: { in: subscriptionIds } },
    include: { tenant: { select: { name: true } } },
  });

  const tenantWise = subscriptions.map((sub) => {
    const rev = tenantRevenue.find((t) => t.subscriptionId === sub.id);
    return {
      tenantName: sub.tenant.name,
      totalPaid: rev?._sum?.amount || 0,
    };
  });

  const tenantMerged: Record<string, number> = {};
  tenantWise.forEach((t) => {
    tenantMerged[t.tenantName] = (tenantMerged[t.tenantName] || 0) + t.totalPaid;
  });

  const tenantRevenueList = Object.entries(tenantMerged).map(([name, amount]) => ({
    tenantName: name,
    totalPaid: amount,
  }));

  //////////////////////////////////////////////////////
  // RETURN
  //////////////////////////////////////////////////////

  return {
    stats: {
      totalRevenue: totalRevenue._sum.amount || 0,
      totalTenants,
      activeSubscriptions,
      pendingPayments,
    },
    monthlyRevenue,
    paymentHistory,
    tenantRevenue: tenantRevenueList,
  };
};