# Elf test checkout release

Default checkout on Elf now opens `/test-checkout.html?plan=annual` (or another allowlisted catalog offer). Google/email sign-in stays in the main product. There is no email field or hidden email transfer to checkout or GA4. Original MAVS sandbox is still explicitly selectable with `?checkout_provider=mavs` on the main app.

## Screen

Based on the saved MAVS screen: `outputs/creators-101-20261111/public-checkout.png`. Light background, white rounded fields, Name on card → Card number → Expiry date / Security code, pink Submit, inline Visa/Mastercard marks, language row and working legal dialogs. Desktop uses summary/form columns; mobile stacks them. The form opens without a test banner: the visible trust line reads “Your payment details are encrypted and securely protected.”, and the only remaining test wording is inside the legal dialogs and on the result screen. The sample helper is not shown on the checkout. For QA use any name (Alex Example), any 12–19 digit number, expiry12/30, CVC123; Visa4111111111111111 and Mastercard5555555555554444 are convenient fixtures. Brand detection and the Luhn checksum are presentation only, so any well-formed number with a future expiry and 3–4 digit CVC completes the test. Real card verification is not attempted. Result reads “Payment complete” and keeps one line saying this is a test product with no real charge. No Purchase or fake bank decline is emitted.

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
- Meta Pixel is loaded only on the surrounding checkout host and the cleared result document, never inside the opaque-origin input frame. InitiateCheckout and custom TestPaymentSimulated contain catalog data and a random attempt UUID only. Automatic configuration is disabled. No default Purchase is emitted. GA may also generate standard host engagement events like scroll. no-referrer and noindex are set; noindex is not access control.
- Browser extensions, OS/password managers and an existing service worker are outside the page's guarantee. This is not PCI certification or a production card-processing service.

## Build / QA

`npm test`, `npm run build`, `git diff --check`. Build computes child script CSP hash and copies static checkout files. `scripts/test-checkout-audit.cjs` verifies fixtures, clearing, no Email, desktop1440/mobile390, legal dialogs and Escape, iframe isolation, network/storage blocking, safe requests/messages/events, matching attempt IDs, correct prices and no refresh replay. Tag is stubbed in that privacy audit. Separate `scripts/test-checkout-ga-smoke.cjs` checks actual GA collect HTTP acknowledgements; this is not a GA reporting-UI verification.

Artifacts under `output/playwright/test-checkout/` are local-only and excluded from deployment. Visa SVG source: Simple Icons v11. Mastercard colored symbol: Wikimedia original `Mastercard-logo.svg`; wordmark omitted. Both are inlined; input document requests no logo resources.

## Card-entry mechanics

The input document formats numbers into four-digit groups (up to19digits), strips nonnumeric pasted characters, preserves digit-based caret/selection, and supports Backspace/Delete across grouping separators. Visa and Mastercard (including2221–2720) are recognized locally by prefix; a matching logo appears in the number field and the other summary logo dims. Unknown/cleared prefixes restore the generic state without blocking submit. This is brand formatting, not issuer/account verification. Expiry is formatted MM / YY, CVC is numeric with3–4digits. Blur hints check only number length, month/expiry and CVC length locally. Submit accepts any 12–19 digit number with a future expiry and 3–4 digit CVC rather than a fixed fixture whitelist. This does not verify whether the number is issued or belongs to the visitor.

Helpers are inlined into the existing hashed CSP script at build time; no new runtime dependencies, network calls, card-brand events or field-value messages are introduced. Unit tests cover prefix/checksum/date boundaries. `scripts/test-checkout-masks.cjs` exercises real typing, a browser paste event (no OS clipboard access), caret/selection editing, separator deletion, logo changes, desktop/mobile, local hints, privacy and QA completion.

## Test disclosure

The large colored banner was removed entirely. The visible trust line now reads “Your payment details are encrypted and securely protected.”, matching a normal hosted checkout. The result screen is titled “Payment complete” and carries one short line: “Test product — no real charge was made.” Terms and privacy dialogs describe the simulated payment behind a click, so neither interrupts the form. No validation, data isolation or analytics behavior changed.

## Expanded Order Summary

Display data is projected from the existing offers/checkoutPlans catalog in `test-checkout/order-summary.js` and embedded in the sandbox at build time. It includes plan name, credits per month, monthly equivalent, billing period, full-period total and USD. Annual plans show the monthly-plan rate as a comparison, cost of12months at monthly pricing, exact dollar savings and the catalog's rounded percentage discount. Monthly plans hide annual savings and crossed-out pricing. No fees, subscription functionality or catalog prices were added.

Example: Starter Annual is80credits/month, $6monthly equivalent, $72for12months, compared with $9monthly/$108for12months; saving$36, rounded33%. The wording distinguishes the monthly equivalent from the yearly total. Initial HTML uses neutral loading placeholders instead of flashing a wrong plan price. The payment logic and GA event payloads are unchanged.

Unit tests verify all14 catalog variants and arithmetic invariants. Browser QA checks Starter monthly/annual, Creator monthly/annual, highest Pro annual, mobile390/desktop1440, discount visibility, no horizontal overflow and a full simulated-payment completion. Screenshots: `output/playwright/elf-order-summary/`.

## Full Meta funnel QA

Browser stages: PageView → CompleteRegistration → InitiateCheckout → custom TestPaymentSimulated. Checkout hooks accept only safe catalog-shaped plan codes, numeric offer values and UUID attempts, ignore extra properties, and deduplicate each stage per attempt/page. Result consumption prevents refresh replay. A separate, explicitly authorized single Purchase for Meta activation may be sent in Meta Test Events after a real QA journey; it is not automatically emitted for ordinary visitors and is not bank payment proof. Full tracker verification requires the actual TrackWill entry URL.

## Google Tag Manager
`GTM-W492TPB5` loads through `tag-manager.js` on the landing, campaign, app, checkout host and consumed result only. It never loads in the isolated input frame. The supplied published container currently targets `G-3K8JP3QX9T`; existing direct GA4 `G-E1QPWQ2FDF` is retained. Keep overlapping event tags disabled in GTM to avoid duplicates in the same destination. The bootstrap sets `user_data` to null and denies advertising user data/personalization before container loading. Only existing allowlisted stage events enter the shared dataLayer; payment fields never do. Container edits require a fresh privacy and duplicate-event audit.
