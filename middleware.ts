// Auth.js v5 middleware. Protects routes that require login.
// Public routes are listed explicitly so it's easy to audit.

import { auth } from "@/auth";
import { NextResponse } from "next/server";

// US states where the regulatory environment around even friendly wagers is
// strict. Show an interstitial; let the user continue if they want. Set
// cookie `geo-ack=1` to silence after acknowledgment.
const RESTRICTIVE_US_REGIONS = new Set(["WA", "HI", "ID", "UT"]);

const PUBLIC_PATHS = [
  "/",
  "/login",
  "/about",
  "/terms",
  "/privacy",
  "/faq",
  "/geo-notice",
];

const PUBLIC_PREFIXES = [
  "/api/", // auth handlers, cron, etc.
  "/u/", // public profile pages
  "/_next",
  "/favicon",
];

const RESERVED_TOP_PATHS = new Set([
  "start",
  "dashboard",
  "feed",
  "settings",
  "admin",
  "welcome",
]);

export default auth((req) => {
  const { pathname } = req.nextUrl;

  // Geo interstitial — run before everything else.
  if (!pathname.startsWith("/api/") && !pathname.startsWith("/_next")) {
    const country = req.headers.get("x-vercel-ip-country");
    const region = req.headers.get("x-vercel-ip-country-region");
    const geoAck = req.cookies.get("geo-ack")?.value === "1";
    if (
      country === "US" &&
      region &&
      RESTRICTIVE_US_REGIONS.has(region) &&
      !geoAck &&
      pathname !== "/geo-notice"
    ) {
      const url = req.nextUrl.clone();
      url.pathname = "/geo-notice";
      url.searchParams.set("next", pathname);
      return NextResponse.redirect(url);
    }
  }

  if (PUBLIC_PATHS.includes(pathname)) return NextResponse.next();
  if (PUBLIC_PREFIXES.some((p) => pathname.startsWith(p))) return NextResponse.next();

  // Wager pages /:slug — readable by anyone with the link.
  const top = pathname.split("/").filter(Boolean)[0];
  const isWagerSlug = top && !RESERVED_TOP_PATHS.has(top);
  if (isWagerSlug) return NextResponse.next();

  // Auth-gated routes.
  if (!req.auth) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  // Welcome gate: signed in but not age-verified → bounce to /welcome.
  // Exception: /welcome itself, otherwise infinite redirect.
  const user = req.auth.user as
    | { id?: string; ageVerified?: boolean }
    | undefined;
  if (
    user &&
    user.ageVerified === false &&
    pathname !== "/welcome"
  ) {
    const url = req.nextUrl.clone();
    url.pathname = "/welcome";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
});

export const config = {
  // Run on everything except static assets.
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
