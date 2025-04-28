"use server";

import { prisma } from "@/lib/prisma";
import { generateToken } from "@/lib/jwt";
import { cookies } from "next/headers";
import bcrypt from "bcrypt";
import { loginSchema, registerSchema } from "@/lib/schemas";
import { redirect } from "next/navigation";
import { verifyToken } from "@/lib/jwt";

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

  // Hämta eller skapa "USER"-rollen
  let userRole = await prisma.role.findUnique({ where: { name: "USER" } });
  if (!userRole) {
    userRole = await prisma.role.create({
      data: { name: "USER" },
    });
  }

  // Hämta eller skapa "ADMIN"-rollen (men användaren får USER-rollen vid registrering)
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
      roleId: userRole.id, // Vanliga användare får "USER"-rollen
      isVerified: false,
    },
  });

  // Skapa ett tomt projekt för den nya användaren
  await prisma.project.create({
    data: {
      name: "Mitt första projekt",
      userId: user.id,
    },
  });

  // Logga in användaren automatiskt
  if (!userRole) {
    throw new Error("User role not found");
  }

  if (!userRole) {
    throw new Error("User role not found");
  }

  const token = generateToken({
    id: user.id,
    email: user.email,
    role:
      userRole?.name ??
      (() => {
        throw new Error("User role is null");
      })(),
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

// Funktion för att hämta alla användare (endast för admin)
export async function getAllUsers() {
  const token = (await cookies()).get("token")?.value;
  if (!token) {
    throw new Error("Ingen giltig token");
  }

  interface DecodedToken {
    id: number;
    email: string;
    role: string;
    [key: string]: string | number | boolean; // Specify allowed property types
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

// Funktion för att hämta alla projekt (endast för admin)
export async function getAllProjects() {
  const token = (await cookies()).get("token")?.value;
  if (!token) {
    throw new Error("Ingen giltig token");
  }

  interface DecodedToken {
    id: number;
    email: string;
    role: string;
    [key: string]: string | number | boolean; // Specify allowed property types
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

// Funktion för att ta bort en användare (endast för admin)
export async function deleteUser(userId: number) {
  const token = (await cookies()).get("token")?.value;
  if (!token) {
    throw new Error("Ingen giltig token");
  }

  interface DecodedToken {
    id: number;
    email: string;
    role: string;
    [key: string]: string | number | boolean; // Specify allowed property types
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

  return { success: true };
}

// Funktion för att ta bort ett projekt (endast för admin)
export async function deleteProject(projectId: number) {
  const token = (await cookies()).get("token")?.value;
  if (!token) {
    throw new Error("Ingen giltig token");
  }

  interface DecodedToken {
    id: number;
    email: string;
    role: string;
    [key: string]: string | number | boolean; // Specify allowed property types
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

  return { success: true };
}
// ... (tidigare kod)

export async function createAdminUser(formData: FormData) {
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
      roleId: adminRole.id, // Sätt till "ADMIN"-rollen
      isVerified: true, // Admin-användaren är verifierad direkt
    },
  });

  const token = generateToken({
    id: user.id,
    email: user.email,
    role:
      adminRole?.name ??
      (() => {
        throw new Error("Admin role is null");
      })(),
  });

  (await cookies()).set("token", token, {
    httpOnly: true,
    secure: true,
    maxAge: 3600,
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
