// Wallets offered on Square's hosted payment page. Cards are always on.
// Venmo isn't available on payment links; Afterpay is goods-only, so donations leave it off.
export const SQUARE_PAYMENT_METHODS = {
  apple_pay: true,
  google_pay: true,
  cash_app_pay: true,
  afterpay_clearpay: false,
} as const;
