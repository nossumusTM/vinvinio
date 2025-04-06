import { NextResponse } from "next/server";
import bcrypt from "bcrypt";
import { v4 as uuidv4 } from "uuid";
import prisma from "@/app/libs/prismadb";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, name, password, role } = body;

    // Validate required fields
    if (!email || !name || !password || !role) {
      return NextResponse.json("Missing required fields", { status: 400 });
    }

    // Check if the user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json("Email already in use", { status: 409 });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Generate referenceId only for promoter role
    const referenceId = role === 'promoter' ? uuidv4() : undefined;

    // Create the new user
    const user = await prisma.user.create({
      data: {
        email,
        name,
        hashedPassword,
        role,
        referenceId, // Store if applicable
      },
    });

    console.log("Registering user:", { email, name, role });
    console.log("Registered user:", user );


    return NextResponse.json(user);
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json("Internal Server Error", { status: 500 });
  }
}
