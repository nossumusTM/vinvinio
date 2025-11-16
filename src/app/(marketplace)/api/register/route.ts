import { NextResponse } from "next/server";
export const dynamic = "force-dynamic";

import bcrypt from "bcrypt";
import { v4 as uuidv4 } from "uuid";
import prisma from "@/app/(marketplace)/libs/prismadb";
import { formatPhoneNumberToE164 } from "@/app/(marketplace)/utils/phone";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, name, password, role, phone } = body;

    // Validate required fields
    if (!email || !name || !password || !role || !phone) {
      return NextResponse.json("Missing required fields", { status: 400 });
    }

    if (role === "moder") {
      return NextResponse.json(
        "Registration with 'moder' role is not allowed.",
        { status: 403 }
      );
    }

    const trimmedEmail = String(email).trim().toLowerCase();
    const trimmedName = String(name).trim();
    const sanitizedPhone = String(phone).trim();

    // Basic sanity: must start with + and have digits after it
    if (!/^(\+?[1-9]\d{6,20})$/.test(sanitizedPhone)) {
      return NextResponse.json("Phone number is invalid", { status: 400 });
    }

    // Email uniqueness
    const existingUser = await prisma.user.findUnique({
      where: { email: trimmedEmail },
    });

    if (existingUser) {
      return NextResponse.json("Email already in use", { status: 409 });
    }

    // 🔹 Username uniqueness (case-insensitive)
    const existingUsername = await prisma.user.findFirst({
      where: {
        username: {
          equals: trimmedName,
          mode: "insensitive",
        },
      },
    });

    if (existingUsername) {
      return NextResponse.json("Name is already taken.", { status: 409 });
    }

    // Phone uniqueness
    const existingPhone = await prisma.user.findFirst({
      where: {
        phone: sanitizedPhone,
      },
    });

    if (existingPhone) {
      return NextResponse.json("Phone number already in use", { status: 409 });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Generate reference ID for promoter
    const referenceId = role === "promoter" ? uuidv4() : undefined;

    // 🔹 Create user with *both* name and username set
    const user = await prisma.user.create({
      data: {
        email: trimmedEmail,
        name: trimmedName,        // display name
        username: trimmedName,    // unique username
        phone: sanitizedPhone,
        hashedPassword,
        role,
        referenceId,
        passwordUpdatedAt: new Date(),
      },
    });

    return NextResponse.json(user);
  } catch (error: any) {
    console.error("Registration error:", error);

    // Prisma duplicate key error handling
    if (error.code === "P2002") {
      const target = error.meta?.target;

      // target can be "User_username_key", "User_email_key", etc.
      if (typeof target === "string") {
        if (target.includes("email")) {
          return NextResponse.json("Email already in use", { status: 409 });
        }
        if (target.includes("username")) {
          return NextResponse.json("Name is already taken.", { status: 409 });
        }
        if (target.includes("phone")) {
          return NextResponse.json("Phone number already in use", { status: 409 });
        }
      } else if (Array.isArray(target)) {
        if (target.includes("email")) {
          return NextResponse.json("Email already in use", { status: 409 });
        }
        if (target.includes("username")) {
          return NextResponse.json("Name is already taken.", { status: 409 });
        }
        if (target.includes("phone")) {
          return NextResponse.json("Phone number already in use", { status: 409 });
        }
      }

      return NextResponse.json("Duplicate value for unique field", { status: 409 });
    }

    return NextResponse.json("Internal Server Error", { status: 500 });
  }
}
