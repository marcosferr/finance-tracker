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
}

export function Overview({ income, expenses, savings }: OverviewProps) {
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
  const currentMonth = new Date().getMonth();

  const chartData = months.map((month, index) => ({
    name: month,
    income: income[index] || 0,
    expenses: expenses[index] || 0,
    savings: savings[index] || 0,
  }));

  return (
    <ResponsiveContainer width="100%" height={350}>
      <BarChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Bar dataKey="income" fill="#2BD98E" />
        <Bar dataKey="expenses" fill="#FF6B6B" />
        <Bar dataKey="savings" fill="#4A90E2" />
      </BarChart>
    </ResponsiveContainer>
  );
}
