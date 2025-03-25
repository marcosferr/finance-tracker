import type { ChatResponse } from "@/types/finance";
import { apiService } from "@/lib/api-service";
import { generateChatResponse } from "@/lib/response-templates";
import { chatWithAI } from "@/app/actions/chat-with-ai";

export class OpenAIService {
  public async processChatQuery(query: string): Promise<ChatResponse> {
    try {
      const response = await chatWithAI(query);

      if (!response.success) {
        return {
          content:
            response.message ||
            "An error occurred while processing your request.",
          category: "API Error",
        };
      }

      // Determine the category based on the query
      const category = this.determineCategoryFromQuery(query);

      return {
        content: response.message || "",
        category,
      };
    } catch (error) {
      console.error("Error processing chat:", error);
      return this.processMockQuery(query);
    }
  }

  private processMockQuery(query: string): ChatResponse {
    // Use the mock response generator
    const response = generateChatResponse(query, apiService.getFinancialData());
    return {
      content:
        typeof response.content === "string"
          ? response.content
          : "Sorry, I couldn't process your request.",
      category: response.category,
    };
  }

  private determineCategoryFromQuery(query: string): string {
    const queryLower = query.toLowerCase();

    if (queryLower.includes("spend") || queryLower.includes("expense")) {
      return "Spending Analysis";
    } else if (queryLower.includes("budget")) {
      return "Budget";
    } else if (queryLower.includes("income") || queryLower.includes("earn")) {
      return "Income";
    } else if (queryLower.includes("save") || queryLower.includes("saving")) {
      return "Savings";
    } else if (queryLower.includes("trend") || queryLower.includes("compare")) {
      return "Trends";
    } else if (queryLower.includes("card") || queryLower.includes("payment")) {
      return "Payment Methods";
    } else if (
      queryLower.includes("advice") ||
      queryLower.includes("suggest")
    ) {
      return "Financial Advice";
    } else {
      return "General";
    }
  }
}

// Create a singleton instance
export const openaiService = new OpenAIService();
