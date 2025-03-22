import type { FinancialData, ChatResponse } from "@/types/finance"

export function generateChatResponse(query: string, data: FinancialData): ChatResponse {
  // Convert query to lowercase for easier matching
  const queryLower = query.toLowerCase()

  // Check for different types of queries
  if (
    queryLower.includes("spend") ||
    queryLower.includes("expense") ||
    (queryLower.includes("where") && queryLower.includes("money"))
  ) {
    return generateSpendingResponse(data)
  }

  if (queryLower.includes("budget") || queryLower.includes("limit") || queryLower.includes("over")) {
    return generateBudgetResponse(data)
  }

  if (queryLower.includes("income") || queryLower.includes("earn") || queryLower.includes("salary")) {
    return generateIncomeResponse(data)
  }

  if (queryLower.includes("save") || queryLower.includes("saving")) {
    return generateSavingsResponse(data)
  }

  if (
    queryLower.includes("trend") ||
    queryLower.includes("change") ||
    queryLower.includes("compare") ||
    queryLower.includes("last month") ||
    queryLower.includes("previous")
  ) {
    return generateTrendsResponse(data)
  }

  if (
    queryLower.includes("card") ||
    queryLower.includes("payment") ||
    queryLower.includes("credit") ||
    queryLower.includes("debit") ||
    queryLower.includes("cash")
  ) {
    return generatePaymentMethodsResponse(data)
  }

  if (
    queryLower.includes("advice") ||
    queryLower.includes("suggest") ||
    queryLower.includes("recommend") ||
    queryLower.includes("help me") ||
    queryLower.includes("improve") ||
    queryLower.includes("better")
  ) {
    return generateAdviceResponse(data)
  }

  if (queryLower.includes("help") || queryLower.includes("what can you") || queryLower.includes("how to use")) {
    return generateGeneralResponse()
  }

  // Default response for queries that don't match specific patterns
  return {
    content: (
      <div>
        <p>I'm not sure I understand your question about "{query}". Here are some topics I can help with:</p>
        <ul className="list-disc pl-5 mt-2">
          <li>Spending analysis and top expense categories</li>
          <li>Budget status and management</li>
          <li>Income breakdown and sources</li>
          <li>Savings rate and goals</li>
          <li>Financial trends over time</li>
          <li>Payment methods and transactions</li>
          <li>Personalized financial advice</li>
        </ul>
        <p className="mt-2">Could you rephrase your question or select one of these topics?</p>
      </div>
    ),
    category: "Help",
  }
}

function generateSpendingResponse(data: FinancialData): ChatResponse {
  const topCategories = [...data.expenses.categories].sort((a, b) => b.amount - a.amount).slice(0, 3)

  return {
    content: (
      <div>
        <p>
          Your total spending this month is <strong>${data.expenses.total.toFixed(2)}</strong>.
        </p>
        <p className="mt-2">Your top spending categories are:</p>
        <ul className="list-disc pl-5 mt-1">
          {topCategories.map((cat, index) => (
            <li key={index}>
              <strong>{cat.category}</strong>: ${cat.amount.toFixed(2)} (
              {((cat.amount / data.expenses.total) * 100).toFixed(1)}% of total)
            </li>
          ))}
        </ul>
        <p className="mt-2">
          Compared to last month, your spending has changed by{" "}
          <strong className={data.expenses.trend.vsLastMonth < 0 ? "text-green-500" : "text-red-500"}>
            {data.expenses.trend.vsLastMonth > 0 ? "+" : ""}
            {data.expenses.trend.vsLastMonth}%
          </strong>
          .
        </p>
      </div>
    ),
    category: "Spending Analysis",
  }
}

function generateBudgetResponse(data: FinancialData): ChatResponse {
  const overBudgetCategories = data.budget.categories.filter((cat) => cat.spent > cat.budget)

  return {
    content: (
      <div>
        <p>
          You've spent <strong>${data.budget.used.toFixed(2)}</strong> out of your{" "}
          <strong>${data.budget.total.toFixed(2)}</strong> monthly budget.
        </p>
        <p className="mt-2">
          That's <strong>{data.budget.percentUsed}%</strong> of your total budget with{" "}
          <strong>${data.budget.remaining.toFixed(2)}</strong> remaining.
        </p>

        {overBudgetCategories.length > 0 && (
          <>
            <p className="mt-2">You're over budget in the following categories:</p>
            <ul className="list-disc pl-5 mt-1">
              {overBudgetCategories.map((cat, index) => (
                <li key={index} className="text-red-500">
                  <strong>{cat.category}</strong>: ${cat.spent.toFixed(2)} / ${cat.budget.toFixed(2)}(
                  {((cat.spent / cat.budget) * 100).toFixed(0)}%)
                </li>
              ))}
            </ul>
          </>
        )}

        {data.budget.percentUsed < 80 ? (
          <p className="mt-2">You're on track to stay within your budget this month!</p>
        ) : (
          <p className="mt-2">
            You should monitor your spending closely for the rest of the month to stay within budget.
          </p>
        )}
      </div>
    ),
    category: "Budget",
  }
}

function generateIncomeResponse(data: FinancialData): ChatResponse {
  return {
    content: (
      <div>
        <p>
          Your total income this month is <strong>${data.income.total.toFixed(2)}</strong>.
        </p>
        <p className="mt-2">Your income sources:</p>
        <ul className="list-disc pl-5 mt-1">
          {data.income.sources.map((source, index) => (
            <li key={index}>
              <strong>{source.source}</strong>: ${source.amount.toFixed(2)} (
              {((source.amount / data.income.total) * 100).toFixed(1)}% of total)
            </li>
          ))}
        </ul>
        <p className="mt-2">
          Compared to last month, your income has changed by{" "}
          <strong className={data.income.trend.vsLastMonth > 0 ? "text-green-500" : "text-red-500"}>
            {data.income.trend.vsLastMonth > 0 ? "+" : ""}
            {data.income.trend.vsLastMonth}%
          </strong>
          .
        </p>
      </div>
    ),
    category: "Income",
  }
}

function generateSavingsResponse(data: FinancialData): ChatResponse {
  return {
    content: (
      <div>
        <p>
          You've saved <strong>${data.savings.total.toFixed(2)}</strong> this month, which is{" "}
          <strong>{data.savings.percentOfIncome}%</strong> of your income.
        </p>
        <p className="mt-2">
          You're at <strong>{data.savings.progress}%</strong> of your monthly savings goal of $
          {data.savings.goal.toFixed(2)}.
        </p>

        {data.savings.percentOfIncome < 20 ? (
          <p className="mt-2">
            Financial experts recommend saving at least 20% of your income. Consider reviewing your budget to increase
            your savings rate.
          </p>
        ) : (
          <p className="mt-2">Great job! You're saving more than the recommended 20% of your income.</p>
        )}
      </div>
    ),
    category: "Savings",
  }
}

function generateTrendsResponse(data: FinancialData): ChatResponse {
  const lastTwoMonths = data.trends.monthly.slice(-2)
  const currentMonth = lastTwoMonths[1]
  const previousMonth = lastTwoMonths[0]

  const incomeChange = ((currentMonth.income - previousMonth.income) / previousMonth.income) * 100
  const expensesChange = ((currentMonth.expenses - previousMonth.expenses) / previousMonth.expenses) * 100
  const savingsChange = ((currentMonth.savings - previousMonth.savings) / previousMonth.savings) * 100

  return {
    content: (
      <div>
        <p>
          Comparing your finances from {previousMonth.month} to {currentMonth.month}:
        </p>

        <ul className="list-disc pl-5 mt-2">
          <li>
            Income:{" "}
            <strong className={incomeChange >= 0 ? "text-green-500" : "text-red-500"}>
              {incomeChange > 0 ? "+" : ""}
              {incomeChange.toFixed(1)}%
            </strong>
          </li>
          <li>
            Expenses:{" "}
            <strong className={expensesChange <= 0 ? "text-green-500" : "text-red-500"}>
              {expensesChange > 0 ? "+" : ""}
              {expensesChange.toFixed(1)}%
            </strong>
          </li>
          <li>
            Savings:{" "}
            <strong className={savingsChange >= 0 ? "text-green-500" : "text-red-500"}>
              {savingsChange > 0 ? "+" : ""}
              {savingsChange.toFixed(1)}%
            </strong>
          </li>
        </ul>

        <p className="mt-2">
          Over the past 6 months, your average monthly savings has been{" "}
          <strong>
            $
            {(data.trends.monthly.reduce((sum, month) => sum + month.savings, 0) / data.trends.monthly.length).toFixed(
              2,
            )}
          </strong>
          .
        </p>
      </div>
    ),
    category: "Trends",
  }
}

function generatePaymentMethodsResponse(data: FinancialData): ChatResponse {
  const topMethod = data.paymentMethods.sort((a, b) => b.amount - a.amount)[0]

  return {
    content: (
      <div>
        <p>
          Your most used payment method is <strong>{topMethod.method}</strong> with{" "}
          <strong>{topMethod.transactions}</strong> transactions totaling{" "}
          <strong>${topMethod.amount.toFixed(2)}</strong>.
        </p>

        <p className="mt-2">All payment methods this month:</p>
        <ul className="list-disc pl-5 mt-1">
          {data.paymentMethods.map((method, index) => (
            <li key={index}>
              <strong>{method.method}</strong>: ${method.amount.toFixed(2)} ({method.transactions} transactions)
            </li>
          ))}
        </ul>
      </div>
    ),
    category: "Payment Methods",
  }
}

function generateAdviceResponse(data: FinancialData): ChatResponse {
  // Find categories where spending is high relative to total
  const highSpendingCategories = data.expenses.categories
    .filter((cat) => cat.amount / data.expenses.total > 0.1)
    .sort((a, b) => b.amount - a.amount)

  // Find categories that are over budget
  const overBudgetCategories = data.budget.categories
    .filter((cat) => cat.spent > cat.budget)
    .sort((a, b) => b.spent / b.budget - a.spent / a.budget)

  return {
    content: (
      <div>
        <p>Based on your financial data, here are some personalized recommendations:</p>

        <ul className="list-disc pl-5 mt-2">
          {data.savings.percentOfIncome < 20 && (
            <li>Try to increase your savings rate to at least 20% of your income.</li>
          )}

          {overBudgetCategories.length > 0 && (
            <li>
              Focus on reducing spending in {overBudgetCategories[0].category}, where you're currently $
              {(overBudgetCategories[0].spent - overBudgetCategories[0].budget).toFixed(2)} over budget.
            </li>
          )}

          {highSpendingCategories.length > 0 && (
            <li>
              Your highest expense category is {highSpendingCategories[0].category} at $
              {highSpendingCategories[0].amount.toFixed(2)}. Look for ways to optimize this spending.
            </li>
          )}

          {data.income.sources.length < 2 && (
            <li>Consider diversifying your income sources to increase financial stability.</li>
          )}

          <li>Review your subscriptions and recurring expenses to identify potential savings.</li>

          <li>Aim to keep your essential expenses (housing, utilities, food) below 50% of your income.</li>
        </ul>

        <p className="mt-2">Would you like more specific advice on any particular area of your finances?</p>
      </div>
    ),
    category: "Financial Advice",
  }
}

function generateGeneralResponse(): ChatResponse {
  return {
    content: (
      <div>
        <p>I can help you understand your finances better. Here are some things you can ask me about:</p>
        <ul className="list-disc pl-5 mt-2">
          <li>Your spending patterns and top expense categories</li>
          <li>Budget status and where you might be over budget</li>
          <li>Income breakdown and trends</li>
          <li>Savings rate and progress toward goals</li>
          <li>Financial trends over time</li>
          <li>Payment methods and transaction analysis</li>
          <li>Personalized financial advice</li>
        </ul>
        <p className="mt-2">What would you like to know about your finances today?</p>
      </div>
    ),
    category: "Help",
  }
}

