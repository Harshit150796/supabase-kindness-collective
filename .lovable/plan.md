

## Plan: Fix LinkedIn Profile Links on About Page

### Problem
The "Connect on LinkedIn" links for both founders currently point to incorrect URLs:

| Founder | Current (Wrong) | Correct |
|---------|-----------------|---------|
| Harshit Agrawal | `linkedin.com/in/harshitagrawal` | `www.linkedin.com/in/harshit-agrawal-techie` |
| Paul Savluc | `linkedin.com/in/paulsavluc` | `www.linkedin.com/in/paul-savluc/` |

---

### Solution

Update the `href` attributes in `src/pages/About.tsx`:

**Line 190** - Harshit Agrawal's LinkedIn:
```tsx
// Before
href="https://linkedin.com/in/harshitagrawal"

// After
href="https://www.linkedin.com/in/harshit-agrawal-techie"
```

**Line 219** - Paul Savluc's LinkedIn:
```tsx
// Before
href="https://linkedin.com/in/paulsavluc"

// After
href="https://www.linkedin.com/in/paul-savluc/"
```

---

### File to Modify

| File | Change |
|------|--------|
| `src/pages/About.tsx` | Update both LinkedIn URLs (lines 190 and 219) |

