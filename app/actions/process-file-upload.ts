"use server"

import { revalidatePath } from "next/cache"
import { getAuthSession } from "@/auth"
import prisma from "@/lib/prisma"
import { parseCSV, parseExcel, parsePDF } from "@/lib/file-parsers"

export async function processFileUpload(
  formData: FormData,
): Promise<{ success: boolean; error?: string; fileUploadId?: string }> {
  try {
    const session = await getAuthSession()

    if (!session?.user) {
      return { success: false, error: "Unauthorized" }
    }

    const file = formData.get("file") as File
    const accountId = formData.get("accountId") as string
    const columnMappings = JSON.parse(formData.get("columnMappings") as string)

    if (!file || !accountId) {
      return { success: false, error: "Missing file or account ID" }
    }

    // Check if account exists and belongs to user
    const account = await prisma.financialAccount.findUnique({
      where: {
        id: accountId,
        userId: session.user.id,
      },
    })

    if (!account) {
      return { success: false, error: "Account not found" }
    }

    // Create file upload record
    const fileUpload = await prisma.fileUpload.create({
      data: {
        filename: file.name,
        fileType: file.name.split(".").pop()?.toLowerCase() || "unknown",
        accountId,
        userId: session.user.id,
        status: "processing",
      },
    })

    // Parse file based on type
    const fileType = file.name.split(".").pop()?.toLowerCase()
    let transactions = []

    try {
      if (fileType === "csv") {
        transactions = await parseCSV(file, columnMappings)
      } else if (fileType === "xlsx" || fileType === "xls") {
        transactions = await parseExcel(file, columnMappings)
      } else if (fileType === "pdf") {
        transactions = await parsePDF(file)
      } else {
        throw new Error("Unsupported file type")
      }
    } catch (error) {
      // Update file upload status to error
      await prisma.fileUpload.update({
        where: {
          id: fileUpload.id,
        },
        data: {
          status: "error",
          errorMessage: error instanceof Error ? error.message : "Unknown error",
        },
      })

      return {
        success: false,
        error: "Error processing file",
        fileUploadId: fileUpload.id,
      }
    }

    // Create transactions in database
    if (transactions.length > 0) {
      // Map transactions to database format
      const transactionsToCreate = transactions.map((transaction) => ({
        date: new Date(transaction.date),
        description: transaction.description,
        amount: transaction.amount,
        categoryId: transaction.categoryId,
        accountId,
        userId: session.user.id,
      }))

      // Create transactions in batches to avoid timeout
      const batchSize = 100
      for (let i = 0; i < transactionsToCreate.length; i += batchSize) {
        const batch = transactionsToCreate.slice(i, i + batchSize)
        await prisma.transaction.createMany({
          data: batch,
        })
      }

      // Update account balance
      const totalAmount = transactions.reduce((sum, t) => sum + t.amount, 0)
      await prisma.financialAccount.update({
        where: {
          id: accountId,
        },
        data: {
          balance: {
            increment: totalAmount,
          },
        },
      })

      // Update file upload status
      await prisma.fileUpload.update({
        where: {
          id: fileUpload.id,
        },
        data: {
          status: "completed",
          transactionCount: transactions.length,
        },
      })
    } else {
      // No transactions found
      await prisma.fileUpload.update({
        where: {
          id: fileUpload.id,
        },
        data: {
          status: "completed",
          transactionCount: 0,
        },
      })
    }

    revalidatePath("/transactions")
    revalidatePath("/dashboard")

    return {
      success: true,
      fileUploadId: fileUpload.id,
    }
  } catch (error) {
    console.error("Error processing file upload:", error)
    return { success: false, error: "Something went wrong" }
  }
}

