"use server"

import { getAuthSession } from "@/auth"
import prisma from "@/lib/prisma"
import OpenAI from "openai"

export async function chatWithAI(message: string) {
  try {
    const session = await getAuthSession()

    if (!session?.user) {
      throw new Error("Unauthorized")
    }

    // Get user settings to retrieve OpenAI API key
    const settings = await prisma.userSettings.findUnique({
      where: {
        userId: session.user.id,
      },
    })

    if (!settings?.openaiApiKey) {
      return {
        success: false,
        message: "OpenAI API key not found. Please add your API key in settings.",
      }
    }

    // Get financial data for context
    const now = new Date()
    const currentYear = now.getFullYear()
    const currentMonth = now.getMonth()

    // Calculate start and end dates for current month
    const startOfMonth = new Date(currentYear, currentMonth, 1)
    const endOfMonth = new Date(currentYear, currentMonth + 1, 0)

    // Get current month transactions
    const transactions = await prisma.transaction.findMany({
      where: {
        userId: session.user.id,
        date: {
          gte: startOfMonth,
          lte: endOfMonth,
        },
      },
      include: {
        category: true,
        account: true,
      },
    })

    // Calculate income and expenses
    const income = transactions.filter((t) => t.amount > 0).reduce((sum, t) => sum + t.amount, 0)

    const expenses = transactions.filter((t) => t.amount < 0).reduce((sum, t) => sum + Math.abs(t.amount), 0)

    // Get expenses by category
    const expensesByCategory = transactions
      .filter((t) => t.amount < 0 && t.category)
      .reduce(
        (acc, t) => {
          const categoryName = t.category!.name

          if (!acc[categoryName]) {
            acc[categoryName] = 0
          }

          acc[categoryName] += Math.abs(t.amount)
          return acc
        },
        {} as Record<string, number>,
      )

    // Create financial context
    const financialContext = {
      currentMonth: `${now.toLocaleString("default", { month: "long" })} ${currentYear}`,
      income,
      expenses,
      savings: income - expenses,
      expensesByCategory,
      topExpenseCategories: Object.entries(expensesByCategory)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([category, amount]) => ({ category, amount })),
    }

    // Initialize OpenAI client
    const openai = new OpenAI({
      apiKey: settings.openaiApiKey,
    })

    // Call OpenAI API
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: `You are a helpful financial assistant. You help users understand their financial data and provide insights and advice.
          
          Here is the user's financial data for ${financialContext.currentMonth}:
          - Total Income: $${financialContext.income.toFixed(2)}
          - Total Expenses: $${financialContext.expenses.toFixed(2)}
          - Savings: $${financialContext.savings.toFixed(2)}
          - Top expense categories: ${financialContext.topExpenseCategories.map((c) => `${c.category}: $${c.amount.toFixed(2)}`).join(", ")}
          
          Provide helpful, concise responses about their finances. If they ask about specific data not provided here, let them know you only have access to their current month's summary data.`,
        },
        {
          role: "user",
          content: message,
        },
      ],
      temperature: 0.7,
      max_tokens: 500,
    })

    return {
      success: true,
      message: response.choices[0].message.content,
    }
  } catch (error) {
    console.error("Error in AI chat:", error)
    return {
      success: false,
      message: "An error occurred while processing your request. Please try again later.",
    }
  }
}

