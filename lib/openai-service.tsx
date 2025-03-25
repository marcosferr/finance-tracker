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
          content: (
            <div>
              <p>I encountered an error while processing your request.</p>
              <p className="mt-2">{response.message}</p>
              <hr className="my-2" />
              {this.processMockQuery(query).content}
            </div>
          ),
          category: "API Error",
        };
      }

      // Determine the category based on the query
      const category = this.determineCategoryFromQuery(query);

      return {
        content: <div>{response.message}</div>,
        category,
      };
    } catch (error) {
      console.error("Error processing chat:", error);
      return this.processMockQuery(query);
    }
  }

  private processMockQuery(query: string): ChatResponse {
    // Use the mock response generator
    return generateChatResponse(query, apiService.getFinancialData());
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
