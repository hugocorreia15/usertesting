import {
  createRootRouteWithContext,
  Outlet,
  redirect,
  useNavigate,
} from "@tanstack/react-router";
import { useEffect } from "react";
import type { QueryClient } from "@tanstack/react-query";
import { useQueryClient } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/sonner";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { ThemeProvider } from "@/hooks/use-theme";
import { useAuth } from "@/hooks/use-auth";
import { ErrorBoundary } from "@/components/layout/error-boundary";
import { SkaterGame } from "@/components/layout/skater-game";
import { AnimatedBackground } from "@/components/layout/animated-background";
import { SidebarProvider } from "@/hooks/use-sidebar";
import ClickSpark from "@/components/ClickSpark";
import { supabase } from "@/lib/supabase";
import { updateCurrentUserProfile } from "@/lib/update-profile";

interface RouterContext {
  queryClient: QueryClient;
}

export const Route = createRootRouteWithContext<RouterContext>()({
  beforeLoad: async ({ location }) => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session && location.pathname !== "/login") {
      throw redirect({
        to: "/login",
        search: { redirect: location.href },
      });
    }
  },
  component: RootLayout,
  notFoundComponent: () => <SkaterGame title="404" message="Page not found" />,
});

function RootLayout() {
  const { session } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  useEffect(() => {
    if (!session) {
      queryClient.clear();
      navigate({ to: "/login" });
    }
  }, [session, queryClient, navigate]);

  // TODO: Remove after first run — one-time profile migration
  useEffect(() => {
    if (session?.user && !session.user.user_metadata?.first_name) {
      updateCurrentUserProfile();
    }
  }, [session]);

  return (
    <ThemeProvider>
      <SidebarProvider>
      <ClickSpark
        sparkColor="#14b8a6"
        sparkSize={10}
        sparkRadius={15}
        sparkCount={8}
        duration={400}
        easing="ease-out"
        extraScale={1}
      >
        <AnimatedBackground />
        <div className="flex h-screen overflow-hidden">
          <Sidebar />
          <div className="flex flex-1 flex-col overflow-hidden">
            <Header />
            <main className="flex-1 overflow-y-auto p-4 md:p-6">
              <ErrorBoundary>
                <Outlet />
              </ErrorBoundary>
            </main>
          </div>
        </div>
        <Toaster />
      </ClickSpark>
      </SidebarProvider>
    </ThemeProvider>
  );
}
