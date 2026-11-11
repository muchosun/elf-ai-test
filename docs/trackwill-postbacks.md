# Elf TrackWill postbacks

Source contract read in the authenticated Addop docs on 11 November 2026 (review dated 15 October):
- https://docs.addop.io/doc/z1-postbek-ot-partnyora-format-i-shablon-ttSGICSY0v
- https://docs.addop.io/doc/z2-tipy-konversij-L1fWGUxzjv
- https://docs.addop.io/doc/z3-ccv1ccv3-dopolnitelnye-chisla-konversii-ut3ZVuxO6j
- https://docs.addop.io/doc/z6-proverit-postbek-samomu-ckXZTh56GR

Igor's Elf setup: Addop Social, offer 47749, campaign 134282; sub5={click.id}, sub4=1003891172735447. His latest instruction was to test the lead first. The linked contract explicitly uses type=reg for registration; arbitrary valid types are accepted even without a custom report column. Goal format is 3–30 letters/digits/underscore/hyphen, normalized lowercase. Repeated calls create additional conversions: the tracker does NOT deduplicate identical click IDs/types.

## Active protocol

Browser → same-origin POST /api/trackwill → fixed GET https://s2s.trwl1.com/api/v1/conversion.

Registration: type=reg, clickid from saved sub5, id is a stable per-delivery UUID. No payout is sent. The constant pixel_id and a genuine nonempty fbclid are forwarded for registration attribution. Both first Google and first email signups use the same sign_up hook; repeated login has no hook.

Completed test order: type=elf_test_order, clickid, id=checkout attempt UUID, payout=0, need-payout=false, currency=USD, ccv1=full selected catalog amount. Starter annual sends ccv1=72, not its monthly equivalent 6. The server computes amounts from the fixed offers catalog and rejects arbitrary client values. The test-order postback omits pixel_id/fbclid so it does not request paid Meta forwarding. It does not use sale. ccv1 is additional numerical data, not tracker Revenue. Receiving offer/network payout overrides must still be checked in Conversions; a zero payout in the request alone is not proof of final recorded Revenue.

A custom column for elf_test_order and a selected-amount custom metric referencing ccv1 can be added in the Social workspace when access is available. An unmapped valid type can already be accepted and visible in Conversions without its own report column. CCV values are inspected in Postback logs or custom metrics, not assumed to be columns in Conversions.

The API requires both HTTP success and documented JSON {"code":200}. JSON code=400, unknown replies or transport failures never create a successful receipt. Logs include event type, delivery UUID, hashed click key, provider code and UTC time, without card fields, email, fbclid or raw signed cookies. Browser/server requests never contain payment input values.

## Configuration

TRACKWILL_ENABLED=true
TRACKWILL_REGISTRATION_TYPE=reg
TRACKWILL_TEST_ORDER_TYPE=elf_test_order
TRACKWILL_TEST_GOAL_CONFIRMED=true

AUTH_SECRET, already used by the site, signs receipt cookies. The public tracking config enables the first-party client. No access token is embedded in frontend code.

## Dedupe and delivery bounds

- Safe metadata queue in localStorage, up to 40 records, ignored after 24h; no cardholder/card/CVC/email fields. Registration and test order are distinct per-click keys.
- Mark sending before fetch and keep accepted/unknown states across page transitions. Browser Web Locks serialize same-origin tab delivery where available. keepalive allows requests to survive navigation.
- Signed HttpOnly receipt cookies suppress repeat delivery for the same click/type across warm and cold server executions for 24h (up to 8 recent delivery keys). An in-process lock suppresses simultaneous calls in a warm instance.
- Unknown network delivery is NOT automatically retried: first check logs, as every upstream repeat can create a duplicate. Blocked storage skips postbacks rather than bypassing the user's storage choice.
- No claim of global exactly-once across distinct devices or simultaneous first requests in different instances. That would need a shared durable idempotency store. Test reloads and first-party receipts protect the normal single-browser journey.

## Verification boundaries

Tests cover exact contract replies, fixed destination, type/UUID/catalog validation, exclusion of personal/payment fields, non-income ccv1 amount, cookie signatures/cold-start dedupe, concurrent warm-instance calls, persistent client state, tampered queue rejection and no automatic retry on uncertainty.

The real release audit opens the supplied campaign link, creates one fresh QA registration and one completed test order. It verifies first-party requests and TrackWill's normalized accepted response, selected amount and reload behaviour. It does not fabricate click IDs or refresh live postback URLs. Do not paste active postback URLs into Slack, because previews can send another conversion.

TrackWill Conversions/Postback logs and custom report-column mapping require access to the tracker workspace. A provider code=200 is accepted delivery, not a claim that those screens were inspected. No old QA registration/order is backfilled automatically. Meta Purchase activation tests are separate and are not repeated by this integration.
