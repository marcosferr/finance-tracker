"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  ArrowUpRight,
  ArrowDownRight,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import { apiService } from "@/lib/api-service";
import type { FinancialData } from "@/types/finance";

export function FinancialInsights() {
  const [data, setData] = useState<FinancialData | null>(null);

  useEffect(() => {
    // Get financial data from the API service
    const financialData = apiService.getFinancialData();
    setData(financialData);
  }, []);

  if (!data) {
    return (
      <Card className="flex-1">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-medium">
            Financial Insights
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="h-4 w-3/4 rounded-md bg-muted animate-pulse" />
          <div className="h-20 rounded-md bg-muted animate-pulse" />
          <div className="h-4 w-1/2 rounded-md bg-muted animate-pulse" />
          <div className="h-20 rounded-md bg-muted animate-pulse" />
        </CardContent>
      </Card>
    );
  }

  // Get top spending categories
  const topSpendingCategories = [...data.expenses.categories]
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 3);

  return (
    <Card className="flex-1">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-medium">
          Financial Insights
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <h3 className="text-sm font-medium">Monthly Overview</h3>
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-lg border p-3">
              <div className="flex items-center gap-1">
                <ArrowUpRight className="h-3 w-3 text-green-500" />
                <p className="text-xs text-muted-foreground">Income</p>
              </div>
              <p className="text-lg font-bold text-green-500">
                ${data.income.total.toFixed(2)}
              </p>
            </div>
            <div className="rounded-lg border p-3">
              <div className="flex items-center gap-1">
                <ArrowDownRight className="h-3 w-3 text-red-500" />
                <p className="text-xs text-muted-foreground">Expenses</p>
              </div>
              <p className="text-lg font-bold text-red-500">
                ${data.expenses.total.toFixed(2)}
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <h3 className="text-sm font-medium">Top Spending Categories</h3>
          <ul className="space-y-2">
            {topSpendingCategories.map((category, index) => {
              const percentage = (category.amount / data.expenses.total) * 100;
              return (
                <li key={index}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm">{category.category}</span>
                    <span className="text-sm font-medium">
                      ${category.amount.toFixed(2)}
                    </span>
                  </div>
                  <Progress
                    value={percentage}
                    className="h-1.5"
                    // indicatorClassName={index === 0 ? "bg-[#2BD98E]" : index === 1 ? "bg-[#147175]" : "bg-[#D6FCEC]"}
                  />
                </li>
              );
            })}
          </ul>
        </div>

        <div className="space-y-2">
          <h3 className="text-sm font-medium">Spending Trends</h3>
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-lg border p-3">
              <div className="flex items-center gap-1">
                {data.expenses.trend.vsLastMonth < 0 ? (
                  <TrendingDown className="h-3 w-3 text-green-500" />
                ) : (
                  <TrendingUp className="h-3 w-3 text-red-500" />
                )}
                <p className="text-xs text-muted-foreground">vs Last Month</p>
              </div>
              <p
                className={`text-sm font-medium ${
                  data.expenses.trend.vsLastMonth < 0
                    ? "text-green-500"
                    : "text-red-500"
                }`}
              >
                {data.expenses.trend.vsLastMonth > 0 ? "+" : ""}
                {data.expenses.trend.vsLastMonth}%
              </p>
            </div>
            <div className="rounded-lg border p-3">
              <div className="flex items-center gap-1">
                {data.expenses.trend.vsLastYear < 0 ? (
                  <TrendingDown className="h-3 w-3 text-green-500" />
                ) : (
                  <TrendingUp className="h-3 w-3 text-red-500" />
                )}
                <p className="text-xs text-muted-foreground">vs Last Year</p>
              </div>
              <p
                className={`text-sm font-medium ${
                  data.expenses.trend.vsLastYear < 0
                    ? "text-green-500"
                    : "text-red-500"
                }`}
              >
                {data.expenses.trend.vsLastYear > 0 ? "+" : ""}
                {data.expenses.trend.vsLastYear}%
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <h3 className="text-sm font-medium">Budget Status</h3>
          <div className="rounded-lg border p-3">
            <p className="text-xs text-muted-foreground">Monthly Budget</p>
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">
                ${data.budget.used.toFixed(2)} / ${data.budget.total.toFixed(2)}
              </p>
              <p className="text-sm font-medium">{data.budget.percentUsed}%</p>
            </div>
            <div className="mt-2 h-1.5 rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-[#2BD98E]"
                style={{ width: `${data.budget.percentUsed}%` }}
              ></div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
