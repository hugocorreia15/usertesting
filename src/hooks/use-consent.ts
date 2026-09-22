import { useEffect, useState } from "react";
import {
  CONSENT_CHANGED_EVENT,
  needsDecision,
  readConsent,
  type ConsentState,
} from "@/lib/consent-preferences";

/**
 * The stored answer, kept current within this tab.
 *
 * Read after mount rather than during render: local storage may throw, and a
 * prerendered page must not bake in one visitor's answer.
 */
export function useConsent(): { state: ConsentState; pending: boolean } {
  const [state, setState] = useState<ConsentState>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const sync = () => setState(readConsent());
    sync();
    setMounted(true);
    window.addEventListener(CONSENT_CHANGED_EVENT, sync);
    // A decision made in another tab should settle this one too.
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(CONSENT_CHANGED_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  // Before mount nothing is pending, so the banner never flashes on a page
  // whose visitor has already answered.
  return { state, pending: mounted && needsDecision(state) };
}
