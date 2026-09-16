import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { Header } from "@/components/app/Header";
import { ConvexAuthGate } from "@/components/app/ConvexAuthGate";
import { AdminAuthListener } from "@/components/admin/AdminAuthListener";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthenticated, orgId } = await auth();
  if (!isAuthenticated) redirect("/sign-in");
  if (!orgId) redirect("/select-org");

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <Suspense fallback={null}>
        <AdminAuthListener />
      </Suspense>
      <Header />
      <main className="flex flex-1 flex-col">
        <ConvexAuthGate>{children}</ConvexAuthGate>
      </main>
    </div>
  );
}
