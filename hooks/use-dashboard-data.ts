import useSWR from "swr";
import type { FinancialData } from "@/types/finance";

const fetcher = async (url: string) => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error("Failed to fetch dashboard data");
  }
  return response.json();
};

export function useDashboardData(userId: string) {
  const { data, error, isLoading, mutate } = useSWR<FinancialData>(
    `/api/dashboard?userId=${userId}`,
    fetcher,
    {
      refreshInterval: 30000, // Refresh every 30 seconds
    }
  );

  return {
    data,
    error,
    isLoading,
    mutate,
  };
}
