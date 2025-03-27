import prisma from "@/lib/prisma";
import OpenAI from "openai";
import { Prisma } from "@prisma/client";

// Define the schema object
const schema = {
  tables: [
    {
      name: "Transaction",
      columns: [
        "id",
        "date",
        "description",
        "amount",
        "categoryId",
        "accountId",
        "userId",
      ],
    },
    {
      name: "Category",
      columns: ["id", "name", "color", "budget", "userId"],
    },
    {
      name: "FinancialAccount",
      columns: ["id", "name", "type", "balance", "currency", "color", "userId"],
    },
    {
      name: "Debt",
      columns: [
        "id",
        "name",
        "totalAmount",
        "paidAmount",
        "interestRate",
        "dueDate",
        "status",
        "userId",
      ],
    },
    {
      name: "FinancialAsset",
      columns: [
        "id",
        "name",
        "type",
        "amount",
        "interestRate",
        "startDate",
        "maturityDate",
        "status",
        "userId",
      ],
    },
  ],
  relationships: [
    {
      from: "Transaction",
      to: "Category",
      type: "LEFT JOIN",
      on: "Transaction.categoryId = Category.id",
    },
    {
      from: "Transaction",
      to: "FinancialAccount",
      type: "LEFT JOIN",
      on: "Transaction.accountId = FinancialAccount.id",
    },
    {
      from: "Transaction",
      to: "User",
      type: "INNER JOIN",
      on: "Transaction.userId = User.id",
    },
    {
      from: "Category",
      to: "User",
      type: "INNER JOIN",
      on: "Category.userId = User.id",
    },
    {
      from: "FinancialAccount",
      to: "User",
      type: "INNER JOIN",
      on: "FinancialAccount.userId = User.id",
    },
    {
      from: "Debt",
      to: "User",
      type: "INNER JOIN",
      on: "Debt.userId = User.id",
    },
    {
      from: "FinancialAsset",
      to: "User",
      type: "INNER JOIN",
      on: "FinancialAsset.userId = User.id",
    },
  ],
};

export async function getUserDebts(userId: string) {
  return await prisma.debt.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });
}

export async function getUserFinancialAssets(userId: string) {
  return await prisma.financialAsset.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });
}

export async function getUserAccounts(userId: string) {
  return await prisma.financialAccount.findMany({
    where: { userId },
    include: {
      transactions: {
        where: {
          date: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
            lte: new Date(
              new Date().getFullYear(),
              new Date().getMonth() + 1,
              0
            ),
          },
        },
      },
    },
  });
}

export async function getUserCategories(userId: string) {
  return await prisma.category.findMany({
    where: { userId },
    include: {
      transactions: {
        where: {
          date: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
            lte: new Date(
              new Date().getFullYear(),
              new Date().getMonth() + 1,
              0
            ),
          },
        },
      },
    },
  });
}

export async function getUserTransactions(
  userId: string,
  startDate: Date,
  endDate: Date
) {
  return await prisma.transaction.findMany({
    where: {
      userId,
      date: {
        gte: startDate,
        lte: endDate,
      },
    },
    include: {
      category: true,
      account: true,
    },
    orderBy: {
      date: "desc",
    },
  });
}

export async function generateCustomReport(
  userId: string,
  queryDescription: string
) {
  // Initialize OpenAI client
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  // Create a system message that explains the schema and task
  const systemMessage = `You are a SQL query generator for a financial tracking application.
  Your task is to generate a PostgreSQL query based on the user's question.
  
  Available tables and their columns:
  ${JSON.stringify(schema.tables, null, 2)}
  
  Table relationships:
  ${JSON.stringify(schema.relationships, null, 2)}
  
  The user id is ${userId}
  Important rules:
  1. Always include the userId filter in the WHERE clause
  2. Use proper table aliases
  3. Format dates appropriately
  4. Include relevant joins based on the relationships
  5. Return only the SQL query without any explanation
  6. Use proper PostgreSQL syntax
  7. Include appropriate aggregations if needed
  8. Order results logically`;

  console.log("Generating custom report for user");

  // Get the SQL query from OpenAI
  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: systemMessage,
      },
      {
        role: "user",
        content: queryDescription,
      },
    ],
    temperature: 0.1, // Low temperature for consistent SQL generation
    max_tokens: 500,
  });

  const generatedQuery = completion.choices[0].message.content;

  console.log("Generated query", generatedQuery);
  if (!generatedQuery) {
    throw new Error("Failed to generate SQL query");
  }

  // Execute the generated query
  const query = await prisma.$queryRaw`${Prisma.raw(generatedQuery)}`;

  return {
    query: generatedQuery,
    data: query,
    schema,
  };
}
