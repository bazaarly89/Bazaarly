import React from "react";
import { promoTilesConfig } from "./homepage.config";

export default function PromoTiles({ tiles = promoTilesConfig }) {
  return (
    <div className="promo-grid">
      {tiles.map((t, i) => (
        <a className="promo-tile" href={t.link} key={i}>
          {t.badgeTop && <span className="promo-badge">{t.badgeTop}</span>}
          <img src={t.image} alt={t.brand} />
          <div className="promo-text">
            <strong>{t.title}</strong>
            <span>{t.brand}</span>
          </div>
        </a>
      ))}
    </div>
  );
}
