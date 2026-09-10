/**
 * ================================================================
 *  POORA HOMEPAGE YAHAN SE CONTROL HOTA HAI
 *  Kisi bhi section ka text/image/link badalna ho -> sirf yahan edit karo.
 *  Component files (.jsx) chhedne ki zarurat kabhi nahi padegi.
 * ================================================================
 */

/* ---------- 1) Top address bar ---------- */
export const topBarConfig = {
  label: "WORK", // ya "HOME" — chota badge jo address ke pehle dikhta hai
  address: "Line Bazar, Purnea, Bihar",
  coinBadge: 6, // upar right side ka number badge (rewards/coins), null rakho to chhupa dega
};

/* ---------- 2) Search bar ---------- */
export const searchConfig = {
  placeholder: "Search for products, brands and more",
};

/* ---------- 3) Category icons row (horizontally scrollable) ---------- */
/* icon field in-built icon names me se ek hona chahiye:
   "bag", "shirt", "mobile", "laptop", "beauty", "home", "grid" */
export const categoryNavConfig = [
  { label: "For You", icon: "bag", link: "/" },
  { label: "Fashion", icon: "shirt", link: "/category/fashion" },
  { label: "Mobiles", icon: "mobile", link: "/category/mobiles" },
  { label: "Electronics", icon: "laptop", link: "/category/electronics" },
  { label: "Beauty", icon: "beauty", link: "/category/beauty" },
  { label: "Home", icon: "home", link: "/category/home" },
];

/* ---------- 4) "Still looking for these?" personalized strip ---------- */
/* {name} apne aap customer ke naam se replace ho jayega agar backend se naam bhejoge,
   nahi to yahan diya hua defaultName use hoga */
export const suggestedForYouConfig = {
  greetingTemplate: "{name}, still looking for these?",
  defaultName: "there", // agar customer ka naam pata na ho
  items: [
    {
      title: "Graphic Cards",
      image: "https://your-cdn.example.com/suggested/graphic-card.jpg",
      link: "/category/graphic-cards",
    },
    {
      title: "PS5",
      image: "https://your-cdn.example.com/suggested/ps5.jpg",
      link: "/category/gaming-consoles",
    },
    {
      title: "Deodorant Roll-On",
      image: "https://your-cdn.example.com/suggested/deodorant.jpg",
      link: "/category/grooming",
    },
    {
      title: "Face Wash",
      image: "https://your-cdn.example.com/suggested/facewash.jpg",
      link: "/category/skincare",
    },
  ],
};

/* ---------- 5) Promo tiles grid (2-3 column ad cards) ---------- */
export const promoTilesConfig = [
  {
    image: "https://your-cdn.example.com/promo/diapers.jpg",
    badgeTop: "AD",
    title: "Up to 38% Off",
    brand: "MamyPoko Pants",
    link: "/deals/diapers",
  },
  {
    image: "https://your-cdn.example.com/promo/tv.jpg",
    badgeTop: "AD",
    title: "Just \u20b932,490*",
    brand: "TCL 55 Inch",
    link: "/deals/tcl-tv",
  },
  {
    image: "https://your-cdn.example.com/promo/facewash.jpg",
    badgeTop: "AD",
    title: "Shop Now",
    brand: "Lakme Face Wash",
    link: "/deals/lakme",
  },
];

/* ---------- 6) Bottom navigation bar ---------- */
/* icon field in-built icon names me se ek hona chahiye:
   "home", "play", "grid", "user", "cart" */
export const bottomNavConfig = [
  { label: "Home", icon: "home", link: "/" },
  { label: "Play", icon: "play", link: "/play" },
  { label: "Categories", icon: "grid", link: "/categories" },
  { label: "Account", icon: "user", link: "/account" },
  { label: "Cart", icon: "cart", link: "/cart", badge: 1 },
];
export const allProductsConfig = {
  title: "All Products",
  limit: 24,
};
