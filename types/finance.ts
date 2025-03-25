import type React from "react";
// Base interfaces for financial data
export interface Income {
  total: number;
  sources: IncomeSource[];
  trend: Trend;
}

export interface IncomeSource {
  source: string;
  amount: number;
}

export interface Expense {
  category: string;
  amount: number;
}

export interface BudgetCategory extends Expense {
  budget: number;
  spent: number;
}

export interface Trend {
  vsLastMonth: number;
  vsLastYear: number;
}

export interface Savings {
  total: number;
  percentOfIncome: number;
  goal: number;
  progress: number;
}

export interface PaymentMethod {
  method: string;
  amount: number;
  transactions: number;
}

// Add Account interface
export interface Account {
  id: string;
  name: string;
  type: "checking" | "savings" | "credit" | "investment" | "other";
  balance: number;
  currency: Currency;
  color?: string;
}

// Update Transaction interface to include account
export interface Transaction {
  id: string;
  date: string | Date;
  description: string;
  amount: number;
  categoryId?: string;
  accountId: string;
  category?: {
    id: string;
    name: string;
    color: string;
  };
  account: {
    id: string;
    name: string;
    color: string | null;
  };
}

export interface TransactionSummary {
  recent: Transaction[];
  total: number;
  categorized: number;
  uncategorized: number;
}

export interface MonthlyData {
  month: string;
  income: number;
  expenses: number;
  savings: number;
}

export interface TrendData {
  monthly: MonthlyData[];
}

export interface ExpenseSummary {
  total: number;
  categories: Expense[];
  trend: Trend;
}

export interface BudgetSummary {
  total: number;
  used: number;
  remaining: number;
  percentUsed: number;
  categories: BudgetCategory[];
}

// Main financial data interface
export interface FinancialData {
  currency: string;
  income: {
    total: number;
    recurring: number;
    oneTime: number;
    sources: { [key: string]: number };
  };
  expenses: {
    total: number;
    recurring: number;
    oneTime: number;
    categories: { [key: string]: number };
  };
  budget: {
    total: number;
    spent: number;
    remaining: number;
    categories: { [key: string]: { limit: number; spent: number } };
  };
  savings: {
    total: number;
    rate: number;
    goals: { [key: string]: { target: number; current: number } };
  };
  paymentMethods: {
    [key: string]: {
      type: string;
      balance: number;
      limit?: number;
    };
  };
  transactions: {
    recent: Transaction[];
    total: number;
    categorized: number;
    uncategorized: number;
  };
  trends: {
    income: number[];
    expenses: number[];
    savings: number[];
  };
  monthlyData: {
    month: string;
    income: number;
    expenses: number;
  }[];
}

// Chat-related interfaces
export interface ChatMessage {
  id: string;
  content: string | React.ReactNode;
  role: "user" | "assistant";
  timestamp: Date;
  category?: string;
  isLoading?: boolean;
}

export interface ChatResponse {
  content: string;
  category?: string;
}

// Settings interfaces
export interface UserSettings {
  theme?: string;
  currency?: Currency;
  language?: string;
  openaiApiKey?: string;
}

// Add FileUpload interface to track uploaded files
export interface FileUpload {
  id: string;
  filename: string;
  fileType: string;
  uploadDate: string | Date;
  accountId: string;
  account?: string;
  transactionCount: number;
  status: string;
  errorMessage?: string;
}

export interface Category {
  id: string;
  name: string;
  color: string;
  budget?: number;
}

export type Currency = "USD" | "EUR" | "GBP" | "JPY" | "CAD" | "PYG";

export const AVAILABLE_CURRENCIES: { [key in Currency]: string } = {
  USD: "$",
  EUR: "€",
  GBP: "£",
  JPY: "¥",
  CAD: "$",
  PYG: "₲",
};

export const getCurrencySymbol = (currency: Currency): string => {
  return AVAILABLE_CURRENCIES[currency] || currency;
};

export type Debt = {
  id: string;
  name: string;
  totalAmount: number;
  paidAmount: number;
  interestRate: number;
  dueDate?: Date;
  status: "ACTIVE" | "PAID" | "DEFAULTED";
  notes?: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
};

export type FinancialAsset = {
  id: string;
  name: string;
  type: string;
  amount: number;
  interestRate: number;
  startDate: Date;
  maturityDate?: Date | null;
  provider?: string | null;
  status: string;
  notes?: string | null;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
};
