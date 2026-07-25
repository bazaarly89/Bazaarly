# Dostivox Homepage — Setup Guide

## Files kya-kya hain

| File | Kya karti hai |
|---|---|
| `preview-homepage.html` | Poora homepage ek jagah — seedha browser me khol ke dekhein, koi setup nahi chahiye. |
| `homepage.config.js` | **Sabse zaruri file** — top bar, search placeholder, categories, suggested-for-you, promo tiles, bottom nav — sab yahan se edit hota hai. |
| `TopBar.jsx` | Upar wala address bar (WORK/HOME badge + address + coin count). |
| `SearchBar.jsx` | Search input, camera aur mic icons ke saath. |
| `CategoryNav.jsx` | Horizontally scroll hone wali category icons row. |
| `Icon.jsx` | Chote inline icons (home, cart, bag, shirt, etc.) — koi external library install nahi karni padegi. |
| `SuggestedForYou.jsx` | "Amit, still looking for these?" wali personalized strip. |
| `PromoTiles.jsx` | Neeche ki 2-3 column ad tiles grid. |
| `BottomNav.jsx` | Sabse neeche ki fixed navigation bar. |
| `Homepage.jsx` | Sab sections ko sahi order me jodta hai — apna asli homepage yehi file banegi. |
| `homepage.css` | Sab sections ki shared styling. |

Pichli baar diya gaya **hero carousel set** (`HeroCarousel.jsx`, `HeroCarousel.css`, `heroSlides.config.js`) isi ke saath use hota hai — `Homepage.jsx` usi ko import karta hai, to woh teeno files bhi same folder me hone chahiye.

## Step 1 — Preview dekhein
`preview-homepage.html` ko double-click karke browser me khol lein — poora homepage (top bar se bottom nav tak) auto-slide banner ke saath live dikhega.

## Step 2 — Apne project me daalein
1. Sab `.jsx` aur `.css` files ek folder me daalein, jaise `src/components/homepage/`.
2. Hero carousel ki teeno files (`HeroCarousel.jsx`, `HeroCarousel.css`, `heroSlides.config.js`) bhi usi folder me daalein.
3. Apne route/page me import karein:
   ```jsx
   import Homepage from "./components/homepage/Homepage";

   <Homepage customerName="Amit" />
   ```
   `customerName` optional hai — logged-in customer ka naam pass karoge to "Suggested for you" me wahi naam dikhega, warna default text aayega.

## Step 3 — Kisi bhi cheez ko edit karna
Sab kuch `homepage.config.js` file me hai, section-wise comments ke saath:

- **Top bar** → `topBarConfig` (address, badge, coin count)
- **Search placeholder** → `searchConfig`
- **Category icons row** → `categoryNavConfig` (naya category add/remove/order badalna)
- **Suggested for you** → `suggestedForYouConfig` (greeting text, product list)
- **Promo tiles (neeche wali grid)** → `promoTilesConfig`
- **Bottom nav tabs** → `bottomNavConfig`

Hero banner slides ke liye `heroSlides.config.js` file use hogi (pichli baar wali).

Kisi bhi `.jsx` ya `.css` file ko chhedne ki zarurat kabhi nahi padegi — sirf config files me values badalni hain.

## Naye category/tab me icon chahiye ho to
`Icon.jsx` file me `paths` object me pehle se yeh icons hain: `bag, shirt, mobile, laptop, beauty, home, grid, play, user, cart`. Naya icon chahiye to bas ek naya SVG path is object me add kar dena — config file me uska naam likh dena kaafi hai.

## Design notes
- Halka warm-white background + brass/gold accent (`#CBA135`) — pichle hero banner ke saath consistent premium look.
- Category icons active state me gold circle highlight karte hain.
- Bottom nav aur cart badge Amazon/Flipkart jaisa hi hai, lekin colors aapke brand ke hisaab se.
- Sab kuch mobile-first hai — 480px se upar bhi center me clean dikhega.
