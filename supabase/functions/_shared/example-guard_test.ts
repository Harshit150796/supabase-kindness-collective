import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { isExampleFundraiser } from "./example-guard.ts";

Deno.env.set("SUPABASE_URL", "https://x.supabase.co");
Deno.env.set("SUPABASE_SERVICE_ROLE_KEY", "k");
const reply = (body: unknown, ok = true) => (() => Promise.resolve(new Response(JSON.stringify(body), { status: ok ? 200 : 500 }))) as typeof fetch;

Deno.test("an example campaign is refused", async () => {
  assertEquals(await isExampleFundraiser("abc", reply([{ is_example: true }])), true);
});
Deno.test("a real campaign is allowed", async () => {
  assertEquals(await isExampleFundraiser("abc", reply([{ is_example: false }])), false);
});
Deno.test("a gift with no campaign is allowed", async () => {
  assertEquals(await isExampleFundraiser(undefined, reply([])), false);
});
Deno.test("a failed lookup refuses (fails closed)", async () => {
  assertEquals(await isExampleFundraiser("abc", reply({}, false)), true);
});
