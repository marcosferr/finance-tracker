import prisma from "@/lib/prisma";

export async function getUserDebts(userId: string) {
  return await prisma.debt.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });
}

export async function getUserFinancialAssets(userId: string) {
  return await prisma.financialAsset.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });
}

export async function getUserAccounts(userId: string) {
  return await prisma.financialAccount.findMany({
    where: { userId },
    include: {
      transactions: {
        where: {
          date: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
            lte: new Date(
              new Date().getFullYear(),
              new Date().getMonth() + 1,
              0
            ),
          },
        },
      },
    },
  });
}

export async function getUserCategories(userId: string) {
  return await prisma.category.findMany({
    where: { userId },
    include: {
      transactions: {
        where: {
          date: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
            lte: new Date(
              new Date().getFullYear(),
              new Date().getMonth() + 1,
              0
            ),
          },
        },
      },
    },
  });
}

export async function getUserTransactions(
  userId: string,
  startDate: Date,
  endDate: Date
) {
  return await prisma.transaction.findMany({
    where: {
      userId,
      date: {
        gte: startDate,
        lte: endDate,
      },
    },
    include: {
      category: true,
      account: true,
    },
    orderBy: {
      date: "desc",
    },
  });
}
