/**
 * Build of the real app for help screenshots. Identical to the main config
 * except for two things:
 *
 *   - src/lib/supabase is replaced by the in-memory stub, so pages render the
 *     fictional fixtures and nothing reaches a database;
 *   - environment files are read from this folder, which has none, so the
 *     build carries no Supabase keys and no monitoring DSN, and an error in the
 *     demo is never reported as a production error.
 */
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { TanStackRouterVite } from "@tanstack/router-plugin/vite";
import path from "path";

const root = path.resolve(__dirname, "../..");

export default defineConfig({
  root,
  envDir: __dirname,
  plugins: [
    TanStackRouterVite({
      routesDirectory: path.join(root, "src/routes"),
      generatedRouteTree: path.join(root, "src/routeTree.gen.ts"),
    }),
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: [
      { find: /^@\/lib\/supabase$/, replacement: path.join(__dirname, "supabase-mock.ts") },
      { find: "@", replacement: path.join(root, "src") },
    ],
  },
  server: { port: 5198, strictPort: true },
});
