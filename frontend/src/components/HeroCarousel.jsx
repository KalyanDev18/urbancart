import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, ShoppingBag, Sparkles, ArrowRight, Star } from 'lucide-react';
import { useCart } from '../context/CartContext';

export default function HeroCarousel({ products = [], onRequireAuth, onShopNow }) {
  const safeProducts = Array.isArray(products) ? products : [];
  const carouselItems = safeProducts.slice(0, 5);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const { addToCart } = useCart();
  const [addingId, setAddingId] = useState(null);

  // Auto-slide every 1.5s (smooth 0.55s slide transition + view time)
  useEffect(() => {
    if (carouselItems.length === 0 || isHovered) return;

    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % carouselItems.length);
    }, 1500);

    return () => clearInterval(timer);
  }, [carouselItems.length, isHovered]);

  if (carouselItems.length === 0) return null;

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + carouselItems.length) % carouselItems.length);
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % carouselItems.length);
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
      style={{ maxWidth: 1280, margin: '20px auto 28px', padding: '0 16px' }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div 
        style={{
          position: 'relative',
          borderRadius: 28,
          overflow: 'hidden',
          background: 'linear-gradient(135deg, #fffdfa 0%, #fffbeb 40%, #fef3c7 100%)',
          border: '1px solid #fde68a',
          boxShadow: '0 10px 35px rgba(217, 119, 6, 0.1)',
          minHeight: 420,
        }}
      >
        {/* Navigation Arrows */}
        <button
          onClick={handlePrev}
          style={{
            position: 'absolute',
            left: 16,
            top: '50%',
            transform: 'translateY(-50%)',
            zIndex: 30,
            width: 44,
            height: 44,
            borderRadius: '50%',
            background: 'rgba(255, 255, 255, 0.95)',
            border: '1px solid #e2e8f0',
            boxShadow: '0 4px 14px rgba(0,0,0,0.12)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#0f172a',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
          }}
          aria-label="Previous Slide"
        >
          <ChevronLeft size={22} />
        </button>

        <button
          onClick={handleNext}
          style={{
            position: 'absolute',
            right: 16,
            top: '50%',
            transform: 'translateY(-50%)',
            zIndex: 30,
            width: 44,
            height: 44,
            borderRadius: '50%',
            background: 'rgba(255, 255, 255, 0.95)',
            border: '1px solid #e2e8f0',
            boxShadow: '0 4px 14px rgba(0,0,0,0.12)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#0f172a',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
          }}
          aria-label="Next Slide"
        >
          <ChevronRight size={22} />
        </button>

        {/* Real Horizontal Slide Track */}
        <div 
          style={{
            display: 'flex',
            width: `${carouselItems.length * 100}%`,
            transform: `translateX(-${currentIndex * (100 / carouselItems.length)}%)`,
            transition: 'transform 0.55s cubic-bezier(0.25, 1, 0.5, 1)',
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
                  minHeight: 420,
                  display: 'flex',
                  flexDirection: 'row',
                  flexWrap: 'wrap',
                  alignItems: 'center',
                  padding: 'clamp(24px, 5vw, 44px)',
                  boxSizing: 'border-box',
                }}
              >
                {/* Left Text Column */}
                <div style={{ flex: '1 1 340px', paddingRight: 'clamp(10px, 3vw, 40px)', zIndex: 10 }}>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                    <span className="badge-gold">
                      <Sparkles size={13} />
                      DROP 0{idx + 1} OF 05
                    </span>
                    <span style={{ fontSize: '0.82rem', color: '#b45309', fontWeight: 700, textTransform: 'uppercase' }}>
                      {product.category}
                    </span>
                  </div>

                  <h2 style={{
                    fontSize: 'clamp(1.7rem, 4.2vw, 2.6rem)',
                    fontWeight: 800,
                    color: '#0f172a',
                    lineHeight: 1.15,
                    marginBottom: 14,
                  }}>
                    {product.name}
                  </h2>

                  <p style={{
                    fontSize: 'clamp(0.88rem, 2vw, 1rem)',
                    color: '#475569',
                    lineHeight: 1.55,
                    marginBottom: 20,
                    maxWidth: 480,
                  }}>
                    {product.description || 'Precision crafted with premier materials, limited stock drop available for priority express delivery.'}
                  </p>

                  {/* Price & Rating */}
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 14, marginBottom: 24, flexWrap: 'wrap' }}>
                    <div style={{ fontSize: 'clamp(1.6rem, 3.5vw, 2.2rem)', fontWeight: 800, color: '#b45309' }}>
                      ₹{Number(product.price).toLocaleString('en-IN')}
                    </div>
                    {originalPrice > product.price && (
                      <div style={{ fontSize: '1.05rem', color: '#94a3b8', textDecoration: 'line-through' }}>
                        ₹{Number(originalPrice).toLocaleString('en-IN')}
                      </div>
                    )}
                    <div style={{ background: '#d97706', color: '#ffffff', fontSize: '0.76rem', fontWeight: 800, padding: '3px 8px', borderRadius: 6 }}>
                      {discount}% OFF
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, background: '#fef3c7', padding: '3px 8px', borderRadius: 8 }}>
                      <Star size={13} fill="#d97706" color="#d97706" />
                      <span style={{ fontSize: '0.82rem', fontWeight: 800, color: '#92400e' }}>
                        {product.rating || '4.9'}
                      </span>
                    </div>
                  </div>

                  {/* Call to Action Buttons */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
                    <button
                      onClick={() => handleAddToCart(product)}
                      disabled={addingId === product.id}
                      className="btn-gold"
                      style={{ padding: '12px 26px', fontSize: '0.96rem' }}
                    >
                      <ShoppingBag size={18} />
                      {addingId === product.id ? 'Adding...' : 'Add to Bag'}
                    </button>

                    <button
                      onClick={onShopNow}
                      className="btn-dark"
                      style={{ padding: '12px 22px', fontSize: '0.96rem', background: '#ffffff', border: '1px solid #cbd5e1' }}
                    >
                      Browse All Drops
                      <ArrowRight size={17} />
                    </button>
                  </div>

                </div>

                {/* Right Product Image Column */}
                <div style={{
                  flex: '1 1 300px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  position: 'relative',
                  minHeight: 280,
                }}>
                  <div style={{
                    position: 'relative',
                    width: 'clamp(240px, 35vw, 380px)',
                    height: 'clamp(240px, 35vw, 380px)',
                    borderRadius: 24,
                    overflow: 'hidden',
                    boxShadow: '0 16px 40px rgba(217, 119, 6, 0.18)',
                    background: '#ffffff',
                    border: '2px solid #ffffff'
                  }}>
                    <img
                      src={product.image_url || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800'}
                      alt={product.name}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        transition: 'transform 0.4s ease',
                      }}
                      onError={(e) => {
                        e.target.src = 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800';
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
                background: currentIndex === idx ? '#d97706' : '#cbd5e1',
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
