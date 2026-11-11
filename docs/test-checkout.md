# Elf test checkout release

Default checkout on Elf now opens `/test-checkout.html?plan=annual` (or another allowlisted catalog offer). Google/email sign-in stays in the main product. There is no email field or hidden email transfer to checkout or GA4. Original MAVS sandbox is still explicitly selectable with `?checkout_provider=mavs` on the main app.

## Screen

Based on the saved MAVS screen: `outputs/creators-101-20261111/public-checkout.png`. Light background, white rounded fields, Name on card → Card number → Expiry date / Security code, pink Submit, inline Visa/Mastercard marks, language row and working legal dialogs. Desktop uses summary/form columns; mobile stacks them. A visible notice before the fields says this is a test and asks for synthetic details. The sample helper is not shown on the checkout. For QA use a fictional name (Alex Example), Visa4111111111111111 or Mastercard5555555555554444, expiry12/30, CVC123. Other synthetic Visa/Mastercard-format numbers with a valid checksum, valid future expiry and three-digit CVC also complete the test. Real card verification is not attempted. Result thanks the user for a test payment and explicitly says no transaction was processed or charged. No Purchase or fake bank decline is emitted.

## Measurement in Google Analytics

Use GA4 G-E1QPWQ2FDF, Events / Realtime, or a funnel exploration with these events:

| Event | Meaning |
|---|---|
| qa_checkout_opened | Isolated form initialized |
| qa_form_started | At least one field was edited / nonempty on submit |
| qa_form_filled | All visible fields were nonempty at least once (not necessarily valid) |
| qa_validation_failed | Submit had incomplete or incorrectly formatted test fields |
| checkout_form_completed | Valid-format test form submitted, fields cleared, result opened |
| qa_payment_simulated | Test payment simulation completed; no bank transaction or charge |

Each event includes allowlisted plan, illustrative amount, USD, outcome:test_only and random UUID attempt_id. GA's standard pseudonymous browser identifier provides browser-level user counts; account identity or cross-device matching is not implemented. A new checkout view gets a new attempt ID, so repeat visits are separate attempts. A completion must match the recent plan/attempt marked complete by the host and is consumed once. Attempt metadata expires after30min. Storage blocking fails safely; completion analytics may be absent if sessionStorage is unavailable.

There is no separate admin database. GA retains the safe event metadata; fields are never included. For the current test, use the event funnel to compare opened → started → filled → completed and break down by tariff. `attempt_id` is transmitted as an event parameter; it is not registered as a high-cardinality custom reporting dimension. Raw per-attempt analysis would require a suitable GA export/query setup. Registration events remain sign_up. Source attribution comes from the existing tracking bridge.

Missing started/completed is not conclusive evidence of no input: blockers, consent, browser closure and network failures can suppress telemetry. Neither event counts nor test submissions are bank transactions, verified financial orders or payment conversion. No test event is renamed Purchase. Source queue retries pending IDs across page navigation; exactly-once transport is not guaranteed.

## Data boundary

- Input document runs in `sandbox="allow-scripts allow-forms"`, without allow-same-origin. Its DOM cannot be read by the host analytics, and its browser storage is denied.
- Child CSP: hashed inline script, local CSS, no analytics/recorder/dependencies, `connect-src 'none'; form-action 'none'; worker-src 'none'`. No input has a name attribute. Only fixed stage and bounded height messages leave the frame.
- Parent validates iframe WindowProxy, opaque null origin, exact message shape and allowlisted stages. It never reads or forwards field values. Open/start/filled are emitted once per view; failed submits capped at10.
- Fields clear before completion/back and on pagehide/pageshow. Parent persists only safe attempt metadata and the existing safe analytics queue/advertising attribution.
- No Meta Pixel is loaded on the QA checkout. GA may generate standard host engagement events like scroll. no-referrer and noindex are set; noindex is not access control.
- Browser extensions, OS/password managers and an existing service worker are outside the page's guarantee. This is not PCI certification or a production card-processing service.

## Build / QA

`npm test`, `npm run build`, `git diff --check`. Build computes child script CSP hash and copies static checkout files. `scripts/test-checkout-audit.cjs` verifies fixtures, clearing, no Email, desktop1440/mobile390, legal dialogs and Escape, iframe isolation, network/storage blocking, safe requests/messages/events, matching attempt IDs, correct prices and no refresh replay. Tag is stubbed in that privacy audit. Separate `scripts/test-checkout-ga-smoke.cjs` checks actual GA collect HTTP acknowledgements; this is not a GA reporting-UI verification.

Artifacts under `output/playwright/test-checkout/` are local-only and excluded from deployment. Visa SVG source: Simple Icons v11. Mastercard colored symbol: Wikimedia original `Mastercard-logo.svg`; wordmark omitted. Both are inlined; input document requests no logo resources.

## Card-entry mechanics

The input document formats numbers into four-digit groups (up to19digits), strips nonnumeric pasted characters, preserves digit-based caret/selection, and supports Backspace/Delete across grouping separators. Visa and Mastercard (including2221–2720) are recognized locally by prefix; a matching logo appears in the number field and the other summary logo dims. Unknown/cleared prefixes restore the generic state. This is brand formatting, not issuer/account verification. Expiry is formatted MM / YY, CVC is numeric with3digits. Blur hints check number format/checksum, month/expiry and CVC length locally. Submit checks field format rather than a fixed fixture whitelist. This does not verify whether the number is issued or belongs to the visitor.

Helpers are inlined into the existing hashed CSP script at build time; no new runtime dependencies, network calls, card-brand events or field-value messages are introduced. Unit tests cover prefix/checksum/date boundaries. `scripts/test-checkout-masks.cjs` exercises real typing, a browser paste event (no OS clipboard access), caret/selection editing, separator deletion, logo changes, desktop/mobile, local hints, privacy and QA completion.

## Compact test disclosure

The large colored banner was replaced by one readable 13px note directly before the fields: “Test checkout — no charge. Do not enter real card details.” It is visible before typing, in normal document flow, with no delayed reveal or fine-print hiding. Duplicate test wording was removed from the plan CTA; privacy/terms and the explicit result message remain. No validation, data isolation or analytics behavior changed.

## Expanded Order Summary

Display data is projected from the existing offers/checkoutPlans catalog in `test-checkout/order-summary.js` and embedded in the sandbox at build time. It includes plan name, credits per month, monthly equivalent, billing period, full-period total and USD. Annual plans show the monthly-plan rate as a comparison, cost of12months at monthly pricing, exact dollar savings and the catalog's rounded percentage discount. Monthly plans hide annual savings and crossed-out pricing. No fees, subscription functionality or catalog prices were added.

Example: Starter Annual is80credits/month, $6monthly equivalent, $72for12months, compared with $9monthly/$108for12months; saving$36, rounded33%. The wording distinguishes the monthly equivalent from the yearly total. Initial HTML uses neutral loading placeholders instead of flashing a wrong plan price. The payment logic and GA event payloads are unchanged.

Unit tests verify all14 catalog variants and arithmetic invariants. Browser QA checks Starter monthly/annual, Creator monthly/annual, highest Pro annual, mobile390/desktop1440, discount visibility, no horizontal overflow and a full simulated-payment completion. Screenshots: `output/playwright/elf-order-summary/`.
