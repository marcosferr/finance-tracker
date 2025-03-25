import * as pdfjs from "pdfjs-dist";
import OpenAI from "openai";
import { z } from "zod";
import type { Category } from "@prisma/client";

// Load the PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

// Define the transaction schema with Zod
export const TransactionSchema = z.array(
  z.object({
    date: z.string().describe("Transaction date in YYYY-MM-DD format"),
    description: z.string().describe("Merchant or transaction description"),
    category: z
      .string()
      .describe("Category name that best matches the transaction"),
    amount: z
      .number()
      .describe(
        "Transaction amount (positive for income, negative for expenses)"
      ),
  })
);

export type ExtractedTransaction = z.infer<typeof TransactionSchema>[0];

/**
 * Extracts text content from a PDF file
 */
export async function extractTextFromPDF(file: File): Promise<string> {
  try {
    // Convert the file to an ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();

    // Load the PDF document
    const pdf = await pdfjs.getDocument(new Uint8Array(arrayBuffer)).promise;

    // Get the total number of pages
    const numPages = pdf.numPages;

    // Extract text from each page
    let fullText = "";
    for (let i = 1; i <= numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items.map((item: any) => item.str).join(" ");

      fullText += pageText + "\n\n";
    }

    return fullText;
  } catch (error) {
    console.error("Error extracting text from PDF:", error);
    throw new Error("Failed to extract text from PDF");
  }
}

/**
 * Extracts transactions from PDF using OpenAI's PDF handling capabilities
 */
export async function extractTransactionsFromPDF(
  file: File,
  categories: Category[],
  openaiApiKey: string
): Promise<ExtractedTransaction[]> {
  try {
    console.log(`[PDF Parser] Starting PDF processing for file: ${file.name}`);
    console.log(`[PDF Parser] File size: ${file.size} bytes`);
    console.log(`[PDF Parser] File type: ${file.type}`);

    // Initialize OpenAI client
    const openai = new OpenAI({
      // apiKey: openaiApiKey, // Use this if you want your user to use their own API key
      apiKey: process.env.OPENAI_API_KEY,
    });
    console.log("[PDF Parser] OpenAI client initialized");

    // Convert File to base64
    console.log("[PDF Parser] Converting file to base64...");
    const arrayBuffer = await file.arrayBuffer();
    const base64String = Buffer.from(arrayBuffer).toString("base64");
    console.log(
      `[PDF Parser] File converted to base64 (length: ${base64String.length} chars)`
    );

    // Get category names for the prompt
    const categoryNames = categories.map((c) => c.name).join(", ");
    console.log(`[PDF Parser] Available categories: ${categoryNames}`);

    // Create the function schema for OpenAI
    const functionSchema = {
      name: "extract_transactions",
      description: "Extract transactions from credit card statement",
      parameters: {
        type: "object",
        properties: {
          transactions: {
            type: "array",
            items: {
              type: "object",
              properties: {
                date: {
                  type: "string",
                  description: "Transaction date in YYYY-MM-DD format",
                },
                description: {
                  type: "string",
                  description: "Merchant name or transaction description",
                },
                category: {
                  type: "string",
                  description:
                    "Category name that best matches the transaction",
                  enum: categories.map((c) => c.name),
                },
                amount: {
                  type: "number",
                  description:
                    "Transaction amount (negative for expenses, positive for income)",
                },
              },
              required: ["date", "description", "category", "amount"],
            },
          },
        },
        required: ["transactions"],
      },
    };

    console.log("[PDF Parser] Making API request to OpenAI...");
    // Call OpenAI API with function calling and PDF input
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "You are a specialized assistant that extracts transaction data from credit card statements and formats it as structured data. You categorize transactions into predefined categories and ensure amounts are properly signed (negative for expenses, positive for income).",
        },
        {
          role: "user",
          content: [
            {
              type: "file",
              file: {
                filename: file.name,
                file_data: `data:application/pdf;base64,${base64String}`,
              },
            },
            {
              type: "text",
              text: `Extract all transactions from this credit card statement PDF. Use only the following categories: ${categoryNames}.`,
            },
          ],
        },
      ],
      tools: [
        {
          type: "function",
          function: functionSchema,
        },
      ],
      tool_choice: {
        type: "function",
        function: { name: "extract_transactions" },
      },
    });

    console.log("[PDF Parser] Received response from OpenAI");
    console.log(
      "[PDF Parser] Response status:",
      response.choices[0].finish_reason
    );
    console.log("[PDF Parser] Model used:", response.model);

    // Parse the response
    const toolCall = response.choices[0].message.tool_calls?.[0];
    if (!toolCall || toolCall.function.name !== "extract_transactions") {
      console.error(
        "[PDF Parser] Invalid tool call response:",
        JSON.stringify(response.choices[0].message)
      );
      throw new Error("Invalid response from OpenAI");
    }

    console.log("[PDF Parser] Parsing tool call response...");
    const parsed = JSON.parse(toolCall.function.arguments);
    console.log(
      "[PDF Parser] Raw transactions:",
      JSON.stringify(parsed, null, 2)
    );

    if (!parsed.transactions || !Array.isArray(parsed.transactions)) {
      console.error("[PDF Parser] No transactions array in response");
      throw new Error("No transactions found in the PDF file");
    }

    if (parsed.transactions.length === 0) {
      console.warn("[PDF Parser] Empty transactions array returned");
      throw new Error("No transactions found in the PDF file");
    }

    console.log(
      `[PDF Parser] Found ${parsed.transactions.length} transactions`
    );
    const transactions = TransactionSchema.parse(parsed.transactions);
    console.log("[PDF Parser] Successfully validated transactions with schema");

    return transactions;
  } catch (error: any) {
    console.error("[PDF Parser] Error details:", {
      name: error.name,
      message: error.message,
      stack: error.stack,
      cause: error.cause,
    });

    if (error instanceof z.ZodError) {
      console.error(
        "[PDF Parser] Schema validation errors:",
        JSON.stringify(error.errors, null, 2)
      );
    }

    throw new Error(
      `Failed to extract transactions from PDF: ${error.message}`
    );
  }
}
