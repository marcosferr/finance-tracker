"use client";

import { useState, useEffect } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DebtCard } from "@/components/debts/DebtCard";
import { DebtModal } from "@/components/debts/DebtModal";
import { DebtStats } from "@/components/debts/DebtStats";
import { Debt } from "@/types/finance";
import { toast } from "sonner";

export default function DebtsPage() {
  const [debts, setDebts] = useState<Debt[]>([]);
  const [stats, setStats] = useState({
    totalDebt: 0,
    totalPaid: 0,
    remainingDebt: 0,
    activeDebts: 0,
    paidDebts: 0,
  });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDebt, setSelectedDebt] = useState<Debt | undefined>();
  const [isLoading, setIsLoading] = useState(false);

  const loadDebts = async () => {
    try {
      setIsLoading(true);
      const [debtsResponse, statsResponse] = await Promise.all([
        fetch("/api/debts"),
        fetch("/api/debts/stats"),
      ]);

      if (!debtsResponse.ok || !statsResponse.ok) {
        throw new Error("Failed to fetch data");
      }

      const debtsData = await debtsResponse.json();
      const statsData = await statsResponse.json();

      setDebts(debtsData);
      setStats(statsData);
    } catch (error) {
      console.error("Error loading debts:", error);
      toast.error("Failed to load debts");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDebts();
  }, []);

  const handleAddDebt = () => {
    setSelectedDebt(undefined);
    setIsModalOpen(true);
  };

  const handleEditDebt = (debt: Debt) => {
    setSelectedDebt(debt);
    setIsModalOpen(true);
  };

  const handleDeleteDebt = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this debt?")) {
      try {
        const response = await fetch(`/api/debts/${id}`, {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to delete debt");
        }

        setDebts((prevDebts) => prevDebts.filter((debt) => debt.id !== id));
        toast.success("Debt deleted successfully");

        loadDebts();
      } catch (error) {
        console.error("Error deleting debt:", error);
        toast.error(
          error instanceof Error ? error.message : "Failed to delete debt"
        );
      }
    }
  };

  const handleSaveDebt = async (debtData: Partial<Debt>) => {
    try {
      const url = debtData.id ? `/api/debts/${debtData.id}` : "/api/debts";
      const method = debtData.id ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(debtData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || `Failed to ${debtData.id ? "update" : "create"} debt`
        );
      }

      toast.success(`Debt ${debtData.id ? "updated" : "created"} successfully`);
      loadDebts();
      setIsModalOpen(false);
    } catch (error) {
      console.error("Error saving debt:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : `Failed to ${debtData.id ? "update" : "create"} debt`
      );
    }
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Debts</h1>
        <Button onClick={handleAddDebt}>
          <Plus className="h-4 w-4 mr-2" />
          Add Debt
        </Button>
      </div>

      <DebtStats {...stats} />

      {isLoading ? (
        <div className="text-center py-8">Loading...</div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {debts.map((debt) => (
            <DebtCard
              key={debt.id}
              debt={debt}
              onEdit={handleEditDebt}
              onDelete={handleDeleteDebt}
            />
          ))}
          {debts.length === 0 && (
            <div className="col-span-full text-center py-8 text-muted-foreground">
              No debts found. Add one to get started!
            </div>
          )}
        </div>
      )}

      <DebtModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        debt={selectedDebt}
        onSave={handleSaveDebt}
      />
    </div>
  );
}
