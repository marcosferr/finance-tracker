import { PrismaAdapter } from "@auth/prisma-adapter";
import type { NextAuthOptions } from "next-auth";
import { getServerSession } from "next-auth/next";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import type { Adapter } from "next-auth/adapters";
import { randomBytes, randomUUID } from "crypto";

import prisma from "@/lib/prisma";

// Update the export to make authOptions available to the API route
export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as Adapter,
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
    generateSessionToken: () =>
      randomUUID?.() ?? randomBytes(32).toString("hex"),
  },
  pages: {
    signIn: "/auth/login",
    signUp: "/auth/register",
    error: "/auth/error",
    verifyRequest: "/auth/verify-request",
    newUser: "/dashboard",
  },
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
      allowDangerousEmailAccountLinking: true,
    }),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const user = await prisma.user.findUnique({
          where: {
            email: credentials.email,
          },
        });

        if (!user || !user.password) {
          return null;
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.password
        );

        if (!isPasswordValid) {
          return null;
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
        };
      },
    }),
  ],
  callbacks: {
    async session({ token, session }) {
      if (token) {
        session.user.id = token.id as string;
        session.user.name = token.name;
        session.user.email = token.email;
        session.user.image = token.picture;
      }

      return session;
    },
    async jwt({ token, user, account }) {
      const dbUser = await prisma.user.findFirst({
        where: {
          email: token.email,
        },
      });

      if (!dbUser) {
        if (user) {
          token.id = user.id;
        }
        return token;
      }

      // If user logged in with OAuth and doesn't have a password yet
      if (
        account?.provider &&
        account.provider !== "credentials" &&
        !dbUser.password
      ) {
        token.isOAuthWithoutPassword = true;
      } else {
        token.isOAuthWithoutPassword = false;
      }

      return {
        id: dbUser.id,
        name: dbUser.name,
        email: dbUser.email,
        picture: dbUser.image,
        isOAuthWithoutPassword: token.isOAuthWithoutPassword,
      };
    },
  },
  debug: process.env.NODE_ENV === "development",
};

export const getAuthSession = () => getServerSession(authOptions);

async function createDefaultCategoriesAndSettings(userId: string) {
  // Create default settings if they don't exist
  const existingSettings = await prisma.userSettings.findUnique({
    where: { userId },
  });

  if (!existingSettings) {
    await prisma.userSettings.create({
      data: {
        userId,
        theme: "light",
        currency: "USD",
        language: "en",
      },
    });
  }

  // Create default categories
  const existingCategories = await prisma.category.count({
    where: { userId },
  });

  if (existingCategories === 0) {
    const defaultCategories = [
      { name: "Housing", color: "#4ade80", budget: 1500 },
      { name: "Food", color: "#60a5fa", budget: 500 },
      { name: "Transportation", color: "#f87171", budget: 300 },
      { name: "Entertainment", color: "#facc15", budget: 200 },
      { name: "Utilities", color: "#c084fc", budget: 150 },
      { name: "Other", color: "#fb923c", budget: 100 },
    ];

    await prisma.category.createMany({
      data: defaultCategories.map((category) => ({
        name: category.name,
        color: category.color,
        budget: category.budget,
        userId,
      })),
    });
  }
}
