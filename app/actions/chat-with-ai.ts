"use server";

import { getAuthSession } from "@/auth";
import prisma from "@/lib/prisma";
import OpenAI from "openai";
import type { ChatCompletionMessageParam } from "openai/resources/chat/completions";
import {
  getUserDebts,
  getUserFinancialAssets,
  getUserAccounts,
  getUserCategories,
  getUserTransactions,
  generateCustomReport,
} from "@/app/lib/financial-data";

const functions = [
  {
    name: "get_user_debts",
    description: "Get all debts for the user",
    parameters: {
      type: "object",
      properties: {},
      required: [],
    },
  },
  {
    name: "get_user_financial_assets",
    description: "Get all financial assets for the user",
    parameters: {
      type: "object",
      properties: {},
      required: [],
    },
  },
  {
    name: "get_user_accounts",
    description:
      "Get all financial accounts and their current month transactions",
    parameters: {
      type: "object",
      properties: {},
      required: [],
    },
  },
  {
    name: "get_user_categories",
    description: "Get all categories and their current month transactions",
    parameters: {
      type: "object",
      properties: {},
      required: [],
    },
  },
  {
    name: "get_user_transactions",
    description: "Get transactions for a specific date range",
    parameters: {
      type: "object",
      properties: {
        startDate: {
          type: "string",
          description: "Start date in ISO format",
        },
        endDate: {
          type: "string",
          description: "End date in ISO format",
        },
      },
      required: ["startDate", "endDate"],
    },
  },
  {
    name: "generate_custom_report",
    description: "Generate a custom SQL report based on the user's question",
    parameters: {
      type: "object",
      properties: {
        queryDescription: {
          type: "string",
          description: "Description of the data needed for the report",
        },
      },
      required: ["queryDescription"],
    },
  },
];

type ChatMessage = {
  role: "system" | "user" | "assistant" | "function";
  content: string;
  name?: string;
};

export async function chatWithAI(
  message: string,
  chatContext: ChatMessage[] = []
) {
  try {
    const session = await getAuthSession();

    if (!session?.user?.id) {
      throw new Error("Unauthorized");
    }

    // Get user settings to retrieve OpenAI API key
    const settings = await prisma.userSettings.findUnique({
      where: {
        userId: session.user.id,
      },
    });

    // Initialize OpenAI client
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    // Convert our chat messages to OpenAI format
    const messages = [
      {
        role: "system" as const,
        content: `You are a helpful financial assistant. You provide users with insights and advice on savings, investments, and debt reduction.
    You have access to various functions to retrieve financial data and should use them before providing answers.
    Always respond in the same language as the user's query.
    Today's date is ${new Date().toISOString().split("T")[0]}.
    Provide specific, data-driven insights based on the retrieved information, and ensure your advice is actionable and clear.`,
      },
      ...chatContext.map((msg) => {
        if (msg.role === "function" && msg.name) {
          return {
            role: "function" as const,
            name: msg.name,
            content: msg.content,
          };
        }
        return {
          role: msg.role,
          content: msg.content,
        };
      }),
      {
        role: "user" as const,
        content: message,
      },
    ] as ChatCompletionMessageParam[];

    let shouldContinue = true;
    let finalResponse = null;

    while (shouldContinue) {
      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages,
        functions,
        function_call: "auto",
        temperature: 0.7,
        max_tokens: 500,
      });

      const message = response.choices[0].message;
      if (message.content) {
        messages.push({
          role: "assistant" as const,
          content: message.content,
        });
      }

      if (message.function_call) {
        const functionName = message.function_call.name;
        const functionArgs = JSON.parse(message.function_call.arguments);

        let functionResponse;
        switch (functionName) {
          case "get_user_debts":
            functionResponse = await getUserDebts(session.user.id);
            break;
          case "get_user_financial_assets":
            functionResponse = await getUserFinancialAssets(session.user.id);
            break;
          case "get_user_accounts":
            functionResponse = await getUserAccounts(session.user.id);
            break;
          case "get_user_categories":
            functionResponse = await getUserCategories(session.user.id);
            break;
          case "get_user_transactions":
            functionResponse = await getUserTransactions(
              session.user.id,
              new Date(functionArgs.startDate),
              new Date(functionArgs.endDate)
            );
            break;
          case "generate_custom_report":
            functionResponse = await generateCustomReport(
              session.user.id,
              functionArgs.queryDescription
            );
            break;
          default:
            throw new Error(`Unknown function: ${functionName}`);
        }

        messages.push({
          role: "function" as const,
          name: functionName,
          content: JSON.stringify(functionResponse),
        });
      } else {
        finalResponse = message.content;
        shouldContinue = false;
      }
    }

    return {
      success: true,
      message: finalResponse,
    };
  } catch (error) {
    console.error("Error in AI chat:", error);
    return {
      success: false,
      message:
        "An error occurred while processing your request. Please try again later.",
    };
  }
}
