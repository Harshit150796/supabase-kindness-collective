import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { SQUARE_PAYMENT_METHODS } from "./square-payment-methods.ts";

Deno.test("Square checkout offers Apple Pay, Google Pay and Cash App Pay", () => {
  assertEquals(SQUARE_PAYMENT_METHODS.apple_pay, true);
  assertEquals(SQUARE_PAYMENT_METHODS.google_pay, true);
  assertEquals(SQUARE_PAYMENT_METHODS.cash_app_pay, true);
  assertEquals(SQUARE_PAYMENT_METHODS.afterpay_clearpay, false);
});
