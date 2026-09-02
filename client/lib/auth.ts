import { AuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import prisma from "./prisma";
import bcrypt from "bcryptjs";

const adapter = process.env.DATABASE_URL ? PrismaAdapter(prisma) : undefined;

export const authOptions: AuthOptions = {
  ...(adapter ? { adapter } : {}),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "google-client-id-placeholder",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "google-client-secret-placeholder",
    }),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Please enter your login details");
        }

        if (!process.env.DATABASE_URL) {
          throw new Error("Database is not configured. Set DATABASE_URL in your deployment environment.");
        }

        const input = credentials.email.trim();
        const pwd = credentials.password;

        const envAdminUser = (process.env.admin_user || process.env.ADMIN_USER || "9078").trim();
        const envAdminPassword = (process.env.admin_password || process.env.ADMIN_PASSWORD || "707794").trim();

        if (input === envAdminUser && pwd === envAdminPassword) {
          return {
            id: "admin",
            name: "System Administrator",
            email: "admin@disasterresponse.gov",
            role: "admin",
          };
        }
        const user = await prisma.user.findFirst({
          where: {
            OR: [
              { email: input.toLowerCase() },
              { phone: input }
            ]
          }
        });

        if (!user) {
          throw new Error("No user found with this email or phone number");
        }

        if (!user.password) {
          throw new Error("This account was registered using another provider. Please try signing in with Google.");
        }

        // Verify password
        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.password
        );

        if (!isPasswordValid) {
          throw new Error("Invalid password");
        }

        // Check if verified
        if (user.email && !user.emailVerified) {
          throw new Error("EMAIL_NOT_VERIFIED");
        }
        if (user.phone && !user.phoneVerified) {
          throw new Error("PHONE_NOT_VERIFIED");
        }

        return {
          id: user.id,
          name: user.name,
          email: user.email || user.phone,
          image: user.image,
        };
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role || "user";
        token.phone = (user as any).phone || null;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        const sessionUser = session.user as { id?: string; name?: string | null; email?: string | null; image?: string | null; role?: string; phone?: string | null };
        sessionUser.id = token.id as string;
        sessionUser.role = token.role as string;

        const dbUser = token.id && token.id !== "admin"
          ? await prisma.user.findUnique({
              where: { id: token.id as string },
              select: { phone: true },
            })
          : null;

        sessionUser.phone = dbUser?.phone || (token.phone as string | null) || null;
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};
