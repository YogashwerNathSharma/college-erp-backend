
import prisma from "../../utils/prisma";


//////////////////////////////////////////////////////
// GET DASHBOARD STATS
//////////////////////////////////////////////////////
export const getDashboardStats = async (tenantId: string) => {
  const [total, active, male, female] = await Promise.all([
    prisma.teacher.count({
      where: { tenantId, isDeleted: false },
    }),
    prisma.teacher.count({
      where: { tenantId, isDeleted: false },
    }),
    prisma.teacher.count({
      where: { tenantId, isDeleted: false, gender: "Male" },
    }),
    prisma.teacher.count({
      where: { tenantId, isDeleted: false, gender: "Female" },
    }),
  ]);

  return {
    totalTeachers: total,
    maleTeachers: male,
    femaleTeachers: female,
    activeTeachers: active,
  };
};

//////////////////////////////////////////////////////
// GET DEPARTMENT CHART DATA (Teachers by Subject/Department)
//////////////////////////////////////////////////////
export const getDepartmentChart = async (tenantId: string) => {
  const teacherSubjects = await prisma.teacherSubject.findMany({
    where: {
      isDeleted: false,
      teacher: { tenantId, isDeleted: false },
    },
    include: {
      subject: { select: { name: true } },
    },
  });

  // Group by subject name
  const departmentMap: Record<string, number> = {};
  teacherSubjects.forEach((ts) => {
    const subName = ts.subject.name;
    departmentMap[subName] = (departmentMap[subName] || 0) + 1;
  });

  const chartData = Object.entries(departmentMap).map(([name, count]) => ({
    name,
    value: count,
  }));

  return chartData;
};

//////////////////////////////////////////////////////
// GET MONTHLY OVERVIEW (Teachers added per month)
//////////////////////////////////////////////////////
export const getMonthlyOverview = async (tenantId: string) => {
  const startOfYear = new Date(new Date().getFullYear(), 0, 1);

  const teachers = await prisma.teacher.findMany({
    where: {
      tenantId,
      isDeleted: false,
      createdAt: { gte: startOfYear },
    },
    select: { createdAt: true },
  });

  const months = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
  ];

  const monthlyData = months.map((month, index) => ({
    month,
    count: teachers.filter((t) => t.createdAt.getMonth() === index).length,
  }));

  return monthlyData;
};

//////////////////////////////////////////////////////
// GET RECENT TEACHERS (last 5)
//////////////////////////////////////////////////////
export const getRecentTeachers = async (tenantId: string) => {
  const teachers = await prisma.teacher.findMany({
    where: { tenantId, isDeleted: false },
    include: {
      subjects: {
        where: { isDeleted: false },
        include: { subject: { select: { name: true } } },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 5,
  });

  return teachers.map((t) => ({
    id: t.id,
    name: t.name,
    email: t.email,
    phone: t.phone,
    department: t.subjects[0]?.subject?.name || "N/A",
    createdAt: t.createdAt,
  }));
};


