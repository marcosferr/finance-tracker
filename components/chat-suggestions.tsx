"use client"

import type React from "react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { BarChart2, PieChart, TrendingUp, DollarSign, CreditCard, Wallet } from "lucide-react"

type SuggestedQuestion = {
  icon: React.ElementType
  text: string
  category: string
}

const suggestedQuestions: SuggestedQuestion[] = [
  {
    icon: BarChart2,
    text: "What are my top spending categories this month?",
    category: "Spending Analysis",
  },
  {
    icon: TrendingUp,
    text: "How has my spending changed compared to last month?",
    category: "Trends",
  },
  {
    icon: DollarSign,
    text: "How am I doing on my budget this month?",
    category: "Budget",
  },
  {
    icon: PieChart,
    text: "What percentage of my income am I saving?",
    category: "Savings",
  },
  {
    icon: CreditCard,
    text: "Which credit card am I using the most?",
    category: "Payment Methods",
  },
  {
    icon: Wallet,
    text: "How can I reduce my monthly expenses?",
    category: "Financial Advice",
  },
]

interface ChatSuggestionsProps {
  onSelectQuestion: (question: string) => void
}

export function ChatSuggestions({ onSelectQuestion }: ChatSuggestionsProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-medium">Suggested Questions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-2">
          {suggestedQuestions.map((question, index) => {
            const Icon = question.icon
            return (
              <Button
                key={index}
                variant="outline"
                className="justify-start h-auto py-2.5 px-3"
                onClick={() => onSelectQuestion(question.text)}
              >
                <div className="flex items-start gap-2 text-left">
                  <Icon className="h-4 w-4 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-medium">{question.text}</p>
                    <p className="text-xs text-muted-foreground">{question.category}</p>
                  </div>
                </div>
              </Button>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}

