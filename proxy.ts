import { NextResponse, NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";

// In-memory cache: domain → { studioId, expiresAt }
const domainCache = new Map<
  string,
  { studioId: string; expiresAt: number }
>();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

async function resolveStudioId(host: string): Promise<string | null> {
  // Strip port for local dev (e.g. localhost:3000)
  const domain = host.split(":")[0];

  // Check cache
  const cached = domainCache.get(domain);
  if (cached && Date.now() < cached.expiresAt) {
    return cached.studioId;
  }

  // Query studios table using service role (no user session in middleware)
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  const { data } = await supabase
    .from("studios")
    .select("id")
    .eq("domain", domain)
    .single();

  if (!data) return null;

  // Cache the result
  domainCache.set(domain, {
    studioId: data.id,
    expiresAt: Date.now() + CACHE_TTL_MS,
  });

  return data.id;
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ── 1. Resolve studio ID ──────────────────────────────────────────
  let studioId: string | null = null;

  if (process.env.NEXT_PUBLIC_STUDIO_ID) {
    // Local dev fallback
    studioId = process.env.NEXT_PUBLIC_STUDIO_ID;
  } else {
    const host = request.headers.get("host") ?? "";
    studioId = await resolveStudioId(host);

    if (!studioId) {
      return NextResponse.redirect("https://useforma.co.uk");
    }
  }

  // ── 2. Inject x-studio-id into request headers ────────────────────
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-studio-id", studioId);

  const modifiedRequest = new Request(request.url, {
    headers: requestHeaders,
    method: request.method,
    body: request.body,
    redirect: request.redirect,
    signal: request.signal,
    // @ts-expect-error -- duplex is required by the runtime when body is a ReadableStream but not yet in all TS types
    duplex: "half",
  });
  const nextRequest = new NextRequest(modifiedRequest);
  // Copy cookies from original request (NextRequest constructor doesn't always preserve them)
  for (const cookie of request.cookies.getAll()) {
    nextRequest.cookies.set(cookie.name, cookie.value);
  }

  // ── 3. Refresh the Supabase session cookie ────────────────────────
  let supabaseResponse = NextResponse.next({
    request: { headers: requestHeaders },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return nextRequest.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            nextRequest.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request: { headers: requestHeaders },
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  await supabase.auth.getUser();

  // ── 4. Protected route checks ─────────────────────────────────────
  const isAccountRoute = pathname.startsWith("/account");
  const isStaffRoute = pathname.startsWith("/staff");
  const isDashboardRoute = pathname.startsWith("/dashboard");

  if (!isAccountRoute && !isStaffRoute && !isDashboardRoute) {
    return supabaseResponse;
  }

  // Create a Supabase client scoped to this request for auth checks
  const authClient = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return nextRequest.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await authClient.auth.getUser();

  // Not authenticated — redirect to login
  if (!user) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // For staff/dashboard routes, check role
  if (isStaffRoute || isDashboardRoute) {
    const { data: membership } = await authClient
      .from("studio_memberships")
      .select("role")
      .eq("profile_id", user.id)
      .eq("studio_id", studioId)
      .single();

    const role = membership?.role;

    if (isStaffRoute && role !== "staff" && role !== "admin") {
      return NextResponse.redirect(new URL("/account", request.url));
    }

    if (isDashboardRoute && role !== "admin") {
      return NextResponse.redirect(new URL("/account", request.url));
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    /*
     * Run on all routes except:
     * - _next/static, _next/image (static assets)
     * - favicon.ico, icon.svg, sitemap.xml (metadata files)
     * - public folder assets (images, fonts)
     */
    "/((?!_next/static|_next/image|favicon.ico|icon.svg|sitemap.xml|.*\\.(?:png|jpg|jpeg|gif|svg|webp|ico|woff|woff2|ttf|eot)$).*)",
  ],
};
