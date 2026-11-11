import React from 'react';
import { ArrowRight, Sparkles } from 'lucide-react';
import { optimizeImageUrl } from '../api/client';

export default function SpotlightHero({ spotlightProducts, onSelectProduct, onShopNow }) {
  const safeSpotlight = Array.isArray(spotlightProducts) ? spotlightProducts : [];
  if (safeSpotlight.length === 0) return null;
  const mainFeature = safeSpotlight[0];
  const sideCards = safeSpotlight.slice(1, 3);

  return (
    <div className="section-shell">
      
      {/* Top Banner Tag */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14, flexWrap: 'wrap' }}>
        <span className="badge-gold">
          <Sparkles size={12} />
          In The Spotlight
        </span>
        <span style={{ fontSize: '0.82rem', color: 'var(--text-dim)', fontWeight: 500 }}>
          Exclusive seasonal drops curated for trendsetters
        </span>
      </div>

      {/* Responsive Grid Layout */}
      <div className="spotlight-grid">
        
        {/* Main Hero Card */}
        {mainFeature && (
          <div className="spotlight-hero-card">
            {/* Left Content */}
            <div className="spotlight-hero-content">
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
                  <span style={{ background: '#d97706', color: '#ffffff', padding: '3px 8px', borderRadius: 8, fontSize: '0.72rem', fontWeight: 800 }}>
                    FEATURED DROP
                  </span>
                  <span style={{ fontSize: '0.8rem', color: 'var(--price-color)', fontWeight: 600 }}>Limited Edition</span>
                </div>

                <h2 style={{ fontSize: 'clamp(1.35rem, 3.8vw, 2.2rem)', fontWeight: 800, color: 'var(--text-main)', lineHeight: 1.15, marginBottom: 10 }}>
                  {mainFeature.name}
                </h2>
                <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', lineHeight: 1.5, maxWidth: 420 }}>
                  {mainFeature.description || 'Engineered with premium materials and avant-garde craftsmanship.'}
                </p>
              </div>

              <div style={{ marginTop: 18, display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
                <div>
                  <div style={{ fontSize: '0.74rem', color: 'var(--text-dim)', fontWeight: 600 }}>Special Price</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--price-color)' }}>
                    ₹{Number(mainFeature.price).toLocaleString('en-IN')}
                  </div>
                </div>

                <button
                  onClick={onShopNow}
                  className="btn-gold"
                  style={{ padding: '10px 20px', fontSize: '0.88rem' }}
                >
                  Explore Collection
                  <ArrowRight size={16} />
                </button>
              </div>
            </div>

            {/* Right Image */}
            <div className="spotlight-hero-media">
              <img
                src={optimizeImageUrl(mainFeature.image_url, 640)}
                alt={mainFeature.name}
                loading="lazy"
                decoding="async"
                className="spotlight-hero-img"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = optimizeImageUrl('', 640);
                }}
              />
            </div>
          </div>
        )}

        {/* Side Banner Cards */}
        <div className="spotlight-side-cards">
          {sideCards && sideCards.map((card, idx) => (
            <div
              key={card.id || idx}
              style={{
                borderRadius: 24,
                padding: 'clamp(18px, 3vw, 24px)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                position: 'relative',
                overflow: 'hidden',
                background: 'var(--bg-card)',
                border: '1px solid var(--border-subtle)',
                boxShadow: '0 4px 20px rgba(15, 23, 42, 0.06)',
                minHeight: 180,
                transition: 'background-color 0.25s ease, border-color 0.25s ease',
              }}
            >
              <div>
                <span className="badge-gold" style={{ fontSize: '0.68rem', marginBottom: 8 }}>
                  {card.category}
                </span>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-main)', marginTop: 6, lineHeight: 1.3 }}>
                  {card.name}
                </h3>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 14 }}>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--price-color)' }}>
                  ₹{Number(card.price).toLocaleString('en-IN')}
                </div>
                <button
                  onClick={onShopNow}
                  className="btn-dark"
                  style={{ padding: '7px 14px', fontSize: '0.8rem' }}
                >
                  View
                </button>
              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}
