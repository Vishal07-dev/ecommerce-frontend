# KŌRA — Project overview

**KŌRA ("Everyday Garments", est. Ahmedabad)** is an online clothing store for a small Indian label that makes everyday clothes in heavy cotton and honest wool. It has three parts:

1. **The store**, where shoppers browse, save, buy and manage their account.
2. **Ask KŌRA**, an AI shopping assistant built into the store.
3. **KŌRA Studio**, the private back office where the team runs the business.

- Live store: https://ecommerce-frontend-three-ruby.vercel.app
- Studio: the same address followed by `/admin` (team members only)

---

## 1. The brand

- **The name.** *Kōra* (कोरा) is Hindi for cloth as it comes off the loom: unbleached, unwashed, not yet cut. The brand idea is that a garment starts with cloth that is good on its own.
- **What it sells.** A short list of everyday garments: coats, blazers, knitwear, tees, shirts, trousers and a dress. They're made in small runs and released when they're ready, not on a fashion calendar.
- **Editions** (collections):
  - **Long Lines** (Edition 01, Autumn–Winter 2026): long coats and tailoring.
  - **Everyday Cotton** (all year): tees, shirts, trousers and the tee dress.
  - **Soft Knits** (Autumn–Winter 2026): rib knits and knit sets.
- **Where the cloth comes from.** Each product names its mill town:
  - **India:** Tiruppur, Ludhiana, Ahmedabad and Bhilwara.
  - **Italy:** Biella and Prato.
  - **England:** Yorkshire.
- **Money and delivery:**
  - Prices are in Indian rupees, GST included.
  - Delivery is **free from ₹5,000**; below that it's a flat **₹250**.
  - Delivery takes **3–6 working days** across India.

---

## 2. The store (for shoppers)

### Look and feel
- **An editorial look:** large serif headlines and warm off-white "bone" pages, with occasional dark "ink" chapters.
- **Light and dark themes:** the shopper's choice is remembered.
- **Works on every screen:** phones, tablets and desktops.
- **Built for everyone:** it works with a keyboard and screen readers. Anyone who has turned on "reduce motion" on their device sees no movement.

### Signature motion
The store has its own animations, all inspired by cloth:
- **Photos are revealed like threads opening on a loom:** strips part from a single line.
- **Moving between pages, the new page unrolls** over the old one like cloth off a bolt.
- **Clicking a product lifts its photo** off the grid and carries it onto the product page.
- **Adding to the bag:** the item's photo unfolds into the bag like a folded garment.
- **Headlines rise line by line**, and the footer spells out the KŌRA wordmark letter by letter as you reach the bottom.

### Home page
- **Cover:** the hero product with its photo, price and a "Shop" button. A slow ticker of edition details runs along the bottom.
- **"The cloth":** a chapter where a fabric photo opens from a small window to full width as you scroll.
- **A look from the lookbook**, with tags on the photo you can tap to shop.
- **"The Edit":** the featured products in a magazine-style grid.
- **Editions:** a large typographic list. Hovering an edition name shows its cover photo.
- **A short note on the brand name**, then the footer.

### Shop
- **Every live product**, filterable by **edition**, **category** and **size** (only sizes in stock count).
- **Sort:** Featured (the hero and featured pieces first), Newest, or Price low/high.
- **Layout:** switch between **2, 3 or 4 products per row**; the products glide to their new places.
- **Product cards:**
  - A second photo appears on hover.
  - A **heart** saves the piece.
  - **Quick-add sizes** put it straight in the bag.
  - "Sold out" shows when nothing is left.

### Product page
- **Photos:** a gallery that you swipe on phones. On larger screens a **strip of thumbnails** follows the photo you're looking at, and clicking one jumps to that photo.
- **Price** (with a "was" price when it's on sale), **colour**, and **size choice**. Sold-out sizes are crossed out.
- **Size guide:** garment measurements, plus the model's height and size.
- **Fit notes.**
- **Details:** the product's story, the fabric (composition, weight, weave, where it's made) and care instructions.
- **Add to bag** and **Save**. On phones, an "Add to bag" bar stays on screen as you scroll.
- **"You might also like":** other pieces from the same edition.

### Lookbook
- **Six styled looks**, each with its own photo, title and caption.
- **Tags on each garment** show its name and price on hover; on phones they're always visible. Tapping a tag opens the product.
- **"Shop the look":** a list beside each photo of everything in it.

### Bag and checkout
- **The bag** slides in from the side, showing each piece's size, quantity and price.
- **Removing a piece** can be undone.
- **A delivery bar** shows how far you are from free delivery.
- **Bags carry over:** a bag filled while signed out moves into the account on sign-in.
- **Checkout** is a secure card payment page. Shoppers need an account to check out.
- **After paying:** a confirmation page with the order reference and a **downloadable PDF receipt**.

### Saved pieces (wishlist)
- **The heart** on any product saves it, on cards and on product pages.
- **Saved without an account:** pieces are kept on that device and **move into the account on sign-in**.
- **The saved page ("Kept for later.")** has a running total, a sold-out count and a sort. Pieces can go straight into the bag from there, or be removed (with undo).
- **The header** shows how many pieces are saved.

### Account
- **Orders:** every order with its date, reference, status, items and total, plus a **receipt download**.
- **Your details:** name, email and phone. Changing the email asks for the current password.
- **Addresses:** up to 10 Indian delivery addresses (state list, 6-digit PIN), one set as default. Each can be edited or removed.
- **Password change.**
- **Signed-out visitors** who open the account page are sent to sign in, then brought back.

### Other pages
- **About:** the brand name, three working principles (fewer pieces, heavier cloth, made to last), and the mill towns behind each cloth.
- **Contact:** a message form with topic choices, plus quick answers about delivery, sizing, payment and orders.
- **Sign in / Create an account.**

---

## 3. Ask KŌRA (the AI shopping assistant)

A chat button in the corner of every store page opens **Ask KŌRA**.

### What it can do
- **Answer questions about the products:** what's warm enough for winter, how a coat fits, which tees there are, what a fabric is made of, what's in stock in which size, and what things cost.
- **Explain store policies:** delivery charges and times, GST-inclusive pricing, card checkout, and where to find the size guide.
- **Recommend real pieces only.** It knows the **current catalogue** (names, colours, prices, sizes in stock, fabrics and fit), and every product it mentions appears as a **tappable card** that opens the product.
- **Hold a conversation:** it remembers the last few messages, so follow-up questions work ("…and which tees do you have?").
- **Help shoppers start:** it suggests questions such as "What's warm enough for winter?" and "How much is delivery?".
- **Be honest:** it says plainly when something isn't sold, and suggests the closest piece.

### What it won't do
- It doesn't place orders, change a bag, or see a specific shopper's orders. For an order question it points to the Contact page.
- It doesn't invent prices, discounts, stock, policies or delivery dates.
- Every chat carries a note that answers are written by AI and that the product page has the final word.

### Good to know
- **Message limits:** up to 500 characters per message and about 15 messages a minute per visitor, which keeps AI costs in check.
- **Conversations last only for the browser tab** and can be cleared with "New chat".
- **On phones** it opens full screen. It also works in dark mode and with a keyboard.

---

## 4. KŌRA Studio (the back office)

Studio is where the team runs the store. Sign in with a team account and you land in Studio. The store header shows a **Studio** link to team members, and Studio has a **View the store** link back.

### Overview
- **Key numbers** for the last 7, 30 or 90 days: **revenue, orders, average order value and new customers**. Each is compared in words with the previous period ("Up 17% on the previous 30 days").
- **Charts:** **revenue by day** and **orders by day**. Hovering shows each day's figure, and a "Show data" table gives exact numbers.
- **Where orders are:** how many are paid, packed, shipped, delivered or cancelled.
- **Best sellers** by revenue, with units sold.
- **Latest orders.**
- **What's on the home page:** the current hero product, plus counts of featured, live and archived products.
- **Running low:** sizes that are sold out or nearly gone.
- **Live updates:** it refreshes by itself.

### Orders
- **Find orders:** filter by status, or search by customer email, product or order number.
- **Each order** opens to show its items and sizes.
- **Move an order along:** **Paid → Packed → Shipped → Delivered**, or **Cancelled**. Customers see the new status in their account.
- **Download any order's receipt.**

### Products
- **Every product**, with photo, price, stock and sizes running low.
- **"Shows on" control for each product:**
  - **Home hero:** the big cover at the top of the home page. Only one product at a time; choosing a new hero replaces the old one.
  - **Featured:** shown in "The Edit" on the home page and in the shop.
  - **Shop only:** in the shop and search, not on the home page.
  - **Archived:** hidden from the store but kept, and can be restored any time.
- **Edit, view in the store, or delete.** Deleting asks for confirmation and offers "Archive instead". The current hero can't be deleted.

### Add or edit a product
- **Basics:** name, short line, web address, description and story.
- **Photos:** upload several (JPG, PNG or WebP, up to 8 MB each), reorder them, describe each one for screen readers, and set its type. **The first photo is the main photo everywhere**: shop cards, the home page, the bag and checkout. Close-ups show as squares on the product page, and lookbook shots stay out of the product gallery.
- **Price:** the price, plus an optional "was" price that shows the item on sale.
- **Sizes and stock:** sizes with stock per size, an optional stock code (SKU), and quick presets (S–XL, waist 28–36, one size).
- **Details:** category, edition, colour name and swatch, fabric make-up, weight, weave, origin, care instructions, fit, model height and size, fit notes and tags.
- **Where it shows** (the four placements above), with a **live preview** of the product card.

### Customers
- **Every shopper account:** name, email, phone, city, join date, number of orders, total spent and last order.
- **Search** by name or email. A customer's last order links to their orders.

### Categories
- **Add, rename or describe categories**, and switch them on or off.
- **A category still in use can't be deleted:** move its products first.

### Notifications
- **The bell shows:** new orders, new customers, and sizes that have sold out or are running low.
- **Checks every 30 seconds:** a new order also pops up as a message on screen.
- **"Mark all as read".** Clicking a notification opens the right page.

### Team and access
Studio has three roles:

| Role | Can do |
|---|---|
| **Owner** | Everything, including the Team page (adding and removing people) |
| **Admin** | Runs the store: products, orders, customers, categories |
| **Staff** | Sees the overview and handles orders |

There are two ways to bring someone in:
- **Add an existing account:** search their email, choose a role, and confirm with your password.
- **Invite by link:** choose a role and get a **one-time link that works for 48 hours**, with Copy and Send-on-WhatsApp buttons. The person opens it, creates an account or uses one they already have, and lands in Studio.

Managing access:
- Owners can **change roles** or **remove access** from the Team page. Removed people keep their shop account and orders.
- **Removing someone takes effect immediately**, even if they're signed in at that moment.
- **Safety rules:**
  - Every change needs the owner's password.
  - Nobody can change or remove their own access.
  - There is always at least one owner.
- **Invites:** unused ones can be cancelled, and a used or expired link stops working.
- **Access history** records who gave, changed or removed access, and when.

### Also in Studio
- **Light and dark themes.**
- **Works on phones:** the sidebar becomes a slide-out menu and wide tables scroll sideways.

---

## 5. Who's who (accounts)

| Account type | Who | Where they go after signing in |
|---|---|---|
| Shopper | Anyone who creates an account | The page they were on, or back to the bag/checkout |
| Staff / Admin / Owner | The team | KŌRA Studio |

A team member is also a normal shopper: they can buy, save pieces and use their account like anyone else.

---

## 6. Trust, privacy and safety (in plain words)

- **Prices are always checked against the catalogue at checkout**, so they can't be changed in the browser.
- **Orders are tied to the shopper's account.** Receipts can only be downloaded by the person who bought, or by the team.
- **A shopper's account can only be changed by that shopper.**
- **Team access is checked on every action**, so removed access stops at once.
- **Invite links are single-use and short-lived.**
- **The AI assistant** limits message length and how often it can be asked.

---

## 7. Current limits and open items

**Not built yet:**
- **No discount codes, gift cards, product reviews, or returns/exchange requests.**
- **No automatic emails** for order confirmations or shipping updates. Customers see order status in their account.

**Behaviour to know about:**
- **The AI assistant answers from the product catalogue and store policies.** It can't look up a specific order.
- **The store runs on a free hosting plan** that can sleep when nobody visits. A scheduled wake-up check keeps it awake most of the time, but the very first visit after a quiet spell can occasionally take longer.

**To do:**
- **The contact form's email sending** uses a Gmail password that is visible in the public code. It should be changed and moved into private settings.
- **A test product ("Test-admin-photo")** is live in the shop. Archive it in Studio when testing is finished.

---

## 8. Related files

- `DESIGN-AND-MOTION.md`: the design rules and every animation, in detail (for designers and developers).
