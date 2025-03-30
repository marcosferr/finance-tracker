import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(
  amount: number,
  currency: string = "PYG"
): string {
  if (currency === "PYG") {
    // Simple integer formatting for PYG
    return Math.round(amount).toLocaleString() + " ₲";
  }

  // For other currencies, use the standard currency format
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency,
    }).format(amount);
  } catch (error) {
    return amount.toLocaleString() + " " + currency;
  }
}
