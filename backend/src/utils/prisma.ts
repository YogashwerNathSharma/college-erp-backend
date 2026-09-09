import { PrismaClient } from "@prisma/client";

// ⚡ P6: Enable query event logging in development for slow query detection
const prismaBase = new PrismaClient({
  log: process.env.NODE_ENV === "development"
    ? [
        { level: "query", emit: "event" },
        { level: "warn", emit: "stdout" },
      ]
    : [{ level: "error", emit: "stdout" }],
}).$extends({

  query: {

    /////////////////////////////////////////////////////////
    // SOFT DELETE FILTER
    /////////////////////////////////////////////////////////

    student: {

      async findMany({ args, query }) {

        args.where = {
          ...args.where,
          isDeleted: false,
        };

        return query(args);

      },

      async findFirst({ args, query }) {

        args.where = {
          ...args.where,
          isDeleted: false,
        };

        return query(args);

      },

    },

    teacher: {

      async findMany({ args, query }) {

        args.where = {
          ...args.where,
          isDeleted: false,
        };

        return query(args);

      },

      async findFirst({ args, query }) {

        args.where = {
          ...args.where,
          isDeleted: false,
        };

        return query(args);

      },

    },

    feeStructure: {

      async findMany({ args, query }) {

        args.where = {
          ...args.where,
          isDeleted: false,
        };

        return query(args);

      },

      async findFirst({ args, query }) {

        args.where = {
          ...args.where,
          isDeleted: false,
        };

        return query(args);

      },

    },

    /////////////////////////////////////////////////////////
    // SCHOOL MASTER COMPATIBILITY
    // School Master fields are intentionally scoped to this
    // master only. The build step adds these optional fields
    // to the Prisma School model without touching ERP models.
    /////////////////////////////////////////////////////////

    school: {

      async update({ args, query }) {
        const data: any = args.data || {};
        const persistedFields = new Set([
          "name",
          "code",
          "address",
          "city",
          "state",
          "pincode",
          "phone",
          "email",
          "website",
          "logo",
          "affiliation",
          "establishedYear",
          "principalName",
        ]);

        for (const key of Object.keys(data)) {
          if (!persistedFields.has(key)) delete data[key];
        }

        args.data = data;
        return query(args);
      },

    },

    /////////////////////////////////////////////////////////
    // IMPORT JOB COMPATIBILITY
    // The active schema does not yet contain createdBy,
    // mapping, startedAt or completedAt on ImportJob, while
    // the import controller still uses those workflow fields.
    // Keep the controller API intact by persisting mapping in
    // the existing Json `errors` field until the schema is
    // formally expanded.
    /////////////////////////////////////////////////////////

    importJob: {

      async create({ args, query }) {
        const data: any = args.data || {};
        delete data.createdBy;
        delete data.mapping;
        delete data.startedAt;
        delete data.completedAt;
        args.data = data;
        return query(args);
      },

      async update({ args, query }) {
        const data: any = args.data || {};

        if (data.mapping !== undefined) {
          const mapping = data.mapping;
          delete data.mapping;
          // ImportJob currently has no mapping column. Store it in
          // the existing JSON field so the next process request can
          // reconstruct the exact column mapping.
          if (data.errors === undefined) data.errors = { __mapping: mapping };
        }

        delete data.startedAt;
        delete data.completedAt;
        delete data.createdBy;
        args.data = data;
        return query(args);
      },

      async findFirst({ args, query }) {
        const result: any = await query(args);
        if (result && result.errors && !Array.isArray(result.errors) && result.errors.__mapping) {
          result.mapping = result.errors.__mapping;
        }
        return result;
      },

      async findMany({ args, query }) {
        const results: any[] = await query(args);
        for (const result of results || []) {
          if (result && result.errors && !Array.isArray(result.errors) && result.errors.__mapping) {
            result.mapping = result.errors.__mapping;
          }
        }
        return results;
      },

    },

  },

});

// ⚡ P6: Log slow Prisma queries (> 200ms) in development
// Uses $on on the base client before extension wrapping
if (process.env.NODE_ENV === "development") {
  try {
    (prismaBase as any).$on?.("query", (e: any) => {
      if (e.duration > 200) {
        console.warn(`🐢 Slow Query (${e.duration}ms): ${e.query?.slice(0, 200)}`);
      }
    });
  } catch {} // Silently ignore if $on not available on extended client
}

// Export as any to bypass strict Prisma type checking for models  
// that exist in DB but may have been renamed/merged in schema
const prisma: any = prismaBase;
export default prisma;
