import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { cardRow, ownsCard } from "./saved-card.ts";

Deno.test("saved card keeps only the last 4 digits", () => {
  const row = cardRow({ id: "ccof:1", card_brand: "VISA", last_4: "4111111111114242", exp_month: 4, exp_year: 2030 });
  assertEquals(row.last4, "4242");
  assertEquals(JSON.stringify(row).includes("41111111"), false);
});

Deno.test("remove is refused for a card the donor doesn't own", () => {
  const cards = [{ square_card_id: "ccof:1", user_id: "a" }];
  assertEquals(ownsCard(cards, "b", "ccof:1"), false);
  assertEquals(ownsCard(cards, "a", "ccof:1"), true);
});
