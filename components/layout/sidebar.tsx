"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Heart,
  Home,
  Plus,
  Settings,
  User,
  Users,
  Loader2,
} from "lucide-react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useSession } from "next-auth/react";

interface SidebarLinkProps {
  href: string;
  icon: React.ReactNode;
  label: string;
  active: boolean;
  collapsed: boolean;
  onClick?: () => void;
}

interface Community {
  name: string;
  handle: string;
  avatar: string;
  description: string;
  members: string[];
  isVerified: boolean;
}

const SidebarLink = ({
  href,
  icon,
  label,
  active,
  collapsed,
  onClick,
}: SidebarLinkProps) => (
  <Link
    href={href}
    className={cn(
      "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-all hover:bg-accent",
      active ? "bg-accent text-accent-foreground" : "text-muted-foreground"
    )}
    onClick={onClick}
  >
    {icon}
    {!collapsed && <span>{label}</span>}
  </Link>
);

export default function Sidebar() {
  const pathname = usePathname();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const { data: session } = useSession();
  const [userCommunities, setUserCommunities] = useState<Community[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth >= 768) {
        setIsSidebarOpen(true);
      } else {
        setIsSidebarOpen(false);
      }
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    const fetchUserCommunities = async () => {
      if (!session?.user) return;
      
      setIsLoading(true);
      try {
        const response = await fetch('/api/communities/user');
        if (response.ok) {
          const data = await response.json();
          setUserCommunities(data);
        }
      } catch (error) {
        console.error('Error fetching user communities:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserCommunities();
  }, [session]);

  const closeSidebar = () => {
    if (isMobile) {
      setIsSidebarOpen(false);
    }
  };

  const sidebarLinks = [
    { href: "/", icon: <Home size={20} />, label: "Home" },
    { href: "/explore", icon: <Users size={20} />, label: "Communities" },
    { href: "/calendar", icon: <CalendarDays size={20} />, label: "Calendar" },
    { href: "/following", icon: <Heart size={20} />, label: "Following" },
    { href: "/profile", icon: <User size={20} />, label: "Profile" },
    { href: "/settings", icon: <Settings size={20} />, label: "Settings" },
  ];

  return (
    <>
      {isMobile && (
        <div className="fixed bottom-0 left-0 z-20 flex h-14 w-full items-center justify-between border-t bg-background px-4 md:hidden shadow-black">
          {sidebarLinks.slice(0, 5).map((link) => (
            <Link key={link.href} href={link.href} className="text-muted-foreground">
              {link.icon}
            </Link>
          ))}
        </div>
      )}

      <div
        className={cn(
          "fixed inset-0 z-50 bg-background/80 backdrop-blur-sm transition-all duration-300 ease-in-out md:hidden shadow-black",
          isSidebarOpen ? "opacity-100" : "pointer-events-none opacity-0"
        )}
        onClick={closeSidebar}
      />

      <div
        className={cn(
          "fixed left-4 top-20 z-40 flex h-[calc(100vh-6rem)] flex-col bg-white p-4 shadow-[0_0_15px_rgba(0,0,0,0.1)] transition-all duration-300 ease-in-out dark:bg-gray-950 dark:shadow-[0_0_15px_rgba(0,0,0,0.3)] rounded-lg border",
          isCollapsed ? "sidebar-collapsed" : "sidebar-expanded"
        )}
      >
        <Button
          variant="ghost"
          size="icon"
          className="absolute -right-3 top-3 h-6 w-6 rounded-full bg-primary"
          onClick={() => setIsCollapsed(!isCollapsed)}
        >
          {isCollapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </Button>

        <div className="flex flex-col gap-1">
          {sidebarLinks.map((link) => (
            <SidebarLink
              key={link.href}
              href={link.href}
              icon={link.icon}
              label={link.label}
              active={pathname === link.href}
              collapsed={isCollapsed}
              onClick={closeSidebar}
            />
          ))}
        </div>

        {!isCollapsed && (
          <>
            <Separator className="my-6" />
            <div className="text-sm font-medium">Your Communities</div>
            <div className="mt-3 flex flex-col gap-1">
              {isLoading ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="h-4 w-4 animate-spin" />
                </div>
              ) : userCommunities.length > 0 ? (
                userCommunities.map((community) => (
                  <SidebarLink
                    key={community.handle}
                    href={`/communities/${community.handle}`}
                    icon={
                      <span className="flex h-5 w-5 items-center justify-center rounded-md bg-blue-100 text-xs font-semibold text-blue-700 dark:bg-blue-900 dark:text-blue-200">
                        {community.name.substring(0, 2)}
                      </span>
                    }
                    label={community.name}
                    active={pathname === `/communities/${community.handle}`}
                    collapsed={isCollapsed}
                    onClick={closeSidebar}
                  />
                ))
              ) : (
                <p className="py-2 text-sm text-muted-foreground">No communities yet</p>
              )}
            </div>
          </>
        )}

        <div className="mt-auto">
          <Link href="/communities/create" onClick={closeSidebar}>
            <Button className="w-full gap-2" variant="outline">
              <Plus size={16} />
              {!isCollapsed && "New Community"}
            </Button>
          </Link>
        </div>

        {session && !isCollapsed && (
          <div className="mt-6 flex items-center gap-2">
            <Avatar>
              <AvatarImage src={session.user?.image || ""} />
              <AvatarFallback>
                {session.user?.name?.charAt(0) || "U"}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm font-medium">{session.user?.name}</p>
              <p className="text-xs text-muted-foreground">
                {session.user?.email}
              </p>
            </div>
          </div>
        )}
      </div>
    </>
  );
}