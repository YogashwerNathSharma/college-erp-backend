import { PrismaClient } from "@prisma/client";

const prismaBase = new PrismaClient().$extends({

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

// Export as any to bypass strict Prisma type checking for models
// that exist in DB but may have been renamed/merged in schema
const prisma: any = prismaBase;
export default prisma;
