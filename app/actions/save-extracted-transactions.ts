"use server";

import { revalidatePath } from "next/cache";
import { getAuthSession } from "@/auth";
import prisma from "@/lib/prisma";
import type { ExtractedTransaction } from "@/lib/pdf-parser";
import { User } from "@prisma/client";

export async function saveExtractedTransactions(
  transactions: ExtractedTransaction[],
  accountId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await getAuthSession();

    if (!session?.user) {
      return { success: false, error: "Unauthorized" };
    }

    const user = session.user as User;

    // Check if account exists and belongs to user
    const account = await prisma.financialAccount.findUnique({
      where: {
        id: accountId,
        userId: user.id,
      },
    });

    if (!account) {
      return { success: false, error: "Account not found" };
    }

    // Get categories for the user
    const categories = await prisma.category.findMany({
      where: {
        userId: user.id,
      },
    });

    // Create a map of category names to IDs
    const categoryMap = new Map(
      categories.map((c) => [c.name.toLowerCase(), c.id])
    );

    // Process transactions
    const transactionsToCreate = [];
    let totalAmount = 0;

    for (const transaction of transactions) {
      // Parse date (already in YYYY-MM-DD format)
      const date = new Date(transaction.date);

      // Find or create category
      const categoryLower = transaction.category.toLowerCase();
      let categoryId: string | undefined = categoryMap.get(categoryLower);

      if (!categoryId) {
        // Create new category if it doesn't exist
        const newCategory = await prisma.category.create({
          data: {
            name: transaction.category,
            color: `#${Math.floor(Math.random() * 16777215).toString(16)}`, // Random color
            userId: user.id,
          },
        });
        categoryId = newCategory.id;
        categoryMap.set(categoryLower, categoryId);
      }

      // Add transaction to batch
      transactionsToCreate.push({
        date,
        description: transaction.description,
        amount: transaction.amount,
        categoryId,
        accountId,
        userId: user.id,
      });

      totalAmount += transaction.amount;
    }

    // Create all transactions in a batch
    await prisma.transaction.createMany({
      data: transactionsToCreate,
    });

    // Update account balance
    await prisma.financialAccount.update({
      where: { id: accountId },
      data: {
        balance: {
          increment: totalAmount,
        },
      },
    });

    // Revalidate relevant paths
    revalidatePath("/transactions");
    revalidatePath("/dashboard");
    revalidatePath("/accounts");

    return { success: true };
  } catch (error: any) {
    console.error("Error saving extracted transactions:", error);
    return { success: false, error: error.message || "Something went wrong" };
  }
}
