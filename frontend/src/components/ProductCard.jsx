import React, { useState, memo } from 'react';
import { ShoppingBag, Star, Check } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { optimizeImageUrl } from '../api/client';

function ProductCard({ product, onRequireAuth, onSelectProduct }) {
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

  const discount = Number(product.discount_percent || 0);
  const originalPrice = Number(product.original_price || product.compare_at_price || 0);
  const reviewCount = Number(product.review_count || 0);
  const ratingVal = Number(product.rating || 0);

  return (
    <div
      className="product-card"
      onClick={() => onSelectProduct && onSelectProduct(product)}
      style={{ cursor: onSelectProduct ? 'pointer' : 'default' }}
    >
      {/* Discount Pill (only when real compare_at_price > price) */}
      {discount > 0 && originalPrice > Number(product.price) && (
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
        background: 'var(--bg-surface)',
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
      <div className="product-card-body">
        <div style={{ minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4, gap: 6 }}>
            <span className="product-card-cat">
              {product.category}
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 3, background: 'var(--badge-bg)', border: '1px solid var(--badge-border)', padding: '2px 6px', borderRadius: 6, flexShrink: 0 }}>
              <Star size={11} fill={reviewCount > 0 ? '#d97706' : 'none'} color="#d97706" />
              <span style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--badge-text)' }}>
                {reviewCount > 0 ? `${ratingVal.toFixed(1)} (${reviewCount})` : 'Review'}
              </span>
            </div>
          </div>

          <h3 style={{
            fontSize: 'clamp(0.84rem, 2.4vw, 0.96rem)',
            fontWeight: 700,
            color: 'var(--text-main)',
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
        <div className="product-card-footer">
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 'clamp(0.95rem, 2.8vw, 1.18rem)', fontWeight: 800, color: 'var(--price-color)', letterSpacing: '-0.02em', lineHeight: 1.1 }}>
              ₹{Number(product.price).toLocaleString('en-IN')}
            </div>
            {originalPrice > Number(product.price) && (
              <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', textDecoration: 'line-through' }}>
                ₹{Number(originalPrice).toLocaleString('en-IN')}
              </div>
            )}
          </div>

          <button
            onClick={handleAdd}
            disabled={adding}
            className={added ? 'btn-dark' : 'btn-gold'}
            style={{
              padding: '6px 11px',
              fontSize: '0.76rem',
              borderRadius: 10,
              flexShrink: 0,
            }}
          >
            {added ? (
              <>
                <Check size={13} color="#059669" />
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

