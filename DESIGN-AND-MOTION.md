# KŌRA storefront: skills and motion reference

KŌRA is an Angular 19 clothing storefront ("Everyday Garments"). This file explains how its design was built: which design skills were used and what each one decided, plus every animation on the site, with its file, timings and rules. Read it before changing the UI so new work matches what's here.

---

## 1. Stack in brief

| Area | Choice |
|---|---|
| Framework | Angular 19: standalone components, signals, `@if`/`@for`, `input()`/`model()`/`viewChild()` |
| Styling | Tailwind v4 through PostCSS (`@theme`, `@utility`, `@custom-variant dark`). Everything lives in `src/styles.css`, and `tailwind.config.js` has been removed. |
| Motion | GSAP 3 with ScrollTrigger, Lenis smooth scroll and plain CSS transitions. There is one Angular animation trigger (the bag count). |
| Fonts | `@fontsource-variable` packages: **Bodoni Moda** (display), **Geist** (UI and body text), **Geist Mono** (labels and prices) |
| Images | `NgOptimizedImage` with a custom Cloudinary loader (`src/ui/image.ts`), which adds `f_auto,q_auto,w_N,c_limit` |
| Colour | OKLCH semantic tokens with a light theme by default and an opt-in dark theme, and contrast checked against WCAG |
| Back end | Express 5 + Mongoose + MongoDB Atlas + Cloudinary + Stripe Checkout (INR) |

---

## 2. Skills used

The skills come from **github.com/jakubkrehel/skills** and are installed in `~/.claude/skills`. Each one is a set of design rules. If you don't have the skills installed, the "applied here" column lists the rules that now hold for this codebase, so follow those.

| Skill | What it covers | Applied here |
|---|---|---|
| **build-design** | Building UI that uses the project's existing tokens and components | Every page, admin included, uses the tokens and components in `styles.css` rather than one-off styles. The old Tailwind colour scales (gray, slate, zinc, blue, indigo, purple) are redefined to point at the new palette, so older pages pick it up automatically. |
| **better-colors** | Palettes, semantic tokens, contrast | Semantic tokens: `canvas`, `raised`, `sunken`, `fg`, `fg-2`, `fg-3`, `line`, `line-strong`, `accent` (cobalt), `on-accent`, `solid`, `on-solid`, `danger`. Neutrals are warm (hue about 75). Every text and background pair was measured against WCAG AA, in both themes. `.theme-dark` and `.theme-light` let a single section use the other theme. |
| **better-typography** | Type scale, spacing, wrapping, numerals | `@utility` type scale: `type-display-xl`, `type-display`, `type-h1`, `type-h2`, `type-h3`, `type-body`, `type-body-sm`, `type-label` (mono, uppercase, tracked), `type-price` (tabular numerals) and `measure` (about 65ch line length). Headlines use `text-wrap: balance`. Display text uses tight negative letter-spacing. |
| **better-layout** | Grouping, alignment, responsive structure, logical properties | A 12-column editorial grid. `page` utility for side padding: `clamp(1rem, 4vw, 4rem)`. `section-y` for vertical rhythm. CSS logical properties (`inset-inline`, `padding-block`) throughout. The DOM order always matches the visual order, even in flipped layouts. Checked at 320, 768 and 1440 px: no page scrolls sideways. |
| **better-ui** | Radii, shadows, icons, press states, motion values | Radii: `--radius-surface` 14px and `--radius-inset` 6px. Shadows are a hairline ring plus one soft drop. Buttons and size chips scale to 0.96 when pressed. Images get a subtle `.media` outline. Easing tokens: `--ease-out`, `--ease-in-out`, `--ease-swap`. |
| **better-accessibility** | Keyboard, focus, ARIA, forms, motion, zoom (WCAG 2.2) | Skip link. One `h1` per page and no skipped heading levels. Every control has an accessible name and every image has alt text. Size options are native radio buttons. The bag, menu and size guide use native `<dialog showModal()>`, so focus trap, Escape and focus return come for free. Form errors are inline and tied to their fields, and focus moves to the first invalid field. Every animation respects `prefers-reduced-motion`. Touch targets are at least 44px. |
| **better-writing** | Interface copy, errors, empty states | Plain, calm copy in sentence case. Errors say what happened and what to do next ("Check your connection, then try again."). Empty states lead somewhere ("Browse the shop instead"). No `alert()` in the redesigned pages. No placeholder or invented facts: the Contact page shows only real details from the code (delivery fee, Stripe, GST), and the About page mill list matches the fabric origins on the products. |
| **better-interface** | A whole-screen review that combines the skills above | Final review pass on every redesigned route. |

---

## 3. Motion principles (site-wide)

1. **Reduced motion comes first.** Every moving thing is opt-in through `@media (prefers-reduced-motion: no-preference)` in CSS or `gsap.matchMedia('(prefers-reduced-motion: no-preference)')` in JavaScript. With reduced motion on, content shows straight away or uses an opacity fade only, and Lenis never starts.
2. **Never scroll-jack.** Nothing pins the page or takes over scrolling. (An earlier four-step pinned hero was removed because it felt heavy.)
3. **Short and quiet.** UI feedback takes 150–220ms, entrances 300ms, sheets 420ms. The only long sequence is the hero's one-off entrance, at about 1.6s.
4. **Animate only transform, opacity, clip-path and filter.** Never animate layout properties.
5. **Run outside Angular's zone.** All GSAP and Lenis code runs in `NgZone.runOutsideAngular`, so scroll frames never trigger change detection.
6. **Clean up after yourself.** Every GSAP setup returns a `gsap.matchMedia()` that is reverted in `DestroyRef.onDestroy`. Reverting also removes the inline styles if the user switches reduced motion on mid-visit.

### Easing tokens (`src/styles.css` `:root`)
```css
--ease-out:    cubic-bezier(0.22, 1, 0.36, 1);   /* entrances, sheets */
--ease-in-out: cubic-bezier(0.65, 0, 0.35, 1);
--ease-swap:   cubic-bezier(0.2, 0, 0, 1);       /* image swaps, tags */
```
GSAP uses `expo.out`, `expo.inOut` and `power2.out` for the hero, and `none` for anything tied to the scroll position.

---

## 4. Animation inventory

### 4.0 Signature motion language

*Kōra* means cloth fresh off the loom, so KŌRA's own motion comes from how cloth is made and handled: woven, unrolled, picked up, folded. Generic effects (plain fades, wipes) are kept for small UI feedback only. Never use these four outside the moments listed here, or they stop meaning anything.

| Concept | Moment | How it moves | Files |
|---|---|---|---|
| **a. Warp lift** | Editorial photos appear: hero, lookbook looks, edition covers, home brand note, About page photos (wide fabric photo and the three texture photos) | A 1px weft thread is drawn across the middle (0.5s). Then canvas-coloured warp strips (5, 7 or 9 depending on width) part from that line, alternate strips lifting up and dropping down (`yPercent ±101`, 1.05s `expo.inOut`), staggered 55ms from the centre outwards, like heddles opening a shed. The overlay deletes itself when done. Plays once, at `top 82%`. | `src/ui/weave.ts` (`warpLift()` + `[weave]` directive), styles.css 11a |
| **b. Bolt unroll** | Moving between pages | A View Transition (`withViewTransitions`). The new page is uncovered from the top by a `clip-path` polygon whose leading edge hangs lower on one side at 55%, then settles flat (760ms `--ease-in-out`). The old page sinks back underneath (`translate 0 5vh`, `scale 0.97`, `opacity 0.4`). The header has its own `view-transition-name` and stays still. Skipped when only the query string changes (shop filters), when reduced motion is on, or while a pick-up is running. | `src/ui/route-transition.ts`, `app.config.ts`, styles.css 11b |
| **c. Pick up** | Clicking a product card (photo or name) | The visible card photo is cloned into a fixed overlay, which lifts (`scale 1.03`, `y -6`, soft shadow). After the product page renders, it glides into the lead photo's exact box (0.85s `expo.inOut`) with a cloth-like sway (`skewY` 0 to -2.5 to 0), then hands over to the real image. A 4s safety timeout drops it. Modified clicks (open in new tab) are ignored. | `src/ui/handoff.ts`, product-card, product-information (`[data-lead-photo]`), styles.css 11c |
| **d. Folded in** | Adding to bag | When the bag slides open, the new line's thumbnail unfolds from a crease at its top edge (`rotateX -92° to 0`, 760ms, slight overshoot, starting at 320ms so it lands after the sheet). A shadow along the crease fades as it opens, and the line's text settles in after it. | cart-drawer (`.bag-line-new`, `.bag-thumb`, `.bag-copy`), styles.css 11d |

Concepts considered and rejected: section dividers that stitch themselves in (competes with the warp lift, and is decoration rather than meaning), cursor followers and letter-by-letter text reveals (every template has them).

### 4.0b Art direction: Ink & Bone

The site reads like a printed lookbook: most pages are on the bone (light) canvas, and a few **ink chapters** switch to dark tokens with `.theme-dark` (each paints its own `background: var(--canvas)`). Every home section has a different job and composition, so no two sections are the same grid.

| Piece | What it does | Files |
|---|---|---|
| **Set type** | Display headings rise line by line out of masks the first time they scroll into view (GSAP SplitText, `mask: 'lines'`, 1.15s `expo.out`, 90ms stagger). Re-splits on resize and font load; labels the element for screen readers. Off under reduced motion. Use `splitLines` on display headings only, never on body text, and never together with `reveal`. | `src/ui/split-lines.ts`, styles.css 12a |
| **The cloth (ink chapter, home)** | A photo opens from a small rounded window to full-bleed (`clip-path inset`, scrubbed from `top 85%` to `top 15%`). Behind it an oversized italic "Cloth first" drifts sideways (`xPercent 0 → -28`). Not pinned. | `cloth-chapter`, styles.css 12b |
| **Editions index (home)** | Editions set as a large typographic contents list. On pointer devices, hovering a row brings that edition's cover up beside the pointer: it trails with `gsap.quickTo` (0.6s) and leans in the direction of travel (±6°). The other rows dim to 32%. Keyboard focus parks the cover beside the row. Touch screens show a small cover inline instead. | `edition-index`, styles.css 12c |
| **Footer finale (ink)** | The footer is the back cover. The full-width KŌRA wordmark rises letter by letter out of masks, scrubbed over the last stretch of the page. | `site-footer`, styles.css 12d |
| **Re-hang (shop)** | A 2/3/4-per-row switch (radio buttons drawn as column diagrams, saved in `localStorage` as `kora.density`). Changing it moves every card to its new place with GSAP Flip (0.75s `expo.inOut`) instead of jumping. Phones always show two per row. | `shop-page`, styles.css 12e |
| **Contact sheet (product page)** | On md and up, a sticky strip of thumbnails beside the gallery. An IntersectionObserver marks the photo crossing the middle of the screen; clicking a thumbnail smooth-scrolls to its photo (`MotionService.scrollToElement`). | `product-information`, styles.css 12f |
| **Curtain menu** | The small-screen menu drops over the whole screen; its large serif links rise one by one (700ms, 70ms apart). | `site-header`, styles.css 12g |

WebGL was considered and left out on purpose: a shader would need a heavy 3D library, and the cloth-based motion already carries the identity.

### 4.1 Smooth scroll: `src/ui/motion.service.ts`
- Lenis with `lerp: 0.12` and `smoothWheel`, driven by `gsap.ticker` with `lagSmoothing(0)`. Every Lenis scroll event calls `ScrollTrigger.update`.
- Started once from `AppComponent` (`MotionService.init()`). It never starts under reduced motion, and it is destroyed or started live if that preference changes.
- On each route change it jumps to the top (`immediate`) and calls `ScrollTrigger.refresh()` on the next frame.
- `stop()` and `start()` pause scrolling while a dialog owns it. Containers that scroll on their own carry `data-lenis-prevent`.

### 4.2 Home hero cover: `src/components/hero-showcase/`
A single screen, with no pinning. The layout is a 12-column grid: copy in columns 1–7, a framed photo in columns 8–12, and a ticker along the bottom. All the CSS is in section **9** of `styles.css`.

**Entrance** (a GSAP timeline that runs once after the first render):

| Time | Target | Animation |
|---|---|---|
| 0s | `[data-hero-frame]` | **Warp lift** with 11 threads (7 on narrow screens). See 4.0a. |
| 0.3s | `[data-hero-photo]` | `scale: 1.18` to `1`, 2.2s, `expo.out` (the photo settles into its frame) |
| 0.35s | `[data-hero-line]` | `yPercent: 110` to `0`, 1.2s, stagger 0.12, `expo.out`. Each headline line rises out of its own `overflow: clip` mask (`.hero-line`). |
| 0.75s | `[data-hero-fade]` | `opacity 0, y 14` to visible, 0.9s, stagger 0.08, `power2.out` (eyebrow label, lede, buttons, credit, ticker) |
| 1.1s | `[data-hero-fact]` | `opacity 0, y 8` to visible, 0.6s, stagger 0.07 (the fabric chips on the photo) |

**On scroll** (scrubbed from the top of the section to its bottom leaving the viewport): the photo drifts `yPercent: 0 → 8` inside its frame, and the copy moves `y: 0 → -60`.

**Ticker** (`.hero-ticker`): a CSS `@keyframes hero-ticker` running `translate: 0 → -100%`, 38s linear, infinite. There are two copies of the run so the loop is seamless. It pauses on hover and has no animation under reduced motion. It is decorative and `aria-hidden`.

### 4.3 Look tags (shoppable photos): `src/components/look-spread/` + section **10** of `styles.css`
These replaced the old numbered markers.
- A 12px white dot sits on each garment, with a breathing ring: `@keyframes look-tag-ring` takes `scale 0.6 → 1.6` and `opacity 0.9 → 0` over 2.4s, `--ease-swap`, infinite.
- When the tag is active, a pill label (product name and price) slides out of the dot: `opacity`, `translate -6px → 0` and `scale 0.96 → 1`, 180–220ms. The dot scales to 1.25 and the ring stops.
- **Active** means hovering the tag, keyboard focus on it, *or* hovering the same product in the "Shop the look" list beside the photo. A shared `active` signal links the tag and the list row, and the list row turns accent-coloured.
- Tags with x > 60% open to the left (`.look-tag-left`) so the label stays inside the photo.
- Touch screens (`hover: none`) always show the labels with no ring. Reduced motion turns off the ring and the transitions.
- The tags sit inside the parallax layer, so they stay pinned to the garment as the photo drifts.

### 4.4 Parallax: `src/ui/parallax.directive.ts`
- `<div parallax="6">` inside a clipping `.media` frame. The element is scaled up by `1 + amount/50` and moves `yPercent: -amount → +amount` while its parent crosses the viewport (`scrub: true`, `ease: none`).
- Used on lookbook photos (5) and the home page brand-note image (6). It never runs under reduced motion.

### 4.5 Scroll reveals: `src/ui/reveal.directive.ts` + section **8** of `styles.css`
- `reveal` and `[revealOrder]="n"` stagger elements 100ms apart.
- When an element enters the viewport (IntersectionObserver, `rootMargin -10%` at the bottom): `opacity 0 → 1`, `translate 12px → 0` and `filter: blur(4px) → 0` over 300ms ease-out.
- Elements already on screen at load are **not** hidden, so nothing waits for a scroll.
- Reduced motion: opacity only.
- Used on home section headings, The Edit grid (`i % 3`), shop grid tiles (`i % 4`), the lookbook copy, the About page (headings, principles, mill list `i % 4`) and the Contact page quick answers.

### 4.6 Bag drawer and menu (sheets): `src/ui/dialog.ts` + section **7** of `styles.css`
- Native `<dialog class="sheet">` opened with `showModal()`, then `.is-open` is added on the next animation frame.
- The bag slides in from the right (`translate 100% → 0`), the menu from the left (`.sheet-start`). Both take 420ms with `--ease-out`, and the backdrop fades over the same time.
- Closing removes `.is-open` and waits for `transitionend`, with a 450ms fallback.
- Clicking the backdrop closes it (`isBackdropClick`). Lenis is paused while the sheet is open.
- Reduced motion: a 200ms opacity fade only.

### 4.7 Size guide (modal): `dialog.modal`
- `opacity 0 → 1` and `translate 12px → 0` over 300ms with `--ease-out`. Reduced motion skips the movement.

### 4.8 Bag count: `src/components/cart-drawer/cart-drawer.component.ts`
- An Angular animation on the count. When the number goes up, the new value enters from 8px below; when it goes down, from 8px above. 150ms ease-out each.

### 4.9 Product cards: `src/components/product-card/` + section **6** of `styles.css`
- **Image swap** (`.card-swap`): the second image fades in over the first, 300ms with `--ease-swap`, on hover or focus within the card.
- **Quick-add sizes** (`.quick-add`): fade in over 150ms on hover or focus. Always visible on touch screens.

### 4.10 Micro-interactions
- **Buttons** (`.btn`, `.btn-solid`, `.btn-quiet`, `.btn-icon`): colours transition over 150ms ease-out, and the button scales to 0.96 when pressed.
- **Size chips**: the same press scale. They are native radio buttons styled as chips.
- **`.link-underline`**: the underline colour changes to the accent over 150ms.
- **Product page accordions** (`<details>`): the `+` icon rotates 45° over 150ms when opened.
- **Loading skeletons**: Tailwind `animate-pulse`, turned off by `motion-reduce:animate-none`.

### 4.11 Theme switch: `src/service/theme/theme.service.ts`
- While the theme changes, the `.theme-switching` class sets `transition: none !important`, so colours don't visibly smear across the page. An inline script in `index.html` applies the saved theme before the first paint, so there is no flash.

---

### 4.12 About and Contact pages
- **About** (`/about`): display headline, a wide fabric photo with the warp lift and parallax, "The name" (कोरा), "How we work" (three principles beside a sticky grid of texture photos, each with the warp lift), "Where the cloth comes from" (mill towns from the product data) and a closing call to action. All text uses `reveal`.
- **Contact** (`/contact`): the form posts `firstName, lastName, email, phone, subject, message` to `${environment.apiUrl}/contact/send-email`. The topic is chosen with `.size-chip` radio buttons. Errors are inline, focus moves to the first invalid field, and a failed send keeps what was written. Success replaces the form with a confirmation and moves focus to its heading. The "Before you write" column of quick answers uses `reveal`.
- Form placeholders use `--fg-3` (`.field::placeholder`) so they never look like typed text.

### 4.13 Account page (`/profile`, alias `/account`)
- Protected by `accountGuard`: signed-out visitors go to sign in and come back here afterwards (`kora.account-return` in sessionStorage).
- Masthead "Hello, {first name}." with set type, then a section index (vertical serif list with a rule on desktop, a sideways-scrolling pill row on phones) driven by `?tab=orders|details|addresses|password`.
- **Orders:** cards with date, short reference, status pill (`data-status`), line items with thumbnails, total and a receipt download.
- **Your details:** name, email, phone. Changing the email reveals a current-password field (the API requires it).
- **Addresses:** up to 10 Indian addresses (state list, 6-digit PIN), one default; edit inline, remove with an inline "Remove this address?" confirmation.
- **Password:** current, new (8+), confirm.
- Every form: inline errors tied to fields, focus moves to the first problem, server errors land on the field they name.
- API: `/api/user/me` (GET, PATCH), `/me/password`, `/me/orders`, `/me/addresses` (POST) and `/me/addresses/:id` (PATCH, DELETE), all behind `protect` and always using the signed-in user's id. Styles: styles.css 12h.

### 4.14 Saved pieces (wishlist, `/wish`)
- One signal store (`WishlistService`) drives every heart: product cards (`.card-save`, top-right of the photo; shown on hover/focus or when saved, always on touch), the product page Save toggle (`aria-pressed`), and the header count (`.saved-dot`).
- Signed out: saves live in `localStorage` (`kora.saved`) and merge into the account at sign-in. Signed in: `/api/wishlist` (behind `protect`), optimistic updates that roll back on failure.
- Saving pops the heart (`heart-pop`, 420ms, slight overshoot; off under reduced motion).
- Page: "Kept for later." with set type, a summary bar (count, total, sold-out count, sort), the shop's product cards (sizes add straight to the bag), Remove under each card with an Undo.

## 5. Rules for adding new motion

- Use the existing tools first: `weave` for editorial photos, `reveal` for text entrances, `parallax` for image depth, `.sheet`/`.modal` dialogs for overlays. Don't add `weave` to grids of product cards: it is for editorial moments.
- Put any new GSAP inside `gsap.matchMedia('(prefers-reduced-motion: no-preference)')`, run it outside NgZone, and revert it on destroy.
- Mark animation targets with `data-*` attributes and select them with `gsap.utils.selector(root)`, never global selectors.
- Use the duration bands in section 3: 150–220ms for feedback, 300ms for entrances, about 420ms for panels.
- No scroll pinning or scroll-jacking. Nothing infinite unless it is small, decorative and stops under reduced motion (like the ticker and the tag ring).
- Hover-only behaviour needs a focus equivalent and a touch fallback (`@media (hover: none)`).
- Afterwards, check at 320, 768 and 1440 px, in light and dark, with reduced motion on and off.

## 6. Key files

```
src/styles.css                                    tokens + all component and motion CSS (sections 1–12; 11 = signature motion, 12 = Ink & Bone)
src/ui/weave.ts                                   warp lift
src/ui/split-lines.ts                             set type (SplitText line masks)
src/components/cloth-chapter/                     ink chapter with the aperture
src/components/edition-index/                     editions contents list with floating cover
src/ui/route-transition.ts                        bolt unroll (View Transitions)
src/ui/handoff.ts                                 pick up (card to product page)
src/ui/motion.service.ts                          Lenis + ScrollTrigger
src/ui/reveal.directive.ts                        scroll reveals
src/ui/parallax.directive.ts                      image parallax
src/ui/dialog.ts                                  animated native dialogs
src/components/hero-showcase/                     home cover + entrance timeline
src/components/look-spread/                       shoppable look photo with tags
src/components/cart-drawer/                       bag sheet + count animation
src/components/product-card/                      image swap + quick add + pick up
src/components/about-page/                        About: name, principles, mill towns (inline template)
src/components/contact/                           Contact form (reactive, posts to environment.apiUrl) + quick answers
```
