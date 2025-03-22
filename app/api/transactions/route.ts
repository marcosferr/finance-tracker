import { NextResponse } from "next/server"
import { getAuthSession } from "@/auth"
import prisma from "@/lib/prisma"

export async function GET(req: Request) {
  try {
    const session = await getAuthSession()

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const limit = searchParams.get("limit") ? Number.parseInt(searchParams.get("limit")!) : 50
    const offset = searchParams.get("offset") ? Number.parseInt(searchParams.get("offset")!) : 0
    const accountId = searchParams.get("accountId")
    const categoryId = searchParams.get("categoryId")
    const startDate = searchParams.get("startDate")
    const endDate = searchParams.get("endDate")
    const type = searchParams.get("type") // income, expense, all

    // Build where clause
    const where: any = {
      userId: session.user.id,
    }

    if (accountId) {
      where.accountId = accountId
    }

    if (categoryId) {
      where.categoryId = categoryId
    }

    if (startDate || endDate) {
      where.date = {}
      if (startDate) {
        where.date.gte = new Date(startDate)
      }
      if (endDate) {
        where.date.lte = new Date(endDate)
      }
    }

    if (type === "income") {
      where.amount = {
        gt: 0,
      }
    } else if (type === "expense") {
      where.amount = {
        lt: 0,
      }
    }

    // Get total count
    const totalCount = await prisma.transaction.count({
      where,
    })

    // Get transactions
    const transactions = await prisma.transaction.findMany({
      where,
      include: {
        category: {
          select: {
            id: true,
            name: true,
            color: true,
          },
        },
        account: {
          select: {
            id: true,
            name: true,
            color: true,
          },
        },
      },
      orderBy: {
        date: "desc",
      },
      take: limit,
      skip: offset,
    })

    return NextResponse.json({
      transactions,
      totalCount,
      limit,
      offset,
    })
  } catch (error) {
    console.error("Error fetching transactions:", error)
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const session = await getAuthSession()

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { date, description, amount, categoryId, accountId } = await req.json()

    if (!date || !description || amount === undefined || !accountId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Check if account exists and belongs to user
    const account = await prisma.financialAccount.findUnique({
      where: {
        id: accountId,
        userId: session.user.id,
      },
    })

    if (!account) {
      return NextResponse.json({ error: "Account not found" }, { status: 404 })
    }

    // Check if category exists and belongs to user (if provided)
    if (categoryId) {
      const category = await prisma.category.findUnique({
        where: {
          id: categoryId,
          userId: session.user.id,
        },
      })

      if (!category) {
        return NextResponse.json({ error: "Category not found" }, { status: 404 })
      }
    }

    // Create transaction
    const transaction = await prisma.transaction.create({
      data: {
        date: new Date(date),
        description,
        amount: Number.parseFloat(amount),
        categoryId: categoryId || null,
        accountId,
        userId: session.user.id,
      },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            color: true,
          },
        },
        account: {
          select: {
            id: true,
            name: true,
            color: true,
          },
        },
      },
    })

    // Update account balance
    await prisma.financialAccount.update({
      where: {
        id: accountId,
      },
      data: {
        balance: {
          increment: Number.parseFloat(amount),
        },
      },
    })

    return NextResponse.json(transaction, { status: 201 })
  } catch (error) {
    console.error("Error creating transaction:", error)
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 })
  }
}

