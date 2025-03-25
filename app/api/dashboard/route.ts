import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { FinancialData, Transaction } from "@/types/finance";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    // Get all necessary data in parallel
    const [
      dbTransactions,
      categories,
      accounts,
      userSettings,
      debts,
      financialAssets,
    ] = await Promise.all([
      prisma.transaction.findMany({
        where: { userId },
        include: {
          category: true,
          account: true,
        },
        orderBy: { date: "desc" },
      }),
      prisma.category.findMany({
        where: { userId },
      }),
      prisma.financialAccount.findMany({
        where: { userId },
      }),
      prisma.userSettings.findUnique({
        where: { userId },
      }),
      prisma.debt.findMany({
        where: { userId },
      }),
      prisma.financialAsset.findMany({
        where: { userId },
      }),
    ]);

    // Get monthly data for the last 12 months
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 11);
    twelveMonthsAgo.setDate(1);
    twelveMonthsAgo.setHours(0, 0, 0, 0);

    interface MonthlyDataRow {
      month: Date;
      income: number;
      expenses: number;
    }

    const monthlyData = await prisma.$queryRaw<MonthlyDataRow[]>`
      SELECT 
        DATE_TRUNC('month', date) as month,
        SUM(CASE WHEN amount > 0 THEN amount ELSE 0 END) as income,
        SUM(CASE WHEN amount < 0 THEN ABS(amount) ELSE 0 END) as expenses
      FROM "Transaction"
      WHERE 
        "userId" = ${userId}
        AND date >= ${twelveMonthsAgo}
      GROUP BY DATE_TRUNC('month', date)
      ORDER BY month ASC
    `;

    // Map database transactions to the expected type
    const transactions: Transaction[] = dbTransactions.map((t) => ({
      id: t.id,
      date: t.date,
      description: t.description,
      amount: t.amount,
      categoryId: t.categoryId || undefined,
      accountId: t.accountId,
      category: t.category
        ? {
            id: t.category.id,
            name: t.category.name,
            color: t.category.color,
          }
        : undefined,
      account: {
        id: t.account.id,
        name: t.account.name,
        color: t.account.color,
      },
    }));

    // Calculate income and expenses
    const income = transactions
      .filter((t) => t.amount > 0)
      .reduce((acc, t) => acc + t.amount, 0);
    const expenses = transactions
      .filter((t) => t.amount < 0)
      .reduce((acc, t) => acc + Math.abs(t.amount), 0);

    // Calculate expenses by category
    const expensesByCategory = transactions
      .filter((t) => t.amount < 0)
      .reduce((acc, t) => {
        const category = t.category?.name || "Uncategorized";
        acc[category] = (acc[category] || 0) + Math.abs(t.amount);
        return acc;
      }, {} as { [key: string]: number });

    // Calculate budget information
    const totalBudget = categories.reduce((acc, c) => acc + (c.budget || 0), 0);
    const spentBudget = Math.abs(expenses);
    const budgetPercentUsed =
      totalBudget > 0 ? (spentBudget / totalBudget) * 100 : 0;

    // Prepare the response data
    const financialData: FinancialData = {
      income: {
        total: income,
        recurring: 0,
        oneTime: income,
        sources: {},
      },
      expenses: {
        total: expenses,
        recurring: 0,
        oneTime: expenses,
        categories: expensesByCategory,
      },
      budget: {
        total: totalBudget,
        spent: spentBudget,
        remaining: totalBudget - spentBudget,
        categories: {},
      },
      savings: {
        total: income - expenses,
        rate: 0,
        goals: {},
      },
      paymentMethods: {},
      transactions: {
        recent: transactions.slice(0, 10),
        total: transactions.length,
        categorized: transactions.filter((t) => t.category).length,
        uncategorized: transactions.filter((t) => !t.category).length,
      },
      trends: {
        income: [],
        expenses: [],
        savings: [],
      },
      monthlyData: monthlyData.map((row: any) => ({
        month: new Date(row.month).toLocaleString("default", {
          month: "short",
        }),
        income: Number(row.income),
        expenses: Number(row.expenses),
      })),
    };

    return NextResponse.json(financialData);
  } catch (error) {
    console.error("Error fetching dashboard data:", error);
    return NextResponse.json(
      { error: "Failed to fetch dashboard data" },
      { status: 500 }
    );
  }
}
