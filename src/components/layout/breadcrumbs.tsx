import { Link, useLocation, useParams } from "@tanstack/react-router";
import { useSession } from "@/hooks/use-sessions";
import { useTemplate } from "@/hooks/use-templates";
import { useParticipant } from "@/hooks/use-participants";
import { ChevronRight, Home } from "lucide-react";
import { Fragment } from "react";

interface Crumb {
  label: string;
  href?: string;
}

function useBreadcrumbs(): Crumb[] {
  const location = useLocation();
  const params = useParams({ strict: false }) as Record<string, string>;
  const pathname = location.pathname;

  const { data: session } = useSession(params.sessionId);
  const { data: template } = useTemplate(params.templateId);
  const { data: participant } = useParticipant(params.participantId);

  const crumbs: Crumb[] = [];

  // Sessions
  if (pathname.startsWith("/sessions")) {
    crumbs.push({ label: "Sessions", href: "/sessions" });

    if (params.sessionId) {
      // Template name as a link to the template
      if (session?.template_id) {
        crumbs.push({
          label: session.templates?.name ?? "...",
          href: `/templates/${session.template_id}`,
        });
      }

      const sessionLabel = session
        ? `${session.participants?.name ?? "Session"}`
        : "...";

      if (pathname.endsWith("/live") || pathname.endsWith("/edit")) {
        crumbs.push({
          label: sessionLabel,
          href: `/sessions/${params.sessionId}`,
        });
        if (pathname.endsWith("/live")) {
          crumbs.push({ label: "Live Mode" });
        } else {
          crumbs.push({ label: "Edit" });
        }
      } else {
        crumbs.push({ label: sessionLabel });
      }
    } else if (pathname.endsWith("/new")) {
      crumbs.push({ label: "New Session" });
    }
  }

  // Templates
  else if (pathname.startsWith("/templates")) {
    crumbs.push({ label: "Templates", href: "/templates" });

    if (params.templateId) {
      crumbs.push({ label: template?.name ?? "..." });
    } else if (pathname.endsWith("/new")) {
      crumbs.push({ label: "New Template" });
    }
  }

  // Participants
  else if (pathname.startsWith("/participants")) {
    crumbs.push({ label: "Participants", href: "/participants" });

    if (params.participantId) {
      crumbs.push({ label: participant?.name ?? "..." });
    } else if (pathname.endsWith("/new")) {
      crumbs.push({ label: "New Participant" });
    }
  }

  // Analytics
  else if (pathname.startsWith("/analytics")) {
    crumbs.push({ label: "Analytics" });
  }

  return crumbs;
}

export function Breadcrumbs() {
  const crumbs = useBreadcrumbs();

  if (crumbs.length === 0) return null;

  return (
    <nav className="flex items-center gap-1 text-sm text-muted-foreground">
      <Link
        to="/"
        className="flex items-center hover:text-foreground transition-colors"
      >
        <Home className="h-3.5 w-3.5" />
      </Link>
      {crumbs.map((crumb, i) => {
        const isLast = i === crumbs.length - 1;

        return (
          <Fragment key={i}>
            <ChevronRight className="h-3 w-3 shrink-0" />
            {crumb.href && !isLast ? (
              <Link
                to={crumb.href}
                className="hover:text-foreground transition-colors truncate max-w-[180px]"
              >
                {crumb.label}
              </Link>
            ) : (
              <span
                className={
                  isLast
                    ? "text-foreground font-medium truncate max-w-[200px]"
                    : "truncate max-w-[150px]"
                }
              >
                {crumb.label}
              </span>
            )}
          </Fragment>
        );
      })}
    </nav>
  );
}
