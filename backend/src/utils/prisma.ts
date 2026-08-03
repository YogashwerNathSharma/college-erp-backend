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

// Export as any to bypass strict Prisma type checking for models
// that exist in DB but may have been renamed/merged in schema
const prisma: any = prismaBase;
export default prisma;
