"use client"

import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"

const data = [
  {
    name: "Jan",
    income: 2400,
    expenses: 1800,
  },
  {
    name: "Feb",
    income: 2210,
    expenses: 1900,
  },
  {
    name: "Mar",
    income: 2290,
    expenses: 2100,
  },
  {
    name: "Apr",
    income: 2780,
    expenses: 2400,
  },
  {
    name: "May",
    income: 2890,
    expenses: 2200,
  },
  {
    name: "Jun",
    income: 3390,
    expenses: 2800,
  },
  {
    name: "Jul",
    income: 3490,
    expenses: 2900,
  },
]

export function Overview() {
  return (
    <ResponsiveContainer width="100%" height={350}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" stroke="#828A8E" fontSize={12} tickLine={false} axisLine={false} />
        <YAxis
          stroke="#828A8E"
          fontSize={12}
          tickLine={false}
          axisLine={false}
          tickFormatter={(value) => `$${value}`}
        />
        <Tooltip
          formatter={(value) => [`$${value}`, ""]}
          contentStyle={{ backgroundColor: "var(--background)", borderColor: "var(--border)" }}
          labelStyle={{ color: "var(--foreground)" }}
        />
        <Legend />
        <Bar dataKey="income" name="Income" fill="#2BD98E" radius={[4, 4, 0, 0]} />
        <Bar dataKey="expenses" name="Expenses" fill="#147175" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}

