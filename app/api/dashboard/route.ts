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
        take: 10,
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
        recurring: income * 0.7, // Example split
        oneTime: income * 0.3,
        sources: {
          "Primary Job": income * 0.8,
          "Side Hustle": income * 0.2,
        },
      },
      expenses: {
        total: expenses,
        recurring: expenses * 0.6, // Example split
        oneTime: expenses * 0.4,
        categories: expensesByCategory,
      },
      budget: {
        total: totalBudget,
        spent: spentBudget,
        remaining: totalBudget - spentBudget,
        categories: categories.reduce((acc, c) => {
          const spent = transactions
            .filter((t) => t.categoryId === c.id && t.amount < 0)
            .reduce((sum, t) => sum + Math.abs(t.amount), 0);
          acc[c.name] = {
            limit: c.budget || 0,
            spent,
          };
          return acc;
        }, {} as { [key: string]: { limit: number; spent: number } }),
      },
      savings: {
        total: accounts
          .filter((a) => a.type === "savings")
          .reduce((acc, a) => acc + a.balance, 0),
        rate: 0.2, // Example savings rate
        goals: {
          "Emergency Fund": {
            target: 10000,
            current: 5000,
          },
        },
      },
      paymentMethods: accounts.reduce((acc, a) => {
        acc[a.id] = {
          type: a.type,
          balance: a.balance,
        };
        return acc;
      }, {} as { [key: string]: { type: string; balance: number } }),
      transactions: {
        recent: transactions,
        total: transactions.length,
        categorized: transactions.filter((t) => t.categoryId).length,
        uncategorized: transactions.filter((t) => !t.categoryId).length,
      },
      trends: {
        income: [5000, 5500, 4800, 6000, 5200], // Example data
        expenses: [3000, 3200, 2800, 3500, 3100],
        savings: [2000, 2300, 2000, 2500, 2100],
      },
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
