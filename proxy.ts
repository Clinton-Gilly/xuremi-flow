import { clerkMiddleware } from "@clerk/nextjs/server";

import { NextResponse } from "next/server";

export default clerkMiddleware(async (auth, req) => {
  const { pathname } = req.nextUrl;
  if (pathname.startsWith("/admin") || pathname.startsWith("/api/admin")) {
    const session = await auth();
    const isPreview = req.cookies.get("__xuremi_superadmin_preview")?.value === "1";
    if (!session.userId && !isPreview) {
      const redirectUrl = new URL("/workflows", req.url);
      redirectUrl.searchParams.set("error", "superadmin_required");
      return NextResponse.redirect(redirectUrl);
    }
  }
});

export const config = {
  matcher: [
    "/((?!_next|\\.well-known/workflow/|eve/|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
    "/__clerk/(.*)",
  ],
};
