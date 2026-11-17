import { defineConfig, type Plugin, type Rollup } from "vite";
import { readFileSync } from "fs";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { FUNDRAISER_PAGE_SELECT } from "./src/lib/fundraiserPageQuery";

// The homepage opening downloads the page and live-tree code alongside the app bundle
// instead of after it: their chunk lists are written into its inline script at build time.
function openingPreloads(): Plugin {
  let supabase: { url: string; key: string } | null = null;
  return {
    name: "cd-opening-preloads",
    apply: "build",
    configResolved(config) { supabase = supabasePublic(config.env); },
    transformIndexHtml: {
      order: "post",
      handler(html, ctx) {
        const bundle = ctx.bundle;
        if (!bundle) return html;
        const chunks = Object.values(bundle).filter((c): c is Rollup.OutputChunk => c.type === "chunk");
        const entry = chunks.find((c) => c.isEntry);
        const loaded = new Set<string>(entry ? [entry.fileName, ...entry.imports] : []);
        const walk = (chunk: Rollup.OutputChunk | undefined, out: Set<string>): Set<string> => {
          if (!chunk || out.has(chunk.fileName)) return out;
          out.add(chunk.fileName);
          for (const file of chunk.imports) walk(bundle[file] as Rollup.OutputChunk | undefined, out);
          return out;
        };
        const urls = (suffix: string) => {
          const owns = (id: string | null | undefined) => !!id && id.replace(/\\/g, "/").endsWith(suffix);
          // A lazy route chunk may have no facade, so fall back to the chunk that holds the module.
          const chunk = chunks.find((c) => owns(c.facadeModuleId)) ?? chunks.find((c) => c.moduleIds.some(owns));
          return [...walk(chunk, new Set())].filter((file) => !loaded.has(file)).map((file) => "/" + file);
        };
        const page = urls("/src/pages/Index.tsx");
        const tree = urls("/src/components/landing/Tree3DScene.tsx").filter((file) => !page.includes(file));
        // Fundraiser pages (/f/<slug>): their code and first request start with the app (index.html fast start).
        const fundraiser = urls("/src/pages/PublicFundraiser.tsx");
        return html
          .replace('"__CD_PAGE_CHUNKS__"', JSON.stringify(page))
          .replace('"__CD_TREE_CHUNKS__"', JSON.stringify(tree))
          .replace('"__CD_FUNDRAISER_CHUNKS__"', JSON.stringify(fundraiser))
          .replace('"__CD_FUNDRAISER_SELECT__"', JSON.stringify(FUNDRAISER_PAGE_SELECT))
          .replace('"__CD_SUPABASE__"', supabase ? JSON.stringify(supabase) : '"__CD_SUPABASE__"');
      },
    },
  };
}

/** The backend's public address and publishable key, as the app's client reads them (env, else its defaults). */
function supabasePublic(env: Record<string, string>): { url: string; key: string } | null {
  let client = "";
  try { client = readFileSync(path.resolve(__dirname, "src/integrations/supabase/client.ts"), "utf8"); } catch { /* env only */ }
  const url = env.VITE_SUPABASE_URL || /SUPABASE_URL = [^\n]*?['"](https:\/\/[^'"]+)['"]/.exec(client)?.[1];
  const key = env.VITE_SUPABASE_PUBLISHABLE_KEY || /SUPABASE_PUBLISHABLE_KEY = [^\n]*?['"](eyJ[^'"]+)['"]/.exec(client)?.[1];
  return url && key ? { url: url.replace(/\/$/, ""), key } : null;
}

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [react(), openingPreloads(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
