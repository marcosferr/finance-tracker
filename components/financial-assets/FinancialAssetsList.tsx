"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Plus } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { format } from "date-fns";
import type { FinancialAsset } from "@/types/finance";
import useSWR from "swr";

const fetcher = async (url: string) => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error("Failed to fetch data");
  }
  const data = await response.json();
  // Ensure we always return an array
  return Array.isArray(data) ? data : [];
};

export default function FinancialAssetsList() {
  const {
    data: assets = [], // Provide empty array as default value
    error,
    mutate,
  } = useSWR<FinancialAsset[]>("/api/financial-assets", fetcher);
  const [isCreating, setIsCreating] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const handleCreateAsset = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsCreating(true);

    const formData = new FormData(e.currentTarget);
    const assetData = {
      name: formData.get("name"),
      type: formData.get("type"),
      amount: parseFloat(formData.get("amount") as string),
      interestRate: parseFloat(formData.get("interestRate") as string),
      provider: formData.get("provider"),
      maturityDate: formData.get("maturityDate"),
      notes: formData.get("notes"),
    };

    try {
      const response = await fetch("/api/financial-assets", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(assetData),
      });

      if (!response.ok) {
        throw new Error("Failed to create financial asset");
      }

      const newAsset = await response.json();
      mutate([...(assets || []), newAsset]);
      toast({
        title: "Success",
        description: "Financial asset created successfully",
      });
      setIsCreating(false);
      router.refresh();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create financial asset",
        variant: "destructive",
      });
      setIsCreating(false);
    }
  };

  if (error) {
    return <div>Failed to load financial assets</div>;
  }

  if (!assets) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold">Your Financial Assets</h2>
        <Dialog>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add Asset
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Financial Asset</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateAsset} className="space-y-4">
              <div>
                <Label htmlFor="name">Asset Name</Label>
                <Input id="name" name="name" required />
              </div>
              <div>
                <Label htmlFor="type">Asset Type</Label>
                <Select name="type" required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CDA">CDA</SelectItem>
                    <SelectItem value="ETF">ETF</SelectItem>
                    <SelectItem value="MUTUAL_FUND">Mutual Fund</SelectItem>
                    <SelectItem value="STOCK">Stock</SelectItem>
                    <SelectItem value="BOND">Bond</SelectItem>
                    <SelectItem value="OTHER">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="amount">Amount</Label>
                <Input
                  id="amount"
                  name="amount"
                  type="number"
                  step="0.01"
                  required
                />
              </div>
              <div>
                <Label htmlFor="interestRate">Interest Rate (%)</Label>
                <Input
                  id="interestRate"
                  name="interestRate"
                  type="number"
                  step="0.01"
                  required
                />
              </div>
              <div>
                <Label htmlFor="provider">Provider (Optional)</Label>
                <Input id="provider" name="provider" />
              </div>
              <div>
                <Label htmlFor="maturityDate">Maturity Date (Optional)</Label>
                <Input id="maturityDate" name="maturityDate" type="date" />
              </div>
              <div>
                <Label htmlFor="notes">Notes (Optional)</Label>
                <Input id="notes" name="notes" />
              </div>
              <Button type="submit" disabled={isCreating}>
                {isCreating ? "Creating..." : "Create Asset"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.isArray(assets) &&
          assets.map((asset) => (
            <Card key={asset.id}>
              <CardHeader>
                <CardTitle>{asset.name}</CardTitle>
                <CardDescription>{asset.type}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Amount:</span>
                    <span className="font-medium">
                      ${asset.amount.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Interest Rate:</span>
                    <span className="font-medium">{asset.interestRate}%</span>
                  </div>
                  {asset.provider && (
                    <div className="flex justify-between">
                      <span>Provider:</span>
                      <span className="font-medium">{asset.provider}</span>
                    </div>
                  )}
                  {asset.maturityDate && (
                    <div className="flex justify-between">
                      <span>Maturity Date:</span>
                      <span className="font-medium">
                        {format(new Date(asset.maturityDate), "PP")}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span>Status:</span>
                    <span className="font-medium">{asset.status}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
      </div>
    </div>
  );
}
