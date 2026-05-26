import prisma from "../../../utils/prisma";

export const getReceiptService = async ({
  paymentId,
  user,
}: {
  paymentId: string;
  user: { tenantId: string };
}) => {

  // 🔥 DEBUG FIRST
  console.log("REQUESTED ID:", paymentId);
  console.log("TENANT:", user.tenantId);

  /////////////////////////
  // 🔥 CORRECT QUERY
  /////////////////////////
  const payment = await prisma.payment.findUnique({
    where: {
      id: paymentId,
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

  console.log("DB PAYMENT:", payment);

  /////////////////////////
  // ❌ VALIDATION
  /////////////////////////
  if (!payment) {
    throw new Error("Payment not found in DB");
  }

  if (payment.tenantId !== user.tenantId) {
    throw new Error("Unauthorized tenant access");
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
    date: new Date(payment.paymentDate).toLocaleDateString("en-IN", {
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