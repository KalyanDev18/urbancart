import React from 'react';
import { ArrowRight, Sparkles } from 'lucide-react';

export default function SpotlightHero({ spotlightProducts, onSelectProduct, onShopNow }) {
  const safeSpotlight = Array.isArray(spotlightProducts) ? spotlightProducts : [];
  if (safeSpotlight.length === 0) return null;
  const mainFeature = safeSpotlight[0];
  const sideCards = safeSpotlight.slice(1, 3);

  return (
    <div style={{ maxWidth: 1280, margin: '20px auto', padding: '0 16px' }}>
      
      {/* Top Banner Tag */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
        <span className="badge-gold">
          <Sparkles size={12} />
          In The Spotlight
        </span>
        <span style={{ fontSize: '0.82rem', color: '#64748b', fontWeight: 500 }}>
          Exclusive seasonal drops curated for trendsetters
        </span>
      </div>

      {/* Responsive Grid Layout */}
      <div className="spotlight-grid">
        
        {/* Main Hero Card */}
        {mainFeature && (
          <div 
            className="spotlight-hero-card"
            style={{
              borderRadius: 24,
              overflow: 'hidden',
              position: 'relative',
              background: 'linear-gradient(135deg, #fffdfa 0%, #fffbeb 40%, #fef3c7 100%)',
              border: '1px solid #fde68a',
              boxShadow: '0 8px 30px rgba(217, 119, 6, 0.08)',
              display: 'flex',
              flexDirection: 'row',
              flexWrap: 'wrap',
            }}
          >
            {/* Left Content */}
            <div style={{ flex: '1 1 280px', padding: 'clamp(20px, 4vw, 36px)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', zIndex: 2 }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                  <span style={{ background: '#d97706', color: '#ffffff', padding: '3px 8px', borderRadius: 8, fontSize: '0.72rem', fontWeight: 800 }}>
                    FEATURED DROP
                  </span>
                  <span style={{ fontSize: '0.8rem', color: '#92400e', fontWeight: 600 }}>Limited Edition</span>
                </div>

                <h2 style={{ fontSize: 'clamp(1.5rem, 4vw, 2.2rem)', fontWeight: 800, color: '#0f172a', lineHeight: 1.15, marginBottom: 12 }}>
                  {mainFeature.name}
                </h2>
                <p style={{ fontSize: '0.9rem', color: '#475569', lineHeight: 1.5, maxWidth: 420 }}>
                  {mainFeature.description || 'Engineered with premium materials and avant-garde craftsmanship.'}
                </p>
              </div>

              <div style={{ marginTop: 20, display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
                <div>
                  <div style={{ fontSize: '0.76rem', color: '#64748b', fontWeight: 600 }}>Special Price</div>
                  <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#b45309' }}>
                    ₹{Number(mainFeature.price).toLocaleString('en-IN')}
                  </div>
                </div>

                <button
                  onClick={onShopNow}
                  className="btn-gold"
                  style={{ padding: '10px 22px', fontSize: '0.9rem' }}
                >
                  Explore Collection
                  <ArrowRight size={16} />
                </button>
              </div>
            </div>

            {/* Right Image */}
            <div style={{ flex: '1 1 240px', position: 'relative', minHeight: 220 }}>
              <img
                src={mainFeature.image_url || 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&auto=format&fit=crop&q=80'}
                alt={mainFeature.name}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  maskImage: 'linear-gradient(to right, transparent, black 25%)',
                  WebkitMaskImage: 'linear-gradient(to right, transparent, black 25%)',
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
                background: '#ffffff',
                border: '1px solid #e2e8f0',
                boxShadow: '0 4px 20px rgba(15, 23, 42, 0.04)',
                minHeight: 180,
              }}
            >
              <div>
                <span className="badge-gold" style={{ fontSize: '0.68rem', marginBottom: 8 }}>
                  {card.category}
                </span>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#0f172a', marginTop: 6, lineHeight: 1.3 }}>
                  {card.name}
                </h3>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 14 }}>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#b45309' }}>
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
