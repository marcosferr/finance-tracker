import { Metadata } from "next";
import FinancialAssetsList from "@/components/financial-assets/FinancialAssetsList";

export const metadata: Metadata = {
  title: "Financial Assets | Finance Tracker",
  description: "Manage your financial assets and investments",
};

export default function FinancialAssetsPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Financial Assets</h1>
      <FinancialAssetsList />
    </div>
  );
}
