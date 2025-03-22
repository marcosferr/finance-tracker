import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import prisma from "@/lib/prisma"
import { z } from "zod"

const resetPasswordSchema = z.object({
  token: z.string(),
  password: z
    .string()
    .min(8, { message: "Password must be at least 8 characters" })
    .regex(/[A-Z]/, { message: "Password must contain at least one uppercase letter" })
    .regex(/[a-z]/, { message: "Password must contain at least one lowercase letter" })
    .regex(/[0-9]/, { message: "Password must contain at least one number" }),
})

export async function POST(req: Request) {
  try {
    const body = await req.json()

    // Validate input
    const result = resetPasswordSchema.safeParse(body)
    if (!result.success) {
      const errors = result.error.errors.map((error) => ({
        path: error.path.join("."),
        message: error.message,
      }))
      return NextResponse.json({ errors }, { status: 400 })
    }

    const { token, password } = body

    // Find user with the reset token and check if it's not expired
    const user = await prisma.user.findFirst({
      where: {
        resetToken: token,
        resetTokenExpiry: {
          gt: new Date(),
        },
      },
    })

    if (!user) {
      return NextResponse.json({ error: "Invalid or expired reset token" }, { status: 400 })
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(password, 12)

    // Update the user's password and clear the reset token
    await prisma.user.update({
      where: {
        id: user.id,
      },
      data: {
        password: hashedPassword,
        resetToken: null,
        resetTokenExpiry: null,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Password reset error:", error)
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 })
  }
}

