"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  getAllUsers,
  getAllProjects,
  deleteUser,
  deleteProject,
  getUserAndProjects,
} from "@/lib/actions/auth";

export default function AdminPage() {
  interface User {
    id: number;
    name: string;
    email: string;
    role: string;
  }

  interface Project {
    id: number;
    name: string;
    user: {
      name: string;
      email: string;
      role: string;
    };
  }

  const [users, setUsers] = useState<User[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const checkUserRole = async () => {
      try {
        const { user } = await getUserAndProjects();
        if (user.role !== "ADMIN") {
          setError("Endast admin-användare kan komma åt denna sida");
          router.push("/dashboard");
          return;
        }
        setIsAdmin(true);

        const usersData = await getAllUsers();
        const projectsData = await getAllProjects();
        setUsers(usersData);
        setProjects(projectsData);
      } catch (err: unknown) {
        if (err instanceof Error) {
          setError(err.message);
          router.push("/login");
        } else {
          setError("Ett oväntat fel inträffade");
        }
      } finally {
        setLoading(false);
      }
    };

    checkUserRole();
  }, [router]);

  const handleDeleteUser = async (userId: number) => {
    try {
      await deleteUser(userId);
      setUsers(users.filter((user) => user.id !== userId));
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Ett oväntat fel inträffade");
      }
    }
  };

  const handleDeleteProject = async (projectId: number) => {
    try {
      await deleteProject(projectId);
      setProjects(projects.filter((project) => project.id !== projectId));
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Ett oväntat fel inträffade");
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">
        <p>Laddar...</p>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8 bg-gray-900 text-white">
      <h1 className="text-3xl font-bold mb-8">Admin Dashboard</h1>

      {error && <p className="text-red-500 mb-4">{error}</p>}

      <h2 className="text-2xl font-semibold mb-4">Användare</h2>
      <div className="grid gap-4 mb-8">
        {users.map((user) => (
          <div
            key={user.id}
            className="bg-gray-800 p-4 rounded-lg flex justify-between items-center"
          >
            <div>
              <p>
                <strong>Namn:</strong> {user.name}
              </p>
              <p>
                <strong>E-post:</strong> {user.email}
              </p>
              <p>
                <strong>Roll:</strong> {user.role}
              </p>
            </div>
            <button
              onClick={() => handleDeleteUser(user.id)}
              className="bg-red-500 text-white px-4 py-2 rounded"
            >
              Ta bort
            </button>
          </div>
        ))}
      </div>

      <h2 className="text-2xl font-semibold mb-4">Projekt</h2>
      <div className="grid gap-4">
        {projects.map((project) => (
          <div
            key={project.id}
            className="bg-gray-800 p-4 rounded-lg flex justify-between items-center"
          >
            <div>
              <p>
                <strong>Projekt:</strong> {project.name}
              </p>
              <p>
                <strong>Ägare:</strong> {project.user.name} (
                {project.user.email})
              </p>
              <p>
                <strong>Roll:</strong> {project.user.role}
              </p>
            </div>
            <button
              onClick={() => handleDeleteProject(project.id)}
              className="bg-red-500 text-white px-4 py-2 rounded"
            >
              Ta bort
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
