import React, { useState, memo } from 'react';
import { ShoppingBag, Star, Check } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { optimizeImageUrl } from '../api/client';

function ProductCard({ product, onRequireAuth }) {
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
    <div className="product-card">
      {/* Discount Pill */}
      {discount > 0 && (
        <div style={{
          position: 'absolute',
          top: 10,
          left: 10,
          zIndex: 10,
          background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
          color: '#ffffff',
          fontWeight: 800,
          fontSize: '0.68rem',
          padding: '3px 8px',
          borderRadius: 9999,
          boxShadow: '0 2px 8px rgba(217, 119, 6, 0.25)',
          letterSpacing: '0.04em'
        }}>
          {discount}% OFF
        </div>
      )}

      {/* Image Area */}
      <div style={{
        position: 'relative',
        width: '100%',
        paddingTop: '92%',
        background: '#f8fafc',
        overflow: 'hidden',
      }}>
        <img
          src={optimizeImageUrl(product.image_url, 420)}
          alt={product.name}
          loading="lazy"
          decoding="async"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
          }}
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = optimizeImageUrl('', 420);
          }}
        />
      </div>

      {/* Product Details */}
      <div style={{ padding: 'clamp(10px, 2.5vw, 16px)', display: 'flex', flexDirection: 'column', gap: 8, flex: 1, justifyContent: 'space-between' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
            <span style={{ fontSize: '0.7rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 700 }}>
              {product.category}
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 3, background: '#fef3c7', padding: '2px 6px', borderRadius: 6 }}>
              <Star size={11} fill="#d97706" color="#d97706" />
              <span style={{ fontSize: '0.74rem', fontWeight: 800, color: '#92400e' }}>
                {product.rating || '4.8'}
              </span>
            </div>
          </div>

          <h3 style={{
            fontSize: 'clamp(0.85rem, 2.4vw, 0.98rem)',
            fontWeight: 700,
            color: '#0f172a',
            lineHeight: 1.3,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}>
            {product.name}
          </h3>
        </div>

        {/* Pricing & Add to Cart button */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 8, paddingTop: 8, borderTop: '1px solid #f1f5f9', gap: 6 }}>
          <div>
            <div style={{ fontSize: 'clamp(0.95rem, 2.8vw, 1.2rem)', fontWeight: 800, color: '#b45309', letterSpacing: '-0.02em', lineHeight: 1.1 }}>
              ₹{Number(product.price).toLocaleString('en-IN')}
            </div>
            {originalPrice > product.price && (
              <div style={{ fontSize: '0.74rem', color: '#94a3b8', textDecoration: 'line-through' }}>
                ₹{Number(originalPrice).toLocaleString('en-IN')}
              </div>
            )}
          </div>

          <button
            onClick={handleAdd}
            disabled={adding}
            className={added ? 'btn-dark' : 'btn-gold'}
            style={{
              padding: '6px 12px',
              fontSize: '0.78rem',
              borderRadius: 10,
              flexShrink: 0,
            }}
          >
            {added ? (
              <>
                <Check size={14} color="#059669" />
                Done
              </>
            ) : (
              <>
                <ShoppingBag size={13} />
                Add
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
}

export default memo(ProductCard);

