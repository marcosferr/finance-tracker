"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowDownLeft,
  ArrowUpRight,
  Download,
  Filter,
  Plus,
  Search,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { Transaction, Category } from "@/types/finance";
import { format } from "date-fns";
import { AddTransactionDialog } from "@/components/add-transaction-dialog";

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [accountFilter, setAccountFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("all");

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch transactions
      const transactionsRes = await fetch("/api/transactions");
      if (!transactionsRes.ok) throw new Error("Failed to fetch transactions");
      const transactionsData = await transactionsRes.json();
      setTransactions(transactionsData.transactions);

      // Fetch accounts
      const accountsRes = await fetch("/api/accounts");
      if (!accountsRes.ok) throw new Error("Failed to fetch accounts");
      const accountsData = await accountsRes.json();
      setAccounts(accountsData);

      // Fetch categories
      const categoriesRes = await fetch("/api/categories");
      if (!categoriesRes.ok) throw new Error("Failed to fetch categories");
      const categoriesData = await categoriesRes.json();
      setCategories(categoriesData);
    } catch (err) {
      console.error("Error loading data:", err);
      setError("Failed to load data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Load transactions, accounts, and categories
  useEffect(() => {
    fetchData();
  }, []);

  // Update transactions when filters change
  useEffect(() => {
    const fetchFilteredTransactions = async () => {
      try {
        setLoading(true);
        setError(null);

        let url = "/api/transactions?";

        if (accountFilter !== "all") {
          url += `&accountId=${accountFilter}`;
        }

        if (categoryFilter !== "all") {
          url += `&categoryId=${categoryFilter}`;
        }

        if (activeTab === "income") {
          url += "&type=income";
        } else if (activeTab === "expenses") {
          url += "&type=expense";
        }

        const res = await fetch(url);
        if (!res.ok) throw new Error("Failed to fetch transactions");
        const data = await res.json();
        setTransactions(data.transactions);
      } catch (err) {
        console.error("Error loading transactions:", err);
        setError("Failed to load transactions. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchFilteredTransactions();
  }, [accountFilter, categoryFilter, activeTab]);

  const filteredTransactions = transactions.filter((transaction) => {
    const matchesSearch = transaction.description
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const handleExport = () => {
    // Define CSV headers
    const headers = ["Date", "Description", "Category", "Account", "Amount"];

    // Convert transactions to CSV rows
    const rows = filteredTransactions.map((transaction) => [
      format(new Date(transaction.date), "yyyy-MM-dd"),
      transaction.description,
      transaction.category?.name || "",
      transaction.account.name,
      transaction.amount.toString(),
    ]);

    // Combine headers and rows
    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.join(",")),
    ].join("\n");

    // Create blob and download
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute(
        "download",
        `transactions_${format(new Date(), "yyyy-MM-dd")}.csv`
      );
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  if (error) {
    return (
      <div className="flex-1 p-4 pt-6 md:p-8">
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <p className="text-red-800">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-4 p-4 pt-6 md:p-8">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Transactions</h2>
        <div className="flex items-center gap-2">
          <Button onClick={handleExport}>
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
          <AddTransactionDialog
            accounts={accounts}
            categories={categories}
            onTransactionAdded={fetchData}
          />
        </div>
      </div>
      <Tabs
        defaultValue="all"
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-4"
      >
        <div className="flex justify-between">
          <TabsList>
            <TabsTrigger value="all">All Transactions</TabsTrigger>
            <TabsTrigger value="income">Income</TabsTrigger>
            <TabsTrigger value="expenses">Expenses</TabsTrigger>
          </TabsList>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search transactions..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-[180px]">
              <Filter className="mr-2 h-4 w-4" />
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category.id} value={category.id}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={accountFilter} onValueChange={setAccountFilter}>
            <SelectTrigger className="w-[180px]">
              <Filter className="mr-2 h-4 w-4" />
              <SelectValue placeholder="Account" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Accounts</SelectItem>
              {accounts.map((account) => (
                <SelectItem key={account.id} value={account.id}>
                  {account.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <TabsContent value="all">
          <Card>
            <CardHeader>
              <CardTitle>All Transactions</CardTitle>
              <CardDescription>
                A list of all your transactions.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center p-4">
                  <p>Loading transactions...</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Account</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTransactions.map((transaction) => (
                      <TableRow key={transaction.id}>
                        <TableCell>
                          {format(new Date(transaction.date), "MMM d, yyyy")}
                        </TableCell>
                        <TableCell>{transaction.description}</TableCell>
                        <TableCell>
                          {transaction.category && (
                            <Badge
                              variant="outline"
                              style={{
                                backgroundColor: transaction.category.color
                                  ? `${transaction.category.color}20`
                                  : undefined,
                              }}
                            >
                              {transaction.category.name}
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="secondary"
                            style={{
                              backgroundColor: transaction.account.color
                                ? `${transaction.account.color}20`
                                : undefined,
                            }}
                          >
                            {transaction.account.name}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <span
                            className={
                              transaction.amount > 0
                                ? "text-green-500"
                                : "text-red-500"
                            }
                          >
                            {transaction.amount > 0 ? (
                              <ArrowUpRight className="inline mr-1 h-4 w-4" />
                            ) : (
                              <ArrowDownLeft className="inline mr-1 h-4 w-4" />
                            )}
                            ${Math.abs(transaction.amount).toFixed(2)}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="income">
          <Card>
            <CardHeader>
              <CardTitle>Income</CardTitle>
              <CardDescription>
                A list of your income transactions.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center p-4">
                  <p>Loading transactions...</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Account</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTransactions
                      .filter((t) => t.amount > 0)
                      .map((transaction) => (
                        <TableRow key={transaction.id}>
                          <TableCell>
                            {format(new Date(transaction.date), "MMM d, yyyy")}
                          </TableCell>
                          <TableCell>{transaction.description}</TableCell>
                          <TableCell>
                            {transaction.category && (
                              <Badge
                                variant="outline"
                                style={{
                                  backgroundColor: transaction.category.color
                                    ? `${transaction.category.color}20`
                                    : undefined,
                                }}
                              >
                                {transaction.category.name}
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="secondary"
                              style={{
                                backgroundColor: transaction.account.color
                                  ? `${transaction.account.color}20`
                                  : undefined,
                              }}
                            >
                              {transaction.account.name}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <span className="text-green-500">
                              <ArrowUpRight className="inline mr-1 h-4 w-4" />$
                              {Math.abs(transaction.amount).toFixed(2)}
                            </span>
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="expenses">
          <Card>
            <CardHeader>
              <CardTitle>Expenses</CardTitle>
              <CardDescription>
                A list of your expense transactions.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center p-4">
                  <p>Loading transactions...</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Account</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTransactions
                      .filter((t) => t.amount < 0)
                      .map((transaction) => (
                        <TableRow key={transaction.id}>
                          <TableCell>
                            {format(new Date(transaction.date), "MMM d, yyyy")}
                          </TableCell>
                          <TableCell>{transaction.description}</TableCell>
                          <TableCell>
                            {transaction.category && (
                              <Badge
                                variant="outline"
                                style={{
                                  backgroundColor: transaction.category.color
                                    ? `${transaction.category.color}20`
                                    : undefined,
                                }}
                              >
                                {transaction.category.name}
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="secondary"
                              style={{
                                backgroundColor: transaction.account.color
                                  ? `${transaction.account.color}20`
                                  : undefined,
                              }}
                            >
                              {transaction.account.name}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <span className="text-red-500">
                              <ArrowDownLeft className="inline mr-1 h-4 w-4" />$
                              {Math.abs(transaction.amount).toFixed(2)}
                            </span>
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
