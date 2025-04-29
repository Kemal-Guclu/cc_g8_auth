import NextAuth, { NextAuthOptions, User } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
//import FacebookProvider from "next-auth/providers/facebook";
import { prisma } from "@/lib/prisma";
import { generateToken } from "@/lib/jwt";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

type JWTPayload = {
  id: number;
  email: string;
  role: string;
};

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),

    // FacebookProvider({
    //   clientId: process.env.FACEBOOK_CLIENT_ID!,
    //   clientSecret: process.env.FACEBOOK_CLIENT_SECRET!,
    // }),
  ],
  callbacks: {
    async signIn({ user }: { user: User }) {
      try {
        if (!user.email) return false;

        let dbUser = await prisma.user.findUnique({
          where: { email: user.email },
          include: { role: true },
        });

        if (!dbUser) {
          let userRole = await prisma.role.findUnique({
            where: { name: "USER" },
          });
          if (!userRole) {
            userRole = await prisma.role.create({
              data: { name: "USER" },
            });
          }

          const createdUser = await prisma.user.create({
            data: {
              email: user.email,
              name: user.name || "Okänd",
              avatar: user.image || null,
              roleId: userRole.id,
              isVerified: true,
              password: "default_password", // Replace with a secure default or hashed password
            },
          });

          dbUser = await prisma.user.findUnique({
            where: { id: createdUser.id },
            include: { role: true },
          });

          if (!dbUser) {
            throw new Error("Användaren hittades inte");
          }

          dbUser = await prisma.user.findUnique({
            where: { id: dbUser.id },
            include: { role: true },
          });

          if (!dbUser) {
            throw new Error("Användaren hittades inte");
          }

          await prisma.project.create({
            data: {
              name: "Mitt första projekt",
              userId: dbUser.id,
            },
          });
        }

        const token = generateToken({
          id: dbUser.id,
          email: dbUser.email,
          role: dbUser.role.name,
        });

        const cookieStore = await cookies();
        cookieStore.set("token", token, {
          httpOnly: true,
          secure: true,
          maxAge: 3600,
        });

        return true;
      } catch (error) {
        console.error("Fel vid OAuth-inloggning:", error);
        return false;
      }
    },
    async redirect({ baseUrl }: { url: string; baseUrl: string }) {
      return baseUrl + "/dashboard";
    },
  },
};

const handler = NextAuth(authOptions);

export async function getUserAndProjects() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
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

export { handler as GET, handler as POST };

function verifyToken(token: string): JWTPayload {
  try {
    const secret = process.env.JWT_SECRET!;
    if (!secret) {
      throw new Error("JWT_SECRET är inte definierad i miljövariablerna");
    }

    const decoded = jwt.verify(token, secret) as JWTPayload;
    return decoded;
  } catch (error) {
    console.error("Fel vid verifiering av token:", error);
    throw new Error("Ogiltig eller utgången token");
  }
}
// Removed duplicate implementation of verifyToken function
// Denna fil hanterar autentisering med Google och Facebook, samt skapar en användare i databasen om den inte redan finns.
// Den genererar också en JWT-token och sparar den i cookies för att hantera sessioner.
// Du kan också se hur användarroller hanteras och hur en standardprojekt skapas för nya användare.
