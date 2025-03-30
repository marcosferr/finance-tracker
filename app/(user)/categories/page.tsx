"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CategoriesTable } from "@/components/categories-table";
import { AddCategoryDialog } from "@/components/add-category-dialog";

export default function CategoriesPage() {
  return (
    <div className="flex-1 space-y-4 p-4 pt-6 md:p-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Categories</h2>
          <p className="text-muted-foreground">
            Manage your expense categories and budgets
          </p>
        </div>
        <AddCategoryDialog />
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Your Categories</CardTitle>
          <CardDescription>
            View and manage your expense categories
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CategoriesTable />
        </CardContent>
      </Card>
    </div>
  );
}
