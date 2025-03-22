"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AccountsTable } from "@/components/accounts-table";
import { AddAccountDialog } from "@/components/add-account-dialog";

export default function AccountsPage() {
  return (
    <div className="flex-1 space-y-4 p-4 pt-6 md:p-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Accounts</h2>
          <p className="text-muted-foreground">
            Manage your financial accounts
          </p>
        </div>
        <AddAccountDialog />
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Your Accounts</CardTitle>
          <CardDescription>
            View and manage your financial accounts
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AccountsTable />
        </CardContent>
      </Card>
    </div>
  );
}
