# Creators 101 campaign

Entry: https://elf.pink/f/campaign/creators-101

Reference supplied by Fuad on 10 November 2026:
https://app.foxy.ai/f/campaign/creators-101
The campaign assigned funnel e3577616-1d98-4658-8059-8eb4f7bd6c9f, version 6.

The campaign uses the source step DOM, CSS, option definitions, custom React
artifacts and media captured on 11 November. Media is served locally from
campaign/assets. The custom artifacts use a MessagePort host; the source replay
recorder and source analytics are excluded. Branding is Elf and the source
review-count claim is hidden. The existing marketing site is retained.

Guest flow:
welcome → photo/new character → gender → photo introduction and local photo,
or the selected gender's full questionnaire → signup → existing Elf paywall
→ existing MAVS/Pagator Sandbox checkout.

Google uses the existing Auth.js session and registered callback
https://elf.pink/api/auth/callback/google. Its post-login destination is
/creators.html#signup; the verified signup intent is consumed by the shared
paywall app, avoiding immediate page navigation after its registration event.
Email is the existing browser-local preview account. Apple is not configured
and is not shown. Photos remain in memory on the user's device. No backend
image generation, face recognition or photo upload has been added.

## Google Analytics

Existing GA4 stream: G-E1QPWQ2FDF. tracking.js bridges frontend funnel events
and the shared registration/checkout paths. Relevant events: funnel_step_view,
quiz_animation, quiz_complete, sign_up, begin_checkout, sandbox_checkout_return.
No Purchase is emitted for a sandbox/browser return. User answers, free text,
email, photos and card details are not included in our event parameters.

## TrackWill preparation

No TrackWill URL has been supplied yet. tracking-config.js contains the public
configuration slot trackwillUrl (currently null) and clickIdParams. Set the
TrackWill campaign destination to the Elf entry URL above and use the resulting
tracking link in ads. Do not redirect the landing back to its incoming tracker.
The config URL slot is descriptive/readiness configuration, not an automatic
redirect. No external tracking requests/postbacks are sent until configured.

UTM parameters, fbclid/gclid and configured click identifiers persist in browser
session storage across quiz, Google return, paywall and payment return. A fresh
ad click replaces previous attribution. Common prepared parameters: clickid,
click_id, subid, sub_id, twclid. Confirm TrackWill's actual click parameter when
the link is delivered, and adjust clickIdParams if needed.

A live registration/sale postback contract, campaign identifiers and any secret
needed by TrackWill still require the buyer's configuration. They are not
invented by this preparation. Checkout order bodies and sandbox safety checks
are unchanged. A live-payment switch is outside this release.
