import { afterEach, describe, expect, it, vi } from "vitest";
import { acceptAll, rejectAll, writeConsent } from "../consent-preferences";

/**
 * The cookie policy states that error monitoring does not run until the
 * visitor agrees. That is a claim about behaviour, so it is tested rather than
 * asserted only in prose.
 */
const initMock = vi.fn();
const captureMock = vi.fn();
const setTagsMock = vi.fn();

vi.mock("@sentry/react", () => ({
  init: (...args: unknown[]) => initMock(...args),
  captureException: (...args: unknown[]) => captureMock(...args),
  setTags: (...args: unknown[]) => setTagsMock(...args),
}));

vi.stubEnv("VITE_SENTRY_DSN", "https://examplePublicKey@o0.ingest.sentry.io/0");

afterEach(() => {
  window.localStorage.clear();
  vi.clearAllMocks();
  vi.resetModules();
});

async function monitoring() {
  return await import("../monitoring");
}

describe("error monitoring and consent", () => {
  it("does not start when the question has not been answered", async () => {
    const { initMonitoring } = await monitoring();
    initMonitoring();
    expect(initMock).not.toHaveBeenCalled();
  });

  it("does not start when the visitor declined", async () => {
    writeConsent(rejectAll());
    const { initMonitoring } = await monitoring();
    initMonitoring();
    expect(initMock).not.toHaveBeenCalled();
  });

  it("starts once the visitor agrees", async () => {
    writeConsent(acceptAll());
    const { initMonitoring } = await monitoring();
    initMonitoring();
    expect(initMock).toHaveBeenCalledTimes(1);
  });

  it("reports nothing while consent is absent, even if asked directly", async () => {
    const { captureError, setSessionContext } = await monitoring();
    captureError(new Error("boom"));
    setSessionContext({ sessionId: "abc" });
    expect(captureMock).not.toHaveBeenCalled();
    expect(setTagsMock).not.toHaveBeenCalled();
  });

  it("reports once consent is present", async () => {
    writeConsent(acceptAll());
    const { captureError } = await monitoring();
    captureError(new Error("boom"));
    expect(captureMock).toHaveBeenCalledTimes(1);
  });
});
