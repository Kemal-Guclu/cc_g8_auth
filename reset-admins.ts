import { prisma } from "@/lib/prisma";

async function resetAdmins() {
  try {
    const adminRole = await prisma.role.findUnique({
      where: { name: "ADMIN" },
    });

    if (!adminRole) {
      console.log("Ingen ADMIN-roll hittades.");
      return;
    }

    const adminUsers = await prisma.user.findMany({
      where: { roleId: adminRole.id },
    });

    for (const user of adminUsers) {
      // Ta bort relaterade projekt
      await prisma.project.deleteMany({
        where: { userId: user.id },
      });

      // Ta bort relaterade loggar
      await prisma.adminLog.deleteMany({
        where: { userId: user.id },
      });

      // Ta bort användaren
      await prisma.user.delete({
        where: { id: user.id },
      });

      console.log(`Admin-användare ${user.email} borttagen.`);
    }

    console.log("Alla admin-användare har nollställts.");
  } catch (error) {
    console.error("Fel vid nollställning av admin-användare:", error);
  } finally {
    await prisma.$disconnect();
  }
}

resetAdmins();
