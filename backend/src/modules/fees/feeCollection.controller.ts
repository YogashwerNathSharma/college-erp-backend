

import prisma from "../../utils/prisma";
import {
  assignFeesToStudent,
  assignFeesToClass,
  getStudentFees,
  getStudentFeesByAdmissionNo,
  searchStudents,
  collectPayment,
  applyDiscount,
  getDefaulters,
  getDailyCollection,
} from "./feeCollection.service";

// POST /assign/student — Updated to accept selectedItems for per-student fee head selection
export const assignFeesToStudentController = async (req: any, res: any) => {
  try {
    const tenantId = req.user?.tenantId;
    const { enrollmentId, selectedItems } = req.body;

    if (!enrollmentId) {
      return res.status(400).json({ error: "enrollmentId is required" });
    }

    // selectedItems is optional — if provided, only those fee heads are assigned
    // Format: [{ feeHeadId: "...", amount: 2500, feeHeadName?: "Tuition Fee", frequency?: "PER_INSTALLMENT" }]
    const result = await assignFeesToStudent(enrollmentId, tenantId, selectedItems || undefined);
    res.status(201).json(result);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

// POST /assign/class
export const assignFeesToClassController = async (req: any, res: any) => {
  try {
    const tenantId = req.user?.tenantId;
    const { classId, academicYearId } = req.body;

    if (!classId || !academicYearId) {
      return res.status(400).json({ error: "classId and academicYearId are required" });
    }

    const result = await assignFeesToClass(classId, academicYearId, tenantId);
    res.status(201).json(result);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

// GET /student/:enrollmentId
export const getStudentFeesController = async (req: any, res: any) => {
  try {
    const tenantId = req.user?.tenantId;
    const { enrollmentId } = req.params;

    const result = await getStudentFees(enrollmentId, tenantId);
    res.json(result);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

// GET /search?q=name/admNo/class
export const searchStudentFeesController = async (req: any, res: any) => {
  try {
    const tenantId = req.user?.tenantId;
    const { q, admissionNo } = req.query;

    const query = q || admissionNo;
    if (!query) {
      return res.status(400).json({ error: "Search query (q) is required" });
    }

    const result = await searchStudents(query as string, tenantId);
    res.json(result);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

// POST /collect — Updated with discount support + 100% discount allowed
export const collectPaymentController = async (req: any, res: any) => {
  try {
    const tenantId = req.user?.tenantId;
    const userId = req.user?.userId;
    const { studentFeeId, amount, method, reference, remarks, discountAmount, discountId, paymentDate, fineAmount, selectedItems } = req.body;

    if (!studentFeeId || !method) {
      return res.status(400).json({ error: "studentFeeId and method are required" });
    }

    // Fee collection only allowed on CURRENT DATE
    if (paymentDate) {
      const inputDate = new Date(paymentDate);
      const today = new Date();
      inputDate.setHours(0, 0, 0, 0);
      today.setHours(0, 0, 0, 0);
      if (inputDate.getTime() !== today.getTime()) {
        return res.status(400).json({ error: "Fee collection is only allowed on the current date. Back-dated or future-dated payments are not permitted." });
      }
    }

    const parsedAmount = parseFloat(amount) || 0;
    const parsedDiscount = parseFloat(discountAmount) || 0;
    const parsedFine = parseFloat(fineAmount) || 0;

    if (parsedAmount <= 0 && parsedDiscount <= 0) {
      return res.status(400).json({ error: "Amount or discount must be greater than zero" });
    }

    if (parsedAmount < 0) {
      return res.status(400).json({ error: "Amount cannot be negative" });
    }

    if (parsedDiscount < 0) {
      return res.status(400).json({ error: "Discount cannot be negative" });
    }

    const result = await collectPayment({
      studentFeeId,
      amount: parsedAmount,
      method,
      reference,
      remarks,
      collectedBy: userId,
      tenantId,
      discountAmount: parsedDiscount,
      discountId: discountId || undefined,
      fineAmount: parsedFine,
      selectedItems: selectedItems || undefined,
    });

    res.status(201).json(result);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

// POST /discount
export const applyDiscountController = async (req: any, res: any) => {
  try {
    const tenantId = req.user?.tenantId;
    const { studentFeeId, feeDiscountId } = req.body;

    if (!studentFeeId || !feeDiscountId) {
      return res.status(400).json({ error: "studentFeeId and feeDiscountId are required" });
    }

    const result = await applyDiscount(studentFeeId, feeDiscountId, tenantId);
    res.json(result);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

// GET /defaulters?classId=&fromDate=&toDate=
export const getDefaultersController = async (req: any, res: any) => {
  try {
    const tenantId = req.user?.tenantId;
    const { classId, fromDate, toDate } = req.query;

    const result = await getDefaulters(tenantId, {
      classId: classId as string,
      fromDate: fromDate as string,
      toDate: toDate as string,
    });

    res.json(result);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

// GET /daily-collection?date=YYYY-MM-DD
export const getDailyCollectionController = async (req: any, res: any) => {
  try {
    const tenantId = req.user?.tenantId;
    const { date } = req.query;

    if (!date) {
      return res.status(400).json({ error: "date query param is required (YYYY-MM-DD)" });
    }

    const result = await getDailyCollection(tenantId, date as string);
    res.json({ success: true, data: result });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

// GET /all-payments
export const getAllPaymentsController = async (req: any, res: any) => {
  try {
    const tenantId = req.user?.tenantId;
    if (!tenantId) return res.status(401).json({ error: "Unauthorized" });

    const payments = await prisma.payment.findMany({
      where: { tenantId, isDeleted: false },
      orderBy: { paymentDate: "desc" },
      take: 100,
      include: {
        studentFee: {
          include: {
            enrollment: {
              include: {
                student: { select: { firstName: true, lastName: true, admissionNo: true, fatherName: true, rollNumber: true } },
                class: { select: { name: true } },
                section: { select: { name: true } },
              },
            },
            feeStructure: { select: { name: true } },
            items: true, // ← Include StudentFeeItems
          },
        },
      },
    });

    const data = payments.map((p: any) => ({
      id: p.id,
      studentName: `${p.studentFee?.enrollment?.student?.firstName ?? ""} ${p.studentFee?.enrollment?.student?.lastName ?? ""}`.trim() || "Unknown",
      admissionNo: p.studentFee?.enrollment?.student?.admissionNo || "",
      fatherName: p.studentFee?.enrollment?.student?.fatherName || "—",
      rollNumber: p.studentFee?.enrollment?.student?.rollNumber || p.studentFee?.enrollment?.rollNumber || "—",
      installmentNo: p.studentFee?.installmentNo || 1,
      dueDate: p.studentFee?.dueDate || null,
      balance: p.studentFee?.balanceAmount || 0,
      netAmount: p.studentFee?.netAmount || p.studentFee?.totalAmount || 0,
      totalFee: p.studentFee?.netAmount || p.studentFee?.totalAmount || 0,
      totalPaidTillDate: p.studentFee?.paidAmount || 0,
      feeHead: p.studentFee?.feeStructure?.name || "Fee",
      // Use StudentFeeItems if available
      feeItems: p.studentFee?.items?.length > 0
        ? p.studentFee.items.map((item: any) => ({ name: item.name, amount: item.amount }))
        : [],
      session: "2025-26",
      className: p.studentFee?.enrollment?.class?.name || "—",
      section: p.studentFee?.enrollment?.section?.name || "",
      amount: p.amount,
      paidAmount: p.amount,
      method: p.method,
      receiptNo: p.receiptNo,
      paymentDate: p.paymentDate,
      date: p.paymentDate ? new Date(p.paymentDate).toLocaleDateString("en-IN") : "—",
    }));

    return res.json({ success: true, data });
  } catch (error: any) {
    console.error("All payments error:", error);
    return res.status(500).json({ error: error.message });
  }
};
