import type { FinancialData, Transaction, UserSettings, Account, FileUpload } from "@/types/finance"
import { mockFinancialData, mockAccounts, mockFileUploads } from "@/data/mock-data"

// API Service class to handle all data operations
class ApiService {
  private financialData: FinancialData
  private userSettings: UserSettings
  private accounts: Account[]
  private fileUploads: FileUpload[]

  constructor() {
    this.financialData = mockFinancialData
    this.userSettings = this.loadSettings()
    this.accounts = mockAccounts
    this.fileUploads = mockFileUploads
  }

  // Account methods
  public getAccounts(): Account[] {
    return this.accounts
  }

  public getAccount(id: string): Account | undefined {
    return this.accounts.find((account) => account.id === id)
  }

  public addAccount(account: Omit<Account, "id">): Account {
    const newAccount = {
      ...account,
      id: Date.now().toString(),
    }

    this.accounts.push(newAccount)
    return newAccount
  }

  public updateAccount(id: string, updates: Partial<Account>): Account | undefined {
    const accountIndex = this.accounts.findIndex((account) => account.id === id)

    if (accountIndex === -1) {
      return undefined
    }

    const updatedAccount = {
      ...this.accounts[accountIndex],
      ...updates,
    }

    this.accounts[accountIndex] = updatedAccount
    return updatedAccount
  }

  public deleteAccount(id: string): boolean {
    const initialLength = this.accounts.length
    this.accounts = this.accounts.filter((account) => account.id !== id)
    return this.accounts.length !== initialLength
  }

  // File upload methods
  public getFileUploads(): FileUpload[] {
    return this.fileUploads
  }

  public getFileUpload(id: string): FileUpload | undefined {
    return this.fileUploads.find((file) => file.id === id)
  }

  public addFileUpload(fileUpload: Omit<FileUpload, "id">): FileUpload {
    const newFileUpload = {
      ...fileUpload,
      id: Date.now().toString(),
    }

    this.fileUploads.push(newFileUpload)
    return newFileUpload
  }

  public updateFileUpload(id: string, updates: Partial<FileUpload>): FileUpload | undefined {
    const fileIndex = this.fileUploads.findIndex((file) => file.id === id)

    if (fileIndex === -1) {
      return undefined
    }

    const updatedFile = {
      ...this.fileUploads[fileIndex],
      ...updates,
    }

    this.fileUploads[fileIndex] = updatedFile
    return updatedFile
  }

  public deleteFileUpload(id: string): boolean {
    const initialLength = this.fileUploads.length
    this.fileUploads = this.fileUploads.filter((file) => file.id !== id)
    return this.fileUploads.length !== initialLength
  }

  // Financial data methods
  public getFinancialData(): FinancialData {
    return this.financialData
  }

  public getIncome() {
    return this.financialData.income
  }

  public getExpenses() {
    return this.financialData.expenses
  }

  public getBudget() {
    return this.financialData.budget
  }

  public getSavings() {
    return this.financialData.savings
  }

  public getPaymentMethods() {
    return this.financialData.paymentMethods
  }

  public getTransactions() {
    return this.financialData.transactions
  }

  public getTrends() {
    return this.financialData.trends
  }

  // Transaction methods with account support
  public addTransaction(transaction: Omit<Transaction, "id">): Transaction {
    const newTransaction = {
      ...transaction,
      id: Date.now().toString(),
    }

    // If accountId is provided but account name isn't, look up the account name
    if (transaction.accountId && !transaction.account) {
      const account = this.getAccount(transaction.accountId)
      if (account) {
        newTransaction.account = account.name
      }
    }

    this.financialData.transactions.recent = [newTransaction, ...this.financialData.transactions.recent].slice(0, 10) // Keep only the 10 most recent

    this.financialData.transactions.total += 1

    if (transaction.category) {
      this.financialData.transactions.categorized += 1
    } else {
      this.financialData.transactions.uncategorized += 1
    }

    return newTransaction
  }

  // Settings methods
  public getSettings(): UserSettings {
    return this.userSettings
  }

  public updateSettings(settings: Partial<UserSettings>): UserSettings {
    this.userSettings = {
      ...this.userSettings,
      ...settings,
    }

    this.saveSettings()
    return this.userSettings
  }

  public hasOpenAIKey(): boolean {
    return Boolean(this.userSettings.openaiApiKey && this.userSettings.openaiApiKey.trim() !== "")
  }

  // Private helper methods
  private loadSettings(): UserSettings {
    if (typeof window === "undefined") {
      return {}
    }

    try {
      const settings = localStorage.getItem("userSettings")
      return settings ? JSON.parse(settings) : {}
    } catch (error) {
      console.error("Failed to load settings:", error)
      return {}
    }
  }

  private saveSettings(): void {
    if (typeof window === "undefined") {
      return
    }

    try {
      localStorage.setItem("userSettings", JSON.stringify(this.userSettings))
    } catch (error) {
      console.error("Failed to save settings:", error)
    }
  }
}

// Create a singleton instance
export const apiService = new ApiService()

