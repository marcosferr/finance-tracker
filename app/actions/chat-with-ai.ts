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

export async function chatWithAI(message: string) {
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

    // Initial system message
    const messages: ChatCompletionMessageParam[] = [
      {
        role: "system",
        content: `You are a helpful financial assistant. You help users understand their financial data and provide insights and advice.
        You have access to various functions to retrieve financial information. Use these functions to gather relevant data before providing answers.
        Always provide specific, data-driven insights based on the retrieved information.`,
      },
      {
        role: "user",
        content: message,
      },
    ];

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
      messages.push(message);

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
          role: "function",
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
