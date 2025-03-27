"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  ArrowUpRight,
  Home,
  Car,
  Utensils,
  Film,
  ArrowDownIcon,
  ArrowUpIcon,
} from "lucide-react";

interface Transaction {
  id: string;
  description: string;
  amount: number;
  date: string | Date;
  category?: {
    name: string;
  };
}

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
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "PYG",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString();
  };

  return (
    <div className="space-y-4">
      {transactions.map((transaction) => (
        <div
          key={transaction.id}
          className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50"
        >
          <div className="flex items-center space-x-4">
            <div
              className={`p-2 rounded-full ${
                transaction.amount > 0
                  ? "bg-green-500/20 text-green-500"
                  : "bg-red-500/20 text-red-500"
              }`}
            >
              {transaction.amount > 0 ? (
                <ArrowUpIcon className="h-4 w-4" />
              ) : (
                <ArrowDownIcon className="h-4 w-4" />
              )}
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium leading-none">
                {transaction.description}
              </p>
              <p className="text-xs text-muted-foreground">
                {formatDate(transaction.date)}
              </p>
            </div>
          </div>
          <div
            className={`text-sm font-medium ${
              transaction.amount > 0 ? "text-green-500" : "text-red-500"
            }`}
          >
            {transaction.amount > 0 ? "+" : "-"}
            {formatCurrency(Math.abs(transaction.amount))}
          </div>
        </div>
      ))}
    </div>
  );
}
