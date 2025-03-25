"use client";

import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

interface BudgetCategory {
  name: string;
  spent: number;
  budget: number;
  color: string;
}

interface MonthlyBudgetProps {
  categories: BudgetCategory[];
}

export function MonthlyBudget({ categories }: MonthlyBudgetProps) {
  return (
    <div className="space-y-4">
      {categories.map((category) => {
        const percentage = (category.spent / category.budget) * 100;
        const isOverBudget = percentage > 100;

        return (
          <div key={category.name} className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className={cn("h-2 w-2 rounded-full", category.color)} />
                <span className="text-sm font-medium">{category.name}</span>
              </div>
              <span className="text-sm text-muted-foreground">
                ${category.spent.toFixed(2)} / ${category.budget.toFixed(2)}
              </span>
            </div>
            <Progress
              value={Math.min(percentage, 100)}
              className={cn("h-2", isOverBudget ? "bg-red-100" : "bg-gray-100")}
            />
          </div>
        );
      })}
    </div>
  );
}
