"use client";

import { useEffect, useState } from "react";
import { getUserAndProjects } from "@/lib/actions/auth";

type User = {
  id: number;
  email: string;
  name: string;
  avatar: string | null;
  role: string;
};

type Project = {
  id: number;
  name: string;
  createdAt: Date;
};

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserAndProjects = async () => {
      try {
        const { user, projects } = await getUserAndProjects();
        setUser(user);
        setProjects(projects);
      } catch (err: unknown) {
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError("An unknown error occurred.");
        }
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
