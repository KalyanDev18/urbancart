import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, ShoppingBag, Sparkles, ArrowRight, Star } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { optimizeImageUrl } from '../api/client';

export default function HeroCarousel({ products = [], onRequireAuth, onShopNow }) {
  const safeProducts = Array.isArray(products) ? products : [];
  const carouselItems = safeProducts.slice(0, 5);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const { addToCart } = useCart();
  const [addingId, setAddingId] = useState(null);
  const touchStartX = useRef(null);

  // Smooth auto-slide every 1.8s (GPU slide animation + view time)
  useEffect(() => {
    if (carouselItems.length === 0 || isHovered) return;

    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % carouselItems.length);
    }, 1800);

    return () => clearInterval(timer);
  }, [carouselItems.length, isHovered]);

  if (carouselItems.length === 0) return null;

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + carouselItems.length) % carouselItems.length);
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % carouselItems.length);
  };

  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
    setIsHovered(true);
  };

  const handleTouchEnd = (e) => {
    if (touchStartX.current !== null) {
      const deltaX = touchStartX.current - e.changedTouches[0].clientX;
      if (deltaX > 40) handleNext();
      else if (deltaX < -40) handlePrev();
    }
    touchStartX.current = null;
    setIsHovered(false);
  };

  const handleAddToCart = async (product) => {
    setAddingId(product.id);
    try {
      const res = await addToCart(product.id, 1);
      if (res && res.authRequired && onRequireAuth) {
        onRequireAuth();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setAddingId(null);
    }
  };

  return (
    <div 
      style={{ maxWidth: 1280, margin: '16px auto 24px', padding: '0 16px' }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <div 
        style={{
          position: 'relative',
          borderRadius: 24,
          overflow: 'hidden',
          background: 'var(--bg-hero)',
          border: '1px solid var(--border-hero)',
          boxShadow: '0 10px 35px rgba(217, 119, 6, 0.1)',
          minHeight: 380,
          transition: 'background 0.25s ease, border-color 0.25s ease',
        }}
      >
        {/* Navigation Arrows */}
        <button
          onClick={handlePrev}
          className="hero-arrow-btn hero-arrow-prev"
          aria-label="Previous Slide"
        >
          <ChevronLeft size={20} />
        </button>

        <button
          onClick={handleNext}
          className="hero-arrow-btn hero-arrow-next"
          aria-label="Next Slide"
        >
          <ChevronRight size={20} />
        </button>

        {/* Real GPU Horizontal Slide Track */}
        <div 
          style={{
            display: 'flex',
            width: `${carouselItems.length * 100}%`,
            transform: `translate3d(-${currentIndex * (100 / carouselItems.length)}%, 0, 0)`,
            transition: 'transform 0.5s cubic-bezier(0.22, 1, 0.36, 1)',
            willChange: 'transform',
          }}
        >
          {carouselItems.map((product, idx) => {
            const discount = product.discount_percent || Math.round(((product.compare_at_price - product.price) / product.compare_at_price) * 100) || 28;
            const originalPrice = product.original_price || product.compare_at_price || Math.round(product.price * 1.35);

            return (
              <div 
                key={product.id || idx}
                style={{
                  flex: `0 0 ${100 / carouselItems.length}%`,
                  width: `${100 / carouselItems.length}%`,
                  minHeight: 380,
                  display: 'flex',
                  flexDirection: 'row',
                  flexWrap: 'wrap',
                  alignItems: 'center',
                  gap: 20,
                  padding: '24px clamp(18px, 5vw, 60px) 52px',
                  boxSizing: 'border-box',
                }}
              >
                {/* Left Text Column */}
                <div style={{ flex: '1 1 280px', zIndex: 10 }}>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                    <span className="badge-gold">
                      <Sparkles size={13} />
                      DROP 0{idx + 1} OF 05
                    </span>
                    <span style={{ fontSize: '0.82rem', color: 'var(--price-color)', fontWeight: 700, textTransform: 'uppercase' }}>
                      {product.category}
                    </span>
                  </div>

                  <h2 style={{
                    fontSize: 'clamp(1.5rem, 4vw, 2.5rem)',
                    fontWeight: 800,
                    color: 'var(--text-main)',
                    lineHeight: 1.15,
                    marginBottom: 12,
                  }}>
                    {product.name}
                  </h2>

                  <p style={{
                    fontSize: 'clamp(0.86rem, 2vw, 1rem)',
                    color: 'var(--text-muted)',
                    lineHeight: 1.55,
                    marginBottom: 18,
                    maxWidth: 480,
                  }}>
                    {product.description || 'Precision crafted with premier materials, limited stock drop available for priority express delivery.'}
                  </p>

                  {/* Price & Rating */}
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
                    <div style={{ fontSize: 'clamp(1.5rem, 3.5vw, 2.1rem)', fontWeight: 800, color: 'var(--price-color)' }}>
                      ₹{Number(product.price).toLocaleString('en-IN')}
                    </div>
                    {originalPrice > product.price && (
                      <div style={{ fontSize: '1rem', color: 'var(--text-dim)', textDecoration: 'line-through' }}>
                        ₹{Number(originalPrice).toLocaleString('en-IN')}
                      </div>
                    )}
                    <div style={{ background: '#d97706', color: '#ffffff', fontSize: '0.74rem', fontWeight: 800, padding: '3px 8px', borderRadius: 6 }}>
                      {discount}% OFF
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'var(--badge-bg)', border: '1px solid var(--badge-border)', padding: '3px 8px', borderRadius: 8 }}>
                      <Star size={13} fill="#d97706" color="#d97706" />
                      <span style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--badge-text)' }}>
                        {product.rating || '4.9'}
                      </span>
                    </div>
                  </div>

                  {/* Call to Action Buttons */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                    <button
                      onClick={() => handleAddToCart(product)}
                      disabled={addingId === product.id}
                      className="btn-gold"
                      style={{ padding: '11px 22px', fontSize: '0.92rem' }}
                    >
                      <ShoppingBag size={17} />
                      {addingId === product.id ? 'Adding...' : 'Add to Bag'}
                    </button>

                    <button
                      onClick={onShopNow}
                      className="btn-dark"
                      style={{ padding: '11px 18px', fontSize: '0.92rem' }}
                    >
                      Browse All Drops
                      <ArrowRight size={16} />
                    </button>
                  </div>

                </div>

                {/* Right Product Image Column */}
                <div style={{
                  flex: '1 1 260px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  position: 'relative',
                }}>
                  <div style={{
                    position: 'relative',
                    width: 'clamp(210px, 32vw, 350px)',
                    height: 'clamp(210px, 32vw, 350px)',
                    borderRadius: 24,
                    overflow: 'hidden',
                    boxShadow: '0 16px 40px rgba(217, 119, 6, 0.18)',
                    background: 'var(--bg-card)',
                    border: '2px solid var(--border-hero)'
                  }}>
                    <img
                      src={optimizeImageUrl(product.image_url, 640)}
                      alt={product.name}
                      loading={idx === 0 ? 'eager' : 'lazy'}
                      decoding="async"
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                      }}
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = optimizeImageUrl('', 640);
                      }}
                    />
                  </div>
                </div>

              </div>
            );
          })}
        </div>

        {/* 5 Dots Indicator */}
        <div style={{
          position: 'absolute',
          bottom: 16,
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          gap: 8,
          zIndex: 30,
        }}>
          {carouselItems.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentIndex(idx)}
              style={{
                width: currentIndex === idx ? 28 : 9,
                height: 9,
                borderRadius: 9999,
                background: currentIndex === idx ? '#d97706' : 'var(--border-strong)',
                transition: 'all 0.3s ease',
                border: 'none',
                cursor: 'pointer',
              }}
              aria-label={`Slide ${idx + 1}`}
            />
          ))}
        </div>

      </div>
    </div>
  );
}
