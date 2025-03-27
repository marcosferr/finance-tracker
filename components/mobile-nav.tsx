"use client";

import * as React from "react";
import Link from "next/link";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

export function MobileNav() {
  const [open, setOpen] = React.useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" className="md:hidden">
          <Menu className="h-5 w-5" />
          <span className="sr-only">Toggle menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[300px] sm:w-[400px]">
        <SheetHeader>
          <SheetTitle>Navigation</SheetTitle>
        </SheetHeader>
        <nav className="flex flex-col space-y-4 mt-4">
          <Link
            href="/dashboard"
            className="text-sm font-medium"
            onClick={() => setOpen(false)}
          >
            Dashboard
          </Link>
          <Link
            href="/transactions"
            className="text-sm font-medium"
            onClick={() => setOpen(false)}
          >
            Transactions
          </Link>
          <Link
            href="/debts"
            className="text-sm font-medium"
            onClick={() => setOpen(false)}
          >
            Debts
          </Link>
          <Link
            href="/categories"
            className="text-sm font-medium"
            onClick={() => setOpen(false)}
          >
            Categories
          </Link>
          <Link
            href="/chat"
            className="text-sm font-medium"
            onClick={() => setOpen(false)}
          >
            Chat
          </Link>
        </nav>
      </SheetContent>
    </Sheet>
  );
}
