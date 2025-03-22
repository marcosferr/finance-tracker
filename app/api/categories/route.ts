import { NextResponse } from "next/server"
import { getAuthSession } from "@/auth"
import prisma from "@/lib/prisma"

export async function GET() {
  try {
    const session = await getAuthSession()

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const categories = await prisma.category.findMany({
      where: {
        userId: session.user.id,
      },
      orderBy: {
        name: "asc",
      },
    })

    return NextResponse.json(categories)
  } catch (error) {
    console.error("Error fetching categories:", error)
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const session = await getAuthSession()

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { name, color, budget } = await req.json()

    if (!name || !color) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Check if category with same name already exists
    const existingCategory = await prisma.category.findFirst({
      where: {
        name,
        userId: session.user.id,
      },
    })

    if (existingCategory) {
      return NextResponse.json({ error: "Category with this name already exists" }, { status: 400 })
    }

    const category = await prisma.category.create({
      data: {
        name,
        color,
        budget: budget ? Number.parseFloat(budget) : null,
        userId: session.user.id,
      },
    })

    return NextResponse.json(category, { status: 201 })
  } catch (error) {
    console.error("Error creating category:", error)
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 })
  }
}

