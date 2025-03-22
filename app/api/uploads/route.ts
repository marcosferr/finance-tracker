import { NextResponse } from "next/server"
import { getAuthSession } from "@/auth"
import prisma from "@/lib/prisma"

export async function GET() {
  try {
    const session = await getAuthSession()

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const fileUploads = await prisma.fileUpload.findMany({
      where: {
        userId: session.user.id,
      },
      include: {
        account: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        uploadDate: "desc",
      },
    })

    return NextResponse.json(fileUploads)
  } catch (error) {
    console.error("Error fetching file uploads:", error)
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const session = await getAuthSession()

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { filename, fileType, accountId } = await req.json()

    if (!filename || !fileType || !accountId) {
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

    // Create file upload record
    const fileUpload = await prisma.fileUpload.create({
      data: {
        filename,
        fileType,
        accountId,
        userId: session.user.id,
        status: "processing",
      },
      include: {
        account: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    return NextResponse.json(fileUpload, { status: 201 })
  } catch (error) {
    console.error("Error creating file upload:", error)
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 })
  }
}

