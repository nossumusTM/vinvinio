import bcrypt from "bcrypt";
import NextAuth, { AuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GithubProvider from "next-auth/providers/github";
import GoogleProvider from "next-auth/providers/google";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { verifyTotp } from "@/app/(marketplace)/utils/totp";

import {
  RequestTimeoutError,
  withRequestTimeout,
} from "@/app/(marketplace)/utils/withTimeout";

import prisma from "@/app/(marketplace)/libs/prismadb";

const LOGIN_TIMEOUT_MS = 10_000;
const IS_PRODUCTION = process.env.NODE_ENV === "production";

if (IS_PRODUCTION && !process.env.NEXTAUTH_SECRET) {
  throw new Error("NEXTAUTH_SECRET is required in production");
}

export const authOptions: AuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    GithubProvider({
      clientId: process.env.GITHUB_CLIENT_ID as string,
      clientSecret: process.env.GITHUB_CLIENT_SECRET as string,
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    }),
    CredentialsProvider({
      name: "credentials",
      credentials: {
        identifier: { label: "identifier", type: "text" },
        password: { label: "password", type: "password" },
        method: { label: "method", type: "text" },
        totpCode: { label: "totpCode", type: "text" },
      },
      async authorize(credentials) {
        const method = credentials?.method === 'phone' ? 'phone' : 'email';
        const identifier = credentials?.identifier?.trim();
        const password = credentials?.password;
        const totpCode = credentials?.totpCode;

        if (!identifier || !password) {
          throw new Error("Invalid credentials");
        }

        const normalizedIdentifier =
          method === 'email' ? identifier.toLowerCase() : identifier;

        let user;
        try {
          user = await withRequestTimeout(
            method === 'phone'
              ? prisma.user.findFirst({
                  where: {
                    phone: normalizedIdentifier,
                  },
                })
              : prisma.user.findUnique({
                  where: {
                    email: normalizedIdentifier,
                  },
                }),
            {
              timeoutMs: LOGIN_TIMEOUT_MS,
              timeoutMessage: "Login request timed out. Please try again.",
            }
          );
        } catch (error) {
          if (error instanceof RequestTimeoutError) {
            throw new Error(error.message);
          }
          throw error;
        }

        if (!user || !user?.hashedPassword) {
          throw new Error("Invalid credentials");
        }

        const isCorrectPassword = await bcrypt.compare(
          password,
          user.hashedPassword
        );

        if (!isCorrectPassword) {
          throw new Error("Invalid credentials");
        }

        if (user.twoFactorEnabled) {
          if (!user.twoFactorSecret) {
            throw new Error("Two-factor authentication is misconfigured. Please contact support.");
          }

          if (!totpCode) {
            throw new Error("Two-factor code required");
          }

          if (!/^\d{6}$/.test(totpCode)) {
            throw new Error("Invalid or expired two-factor code");
          }

          const isValidTotp = verifyTotp(totpCode, user.twoFactorSecret);

          if (!isValidTotp) {
            throw new Error("Invalid or expired two-factor code");
          }
        }

        return user;
      },
    }),
  ],
  pages: {
    signIn: "/",
  },
  debug: process.env.NODE_ENV === "development",
  session: {
    strategy: "jwt",
    maxAge: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // refresh JWT every 24h
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      if (!user?.email) {
        return false;
      }

      const existingUser = await prisma.user.findUnique({
        where: { email: user.email.toLowerCase() },
        select: {
          id: true,
          role: true,
          isSuspended: true,
          twoFactorEnabled: true,
        },
      });

      if (!existingUser) {
        return account?.provider !== "credentials";
      }

      if (existingUser.isSuspended) {
        return false;
      }

      if (IS_PRODUCTION && existingUser.role === "moder") {
        return false;
      }

      const provider = account?.provider ?? "credentials";
      const isCredentials = provider === "credentials";

      // Prevent bypassing credential 2FA via social providers.
      if (!isCredentials && existingUser.twoFactorEnabled) {
        return false;
      }

      // If provider exposes email verification state, require it.
      if (!isCredentials && profile && typeof profile === "object") {
        const candidate = profile as Record<string, unknown>;
        const emailVerified =
          typeof candidate.email_verified === "boolean"
            ? candidate.email_verified
            : typeof candidate.verified_email === "boolean"
              ? candidate.verified_email
              : undefined;

        if (emailVerified === false) {
          return false;
        }
      }

      return true;
    },
    async jwt({ token, user }) {
      const userId = (typeof user?.id === "string" ? user.id : undefined) ?? token.sub;
      if (!userId) {
        return token;
      }

      const dbUser = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          role: true,
          isSuspended: true,
        },
      });

      if (!dbUser) {
        token.blocked = true;
        return token;
      }

      token.sub = dbUser.id;
      token.role = dbUser.role;
      token.isSuspended = dbUser.isSuspended;
      token.blocked = dbUser.isSuspended || (IS_PRODUCTION && dbUser.role === "moder");

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        const sessionUser = session.user as typeof session.user & {
          id?: string;
          role?: string;
        };
        sessionUser.id = typeof token.sub === "string" ? token.sub : sessionUser.id;
        sessionUser.role = typeof token.role === "string" ? token.role : sessionUser.role;
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};

export default NextAuth(authOptions);
