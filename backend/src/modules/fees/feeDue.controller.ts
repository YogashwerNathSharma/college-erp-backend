import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function getDueSummaryController(req: Request, res: Response) {
  try {
    const tenantId = (req as any).user?.tenantId;
    if (!tenantId) return res.status(401).json({ message: "Unauthorized" });

    // Get all classes
    const classes = await prisma.class.findMany({
      where: { tenantId, isDeleted: false },
      orderBy: { name: "asc" },
    });

    // Get all student fees with balance > 0
    const studentFees = await prisma.studentFee.findMany({
      where: {
        tenantId,
        isDeleted: false,
        balanceAmount: { gt: 0 },
      },
      include: {
        enrollment: {
          include: {
            student: true,
            class: true,
            section: true,
          },
        },
      },
    });

    // Group by class
    const classMap: Record<string, any> = {};

    for (const cls of classes) {
      classMap[cls.id] = {
        classId: cls.id,
        className: cls.name,
        totalStudents: 0,
        totalDue: 0,
        totalPaid: 0,
        totalBalance: 0,
        students: [],
      };
    }

    for (const fee of studentFees) {
      const enrollment = fee.enrollment;
      if (!enrollment || !enrollment.student) continue;
      
      const classId = enrollment.classId;
      if (!classMap[classId]) continue;

      // Check if student already added (aggregate per student)
      const existing = classMap[classId].students.find(
        (s: any) => s.studentId === enrollment.studentId
      );

      if (existing) {
        existing.totalDue += fee.totalAmount;
        existing.paidAmount += fee.paidAmount;
        existing.balance += fee.balanceAmount;
      } else {
        classMap[classId].students.push({
          studentId: enrollment.studentId,
          studentName: `${enrollment.student.firstName} ${enrollment.student.lastName}`,
          admissionNo: enrollment.student.admissionNo || "—",
          className: enrollment.class?.name || "",
          sectionName: enrollment.section?.name || "",
          totalDue: fee.totalAmount,
          paidAmount: fee.paidAmount,
          balance: fee.balanceAmount,
        });
      }
    }

    // Calculate totals per class
    for (const cls of Object.values(classMap)) {
      cls.totalStudents = cls.students.length;
      cls.totalDue = cls.students.reduce((s: number, st: any) => s + st.totalDue, 0);
      cls.totalPaid = cls.students.reduce((s: number, st: any) => s + st.paidAmount, 0);
      cls.totalBalance = cls.students.reduce((s: number, st: any) => s + st.balance, 0);
    }

    // Filter out classes with no dues and sort
    const result = Object.values(classMap)
      .filter((c: any) => c.totalBalance > 0)
      .sort((a: any, b: any) => b.totalBalance - a.totalBalance);

    return res.json({ data: result });
  } catch (error: any) {
    console.error("Due summary error:", error);
    return res.status(500).json({ message: "Failed to fetch due summary", error: error.message });
  }
}
