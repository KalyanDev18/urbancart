import React, { useRef } from 'react';
import { ChevronLeft, ChevronRight, Zap } from 'lucide-react';
import ProductCard from './ProductCard';

export default function DealsScrollRow({ title = 'Deals on your favourites! ✨', products = [], onRequireAuth, onSelectProduct }) {
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
    <div className="section-shell">
      
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
          <div style={{
            width: 34,
            height: 34,
            borderRadius: 10,
            background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#ffffff',
            boxShadow: '0 4px 12px rgba(217, 119, 6, 0.25)',
            flexShrink: 0,
          }}>
            <Zap size={18} strokeWidth={2.4} />
          </div>
          <div style={{ minWidth: 0 }}>
            <h2 style={{ fontSize: 'clamp(1.1rem, 3.5vw, 1.5rem)', fontWeight: 800, color: 'var(--text-main)', lineHeight: 1.2 }}>
              {title}
            </h2>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>
              Exclusive price drops and bestselling items
            </p>
          </div>
        </div>

        {/* Scroll Buttons */}
        <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
          <button
            onClick={() => scroll('left')}
            className="btn-dark"
            style={{ width: 34, height: 34, padding: 0, borderRadius: '50%', background: 'var(--bg-card)', border: '1px solid var(--border-strong)' }}
            aria-label="Scroll left"
          >
            <ChevronLeft size={18} color="var(--text-main)" />
          </button>
          <button
            onClick={() => scroll('right')}
            className="btn-dark"
            style={{ width: 34, height: 34, padding: 0, borderRadius: '50%', background: 'var(--bg-card)', border: '1px solid var(--border-strong)' }}
            aria-label="Scroll right"
          >
            <ChevronRight size={18} color="var(--text-main)" />
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
            <ProductCard product={item} onRequireAuth={onRequireAuth} onSelectProduct={onSelectProduct} />
          </div>
        ))}
      </div>

    </div>
  );
}
