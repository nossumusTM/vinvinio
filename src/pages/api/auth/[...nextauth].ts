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

          console.log('AUTH DEBUG user', {
            method,
            found: !!user,
            dbPhone: user?.phone,
            dbEmail: user?.email,
          });

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
  },
  // callbacks: {
  //   async signIn({ user, account }) {
  //     const existingUser = await prisma.user.findUnique({
  //       where: { email: user.email! },
  //     });
  
  //     if (!existingUser) {
  //       // ❌ Not registered yet
  //       return '/register?promptRole=true'; // redirect to a custom register step
  //     }
  
  //     return true; // ✅ Allow login
  //   },
  // },  
  secret: process.env.NEXTAUTH_SECRET,
};

export default NextAuth(authOptions);
