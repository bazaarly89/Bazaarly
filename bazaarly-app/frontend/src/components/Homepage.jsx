import React from "react";
import "./homepage.css";
import TopBar from "./TopBar";
import SearchBar from "./SearchBar";
import CategoryNav from "./CategoryNav";
import HeroCarousel from "./HeroCarousel"; // from the hero-carousel set given earlier
import AllProducts from "./AllProducts";
import SuggestedForYou from "./SuggestedForYou";
import PromoTiles from "./PromoTiles";
import BottomNav from "./BottomNav";

/**
 * Full homepage, built from independent sections. Order matches the
 * screenshot: top bar -> search -> categories -> hero banner ->
 * suggested-for-you -> promo tiles -> bottom nav.
 *
 * Har section apni config file se data leta hai (homepage.config.js,
 * heroSlides.config.js). Reorder karna ho to bas neeche in lines ka
 * order badal do — data/content ke liye config files hi kaafi hain.
 *
 * `customerName` prop pass karo agar logged-in customer ka naam
 * "Suggested for you" greeting me dikhana ho, e.g. <Homepage customerName="Amit" />
 */
export default function Homepage({ customerName }) {
  return (
    <div className="homepage">
      <TopBar />
      <div className="homepage-search-wrap">
        <SearchBar />
      </div>
      <CategoryNav />
      <HeroCarousel />
      <SuggestedForYou customerName={customerName} />
      <PromoTiles />
      <div className="homepage-bottom-spacer" />
      <BottomNav />
    </div>
  );
}
