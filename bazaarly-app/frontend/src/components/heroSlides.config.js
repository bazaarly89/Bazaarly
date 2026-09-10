/**
 * ============================================================
 *  YAHAN SE SLIDES EDIT KARO — code kahin aur chhedne ki zarurat nahi
 * ============================================================
 *
 * Har slide ek object hai. Do "mode" hain:
 *
 *   mode: "text"
 *     -> image ke upar title/subtitle/specs/button dikhega
 *     -> fields: eyebrow, title, subtitle, specs[], ctaText, ctaLink
 *
 *   mode: "banner"
 *     -> sirf image dikhegi, koi text overlay nahi
 *     -> jab tumhare paas pehle se design kiya hua pamphlet/poster ho,
 *        to us image ko yahan daal do aur mode ko "banner" rakho
 *     -> optional: ctaLink doge to pura banner clickable ban jayega
 *
 * Slide add karni ho -> naya object neeche list me jod do
 * Slide hatani ho    -> uska object list se hata do (ya order badal do)
 * Text hide karna ho  -> sirf mode: "banner" kar do, baaki fields waise hi rehne do
 *                        (baad me wapas text dikhana ho to mode: "text" kar dena)
 */

export const heroSlides = [
  {
    id: 1,
    mode: "text",
    image: "https://your-cdn.example.com/banners/headphones-hero.jpg",
    eyebrow: "New Launch",
    title: "Sound that moves with you",
    subtitle: "Premium wireless audio, engineered for everyday carry.",
    specs: ["40Hrs Battery", "ANC", "Up to 25% Off"],
    ctaText: "Shop Headphones",
    ctaLink: "/category/audio",
  },
  {
    id: 2,
    mode: "banner",
    image: "https://your-cdn.example.com/banners/monsoon-sale-pamphlet.jpg",
    ctaLink: "/deals/monsoon-sale",
  },
  {
    id: 3,
    mode: "text",
    image: "https://your-cdn.example.com/banners/gaming-laptop-hero.jpg",
    eyebrow: "GeForce RTX",
    title: "Up to 30% off gaming laptops",
    subtitle: "RTX powered performance for creators and gamers.",
    specs: ["RTX 4060", "16GB RAM", "165Hz Display"],
    ctaText: "Explore Laptops",
    ctaLink: "/category/laptops",
  },
];

/**
 * Agar slides admin panel (backend) se manage karne hain, to isi schema
 * ({id, mode, image, eyebrow, title, subtitle, specs, ctaText, ctaLink})
 * ke saath /api/banners se data fetch karke <HeroCarousel slides={data} />
 * me pass kar dena — component me kuch badalne ki zarurat nahi padegi.
 */
