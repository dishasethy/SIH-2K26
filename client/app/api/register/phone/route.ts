import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  try {
    const { name, phone, password } = await req.json();

    if (!name || !phone || !password) {
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

    const cleanPhone = phone.trim();

    // Check if user already exists with this phone number
    const existingUser = await prisma.user.findUnique({
      where: { phone: cleanPhone },
    });

    if (existingUser && existingUser.phoneVerified) {
      return NextResponse.json(
        { error: "This phone number is already registered." },
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    if (existingUser) {
      // Update existing user
      await prisma.user.update({
        where: { phone: cleanPhone },
        data: {
          name,
          password: hashedPassword,
          phoneVerified: new Date(),
        },
      });
    } else {
      // Create new user
      await prisma.user.create({
        data: {
          name,
          phone: cleanPhone,
          password: hashedPassword,
          phoneVerified: new Date(),
        },
      });
    }

    return NextResponse.json(
      { success: true, message: "Phone registration successful!" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Phone registration error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred during phone registration." },
      { status: 500 }
    );
  }
}
