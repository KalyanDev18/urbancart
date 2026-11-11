import React, { useEffect, useState, useMemo } from 'react';
import {
  ShoppingBag,
  Sparkles,
  ArrowRight,
  Zap,
  Star,
  Footprints,
  Shirt,
  Watch,
  Laptop,
} from 'lucide-react';
import { getCachedHome, optimizeImageUrl } from '../api/client';

const FEATURED_FALLBACK = [
  {
    id: 'sp-1',
    name: 'Performance Cleat Sneakers',
    category: 'Footwear',
    price: 3999,
    discount: 32,
    rating: '4.9',
    image_url: 'https://images.unsplash.com/photo-1511556532299-8f662fc26c06?auto=format&fit=crop&w=260&q=75',
  },
  {
    id: 'sp-2',
    name: 'Pure Linen Casual Shirt',
    category: 'Clothing',
    price: 1999,
    discount: 28,
    rating: '4.8',
    image_url: 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&w=260&q=75',
  },
  {
    id: 'sp-3',
    name: 'Titanium Smart Health Ring',
    category: 'Wearables',
    price: 15999,
    discount: 25,
    rating: '4.9',
    image_url: 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&w=260&q=75',
  },
  {
    id: 'sp-4',
    name: 'Canvas Messenger Bag',
    category: 'Lifestyle',
    price: 2799,
    discount: 35,
    rating: '4.7',
    image_url: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&w=260&q=75',
  },
];

function CategoryWatermark({ category }) {
  const cat = (category || '').toLowerCase();
  if (cat.includes('foot')) return <Footprints size={34} strokeWidth={1.6} />;
  if (cat.includes('cloth')) return <Shirt size={34} strokeWidth={1.6} />;
  if (cat.includes('wear')) return <Watch size={34} strokeWidth={1.6} />;
  if (cat.includes('tech') || cat.includes('elec') || cat.includes('gam')) return <Laptop size={34} strokeWidth={1.6} />;
  return <ShoppingBag size={34} strokeWidth={1.6} />;
}

export default function WelcomeSplash({ onDone }) {
  const [fading, setFading] = useState(false);
  const [loadedMap, setLoadedMap] = useState({});

  const showcaseItems = useMemo(() => {
    const cached = getCachedHome();
    if (cached && Array.isArray(cached.products) && cached.products.length >= 4) {
      const preferredOrder = ['Footwear', 'Clothing', 'Wearables', 'Lifestyle'];
      const picks = [];
      for (const cat of preferredOrder) {
        const match = cached.products.find(
          (p) => (p.category || '').toLowerCase() === cat.toLowerCase() && p.image_url
        );
        if (match) {
          picks.push({ ...match, discount: match.discount_percent || 28 });
        }
      }
      if (picks.length === 4) return picks;
    }
    return FEATURED_FALLBACK;
  }, []);

  const handleSkip = () => {
    setFading(true);
    setTimeout(() => {
      if (onDone) onDone();
    }, 180);
  };

  useEffect(() => {
    // Flipkart-style quick product showcase landing (~1.35s total)
    const fadeTimer = setTimeout(() => setFading(true), 1150);
    const doneTimer = setTimeout(() => {
      if (onDone) onDone();
    }, 1400);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(doneTimer);
    };
  }, [onDone]);

  return (
    <div
      onClick={handleSkip}
      className="splash-overlay"
      style={{
        opacity: fading ? 0 : 1,
        transform: fading ? 'scale(1.02)' : 'scale(1)',
      }}
    >
      {/* Top Action Bar */}
      <div className="splash-topbar">
        <div className="splash-live-pill">
          <Zap size={13} fill="#fbbf24" color="#fbbf24" />
          <span>FESTIVE DROPS LIVE</span>
        </div>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            handleSkip();
          }}
          className="splash-skip-btn"
        >
          Skip
          <ArrowRight size={13} />
        </button>
      </div>

      {/* Center Content Container */}
      <div className="splash-content">
        {/* Brand Row */}
        <div className="splash-brand-row splash-pop">
          <div className="splash-brand-icon">
            <ShoppingBag size={26} strokeWidth={2.4} />
          </div>
          <div style={{ textAlign: 'left' }}>
            <h1 className="splash-brand-title">
              Urban<span>Cart</span>
            </h1>
            <div className="splash-brand-sub">
              <Sparkles size={11} />
              <span>Trending Fashion, Sneakers &amp; Tech</span>
            </div>
          </div>
        </div>

        {/* Highlight Banner Tagline */}
        <div className="splash-deal-banner splash-fade-up">
          Up to <strong>40% OFF</strong> • Flash Deals Ready Inside
        </div>

        {/* Flipkart-Style Product Showcase Grid */}
        <div className="splash-product-grid splash-fade-up">
          {showcaseItems.map((item, idx) => {
            const isLoaded = !!loadedMap[item.id || idx];
            return (
              <div
                key={item.id || idx}
                className="splash-product-card"
                style={{ animationDelay: `${idx * 55}ms` }}
              >
                <div className="splash-product-img-wrap">
                  <div
                    className="splash-img-placeholder"
                    style={{ opacity: isLoaded ? 0 : 1, transition: 'opacity 0.15s ease' }}
                  >
                    <CategoryWatermark category={item.category} />
                  </div>
                  <img
                    src={optimizeImageUrl(item.image_url, 260)}
                    alt={item.name}
                    loading="eager"
                    decoding="async"
                    onLoad={() => setLoadedMap((m) => ({ ...m, [item.id || idx]: true }))}
                    style={{ opacity: isLoaded ? 1 : 0, transition: 'opacity 0.15s ease' }}
                  />
                  <span className="splash-discount-tag">{item.discount || 30}% OFF</span>
                </div>
                <div className="splash-product-meta">
                  <div className="splash-product-cat">{item.category}</div>
                  <div className="splash-product-name">{item.name}</div>
                  <div className="splash-product-bottom">
                    <span className="splash-product-price">
                      ₹{Number(item.price).toLocaleString('en-IN')}
                    </span>
                    <span className="splash-product-rating">
                      <Star size={10} fill="#d97706" color="#d97706" />
                      {item.rating || '4.8'}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Enter CTA & Progress Indicator */}
        <div className="splash-footer">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleSkip();
            }}
            className="btn-gold splash-enter-btn"
          >
            Explore Deals Now
            <ArrowRight size={16} />
          </button>

          <div className="splash-progress-track">
            <div className="splash-progress" />
          </div>
        </div>
      </div>
    </div>
  );
}
