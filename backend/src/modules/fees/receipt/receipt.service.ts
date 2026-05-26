import prisma from "../../../utils/prisma";

export const getReceiptService = async ({
  paymentId,
  tenantId,
}: {
  paymentId: string;
  tenantId: string;
}) => {

  /////////////////////////
  // 🔒 SAFE QUERY (TENANT FILTER 🔥)
  /////////////////////////
  const payment = await prisma.payment.findFirst({
    where: {
      id: paymentId,
      tenantId, // 🔥 IMPORTANT
    },
    include: {
      tenant: true,
      studentFee: {
        include: {
          enrollment: {
            include: {
              student: true,
              class: true,
              section: true,
            },
          },
        },
      },
    },
  });

  /////////////////////////
  // ❌ VALIDATION
  /////////////////////////
  if (!payment) {
    throw new Error("Receipt not found");
  }

  /////////////////////////
  // SAFE ACCESS
  /////////////////////////
  const enrollment = payment.studentFee?.enrollment;
  const student = enrollment?.student;

  /////////////////////////
  // FINAL RESPONSE
  /////////////////////////
  return {
    header: {
      schoolName: payment.tenant?.name || "School",
      receiptNo: payment.receiptNo,
      date: new Date(payment.createdAt).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }),
    },

    student: {
      name: student
        ? `${student.firstName} ${student.lastName}`
        : "N/A",
      class: enrollment?.class?.name || "N/A",
      section: enrollment?.section?.name || "N/A",
    },

    payment: {
      amount: payment.amount,
      method: payment.method,
      reference: payment.reference,
    },

    fee: {
      total: payment.studentFee?.totalAmount || 0,
      paid: payment.studentFee?.paidAmount || 0,
      pending: payment.studentFee?.pendingAmount || 0,
    },
  };
};