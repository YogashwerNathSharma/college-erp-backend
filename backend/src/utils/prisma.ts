import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient().$extends({

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

export default prisma;