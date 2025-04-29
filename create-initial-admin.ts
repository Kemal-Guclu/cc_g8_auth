import { prisma } from "@/lib/prisma";
import bcrypt from "bcrypt";

async function createInitialAdmin() {
  try {
    const adminRole = await prisma.role.upsert({
      where: { name: "ADMIN" },
      update: {},
      create: { name: "ADMIN" },
    });

    const hashedPassword = await bcrypt.hash("secureAdminPassword123", 10);
    const adminUser = await prisma.user.upsert({
      where: { email: "admin@example.com" },
      update: {},
      create: {
        email: "admin@example.com",
        password: hashedPassword,
        name: "Initial Admin",
        roleId: adminRole.id,
        isVerified: true,
      },
    });

    console.log("Admin-användare skapad:", adminUser);
  } catch (error) {
    console.error("Fel vid skapande av admin-användare:", error);
  } finally {
    await prisma.$disconnect();
  }
}

createInitialAdmin();
