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
 * Determines if a file is a PDF or an image
 */
export function getFileType(file: File): "pdf" | "image" | "unsupported" {
  const fileType = file.type.toLowerCase();

  if (fileType === "application/pdf") {
    return "pdf";
  }

  if (fileType.startsWith("image/")) {
    return "image";
  }

  // Check extension as fallback
  const extension = file.name.split(".").pop()?.toLowerCase();
  if (extension === "pdf") {
    return "pdf";
  }

  if (["jpg", "jpeg", "png", "gif", "webp", "bmp"].includes(extension || "")) {
    return "image";
  }

  return "unsupported";
}

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
 * Converts file to base64 for OpenAI API
 */
export async function fileToBase64(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  return Buffer.from(arrayBuffer).toString("base64");
}

/**
 * Get MIME type for file
 */
export function getMimeType(file: File): string {
  // If the browser provides a type, use it
  if (file.type) {
    return file.type;
  }

  // Fallback to extension mapping
  const extension = file.name.split(".").pop()?.toLowerCase();
  const extensionMap: Record<string, string> = {
    pdf: "application/pdf",
    png: "image/png",
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    gif: "image/gif",
    webp: "image/webp",
    bmp: "image/bmp",
  };

  return extensionMap[extension || ""] || "application/octet-stream";
}

/**
 * Extracts transactions from PDF or image files using OpenAI's vision capabilities
 */
export async function extractTransactionsFromPDF(
  file: File,
  categories: Category[],
  openaiApiKey: string
): Promise<ExtractedTransaction[]> {
  try {
    console.log(`[Document Parser] Starting processing for file: ${file.name}`);
    console.log(`[Document Parser] File size: ${file.size} bytes`);
    console.log(`[Document Parser] File type: ${file.type}`);

    // Check if file type is supported
    const fileType = getFileType(file);
    if (fileType === "unsupported") {
      throw new Error(
        "Unsupported file type. Please upload a PDF or image file (JPG, PNG, etc.)"
      );
    }

    // Initialize OpenAI client
    const openai = new OpenAI({
      // apiKey: openaiApiKey, // Use this if you want your user to use their own API key
      apiKey: process.env.OPENAI_API_KEY,
    });
    console.log("[Document Parser] OpenAI client initialized");

    // Convert File to base64
    console.log("[Document Parser] Converting file to base64...");
    const base64String = await fileToBase64(file);
    console.log(
      `[Document Parser] File converted to base64 (length: ${base64String.length} chars)`
    );

    // Get category names for the prompt
    const categoryNames = categories.map((c) => c.name).join(", ");
    console.log(`[Document Parser] Available categories: ${categoryNames}`);

    // Create the function schema for OpenAI
    const functionSchema = {
      name: "extract_transactions",
      description:
        "Extract transactions from financial statement. Take expenses as negative values and payments as positive.",
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

    let response;

    if (fileType === "pdf") {
      // For PDF files, use file data directly with GPT-4o
      console.log("[Document Parser] Processing PDF file with OpenAI...");

      // Get the mime type for the file
      const mimeType = getMimeType(file);

      response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content:
              "You are a specialized assistant that extracts transaction data from financial statements and formats it as structured data. You categorize transactions into predefined categories and ensure amounts are properly signed (negative for expenses, positive for income).",
          },
          {
            role: "user",
            content: [
              {
                type: "file",
                file: {
                  filename: file.name,
                  file_data: `data:${mimeType};base64,${base64String}`,
                },
              },
              {
                type: "text",
                text: `Extract all transactions from this financial document. Use only the following categories: ${categoryNames}.`,
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
    } else {
      // For image files, extract text first using vision model, then process with a text-based model
      console.log(
        "[Document Parser] Processing image file with OpenAI vision..."
      );

      // First, extract text from the image using vision model
      const visionResponse = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content:
              "You are an assistant that extracts raw text from financial statement images.",
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Extract all text from this financial statement image. Focus on transaction data including dates, descriptions, and amounts.",
              },
              {
                type: "image_url",
                image_url: {
                  url: `data:${file.type};base64,${base64String}`,
                },
              },
            ],
          },
        ],
        max_tokens: 4000,
      });

      const extractedText = visionResponse.choices[0].message.content;
      console.log(
        "[Document Parser] Text extracted from image, processing with LLM..."
      );

      // Now process the extracted text with a text-based model to get structured transactions
      response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content:
              "You are a specialized assistant that extracts transaction data from financial statements and formats it as structured data. You categorize transactions into predefined categories and ensure amounts are properly signed (negative for expenses, positive for income).",
          },
          {
            role: "user",
            content: `Extract transactions from this financial statement text:\n\n${extractedText}\n\nUse only the following categories: ${categoryNames}.`,
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
    }

    console.log("[Document Parser] Received response from OpenAI");
    console.log(
      "[Document Parser] Response status:",
      response.choices[0].finish_reason
    );
    console.log("[Document Parser] Model used:", response.model);

    // Parse the response
    const toolCall = response.choices[0].message.tool_calls?.[0];
    if (!toolCall || toolCall.function.name !== "extract_transactions") {
      console.error(
        "[Document Parser] Invalid tool call response:",
        JSON.stringify(response.choices[0].message)
      );
      throw new Error("Invalid response from OpenAI");
    }

    console.log("[Document Parser] Parsing tool call response...");
    const parsed = JSON.parse(toolCall.function.arguments);
    console.log(
      "[Document Parser] Raw transactions:",
      JSON.stringify(parsed, null, 2)
    );

    if (!parsed.transactions || !Array.isArray(parsed.transactions)) {
      console.error("[Document Parser] No transactions array in response");
      throw new Error("No transactions found in the document");
    }

    if (parsed.transactions.length === 0) {
      console.warn("[Document Parser] Empty transactions array returned");
      throw new Error("No transactions found in the document");
    }

    console.log(
      `[Document Parser] Found ${parsed.transactions.length} transactions`
    );
    const transactions = TransactionSchema.parse(parsed.transactions);
    console.log(
      "[Document Parser] Successfully validated transactions with schema"
    );

    return transactions;
  } catch (error: any) {
    console.error("[Document Parser] Error details:", {
      name: error.name,
      message: error.message,
      stack: error.stack,
      cause: error.cause,
    });

    if (error instanceof z.ZodError) {
      console.error(
        "[Document Parser] Schema validation errors:",
        JSON.stringify(error.errors, null, 2)
      );
    }

    throw new Error(
      `Failed to extract transactions from document: ${error.message}`
    );
  }
}
