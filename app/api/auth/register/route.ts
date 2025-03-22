import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";
import { z } from "zod";

// Create a schema for user registration validation
const userSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters" }),
  email: z.string().email({ message: "Invalid email address" }),
  password: z
    .string()
    .min(8, { message: "Password must be at least 8 characters" })
    .regex(/[A-Z]/, {
      message: "Password must contain at least one uppercase letter",
    })
    .regex(/[a-z]/, {
      message: "Password must contain at least one lowercase letter",
    })
    .regex(/[0-9]/, { message: "Password must contain at least one number" }),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // Validate input
    const result = userSchema.safeParse(body);
    if (!result.success) {
      const errors = result.error.errors.map((error) => ({
        path: error.path.join("."),
        message: error.message,
      }));
      return NextResponse.json({ errors }, { status: 400 });
    }

    const { name, email, password } = body;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: {
        email,
      },
    });
    console.log("Existing user:", existingUser);

    if (existingUser) {
      return NextResponse.json(
        { error: "User with this email already exists" },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
      },
    });

    // Create default settings
    await prisma.userSettings.create({
      data: {
        userId: user.id,
        theme: "light",
        currency: "USD",
        language: "en",
      },
    });

    // Create default categories
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
        userId: user.id,
      })),
    });

    return NextResponse.json(
      {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
