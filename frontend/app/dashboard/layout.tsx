import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { DashboardSidebar } from "@/components/dashboard/sidebar";
import { DashboardHeader } from "@/components/dashboard/header";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  return (
    <SidebarProvider>
      <DashboardSidebar user={session.user} />
      <SidebarInset className="flex flex-col h-screen overflow-hidden">
        <DashboardHeader user={session.user} />
        <main className="flex-1 overflow-hidden p-6 flex flex-col">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
