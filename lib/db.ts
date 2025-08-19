// lib/db.ts — Prisma client (genbrug samme instance i dev)
import { PrismaClient } from "@prisma/client";

const globalForPrisma = global as unknown as { prisma?: PrismaClient };

export const prisma =
    globalForPrisma.prisma ??
    new PrismaClient({
        log: ["warn", "error"], // skift til ["query","error","warn"] hvis du vil se SQL
    });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
