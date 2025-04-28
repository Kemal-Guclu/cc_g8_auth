import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import FacebookProvider from "next-auth/providers/facebook";
import { prisma } from "@/lib/prisma";
import { generateToken } from "@/lib/jwt";
import { cookies } from "next/headers";

export const authOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    FacebookProvider({
      clientId: process.env.FACEBOOK_CLIENT_ID!,
      clientSecret: process.env.FACEBOOK_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }: any) {
      if (!user.email) return false;

      let dbUser = await prisma.user.findUnique({
        where: { email: user.email },
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

        dbUser = await prisma.user.create({
          data: {
            email: user.email,
            name: user.name || "Okänd",
            avatar: user.image || null,
            roleId: userRole.id,
            isVerified: true,
          },
        });

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
        role: dbUser.roleId === userRole?.id ? "USER" : "ADMIN",
      });

      cookies().set("token", token, {
        httpOnly: true,
        secure: true,
        maxAge: 3600,
      });

      return true;
    },
    async redirect({ url, baseUrl }: any) {
      return baseUrl + "/dashboard";
    },
  },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };

// Denna fil hanterar autentisering med Google och Facebook, samt skapar en användare i databasen om den inte redan finns.
// Den genererar också en JWT-token och sparar den i cookies för att hantera sessioner.
// Du kan också se hur användarroller hanteras och hur en standardprojekt skapas för nya användare.
