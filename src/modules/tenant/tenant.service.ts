import prisma from "../../utils/prisma";

export const createTenant = async (data: any) => {
  return prisma.tenant.create({
    data,
  });
};

export const getTenants = async () => {
  return prisma.tenant.findMany({
    orderBy: { name: "asc" },
  });
};

export const getTenantById = async (id: string) => {
  return prisma.tenant.findUnique({
    where: { id },
  });
};
export const updateTenantImagesService = async ({
  tenantId,
  logoUrl,
  backgroundUrl,
}: {
  tenantId: string;
  logoUrl?: string;
  backgroundUrl?: string;
}) => {
  return prisma.tenant.update({
    where: { id: tenantId },
    data: {
      ...(logoUrl && { logoUrl }),
      ...(backgroundUrl && { backgroundUrl }),
    },
  });
};