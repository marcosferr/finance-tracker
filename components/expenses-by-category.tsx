"use client";

import {
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

interface ExpensesByCategoryProps {
  data: { [key: string]: number };
}

const COLORS = [
  "#2BD98E",
  "#147175",
  "#D6FCEC",
  "#828A8E",
  "#252529",
  "#0F0F10",
];

export function ExpensesByCategory({ data }: ExpensesByCategoryProps) {
  const chartData = Object.entries(data).map(([name, value]) => ({
    name,
    value,
  }));

  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={chartData}
          cx="50%"
          cy="50%"
          labelLine={false}
          outerRadius={80}
          fill="#8884d8"
          dataKey="value"
          label={({ name, percent }) =>
            `${name} ${(percent * 100).toFixed(0)}%`
          }
        >
          {chartData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip
          formatter={(value) => [`$${value}`, ""]}
          contentStyle={{
            backgroundColor: "var(--background)",
            borderColor: "var(--border)",
          }}
          labelStyle={{ color: "var(--foreground)" }}
        />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
}
