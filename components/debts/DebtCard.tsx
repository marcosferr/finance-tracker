import { Card, CardContent } from "@/components/ui/card";
import { Debt } from "@/types/finance";
import { formatCurrency } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2 } from "lucide-react";

interface DebtCardProps {
  debt: Debt;
  onEdit: (debt: Debt) => void;
  onDelete: (id: string) => void;
}

export function DebtCard({ debt, onEdit, onDelete }: DebtCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return "bg-yellow-500";
      case "PAID":
        return "bg-green-500";
      case "DEFAULTED":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  const progressPercentage = (debt.paidAmount / debt.totalAmount) * 100;

  return (
    <Card className="w-full">
      <CardContent className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-lg font-semibold">{debt.name}</h3>
            <p className="text-sm text-gray-500">
              {debt.dueDate &&
                `Due: ${new Date(debt.dueDate).toLocaleDateString()}`}
            </p>
          </div>
          <Badge className={getStatusColor(debt.status)}>{debt.status}</Badge>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-sm text-gray-500">Total Amount</span>
            <span className="font-medium">
              {formatCurrency(debt.totalAmount)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-gray-500">Paid Amount</span>
            <span className="font-medium">
              {formatCurrency(debt.paidAmount)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-gray-500">Remaining</span>
            <span className="font-medium">
              {formatCurrency(debt.totalAmount - debt.paidAmount)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-gray-500">Interest Rate</span>
            <span className="font-medium">{debt.interestRate}%</span>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-4">
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div
              className="bg-primary h-2.5 rounded-full"
              style={{ width: `${Math.min(progressPercentage, 100)}%` }}
            ></div>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            {progressPercentage.toFixed(1)}% paid
          </p>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" size="sm" onClick={() => onEdit(debt)}>
            <Pencil className="h-4 w-4 mr-1" />
            Edit
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => onDelete(debt.id)}
          >
            <Trash2 className="h-4 w-4 mr-1" />
            Delete
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
