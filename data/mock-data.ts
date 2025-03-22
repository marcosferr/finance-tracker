import type { FinancialData } from "@/types/finance"
import type { Account } from "@/types/account"
import type { FileUpload } from "@/types/file-upload"

// Mock financial data
export const mockFinancialData: FinancialData = {
  income: {
    total: 3456.78,
    sources: [
      { source: "Salary", amount: 3000.0 },
      { source: "Freelance", amount: 350.0 },
      { source: "Investments", amount: 106.78 },
    ],
    trend: {
      vsLastMonth: 10.5,
      vsLastYear: 15.2,
    },
  },
  expenses: {
    total: 2224.89,
    categories: [
      { category: "Housing", amount: 850.0 },
      { category: "Food", amount: 199.0 },
      { category: "Transportation", amount: 165.3 },
      { category: "Entertainment", amount: 145.99 },
      { category: "Utilities", amount: 159.99 },
      { category: "Shopping", amount: 120.5 },
      { category: "Healthcare", amount: 89.99 },
      { category: "Other", amount: 494.12 },
    ],
    trend: {
      vsLastMonth: -5.2,
      vsLastYear: 12.8,
    },
  },
  budget: {
    total: 3000.0,
    used: 2224.89,
    remaining: 775.11,
    percentUsed: 74,
    categories: [
      { category: "Housing", budget: 1000.0, spent: 850.0 },
      { category: "Food", budget: 300.0, spent: 199.0 },
      { category: "Transportation", budget: 200.0, spent: 165.3 },
      { category: "Entertainment", budget: 150.0, spent: 145.99 },
      { category: "Utilities", budget: 200.0, spent: 159.99 },
      { category: "Shopping", budget: 100.0, spent: 120.5 },
      { category: "Healthcare", budget: 150.0, spent: 89.99 },
      { category: "Other", budget: 900.0, spent: 494.12 },
    ],
  },
  savings: {
    total: 1231.89,
    percentOfIncome: 35.6,
    goal: 1500.0,
    progress: 82.1,
  },
  paymentMethods: [
    { method: "Credit Card A", amount: 1250.45, transactions: 15 },
    { method: "Credit Card B", amount: 450.32, transactions: 8 },
    { method: "Debit Card", amount: 324.12, transactions: 6 },
    { method: "Cash", amount: 200.0, transactions: 4 },
  ],
  transactions: {
    recent: [
      {
        id: "1",
        date: "2023-06-15",
        description: "Grocery Shopping",
        category: "Food",
        amount: -120.5,
        accountId: "acc1",
        account: "Main Checking",
      },
      {
        id: "2",
        date: "2023-06-12",
        description: "Gas Station",
        category: "Transportation",
        amount: -45.3,
        accountId: "acc1",
        account: "Main Checking",
      },
      {
        id: "3",
        date: "2023-06-10",
        description: "Movie Tickets",
        category: "Entertainment",
        amount: -35.99,
        accountId: "acc3",
        account: "Credit Card",
      },
      {
        id: "4",
        date: "2023-06-05",
        description: "Internet Bill",
        category: "Utilities",
        amount: -59.99,
        accountId: "acc1",
        account: "Main Checking",
      },
      {
        id: "5",
        date: "2023-06-01",
        description: "Rent Payment",
        category: "Housing",
        amount: -850.0,
        accountId: "acc1",
        account: "Main Checking",
      },
    ],
    total: 45,
    categorized: 42,
    uncategorized: 3,
  },
  trends: {
    monthly: [
      { month: "Jan", income: 3200.0, expenses: 2100.0, savings: 1100.0 },
      { month: "Feb", income: 3250.0, expenses: 2200.0, savings: 1050.0 },
      { month: "Mar", income: 3300.0, expenses: 2300.0, savings: 1000.0 },
      { month: "Apr", income: 3350.0, expenses: 2150.0, savings: 1200.0 },
      { month: "May", income: 3400.0, expenses: 2350.0, savings: 1050.0 },
      { month: "Jun", income: 3456.78, expenses: 2224.89, savings: 1231.89 },
    ],
  },
}

// Add accounts to the mock data
export const mockAccounts: Account[] = [
  {
    id: "acc1",
    name: "Main Checking",
    type: "checking",
    balance: 3245.67,
    currency: "USD",
    color: "#2BD98E",
  },
  {
    id: "acc2",
    name: "Savings",
    type: "savings",
    balance: 12500.0,
    currency: "USD",
    color: "#147175",
  },
  {
    id: "acc3",
    name: "Credit Card",
    type: "credit",
    balance: -1250.45,
    currency: "USD",
    color: "#D6FCEC",
  },
  {
    id: "acc4",
    name: "Investment",
    type: "investment",
    balance: 45000.0,
    currency: "USD",
    color: "#828A8E",
  },
]

// Add mock file uploads
export const mockFileUploads: FileUpload[] = [
  {
    id: "file1",
    filename: "june_transactions.csv",
    fileType: "csv",
    uploadDate: "2023-06-30",
    accountId: "acc1",
    transactionCount: 25,
    status: "completed",
  },
  {
    id: "file2",
    filename: "credit_card_statement.pdf",
    fileType: "pdf",
    uploadDate: "2023-06-15",
    accountId: "acc3",
    transactionCount: 15,
    status: "completed",
  },
]

