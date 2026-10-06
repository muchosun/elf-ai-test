# Elf prelanding and funnel entry QA — 2026-10-06

final result: passed

Scope: new of-creators prelanding, source hero/media/layout, local registration entry, return navigation, UTM and proposed price continuity. This pass does not claim complete product cloning. The previously identified Upload face photo creative mismatch remains outside this pass and is still unresolved.

## Visual evidence

Source: https://foxy.ai/of-creators, live in-app browser tab 8. Full source DOM/styles and desktop/mobile captures in evidence/preland-*; real public media downloaded locally.
Implementation: http://127.0.0.1:4173/of-creators.html.

- Mobile CSS viewport 390×844; source evidence/preland-mobile-top.png and implementation evidence/elf-preland-mobile.png, both 375×812 screenshot pixels (same in-app density/scrollbar normalization). Side-by-side evidence/compare-preland-mobile.png was opened and inspected.
- Desktop CSS viewport 1440×900; source evidence/preland-desktop-top.png and implementation evidence/elf-preland-desktop.png, both 1425×891 screenshot pixels. Side-by-side evidence/compare-preland-desktop.png was opened and inspected; source renders a centered portrait hero at this size.
- Whole mobile page: evidence/preland-mobile-full.png (375×9330), evidence/elf-preland-mobile-full.png (375×8949), opened together in evidence/compare-preland-full-mobile.png. Height difference follows shorter own preview copy and one consistent test plan instead of three source plans.
- Focused readable first-screen comparison is the mobile side-by-side above. Section captures retain readable source and implementation evidence for media, pricing, FAQ and footer.

## Required fidelity surfaces

- Fonts: captured Rethink Sans/Parisienne styles and locally downloaded font files; existing Rethink Sans variable face used by the app. Hero size, weight, wrapping and CTA typography match the captured layout. Own Elf wordmark follows the existing prototype's branding.
- Spacing: captured Framer layout, section/card dimensions, hero alignment, CTA width, radii, gradients and section rhythm retained. Mobile hero text and CTA align with source. Desktop subtitle is shorter because it is own preview copy; its group remains aligned to the CTA.
- Colors: original pink/red/white/black tokens and captured decorative/source SVG assets retained. No handcrafted illustrations introduced.
- Images: source hero video downloaded completely (2,571,637 bytes), browser decodes and plays the local file. Images and secondary videos are local, with no missing images or external media URLs in DOM. One 4K/60fps secondary video was resized to 720px/30fps for its small slot. Different video frames in paired screenshots are expected playback differences, not substituted creatives.
- Copy: own brand, preview note, example labels, adapted FAQ, company/address removal and test price continuity are intentional. Source claims about reviews, customer counts, performance and paid generation were not transplanted as Elf facts. No source marketing popup, third-party registration, payment, or tracking scripts execute.

## Comparison history and fixes

- Initial DOM pass found leftover Creator/Pro prices after adapting pricing. Removed both source cards completely and verified a single $9 monthly / $6 equivalent annual ($72/year) test plan.
- Initial FAQ wiring reused IDs in hidden responsive variants. Gave each question/answer a unique pair; rechecked visible answer expansion in desktop/mobile.
- Initial typography wiring referenced the source font's name rather than its stored local hash. Corrected it before the first rendered comparison.
- Final hero desktop/mobile paired comparisons showed no actionable P0/P1/P2 mismatch within the adapted preview scope. Full page comparison showed the same section order and source media. Intentional copy/offer changes account for the height and content differences.

## Interactions and verification

- Guest root redirects to of-creators.html; direct signup remains available.
- Hero Get Started -> local signup preserves query/UTM. Signup Back returns to prelanding with query preserved.
- All conversion links point to local signup/login. Auxiliary links use local sections or the preview-information dialog.
- Monthly/yearly prices switch and persist the selected plan for the app.
- FAQ opens/closes via pointer and supports Enter/Space; unique aria-controls/expanded states.
- Sticky CTA appears once the hero leaves view; hero video plays only when in/near view, and a real extracted video poster covers reduced-motion/non-autoplay entry.
- Full browser smoke on a separate clean test origin (127.0.0.1:4175): root -> preland -> signup -> interests -> character choice -> paywall. Reload retained paywall; returning root retained signed-in state. No real payment or external account was created.
- npm test passed existing credential/session/storage tests. npm run build passed; static prelanding files and assets included in dist.
- Browser inspection: no broken images, no horizontal overflow, no external media URLs; no error/warning entries in inspected logs. Public publication is checked separately after deployment.

## Follow-up

- Previously identified Upload face photo source contour is still unresolved; this change preserves that screen.
- Local analytics only; no aggregate traffic report is connected.
