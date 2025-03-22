import { NextResponse } from "next/server";
import { authOptions } from "@/auth";

export async function GET() {
  // Create a providers object in the format NextAuth expects
  const providers = Object.values(authOptions.providers).reduce(
    (acc, provider) => {
      const { id, name, type } = provider;
      acc[id] = {
        id,
        name,
        type,
        signinUrl: `/api/auth/signin/${id}`,
        callbackUrl: `/api/auth/callback/${id}`,
      };
      return acc;
    },
    {} as Record<string, any>
  );

  return NextResponse.json(providers);
}
