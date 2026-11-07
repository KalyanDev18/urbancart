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
      className="glass"
      style={{
        borderRadius: 20,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        transition: 'transform 0.25s ease, border-color 0.25s ease, box-shadow 0.25s ease',
        position: 'relative',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-6px)';
        e.currentTarget.style.borderColor = 'rgba(245, 158, 11, 0.4)';
        e.currentTarget.style.boxShadow = '0 12px 30px rgba(0, 0, 0, 0.45)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
        e.currentTarget.style.boxShadow = 'none';
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
          color: '#090d16',
          fontWeight: 800,
          fontSize: '0.72rem',
          padding: '4px 10px',
          borderRadius: 9999,
          boxShadow: '0 4px 12px rgba(245, 158, 11, 0.35)',
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
        background: '#0a0f1d',
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
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
            <span style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>
              {product.category}
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, background: '#1e293b', padding: '2px 8px', borderRadius: 8 }}>
              <Star size={13} fill="#f59e0b" color="#f59e0b" />
              <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#f8fafc' }}>
                {product.rating || '4.8'}
              </span>
            </div>
          </div>

          <h3 style={{
            fontSize: '1.02rem',
            fontWeight: 700,
            color: '#f8fafc',
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
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 10, paddingTop: 10, borderTop: '1px solid rgba(255, 255, 255, 0.06)' }}>
          <div>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#fbbf24', letterSpacing: '-0.02em' }}>
              ₹{Number(product.price).toLocaleString('en-IN')}
            </div>
            {originalPrice > product.price && (
              <div style={{ fontSize: '0.8rem', color: '#64748b', textDecoration: 'line-through' }}>
                ₹{Number(originalPrice).toLocaleString('en-IN')}
              </div>
            )}
          </div>

          <button
            onClick={handleAdd}
            disabled={adding}
            className={added ? 'btn-dark' : 'btn-gold'}
            style={{
              padding: '9px 14px',
              fontSize: '0.84rem',
              borderRadius: 12,
            }}
          >
            {added ? (
              <>
                <Check size={16} color="#10b981" />
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
