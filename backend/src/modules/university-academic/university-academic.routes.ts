import { Router, Request, Response } from "express";
import { z } from "zod";
import { prisma } from "../../config/prisma";
import { authMiddleware } from "../../middleware/auth.middleware";
import { resolveTenant } from "../../middleware/tenant.middleware";

const router = Router();

router.use(authMiddleware, resolveTenant);

const pageQuery = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  search: z.string().trim().max(100).optional(),
});

const idSchema = z.string().min(1);

function tenantIdOf(req: Request): string {
  const tenantId = (req as any).tenantId || (req as any).user?.tenantId;
  if (!tenantId) throw new Error("Tenant context required");
  return tenantId;
}

async function ensureTenantEntity(model: string, id: string, tenantId: string) {
  const entity = await (prisma as any)[model].findFirst({
    where: { id, tenantId, isDeleted: false },
    select: { id: true },
  });
  if (!entity) {
    const error = new Error("Referenced record not found in this tenant");
    (error as any).statusCode = 400;
    throw error;
  }
  return entity;
}

async function paginated(
  model: string,
  tenantId: string,
  req: Request,
  searchableFields: string[] = ["name", "code"]
) {
  const parsed = pageQuery.parse(req.query);
  const skip = (parsed.page - 1) * parsed.limit;
  const where: any = { tenantId, isActive: true };
  if (parsed.search) {
    where.OR = searchableFields.map((field) => ({
      [field]: { contains: parsed.search, mode: "insensitive" },
    }));
  }
  const [data, total] = await Promise.all([
    (prisma as any)[model].findMany({
      where,
      skip,
      take: parsed.limit,
      orderBy: { name: "asc" },
    }),
    (prisma as any)[model].count({ where }),
  ]);
  return {
    data,
    pagination: {
      page: parsed.page,
      limit: parsed.limit,
      total,
      totalPages: Math.ceil(total / parsed.limit),
    },
  };
}

const facultySchema = z.object({
  name: z.string().trim().min(1).max(150),
  code: z.string().trim().min(1).max(50),
  campusId: idSchema.optional(),
  description: z.string().trim().max(1000).optional(),
});

const programSchema = z.object({
  name: z.string().trim().min(1).max(150),
  code: z.string().trim().min(1).max(50),
  facultyId: idSchema.optional(),
  departmentId: idSchema.optional(),
  level: z.string().trim().max(50).optional(),
  durationYears: z.number().int().min(1).max(20).optional(),
  description: z.string().trim().max(1000).optional(),
});

const semesterSchema = z.object({
  programId: idSchema,
  name: z.string().trim().min(1).max(100),
  number: z.number().int().min(1).max(20),
  credits: z.number().min(0).max(1000).optional(),
});

const batchSchema = z.object({
  programId: idSchema,
  semesterId: idSchema.optional(),
  academicYearId: idSchema.optional(),
  name: z.string().trim().min(1).max(100),
  code: z.string().trim().min(1).max(50),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
});

const courseSchema = z.object({
  programId: idSchema.optional(),
  name: z.string().trim().min(1).max(150),
  code: z.string().trim().min(1).max(50),
  credits: z.number().min(0).max(1000).default(0),
  courseType: z.string().trim().max(50).optional(),
  description: z.string().trim().max(1000).optional(),
});

const curriculumSchema = z.object({
  semesterId: idSchema,
  courseId: idSchema,
  courseType: z.string().trim().max(50).optional(),
  credits: z.number().min(0).max(1000).default(0),
  isElective: z.boolean().default(false),
});

const enrollmentSchema = z.object({
  studentId: idSchema,
  programId: idSchema,
  batchId: idSchema,
  currentSemesterId: idSchema.optional(),
  admissionNo: z.string().trim().max(50).optional(),
  rollNumber: z.string().trim().max(50).optional(),
});

async function handle(
  res: Response,
  work: () => Promise<unknown>
) {
  try {
    return res.json(await work());
  } catch (error: any) {
    const status = error?.statusCode || (error?.code === "P2002" ? 409 : 500);
    return res.status(status).json({
      message:
        error?.code === "P2002"
          ? "A record with the same unique value already exists"
          : error?.message || "University academic operation failed",
    });
  }
}

router.get("/faculties", (req, res) =>
  handle(res, () => paginated("universityFaculty", tenantIdOf(req), req))
);

router.post("/faculties", (req, res) =>
  handle(res, async () => {
    const tenantId = tenantIdOf(req);
    const input = facultySchema.parse(req.body);
    if (input.campusId) await ensureTenantEntity("campus", input.campusId, tenantId);
    return prisma.universityFaculty.create({ data: { ...input, tenantId } });
  })
);

router.get("/programs", (req, res) =>
  handle(res, () => paginated("universityProgram", tenantIdOf(req), req))
);

router.post("/programs", (req, res) =>
  handle(res, async () => {
    const tenantId = tenantIdOf(req);
    const input = programSchema.parse(req.body);
    if (input.facultyId) await ensureTenantEntity("universityFaculty", input.facultyId, tenantId);
    if (input.departmentId) await ensureTenantEntity("department", input.departmentId, tenantId);
    return prisma.universityProgram.create({ data: { ...input, tenantId } });
  })
);

router.get("/semesters", (req, res) =>
  handle(res, () => paginated("universitySemester", tenantIdOf(req), req))
);

router.post("/semesters", (req, res) =>
  handle(res, async () => {
    const tenantId = tenantIdOf(req);
    const input = semesterSchema.parse(req.body);
    await ensureTenantEntity("universityProgram", input.programId, tenantId);
    return prisma.universitySemester.create({ data: { ...input, tenantId } });
  })
);

router.get("/batches", (req, res) =>
  handle(res, () => paginated("universityBatch", tenantIdOf(req), req))
);

router.post("/batches", (req, res) =>
  handle(res, async () => {
    const tenantId = tenantIdOf(req);
    const input = batchSchema.parse(req.body);
    await ensureTenantEntity("universityProgram", input.programId, tenantId);
    if (input.semesterId) await ensureTenantEntity("universitySemester", input.semesterId, tenantId);
    if (input.academicYearId) await ensureTenantEntity("academicYear", input.academicYearId, tenantId);
    return prisma.universityBatch.create({ data: { ...input, tenantId } });
  })
);

router.get("/courses", (req, res) =>
  handle(res, () => paginated("universityCourse", tenantIdOf(req), req))
);

router.post("/courses", (req, res) =>
  handle(res, async () => {
    const tenantId = tenantIdOf(req);
    const input = courseSchema.parse(req.body);
    if (input.programId) await ensureTenantEntity("universityProgram", input.programId, tenantId);
    return prisma.universityCourse.create({ data: { ...input, tenantId } });
  })
);

router.get("/curricula", async (req, res) =>
  handle(res, async () => {
    const tenantId = tenantIdOf(req);
    const parsed = pageQuery.parse(req.query);
    const skip = (parsed.page - 1) * parsed.limit;
    const where: any = { tenantId, isActive: true };
    const [data, total] = await Promise.all([
      prisma.universityCurriculum.findMany({
        where,
        skip,
        take: parsed.limit,
        orderBy: { createdAt: "desc" },
        include: {
          semester: { select: { id: true, name: true, number: true } },
          course: { select: { id: true, name: true, code: true, credits: true } },
        },
      }),
      prisma.universityCurriculum.count({ where }),
    ]);
    return {
      data,
      pagination: { page: parsed.page, limit: parsed.limit, total, totalPages: Math.ceil(total / parsed.limit) },
    };
  })
);

router.post("/curricula", (req, res) =>
  handle(res, async () => {
    const tenantId = tenantIdOf(req);
    const input = curriculumSchema.parse(req.body);
    await ensureTenantEntity("universitySemester", input.semesterId, tenantId);
    await ensureTenantEntity("universityCourse", input.courseId, tenantId);
    return prisma.universityCurriculum.create({ data: { ...input, tenantId } });
  })
);

router.get("/enrollments", async (req, res) =>
  handle(res, async () => {
    const tenantId = tenantIdOf(req);
    const parsed = pageQuery.parse(req.query);
    const skip = (parsed.page - 1) * parsed.limit;
    const where: any = { tenantId, isDeleted: false };
    if (parsed.search) {
      where.OR = [
        { admissionNo: { contains: parsed.search, mode: "insensitive" } },
        { rollNumber: { contains: parsed.search, mode: "insensitive" } },
      ];
    }
    const [data, total] = await Promise.all([
      prisma.universityEnrollment.findMany({
        where,
        skip,
        take: parsed.limit,
        orderBy: { createdAt: "desc" },
        include: {
          student: { select: { id: true, firstName: true, lastName: true, admissionNo: true } },
          program: { select: { id: true, name: true, code: true } },
          batch: { select: { id: true, name: true, code: true } },
        },
      }),
      prisma.universityEnrollment.count({ where }),
    ]);
    return {
      data,
      pagination: { page: parsed.page, limit: parsed.limit, total, totalPages: Math.ceil(total / parsed.limit) },
    };
  })
);

router.post("/enrollments", (req, res) =>
  handle(res, async () => {
    const tenantId = tenantIdOf(req);
    const input = enrollmentSchema.parse(req.body);
    await ensureTenantEntity("student", input.studentId, tenantId);
    await ensureTenantEntity("universityProgram", input.programId, tenantId);
    await ensureTenantEntity("universityBatch", input.batchId, tenantId);
    if (input.currentSemesterId) await ensureTenantEntity("universitySemester", input.currentSemesterId, tenantId);
    return prisma.universityEnrollment.create({ data: { ...input, tenantId } });
  })
);

export default router;
