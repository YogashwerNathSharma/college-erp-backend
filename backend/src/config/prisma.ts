// Re-export the shared singleton — avoids duplicate connection pools
import prisma from "../utils/prisma";
export default prisma;
