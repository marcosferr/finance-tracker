"use client";

import { Progress } from "@/components/ui/progress";

const budgetCategories = [
  {
    category: "Housing",
    spent: 1200,
    budget: 1500,
    color: "bg-[#2BD98E]",
  },
  {
    category: "Food",
    spent: 450,
    budget: 500,
    color: "bg-[#147175]",
  },
  {
    category: "Transportation",
    spent: 350,
    budget: 300,
    color: "bg-red-500",
  },
  {
    category: "Entertainment",
    spent: 150,
    budget: 200,
    color: "bg-[#D6FCEC]",
  },
  {
    category: "Utilities",
    spent: 120,
    budget: 150,
    color: "bg-[#828A8E]",
  },
];

export function MonthlyBudget() {
  return (
    <div className="space-y-4">
      {budgetCategories.map((item) => (
        <div key={item.category} className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">{item.category}</span>
            <span className="text-sm text-muted-foreground">
              ${item.spent} / ${item.budget}
            </span>
          </div>
          <Progress
            value={(item.spent / item.budget) * 100}
            className={`h-2 ${
              item.spent > item.budget ? "bg-red-200" : "bg-muted"
            }`}
            // indicatorClassName={item.spent > item.budget ? "bg-red-500" : item.color}
          />
        </div>
      ))}
    </div>
  );
}
