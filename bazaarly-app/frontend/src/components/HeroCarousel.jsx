import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Api } from '../api/client';
import { heroSlides as fallbackSlides } from './heroSlides.config';
import './HeroCarousel.css';

const AUTOPLAY_MS = 5000;

export default function HeroCarousel() {
  const [slides, setSlides] = useState(fallbackSlides);
  const [index, setIndex] = useState(0);
  const timerRef = useRef(null);

  // Load slides from the admin-managed backend. If none are set up yet
  // (or the request fails), keep showing the local fallback slides so the
  // homepage never looks broken.
  useEffect(() => {
    Api.heroSlides()
      .then((r) => { if (r.slides && r.slides.length > 0) setSlides(r.slides); })
      .catch(() => {});
  }, []);

  const restartAutoplay = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (slides.length <= 1) return;
    timerRef.current = setInterval(() => {
      setIndex((i) => (i + 1) % slides.length);
    }, AUTOPLAY_MS);
  };

  useEffect(() => {
    restartAutoplay();
    return () => clearInterval(timerRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slides.length]);

  const goTo = (i) => { setIndex(i); restartAutoplay(); };
  const prev = () => goTo((index - 1 + slides.length) % slides.length);
  const next = () => goTo((index + 1) % slides.length);

  if (!slides || slides.length === 0) return null;

  return (
    <div className="hero">
      {slides.map((slide, i) => {
        const isActive = i === index;
        const isBanner = slide.mode === 'banner';
        return (
          <div
  className={`slide-bg ${slide.imageFit === 'contain' ? 'fit-contain' : ''}`}
  style={{ backgroundImage: `url(${slide.image})` }}
/>
            {isBanner ? (
              slide.ctaLink && <Link to={slide.ctaLink} className="banner-link" aria-label="View offer" />
            ) : (
              <>
                <div className="overlay" />
                <div className="slide-content">
                  {slide.eyebrow && <p className="eyebrow">{slide.eyebrow}</p>}
                  {slide.title && <h1 className="title">{slide.title}</h1>}
                  {slide.subtitle && <p className="subtitle">{slide.subtitle}</p>}
                  {slide.specs && slide.specs.length > 0 && (
                    <div className="specs">
                      {slide.specs.map((spec, si) => (
                        <span key={si} className="spec-chip">{spec}</span>
                      ))}
                    </div>
                  )}
                  {slide.ctaText && slide.ctaLink && (
                    <Link to={slide.ctaLink} className="cta">{slide.ctaText}</Link>
                  )}
                </div>
              </>
            )}
          </div>
        );
      })}

      {slides.length > 1 && (
        <div className="progress-row">
          {slides.map((slide, i) => (
            <div
              key={slide.id}
              className={`progress-track ${i === index ? 'active' : ''} ${i < index ? 'done' : ''}`}
              onClick={() => goTo(i)}
            >
              <div className="progress-fill" />
            </div>
          ))}
        </div>
      )}

      {slides.length > 1 && (
        <>
          <button className="arrow left" onClick={prev} aria-label="Previous slide">‹</button>
          <button className="arrow right" onClick={next} aria-label="Next slide">›</button>
        </>
      )}
    </div>
  );
}
