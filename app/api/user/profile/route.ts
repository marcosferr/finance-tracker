import { NextResponse } from "next/server"
import { getAuthSession } from "@/auth"
import prisma from "@/lib/prisma"
import { z } from "zod"

const profileSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters" }),
})

export async function PATCH(req: Request) {
  try {
    const session = await getAuthSession()

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()

    // Validate input
    const result = profileSchema.safeParse(body)
    if (!result.success) {
      const errors = result.error.errors.map((error) => ({
        path: error.path.join("."),
        message: error.message,
      }))
      return NextResponse.json({ errors }, { status: 400 })
    }

    const { name } = body

    // Update user
    const updatedUser = await prisma.user.update({
      where: {
        id: session.user.id,
      },
      data: {
        name,
      },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
      },
    })

    return NextResponse.json(updatedUser)
  } catch (error) {
    console.error("Error updating profile:", error)
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 })
  }
}

