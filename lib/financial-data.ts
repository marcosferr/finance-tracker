import prisma from "@/lib/prisma";

export async function getUserDebts(userId: string) {
  return await prisma.debt.findMany({
    where: {
      userId,
    },
  });
}

export async function getUserFinancialAssets(userId: string) {
  return await prisma.financialAsset.findMany({
    where: {
      userId,
    },
  });
}

export async function getUserAccounts(userId: string) {
  const currentMonth = new Date();
  currentMonth.setDate(1);
  currentMonth.setHours(0, 0, 0, 0);

  const nextMonth = new Date(currentMonth);
  nextMonth.setMonth(nextMonth.getMonth() + 1);

  return await prisma.financialAccount.findMany({
    where: {
      userId,
    },
    include: {
      transactions: {
        where: {
          date: {
            gte: currentMonth,
            lt: nextMonth,
          },
        },
        include: {
          category: true,
        },
      },
    },
  });
}

export async function getUserCategories(userId: string) {
  const currentMonth = new Date();
  currentMonth.setDate(1);
  currentMonth.setHours(0, 0, 0, 0);

  const nextMonth = new Date(currentMonth);
  nextMonth.setMonth(nextMonth.getMonth() + 1);

  return await prisma.category.findMany({
    where: {
      userId,
    },
    include: {
      transactions: {
        where: {
          date: {
            gte: currentMonth,
            lt: nextMonth,
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
