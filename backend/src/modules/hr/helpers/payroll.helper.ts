import prisma from "../../../config/prisma";

interface PayrollCalculation {
  basicSalary: number;
  hra: number;
  da: number;
  ta: number;
  otherAllowances: number;
  grossSalary: number;
  pf: number;
  esi: number;
  tds: number;
  professionalTax: number;
  otherDeductions: number;
  totalDeductions: number;
  netSalary: number;
  workingDays: number;
  presentDays: number;
  leaveDays: number;
}

export const calculatePayroll = (staff: any, month: number, year: number): PayrollCalculation => {
  const basicSalary = staff.basicSalary || 0;

  // Standard allowances (configurable per institution)
  const hra = basicSalary * 0.4; // 40% of basic
  const da = basicSalary * 0.12; // 12% of basic
  const ta = staff.travelAllowance || 1600;
  const otherAllowances = staff.otherAllowances || 0;

  const grossSalary = basicSalary + hra + da + ta + otherAllowances;

  // Deductions
  const pf = basicSalary * 0.12; // 12% PF
  const esi = grossSalary <= 21000 ? grossSalary * 0.0075 : 0; // ESI if gross <= 21000
  const tds = staff.tdsPercentage ? grossSalary * (staff.tdsPercentage / 100) : 0;
  const professionalTax = grossSalary > 10000 ? 200 : 0; // Fixed PT
  const otherDeductions = staff.otherDeductions || 0;

  const totalDeductions = pf + esi + tds + professionalTax + otherDeductions;
  const netSalary = grossSalary - totalDeductions;

  // Working days in month
  const daysInMonth = new Date(year, month, 0).getDate();
  const workingDays = daysInMonth - 4; // Approximate (subtract Sundays)

  return {
    basicSalary,
    hra: Math.round(hra),
    da: Math.round(da),
    ta,
    otherAllowances,
    grossSalary: Math.round(grossSalary),
    pf: Math.round(pf),
    esi: Math.round(esi),
    tds: Math.round(tds),
    professionalTax,
    otherDeductions,
    totalDeductions: Math.round(totalDeductions),
    netSalary: Math.round(netSalary),
    workingDays,
    presentDays: workingDays, // Will be updated from attendance
    leaveDays: 0,
  };
};

export const generateBulkPayroll = async (tenantId: string, month: number, year: number) => {
  const allStaff = await prisma.staff.findMany({
    where: { tenantId, isDeleted: false, status: "active" },
  });

  const results = [];
  for (const staff of allStaff) {
    const existing = await prisma.payroll.findFirst({
      where: { staffId: staff.id, month, year, tenantId },
    });

    if (!existing) {
      const payrollData = calculatePayroll(staff, month, year);
      const payroll = await prisma.payroll.create({
        data: {
          ...payrollData,
          staffId: staff.id,
          month,
          year,
          tenantId,
          status: "GENERATED",
        },
      });
      results.push(payroll);
    }
  }

  return { generated: results.length, total: allStaff.length };
};
