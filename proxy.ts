import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

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
          response = NextResponse.next({
            request,
          });
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

  const pathname = request.nextUrl.pathname;
  const rawRole = user?.user_metadata?.role || "member";
  const role = rawRole === "normaluser" ? "member" : rawRole;

  // General auth protection
  const isProtectedRoute =
    pathname.startsWith("/Dashboard") ||
    pathname.startsWith("/reportissue") ||
    pathname.startsWith("/admindashboard");

  if (isProtectedRoute && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    // Clear any potentially stale session cookies
    const response = NextResponse.redirect(url);
    response.cookies.delete("sb-access-token");
    response.cookies.delete("sb-refresh-token");
    return response;
  }

  // Role-based protection when logged in
  if (user) {
    // Admins are redirected to /admindashboard if visiting normal user dashboard or root
    if (
      role === "admin" &&
      (pathname === "/" || pathname.startsWith("/Dashboard"))
    ) {
      const url = request.nextUrl.clone();
      url.pathname = "/admindashboard";
      return NextResponse.redirect(url);
    }

    if (role !== "admin" && pathname.startsWith("/admindashboard")) {
      const url = request.nextUrl.clone();
      url.pathname = "/Dashboard";
      return NextResponse.redirect(url);
    }
  }

  const isAuthRoute =
    pathname === "/" ||
    pathname.startsWith("/Register") ||
    pathname.startsWith("/forgotpassword");

  if (isAuthRoute && user) {
    const url = request.nextUrl.clone();
    url.pathname = role === "admin" ? "/admindashboard" : "/Dashboard";
    // Avoid redirecting if we are already where we need to be
    if (pathname === url.pathname) {
      return response;
    }
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|css|js)$).*)",
  ],
};
