import React, { useRef } from 'react';
import { ChevronLeft, ChevronRight, Zap } from 'lucide-react';
import ProductCard from './ProductCard';

export default function DealsScrollRow({ title = 'Deals on your favourites! ✨', products = [], onRequireAuth }) {
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

  if (!products || products.length === 0) return null;

  return (
    <div style={{ maxWidth: 1280, margin: '36px auto', padding: '0 20px' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 32,
            height: 32,
            borderRadius: 8,
            background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#090d16'
          }}>
            <Zap size={18} strokeWidth={2.5} />
          </div>
          <div>
            <h2 style={{ fontSize: '1.45rem', fontWeight: 800, color: '#f8fafc' }}>
              {title}
            </h2>
            <p style={{ fontSize: '0.82rem', color: '#94a3b8' }}>
              Exclusive price drops and bestselling items
            </p>
          </div>
        </div>

        {/* Scroll Buttons */}
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={() => scroll('left')}
            className="btn-dark"
            style={{ width: 38, height: 38, padding: 0, borderRadius: '50%' }}
            aria-label="Scroll left"
          >
            <ChevronLeft size={18} />
          </button>
          <button
            onClick={() => scroll('right')}
            className="btn-dark"
            style={{ width: 38, height: 38, padding: 0, borderRadius: '50%' }}
            aria-label="Scroll right"
          >
            <ChevronRight size={18} />
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
          paddingBottom: 10,
          scrollSnapType: 'x mandatory',
        }}
      >
        {products.map((item) => (
          <div 
            key={item.id} 
            style={{ 
              flex: '0 0 280px', 
              minWidth: 280, 
              scrollSnapAlign: 'start' 
            }}
          >
            <ProductCard product={item} onRequireAuth={onRequireAuth} />
          </div>
        ))}
      </div>

    </div>
  );
}
