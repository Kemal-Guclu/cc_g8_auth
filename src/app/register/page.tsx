"use client";

import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { registerSchema, RegisterFormData } from "@/lib/schemas";
import { register } from "@/lib/actions/auth";
import { signIn } from "next-auth/react";
import { useState } from "react";

export default function RegisterPage() {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);

  const {
    register: formRegister,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterFormData) => {
    setError(null);
    setSuccess(false);

    const formData = new FormData();
    Object.entries(data).forEach(([key, value]) => {
      if (value) formData.append(key, value);
    });

    const result = await register(formData);
    if (result.error) {
      setError(result.error);
    } else {
      setSuccess(true);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900">
      <div className="bg-gray-100 p-8 rounded-lg shadow-lg w-full max-w-md">
        <h2 className="text-2xl font-bold text-center mb-4">Skapa ett konto</h2>

        <button
          onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
          className="w-full bg-white border border-gray-300 text-gray-700 py-2 rounded-full flex items-center justify-center mb-3"
        >
          <img src="/google-icon.png" alt="Google" className="w-5 h-5 mr-2" />
          Registrera med Google
        </button>

        <button
          onClick={() => signIn("facebook", { callbackUrl: "/dashboard" })}
          className="w-full bg-blue-600 text-white py-2 rounded-full mb-3"
        >
          Registrera med Facebook
        </button>

        <div className="flex items-center justify-center my-4">
          <span className="text-gray-500">ELLER</span>
        </div>

        {error && <p className="text-red-500 text-center mb-4">{error}</p>}
        {success && (
          <p className="text-green-500 text-center mb-4">
            Registrering lyckades!
          </p>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label
              htmlFor="name"
              className="block text-sm font-medium text-gray-700"
            >
              Namn
            </label>
            <input
              type="text"
              {...formRegister("name")}
              className="w-full p-2 border border-gray-300 rounded-md"
            />
            {errors.name && (
              <p className="text-red-500 text-sm">{errors.name.message}</p>
            )}
          </div>

          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700"
            >
              E-post
            </label>
            <input
              type="email"
              {...formRegister("email")}
              className="w-full p-2 border border-gray-300 rounded-md"
            />
            {errors.email && (
              <p className="text-red-500 text-sm">{errors.email.message}</p>
            )}
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700"
            >
              Lösenord
            </label>
            <input
              type="password"
              {...formRegister("password")}
              className="w-full p-2 border border-gray-300 rounded-md"
            />
            {errors.password && (
              <p className="text-red-500 text-sm">{errors.password.message}</p>
            )}
          </div>

          <button
            type="submit"
            className="w-full bg-orange-500 text-white py-2 rounded-full"
          >
            Skapa konto
          </button>
        </form>

        <div className="text-center mt-4">
          <span className="text-gray-500">Har du redan ett konto? </span>
          <Link href="/login" className="text-orange-500 hover:underline">
            Logga in här.
          </Link>
        </div>
      </div>
    </div>
  );
}
