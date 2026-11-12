import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, ShoppingBag, Sparkles, ArrowRight, Star } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { optimizeImageUrl } from '../api/client';

export default function HeroCarousel({ products = [], onRequireAuth, onShopNow, onSelectProduct }) {
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
      className="hero-carousel-wrap"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <div className="hero-card-outer">
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
            const discount = Number(product.discount_percent || 0);
            const originalPrice = Number(product.original_price || product.compare_at_price || 0);
            const reviewCount = Number(product.review_count || 0);
            const ratingVal = Number(product.rating || 0);

            return (
              <div 
                key={product.id || idx}
                className="hero-slide-inner"
                style={{
                  flex: `0 0 ${100 / carouselItems.length}%`,
                  width: `${100 / carouselItems.length}%`,
                }}
              >
                {/* Left Text Column */}
                <div className="hero-text-col">
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10, flexWrap: 'wrap' }}>
                    <span className="badge-gold">
                      <Sparkles size={13} />
                      DROP 0{idx + 1} OF {String(carouselItems.length).padStart(2, '0')}
                    </span>
                    <span style={{ fontSize: '0.8rem', color: 'var(--price-color)', fontWeight: 700, textTransform: 'uppercase' }}>
                      {product.category}
                    </span>
                  </div>

                  <h2
                    onClick={() => onSelectProduct && onSelectProduct(product)}
                    style={{
                      fontSize: 'clamp(1.3rem, 3.8vw, 2.45rem)',
                      fontWeight: 800,
                      color: 'var(--text-main)',
                      lineHeight: 1.15,
                      marginBottom: 10,
                      cursor: onSelectProduct ? 'pointer' : 'default',
                    }}
                  >
                    {product.name}
                  </h2>

                  <p className="hero-desc" style={{
                    fontSize: 'clamp(0.84rem, 2vw, 0.98rem)',
                    color: 'var(--text-muted)',
                    lineHeight: 1.5,
                    marginBottom: 14,
                    maxWidth: 480,
                  }}>
                    {product.description || 'Crafted for everyday style and comfort.'}
                  </p>

                  {/* Price & Real Rating */}
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
                    <div style={{ fontSize: 'clamp(1.35rem, 3.5vw, 2.05rem)', fontWeight: 800, color: 'var(--price-color)' }}>
                      ₹{Number(product.price).toLocaleString('en-IN')}
                    </div>
                    {originalPrice > Number(product.price) && (
                      <div style={{ fontSize: '0.94rem', color: 'var(--text-dim)', textDecoration: 'line-through' }}>
                        ₹{Number(originalPrice).toLocaleString('en-IN')}
                      </div>
                    )}
                    {discount > 0 && originalPrice > Number(product.price) && (
                      <div style={{ background: '#d97706', color: '#ffffff', fontSize: '0.72rem', fontWeight: 800, padding: '3px 8px', borderRadius: 6 }}>
                        {discount}% OFF
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => onSelectProduct && onSelectProduct(product)}
                      style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'var(--badge-bg)', border: '1px solid var(--badge-border)', padding: '3px 8px', borderRadius: 8, cursor: 'pointer' }}
                    >
                      <Star size={13} fill={reviewCount > 0 ? '#d97706' : 'none'} color="#d97706" />
                      <span style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--badge-text)' }}>
                        {reviewCount > 0 ? `${ratingVal.toFixed(1)} (${reviewCount})` : 'Reviews'}
                      </span>
                    </button>
                  </div>

                  {/* Call to Action Buttons */}
                  <div className="hero-cta-row" style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                    <button
                      onClick={() => handleAddToCart(product)}
                      disabled={addingId === product.id}
                      className="btn-gold"
                      style={{ padding: '11px 20px', fontSize: '0.9rem' }}
                    >
                      <ShoppingBag size={16} />
                      {addingId === product.id ? 'Adding...' : 'Add to Bag'}
                    </button>

                    <button
                      onClick={() => (onSelectProduct ? onSelectProduct(product) : onShopNow?.())}
                      className="btn-dark"
                      style={{ padding: '11px 16px', fontSize: '0.9rem' }}
                    >
                      Reviews & Details
                      <ArrowRight size={15} />
                    </button>
                  </div>

                </div>

                {/* Right Product Image Column */}
                <div className="hero-img-col">
                  <div className="hero-img-box">
                    <img
                      src={optimizeImageUrl(product.image_url, 640)}
                      alt={product.name}
                      loading={idx === 0 ? 'eager' : 'lazy'}
                      fetchPriority={idx === 0 ? 'high' : 'low'}
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
