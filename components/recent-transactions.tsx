"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { ArrowUpRight, Home, Car, Utensils, Film } from "lucide-react"

const transactions = [
  {
    id: "1",
    amount: -120.5,
    status: "expense",
    description: "Grocery Shopping",
    date: "2023-06-15",
    category: "Food",
    icon: Utensils,
  },
  {
    id: "2",
    amount: 2400.0,
    status: "income",
    description: "Salary Deposit",
    date: "2023-06-01",
    category: "Income",
    icon: ArrowUpRight,
  },
  {
    id: "3",
    amount: -850.0,
    status: "expense",
    description: "Rent Payment",
    date: "2023-06-01",
    category: "Housing",
    icon: Home,
  },
  {
    id: "4",
    amount: -45.99,
    status: "expense",
    description: "Movie Tickets",
    date: "2023-06-10",
    category: "Entertainment",
    icon: Film,
  },
  {
    id: "5",
    amount: -65.3,
    status: "expense",
    description: "Gas Station",
    date: "2023-06-12",
    category: "Transportation",
    icon: Car,
  },
]

export function RecentTransactions() {
  return (
    <div className="space-y-8">
      {transactions.map((transaction) => {
        const Icon = transaction.icon
        return (
          <div key={transaction.id} className="flex items-center">
            <Avatar className="h-9 w-9 mr-4">
              <AvatarImage src="" alt={transaction.category} />
              <AvatarFallback className={transaction.amount > 0 ? "bg-green-500" : "bg-red-500"}>
                <Icon className="h-4 w-4" />
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 space-y-1">
              <p className="text-sm font-medium leading-none">{transaction.description}</p>
              <p className="text-xs text-muted-foreground">{transaction.date}</p>
            </div>
            <div className="ml-auto font-medium">
              <Badge variant={transaction.amount > 0 ? "outline" : "secondary"} className="ml-auto">
                {transaction.amount > 0 ? "+" : ""}
                {transaction.amount.toFixed(2)}
              </Badge>
            </div>
          </div>
        )
      })}
    </div>
  )
}

