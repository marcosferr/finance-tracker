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

    const settings = await prisma.userSettings.findUnique({
      where: {
        userId: user.id,
      },
    });

    if (!settings) {
      // Create default settings if they don't exist
      const defaultSettings = await prisma.userSettings.create({
        data: {
          userId: user.id,
          theme: "light",
          currency: "USD",
          language: "en",
          openaiApiKey: null,
        },
      });

      return NextResponse.json(defaultSettings);
    }

    return NextResponse.json(settings);
  } catch (error) {
    console.error("Error fetching settings:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await getAuthSession();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = session.user as User;

    const { theme, currency, language, openaiApiKey } = await req.json();

    // Get existing settings or create if they don't exist
    let settings = await prisma.userSettings.findUnique({
      where: {
        userId: user.id,
      },
    });

    if (!settings) {
      settings = await prisma.userSettings.create({
        data: {
          userId: user.id,
          theme: theme || "light",
          currency: currency || "USD",
          language: language || "en",
          openaiApiKey: openaiApiKey || null,
        },
      });
    } else {
      // Update existing settings
      settings = await prisma.userSettings.update({
        where: {
          userId: user.id,
        },
        data: {
          theme: theme !== undefined ? theme : undefined,
          currency: currency !== undefined ? currency : undefined,
          language: language !== undefined ? language : undefined,
          openaiApiKey: openaiApiKey !== undefined ? openaiApiKey : undefined,
        },
      });
    }

    return NextResponse.json(settings);
  } catch (error) {
    console.error("Error updating settings:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
