import prisma from "../../utils/prisma";

/////////////////////////
// CREATE TENANT
/////////////////////////
export const createTenant = async (data: any) => {

  if (!data.name || !data.type) {
    throw new Error("Name and type are required");
  }

  //////////////////////////
  // 🔒 DUPLICATE CHECK
  //////////////////////////
  const existing = await prisma.tenant.findFirst({
    where: {
      name: data.name,
    },
  });

  if (existing) {
    throw new Error("Tenant already exists");
  }

  return prisma.tenant.create({
    data,
  });
};

/////////////////////////
// GET ALL TENANTS
/////////////////////////
export const getTenants = async () => {
  return prisma.tenant.findMany({
    orderBy: { name: "asc" },
  });
};

/////////////////////////
// GET SINGLE TENANT
/////////////////////////
export const getTenantById = async (id: string) => {

  const tenant = await prisma.tenant.findUnique({
    where: { id },
  });

  if (!tenant) {
    throw new Error("Tenant not found");
  }

  return tenant;
};

/////////////////////////
// UPDATE IMAGES
/////////////////////////
export const updateTenantImagesService = async ({
  tenantId,
  logoUrl,
  backgroundUrl,
}: {
  tenantId: string;
  logoUrl?: string;
  backgroundUrl?: string;
}) => {

  //////////////////////////
  // 🔒 CHECK EXISTENCE
  //////////////////////////
  const existing = await prisma.tenant.findUnique({
    where: { id: tenantId },
  });

  if (!existing) {
    throw new Error("Tenant not found");
  }

  //////////////////////////
  // 🚀 UPDATE
  //////////////////////////
  return prisma.tenant.update({
    where: { id: tenantId },
    data: {
      ...(logoUrl && { logoUrl }),
      ...(backgroundUrl && { backgroundUrl }),
            updatedAt: new Date(),
    },
  });
};