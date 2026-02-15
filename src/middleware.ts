import { NextRequest, NextResponse, NextFetchEvent } from "next/server";
import { withAuth } from "next-auth/middleware";

const RATE_LIMIT_WINDOW_MS = 60_000;
const DEFAULT_LIMIT = 300;

interface RateLimitRule {
  pattern: RegExp;
  limit: number;
}

type RateLimitState = {
  count: number;
  resetTime: number;
};

const rateLimitRules: RateLimitRule[] = [
  { pattern: /^\/api\/auth\/(signin|callback\/credentials)/i, limit: 20 },
  { pattern: /^\/api\/register/i, limit: 15 },
  { pattern: /^\/api\/password-reset/i, limit: 12 },
  { pattern: /^\/api\/email\/(resetpassword|confirmreset|setpassword)/i, limit: 12 },
  { pattern: /^\/api\/users\/(request-email-verification|request-phone-verification)/i, limit: 12 },
  { pattern: /^\/api\/users\/two-factor/i, limit: 20 },
  { pattern: /^\/api\/checkout/i, limit: 40 },
  { pattern: /^\/api\/reservations/i, limit: 40 },
];

const rateLimitStore = new Map<string, RateLimitState>();
const protectedPaths = new Set(["/trips", "/reservations", "/properties", "/favorites"]);

function getClientIdentifier(request: NextRequest) {
  return (
    request.ip ||
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "anonymous"
  );
}

function getRouteLimit(pathname: string) {
  const matchedRule = rateLimitRules.find((rule) => rule.pattern.test(pathname));
  return matchedRule?.limit ?? DEFAULT_LIMIT;
}

function enforceRateLimiting(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const limit = getRouteLimit(pathname);
  const clientKey = `${getClientIdentifier(request)}:${limit}`;
  const now = Date.now();
  const existing = rateLimitStore.get(clientKey);

  if (!existing || existing.resetTime <= now) {
    rateLimitStore.set(clientKey, {
      count: 1,
      resetTime: now + RATE_LIMIT_WINDOW_MS,
    });
    return null;
  }

  if (existing.count >= limit) {
    const retryAfterSeconds = Math.ceil((existing.resetTime - now) / 1000);
    const response = NextResponse.json(
      { message: "Too many requests. Please slow down and try again." },
      { status: 429 }
    );

    response.headers.set("Retry-After", retryAfterSeconds.toString());
    return applySecurityHeaders(response);
  }

  rateLimitStore.set(clientKey, {
    count: existing.count + 1,
    resetTime: existing.resetTime,
  });

  return null;
}

function applySecurityHeaders(response: Response) {
   response.headers.set("X-Frame-Options", "SAMEORIGIN");
   response.headers.set("X-Content-Type-Options", "nosniff");
   response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
   response.headers.set("Permissions-Policy", "geolocation=(), microphone=(), camera=()");
   if (process.env.NODE_ENV === "production") {
    response.headers.set(
      "Strict-Transport-Security",
      "max-age=31536000; includeSubDomains; preload"
    );
   }
   return response;
 }

const authMiddleware = withAuth({
  pages: {
    signIn: "/",
  },
  callbacks: {
    authorized: ({ token }) => {
      const jwt = token as { blocked?: boolean; isSuspended?: boolean } | null;
      return Boolean(jwt && !jwt.blocked && !jwt.isSuspended);
    },
  },
});

export async function middleware(request: NextRequest, event: NextFetchEvent) {
   const pathname = request.nextUrl.pathname;

   if (pathname.startsWith("/api/")) {
     const rateLimited = enforceRateLimiting(request);
     if (rateLimited) {
       return rateLimited;
     }
     return applySecurityHeaders(NextResponse.next());
   }

  if (protectedPaths.has(pathname)) {
    const result = await authMiddleware(request as any, event);

    if (!result) {
      return applySecurityHeaders(NextResponse.next());
    }  

    if (result instanceof Response) {
      return applySecurityHeaders(result);
    }

    return result;
  }

  return applySecurityHeaders(NextResponse.next());
}

export const config = {
  matcher: ["/api/:path*", "/trips", "/reservations", "/properties", "/favorites"],
};
