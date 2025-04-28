import { PrismaClient } from "@prisma/client";

export const prisma =
  global.prisma ||
  new PrismaClient({
    log: ["query", "info", "warn", "error"],
  });

if (process.env.NODE_ENV !== "production") {
  global.prisma = prisma;
}
// PrismaClient instansiering för att undvika "Too many clients" fel i utvecklingsläge
// och för att återanvända instansen mellan olika moduler i applikationen.
// Detta gör att vi kan använda PrismaClient utan att skapa en ny instans varje gång vi behöver den.
