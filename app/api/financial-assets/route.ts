import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthSession } from "@/auth";
import type { Session } from "next-auth";
import { revalidatePath } from "next/cache";

export async function GET() {
  try {
    const session = (await getAuthSession()) as Session & {
      user: { id: string };
    };
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const financialAssets = await prisma.financialAsset.findMany({
      where: {
        userId: session.user.id,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(financialAssets, {
      headers: {
        "Cache-Control": "no-store, must-revalidate",
        Pragma: "no-cache",
        Expires: "0",
      },
    });
  } catch (error) {
    console.error("Error fetching financial assets:", error);
    return NextResponse.json(
      { error: "Failed to fetch financial assets" },
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
    if (
      !data.name ||
      !data.amount ||
      !data.type ||
      data.interestRate === undefined
    ) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const newFinancialAsset = {
      name: String(data.name),
      type: String(data.type),
      amount: Number(data.amount),
      interestRate: Number(data.interestRate),
      startDate: data.startDate ? new Date(data.startDate) : new Date(),
      maturityDate: data.maturityDate ? new Date(data.maturityDate) : null,
      provider: data.provider ? String(data.provider) : null,
      notes: data.notes ? String(data.notes) : "",
      status: data.status ? String(data.status) : "ACTIVE",
      userId: String(session.user.id),
    };

    const financialAsset = await prisma.financialAsset.create({
      data: newFinancialAsset,
    });

    // Revalidate the financial assets page cache
    revalidatePath("/financial-assets");

    return NextResponse.json(financialAsset);
  } catch (error) {
    const errorResponse = {
      error:
        error instanceof Error ? error.message : "An unexpected error occurred",
      details: error instanceof Error ? error.stack : undefined,
    };
    console.error("Error creating financial asset:", errorResponse.error);
    return NextResponse.json(errorResponse, { status: 500 });
  }
}
