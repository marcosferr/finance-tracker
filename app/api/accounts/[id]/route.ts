import { NextResponse } from "next/server";
import { getAuthSession } from "@/auth";
import prisma from "@/lib/prisma";
import { User } from "@prisma/client";

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getAuthSession();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = session.user as User;

    const account = await prisma.financialAccount.findUnique({
      where: {
        id: params.id,
        userId: user.id,
      },
    });

    if (!account) {
      return NextResponse.json({ error: "Account not found" }, { status: 404 });
    }

    return NextResponse.json(account);
  } catch (error) {
    console.error("Error fetching account:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
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

    // Check if account exists and belongs to user
    const existingAccount = await prisma.financialAccount.findFirst({
      where: {
        id: params.id,
        userId: user.id,
      },
    });

    if (!existingAccount) {
      return NextResponse.json({ error: "Account not found" }, { status: 404 });
    }

    // Check if new name conflicts with existing account
    if (name !== existingAccount.name) {
      const nameConflict = await prisma.financialAccount.findFirst({
        where: {
          name,
          userId: user.id,
          NOT: {
            id: params.id,
          },
        },
      });

      if (nameConflict) {
        return NextResponse.json(
          { error: "Account with this name already exists" },
          { status: 400 }
        );
      }
    }

    const account = await prisma.financialAccount.update({
      where: {
        id: params.id,
      },
      data: {
        name,
        type,
        balance: balance ? Number.parseFloat(balance) : 0,
        currency,
      },
    });

    return NextResponse.json(account);
  } catch (error) {
    console.error("Error updating account:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getAuthSession();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = session.user as User;

    // Check if account exists and belongs to user
    const account = await prisma.financialAccount.findFirst({
      where: {
        id: params.id,
        userId: user.id,
      },
    });

    if (!account) {
      return NextResponse.json({ error: "Account not found" }, { status: 404 });
    }

    // Delete the account
    await prisma.financialAccount.delete({
      where: {
        id: params.id,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting account:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
