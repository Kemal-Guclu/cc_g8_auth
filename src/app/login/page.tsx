"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema, LoginFormData } from "@/lib/schemas";
import { login } from "@/lib/actions/auth";
import { signIn } from "next-auth/react";
import { useState } from "react";

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    setError(null);
    setSuccess(false);

    const formData = new FormData();
    Object.entries(data).forEach(([key, value]) => {
      formData.append(key, value);
    });

    const result = await login(formData);
    if (result.error) {
      setError(result.error);
    } else {
      setSuccess(true);
      router.push("/dashboard");
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      const result = await signIn("google", {
        redirect: false,
        callbackUrl: "/dashboard",
      });
      if (result?.error) {
        setError("Fel vid inloggning med Google: " + result.error);
      } else if (result?.url) {
        router.push(result.url);
      } else {
        setError("Ingen redirect-URL returnerades från Google-inloggning");
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(
          "Ett oväntat fel inträffade vid Google-inloggning: " + err.message
        );
      } else {
        setError("Ett oväntat fel inträffade vid Google-inloggning.");
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900">
      <div className="bg-gray-100 p-8 rounded-lg shadow-lg w-full max-w-md">
        <h2 className="text-2xl font-bold text-center mb-4">
          Är du trött på tråkiga möten och statiska skärmar?
        </h2>

        <button
          onClick={handleGoogleSignIn}
          className="w-full bg-white border border-gray-300 text-gray-700 py-2 rounded-full flex items-center justify-center mb-3"
        >
          <Image
            src="/google-icon2.png"
            alt="Google"
            width={20}
            height={20}
            className="w-5 h-5 mr-2"
          />
          Logga in med Google
        </button>

        <div className="flex items-center justify-center my-4">
          <span className="text-gray-500">ELLER</span>
        </div>

        {error && <p className="text-red-500 text-center mb-4">{error}</p>}
        {success && (
          <p className="text-green-500 text-center mb-4">
            Inloggning lyckades!
          </p>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700"
            >
              E-post
            </label>
            <input
              type="email"
              {...register("email")}
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
              {...register("password")}
              className="w-full p-2 border border-gray-300 rounded-md"
            />
            {errors.password && (
              <p className="text-red-500 text-sm">{errors.password.message}</p>
            )}
            <Link
              href="/forgot-password"
              className="text-sm text-gray-500 hover:underline"
            >
              Glömt lösenord?
            </Link>
          </div>

          <button
            type="submit"
            className="w-full bg-orange-500 text-white py-2 rounded-full"
          >
            Logga in
          </button>
        </form>

        <div className="text-center mt-4">
          <span className="text-gray-500">Saknar du ett konto? </span>
          <Link href="/register" className="text-orange-500 hover:underline">
            Skapa ett här.
          </Link>
        </div>
      </div>
    </div>
  );
}
