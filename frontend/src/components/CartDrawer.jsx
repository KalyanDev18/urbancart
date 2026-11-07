import React from 'react';
import { X, Trash2, Plus, Minus, ShoppingBag, ArrowRight } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';

export default function CartDrawer({ onCheckout, onLogin }) {
  const { isCartOpen, setIsCartOpen, cartItems, cartCount, subtotal, shipping, grandTotal, updateQuantity, removeFromCart } = useCart();
  const { isAuthenticated } = useAuth();

  if (!isCartOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      zIndex: 999,
      display: 'flex',
      justifyContent: 'flex-end',
    }}>
      {/* Backdrop */}
      <div 
        onClick={() => setIsCartOpen(false)}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: 'rgba(0, 0, 0, 0.65)',
          backdropFilter: 'blur(4px)',
        }}
      />

      {/* Drawer Container */}
      <div 
        className="glass animate-fade-in"
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: 440,
          height: '100%',
          background: '#0d1322',
          borderLeft: '1px solid rgba(255, 255, 255, 0.1)',
          display: 'flex',
          flexDirection: 'column',
          zIndex: 1000,
          boxShadow: '-10px 0 40px rgba(0, 0, 0, 0.6)'
        }}
      >
        {/* Header */}
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <ShoppingBag size={20} color="#f59e0b" />
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#f8fafc' }}>
              Your Bag ({cartCount})
            </h3>
          </div>
          <button
            onClick={() => setIsCartOpen(false)}
            style={{
              background: '#1e293b',
              border: 'none',
              borderRadius: '50%',
              width: 32,
              height: 32,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#94a3b8',
              cursor: 'pointer',
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Cart Items List */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 24px' }}>
          {cartItems.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px' }}>
              <div style={{
                width: 64,
                height: 64,
                borderRadius: '50%',
                background: '#1e293b',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px',
                color: '#64748b'
              }}>
                <ShoppingBag size={32} />
              </div>
              <h4 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#f8fafc', marginBottom: 6 }}>
                Your cart is empty
              </h4>
              <p style={{ fontSize: '0.85rem', color: '#94a3b8' }}>
                Explore our catalog to find exclusive streetwear, footwear, and tech accessories.
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {cartItems.map((item) => (
                <div
                  key={item.id}
                  style={{
                    display: 'flex',
                    gap: 14,
                    padding: 12,
                    borderRadius: 16,
                    background: '#131b2e',
                    border: '1px solid rgba(255, 255, 255, 0.05)',
                  }}
                >
                  <img
                    src={item.product_details?.image_url || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=200'}
                    alt={item.product_details?.name}
                    style={{
                      width: 72,
                      height: 72,
                      borderRadius: 12,
                      objectFit: 'cover',
                      background: '#090d16',
                    }}
                  />
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <h4 style={{ fontSize: '0.92rem', fontWeight: 700, color: '#f8fafc', lineHeight: 1.25, maxWidth: 190 }}>
                          {item.product_details?.name}
                        </h4>
                        <button
                          onClick={() => removeFromCart(item.id)}
                          style={{ background: 'none', color: '#ef4444', padding: 2, cursor: 'pointer' }}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                      <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#fbbf24', marginTop: 4 }}>
                        ₹{Number(item.product_details?.price || 0).toLocaleString('en-IN')}
                      </div>
                    </div>

                    {/* Quantity Controls */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 8 }}>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        background: '#090d16',
                        borderRadius: 8,
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                      }}>
                        <button
                          onClick={() => updateQuantity(item.id, -1)}
                          style={{ background: 'none', color: '#94a3b8', padding: '4px 8px' }}
                        >
                          <Minus size={13} />
                        </button>
                        <span style={{ fontSize: '0.85rem', fontWeight: 700, padding: '0 6px', color: '#f8fafc' }}>
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.id, 1)}
                          style={{ background: 'none', color: '#94a3b8', padding: '4px 8px' }}
                        >
                          <Plus size={13} />
                        </button>
                      </div>
                    </div>

                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer Summary & Checkout Button */}
        {cartItems.length > 0 && (
          <div style={{
            padding: '20px 24px',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            background: '#090d16',
          }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem', color: '#94a3b8' }}>
                <span>Subtotal</span>
                <span style={{ color: '#f8fafc', fontWeight: 600 }}>₹{Number(subtotal).toLocaleString('en-IN')}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem', color: '#94a3b8' }}>
                <span>Shipping</span>
                <span style={{ color: '#f8fafc', fontWeight: 600 }}>₹{Number(shipping).toLocaleString('en-IN')}</span>
              </div>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '1.15rem',
                fontWeight: 800,
                color: '#fbbf24',
                paddingTop: 8,
                borderTop: '1px solid rgba(255, 255, 255, 0.08)'
              }}>
                <span>Total</span>
                <span>₹{Number(grandTotal).toLocaleString('en-IN')}</span>
              </div>
            </div>

            {isAuthenticated ? (
              <button
                onClick={() => {
                  setIsCartOpen(false);
                  if (onCheckout) onCheckout();
                }}
                className="btn-gold"
                style={{ width: '100%', padding: '14px 20px', fontSize: '1rem' }}
              >
                Proceed to Checkout
                <ArrowRight size={18} />
              </button>
            ) : (
              <button
                onClick={() => {
                  setIsCartOpen(false);
                  if (onLogin) onLogin();
                }}
                className="btn-gold"
                style={{ width: '100%', padding: '14px 20px', fontSize: '1rem' }}
              >
                Sign In to Checkout
                <ArrowRight size={18} />
              </button>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
