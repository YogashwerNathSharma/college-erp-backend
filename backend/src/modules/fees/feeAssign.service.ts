

import prisma from "../../utils/prisma";


interface SelectedFeeItem {


  feeHeadId: string;


  amount: number;


  feeHeadName?: string;


  frequency?: string;


}


/**


 * Get students in a class with their fee assignment status


 */


export const getStudentsWithAssignmentStatus = async (


  classId: string,


  academicYearId: string,


  tenantId: string


) => {


  // Get all active enrollments in the class


  const enrollments = await prisma.enrollment.findMany({


    where: {


      classId,


      academicYearId,


      tenantId,


      status: "active",


      isDeleted: false,


    },


    include: {


      student: {


        select: {


          firstName: true,


          lastName: true,


          admissionNo: true,


          fatherName: true,


          phone: true,


        },


      },


      section: { select: { name: true } },


    },


    orderBy: { rollNumber: "asc" },


  });


  // Get all student fees for this class to determine assignment status


  const studentFees = await prisma.studentFee.findMany({


    where: {


      tenantId,


      enrollment: {


        classId,


        academicYearId,


      },


      isDeleted: false,


    },


    select: {


      enrollmentId: true,


      status: true,


    },


  });


  // Group fees by enrollment


  const feesByEnrollment: Record<string, string[]> = {};


  for (const fee of studentFees) {


    if (!feesByEnrollment[fee.enrollmentId]) {


      feesByEnrollment[fee.enrollmentId] = [];


    }


    feesByEnrollment[fee.enrollmentId].push(fee.status);


  }


  // Build response


  const students = enrollments.map((enrollment, index) => {


    const feeStatuses = feesByEnrollment[enrollment.id] || [];


    let assignmentStatus: "ASSIGNED" | "NOT_ASSIGNED" | "PARTIAL" = "NOT_ASSIGNED";


    if (feeStatuses.length > 0) {


      assignmentStatus = "ASSIGNED";


    }


    return {


      id: enrollment.id,


      rollNumber: enrollment.rollNumber || String(index + 1),


      studentName: (() => { const fn = enrollment.student.firstName ?? ""; const ln = enrollment.student.lastName ?? ""; return fn.toLowerCase() === ln.toLowerCase() ? fn : `${fn} ${ln}`.trim(); })(),


      admissionNo: enrollment.student.admissionNo,


      fatherName: enrollment.student.fatherName,


      phone: enrollment.student.phone,


      section: enrollment.section?.name || "-",


      assignmentStatus,


      totalFees: feeStatuses.length,


    };


  });


  const totalStudents = students.length;


  const assignedCount = students.filter((s) => s.assignmentStatus === "ASSIGNED").length;


  const unassignedCount = students.filter((s) => s.assignmentStatus === "NOT_ASSIGNED").length;


  return {


    students,


    summary: {


      totalStudents,


      assignedCount,


      unassignedCount,


    },


  };


};


/**


 * ═══════════════════════════════════════════════════════════════════════


 * BULK ASSIGN FEES — Optimized for speed (batch DB operations)


 * ═══════════════════════════════════════════════════════════════════════


 *


 * Instead of calling assignFeesToStudent() per-student (N sequential calls),


 * this does:


 *   1. Validate all enrollments in ONE query


 *   2. Filter out already-assigned in ONE query


 *   3. Fetch fee structure ONCE (shared for same class)


 *   4. Fetch transport/hostel in ONE query each


 *   5. Build all StudentFee records in memory


 *   6. createMany() in ONE batch


 *   7. Fetch created IDs, build StudentFeeItem records in memory


 *   8. createMany() StudentFeeItems in ONE batch


 *


 * Result: ~8 DB calls total vs ~30*N before.


 */


export const assignFeesToSelectedStudents = async (


  enrollmentIds: string[],


  tenantId: string,


  selectedItems?: SelectedFeeItem[]


) => {


  // 1. Fetch all enrollments in ONE query


  const enrollments = await prisma.enrollment.findMany({


    where: {


      id: { in: enrollmentIds },


      tenantId,


      isDeleted: false,


    },


    include: { academicYear: true },


  });


  if (enrollments.length === 0) {


    throw new Error("No valid enrollments found");


  }


  // 2. Check which already have fees assigned — ONE query


  const existingFees = await prisma.studentFee.findMany({


    where: {


      enrollmentId: { in: enrollmentIds },


      tenantId,


      isDeleted: false,


    },


    select: { enrollmentId: true },


    distinct: ["enrollmentId"],


  });


  const alreadyAssignedSet = new Set(existingFees.map((f) => f.enrollmentId));


  const eligibleEnrollments = enrollments.filter((e) => !alreadyAssignedSet.has(e.id));


  const skipCount = alreadyAssignedSet.size;


  if (eligibleEnrollments.length === 0) {


    return {


      message: `All ${skipCount} students already have fees assigned. Skipped all.`,


      successCount: 0,


      skipCount,


      errors: [],


    };


  }


  // 3. Get fee structures for the class(es) — ONE query


  //    (all students in same assign batch are typically same class, but handle multi-class)


  const classIds = [...new Set(eligibleEnrollments.map((e) => e.classId))];


  const academicYearIds = [...new Set(eligibleEnrollments.map((e) => e.academicYearId))];


  const feeStructures = await prisma.feeStructure.findMany({


    where: {


      tenantId,


      classId: { in: classIds },


      academicYearId: { in: academicYearIds },


      isDeleted: false,


    },


    include: {


      items: {


        include: { feeHead: true },


      },


    },


  });


  if (feeStructures.length === 0) {


    throw new Error("No fee structure found for this class");


  }


  // 4. Fetch transport assignments for all eligible students — ONE query


  const studentIds = eligibleEnrollments.map((e) => e.studentId);


  const transportAssignments = await prisma.transportAssignment.findMany({


    where: {


      studentId: { in: studentIds },


      tenantId,


      status: "ACTIVE",


      isDeleted: false,


    },


  });


  const transportByStudent: Record<string, number> = {};


  for (const ta of transportAssignments) {


    transportByStudent[ta.studentId] = ta.monthlyFee || 0;


  }


  // 5. Fetch hostel allocations — ONE query


  let hostelByStudent: Record<string, number> = {};


  try {


    const hostelAllocations = await prisma.hostelAllocation.findMany({


      where: {


        studentId: { in: studentIds },


        tenantId,


        status: "ACTIVE",


      },


      include: { room: true },


    });


    for (const ha of hostelAllocations) {


      hostelByStudent[ha.studentId] = (ha.room as any)?.monthlyFee || (ha.room as any)?.rentPerBed || 0;


    }


  } catch {


    hostelByStudent = {};


  }


  // 6. Lookup transport & hostel fee heads ONCE


  let transportFeeHeadId: string | null = null;


  let hostelFeeHeadId: string | null = null;


  const hasAnyTransport = Object.values(transportByStudent).some((v) => v > 0);


  const hasAnyHostel = Object.values(hostelByStudent).some((v) => v > 0);


  if (hasAnyTransport) {


    const transportHead = await prisma.feeHead.findFirst({


      where: { tenantId, name: { contains: "transport", mode: "insensitive" }, isDeleted: false },


    });


    transportFeeHeadId = transportHead?.id || null;


  }


  if (hasAnyHostel) {


    const hostelHead = await prisma.feeHead.findFirst({


      where: { tenantId, name: { contains: "hostel", mode: "insensitive" }, isDeleted: false },


    });


    hostelFeeHeadId = hostelHead?.id || null;


  }


  // 7. Build all StudentFee records in memory


  const allStudentFees: any[] = [];


  // Track metadata for StudentFeeItem creation later


  const metaMap: Map<string, { structureId: string; installmentNo: number; enrollmentId: string; studentId: string }[]> = new Map();


  for (const enrollment of eligibleEnrollments) {


    // Find matching fee structure(s) for this student's class + academic year


    const matchingStructures = feeStructures.filter(


      (s) => s.classId === enrollment.classId && s.academicYearId === enrollment.academicYearId


    );


    if (matchingStructures.length === 0) continue;


    const academicYearStart = new Date(enrollment.academicYear.startDate);


    const transportFee = transportByStudent[enrollment.studentId] || 0;


    const hostelFee = hostelByStudent[enrollment.studentId] || 0;


    for (const structure of matchingStructures) {


      let totalInstallments = structure.totalInstallments || 12;


      const dueDay = structure.dueDay || 10;


      // Use selectedItems if provided, otherwise use structure items


      let recurringItems: { feeHeadId: string; amount: number; feeHeadName?: string }[];


      let oneTimeItems: { feeHeadId: string; amount: number; feeHeadName?: string }[];


      if (selectedItems && selectedItems.length > 0) {


        recurringItems = selectedItems.filter((i) => (i.frequency || "PER_INSTALLMENT") === "PER_INSTALLMENT");


        oneTimeItems = selectedItems.filter((i) => i.frequency === "ONE_TIME");


      } else {


        recurringItems = structure.items


          .filter((item) => item.frequency === "PER_INSTALLMENT")


          .map((item) => ({ feeHeadId: item.feeHeadId, amount: item.amount, feeHeadName: item.feeHead.name }));


        oneTimeItems = structure.items


          .filter((item) => item.frequency === "ONE_TIME")


          .map((item) => ({ feeHeadId: item.feeHeadId, amount: item.amount, feeHeadName: item.feeHead.name }));


      }


      // If recurring items exist, ensure at least 12 installments (monthly)
      if (recurringItems.length > 0 && totalInstallments < 2) {
        totalInstallments = 12;
      }
      // If only one-time items, force 1 installment
      if (recurringItems.length === 0 && oneTimeItems.length > 0) {
        totalInstallments = 1;
      }
      const recurringTotal = recurringItems.reduce((sum, item) => sum + item.amount, 0);


      const oneTimeTotal = oneTimeItems.reduce((sum, item) => sum + item.amount, 0);


      for (let i = 1; i <= totalInstallments; i++) {


        const dueDate = new Date(academicYearStart);


        dueDate.setMonth(dueDate.getMonth() + (i - 1));


        dueDate.setDate(dueDay);


        let installmentAmount = recurringTotal;


        if (i === 1) installmentAmount += oneTimeTotal;


        if (transportFee > 0) installmentAmount += transportFee;


        if (hostelFee > 0) installmentAmount += hostelFee;


        // Unique key for matching later


        const uniqueKey = `${enrollment.id}|${structure.id}|${i}`;


        allStudentFees.push({


          tenantId,


          enrollmentId: enrollment.id,


          feeStructureId: structure.id,


          totalAmount: installmentAmount,


          discountAmount: 0,


          fineAmount: 0,


          netAmount: installmentAmount,


          paidAmount: 0,


          balanceAmount: installmentAmount,


          installmentNo: i,


          dueDate,


          status: "PENDING",


        });


        // Store metadata for StudentFeeItem creation


        if (!metaMap.has(enrollment.id)) metaMap.set(enrollment.id, []);


        metaMap.get(enrollment.id)!.push({


          structureId: structure.id,


          installmentNo: i,


          enrollmentId: enrollment.id,


          studentId: enrollment.studentId,


        });


      }


    }


  }


  if (allStudentFees.length === 0) {


    return {


      message: "No fee records to create (no matching structures found)",


      successCount: 0,


      skipCount,


      errors: [],


    };


  }


  // 8. BATCH CREATE all StudentFee records — ONE createMany


  await prisma.studentFee.createMany({ data: allStudentFees });


  // 9. Fetch created StudentFee IDs for StudentFeeItem linking


  const createdFees = await prisma.studentFee.findMany({


    where: {


      enrollmentId: { in: eligibleEnrollments.map((e) => e.id) },


      tenantId,


      isDeleted: false,


    },


    select: {


      id: true,


      enrollmentId: true,


      feeStructureId: true,


      installmentNo: true,


    },


    orderBy: [{ enrollmentId: "asc" }, { feeStructureId: "asc" }, { installmentNo: "asc" }],


  });


  // 10. Build StudentFeeItem records in memory


  const allFeeItems: any[] = [];


  for (const fee of createdFees) {


    const enrollment = eligibleEnrollments.find((e) => e.id === fee.enrollmentId);


    if (!enrollment) continue;


    const structure = feeStructures.find((s) => s.id === fee.feeStructureId);


    if (!structure) continue;


    // Determine which items to use


    let recurringItems: { feeHeadId: string; amount: number; name: string }[];


    let oneTimeItems: { feeHeadId: string; amount: number; name: string }[];


    if (selectedItems && selectedItems.length > 0) {


      recurringItems = selectedItems


        .filter((i) => (i.frequency || "PER_INSTALLMENT") === "PER_INSTALLMENT")


        .map((i) => ({ feeHeadId: i.feeHeadId, amount: i.amount, name: i.feeHeadName || "" }));


      oneTimeItems = selectedItems


        .filter((i) => i.frequency === "ONE_TIME")


        .map((i) => ({ feeHeadId: i.feeHeadId, amount: i.amount, name: i.feeHeadName || "" }));


    } else {


      recurringItems = structure.items


        .filter((item) => item.frequency === "PER_INSTALLMENT")


        .map((item) => ({ feeHeadId: item.feeHeadId, amount: item.amount, name: item.feeHead.name }));


      oneTimeItems = structure.items


        .filter((item) => item.frequency === "ONE_TIME")


        .map((item) => ({ feeHeadId: item.feeHeadId, amount: item.amount, name: item.feeHead.name }));


    }


    // PER_INSTALLMENT items → every installment


    for (const item of recurringItems) {


      allFeeItems.push({


        studentFeeId: fee.id,


        feeHeadId: item.feeHeadId,


        name: item.name,


        amount: item.amount,


        frequency: "PER_INSTALLMENT",


      });


    }


    // ONE_TIME items → only installment #1


    if (fee.installmentNo === 1) {


      for (const item of oneTimeItems) {


        allFeeItems.push({


          studentFeeId: fee.id,


          feeHeadId: item.feeHeadId,


          name: item.name,


          amount: item.amount,


          frequency: "ONE_TIME",


        });


      }


    }


    // Transport fee item


    const transportFee = transportByStudent[enrollment.studentId] || 0;


    if (transportFee > 0 && transportFeeHeadId) {


      allFeeItems.push({


        studentFeeId: fee.id,


        feeHeadId: transportFeeHeadId,


        name: "Transport Fee",


        amount: transportFee,


        frequency: "PER_INSTALLMENT",


      });


    }


    // Hostel fee item


    const hostelFee = hostelByStudent[enrollment.studentId] || 0;


    if (hostelFee > 0 && hostelFeeHeadId) {


      allFeeItems.push({


        studentFeeId: fee.id,


        feeHeadId: hostelFeeHeadId,


        name: "Hostel Fee",


        amount: hostelFee,


        frequency: "PER_INSTALLMENT",


      });


    }


  }


  // 11. BATCH CREATE all StudentFeeItems — ONE createMany


  if (allFeeItems.length > 0) {


    await prisma.studentFeeItem.createMany({ data: allFeeItems });


  }


  const successCount = eligibleEnrollments.length;


  return {


    message: `Fees assigned to ${successCount} students. Skipped: ${skipCount} (already assigned).`,


    successCount,


    skipCount,


    errors: [],


    details: {


      totalInstallmentsCreated: allStudentFees.length,


      totalFeeItemsCreated: allFeeItems.length,


    },


  };


};


/**


 * ═══════════════════════════════════════════════════════════════════════


 * UNASSIGN / DELETE assigned fees for students


 * ═══════════════════════════════════════════════════════════════════════


 *


 * Deletes StudentFeeItem + StudentFee records for given enrollments.


 * ONLY deletes fees that have ZERO payments (paidAmount = 0).


 * Fees with any payment are preserved (cannot unassign partially paid fees).


 */


export const unassignFeesForStudents = async (


  enrollmentIds: string[],


  tenantId: string


) => {


  // 1. Find all StudentFee records that are unpaid for these enrollments


  const feesToDelete = await prisma.studentFee.findMany({


    where: {


      enrollmentId: { in: enrollmentIds },


      tenantId,


      paidAmount: 0,


      isDeleted: false,


    },


    select: { id: true, enrollmentId: true },


  });


  if (feesToDelete.length === 0) {


    return {


      message: "No unpaid fees found to remove. Fees with payments cannot be unassigned.",


      deletedCount: 0,


      enrollmentsAffected: 0,


    };


  }


  const feeIds = feesToDelete.map((f) => f.id);


  const affectedEnrollments = new Set(feesToDelete.map((f) => f.enrollmentId));


  // 2. Delete StudentFeeItems first (child records)


  const deletedItems = await prisma.studentFeeItem.deleteMany({


    where: { studentFeeId: { in: feeIds } },


  });


  // 3. Delete StudentFee records


  const deletedFees = await prisma.studentFee.deleteMany({


    where: { id: { in: feeIds } },


  });


  return {


    message: `Removed ${deletedFees.count} fee installments (${deletedItems.count} line items) for ${affectedEnrollments.size} students.`,


    deletedCount: deletedFees.count,


    deletedItemsCount: deletedItems.count,


    enrollmentsAffected: affectedEnrollments.size,


  };


};


