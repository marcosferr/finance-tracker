import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthSession } from "@/auth";
import type { Debt } from "@/types/finance";

export async function GET() {
  try {
    const session = await getAuthSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const debts = await prisma.debt.findMany({
      where: {
        userId: session.user.id,
      },
    });

    const stats = {
      totalDebt: debts.reduce(
        (sum: number, debt: Debt) => sum + debt.totalAmount,
        0
      ),
      totalPaid: debts.reduce(
        (sum: number, debt: Debt) => sum + debt.paidAmount,
        0
      ),
      activeDebts: debts.filter((debt: Debt) => debt.status === "ACTIVE")
        .length,
      paidDebts: debts.filter((debt: Debt) => debt.status === "PAID").length,
      remainingDebt: 0,
    };

    stats.remainingDebt = stats.totalDebt - stats.totalPaid;

    return NextResponse.json(stats);
  } catch (error) {
    console.error("Error fetching debt stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch debt stats" },
      { status: 500 }
    );
  }
}
