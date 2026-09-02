import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  try {
    const { name, email, password } = await req.json();

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "Please fill in all fields." },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters." },
        { status: 400 }
      );
    }

    const emailLower = email.toLowerCase();

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: emailLower },
    });

    if (existingUser) {
      if (existingUser.emailVerified) {
        return NextResponse.json(
          { error: "This email is already registered." },
          { status: 400 }
        );
      }
      // Allow an incomplete registration to be completed again.
      const hashedPassword = await bcrypt.hash(password, 10);
      await prisma.user.update({
        where: { email: emailLower },
        data: {
          name,
          password: hashedPassword,
          emailVerified: new Date(),
        },
      });
    } else {
      // Create user with null emailVerified
      const hashedPassword = await bcrypt.hash(password, 10);
      await prisma.user.create({
        data: {
          name,
          email: emailLower,
          password: hashedPassword,
          emailVerified: new Date(),
        },
      });
    }

    return NextResponse.json(
      { success: true, email: emailLower, message: "Registration successful" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred during registration." },
      { status: 500 }
    );
  }
}
