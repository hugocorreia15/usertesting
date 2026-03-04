import { createFileRoute } from "@tanstack/react-router";
import { SkaterGame } from "@/components/layout/skater-game";

export const Route = createFileRoute("/$")({
  component: NotFound,
});

function NotFound() {
  return <SkaterGame title="404" message="Page not found" />;
}
