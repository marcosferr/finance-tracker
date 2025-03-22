"use server"

import { getAuthSession } from "@/auth"
import prisma from "@/lib/prisma"

export async function getDashboardData() {
  try {
    const session = await getAuthSession()

    if (!session?.user) {
      throw new Error("Unauthorized")
    }

    // Get current date
    const now = new Date()
    const currentYear = now.getFullYear()
    const currentMonth = now.getMonth()

    // Calculate start and end dates for current month
    const startOfMonth = new Date(currentYear, currentMonth, 1)
    const endOfMonth = new Date(currentYear, currentMonth + 1, 0)

    // Calculate start and end dates for previous month
    const startOfPrevMonth = new Date(currentYear, currentMonth - 1, 1)
    const endOfPrevMonth = new Date(currentYear, currentMonth, 0)

    // Get accounts
    const accounts = await prisma.financialAccount.findMany({
      where: {
        userId: session.user.id,
      },
      select: {
        id: true,
        name: true,
        type: true,
        balance: true,
        currency: true,
        color: true,
      },
    })

    // Calculate total balance
    const totalBalance = accounts.reduce((sum, account) => sum + account.balance, 0)

    // Get transactions for current month
    const currentMonthTransactions = await prisma.transaction.findMany({
      where: {
        userId: session.user.id,
        date: {
          gte: startOfMonth,
          lte: endOfMonth,
        },
      },
      include: {
        category: true,
      },
    })

    // Get transactions for previous month
    const prevMonthTransactions = await prisma.transaction.findMany({
      where: {
        userId: session.user.id,
        date: {
          gte: startOfPrevMonth,
          lte: endOfPrevMonth,
        },
      },
    })

    // Calculate income and expenses for current month
    const currentMonthIncome = currentMonthTransactions
      .filter((t) => t.amount > 0)
      .reduce((sum, t) => sum + t.amount, 0)

    const currentMonthExpenses = currentMonthTransactions
      .filter((t) => t.amount < 0)
      .reduce((sum, t) => sum + Math.abs(t.amount), 0)

    // Calculate income and expenses for previous month
    const prevMonthIncome = prevMonthTransactions.filter((t) => t.amount > 0).reduce((sum, t) => sum + t.amount, 0)

    const prevMonthExpenses = prevMonthTransactions
      .filter((t) => t.amount < 0)
      .reduce((sum, t) => sum + Math.abs(t.amount), 0)

    // Calculate month-over-month changes
    const incomeChange = prevMonthIncome > 0 ? ((currentMonthIncome - prevMonthIncome) / prevMonthIncome) * 100 : 0

    const expensesChange =
      prevMonthExpenses > 0 ? ((currentMonthExpenses - prevMonthExpenses) / prevMonthExpenses) * 100 : 0

    // Get expenses by category
    const expensesByCategory = currentMonthTransactions
      .filter((t) => t.amount < 0 && t.category)
      .reduce(
        (acc, t) => {
          const categoryId = t.category!.id
          const categoryName = t.category!.name
          const categoryColor = t.category!.color

          if (!acc[categoryId]) {
            acc[categoryId] = {
              id: categoryId,
              name: categoryName,
              color: categoryColor,
              amount: 0,
            }
          }

          acc[categoryId].amount += Math.abs(t.amount)
          return acc
        },
        {} as Record<string, { id: string; name: string; color: string; amount: number }>,
      )

    // Get recent transactions
    const recentTransactions = await prisma.transaction.findMany({
      where: {
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
      orderBy: {
        date: "desc",
      },
      take: 5,
    })

    // Get monthly budget data
    const categories = await prisma.category.findMany({
      where: {
        userId: session.user.id,
        budget: {
          not: null,
        },
      },
      select: {
        id: true,
        name: true,
        color: true,
        budget: true,
      },
    })

    const categoryIds = categories.map((c) => c.id)

    // Get expenses for each category this month
    const categoryExpenses = await prisma.transaction.groupBy({
      by: ["categoryId"],
      where: {
        userId: session.user.id,
        categoryId: {
          in: categoryIds,
        },
        date: {
          gte: startOfMonth,
          lte: endOfMonth,
        },
        amount: {
          lt: 0,
        },
      },
      _sum: {
        amount: true,
      },
    })

    // Map category expenses to budget data
    const budgetData = categories.map((category) => {
      const expense = categoryExpenses.find((e) => e.categoryId === category.id)
      const spent = expense ? Math.abs(expense._sum.amount || 0) : 0
      const budget = category.budget || 0

      return {
        category: category.name,
        spent,
        budget,
        color: category.color,
      }
    })

    // Get monthly overview data for chart
    const sixMonthsAgo = new Date()
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5)
    sixMonthsAgo.setDate(1)
    sixMonthsAgo.setHours(0, 0, 0, 0)

    const monthlyData = await prisma.$queryRaw`
      SELECT 
        DATE_TRUNC('month', date) as month,
        SUM(CASE WHEN amount > 0 THEN amount ELSE 0 END) as income,
        SUM(CASE WHEN amount < 0 THEN ABS(amount) ELSE 0 END) as expenses
      FROM "Transaction"
      WHERE 
        "userId" = ${session.user.id}
        AND date >= ${sixMonthsAgo}
      GROUP BY DATE_TRUNC('month', date)
      ORDER BY month ASC
    `

    return {
      accounts,
      totalBalance,
      currentMonthIncome,
      currentMonthExpenses,
      incomeChange,
      expensesChange,
      expensesByCategory: Object.values(expensesByCategory),
      recentTransactions,
      budgetData,
      monthlyData,
    }
  } catch (error) {
    console.error("Error fetching dashboard data:", error)
    throw new Error("Failed to fetch dashboard data")
  }
}

