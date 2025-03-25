import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";

interface DebtStatsProps {
  totalDebt: number;
  totalPaid: number;
  remainingDebt: number;
  activeDebts: number;
  paidDebts: number;
}

export function DebtStats({
  totalDebt,
  totalPaid,
  remainingDebt,
  activeDebts,
  paidDebts,
}: DebtStatsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Debt</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(totalDebt)}</div>
          <p className="text-xs text-muted-foreground">
            Across {activeDebts + paidDebts} debts
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Paid</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(totalPaid)}</div>
          <p className="text-xs text-muted-foreground">
            {((totalPaid / totalDebt) * 100).toFixed(1)}% of total debt
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Remaining Debt</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {formatCurrency(remainingDebt)}
          </div>
          <p className="text-xs text-muted-foreground">
            {((remainingDebt / totalDebt) * 100).toFixed(1)}% remaining
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Active Debts</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{activeDebts}</div>
          <p className="text-xs text-muted-foreground">
            {paidDebts} debts paid off
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
