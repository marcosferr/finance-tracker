"use server";

import { revalidatePath } from "next/cache";
import { getAuthSession } from "@/auth";
import prisma from "@/lib/prisma";
import {
  extractTransactionsFromPDF,
  type ExtractedTransaction,
} from "@/lib/pdf-parser";
import { User } from "@prisma/client";

interface ProcessedTransaction extends ExtractedTransaction {
  categoryId?: string;
  accountId: string;
}

export async function processPDFUpload(formData: FormData): Promise<{
  success: boolean;
  error?: string;
  fileUploadId?: string;
  processedTransactions?: ProcessedTransaction[];
}> {
  try {
    const session = await getAuthSession();

    if (!session?.user) {
      return { success: false, error: "Unauthorized" };
    }

    const user = session.user as User;

    const file = formData.get("file") as File;
    const accountId = formData.get("accountId") as string;

    if (!file || !accountId) {
      return { success: false, error: "Missing file or account ID" };
    }

    // Validate file type
    const fileType = file.name.split(".").pop()?.toLowerCase();
    if (fileType !== "pdf") {
      return { success: false, error: "Only PDF files are supported" };
    }

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

    // Create file upload record
    const fileUpload = await prisma.fileUpload.create({
      data: {
        filename: file.name,
        fileType: "pdf",
        accountId,
        userId: user.id,
        status: "processing",
      },
    });

    // Get user settings for OpenAI API key
    const settings = await prisma.userSettings.findUnique({
      where: {
        userId: user.id,
      },
    });

    console.log("Debug - User ID:", user.id);
    console.log("Debug - Settings found:", !!settings);
    console.log("Debug - Settings:", JSON.stringify(settings, null, 2));

    // if (!settings?.openaiApiKey) { Uncomment this if you want to use the user's own API key
    //   console.log("Debug - OpenAI API key not found in settings");
    //   await prisma.fileUpload.update({
    //     where: {
    //       id: fileUpload.id,
    //     },
    //     data: {
    //       status: "error",
    //       errorMessage:
    //         "OpenAI API key not found. Please add your API key in settings.",
    //     },
    //   });

    //   return {
    //     success: false,
    //     error: "OpenAI API key not found. Please add your API key in settings.",
    //     fileUploadId: fileUpload.id,
    //   };
    // }

    // Get categories for the user
    const categories = await prisma.category.findMany({
      where: {
        userId: user.id,
      },
    });

    // Extract transactions from PDF
    let extractedTransactions: ExtractedTransaction[] = [];
    try {
      extractedTransactions = await extractTransactionsFromPDF(
        file,
        categories,
        ""
        // settings.openaiApiKey // Uncomment this if you want to use the user's own API key
      );
    } catch (error) {
      // Update file upload status to error
      await prisma.fileUpload.update({
        where: {
          id: fileUpload.id,
        },
        data: {
          status: "error",
          errorMessage:
            error instanceof Error ? error.message : "Unknown error",
        },
      });

      return {
        success: false,
        error: "Error processing PDF file",
        fileUploadId: fileUpload.id,
      };
    }

    // Map categories to their IDs and prepare transactions for review
    const processedTransactions: ProcessedTransaction[] =
      extractedTransactions.map((transaction) => {
        // Find matching category
        const matchingCategory = categories.find(
          (cat) => cat.name.toLowerCase() === transaction.category.toLowerCase()
        );

        return {
          ...transaction,
          categoryId: matchingCategory?.id,
          accountId,
        };
      });

    // Update file upload status
    await prisma.fileUpload.update({
      where: {
        id: fileUpload.id,
      },
      data: {
        status: "completed",
        transactionCount: processedTransactions.length,
      },
    });

    revalidatePath("/upload");

    return {
      success: true,
      fileUploadId: fileUpload.id,
      processedTransactions,
    };
  } catch (error) {
    console.error("Error processing PDF upload:", error);
    return { success: false, error: "Something went wrong" };
  }
}
