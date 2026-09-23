import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { FileText, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAcceptLegal } from "@/hooks/use-legal-acceptance";
import { LEGAL_LAST_UPDATED } from "@/lib/legal";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/lib/supabase";

/**
 * Shown in place of the application until the account has accepted the current
 * terms and privacy notice.
 *
 * It is not a dismissible dialog: there is nothing behind it to return to, and
 * an overlay a user can escape from is not a condition of use. The links open
 * the full documents in a new tab so that reading them does not lose the
 * acceptance in progress, which is the usual reason people click through
 * without reading.
 *
 * The optional purposes in the cookie settings are deliberately absent. Consent
 * must be freely given, and consent obtained as the price of access is not;
 * asking for it here would invalidate it. Those stay in their own banner,
 * refusable, with the service working either way.
 */
export function LegalGate() {
  const { session } = useAuth();
  const accept = useAcceptLegal();
  const [agreed, setAgreed] = useState(false);

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-lg bg-transparent backdrop-blur-md">
        <CardHeader>
          <CardTitle className="text-lg">Before you continue</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5 text-sm">
          <p className="text-muted-foreground">
            This platform holds data about research participants, so holding an
            account means agreeing to how it may be used. Please read both
            documents before accepting.
          </p>

          <div className="space-y-2">
            <a
              href="/legal/terms"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-3 rounded-md border p-3 transition-colors hover:bg-muted/50"
            >
              <FileText className="h-4 w-4 shrink-0 text-primary" />
              <span>
                <span className="font-medium">Terms of service</span>
                <span className="block text-xs text-muted-foreground">
                  What you may use the platform for, and what you take
                  responsibility for when you run a study.
                </span>
              </span>
            </a>

            <a
              href="/legal/privacy"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-3 rounded-md border p-3 transition-colors hover:bg-muted/50"
            >
              <ShieldCheck className="h-4 w-4 shrink-0 text-primary" />
              <span>
                <span className="font-medium">Privacy policy</span>
                <span className="block text-xs text-muted-foreground">
                  What is done with personal data, and who answers for the data
                  your participants give you.
                </span>
              </span>
            </a>
          </div>

          <label className="flex items-start gap-3">
            <Checkbox
              checked={agreed}
              onCheckedChange={(c) => setAgreed(c === true)}
              className="mt-0.5"
            />
            <span>
              I have read and accept the terms of service, and I have read the
              privacy policy.
              <span className="mt-1 block text-xs text-muted-foreground">
                Version of {new Date(LEGAL_LAST_UPDATED).toLocaleDateString()}.
                Recorded against your account with the date.
              </span>
            </span>
          </label>

          <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-4">
            <Link
              to="/login"
              className="text-xs text-muted-foreground underline-offset-4 hover:underline"
              onClick={() => {
                // Declining is leaving, and must be possible: an account that
                // cannot proceed and cannot leave is a trap.
                void supabase.auth.signOut();
              }}
            >
              Decline and sign out
            </Link>
            <Button
              className="cursor-pointer"
              disabled={!agreed || accept.isPending}
              onClick={() =>
                accept.mutate(undefined, {
                  onError: (e: unknown) =>
                    toast.error(
                      e instanceof Error ? e.message : "Could not record your acceptance",
                    ),
                })
              }
            >
              {accept.isPending ? "Recording..." : "Accept and continue"}
            </Button>
          </div>

          {session?.user?.email && (
            <p className="text-xs text-muted-foreground">
              Signed in as {session.user.email}.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
