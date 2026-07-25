import React, { useEffect, useRef, useState, useCallback } from "react";
import "./HeroCarousel.css";
import { heroSlides } from "./heroSlides.config";

/**
 * Premium auto-sliding hero banner.
 *
 * -> Sab kuch "heroSlides.config.js" file se aata hai. Naya slide add karna ho,
 *    text badalna ho, ya text hide/show karna ho — sirf us file ko edit karo,
 *    is component ka code chhedne ki zarurat nahi.
 *
 * -> mode: "text"   => title/subtitle/specs/button overlay ke saath dikhta hai
 * -> mode: "banner" => sirf image dikhti hai (pura pamphlet/poster design), koi text overlay nahi
 *
 * Agar slides admin panel (backend /admin/banners) se aa rahe hain, to
 * `slides` prop pass kar do — wahi schema use hoga jo heroSlides.config.js me hai.
 */
export default function HeroCarousel({ slides = heroSlides, duration = 5000 }) {
  const [current, setCurrent] = useState(0);
  const timerRef = useRef(null);

  const goTo = useCallback(
    (i) => {
      const next = (i + slides.length) % slides.length;
      setCurrent(next);
    },
    [slides.length]
  );

  const resetTimer = useCallback(() => {
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => goTo(current + 1), duration);
  }, [current, duration, goTo]);

  useEffect(() => {
    resetTimer();
    return () => clearTimeout(timerRef.current);
  }, [current, resetTimer]);

  if (!slides || slides.length === 0) return null;

  return (
    <div
      className="hero"
      onMouseEnter={() => clearTimeout(timerRef.current)}
      onMouseLeave={resetTimer}
    >
      {slides.map((s, i) => (
        <div
          key={s.id ?? i}
          className={`slide mode-${s.mode} ${i === current ? "active" : ""}`}
        >
          <div
            className="slide-bg"
            style={{ backgroundImage: `url(${s.image})` }}
          />
          {s.mode === "text" && (
            <>
              <div className="overlay" />
              <div className="slide-content">
                {s.eyebrow && <span className="eyebrow">{s.eyebrow}</span>}
                {s.title && <h1 className="title">{s.title}</h1>}
                {s.subtitle && <p className="subtitle">{s.subtitle}</p>}
                {s.specs?.length > 0 && (
                  <div className="specs">
                    {s.specs.map((sp, idx) => (
                      <span className="spec-chip" key={idx}>
                        {sp}
                      </span>
                    ))}
                  </div>
                )}
                {s.ctaText && (
                  <a className="cta" href={s.ctaLink || "#"}>
                    {s.ctaText} &rarr;
                  </a>
                )}
              </div>
            </>
          )}
          {s.mode === "banner" && s.ctaLink && (
            <a className="banner-link" href={s.ctaLink} aria-label="Offer banner" />
          )}
        </div>
      ))}

      <div className="progress-row">
        {slides.map((_, i) => (
          <div
            key={i}
            className={`progress-track ${i === current ? "active" : ""} ${
              i < current ? "done" : ""
            }`}
            onClick={() => goTo(i)}
          >
            <div className="progress-fill" />
          </div>
        ))}
      </div>

      <div className="arrow left" onClick={() => goTo(current - 1)}>
        &#8249;
      </div>
      <div className="arrow right" onClick={() => goTo(current + 1)}>
        &#8250;
      </div>
    </div>
  );
}
