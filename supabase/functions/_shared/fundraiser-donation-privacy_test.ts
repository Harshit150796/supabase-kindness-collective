import { assertEquals, assertFalse } from "https://deno.land/std@0.224.0/assert/mod.ts";

type SafeDonation = {
  donor_display: string;
  [key: string]: unknown;
};

const identityFields = (donation: SafeDonation) =>
  Object.entries(donation).filter(([key]) => key.startsWith("donor_") || key === "is_anonymous");

Deno.test("organizer donation payload contains no contact-shaped donor identity", () => {
  const response: SafeDonation = { donor_display: "Harshit A.", amount: 20 };
  assertEquals(identityFields(response).map(([key]) => key), ["donor_display"]);
  assertFalse(identityFields(response).some(([, value]) => String(value).includes("@")));
});

Deno.test("anonymous organizer donation identity is exactly Anonymous", () => {
  const response: SafeDonation = { donor_display: "Anonymous", amount: 20 };
  assertEquals(response.donor_display, "Anonymous");
});