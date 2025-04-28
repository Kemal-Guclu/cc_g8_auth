import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Ange en giltig e-postadress"),
  password: z.string().min(6, "Lösenordet måste vara minst 6 tecken"),
});

export const registerSchema = z.object({
  email: z.string().email("Ange en giltig e-postadress"),
  password: z.string().min(6, "Lösenordet måste vara minst 6 tecken"),
  name: z.string().min(1, "Namn är obligatoriskt"),
  avatar: z.string().optional(), // Avatar är valfritt
});

export type LoginFormData = z.infer<typeof loginSchema>;
export type RegisterFormData = z.infer<typeof registerSchema>;
