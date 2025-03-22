"use client";

import { useEffect, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { EditAccountDialog } from "./edit-account-dialog";
import { DeleteAccountDialog } from "./delete-account-dialog";
import { FinancialAccount } from "@prisma/client";
import { AVAILABLE_CURRENCIES, Currency } from "@/types/finance";

export function AccountsTable() {
  const [accounts, setAccounts] = useState<FinancialAccount[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAccounts();
  }, []);

  const fetchAccounts = async () => {
    try {
      const response = await fetch("/api/accounts");
      if (!response.ok) throw new Error("Failed to fetch accounts");
      const data = await response.json();
      setAccounts(data);
    } catch (error) {
      console.error("Error fetching accounts:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div>Loading accounts...</div>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Type</TableHead>
          <TableHead>Balance</TableHead>
          <TableHead>Currency</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {accounts.map((account) => (
          <TableRow key={account.id}>
            <TableCell className="font-medium">{account.name}</TableCell>
            <TableCell className="capitalize">
              {account.type.toLowerCase()}
            </TableCell>
            <TableCell>
              {new Intl.NumberFormat("en-US", {
                style: "currency",
                currency: account.currency as Currency,
              }).format(account.balance)}
            </TableCell>
            <TableCell>
              {account.currency} (
              {AVAILABLE_CURRENCIES[account.currency as Currency]})
            </TableCell>
            <TableCell className="text-right">
              <div className="flex justify-end gap-2">
                <EditAccountDialog
                  account={account}
                  onAccountUpdated={fetchAccounts}
                />
                <DeleteAccountDialog
                  account={account}
                  onAccountDeleted={fetchAccounts}
                />
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
