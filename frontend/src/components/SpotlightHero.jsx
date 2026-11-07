import React from 'react';
import { ArrowRight, Sparkles, ShieldCheck, Zap } from 'lucide-react';

export default function SpotlightHero({ spotlightProducts, onSelectProduct, onShopNow }) {
  const mainFeature = spotlightProducts && spotlightProducts[0];
  const sideCards = spotlightProducts && spotlightProducts.slice(1, 3);

  return (
    <div style={{ maxWidth: 1280, margin: '24px auto', padding: '0 20px' }}>
      
      {/* Top Banner Tag */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
        <span className="badge-gold">
          <Sparkles size={12} />
          In The Spotlight
        </span>
        <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>
          Exclusive seasonal drops curated for trendsetters
        </span>
      </div>

      {/* Grid Layout: Main Hero (60%) + 2 Side Banners (40%) */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: 20,
      }}>
        
        {/* Main Hero Card */}
        {mainFeature && (
          <div 
            className="glass"
            style={{
              gridColumn: 'span 2',
              minHeight: 340,
              borderRadius: 24,
              overflow: 'hidden',
              position: 'relative',
              background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.9) 0%, rgba(15, 23, 42, 0.95) 100%)',
              border: '1px solid rgba(245, 158, 11, 0.25)',
              display: 'flex',
              flexDirection: 'row',
              flexWrap: 'wrap',
            }}
          >
            {/* Left Content */}
            <div style={{ flex: '1 1 300px', padding: 36, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', zIndex: 2 }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                  <span style={{ background: '#f59e0b', color: '#090d16', padding: '3px 8px', borderRadius: 6, fontSize: '0.72rem', fontWeight: 800 }}>
                    FEATURED DROP
                  </span>
                  <span style={{ fontSize: '0.8rem', color: '#cbd5e1' }}>Limited Edition Stock</span>
                </div>

                <h2 style={{ fontSize: '2.1rem', fontWeight: 800, color: '#f8fafc', lineHeight: 1.15, marginBottom: 14 }}>
                  {mainFeature.name}
                </h2>
                <p style={{ fontSize: '0.92rem', color: '#94a3b8', lineHeight: 1.5, maxWidth: 420 }}>
                  {mainFeature.description || 'Engineered with premium materials and avant-garde craftsmanship. Elevate your everyday wardrobe.'}
                </p>
              </div>

              <div style={{ marginTop: 24, display: 'flex', alignItems: 'center', gap: 16 }}>
                <div>
                  <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Special Price</div>
                  <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#fbbf24' }}>
                    ₹{Number(mainFeature.price).toLocaleString('en-IN')}
                  </div>
                </div>

                <button
                  onClick={onShopNow}
                  className="btn-gold"
                  style={{ padding: '12px 24px', fontSize: '0.95rem' }}
                >
                  Explore Collection
                  <ArrowRight size={18} />
                </button>
              </div>
            </div>

            {/* Right Image */}
            <div style={{ flex: '1 1 280px', position: 'relative', minHeight: 260 }}>
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
        {sideCards && sideCards.map((card, idx) => (
          <div
            key={card.id || idx}
            className="glass"
            style={{
              borderRadius: 24,
              padding: 24,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              position: 'relative',
              overflow: 'hidden',
              minHeight: 220,
              background: idx === 0 
                ? 'linear-gradient(135deg, rgba(245, 158, 11, 0.08) 0%, rgba(15, 23, 42, 0.95) 100%)'
                : 'linear-gradient(135deg, rgba(59, 130, 246, 0.08) 0%, rgba(15, 23, 42, 0.95) 100%)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
            }}
          >
            <div>
              <span className="badge-gold" style={{ fontSize: '0.68rem', marginBottom: 10 }}>
                {card.category}
              </span>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#f8fafc', marginTop: 6, lineHeight: 1.3 }}>
                {card.name}
              </h3>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 16 }}>
              <div>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#fbbf24' }}>
                  ₹{Number(card.price).toLocaleString('en-IN')}
                </div>
              </div>
              <button
                onClick={onShopNow}
                className="btn-dark"
                style={{ padding: '8px 14px', fontSize: '0.82rem' }}
              >
                View
              </button>
            </div>
          </div>
        ))}

      </div>
    </div>
  );
}
