import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

type CookieToSet = {
  name: string;
  value: string;
  options?: Record<string, unknown>;
};

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Do not crash middleware if env is missing; let request continue.
  if (!supabaseUrl || !supabaseAnonKey) {
    return supabaseResponse;
  }

  const supabase = createServerClient<any>(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: CookieToSet[]) {
          cookiesToSet.forEach(({ name, value, options }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  try {
    await supabase.auth.getUser();
  } catch {
    // Avoid hard-failing middleware due to auth network/runtime issues.
    return supabaseResponse;
  }

  // Protected routes
//  const protectedPaths = ["/dashboard", "/settings", "/availability", "/event-types"];
//  const isProtected = protectedPaths.some((p) => request.nextUrl.pathname.startsWith(p));
//
//  if (isProtected && !user) {
//    const url = request.nextUrl.clone();
//    url.pathname = "/login";
//    url.searchParams.set("redirect", request.nextUrl.pathname);
//    return NextResponse.redirect(url);
//  }

//  // Onboarding check: if authenticated and trying to access a protected route,
//  // verify they've completed onboarding (skip if already on onboarding page)
//  if (user && isProtected && request.nextUrl.pathname !== "/onboarding") {
//    const { data: profile } = await supabase
//      .from("users")
//      .select("completedOnboarding")
//      .eq("uuid", user.id)
//      .single();
//
//    if (!profile?.completedOnboarding) {
//      const url = request.nextUrl.clone();
//      url.pathname = "/onboarding";
//      return NextResponse.redirect(url);
//    }
//  }

  return supabaseResponse;
}
