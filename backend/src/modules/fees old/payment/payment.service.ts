import prisma from "../../../utils/prisma";

//////////////////////////////
// CREATE PAYMENT
//////////////////////////////
export const createPaymentService = async ({
  studentFeeId,
  amount,
  method,
  reference,
  tenantId,
}: {
  studentFeeId: string;
  amount: number;
  method: "CASH" | "ONLINE";
  reference?: string;
  tenantId: string;
}) => {

  //////////////////////////
  // 🔒 VALIDATION
  //////////////////////////
  if (!studentFeeId || !amount || !method) {
    throw new Error("Required fields missing");
  }

  if (amount <= 0) {
    throw new Error("Invalid amount");
  }

  if (method === "ONLINE" && !reference) {
    throw new Error("Reference required for online payment");
  }

  //////////////////////////
  // 🚀 TRANSACTION
  //////////////////////////
  return await prisma.$transaction(async (tx) => {

    const studentFee = await tx.studentFee.findFirst({
      where: {
        id: studentFeeId,
        tenantId, // 🔥 FIX
      },
    });

    if (!studentFee) {
      throw new Error("Student fee not found");
    }

    if (studentFee.status === "PAID") {
      throw new Error("Fee already paid");
    }

    if (amount > studentFee.pendingAmount) {
      throw new Error("Amount exceeds pending fee");
    }

    //////////////////////////
    // 💰 CREATE PAYMENT
    //////////////////////////
    const payment = await tx.payment.create({
      data: {
        studentFeeId,
        amount: Number(amount),
        method,
        reference: reference ?? null,
        receiptNo: `RCPT-${Date.now()}`,
        tenantId, // 🔥 FIX
      },
    });

    //////////////////////////
    // 🧮 CALCULATE
    //////////////////////////
    const newPaid = studentFee.paidAmount + Number(amount);
    const newPending = studentFee.totalAmount - newPaid;

    let status: "UNPAID" | "PARTIAL" | "PAID";

    if (newPending === 0) status = "PAID";
    else if (newPaid === 0) status = "UNPAID";
    else status = "PARTIAL";

    //////////////////////////
    // 🔄 UPDATE FEE
    //////////////////////////
    const updatedFee = await tx.studentFee.update({
      where: { id: studentFeeId },
      data: {
        paidAmount: newPaid,
        pendingAmount: newPending,
        status,
      },
    });

    return {
      payment,
      updatedFee,
    };
  });
};

//////////////////////////////
// GET PAYMENTS
//////////////////////////////
export const getPaymentsService = async (
  studentFeeId: string,
  tenantId: string
) => {
  return await prisma.payment.findMany({
    where: {
      studentFeeId,
      tenantId, // 🔥 FIX
    },
    orderBy: {
      createdAt: "desc",
    },
  });
};