
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

// POST /assign/student
export const assignFeesToStudentController = async (req: any, res: any) => {
  try {
    const tenantId = req.user?.tenantId;
    const { enrollmentId } = req.body;

    if (!enrollmentId) {
      return res.status(400).json({ error: "enrollmentId is required" });
    }

    const result = await assignFeesToStudent(enrollmentId, tenantId);
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

// GET /search?admissionNo=XXX
// GET /search?q=name/admNo/class
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
// POST /collect
export const collectPaymentController = async (req: any, res: any) => {
  try {
    const tenantId = req.user?.tenantId;
    const userId = req.user?.userId;
    const { studentFeeId, amount, method, reference, remarks } = req.body;

    if (!studentFeeId || !amount || !method) {
      return res.status(400).json({ error: "studentFeeId, amount, and method are required" });
    }

    if (amount <= 0) {
      return res.status(400).json({ error: "Amount must be greater than zero" });
    }

    const result = await collectPayment({
      studentFeeId,
      amount: parseFloat(amount),
      method,
      reference,
      remarks,
      collectedBy: userId,
      tenantId,
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
    res.json(result);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

