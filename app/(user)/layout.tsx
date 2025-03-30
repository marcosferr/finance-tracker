import type React from "react";
import { MainNav } from "@/components/main-nav";
import { UserNav } from "@/components/user-nav";
import { ThemeToggle } from "@/components/theme-toggle";
import { Wallet2 } from "lucide-react";
import { MobileNav } from "@/components/mobile-nav";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <MobileNav />
            <Wallet2 className="h-6 w-6" />
            <span className="text-xl font-bold">Finance Tracker</span>
          </div>
          <div className="ml-auto flex items-center gap-4">
            <ThemeToggle />
            <UserNav />
          </div>
        </div>
      </header>
      <div className="flex flex-1 overflow-hidden">
        <aside className="hidden w-[200px] flex-col border-r md:flex">
          <MainNav />
        </aside>
        <main className="flex-1 overflow-hidden">{children}</main>
      </div>
    </div>
  );
}
