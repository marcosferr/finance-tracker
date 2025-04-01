import { NextRequest, NextResponse } from "next/server";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// Create a new ratelimiter that allows 100 requests per 60 seconds
const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(100, "60 s"),
  analytics: true,
  prefix: "ratelimit",
});

export async function rateLimit(request: NextRequest) {
  // Get the IP address from the request
  const ip = request.headers.get("x-forwarded-for") ?? "anonymous";

  // Get the path to use as part of the rate limit key
  const path = request.nextUrl.pathname;

  // Create a unique key for this IP and path combination
  const key = `${ip}:${path}`;

  try {
    const { success, limit, reset, remaining } = await ratelimit.limit(key);

    // Add rate limit headers to the response
    const headers = new Headers();
    headers.set("X-RateLimit-Limit", limit.toString());
    headers.set("X-RateLimit-Remaining", remaining.toString());
    headers.set("X-RateLimit-Reset", reset.toString());

    if (!success) {
      return NextResponse.json(
        { error: "Too many requests" },
        { status: 429, headers }
      );
    }

    const response = NextResponse.next();

    // Add rate limit headers to the successful response
    response.headers.set("X-RateLimit-Limit", limit.toString());
    response.headers.set("X-RateLimit-Remaining", remaining.toString());
    response.headers.set("X-RateLimit-Reset", reset.toString());

    return response;
  } catch (error) {
    // If there's an error with rate limiting, we'll allow the request to proceed
    console.error("Rate limiting error:", error);
    return NextResponse.next();
  }
}
