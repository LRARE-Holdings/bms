import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { updateSession } from "@/lib/supabase/proxy";

export async function proxy(request: NextRequest) {
  // 1. Always refresh the Supabase session cookie
  const response = await updateSession(request);

  const { pathname } = request.nextUrl;

  // 2. Protected route checks
  const isAccountRoute = pathname.startsWith("/account");
  const isStaffRoute = pathname.startsWith("/staff");
  const isDashboardRoute = pathname.startsWith("/dashboard");

  if (!isAccountRoute && !isStaffRoute && !isDashboardRoute) {
    return response;
  }

  // Create a Supabase client scoped to this request
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Not authenticated — redirect to login
  if (!user) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // For staff/dashboard routes, check role
  if (isStaffRoute || isDashboardRoute) {
    const studioId = process.env.NEXT_PUBLIC_STUDIO_ID!;
    const { data: membership } = await supabase
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

  return response;
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
