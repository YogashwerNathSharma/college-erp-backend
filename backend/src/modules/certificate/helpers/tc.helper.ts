import prisma from "../../../config/prisma";

interface TCGeneratedData {
  studentName: string;
  fatherName: string;
  motherName: string;
  dob: Date;
  admissionNo: string;
  admissionDate: Date | null;
  className: string;
  conduct: string;
  characterRating: string;
}

export const generateTCData = (student: any, reason: string): TCGeneratedData => {
  const enrollment = student.enrollments?.[0];

  return {
    studentName: `${student.firstName} ${student.lastName}`,
    fatherName: student.fatherName || "",
    motherName: student.motherName || "",
    dob: student.dob,
    admissionNo: student.admissionNo,
    admissionDate: student.admissionDate || null,
    className: enrollment?.class?.name || "N/A",
    conduct: "Good", // Default, can be fetched from behavior records
    characterRating: "Good",
  };
};

export const getTCTemplate = async (tenantId: string): Promise<any> => {
  // Fetch tenant-specific TC template/settings
  const settings = await prisma.setting.findFirst({
    where: { tenantId, key: "tc_template" },
  });

  return settings?.value || getDefaultTCTemplate();
};

const getDefaultTCTemplate = () => ({
  headerText: "TRANSFER CERTIFICATE",
  includePhoto: true,
  includeConduct: true,
  includeRemarks: true,
  footerText: "This is to certify that the above information is correct as per our school records.",
  signatureFields: ["Class Teacher", "Principal"],
});

export const validateTCEligibility = async (studentId: string, tenantId: string): Promise<{
  eligible: boolean;
  reason?: string;
}> => {
  // Check if student has pending fees
  const pendingFees = await prisma.studentFee.findFirst({
    where: {
      enrollment: { studentId, isDeleted: false },
      tenantId,
      balanceAmount: { gt: 0 },
    },
  });

  if (pendingFees) {
    return { eligible: false, reason: "Student has pending fee balance" };
  }

  // Check if TC already issued
  const existingTC = await prisma.transferCertificate.findFirst({
    where: { studentId, tenantId, status: "APPROVED" },
  });

  if (existingTC) {
    return { eligible: false, reason: "TC already issued for this student" };
  }

  return { eligible: true };
};
