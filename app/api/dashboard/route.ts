import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { FinancialData, Transaction } from "@/types/finance";
import { revalidatePath } from "next/cache";
import { getAuthSession } from "@/auth";

export async function GET(request: Request) {
  try {
    // Get the authenticated user's session
    const session = await getAuthSession();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // User ID is obtained directly from the session
    const userId = session.user.id;

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
        where: { userId: session.user.id },
        include: {
          category: true,
          account: true,
        },
        orderBy: { date: "desc" },
      }),
      prisma.category.findMany({
        where: { userId: session.user.id },
      }),
      prisma.financialAccount.findMany({
        where: { userId: session.user.id },
      }),
      prisma.userSettings.findUnique({
        where: { userId: session.user.id },
      }),
      prisma.debt.findMany({
        where: { userId: session.user.id },
      }),
      prisma.financialAsset.findMany({
        where: { userId: session.user.id },
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
      savings: number;
    }

    const monthlyData = await prisma.$queryRaw<MonthlyDataRow[]>`
      WITH monthly_transactions AS (
        SELECT
          DATE_TRUNC('month', date) as month,
          SUM(CASE WHEN amount > 0 THEN amount ELSE 0 END) as income,
          SUM(CASE WHEN amount < 0 THEN ABS(amount) ELSE 0 END) as expenses
        FROM "Transaction"
        WHERE
          "userId" = ${session.user.id}
          AND date >= ${twelveMonthsAgo}
        GROUP BY DATE_TRUNC('month', date)
      ),
      monthly_savings AS (
        SELECT
          DATE_TRUNC('month', "createdAt") as month,
          SUM(balance) as savings
        FROM "FinancialAccount"
        WHERE
          "userId" = ${session.user.id}
          AND type = 'SAVINGS'
          AND "createdAt" >= ${twelveMonthsAgo}
        GROUP BY DATE_TRUNC('month', "createdAt")
      )
      SELECT
        mt.month,
        mt.income,
        mt.expenses,
        COALESCE(ms.savings, 0) as savings
      FROM monthly_transactions mt
      LEFT JOIN monthly_savings ms ON mt.month = ms.month
      ORDER BY mt.month ASC
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

    // Calculate total savings from savings accounts
    const savingsTotal = accounts
      .filter((account) => account.type === "SAVINGS")
      .reduce((acc, account) => acc + account.balance, 0);

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
      currency: userSettings?.currency || "USD",
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
        total: savingsTotal,
        rate: income > 0 ? (savingsTotal / income) * 100 : 0,
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
        savings: Number(row.savings),
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

// Add cache invalidation for related mutations
export async function POST(request: Request) {
  try {
    // Get the authenticated user's session
    const session = await getAuthSession();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Your POST logic here

    // Invalidate dashboard cache for this specific user
    revalidatePath(`/api/dashboard`);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in dashboard POST:", error);
    return NextResponse.json(
      { error: "Failed to process dashboard request" },
      { status: 500 }
    );
  }
}
