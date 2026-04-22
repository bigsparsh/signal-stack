"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  BarChart3,
  FolderKanban,
  LayoutDashboard,
  MessageSquare,
  ScrollText,
  Settings,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const navItems = [
  { title: "Overview", href: "/dashboard", icon: LayoutDashboard },
  { title: "Projects", href: "/dashboard/projects", icon: FolderKanban },
  { title: "Logs", href: "/dashboard/logs", icon: ScrollText },
  { title: "Settings", href: "/dashboard/settings", icon: Settings },
];

interface DashboardSidebarProps {
  user: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
}

export function DashboardSidebar({ user }: DashboardSidebarProps) {
  const pathname = usePathname();

  return (
    <Sidebar className="border-r border-border/40">
      <SidebarHeader className="p-4">
        <Link href="/" className="flex items-center gap-2 font-bold text-lg tracking-tight">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-cyan-500">
            <Activity className="h-4 w-4 text-white" />
          </div>
          Signalstack
        </Link>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Platform</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    isActive={pathname === item.href}
                    tooltip={item.title}
                    render={<Link href={item.href} />}
                  >
                    <item.icon className="h-4 w-4" />
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4">
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8">
            <AvatarImage src={user.image ?? undefined} alt={user.name ?? ""} />
            <AvatarFallback className="bg-violet-600 text-xs text-white">
              {user.name?.charAt(0)?.toUpperCase() ?? "U"}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col overflow-hidden">
            <span className="text-sm font-medium truncate">{user.name}</span>
            <span className="text-xs text-muted-foreground truncate">
              {user.email}
            </span>
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
