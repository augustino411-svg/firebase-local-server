import { Auth } from "@auth/core";
import Credentials from "@auth/core/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

export const authHandler = async (request: Request) => {
  return await Auth(request, {
    secret: process.env.JWT_SECRET,
    providers: [
      Credentials({
        name: "Credentials",
        credentials: {
          email: { label: "Email", type: "text" },
          password: { label: "Password", type: "password" },
        },
        authorize: async (credentials) => {
          const email =
            typeof credentials.email === "string" ? credentials.email : undefined;
          const password =
            typeof credentials.password === "string" ? credentials.password : "";

          if (!email || !password) return null;

          const user = await prisma.user.findUnique({
            where: { email },
          });

          if (!user) return null;

          const valid = await bcrypt.compare(password, user.passwordHash);

          return valid
            ? {
                ...user,
                id: String(user.id), // ✅ 修正型別：轉成 string
              }
            : null;
        },
      }),
    ],
    adapter: PrismaAdapter(prisma),
    session: { strategy: "jwt" },
    jwt: {
      maxAge: 30 * 24 * 60 * 60, // optional: 30 days
    },
  });
};