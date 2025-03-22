"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon, Download } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { Overview } from "@/components/overview"
import { ExpensesByCategory } from "@/components/expenses-by-category"

export default function ReportsPage() {
  const [date, setDate] = useState({
    from: new Date(2023, 5, 1),
    to: new Date(2023, 5, 30),
  })
  const [reportType, setReportType] = useState("monthly")

  return (
    <div className="flex-1 space-y-4 p-4 pt-6 md:p-8">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Reports</h2>
        <Button>
          <Download className="mr-2 h-4 w-4" />
          Export Report
        </Button>
      </div>
      <div className="flex flex-col md:flex-row gap-4">
        <div className="w-full md:w-64 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Report Settings</CardTitle>
              <CardDescription>Configure your report parameters.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Report Type</label>
                <Select value={reportType} onValueChange={setReportType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select report type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monthly">Monthly Report</SelectItem>
                    <SelectItem value="quarterly">Quarterly Report</SelectItem>
                    <SelectItem value="yearly">Yearly Report</SelectItem>
                    <SelectItem value="custom">Custom Date Range</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Date Range</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn("w-full justify-start text-left font-normal", !date && "text-muted-foreground")}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {date?.from ? (
                        date.to ? (
                          <>
                            {format(date.from, "LLL dd, y")} - {format(date.to, "LLL dd, y")}
                          </>
                        ) : (
                          format(date.from, "LLL dd, y")
                        )
                      ) : (
                        <span>Pick a date</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar mode="range" selected={date} onSelect={setDate} initialFocus />
                  </PopoverContent>
                </Popover>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Available Reports</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                <li>
                  <Button variant="ghost" className="w-full justify-start">
                    Income vs Expenses
                  </Button>
                </li>
                <li>
                  <Button variant="ghost" className="w-full justify-start">
                    Spending by Category
                  </Button>
                </li>
                <li>
                  <Button variant="ghost" className="w-full justify-start">
                    Monthly Trends
                  </Button>
                </li>
                <li>
                  <Button variant="ghost" className="w-full justify-start">
                    Budget Analysis
                  </Button>
                </li>
                <li>
                  <Button variant="ghost" className="w-full justify-start">
                    Savings Report
                  </Button>
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
        <div className="flex-1">
          <Tabs defaultValue="overview" className="space-y-4">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="categories">Categories</TabsTrigger>
              <TabsTrigger value="trends">Trends</TabsTrigger>
            </TabsList>
            <TabsContent value="overview" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Financial Overview</CardTitle>
                  <CardDescription>
                    {format(date.from, "MMMM d, yyyy")} - {format(date.to, "MMMM d, yyyy")}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    <div className="space-y-2">
                      <h3 className="text-sm font-medium">Total Income</h3>
                      <div className="text-2xl font-bold text-green-500">$3,456.78</div>
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-sm font-medium">Total Expenses</h3>
                      <div className="text-2xl font-bold text-red-500">$2,224.89</div>
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-sm font-medium">Net Savings</h3>
                      <div className="text-2xl font-bold">$1,231.89</div>
                    </div>
                  </div>
                  <div className="mt-6">
                    <Overview />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="categories" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Spending by Category</CardTitle>
                  <CardDescription>
                    {format(date.from, "MMMM d, yyyy")} - {format(date.to, "MMMM d, yyyy")}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ExpensesByCategory />
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="trends" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Monthly Trends</CardTitle>
                  <CardDescription>
                    {format(date.from, "MMMM d, yyyy")} - {format(date.to, "MMMM d, yyyy")}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p>Trend analysis will be displayed here.</p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}

