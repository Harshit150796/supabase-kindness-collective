import { defineConfig, type Plugin, type Rollup } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// The homepage opening downloads the page and live-tree code alongside the app bundle
// instead of after it: their chunk lists are written into its inline script at build time.
function openingPreloads(): Plugin {
  return {
    name: "cd-opening-preloads",
    apply: "build",
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
        return html
          .replace('"__CD_PAGE_CHUNKS__"', JSON.stringify(page))
          .replace('"__CD_TREE_CHUNKS__"', JSON.stringify(tree));
      },
    },
  };
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
