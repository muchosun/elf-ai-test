# Elf analytics funnel

Primary stream: G-3K8JP3QX9T through GTM-W492TPB5. The older G-E1QPWQ2FDF remains installed; never add counts across these streams.

## Status

Request templates in `analytics/` are prepared, not saved GA4 Explorations. The currently accessible Google account exposes LustAI only, not Elf. Resolve the numeric property ID by listing streams and matching G-3K8JP3QX9T before applying any definitions. Never configure LustAI instead. Browsing and event-collector acknowledgements do not prove visibility in GA4 reports.

## Primary journey

Welcome (`funnel_step_view`, step=welcome) → `quiz_start` → `quiz_complete` → `sign_up` → `paywall_view` → `qa_checkout_opened` → `qa_form_started` → `qa_form_filled` → `qa_payment_simulated`.

`quiz_complete` fires when the signup choice is reached, before selecting Google or email; it is stored once per locally saved quiz. `sign_up` counts first registrations; repeat login does not count. A closed new-user funnel excludes returning users who log in instead. The separate checkout funnel starts at `paywall_view` and includes returning users. The separate 7-step legacy preland funnel starts at `preland_view`, then sign_up and the checkout path. Its CTA currently opens the app signup directly, bypassing the campaign quiz. Do not splice the quiz steps into that legacy journey or require preland for ads landing directly on the campaign.

Use indirect following, closed funnel, full calendar dates, hostName=elf.pink, exclude sessionSource=qa. Break down by device, country, source/medium and campaign separately; inspect volumes before interpreting small cells. Funnel users are ordered users, not independent event totals. Do not infer a conversion from dividing arbitrary event counts.

The legacy `preland_cta` is queued before navigation and dispatched on the destination page with its original page_location. No waiting callback or arbitrary redirect delay is required. This records the CTA handoff when the destination loads; an unavailable destination will leave it pending.

## Final amount

On `qa_payment_simulated`, numeric `value` and `order_amount` equal the full catalog amount due now, with `currency=USD`, full `plan` code and safe attempt UUID. Starter annual is 72 (not its monthly equivalent 6); monthly is 9; Creator annual is 312. No cardholder or input values are read for these fields.

`order_amount` is deliberately emitted only on the terminal event. Intermediate events may also have `value`; summing all event value would overcount one journey. Register `order_amount` as event-scoped CURRENCY custom metric using the supplied JSON. Register low-cardinality dimensions in `custom-dimensions.json`; do not register attempt_id as a high-cardinality UI dimension. Use `report-order-amount.json` filtered to qa_payment_simulated for the sum and `eventCount` for the number of attempts; divide to obtain average selected amount per completed test attempt. Unique interested users use totalUsers. Repeated attempts by one user can contribute multiple test orders. For strict deduplication in raw exports, use attempt_id plus the terminal event, not all events.

This is test intent, not purchase revenue or money transferred. No purchase event is produced. Do not sum catalog USD amounts as MRR; annual and monthly plans must be separated. Tests use utm_source=qa and utm_medium=manual so they can be excluded from marketing results.

## Configure in GA4 when access is available

1. Verify that the property contains stream G-3K8JP3QX9T and website elf.pink.
2. Create missing custom dimensions and Test order amount metric, without duplicating existing definitions.
3. Save Explore → Funnel exploration with the steps in `funnel-new-users.json`; a Data API request describes a report and does not itself create a saved Exploration.
4. Save the shorter checkout funnel and a plan/source/medium amount table. Match event conditions, include currency and use full periods.
5. Verify sign_up and qa_payment_simulated in Realtime/DebugView with a labeled QA visit, then inspect reporting after processing. Mark these as key events only under their actual names; do not relabel a simulation as purchase.
6. Compare controlled test attempts with collector results. Keep QA and business reports separate.

Before custom definitions are available, `report-order-value-fallback.json` uses the built-in `eventValue` metric filtered to qa_payment_simulated only, without unregistered plan dimensions. This provides a selected-amount total after GA4 processing without a new custom metric. Custom definitions may take 24–48 hours to become usable after creation; do not treat collector acknowledgements as populated reports.

## Potential volume

Once non-QA data exists: expected completed test intents = planned unique eligible visitors × measured visitor-to-test-intent rate. Expected selected order amount = expected intents × average selected total. This is a scenario, not a revenue forecast; expose sample size, observation period, traffic/geography/device mix and uncertainty. No production baseline is currently confirmed in accessible GA4, so no numerical forecast is asserted.

Reference schemas: https://developers.google.com/analytics/devguides/reporting/data/v1/rest/v1alpha/properties/runFunnelReport and https://developers.google.com/analytics/devguides/config/admin/v1/rest/v1beta/properties.customMetrics .

## TrackWill link and correlation
The supplied r.trwl1.com link returns source_id=facebook, sub4=1003891172735447, and an opaque sub5. Preserve them across the same-origin journey. GA stage events carry trackwill_sub5 and source_id for correlation; card or account fields are not involved. The role and reporting of this identifier inside TrackWill still require dashboard confirmation. The supplied URL remains the ad entry point; do not redirect internal signup/checkout links back through it. No sale postback is implied by a browser Pixel event. Manual opening does not expand Meta campaign/ad macros and does not create an actual fbclid. Current destination does not forward campaign UTM labels; GA campaign attribution needs an agreed tracker destination template in addition to storing sub5.
