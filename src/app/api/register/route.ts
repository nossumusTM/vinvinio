// import { NextResponse } from "next/server";
// export const dynamic = 'force-dynamic';
// import bcrypt from "bcrypt";
// import { v4 as uuidv4 } from "uuid";
// import prisma from "@/app/libs/prismadb";

// export async function POST(request: Request) {
//   try {
//     const body = await request.json();
//     const { email, name, password, role } = body;

//     // Validate required fields
//     if (!email || !name || !password || !role) {
//       return NextResponse.json("Missing required fields", { status: 400 });
//     }

//     // Check if the user already exists
//     const existingUser = await prisma.user.findUnique({
//       where: { email },
//     });

//     if (existingUser) {
//       return NextResponse.json("Email already in use", { status: 409 });
//     }

//     const existingName = await prisma.user.findFirst({
//       where: { name },
//     });
    
//     if (existingName) {
//       return NextResponse.json("Name is already taken.", { status: 409 });
//     }

//     // Hash the password
//     const hashedPassword = await bcrypt.hash(password, 12);

//     // Generate referenceId only for promoter role
//     const referenceId = role === 'promoter' ? uuidv4() : undefined;

//     // Create the new user
//     const user = await prisma.user.create({
//       data: {
//         email,
//         name,
//         hashedPassword,
//         role,
//         referenceId, // Store if applicable
//       },
//     });

//     // console.log("Registering user:", { email, name, role });
//     // console.log("Registered user:", user );


//     return NextResponse.json(user);
//   } catch (error: any) {
//     console.error("Registration error:", error);
  
//     if (error.code === 'P2002') {
//       const target = error.meta?.target;
  
//       if (Array.isArray(target)) {
//         if (target.includes('email')) {
//           return NextResponse.json("Email already in use", { status: 409 });
//         }
  
//         if (target.includes('name')) {
//           return NextResponse.json("Name is already taken.", { status: 409 });
//         }
//       }
//     }
  
//     return NextResponse.json("Internal Server Error", { status: 500 });
//   }  
// }

import { NextResponse } from "next/server";
export const dynamic = 'force-dynamic';
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

    const trimmedEmail = email.trim().toLowerCase();
    const trimmedName = name.trim();

    // Check if the email is already used
    const existingUser = await prisma.user.findUnique({
      where: { email: trimmedEmail },
    });

    if (existingUser) {
      return NextResponse.json("Email already in use", { status: 409 });
    }

    // Case-insensitive name uniqueness check
    const existingName = await prisma.user.findFirst({
      where: {
        name: {
          equals: trimmedName,
          mode: 'insensitive',
        },
      },
    });

    if (existingName) {
      return NextResponse.json("Name is already taken.", { status: 409 });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Generate reference ID for promoter
    const referenceId = role === 'promoter' ? uuidv4() : undefined;

    // Create user
    const user = await prisma.user.create({
      data: {
        email: trimmedEmail,
        name: trimmedName,
        hashedPassword,
        role,
        referenceId,
      },
    });

    return NextResponse.json(user);
  } catch (error: any) {
    console.error("Registration error:", error);

    // Prisma duplicate key error handling
    if (error.code === 'P2002') {
      const target = error.meta?.target;

      if (Array.isArray(target)) {
        if (target.includes('email')) {
          return NextResponse.json("Email already in use", { status: 409 });
        }
        if (target.includes('name')) {
          return NextResponse.json("Name is already taken.", { status: 409 });
        }
      }
    }

    return NextResponse.json("Internal Server Error", { status: 500 });
  }
}