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
  Truck,
  ShieldCheck,
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
    image_url: 'https://images.unsplash.com/photo-1511556532299-8f662fc26c06?auto=format&fit=crop&w=420&q=75',
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
  if (cat.includes('foot')) return <Footprints size={30} strokeWidth={1.6} />;
  if (cat.includes('cloth')) return <Shirt size={30} strokeWidth={1.6} />;
  if (cat.includes('wear')) return <Watch size={30} strokeWidth={1.6} />;
  if (cat.includes('tech') || cat.includes('elec') || cat.includes('gam')) return <Laptop size={30} strokeWidth={1.6} />;
  return <ShoppingBag size={30} strokeWidth={1.6} />;
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
          picks.push({ ...match, discount: match.discount_percent || 30 });
        }
      }
      if (picks.length === 4) return picks;
    }
    return FEATURED_FALLBACK;
  }, []);

  const heroDeal = showcaseItems[0];
  const miniDeals = showcaseItems.slice(1, 4);

  const handleSkip = () => {
    setFading(true);
    setTimeout(() => {
      if (onDone) onDone();
    }, 180);
  };

  useEffect(() => {
    // 2-second Flipkart-style promotional poster landing screen
    const fadeTimer = setTimeout(() => setFading(true), 1850);
    const doneTimer = setTimeout(() => {
      if (onDone) onDone();
    }, 2100);

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
        transform: fading ? 'scale(1.015)' : 'scale(1)',
      }}
    >
      <div className="poster-card splash-pop" onClick={(e) => e.stopPropagation()}>
        {/* Poster Top Strip */}
        <div className="poster-header">
          <div className="poster-brand">
            <div className="poster-brand-icon">
              <ShoppingBag size={18} strokeWidth={2.5} />
            </div>
            <span className="poster-brand-name">
              Urban<span>Cart</span>
            </span>
            <span className="poster-live-pill">
              <Zap size={11} fill="#fbbf24" color="#fbbf24" />
              MEGA SALE LIVE
            </span>
          </div>

          <button type="button" onClick={handleSkip} className="splash-skip-btn">
            Skip
            <ArrowRight size={13} />
          </button>
        </div>

        {/* Poster Hero Split Layout */}
        <div className="poster-body">
          {/* Left Typography & Offer Column */}
          <div className="poster-copy splash-fade-up">
            <div className="poster-eyebrow">
              <Sparkles size={12} />
              CURATED FASHION • SNEAKERS • SMART TECH
            </div>

            <h1 className="poster-headline">
              THE GRAND <span>URBAN</span> FEST
            </h1>

            <div className="poster-offer-box">
              <div className="poster-offer-main">UP TO 40% OFF</div>
              <div className="poster-offer-sub">+ 10% Extra UrbanCoins Cashback</div>
            </div>

            <div className="poster-perks-row">
              <span>
                <Truck size={13} color="#fbbf24" /> 2–4 Day Delivery
              </span>
              <span>
                <ShieldCheck size={13} color="#10b981" /> 100% Authentic
              </span>
            </div>

            <button type="button" onClick={handleSkip} className="btn-gold poster-cta-btn">
              Explore All Deals Now
              <ArrowRight size={16} />
            </button>
          </div>

          {/* Right Product Collage */}
          <div className="poster-collage splash-fade-up">
            {/* Hero Spotlight Deal Banner Card */}
            {heroDeal && (
              <div className="poster-hero-tile" onClick={handleSkip}>
                <div className="poster-hero-img-box">
                  <div
                    className="splash-img-placeholder"
                    style={{ opacity: loadedMap[heroDeal.id] ? 0 : 1, transition: 'opacity 0.15s ease' }}
                  >
                    <CategoryWatermark category={heroDeal.category} />
                  </div>
                  <img
                    src={optimizeImageUrl(heroDeal.image_url, 420)}
                    alt={heroDeal.name}
                    loading="eager"
                    decoding="async"
                    onLoad={() => setLoadedMap((m) => ({ ...m, [heroDeal.id]: true }))}
                    style={{ opacity: loadedMap[heroDeal.id] ? 1 : 0, transition: 'opacity 0.15s ease' }}
                  />
                  <span className="poster-star-badge">STAR DEAL</span>
                </div>

                <div className="poster-hero-info">
                  <span className="poster-cat-tag">{heroDeal.category}</span>
                  <div className="poster-hero-title">{heroDeal.name}</div>
                  <div className="poster-hero-pricing">
                    <span className="poster-price-now">
                      ₹{Number(heroDeal.price).toLocaleString('en-IN')}
                    </span>
                    <span className="poster-discount-pill">
                      {heroDeal.discount || 32}% OFF
                    </span>
                  </div>
                  <div className="poster-hero-rating">
                    <Star size={11} fill="#fbbf24" color="#fbbf24" />
                    <span>{heroDeal.rating || '4.9'} Bestseller Drop</span>
                  </div>
                </div>
              </div>
            )}

            {/* Bottom 3 Mini Product Deal Posters */}
            <div className="poster-mini-row">
              {miniDeals.map((item, idx) => {
                const key = item.id || idx;
                const isLoaded = !!loadedMap[key];
                return (
                  <div key={key} className="poster-mini-tile" onClick={handleSkip}>
                    <div className="poster-mini-img-wrap">
                      <div
                        className="splash-img-placeholder"
                        style={{ opacity: isLoaded ? 0 : 1, transition: 'opacity 0.15s ease' }}
                      >
                        <CategoryWatermark category={item.category} />
                      </div>
                      <img
                        src={optimizeImageUrl(item.image_url, 240)}
                        alt={item.name}
                        loading="eager"
                        decoding="async"
                        onLoad={() => setLoadedMap((m) => ({ ...m, [key]: true }))}
                        style={{ opacity: isLoaded ? 1 : 0, transition: 'opacity 0.15s ease' }}
                      />
                      <span className="splash-discount-tag">{item.discount || 28}% OFF</span>
                    </div>
                    <div className="poster-mini-meta">
                      <div className="poster-mini-name">{item.name}</div>
                      <div className="poster-mini-price">
                        ₹{Number(item.price).toLocaleString('en-IN')}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Bottom 2-Second Progress Strip */}
        <div className="poster-progress-bar">
          <div className="splash-progress" />
        </div>
      </div>
    </div>
  );
}
