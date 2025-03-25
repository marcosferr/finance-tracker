"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ArrowUpRight, Home, Car, Utensils, Film } from "lucide-react";
import type { Transaction } from "@/types/finance";

interface RecentTransactionsProps {
  transactions: Transaction[];
}

const getCategoryIcon = (category: string | undefined) => {
  switch (category?.toLowerCase()) {
    case "housing":
      return Home;
    case "food":
      return Utensils;
    case "transportation":
      return Car;
    case "entertainment":
      return Film;
    default:
      return ArrowUpRight;
  }
};

export function RecentTransactions({ transactions }: RecentTransactionsProps) {
  return (
    <div className="space-y-8">
      {transactions.map((transaction) => {
        const Icon = getCategoryIcon(transaction.category?.name);
        return (
          <div key={transaction.id} className="flex items-center">
            <Avatar className="h-9 w-9 mr-4">
              <AvatarImage
                src=""
                alt={transaction.category?.name || "Transaction"}
              />
              <AvatarFallback
                className={
                  transaction.amount > 0 ? "bg-green-500" : "bg-red-500"
                }
              >
                <Icon className="h-4 w-4" />
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 space-y-1">
              <p className="text-sm font-medium leading-none">
                {transaction.description}
              </p>
              <p className="text-xs text-muted-foreground">
                {new Date(transaction.date).toLocaleDateString()}
              </p>
            </div>
            <div className="ml-auto font-medium">
              <Badge
                variant={transaction.amount > 0 ? "outline" : "secondary"}
                className="ml-auto"
              >
                {transaction.amount > 0 ? "+" : ""}$
                {Math.abs(transaction.amount).toFixed(2)}
              </Badge>
            </div>
          </div>
        );
      })}
    </div>
  );
}
