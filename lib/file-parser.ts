import type { Transaction } from "@/types/finance"
import { PdfParser } from "@/lib/pdf-parser"
import { apiService } from "@/lib/api-service"

export class FileParser {
  public static async parseFile(
    file: File,
    accountId: string,
  ): Promise<{
    transactions: Transaction[]
    error?: string
  }> {
    try {
      const fileExtension = file.name.split(".").pop()?.toLowerCase()

      // Validate file type
      if (!fileExtension || !["csv", "xlsx", "xls", "pdf"].includes(fileExtension)) {
        return {
          transactions: [],
          error: "Unsupported file format. Please upload a CSV, Excel, or PDF file.",
        }
      }

      // Validate account
      const account = apiService.getAccount(accountId)
      if (!account) {
        return {
          transactions: [],
          error: "Invalid account selected. Please choose a valid account.",
        }
      }

      // Parse based on file type
      if (fileExtension === "pdf") {
        const transactions = await PdfParser.parseTransactions(file, accountId)

        // Add account name to each transaction
        return {
          transactions: transactions.map((transaction) => ({
            ...transaction,
            account: account.name,
          })),
        }
      } else if (["csv", "xlsx", "xls"].includes(fileExtension)) {
        // For this mock implementation, we'll simulate CSV/Excel parsing
        // In a real app, you would use libraries like papaparse for CSV or xlsx for Excel

        // Simulate processing delay
        await new Promise((resolve) => setTimeout(resolve, 1500))

        // Mock transactions from CSV/Excel
        const mockTransactions: Transaction[] = [
          {
            date: "2023-07-20",
            description: "SALARY DEPOSIT",
            category: "Income",
            amount: 3000.0,
            accountId,
          },
          {
            date: "2023-07-18",
            description: "RENT PAYMENT",
            category: "Housing",
            amount: -1200.0,
            accountId,
          },
          {
            date: "2023-07-16",
            description: "ELECTRIC BILL",
            category: "Utilities",
            amount: -85.75,
            accountId,
          },
          {
            date: "2023-07-15",
            description: "GROCERY STORE",
            category: "Food",
            amount: -120.5,
            accountId,
          },
          {
            date: "2023-07-10",
            description: "GAS STATION",
            category: "Transportation",
            amount: -45.0,
            accountId,
          },
          {
            date: "2023-07-05",
            description: "INTERNET BILL",
            category: "Utilities",
            amount: -65.99,
            accountId,
          },
        ]

        // Add account name to each transaction
        return {
          transactions: mockTransactions.map((transaction) => ({
            ...transaction,
            account: account.name,
          })),
        }
      }

      return {
        transactions: [],
        error: "Unsupported file format. Please upload a CSV, Excel, or PDF file.",
      }
    } catch (error) {
      console.error("Error parsing file:", error)
      return {
        transactions: [],
        error: "An error occurred while parsing the file. Please try again.",
      }
    }
  }
}

