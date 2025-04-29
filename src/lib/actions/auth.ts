"use server";

import { prisma } from "@/lib/prisma";
import { generateToken, verifyToken } from "@/lib/jwt";
import { cookies } from "next/headers";
import bcrypt from "bcrypt";
import { loginSchema, registerSchema } from "@/lib/schemas";
import { redirect } from "next/navigation";

// Typ för JWT-payload
type JWTPayload = {
  id: number;
  email: string;
  role: string;
};

// Server Action för att hämta användare och projekt
export async function getUserAndProjects() {
  const token = (await cookies()).get("token")?.value;
  if (!token) {
    throw new Error("Ingen giltig token");
  }

  let decoded: JWTPayload;
  try {
    decoded = verifyToken(token) as JWTPayload;
  } catch {
    throw new Error("Ogiltig eller utgången token");
  }

  const dbUser = await prisma.user.findUnique({
    where: { id: decoded.id },
    include: { role: true },
  });

  if (!dbUser) {
    throw new Error("Användaren hittades inte");
  }

  const userProjects = await prisma.project.findMany({
    where: { userId: dbUser.id },
  });

  return {
    user: {
      id: dbUser.id,
      email: dbUser.email,
      name: dbUser.name,
      avatar: dbUser.avatar,
      role: dbUser.role.name,
    },
    projects: userProjects,
  };
}

export async function login(formData: FormData) {
  const data = Object.fromEntries(formData);
  const parsed = loginSchema.safeParse(data);

  if (!parsed.success) {
    return { error: parsed.error.errors[0].message };
  }

  const { email, password } = parsed.data;

  const user = await prisma.user.findUnique({
    where: { email },
    include: { role: true },
  });

  if (!user) {
    return { error: "Felaktig e-post eller lösenord" };
  }

  if (!user.isVerified) {
    return {
      error: "Konto ej verifierat. Kontrollera din e-post för att verifiera.",
    };
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    return { error: "Felaktig e-post eller lösenord" };
  }

  // 2FA för admin-användare (grundläggande struktur)
  if (user.role.name === "ADMIN") {
    // Här skulle vi normalt skicka en 2FA-kod till e-post eller app
    // För enkelhetens skull, hoppar vi över detta i denna lösning
    // Men strukturen finns för framtida implementering
    const twoFactorEnabled = true; // Skulle normalt vara en kolumn i user-tabellen
    if (twoFactorEnabled) {
      // Skicka 2FA-kod och spara i databasen
      // Vänta på att användaren anger koden
      console.log("2FA krävs för admin-användare");
    }
  }

  const token = generateToken({
    id: user.id,
    email: user.email,
    role: user.role.name,
  });

  (await cookies()).set("token", token, {
    httpOnly: true,
    secure: true,
    maxAge: 3600,
  });

  // Logga inloggning för admin-användare
  if (user.role.name === "ADMIN") {
    await prisma.adminLog.create({
      data: {
        action: "LOGIN",
        userId: user.id,
        details: `Admin-användare loggade in: ${email}`,
        timestamp: new Date(),
      },
    });
  }

  return {
    success: true,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      avatar: user.avatar,
      role: user.role.name,
    },
    token,
  };
}

export async function register(formData: FormData) {
  const data = Object.fromEntries(formData);
  const parsed = registerSchema.safeParse(data);

  if (!parsed.success) {
    return { error: parsed.error.errors[0].message };
  }

  const { email, password, name, avatar } = parsed.data;

  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    return { error: "E-postadressen används redan" };
  }

  let userRole = await prisma.role.findUnique({ where: { name: "USER" } });
  if (!userRole) {
    userRole = await prisma.role.create({
      data: { name: "USER" },
    });
  }

  let adminRole = await prisma.role.findUnique({ where: { name: "ADMIN" } });
  if (!adminRole) {
    adminRole = await prisma.role.create({
      data: { name: "ADMIN" },
    });
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: {
      email,
      password: hashedPassword,
      name,
      avatar: avatar || null,
      roleId: userRole.id,
      isVerified: false,
    },
  });

  await prisma.project.create({
    data: {
      name: "Mitt första projekt",
      userId: user.id,
    },
  });

  if (!userRole) {
    throw new Error("User role not found");
  }

  const token = generateToken({
    id: user.id,
    email: user.email,
    role: userRole?.name ?? "UNKNOWN",
  });

  (await cookies()).set("token", token, {
    httpOnly: true,
    secure: true,
    maxAge: 3600,
  });

  redirect("/dashboard");

  return {
    success: true,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      avatar: user.avatar,
      role: userRole?.name ?? "UNKNOWN",
    },
    token,
  };
}

export async function getAllUsers() {
  const token = (await cookies()).get("token")?.value;
  if (!token) {
    throw new Error("Ingen giltig token");
  }

  interface DecodedToken {
    id: number;
    email: string;
    role: string;
    [key: string]: string | number | boolean;
  }

  const decodedToken = verifyToken(token);
  if (typeof decodedToken === "string") {
    throw new Error("Invalid token format");
  }
  const decoded: DecodedToken = decodedToken as DecodedToken;
  if (decoded.role !== "ADMIN") {
    throw new Error("Endast admin kan hämta användare");
  }

  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      name: true,
      avatar: true,
      role: { select: { name: true } },
      createdAt: true,
      updatedAt: true,
    },
  });

  await prisma.adminLog.create({
    data: {
      action: "GET_ALL_USERS",
      userId: decoded.id,
      details: `Admin hämtade alla användare`,
      timestamp: new Date(),
    },
  });

  return users.map((user) => ({
    id: user.id,
    email: user.email,
    name: user.name,
    avatar: user.avatar,
    role: user.role.name,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  }));
}

export async function getAllProjects() {
  const token = (await cookies()).get("token")?.value;
  if (!token) {
    throw new Error("Ingen giltig token");
  }

  interface DecodedToken {
    id: number;
    email: string;
    role: string;
    [key: string]: string | number | boolean;
  }

  const decodedToken = verifyToken(token);
  if (typeof decodedToken === "string") {
    throw new Error("Invalid token format");
  }
  const decoded: DecodedToken = decodedToken as DecodedToken;
  if (decoded.role !== "ADMIN") {
    throw new Error("Endast admin kan hämta projekt");
  }

  const projects = await prisma.project.findMany({
    include: { user: { include: { role: true } } },
  });

  await prisma.adminLog.create({
    data: {
      action: "GET_ALL_PROJECTS",
      userId: decoded.id,
      details: `Admin hämtade alla projekt`,
      timestamp: new Date(),
    },
  });

  return projects.map((project) => ({
    id: project.id,
    name: project.name,
    user: {
      id: project.user.id,
      email: project.user.email,
      name: project.user.name,
      role: project.user.role.name,
    },
    createdAt: project.createdAt,
    updatedAt: project.updatedAt,
  }));
}

export async function deleteUser(userId: number) {
  const token = (await cookies()).get("token")?.value;
  if (!token) {
    throw new Error("Ingen giltig token");
  }

  interface DecodedToken {
    id: number;
    email: string;
    role: string;
    [key: string]: string | number | boolean;
  }

  const decodedToken = verifyToken(token);
  if (typeof decodedToken === "string") {
    throw new Error("Invalid token format");
  }
  const decoded: DecodedToken = decodedToken as DecodedToken;
  if (decoded.role !== "ADMIN") {
    throw new Error("Endast admin kan ta bort användare");
  }

  await prisma.user.delete({
    where: { id: userId },
  });

  await prisma.adminLog.create({
    data: {
      action: "DELETE_USER",
      userId: decoded.id,
      details: `Admin tog bort användare med ID: ${userId}`,
      timestamp: new Date(),
    },
  });

  return { success: true };
}

export async function deleteProject(projectId: number) {
  const token = (await cookies()).get("token")?.value;
  if (!token) {
    throw new Error("Ingen giltig token");
  }

  interface DecodedToken {
    id: number;
    email: string;
    role: string;
    [key: string]: string | number | boolean;
  }

  const decodedToken = verifyToken(token);
  if (typeof decodedToken === "string") {
    throw new Error("Invalid token format");
  }
  const decoded: DecodedToken = decodedToken as DecodedToken;
  if (decoded.role !== "ADMIN") {
    throw new Error("Endast admin kan ta bort projekt");
  }

  await prisma.project.delete({
    where: { id: projectId },
  });

  await prisma.adminLog.create({
    data: {
      action: "DELETE_PROJECT",
      userId: decoded.id,
      details: `Admin tog bort projekt med ID: ${projectId}`,
      timestamp: new Date(),
    },
  });

  return { success: true };
}

export async function createAdminUser(formData: FormData) {
  if (process.env.DISABLE_CREATE_ADMIN === "true") {
    throw new Error("Skapande av admin-användare är inaktiverat");
  }
  const token = (await cookies()).get("token")?.value;
  if (!token) {
    throw new Error("Ingen giltig token");
  }

  interface DecodedToken {
    id: number;
    email: string;
    role: string;
    [key: string]: string | number | boolean;
  }

  const decodedToken = verifyToken(token);
  if (typeof decodedToken === "string") {
    throw new Error("Invalid token format");
  }
  const decoded: DecodedToken = decodedToken as DecodedToken;
  if (decoded.role !== "ADMIN") {
    throw new Error("Endast admin kan skapa nya admin-användare");
  }

  const data = Object.fromEntries(formData);
  const parsed = registerSchema.safeParse(data);

  if (!parsed.success) {
    return { error: parsed.error.errors[0].message };
  }

  const { email, password, name, avatar } = parsed.data;

  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    return { error: "E-postadressen används redan" };
  }

  let adminRole = await prisma.role.findUnique({ where: { name: "ADMIN" } });
  if (!adminRole) {
    adminRole = await prisma.role.create({
      data: { name: "ADMIN" },
    });
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: {
      email,
      password: hashedPassword,
      name,
      avatar: avatar || null,
      roleId: adminRole.id,
      isVerified: true,
    },
  });

  const adminToken = generateToken({
    id: user.id,
    email: user.email,
    role: adminRole?.name ?? "UNKNOWN",
  });

  (await cookies()).set("token", adminToken, {
    httpOnly: true,
    secure: true,
    maxAge: 3600,
  });

  await prisma.adminLog.create({
    data: {
      action: "CREATE_ADMIN",
      userId: decoded.id,
      details: `Admin skapade ny admin-användare med e-post: ${email}`,
      timestamp: new Date(),
    },
  });

  redirect("/admin");

  return {
    success: true,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      avatar: user.avatar,
      role: adminRole?.name ?? "UNKNOWN",
    },
    token,
  };
}
