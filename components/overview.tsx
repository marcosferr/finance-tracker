"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

interface OverviewProps {
  income: number[];
  expenses: number[];
  savings: number[];
  currency: string;
}

export function Overview({
  income,
  expenses,
  savings,
  currency,
}: OverviewProps) {
  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];

  // Create an array of 12 months with default values of 0
  const monthlyData = months.map((month, index) => ({
    name: month,
    income: income[index] || 0,
    expenses: expenses[index] || 0,
    savings: savings[index] || 0,
  }));

  // Custom tooltip formatter
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  return (
    <ResponsiveContainer width="100%" height={350}>
      <BarChart data={monthlyData}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" />
        <YAxis tickFormatter={formatCurrency} />
        <Tooltip formatter={(value: number) => formatCurrency(value)} />
        <Legend />
        <Bar dataKey="income" fill="#2BD98E" />
        <Bar dataKey="expenses" fill="#FF6B6B" />
        <Bar dataKey="savings" fill="#4A90E2" />
      </BarChart>
    </ResponsiveContainer>
  );
}
