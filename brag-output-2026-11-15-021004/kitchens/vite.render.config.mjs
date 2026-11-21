// A dev server for the delivery render: no HMR and no file watching, so no edit anywhere can reload a page mid-render.
import { mergeConfig } from 'vite';
import cfg from '/home/user/supabase-kindness-collective/vite.config.ts';
export default async (env) => {
  const base = typeof cfg === 'function' ? await cfg(env) : cfg;
  return mergeConfig(base, { server: { host: '127.0.0.1', port: Number(process.env.PORT || 5175), strictPort: true, hmr: false, watch: { ignored: ['**/*'] } } });
};
