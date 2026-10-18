# Firestore Security Specification - Jouri Boutique

## Data Invariants
1. Products must have valid string `id`, `title`, non-negative `priceUSD`, `category`, and array of `images`.
2. Products must not contain malicious oversized strings or arbitrary unauthorized root fields.
3. Settings document (`/settings/store`) stores the single source of truth for global boutique configuration, including contact links, store location, exchange rate, and admin security password.
4. Reads for products and settings are globally accessible to all storefront visitors across devices.
5. Updates and writes require valid data formatting adhering strictly to field size limits and types.

## Dirty Dozen Attack Payloads
1. Product with 2MB title string -> REJECTED (exceeds size limit)
2. Product with negative priceUSD -> REJECTED (invalid price)
3. Product missing required title or priceUSD -> REJECTED (missing required fields)
4. Product with arbitrary injection fields like `__proto__` -> REJECTED (hasOnly validation)
5. Settings update with invalid exchange rate (NaN or negative) -> REJECTED (rate validation)
6. Settings update with 5KB URL payload -> REJECTED (URL length validation)
7. Document ID containing forbidden characters or > 128 chars -> REJECTED (isValidId guard)
8. Array of images exceeding maximum allowable length (20 images) -> REJECTED (array size guard)
9. Tampered document ID path pointing to arbitrary subcollections -> REJECTED (global default-deny catchall)
10. Unsanitized sizes array exceeding size boundary -> REJECTED (array guard)
11. Settings document ID other than valid identifier -> REJECTED (isValidId guard)
12. Empty string for required fields (title, addressText) -> REJECTED (minLength guard)
