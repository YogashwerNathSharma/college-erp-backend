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

  },

});

// Import/Export history and stats repeatedly filter by tenant, status and
// createdAt. Ensure the production MongoDB indexes exist even when the
// database was created before these compound indexes were added to the schema.
const ensureImportExportIndexes = async () => {
  try {
    await (prismaBase as any).$runCommandRaw({
      createIndexes: "import_jobs",
      indexes: [
        {
          key: { tenantId: 1, totalRows: 1, createdAt: -1 },
          name: "tenant_totalRows_createdAt",
        },
        {
          key: { tenantId: 1, totalRows: 1, status: 1, createdAt: -1 },
          name: "tenant_totalRows_status_createdAt",
        },
      ],
    });

    await (prismaBase as any).$runCommandRaw({
      createIndexes: "export_jobs",
      indexes: [
        {
          key: { tenantId: 1, createdAt: -1 },
          name: "tenant_createdAt",
        },
      ],
    });
  } catch (error) {
    console.warn("Import/Export index initialization skipped:", error?.message || error);
  }
};

void ensureImportExportIndexes();

// Export as any to bypass strict Prisma type checking for models
// that exist in DB but may have been renamed/merged in schema
const prisma: any = prismaBase;
export default prisma;
