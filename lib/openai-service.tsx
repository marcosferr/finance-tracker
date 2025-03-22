import type { ChatResponse } from "@/types/finance"
import { apiService } from "@/lib/api-service"
import { generateChatResponse } from "@/lib/response-templates"

export class OpenAIService {
  private apiKey: string | null = null

  constructor() {
    const settings = apiService.getSettings()
    this.apiKey = settings.openaiApiKey || null
  }

  public async validateApiKey(key: string): Promise<boolean> {
    try {
      const response = await fetch("https://api.openai.com/v1/models", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${key}`,
          "Content-Type": "application/json",
        },
      })

      return response.ok
    } catch (error) {
      console.error("Error validating OpenAI API key:", error)
      return false
    }
  }

  public async processChatQuery(query: string): Promise<ChatResponse> {
    // Get the latest API key from settings
    const settings = apiService.getSettings()
    this.apiKey = settings.openaiApiKey || null

    // If no API key is available, use mock data
    if (!this.apiKey) {
      return this.processMockQuery(query)
    }

    try {
      // Prepare financial data context
      const financialData = apiService.getFinancialData()
      const financialContext = JSON.stringify({
        income: financialData.income,
        expenses: financialData.expenses,
        budget: financialData.budget,
        savings: financialData.savings,
        recentTransactions: financialData.transactions.recent.slice(0, 5),
      })

      // Call OpenAI API
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-3.5-turbo",
          messages: [
            {
              role: "system",
              content: `You are a financial assistant helping users understand their financial data. 
                        Provide concise, helpful responses about their finances.
                        Here is their current financial data: ${financialContext}`,
            },
            {
              role: "user",
              content: query,
            },
          ],
          temperature: 0.7,
          max_tokens: 500,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        console.error("OpenAI API error:", error)

        // If the API key is invalid, fall back to mock data
        if (response.status === 401) {
          return {
            content: (
              <div>
                <p>
                  I couldn't access the OpenAI service due to an authentication error. Your API key may be invalid or
                  expired.
                </p>
                <p className="mt-2">
                  Please check your API key in the settings. In the meantime, I'll provide a response based on your mock
                  data.
                </p>
                <hr className="my-2" />
                {this.processMockQuery(query).content}
              </div>
            ),
            category: "API Error",
          }
        }

        // For other errors, fall back to mock data
        return this.processMockQuery(query)
      }

      const data = await response.json()
      const aiResponse = data.choices[0].message.content

      // Determine the category based on the query
      const category = this.determineCategoryFromQuery(query)

      return {
        content: <div>{aiResponse}</div>,
        category,
      }
    } catch (error) {
      console.error("Error processing chat with OpenAI:", error)
      return this.processMockQuery(query)
    }
  }

  private processMockQuery(query: string): ChatResponse {
    // Use the mock response generator
    return generateChatResponse(query, apiService.getFinancialData())
  }

  private determineCategoryFromQuery(query: string): string {
    const queryLower = query.toLowerCase()

    if (queryLower.includes("spend") || queryLower.includes("expense")) {
      return "Spending Analysis"
    } else if (queryLower.includes("budget")) {
      return "Budget"
    } else if (queryLower.includes("income") || queryLower.includes("earn")) {
      return "Income"
    } else if (queryLower.includes("save") || queryLower.includes("saving")) {
      return "Savings"
    } else if (queryLower.includes("trend") || queryLower.includes("compare")) {
      return "Trends"
    } else if (queryLower.includes("card") || queryLower.includes("payment")) {
      return "Payment Methods"
    } else if (queryLower.includes("advice") || queryLower.includes("suggest")) {
      return "Financial Advice"
    } else {
      return "General"
    }
  }
}

// Create a singleton instance
export const openaiService = new OpenAIService()

