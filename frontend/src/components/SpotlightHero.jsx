import React from 'react';
import { ArrowRight, Sparkles } from 'lucide-react';

export default function SpotlightHero({ spotlightProducts, onSelectProduct, onShopNow }) {
  const mainFeature = spotlightProducts && spotlightProducts[0];
  const sideCards = spotlightProducts && spotlightProducts.slice(1, 3);

  return (
    <div style={{ maxWidth: 1280, margin: '28px auto', padding: '0 20px' }}>
      
      {/* Top Banner Tag */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
        <span className="badge-gold">
          <Sparkles size={12} />
          In The Spotlight
        </span>
        <span style={{ fontSize: '0.86rem', color: '#64748b', fontWeight: 500 }}>
          Exclusive seasonal drops curated for trendsetters
        </span>
      </div>

      {/* Grid Layout: Main Hero + 2 Side Banners */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: 20,
      }}>
        
        {/* Main Hero Card */}
        {mainFeature && (
          <div 
            style={{
              gridColumn: 'span 2',
              minHeight: 340,
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
            <div style={{ flex: '1 1 300px', padding: 36, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', zIndex: 2 }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                  <span style={{ background: '#d97706', color: '#ffffff', padding: '4px 10px', borderRadius: 8, fontSize: '0.74rem', fontWeight: 800 }}>
                    FEATURED DROP
                  </span>
                  <span style={{ fontSize: '0.82rem', color: '#92400e', fontWeight: 600 }}>Limited Edition Stock</span>
                </div>

                <h2 style={{ fontSize: '2.2rem', fontWeight: 800, color: '#0f172a', lineHeight: 1.15, marginBottom: 14 }}>
                  {mainFeature.name}
                </h2>
                <p style={{ fontSize: '0.94rem', color: '#475569', lineHeight: 1.6, maxWidth: 440 }}>
                  {mainFeature.description || 'Engineered with premium materials and avant-garde craftsmanship. Elevate your everyday wardrobe.'}
                </p>
              </div>

              <div style={{ marginTop: 24, display: 'flex', alignItems: 'center', gap: 18 }}>
                <div>
                  <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>Special Price</div>
                  <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#b45309' }}>
                    ₹{Number(mainFeature.price).toLocaleString('en-IN')}
                  </div>
                </div>

                <button
                  onClick={onShopNow}
                  className="btn-gold"
                  style={{ padding: '12px 26px', fontSize: '0.95rem' }}
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
            style={{
              borderRadius: 24,
              padding: 26,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              position: 'relative',
              overflow: 'hidden',
              minHeight: 220,
              background: '#ffffff',
              border: '1px solid #e2e8f0',
              boxShadow: '0 4px 20px rgba(15, 23, 42, 0.04)',
            }}
          >
            <div>
              <span className="badge-gold" style={{ fontSize: '0.7rem', marginBottom: 10 }}>
                {card.category}
              </span>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a', marginTop: 8, lineHeight: 1.3 }}>
                {card.name}
              </h3>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 18 }}>
              <div>
                <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#b45309' }}>
                  ₹{Number(card.price).toLocaleString('en-IN')}
                </div>
              </div>
              <button
                onClick={onShopNow}
                className="btn-dark"
                style={{ padding: '8px 16px', fontSize: '0.84rem' }}
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
