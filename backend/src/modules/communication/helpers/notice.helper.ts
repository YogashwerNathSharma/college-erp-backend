import prisma from "../../../config/prisma";

interface NoticeTemplate {
  id: string;
  name: string;
  subject: string | null;
  body: string;
  type: string | null;
}

// ============================================
// NOTICE TEMPLATES
// ============================================

export const getNoticeTemplates = async (tenantId: string): Promise<NoticeTemplate[]> => {
  return prisma.noticeTemplate.findMany({
    where: { tenantId, isDeleted: false },
    orderBy: { name: "asc" },
  });
};

export const createNoticeTemplate = async (data: any, tenantId: string) => {
  return prisma.noticeTemplate.create({
    data: { ...data, tenantId },
  });
};

// ============================================
// NOTICE DISTRIBUTION
// ============================================

export const getNoticeRecipients = async (
  tenantId: string,
  targetAudience: string,
  classIds?: string[],
  sectionIds?: string[]
): Promise<Array<{ id: string; name: string; phone?: string; email?: string }>> => {
  const recipients: Array<{ id: string; name: string; phone?: string; email?: string }> = [];

  if (targetAudience === "ALL" || targetAudience === "STUDENTS" || targetAudience === "PARENTS") {
    const where: any = { tenantId, status: "active" };
    if (classIds?.length) {
      where.enrollments = { some: { classId: { in: classIds }, isDeleted: false } };
    }

    const students = await prisma.student.findMany({
      where,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        phone: true,
        email: true,
        fatherPhone: true,
      },
    });

    for (const s of students) {
      if (targetAudience === "PARENTS") {
        recipients.push({
          id: s.id,
          name: `Parent of ${s.firstName} ${s.lastName}`,
          phone: s.fatherPhone || undefined,
        });
      } else {
        recipients.push({
          id: s.id,
          name: `${s.firstName} ${s.lastName}`,
          phone: s.phone || undefined,
          email: s.email || undefined,
        });
      }
    }
  }

  if (targetAudience === "ALL" || targetAudience === "TEACHERS") {
    const teachers = await prisma.teacher.findMany({
      where: { tenantId, isDeleted: false },
      select: { id: true, firstName: true, lastName: true, phone: true, email: true },
    });

    for (const t of teachers) {
      recipients.push({
        id: t.id,
        name: `${t.firstName} ${t.lastName}`,
        phone: t.phone || undefined,
        email: t.email || undefined,
      });
    }
  }

  return recipients;
};

// ============================================
// NOTICE ANALYTICS
// ============================================

export const getNoticeStats = async (tenantId: string) => {
  const [total, pinned, byType] = await Promise.all([
    prisma.notice.count({ where: { tenantId, isDeleted: false } }),
    prisma.notice.count({ where: { tenantId, isDeleted: false, isPinned: true } }),
    prisma.notice.groupBy({
      by: ["type"],
      where: { tenantId, isDeleted: false },
      _count: true,
    }),
  ]);

  return { total, pinned, byType };
};
