import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Debt } from "@/types/finance";

interface DebtModalProps {
  isOpen: boolean;
  onClose: () => void;
  debt?: Debt;
  onSave: (debt: Partial<Debt>) => Promise<void>;
}

export function DebtModal({ isOpen, onClose, debt, onSave }: DebtModalProps) {
  const [formData, setFormData] = useState<Partial<Debt>>(
    debt || {
      name: "",
      totalAmount: 0,
      paidAmount: 0,
      interestRate: 0,
      dueDate: undefined,
      notes: "",
      status: "ACTIVE",
    }
  );

  useEffect(() => {
    if (debt) {
      setFormData(debt);
    } else {
      setFormData({
        name: "",
        totalAmount: 0,
        paidAmount: 0,
        interestRate: 0,
        dueDate: undefined,
        notes: "",
        status: "ACTIVE",
      });
    }
  }, [debt]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await onSave(formData);
    } catch (error) {
      console.error("Error saving debt:", error);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        name === "totalAmount" ||
        name === "paidAmount" ||
        name === "interestRate"
          ? parseFloat(value) || 0
          : name === "dueDate"
          ? value
            ? new Date(value).toISOString()
            : undefined
          : value,
    }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{debt ? "Edit Debt" : "Add New Debt"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Enter debt name"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="totalAmount">Total Amount</Label>
            <Input
              id="totalAmount"
              name="totalAmount"
              type="number"
              step="0.01"
              value={formData.totalAmount}
              onChange={handleChange}
              placeholder="Enter total amount"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="paidAmount">Paid Amount</Label>
            <Input
              id="paidAmount"
              name="paidAmount"
              type="number"
              step="0.01"
              value={formData.paidAmount}
              onChange={handleChange}
              placeholder="Enter paid amount"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="interestRate">Interest Rate (%)</Label>
            <Input
              id="interestRate"
              name="interestRate"
              type="number"
              step="0.01"
              value={formData.interestRate}
              onChange={handleChange}
              placeholder="Enter interest rate"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="dueDate">Due Date</Label>
            <Input
              id="dueDate"
              name="dueDate"
              type="date"
              value={
                formData.dueDate
                  ? new Date(formData.dueDate).toISOString().split("T")[0]
                  : ""
              }
              onChange={handleChange}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Input
              id="notes"
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              placeholder="Add notes (optional)"
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">{debt ? "Update" : "Add"} Debt</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
