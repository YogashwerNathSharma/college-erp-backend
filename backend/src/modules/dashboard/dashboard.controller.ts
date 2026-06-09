import { Request, Response } from "express";
import prisma from "../../utils/prisma";

export const getDashboard = async (
  req: Request,
  res: Response
) => {

  try {

    const {
      tenantId,
      role,
    } = req.user as any;

    console.log("USER =>", req.user);

    //////////////////////////////////////////////////////
    // 🧠 SUPER ADMIN DASHBOARD
    //////////////////////////////////////////////////////

    if (role === "SUPER_ADMIN") {

      //////////////////////////////////////////////////////
      // 📊 TOTAL COUNTS
      //////////////////////////////////////////////////////

      const totalSchools =
        await prisma.tenant.count();

      const totalStudents =
        await prisma.student.count();

      const totalTeachers =
        await prisma.teacher.count();

      //////////////////////////////////////////////////////
      // ✅ ACTIVE TENANTS COUNT
      //////////////////////////////////////////////////////

      const activeTenants =
        await prisma.tenant.count({
          where: {
            isActive: true,
          },
        });

      //////////////////////////////////////////////////////
      // ❌ INACTIVE TENANTS COUNT
      //////////////////////////////////////////////////////

      const inactiveTenants =
        await prisma.tenant.count({
          where: {
            isActive: false,
          },
        });

      //////////////////////////////////////////////////////
      // 🟢 ACTIVE TENANT LIST
      //////////////////////////////////////////////////////

      const activeTenantList =
        await prisma.tenant.findMany({

          where: {
            isActive: true,
          },

          //////////////////////////////////////////////////
          // 🔥 FIXED
          //////////////////////////////////////////////////

          orderBy: {
            updatedAt: "desc",
          },

          select: {
            id: true,
            name: true,
            logoUrl: true,
            isActive: true,
            createdAt: true,
            updatedAt: true,
          },
        });

      //////////////////////////////////////////////////////
      // 🔴 INACTIVE TENANT LIST
      //////////////////////////////////////////////////////

      const inactiveTenantList =
        await prisma.tenant.findMany({

          where: {
            isActive: false,
          },

          //////////////////////////////////////////////////
          // 🔥 FIXED
          //////////////////////////////////////////////////

          orderBy: {
            updatedAt: "desc",
          },

          select: {
            id: true,
            name: true,
            logoUrl: true,
            isActive: true,
            createdAt: true,
            updatedAt: true,
          },
        });

      //////////////////////////////////////////////////////
      // 🏫 RECENT TENANTS
      //////////////////////////////////////////////////////

      const recentTenants =
        await prisma.tenant.findMany({

          take: 5,

          //////////////////////////////////////////////////
          // 🔥 FIXED
          // Recent active/inactive changes show honge
          //////////////////////////////////////////////////

          orderBy: {
            updatedAt: "desc",
          },

          select: {
            id: true,
            name: true,
            logoUrl: true,
            isActive: true,
            createdAt: true,
            updatedAt: true,
          },
        });

      //////////////////////////////////////////////////////
      // 📈 PLATFORM GROWTH
      //////////////////////////////////////////////////////

      const growth =
        totalSchools > 0
          ? (
              (activeTenants /
                totalSchools) *
              100
            ).toFixed(1)
          : "0";

      //////////////////////////////////////////////////////
      // 🚀 SUPER ADMIN RESPONSE
      //////////////////////////////////////////////////////

      return res.json({

        success: true,

        data: {

          //////////////////////////////////////////////////
          // COUNTS
          //////////////////////////////////////////////////

          totalSchools,
          totalStudents,
          totalTeachers,

          //////////////////////////////////////////////////
          // ACTIVE / INACTIVE
          //////////////////////////////////////////////////

          activeTenants,
          inactiveTenants,

          //////////////////////////////////////////////////
          // LISTS
          //////////////////////////////////////////////////

          activeTenantList,
          inactiveTenantList,
          recentTenants,

          //////////////////////////////////////////////////
          // INSIGHTS
          //////////////////////////////////////////////////

          insights: {

            growth: `${growth}%`,

            message:
              Number(growth) > 70
                ? "Most tenants are active 🚀"
                : Number(growth) > 40
                ? "Platform is growing steadily 📈"
                : "Need more active tenants ⚠️",

          },
        },
      });
    }

    //////////////////////////////////////////////////////
    // ❌ TENANT VALIDATION
    //////////////////////////////////////////////////////

    if (!tenantId) {

      return res.status(400).json({

        success: false,

        message: "Tenant not found",

      });
    }

    //////////////////////////////////////////////////////
    // 👨‍🎓 TOTAL STUDENTS
    //////////////////////////////////////////////////////

    const totalStudents =
      await prisma.student.count({
        where: {
          tenantId,
        },
      });

    //////////////////////////////////////////////////////
    // 🏫 TOTAL CLASSES
    //////////////////////////////////////////////////////

    const totalClasses =
      await prisma.class.count({
        where: {
          tenantId,
        },
      });

    //////////////////////////////////////////////////////
    // 💰 FEES SUMMARY
    //////////////////////////////////////////////////////

   const fees = await prisma.studentFee.aggregate({
  _sum: {
    paidAmount: true,
    balanceAmount: true,
    totalAmount: true,
  },
  where: {
    tenantId: tenantId,
    isDeleted: false,
  },
});

   const totalPaid = Math.round(fees._sum.paidAmount ?? 0);
const totalPending = Math.round(fees._sum.balanceAmount ?? 0);

    const tenant =
  await prisma.tenant.findUnique({

    where: {
      id: tenantId,
    },

    select: {
      name: true,
      logoUrl: true,
      backgroundUrl: true,
      type: true,

      address: true,
      phone: true,
      email: true,
    },
  });
    //////////////////////////////////////////////////////
    // 📈 MONTHLY FEES DATA
    //////////////////////////////////////////////////////

    const feeData =
      await prisma.studentFee.findMany({

        where: {
          tenantId,
        },

        select: {
          paidAmount: true,
          createdAt: true,
        },

        orderBy: {
          createdAt: "asc",
        },
      });

    const monthlyMap:
      Record<string, number> = {};

   feeData.forEach((f: any) => {

      if (!f.createdAt) return;

      const date =
        new Date(f.createdAt);

      const key =
        `${date.getFullYear()}-${date.getMonth()}`;

      monthlyMap[key] =
        (monthlyMap[key] || 0) +
        (f.paidAmount ?? 0);

    });

    const monthlyData =
      Object.keys(monthlyMap).map(
        (k) => {

          const [year, month] =
            k.split("-");

          const date =
            new Date(
              Number(year),
              Number(month)
            );

          return {

            month:
              date.toLocaleString(
                "default",
                {
                  month: "short",
                }
              ),

            fees:
              monthlyMap[k],

          };
        }
      );

    //////////////////////////////////////////////////////
    // 💳 RECENT PAYMENTS
    //////////////////////////////////////////////////////

    const recentPaymentsRaw =
      await prisma.studentFee.findMany({

        where: {
          tenantId,
        },

        orderBy: {
          createdAt: "desc",
        },

        take: 5,

        select: {

          paidAmount: true,
          createdAt: true,

          enrollment: {
            select: {
              student: {
                select: {
                  firstName: true,
                  lastName: true,
                },
              },
            },
          },
        },
      });

    const recentPayments =
      recentPaymentsRaw.map(
        (p: any) => ({

          amount:
            p.paidAmount ?? 0,

          date:
            p.createdAt,

          studentName:
            `${p.enrollment?.student?.firstName ?? ""} ${p.enrollment?.student?.lastName ?? ""}`.trim() ||
            "Unknown",

        })
      );

    //////////////////////////////////////////////////////
    // ⚠️ TOP DEFAULTERS
    //////////////////////////////////////////////////////

    const defaultersRaw =
      await prisma.studentFee.findMany({

        where: {

          tenantId,

          balanceAmount: {
            gt: 0,
          },
        },

        orderBy: {
          balanceAmount: "desc",
        },

        take: 5,

        select: {

          balanceAmount: true,

          enrollment: {
            select: {
              student: {
                select: {
                  firstName: true,
                  lastName: true,
                },
              },
            },
          },
        },
      });

    const defaulters =
      defaultersRaw.map(
        (d: any) => ({

          amount:
            d.pendingAmount ?? 0,

          studentName:
            `${d.enrollment?.student?.firstName ?? ""} ${d.enrollment?.student?.lastName ?? ""}`.trim() ||
            "Unknown",

        })
      );

    //////////////////////////////////////////////////////
    // 📊 MONTHLY INSIGHTS
    //////////////////////////////////////////////////////

    const currentMonth =
      monthlyData[monthlyData.length - 1]?.fees ?? 0;

    const prevMonth =
      monthlyData[monthlyData.length - 2]?.fees ?? 0;

    let growth = 0;

    if (prevMonth > 0 && currentMonth > 0) {
      growth = ((currentMonth - prevMonth) / prevMonth) * 100;
    } else if (prevMonth === 0 && currentMonth > 0) {
      growth = 100;
    } else if (prevMonth > 0 && currentMonth === 0) {
      growth = -100;
    }

    const insights = {
      growth: `${growth.toFixed(1)}%`,
      message:
        growth > 0
          ? "Fees collection increased this month 📈"
          : growth < 0
          ? "Fees collection dropped this month 📉"
          : "No change in fee collection",
    };

    //////////////////////////////////////////////////////
    // 🚀 TENANT DASHBOARD RESPONSE
    //////////////////////////////////////////////////////

    return res.json({

      success: true,

      data: {

        totalStudents,
        totalClasses,

        totalPaid,
        totalPending,

        monthlyData,

        recentPayments,

        defaulters,

        insights,

        tenant,
      },
    });

  } catch (err: any) {

    console.error(
      "🔥 DASHBOARD ERROR:",
      err.message
    );

    console.error(err);

    return res.status(500).json({

      success: false,

      message:
        "Dashboard failed",

      error:
        err.message,

    });
  }
};