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
          background: 'rgba(15, 23, 42, 0.45)',
          backdropFilter: 'blur(4px)',
        }}
      />

      {/* Drawer Container */}
      <div 
        className="animate-fade-in"
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: 440,
          height: '100%',
          background: '#ffffff',
          borderLeft: '1px solid #e2e8f0',
          display: 'flex',
          flexDirection: 'column',
          zIndex: 1000,
          boxShadow: '-10px 0 40px rgba(15, 23, 42, 0.15)'
        }}
      >
        {/* Header */}
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid #e2e8f0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <ShoppingBag size={20} color="#d97706" />
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>
              Your Bag ({cartCount})
            </h3>
          </div>
          <button
            onClick={() => setIsCartOpen(false)}
            style={{
              background: '#f1f5f9',
              border: 'none',
              borderRadius: '50%',
              width: 32,
              height: 32,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#64748b',
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
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px',
                color: '#94a3b8'
              }}>
                <ShoppingBag size={32} />
              </div>
              <h4 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#0f172a', marginBottom: 6 }}>
                Your cart is empty
              </h4>
              <p style={{ fontSize: '0.86rem', color: '#64748b' }}>
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
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
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
                      background: '#ffffff',
                      border: '1px solid #e2e8f0'
                    }}
                  />
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <h4 style={{ fontSize: '0.94rem', fontWeight: 700, color: '#0f172a', lineHeight: 1.25, maxWidth: 190 }}>
                          {item.product_details?.name}
                        </h4>
                        <button
                          onClick={() => removeFromCart(item.id)}
                          style={{ background: 'none', color: '#ef4444', padding: 2, cursor: 'pointer' }}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                      <div style={{ fontSize: '0.94rem', fontWeight: 800, color: '#b45309', marginTop: 4 }}>
                        ₹{Number(item.product_details?.price || 0).toLocaleString('en-IN')}
                      </div>
                    </div>

                    {/* Quantity Controls */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 8 }}>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        background: '#ffffff',
                        borderRadius: 8,
                        border: '1px solid #cbd5e1',
                      }}>
                        <button
                          onClick={() => updateQuantity(item.id, -1)}
                          style={{ background: 'none', color: '#64748b', padding: '4px 8px' }}
                        >
                          <Minus size={13} />
                        </button>
                        <span style={{ fontSize: '0.85rem', fontWeight: 700, padding: '0 6px', color: '#0f172a' }}>
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.id, 1)}
                          style={{ background: 'none', color: '#64748b', padding: '4px 8px' }}
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
            borderTop: '1px solid #e2e8f0',
            background: '#f8fafc',
          }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem', color: '#64748b' }}>
                <span>Subtotal</span>
                <span style={{ color: '#0f172a', fontWeight: 700 }}>₹{Number(subtotal).toLocaleString('en-IN')}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem', color: '#64748b' }}>
                <span>Express Delivery</span>
                <span style={{ color: '#0f172a', fontWeight: 700 }}>₹{Number(shipping).toLocaleString('en-IN')}</span>
              </div>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '1.25rem',
                fontWeight: 800,
                color: '#b45309',
                paddingTop: 8,
                borderTop: '1px solid #e2e8f0'
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
