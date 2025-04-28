"use client";

import { useEffect, useState } from "react";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/jwt";
import { prisma } from "@/lib/prisma";

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null);
  const [projects, setProjects] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserAndProjects = async () => {
      try {
        const token = document.cookie
          .split("; ")
          .find((row) => row.startsWith("token="))
          ?.split("=")[1];

        if (!token) {
          throw new Error("Ingen giltig token");
        }

        const decoded: any = verifyToken(token);
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

        setUser({
          id: dbUser.id,
          email: dbUser.email,
          name: dbUser.name,
          avatar: dbUser.avatar,
          role: dbUser.role.name,
        });
        setProjects(userProjects);
      } catch (err: any) {
        setError(err.message);
      }
    };

    fetchUserAndProjects();
  }, []);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">
        <p>Laddar...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8 bg-gray-900 text-white">
      <h1 className="text-3xl font-bold mb-8">Välkommen, {user.name}!</h1>
      <p className="mb-4">Roll: {user.role}</p>

      <h2 className="text-2xl font-semibold mb-4">Dina projekt</h2>
      <div className="grid gap-4">
        {projects.map((project) => (
          <div key={project.id} className="bg-gray-800 p-4 rounded-lg">
            <p>
              <strong>Projekt:</strong> {project.name}
            </p>
            <p>
              <strong>Skapad:</strong>{" "}
              {new Date(project.createdAt).toLocaleDateString()}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
