## Fix AI SDK version mismatch

`package.json` has `ai@^6` (top-level) but `@ai-sdk/react@^2` — and `@ai-sdk/react@2.0.195` depends on `ai@5.0.193`. Two copies of `ai` end up in the graph, with incompatible `UIMessage`, `DefaultChatTransport`, `ChatStatus`, and `FileUIPart` shapes between them. The frontend imports these from top-level `ai`, while `useChat` expects the v5 shapes — a hidden footgun that can break the chat widget at runtime.

### Change

In `package.json`, pin `ai` to the `5.x` line that matches `@ai-sdk/react@2`:

```diff
- "ai": "^6.0.193",
+ "ai": "^5.0.193",
```

Then reinstall and let Vite re-optimize:

```bash
bun install
rm -rf node_modules/.vite
```

Vite dev server auto-restarts on install.

### Verify

- Reload `/`, open the "Talk to Coupon" launcher, send "Show me active campaigns".
- Confirm the stream returns and `searchFundraisers` results render.
- Confirm no console errors from `ai`/`@ai-sdk/react` and no Vite 504s for those packages.

No other files change. The Edge Function (`supabase/functions/coupon-chat/index.ts`) stays on `npm:ai@^6.0.0` server-side — that's fine, the version mismatch was only on the client.