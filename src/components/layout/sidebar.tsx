import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { NAV_ITEMS, type NavItem } from "@/lib/constants";
import {
  LayoutDashboard,
  FileText,
  Users,
  ClipboardList,
  BarChart3,
  ChevronRight,
  Menu,
  LogOut,
  User,
} from "lucide-react";
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from "@/components/ui/collapsible";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { useSidebar } from "@/hooks/use-sidebar";
import { useEffect, useState } from "react";

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  LayoutDashboard,
  FileText,
  Users,
  ClipboardList,
  BarChart3,
};

function CollapsibleNavGroup({
  item,
  Icon,
  anyChildActive,
  onNavigate,
  layoutId,
  pathname,
}: {
  item: NavItem;
  Icon: React.ComponentType<{ className?: string }> | undefined;
  anyChildActive: boolean;
  onNavigate?: () => void;
  layoutId: string;
  pathname: string;
}) {
  const [open, setOpen] = useState(anyChildActive);

  // Auto-open when a child becomes active
  useEffect(() => {
    if (anyChildActive) setOpen(true);
  }, [anyChildActive]);

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger
        className={cn(
          "flex w-full items-center rounded-md text-sm font-medium transition-colors duration-200",
          "gap-3 px-3 py-2",
          anyChildActive
            ? "text-sidebar-accent-foreground"
            : "text-sidebar-foreground/70 hover:bg-accent/50 hover:text-sidebar-accent-foreground",
        )}
      >
        {Icon && <Icon className="h-4 w-4 shrink-0" />}
        <span className="flex-1 text-left">{item.label}</span>
        <ChevronRight
          className={cn(
            "h-3.5 w-3.5 shrink-0 transition-transform duration-200",
            open && "rotate-90",
          )}
        />
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="mt-0.5 space-y-0.5">
          {item.children!.map((child) => {
            const childActive =
              child.href === "/"
                ? pathname === "/"
                : pathname === child.href ||
                  pathname === child.href + "/";

            return (
              <Link
                key={child.href}
                to={child.href}
                onClick={onNavigate}
                className={cn(
                  "relative flex items-center rounded-md py-1.5 pl-9 pr-3 text-sm transition-colors duration-200",
                  childActive
                    ? "text-sidebar-accent-foreground"
                    : "text-sidebar-foreground/70 hover:bg-accent/50 hover:text-sidebar-accent-foreground",
                )}
              >
                {childActive && (
                  <motion.div
                    layoutId={layoutId}
                    className="absolute inset-0 rounded-md border-l-2 border-primary bg-sidebar-accent shadow-[inset_0_0_12px_rgba(99,102,241,0.08)]"
                    transition={{
                      type: "spring",
                      stiffness: 350,
                      damping: 30,
                    }}
                  />
                )}
                <span className="relative z-10">{child.label}</span>
              </Link>
            );
          })}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

function NavGroup({
  item,
  collapsed,
  onNavigate,
  layoutId,
}: {
  item: NavItem;
  collapsed: boolean;
  onNavigate?: () => void;
  layoutId: string;
}) {
  const location = useLocation();
  const Icon = iconMap[item.icon];
  const isActive =
    item.href === "/"
      ? location.pathname === "/"
      : location.pathname.startsWith(item.href);

  // If item has children and sidebar is expanded, render collapsible
  if (item.children && !collapsed) {
    const anyChildActive = item.children.some((child) =>
      child.href === "/"
        ? location.pathname === "/"
        : location.pathname.startsWith(child.href),
    );

    return (
      <CollapsibleNavGroup
        item={item}
        Icon={Icon}
        anyChildActive={anyChildActive}
        onNavigate={onNavigate}
        layoutId={layoutId}
        pathname={location.pathname}
      />
    );
  }

  // Collapsed sidebar with children: render as plain icon link to parent
  return (
    <Link
      to={item.href}
      onClick={onNavigate}
      title={collapsed ? item.label : undefined}
      className={cn(
        "relative flex items-center rounded-md text-sm font-medium transition-colors duration-200",
        collapsed ? "justify-center px-2 py-2" : "gap-3 px-3 py-2",
        isActive
          ? "text-sidebar-accent-foreground"
          : "text-sidebar-foreground/70 hover:bg-accent/50 hover:text-sidebar-accent-foreground",
      )}
    >
      {isActive && (
        <motion.div
          layoutId={layoutId}
          className="absolute inset-0 rounded-md border-l-2 border-primary bg-sidebar-accent shadow-[inset_0_0_12px_rgba(99,102,241,0.08)]"
          transition={{ type: "spring", stiffness: 350, damping: 30 }}
        />
      )}
      <span className="relative z-10 flex items-center gap-3">
        {Icon && <Icon className="h-4 w-4 shrink-0" />}
        {!collapsed && <span>{item.label}</span>}
      </span>
    </Link>
  );
}

function SidebarFooter({ collapsed }: { collapsed: boolean }) {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const meta = user?.user_metadata;
  const displayName = meta?.first_name
    ? `${meta.first_name} ${meta.last_name || ""}`.trim()
    : null;
  const initial = displayName?.[0]?.toUpperCase() ?? user?.email?.[0]?.toUpperCase() ?? "?";

  return (
    <div className="border-t border-sidebar-border p-3">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            title={collapsed ? user?.email ?? "Account" : undefined}
            className={cn(
              "flex w-full items-center rounded-md py-2 text-sm transition-all duration-200 hover:bg-accent/50",
              collapsed ? "justify-center px-2" : "gap-3 px-3",
            )}
          >
            {meta?.avatar_url ? (
              <img
                src={meta.avatar_url}
                alt=""
                className="h-8 w-8 shrink-0 rounded-full object-cover"
              />
            ) : (
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-teal-400 text-xs font-medium text-white">
                {initial}
              </div>
            )}
            {!collapsed && (
              <div className="min-w-0">
                <p className="truncate text-sm text-start font-medium text-sidebar-foreground">
                  {displayName ?? "Account"}
                </p>
                {displayName && (
                  <p className="truncate text-xs text-sidebar-foreground/50">
                    {user?.email}
                  </p>
                )}
              </div>
            )}
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent side="top" align={collapsed ? "center" : "start"} className="w-52">
          <div className="px-2 py-1.5">
            <p className="truncate text-sm text-muted-foreground">
              {user?.email}
            </p>
          </div>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => navigate({ to: "/profile" })}>
            <User className="h-4 w-4" />
            View Profile
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => signOut()}>
            <LogOut className="h-4 w-4" />
            Sign out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

function NavContent({
  collapsed,
  onNavigate,
  id,
}: {
  collapsed: boolean;
  onNavigate?: () => void;
  id: string;
}) {
  return (
    <div className="flex h-full flex-col">
      {/* Logo header */}
      <div className="border-b border-sidebar-border px-4 py-4">
        <div className={cn("flex items-center", collapsed ? "justify-center" : "gap-3")}>
          <img
            src="/logo.svg"
            alt="Avalux"
            className="h-8 w-8 shrink-0"
          />
          {!collapsed && (
            <h1 className="text-lg font-bold gradient-text">
              Avalux
            </h1>
          )}
        </div>
      </div>

      {/* Nav links */}
      <nav className="flex-1 space-y-1 p-3">
        {NAV_ITEMS.map((item) => (
          <NavGroup
            key={item.href}
            item={item}
            collapsed={collapsed}
            onNavigate={onNavigate}
            layoutId={`${id}-nav-indicator`}
          />
        ))}
      </nav>

      {/* Profile footer */}
      <SidebarFooter collapsed={collapsed} />
    </div>
  );
}

export function Sidebar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { collapsed } = useSidebar();

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        className={cn(
          "hidden shrink-0 border-r border-sidebar-border backdrop-blur-md bg-transparent transition-all duration-300 md:block",
          collapsed ? "w-16" : "w-56",
        )}
      >
        <NavContent collapsed={collapsed} id="desktop" />
      </aside>

      {/* Mobile sidebar */}
      <div className="fixed left-4 top-4 z-40 md:hidden">
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon">
              <Menu className="h-4 w-4" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-56 p-0 backdrop-blur-md bg-sidebar-background/60">
            <NavContent
              collapsed={false}
              onNavigate={() => setTimeout(() => setMobileOpen(false), 100)}
              id="mobile"
            />
          </SheetContent>
        </Sheet>
      </div>
    </>
  );
}
