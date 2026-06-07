import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
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
                    cookiesToSet.forEach(({ name, value, options }) =>
                        request.cookies.set(name, value)
                    );
                    response = NextResponse.next({
                        request: {
                            headers: request.headers,
                        },
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

    const url = new URL(request.url);
    const path = url.pathname;

    const isPublicRoute =
        path === "/" ||
        path.startsWith("/sign-in") ||
        path.startsWith("/sign-up") ||
        path === "/about" ||
        path === "/contact" ||
        path === "/session-expired" ||
        path.startsWith("/api/webhooks") ||
        path === "/api/setup-admin";

    const isApiRoute = path.startsWith("/api");
    const isAdminRoute = path.startsWith("/admin");
    const isUserRoute = path.startsWith("/user");
    const isOnboardingRoute = path === "/onboarding";

    // 1. Handle Unauthenticated Users
    if (!user) {
        if (isPublicRoute) {
            return response;
        }

        if (isApiRoute) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const signInUrl = new URL("/sign-in", request.url);
        signInUrl.searchParams.set("redirect_url", request.url);
        return NextResponse.redirect(signInUrl);
    }

    // 2. Session Timeout (Inactivity) Check
    const lastActiveAt = request.cookies.get("last_active_at")?.value;
    const currentTime = Date.now();
    let sessionTimeoutMs = 40 * 60 * 1000; // Default 40 minutes

    try {
        const { data: timeoutSetting } = await supabase
            .from("bank_settings")
            .select("value")
            .eq("key", "session_timeout")
            .single();

        if (timeoutSetting?.value) {
            sessionTimeoutMs = parseInt(timeoutSetting.value) * 60 * 1000;
        }
    } catch (e) {
        console.error("Error fetching session timeout:", e);
    }

    if (lastActiveAt && !isPublicRoute && path !== "/session-expired") {
        const lastActiveTime = parseInt(lastActiveAt);
        if (currentTime - lastActiveTime > sessionTimeoutMs) {
            // Log out user
            await supabase.auth.signOut();
            if (isApiRoute) {
                const res = NextResponse.json(
                    { error: "Session expired due to inactivity" },
                    { status: 401 }
                );
                res.cookies.delete("last_active_at");
                return res;
            }
            const res = NextResponse.redirect(new URL("/session-expired", request.url));
            res.cookies.delete("last_active_at");
            return res;
        }
    }

    // Skip role check for API routes - they handle their own auth
    if (isApiRoute) {
        if (path !== "/session-expired") {
            response.cookies.set("last_active_at", currentTime.toString(), {
                path: "/",
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                sameSite: "lax",
            });
        }
        return response;
    }

    // Check if user has a profile for onboarding or root redirects
    let dbUser = null;
    try {
        const { data } = await supabase
            .from("users")
            .select("id, role")
            .eq("clerk_id", user.id)
            .single();
        dbUser = data;
    } catch (error) {
        console.error("Error fetching db user in middleware:", error);
    }

    if (isOnboardingRoute || path === "/") {
        if (dbUser) {
            const redirectTo = dbUser.role === "admin" ? "/admin" : "/user";
            const res = NextResponse.redirect(new URL(redirectTo, request.url));
            res.cookies.set("last_active_at", currentTime.toString(), {
                path: "/",
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                sameSite: "lax",
            });
            return res;
        } else if (path === "/") {
            return NextResponse.redirect(new URL("/onboarding", request.url));
        }
    }

    // Protect admin routes
    const isAdmin = dbUser?.role === "admin";
    if (isAdminRoute && !isAdmin) {
        return NextResponse.redirect(new URL("/user", request.url));
    }

    // Redirect admins trying to access user routes
    if (isUserRoute && isAdmin) {
        return NextResponse.redirect(new URL("/admin", request.url));
    }

    // Update last activity cookie for valid session
    if (!isPublicRoute && path !== "/session-expired") {
        response.cookies.set("last_active_at", currentTime.toString(), {
            path: "/",
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
        });
    }

    return response;
}

export const config = {
    matcher: [
        "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
        "/(api|trpc)(.*)",
    ],
};
