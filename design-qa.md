# Foxy → Elf landing fidelity QA, 2026-10-12

Status: visual prelanding QA passed; public offer handoff passed; end-to-end browser checkout verification blocked by network access. This is not a claim that the full Foxy application was reproduced.

Reference: https://foxy.ai/of-creators. Local preview: http://127.0.0.1:4173/of-creators.html?v=20261012-2.

## Scope and intentional differences
Original rendered structure, CSS, fonts, media, Framer components and Motion runtime are retained. Elf brand, local registration, preview disclosures and Sandbox checkout remain. Foxy customer counts, reviews, creator earnings and unsupported generation claims are not presented as Elf results. Source signup, payment, tracking and promotional credits widget are excluded. FAQ answers describe the actual preview.

## Visual evidence
Paired captures use identical 1440×900 desktop and 390×844 mobile viewports. Hero videos are paused temporarily at the same frame for comparison; normal playback is restored afterward.

- `evidence/clone-20261012/compare-desktop-hero-final.png`
- `evidence/clone-20261012/compare-mobile-hero-final.png`
- `evidence/clone-20261012/compare-creator-final.png`
- `evidence/clone-20261012/compare-gallery.png`

Fonts, original font weights, colors, corner radii, spacing, media crops and card structure match the reference. The final Creator comparison preserves the source's previously selected Pro credit level; its inactive Pro amount differs because the local page was freshly loaded at level zero. Creator selection and price are identical. Gallery at scroll Y=536, desktop: source and local transforms are exactly 47.4774px / 51.7007px / 48.062px for the three columns.

## Interactions and corrections
- Original TopBar variants cycle every 2500ms with source springs.
- FAQ uses source 0.5s cubic transition [.7,0,.3,1]; open state verified in the browser.
- Videos use source viewport loading, looping and autoplay.
- Sticky CTA and footer retain source motion values.
- Source pricing supports Starter, Creator and five Pro levels, monthly/yearly selection. CTA carries the selected offer into own registration/paywall.
- Initial hero subtitle caused geometry drift; restored source subtitle and verified identical mobile 56px heading bounds.
- Initial React offer notification returned a boolean cleanup and broke tier switching; corrected to return undefined. Fresh browser has no errors after switches.
- Old cached local stylesheet hid billing selection pill; removed old override and bumped asset versions. Final paired capture confirms the source pill.
- Earlier default CDP captures had incorrect cropping; final evidence uses explicit viewport clips.

## Functional checks
Root tests and server tests pass. Server catalog verifies all 14 fixed amount combinations and rejects client amount/card overrides. Production build succeeds. Browser reload + Pro/monthly + FAQ produces only localhost/data asset requests, with no external source tracking and no console errors. Vercel function deployment is Ready and public health returns checkoutEnabled=true. GitHub Pages run 38245974592 succeeded for e72299a. Published pricing and Creator Annual handoff verified in-browser: $26/month, $312/year. Browser checkout timed out. Direct DNS addresses 64.29.17.3 / 216.198.79.3 are unreachable from the current network; resolving the same hostname to Vercel edge 216.198.79.195 with normal TLS validation returns health 200 and checkout 200, sandbox=true, trusted pagator.app origin. No browser/network settings changed. Hosted form navigation also timed out, so its rendered amount and full payment path remain unverified. No card data entered or payment submitted. Public screenshot: evidence/clone-20261012/public-mobile-final.png.
