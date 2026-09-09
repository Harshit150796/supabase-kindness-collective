import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        // Recharts is split so admin analytics never drags it into the landing
        // bundle. The 3D stack is intentionally NOT a manual chunk any more —
        // declaring it here made Vite modulepreload it from index.html, which
        // defeated the lazy import. Rollup now folds three/fiber/drei into the
        // dynamically imported Tree3DScene chunk, so it stays a single request
        // that only starts after the page is interactive.
        manualChunks: {
          charts: ['recharts'],
        },
      },
    },
  },

}));
