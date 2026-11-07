import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, ShoppingBag, Sparkles, ArrowRight, Star } from 'lucide-react';
import { useCart } from '../context/CartContext';

export default function HeroCarousel({ products = [], onRequireAuth, onShopNow }) {
  // Use first 5 products or fallback items
  const carouselItems = products.slice(0, 5);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const { addToCart } = useCart();
  const [adding, setAdding] = useState(false);

  // Auto-play interval (4.5 seconds)
  useEffect(() => {
    if (carouselItems.length === 0 || isHovered) return;

    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % carouselItems.length);
    }, 4500);

    return () => clearInterval(timer);
  }, [carouselItems.length, isHovered]);

  if (carouselItems.length === 0) return null;

  const currentProduct = carouselItems[currentIndex];

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + carouselItems.length) % carouselItems.length);
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % carouselItems.length);
  };

  const handleAddToCart = async () => {
    setAdding(true);
    try {
      const res = await addToCart(currentProduct.id, 1);
      if (res && res.authRequired && onRequireAuth) {
        onRequireAuth();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setAdding(false);
    }
  };

  const discount = currentProduct.discount_percent || Math.round(((currentProduct.compare_at_price - currentProduct.price) / currentProduct.compare_at_price) * 100) || 28;
  const originalPrice = currentProduct.original_price || currentProduct.compare_at_price || Math.round(currentProduct.price * 1.35);

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
            zIndex: 20,
            width: 44,
            height: 44,
            borderRadius: '50%',
            background: 'rgba(255, 255, 255, 0.9)',
            border: '1px solid #e2e8f0',
            boxShadow: '0 4px 14px rgba(0,0,0,0.1)',
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
            zIndex: 20,
            width: 44,
            height: 44,
            borderRadius: '50%',
            background: 'rgba(255, 255, 255, 0.9)',
            border: '1px solid #e2e8f0',
            boxShadow: '0 4px 14px rgba(0,0,0,0.1)',
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

        {/* Carousel Content */}
        <div 
          key={currentProduct.id}
          className="animate-fade-in"
          style={{
            display: 'flex',
            flexDirection: 'row',
            flexWrap: 'wrap',
            alignItems: 'center',
            minHeight: 420,
            padding: 'clamp(24px, 5vw, 44px)',
          }}
        >
          {/* Left Text Column */}
          <div style={{ flex: '1 1 340px', paddingRight: 'clamp(10px, 3vw, 40px)', zIndex: 10 }}>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
              <span className="badge-gold">
                <Sparkles size={13} />
                DROP 0{currentIndex + 1} OF 05
              </span>
              <span style={{ fontSize: '0.82rem', color: '#b45309', fontWeight: 700, textTransform: 'uppercase' }}>
                {currentProduct.category}
              </span>
            </div>

            <h1 style={{
              fontSize: 'clamp(1.7rem, 4.2vw, 2.6rem)',
              fontWeight: 800,
              color: '#0f172a',
              lineHeight: 1.15,
              marginBottom: 14,
            }}>
              {currentProduct.name}
            </h1>

            <p style={{
              fontSize: 'clamp(0.88rem, 2vw, 1rem)',
              color: '#475569',
              lineHeight: 1.55,
              marginBottom: 20,
              maxWidth: 480,
            }}>
              {currentProduct.description || 'Precision crafted with premier materials, limited stock drop available for priority express delivery.'}
            </p>

            {/* Price & Rating */}
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 14, marginBottom: 24 }}>
              <div style={{ fontSize: 'clamp(1.6rem, 3.5vw, 2.2rem)', fontWeight: 800, color: '#b45309' }}>
                ₹{Number(currentProduct.price).toLocaleString('en-IN')}
              </div>
              {originalPrice > currentProduct.price && (
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
                  {currentProduct.rating || '4.9'}
                </span>
              </div>
            </div>

            {/* Call to Action Buttons */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
              <button
                onClick={handleAddToCart}
                disabled={adding}
                className="btn-gold"
                style={{ padding: '12px 26px', fontSize: '0.96rem' }}
              >
                <ShoppingBag size={18} />
                {adding ? 'Adding...' : 'Add to Bag'}
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
                src={currentProduct.image_url || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800'}
                alt={currentProduct.name}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  transition: 'transform 0.4s ease',
                }}
              />
            </div>
          </div>

        </div>

        {/* 5 Dots Indicator */}
        <div style={{
          position: 'absolute',
          bottom: 16,
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          gap: 8,
          zIndex: 20,
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
