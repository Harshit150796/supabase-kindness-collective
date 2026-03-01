

## Fix Site Name Display in Google Search Results

### Problem
Google search results show "coupondonation.com" with a lowercase "c" instead of "CouponDonation". This is because Google is using the raw domain name rather than the structured data site name.

### Root Cause
While the structured data already includes `"name": "CouponDonation"`, there are minor improvements to reinforce the brand name for Google's crawler.

### Changes

**File: `index.html`**

1. Add `alternateName` to the **WebSite** structured data schema to give Google more signals:
```json
{
  "@type": "WebSite",
  "name": "CouponDonation",
  "alternateName": ["Coupon Donation", "CouponDonation.com"],
  ...
}
```

2. Add a `publisher` reference in the WebSite schema linking it to the Organization:
```json
{
  "@type": "WebSite",
  "name": "CouponDonation",
  "alternateName": ["Coupon Donation", "CouponDonation.com"],
  "url": "https://coupondonation.com",
  "publisher": {
    "@type": "Organization",
    "name": "CouponDonation"
  },
  "potentialAction": { ... }
}
```

### Important Note
After deploying, you should go to **Google Search Console** > **URL Inspection** > enter `https://coupondonation.com` > click **Request Indexing**. Google may take a few days to weeks to update the displayed site name. These structured data improvements maximize the chance Google uses "CouponDonation" instead of the raw domain.

### Files Changed
- `index.html` -- enhanced WebSite structured data schema

