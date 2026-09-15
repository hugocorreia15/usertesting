import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

// Standalone test config: the app's vite.config pulls in the TanStack
// router codegen plugin, which tests don't need.
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  test: {
    environment: "jsdom",
    include: ["src/**/*.test.{ts,tsx}"],
    // src/lib/supabase.ts builds its client at module scope, so importing any
    // component that reaches it, however indirectly, throws without these. A
    // developer has them in .env.local and CI does not, which is how a suite
    // passes locally and fails on push. Nothing here is ever called: no test
    // makes a request, and a test that wants to observe one mocks the module.
    env: {
      VITE_SUPABASE_URL: "http://localhost:54321",
      VITE_SUPABASE_ANON_KEY: "not-a-real-key-tests-never-call-out",
    },
  },
});
