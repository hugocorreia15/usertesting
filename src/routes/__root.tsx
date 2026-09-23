import {
  createRootRouteWithContext,
  Outlet,
  redirect,
  useNavigate,
  useLocation,
} from "@tanstack/react-router";
import { useEffect } from "react";
import type { QueryClient } from "@tanstack/react-query";
import { useQueryClient } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Footer } from "@/components/layout/footer";
import { CookieBanner } from "@/components/legal/cookie-settings";
import { LegalGate } from "@/components/legal/legal-gate";
import { useLegalAcceptance } from "@/hooks/use-legal-acceptance";
import { shouldBlockUntilAccepted } from "@/lib/legal";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { ThemeProvider } from "@/hooks/use-theme";
import { useAuth } from "@/hooks/use-auth";
import { ErrorBoundary } from "@/components/layout/error-boundary";
import { SkaterGame } from "@/components/layout/skater-game";
import { AnimatedBackground } from "@/components/layout/animated-background";
import { SidebarProvider } from "@/hooks/use-sidebar";
import ClickSpark from "@/components/ClickSpark";
import { clearParticipantCodes, supabase } from "@/lib/supabase";

interface RouterContext {
  queryClient: QueryClient;
}

export const Route = createRootRouteWithContext<RouterContext>()({
  beforeLoad: async ({ location }) => {
    // Root runs before the matched child, so the join route re-sets these
    // immediately after. Anywhere else, a code left over from a join link
    // visited earlier in this tab stops being sent.
    if (!location.pathname.startsWith("/join")) {
      clearParticipantCodes();
    }

    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session && location.pathname !== "/login" && !location.pathname.startsWith("/join")) {
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
  const location = useLocation();

  const isJoinPage = location.pathname.startsWith("/join");
  const isLoginPage = location.pathname === "/login";
  const isCompleteProfilePage = location.pathname === "/complete-profile";
  // The legal pages themselves stay reachable while the gate is up: requiring
  // someone to accept documents they cannot open would be absurd.
  const isLegalPage = location.pathname.startsWith("/legal");
  const isBarePage = isJoinPage || isLoginPage || isCompleteProfilePage;

  // Participants joining by link have their own consent step in the join flow
  // and never hold an account, so this asks only signed-in users.
  const { data: acceptedLegal, isLoading: legalLoading } = useLegalAcceptance(
    !!session && !isBarePage,
  );

  useEffect(() => {
    if (!session && !isBarePage) {
      queryClient.clear();
      navigate({ to: "/login" });
    }
  }, [session, queryClient, navigate, isBarePage]);

  // Redirect to complete-profile if OAuth user is missing required fields
  useEffect(() => {
    if (
      session?.user &&
      !isCompleteProfilePage &&
      !isLoginPage &&
      !session.user.user_metadata?.first_name
    ) {
      navigate({ to: "/complete-profile" });
    }
  }, [session, isCompleteProfilePage, isLoginPage, navigate]);


  if (isBarePage) {
    return (
      <ThemeProvider>
        <TooltipProvider>
          <AnimatedBackground />
          <main className="min-h-screen p-4 md:p-6">
            <ErrorBoundary>
              <Outlet />
            </ErrorBoundary>
          </main>
          <Footer />
          <CookieBanner />
          <Toaster />
        </TooltipProvider>
      </ThemeProvider>
    );
  }

  // Nothing of the application renders until the account has accepted: not the
  // sidebar, not the header, not the page behind it.
  if (
    shouldBlockUntilAccepted({
      signedIn: !!session,
      onBarePage: isBarePage,
      onLegalPage: isLegalPage,
      loading: legalLoading,
      accepted: acceptedLegal,
    })
  ) {
    return (
      <ThemeProvider>
        <TooltipProvider>
          <AnimatedBackground />
          <LegalGate />
          <Toaster />
        </TooltipProvider>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider>
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
        <TooltipProvider>
        <SidebarProvider>
          <div className="flex h-screen overflow-hidden">
            <Sidebar />
            <div className="flex flex-1 flex-col overflow-hidden">
              <Header />
              <main className="flex-1 overflow-y-auto p-4 md:p-6">
                <ErrorBoundary>
                  <Outlet />
                </ErrorBoundary>
                <Footer />
              </main>
            </div>
          </div>
        </SidebarProvider>
        </TooltipProvider>
        <CookieBanner />
        <Toaster />
      </ClickSpark>
    </ThemeProvider>
  );
}
