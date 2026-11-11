import React, { useRef } from 'react';
import { ChevronLeft, ChevronRight, Zap } from 'lucide-react';
import ProductCard from './ProductCard';

export default function DealsScrollRow({ title = 'Deals on your favourites! ✨', products = [], onRequireAuth }) {
  const safeProducts = Array.isArray(products) ? products : [];
  const scrollRef = useRef(null);

  const scroll = (direction) => {
    if (scrollRef.current) {
      const { scrollLeft, clientWidth } = scrollRef.current;
      const scrollAmount = clientWidth * 0.75;
      scrollRef.current.scrollTo({
        left: direction === 'left' ? scrollLeft - scrollAmount : scrollLeft + scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  if (safeProducts.length === 0) return null;

  return (
    <div style={{ maxWidth: 1280, margin: '36px auto', padding: '0 20px' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#ffffff',
            boxShadow: '0 4px 12px rgba(217, 119, 6, 0.25)'
          }}>
            <Zap size={20} strokeWidth={2.4} />
          </div>
          <div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a' }}>
              {title}
            </h2>
            <p style={{ fontSize: '0.84rem', color: '#64748b' }}>
              Exclusive price drops and bestselling items
            </p>
          </div>
        </div>

        {/* Scroll Buttons */}
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={() => scroll('left')}
            className="btn-dark"
            style={{ width: 40, height: 40, padding: 0, borderRadius: '50%', background: '#ffffff', border: '1px solid #cbd5e1' }}
            aria-label="Scroll left"
          >
            <ChevronLeft size={20} color="#0f172a" />
          </button>
          <button
            onClick={() => scroll('right')}
            className="btn-dark"
            style={{ width: 40, height: 40, padding: 0, borderRadius: '50%', background: '#ffffff', border: '1px solid #cbd5e1' }}
            aria-label="Scroll right"
          >
            <ChevronRight size={20} color="#0f172a" />
          </button>
        </div>
      </div>

      {/* Horizontal Carousel */}
      <div 
        ref={scrollRef}
        className="no-scrollbar"
        style={{
          display: 'flex',
          gap: 20,
          overflowX: 'auto',
          paddingBottom: 14,
          scrollSnapType: 'x mandatory',
        }}
      >
        {safeProducts.map((item) => (
          <div 
            key={item.id} 
            className="deals-scroll-item"
          >
            <ProductCard product={item} onRequireAuth={onRequireAuth} />
          </div>
        ))}
      </div>

    </div>
  );
}
