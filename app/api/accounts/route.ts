import { NextResponse } from "next/server";
import { getAuthSession } from "@/auth";
import prisma from "@/lib/prisma";
import { User } from "@prisma/client";

export async function GET() {
  try {
    const session = await getAuthSession();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = session.user as User;

    const accounts = await prisma.financialAccount.findMany({
      where: {
        userId: user.id,
      },
      orderBy: {
        name: "asc",
      },
    });

    return NextResponse.json(accounts);
  } catch (error) {
    console.error("Error fetching accounts:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const session = await getAuthSession();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = session.user as User;

    const { name, type, balance, currency } = await req.json();

    if (!name || !type || !currency) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Check if account with same name already exists
    const existingAccount = await prisma.financialAccount.findFirst({
      where: {
        name,
        userId: user.id,
      },
    });

    if (existingAccount) {
      return NextResponse.json(
        { error: "Account with this name already exists" },
        { status: 400 }
      );
    }

    const account = await prisma.financialAccount.create({
      data: {
        name,
        type,
        balance: balance ? Number.parseFloat(balance) : 0,
        currency,
        userId: user.id,
      },
    });

    return NextResponse.json(account, { status: 201 });
  } catch (error) {
    console.error("Error creating account:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
