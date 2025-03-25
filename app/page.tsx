import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, Upload, Wallet2, MessageSquare } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";

export const metadata: Metadata = {
  title: "Finance Tracker",
  description: "Track and manage your personal finances",
};

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center">
          <div className="mr-4 flex items-center gap-2">
            <Wallet2 className="h-6 w-6" />
            <span className="text-xl font-bold">Finance Tracker</span>
          </div>
          <nav className="flex flex-1 items-center justify-end space-x-4">
            <Link href="/dashboard" className="text-sm font-medium">
              Dashboard
            </Link>
            <Link href="/transactions" className="text-sm font-medium">
              Transactions
            </Link>
            <Link href="/debts" className="text-sm font-medium">
              Debts
            </Link>
            <Link href="/categories" className="text-sm font-medium">
              Categories
            </Link>
            {/* <Link href="/reports" className="text-sm font-medium">
              Reports
            </Link> */}
            <Link href="/chat" className="text-sm font-medium">
              Chat
            </Link>
            <ThemeToggle />
          </nav>
        </div>
      </header>
      <main className="flex-1">
        <section className="w-full py-12 md:py-24 lg:py-32">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl">
                  Take Control of Your Finances
                </h1>
                <p className="mx-auto max-w-[700px] text-muted-foreground md:text-xl">
                  Track your income and expenses, categorize transactions, and
                  gain insights into your spending habits.
                </p>
              </div>
              <div className="flex flex-col gap-2 min-[400px]:flex-row">
                <Link href="/dashboard">
                  <Button size="lg">
                    Get Started
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
                <Link href="/chat">
                  <Button size="lg" variant="outline">
                    Chat with AI Assistant
                    <MessageSquare className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>
        <section className="w-full py-12 md:py-24 lg:py-32 bg-muted">
          <div className="container px-4 md:px-6">
            <div className="grid gap-6 lg:grid-cols-3 lg:gap-12">
              <div className="flex flex-col justify-center space-y-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <Wallet2 className="h-6 w-6" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-bold">Track Transactions</h3>
                  <p className="text-muted-foreground">
                    Easily record and categorize your income and expenses to
                    keep track of your financial activities.
                  </p>
                </div>
              </div>
              <div className="flex flex-col justify-center space-y-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <Upload className="h-6 w-6" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-bold">Import Data</h3>
                  <p className="text-muted-foreground">
                    Upload transaction data from CSV or Excel files to quickly
                    populate your financial records.
                  </p>
                </div>
              </div>
              <div className="flex flex-col justify-center space-y-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <MessageSquare className="h-6 w-6" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-bold">AI Financial Assistant</h3>
                  <p className="text-muted-foreground">
                    Chat with our AI assistant to get insights, analyze spending
                    patterns, and receive personalized financial advice.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
      <footer className="w-full border-t py-6">
        <div className="container flex flex-col items-center justify-between gap-4 md:flex-row">
          <p className="text-center text-sm leading-loose text-muted-foreground">
            © 2024 Finance Tracker. All rights reserved.
          </p>
          <nav className="flex gap-4">
            <Link href="#" className="text-sm font-medium hover:underline">
              Terms
            </Link>
            <Link href="#" className="text-sm font-medium hover:underline">
              Privacy
            </Link>
            <Link href="#" className="text-sm font-medium hover:underline">
              Contact
            </Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
