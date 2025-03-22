import { NextResponse } from "next/server"
import { randomBytes } from "crypto"
import prisma from "@/lib/prisma"
import { sendPasswordResetEmail } from "@/lib/email-service"

export async function POST(req: Request) {
  try {
    const { email } = await req.json()

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 })
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: {
        email,
      },
    })

    // Even if user doesn't exist, return success to prevent email enumeration attacks
    if (!user) {
      return NextResponse.json({ success: true })
    }

    // Generate a reset token that expires in 1 hour
    const resetToken = randomBytes(20).toString("hex")
    const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000)

    // Store the reset token and expiry in the database
    await prisma.user.update({
      where: {
        id: user.id,
      },
      data: {
        resetToken,
        resetTokenExpiry,
      },
    })

    // Send password reset email
    await sendPasswordResetEmail(user.email, resetToken)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Password reset request error:", error)
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 })
  }
}

