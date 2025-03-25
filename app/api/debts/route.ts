import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthSession } from "@/auth";
import type { Debt } from "@/types/finance";
import type { Session } from "next-auth";

export async function GET() {
  try {
    const session = (await getAuthSession()) as Session & {
      user: { id: string };
    };
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const debts = await prisma.debt.findMany({
      where: {
        userId: session.user.id,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(debts);
  } catch (error) {
    console.error("Error fetching debts:", error);
    return NextResponse.json(
      { error: "Failed to fetch debts" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = (await getAuthSession()) as Session & {
      user: { id: string };
    };
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify the user exists in the database
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found. Please log in again." },
        { status: 401 }
      );
    }

    const data = await request.json();

    // Validate required fields
    if (!data.name || !data.totalAmount || data.interestRate === undefined) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const newDebt = {
      name: String(data.name),
      totalAmount: Number(data.totalAmount),
      paidAmount: data.paidAmount ? Number(data.paidAmount) : 0,
      interestRate: Number(data.interestRate),
      dueDate: data.dueDate ? new Date(data.dueDate) : null,
      userId: String(session.user.id),
      notes: data.notes ? String(data.notes) : "",
      status: data.status ? String(data.status) : "ACTIVE",
    };

    const debt = await prisma.debt.create({
      data: newDebt,
    });

    return NextResponse.json(debt);
  } catch (error) {
    const errorResponse = {
      error:
        error instanceof Error ? error.message : "An unexpected error occurred",
      details: error instanceof Error ? error.stack : undefined,
    };
    console.error("Error creating debt:", errorResponse.error);
    return NextResponse.json(errorResponse, { status: 500 });
  }
}
