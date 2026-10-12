Source capture: https://foxy.ai/of-creators, 2026-10-12.

These files retain the published component/runtime code and bundled license notices.
The top-bar component's three statements are changed to Elf preview statements;
available source font URLs are mapped to local assets. No source analytics,
payment, advertising, login or marketing-widget scripts are included.

The original page's scroll targets are retained in preland-motion.js:
three columns, onInView/start end → end end, y 100→0 / 0→100 / 100→0;
footer onScrollTarget viewport threshold 1; sticky CTA y 130→0,
spring bounce 0, duration .8, delay 0.

The original FAQ item is exported for standalone mounting; its content is supplied from Elf. Original Video and Pricing components are also used. Pricing adds one layout-effect notification (`elf:offer`) for our registration/checkout; source signup links are rewritten to our site and cancellation labels identify sandbox checkout. Component layouts, state handlers, prices and slider levels remain source code. React effect notifications return no cleanup value.
