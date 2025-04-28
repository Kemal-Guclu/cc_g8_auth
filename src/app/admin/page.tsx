"use client";

import { useEffect, useState } from "react";
import {
  getAllUsers,
  getAllProjects,
  deleteUser,
  deleteProject,
} from "@/lib/actions/auth";

export default function AdminPage() {
  interface User {
    id: number;
    name: string;
    email: string;
    role: string;
  }

  const [users, setUsers] = useState<User[]>([]);
  interface Project {
    id: number;
    name: string;
    user: {
      name: string;
      email: string;
      role: string;
    };
  }

  const [projects, setProjects] = useState<Project[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const usersData = await getAllUsers();
        const projectsData = await getAllProjects();
        setUsers(usersData);
        setProjects(projectsData);
      } catch (err: unknown) {
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError("An unknown error occurred");
        }
      }
    };

    fetchData();
  }, []);

  const handleDeleteUser = async (userId: number) => {
    try {
      await deleteUser(userId);
      setUsers(users.filter((user) => user.id !== userId));
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("An unknown error occurred");
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
        setError("An unknown error occurred");
      }
    }
  };

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
