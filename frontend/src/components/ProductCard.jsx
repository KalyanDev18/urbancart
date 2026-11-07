import React, { useState } from 'react';
import { ShoppingBag, Star, Check } from 'lucide-react';
import { useCart } from '../context/CartContext';

export default function ProductCard({ product, onRequireAuth }) {
  const { addToCart } = useCart();
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);

  const handleAdd = async (e) => {
    e.stopPropagation();
    setAdding(true);
    try {
      const res = await addToCart(product.id, 1);
      if (res && res.authRequired) {
        if (onRequireAuth) {
          onRequireAuth();
        }
      } else {
        setAdded(true);
        setTimeout(() => setAdded(false), 2000);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setAdding(false);
    }
  };

  const discount = product.discount_percent || Math.round(((product.compare_at_price - product.price) / product.compare_at_price) * 100) || 25;
  const originalPrice = product.original_price || product.compare_at_price || Math.round(product.price * 1.35);

  return (
    <div 
      style={{
        background: '#ffffff',
        borderRadius: 20,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        border: '1px solid #e2e8f0',
        boxShadow: '0 4px 18px rgba(15, 23, 42, 0.04)',
        transition: 'all 0.25s ease',
        position: 'relative',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-6px)';
        e.currentTarget.style.borderColor = '#cbd5e1';
        e.currentTarget.style.boxShadow = '0 12px 30px rgba(15, 23, 42, 0.09)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.borderColor = '#e2e8f0';
        e.currentTarget.style.boxShadow = '0 4px 18px rgba(15, 23, 42, 0.04)';
      }}
    >
      {/* Discount Pill */}
      {discount > 0 && (
        <div style={{
          position: 'absolute',
          top: 14,
          left: 14,
          zIndex: 10,
          background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
          color: '#ffffff',
          fontWeight: 800,
          fontSize: '0.72rem',
          padding: '4px 10px',
          borderRadius: 9999,
          boxShadow: '0 4px 12px rgba(217, 119, 6, 0.25)',
          letterSpacing: '0.04em'
        }}>
          {discount}% OFF
        </div>
      )}

      {/* Image Area */}
      <div style={{
        position: 'relative',
        width: '100%',
        paddingTop: '90%',
        background: '#f8fafc',
        overflow: 'hidden',
      }}>
        <img
          src={product.image_url || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop&q=80'}
          alt={product.name}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            transition: 'transform 0.4s ease',
          }}
          onError={(e) => {
            e.target.src = 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop&q=80';
          }}
        />
      </div>

      {/* Product Details */}
      <div style={{ padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 10, flex: 1, justifyContent: 'space-between' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ fontSize: '0.74rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700 }}>
              {product.category}
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, background: '#fef3c7', padding: '2px 8px', borderRadius: 8 }}>
              <Star size={13} fill="#d97706" color="#d97706" />
              <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#92400e' }}>
                {product.rating || '4.8'}
              </span>
            </div>
          </div>

          <h3 style={{
            fontSize: '1.02rem',
            fontWeight: 700,
            color: '#0f172a',
            lineHeight: 1.35,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}>
            {product.name}
          </h3>
        </div>

        {/* Pricing & Add to Cart button */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 12, paddingTop: 12, borderTop: '1px solid #f1f5f9' }}>
          <div>
            <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#b45309', letterSpacing: '-0.02em' }}>
              ₹{Number(product.price).toLocaleString('en-IN')}
            </div>
            {originalPrice > product.price && (
              <div style={{ fontSize: '0.8rem', color: '#94a3b8', textDecoration: 'line-through' }}>
                ₹{Number(originalPrice).toLocaleString('en-IN')}
              </div>
            )}
          </div>

          <button
            onClick={handleAdd}
            disabled={adding}
            className={added ? 'btn-dark' : 'btn-gold'}
            style={{
              padding: '9px 16px',
              fontSize: '0.84rem',
              borderRadius: 12,
            }}
          >
            {added ? (
              <>
                <Check size={16} color="#059669" />
                Added
              </>
            ) : (
              <>
                <ShoppingBag size={15} />
                Add
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
}
