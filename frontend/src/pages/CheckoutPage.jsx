import React, { useState, useEffect } from 'react';
import { CreditCard, QrCode, Truck, ShieldCheck, ArrowRight } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';

export default function CheckoutPage({ onOrderSuccess, onBackToCart }) {
  const { cartItems, subtotal, shipping, grandTotal } = useCart();
  const { user } = useAuth();

  const [fullName, setFullName] = useState(user ? `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.username : '');
  const [email, setEmail] = useState(user?.email || '');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('CARD');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Sync user profile when user state changes / finishes loading
  useEffect(() => {
    if (user) {
      if (!fullName) {
        setFullName(`${user.first_name || ''} ${user.last_name || ''}`.trim() || user.username || '');
      }
      if (!email && user.email) {
        setEmail(user.email);
      }
    }
  }, [user]);

  // Fetch saved addresses if available
  useEffect(() => {
    api.getAddresses()
      .then((res) => {
        const defaultAddr = (res.addresses || []).find((a) => a.is_default) || (res.addresses || [])[0];
        if (defaultAddr) {
          if (!fullName) setFullName(defaultAddr.full_name);
          if (!address) setAddress(defaultAddr.street_address);
          if (!city) setCity(defaultAddr.city);
          if (!postalCode) setPostalCode(defaultAddr.postal_code);
        }
      })
      .catch(() => {});
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!fullName || !email || !address || !city || !postalCode) {
      setError('Please fill in all contact and shipping address details.');
      return;
    }
    setError('');
    setLoading(true);

    try {
      const res = await api.checkout({
        full_name: fullName,
        email,
        address,
        city,
        postal_code: postalCode,
        payment_method: paymentMethod,
      });

      if (res && res.order) {
        if (onOrderSuccess) {
          onOrderSuccess(res.order);
        }
      }
    } catch (err) {
      setError(err.message || 'Payment processing failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 1100, margin: 'clamp(18px, 4vw, 40px) auto', padding: '0 14px' }}>
      
      {/* Title */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 'clamp(1.5rem, 4vw, 2.1rem)', fontWeight: 800, color: 'var(--text-main)' }}>
          Secure Checkout
        </h1>
        <p style={{ fontSize: '0.88rem', color: 'var(--text-dim)' }}>
          Complete your delivery details and choose a payment method
        </p>
      </div>

      {error && (
        <div style={{
          background: 'rgba(239, 68, 68, 0.1)',
          border: '1px solid rgba(239, 68, 68, 0.35)',
          color: '#ef4444',
          padding: '14px 18px',
          borderRadius: 14,
          marginBottom: 24,
          fontWeight: 500,
        }}>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 300px), 1fr))',
          gap: 24,
        }}>
          
          {/* Left: Shipping & Payment Details */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            
            {/* 1. Contact & Address */}
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', boxShadow: '0 4px 20px rgba(15, 23, 42, 0.06)', padding: 'clamp(16px, 4vw, 28px)', borderRadius: 24 }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: 18 }}>
                1. Shipping Address
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.86rem', color: 'var(--text-muted)', fontWeight: 700, marginBottom: 6 }}>
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Aryan Sharma"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    style={{
                      width: '100%',
                      background: 'var(--bg-surface)',
                      border: '1px solid var(--border-strong)',
                      borderRadius: 12,
                      padding: '12px 14px',
                      color: 'var(--text-main)',
                      fontSize: '0.92rem',
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.86rem', color: 'var(--text-muted)', fontWeight: 700, marginBottom: 6 }}>
                    Email Address (for Invoice & Tracking) *
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="aryan@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    style={{
                      width: '100%',
                      background: 'var(--bg-surface)',
                      border: '1px solid var(--border-strong)',
                      borderRadius: 12,
                      padding: '12px 14px',
                      color: 'var(--text-main)',
                      fontSize: '0.92rem',
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.86rem', color: 'var(--text-muted)', fontWeight: 700, marginBottom: 6 }}>
                    Street Address & House / Flat No. *
                  </label>
                  <textarea
                    rows={2}
                    required
                    placeholder="e.g. Flat 402, Royal Palms, MG Road"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    style={{
                      width: '100%',
                      background: 'var(--bg-surface)',
                      border: '1px solid var(--border-strong)',
                      borderRadius: 12,
                      padding: '12px 14px',
                      color: 'var(--text-main)',
                      fontSize: '0.92rem',
                      fontFamily: 'inherit',
                      resize: 'none',
                    }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 14 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.86rem', color: 'var(--text-muted)', fontWeight: 700, marginBottom: 6 }}>
                      City *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Mumbai"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      style={{
                        width: '100%',
                        background: 'var(--bg-surface)',
                        border: '1px solid var(--border-strong)',
                        borderRadius: 12,
                        padding: '12px 14px',
                        color: 'var(--text-main)',
                        fontSize: '0.92rem',
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.86rem', color: 'var(--text-muted)', fontWeight: 700, marginBottom: 6 }}>
                      Postal Code / PIN *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 400001"
                      value={postalCode}
                      onChange={(e) => setPostalCode(e.target.value)}
                      style={{
                        width: '100%',
                        background: 'var(--bg-surface)',
                        border: '1px solid var(--border-strong)',
                        borderRadius: 12,
                        padding: '12px 14px',
                        color: 'var(--text-main)',
                        fontSize: '0.92rem',
                      }}
                    />
                  </div>
                </div>

              </div>
            </div>

            {/* 2. Payment Method */}
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', boxShadow: '0 4px 20px rgba(15, 23, 42, 0.06)', padding: 'clamp(16px, 4vw, 28px)', borderRadius: 24 }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: 18 }}>
                2. Payment Method
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                
                {/* Credit / Debit Card */}
                <label 
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 14,
                    padding: 16,
                    borderRadius: 14,
                    background: paymentMethod === 'CARD' ? 'var(--badge-bg)' : 'var(--bg-surface)',
                    border: paymentMethod === 'CARD' ? '2px solid #d97706' : '1px solid var(--border-strong)',
                    cursor: 'pointer',
                  }}
                >
                  <input
                    type="radio"
                    name="payment_method"
                    value="CARD"
                    checked={paymentMethod === 'CARD'}
                    onChange={() => setPaymentMethod('CARD')}
                    style={{ accentColor: '#d97706' }}
                  />
                  <CreditCard size={22} color="#d97706" />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '0.94rem', fontWeight: 700, color: 'var(--text-main)' }}>
                      Credit / Debit Card (Instant Simulation)
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>
                      Visa, Mastercard, RuPay & Amex accepted
                    </div>
                  </div>
                </label>

                {/* UPI */}
                <label 
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 14,
                    padding: 16,
                    borderRadius: 14,
                    background: paymentMethod === 'UPI' ? 'var(--badge-bg)' : 'var(--bg-surface)',
                    border: paymentMethod === 'UPI' ? '2px solid #d97706' : '1px solid var(--border-strong)',
                    cursor: 'pointer',
                  }}
                >
                  <input
                    type="radio"
                    name="payment_method"
                    value="UPI"
                    checked={paymentMethod === 'UPI'}
                    onChange={() => setPaymentMethod('UPI')}
                    style={{ accentColor: '#d97706' }}
                  />
                  <QrCode size={22} color="#d97706" />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '0.94rem', fontWeight: 700, color: 'var(--text-main)' }}>
                      UPI Payment (GPay / PhonePe / Paytm)
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>
                      Zero transaction fee with instant confirmation
                    </div>
                  </div>
                </label>

                {/* COD */}
                <label 
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 14,
                    padding: 16,
                    borderRadius: 14,
                    background: paymentMethod === 'COD' ? 'var(--badge-bg)' : 'var(--bg-surface)',
                    border: paymentMethod === 'COD' ? '2px solid #d97706' : '1px solid var(--border-strong)',
                    cursor: 'pointer',
                  }}
                >
                  <input
                    type="radio"
                    name="payment_method"
                    value="COD"
                    checked={paymentMethod === 'COD'}
                    onChange={() => setPaymentMethod('COD')}
                    style={{ accentColor: '#d97706' }}
                  />
                  <Truck size={22} color="#d97706" />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '0.94rem', fontWeight: 700, color: 'var(--text-main)' }}>
                      Cash on Delivery (COD)
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>
                      Pay at doorstep upon delivery
                    </div>
                  </div>
                </label>

              </div>
            </div>

          </div>

          {/* Right: Order Summary */}
          <div>
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', boxShadow: '0 4px 20px rgba(15, 23, 42, 0.06)', padding: 'clamp(16px, 4vw, 28px)', borderRadius: 24, position: 'sticky', top: 90 }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: 18 }}>
                Order Summary
              </h3>

              {/* Items List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14, maxHeight: 240, overflowY: 'auto', marginBottom: 20 }}>
                {cartItems.map((item) => (
                  <div key={item.id} style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                    <img
                      src={item.product_details?.image_url}
                      alt={item.product_details?.name}
                      style={{ width: 48, height: 48, borderRadius: 8, objectFit: 'cover', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}
                    />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-main)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {item.product_details?.name}
                      </div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>
                        Qty: {item.quantity} × ₹{Number(item.product_details?.price || 0).toLocaleString('en-IN')}
                      </div>
                    </div>
                    <div style={{ fontSize: '0.92rem', fontWeight: 800, color: 'var(--price-color)' }}>
                      ₹{Number(item.total_price || 0).toLocaleString('en-IN')}
                    </div>
                  </div>
                ))}
              </div>

              {/* Price Calculation */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, paddingTop: 16, borderTop: '1px solid var(--border-subtle)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem', color: 'var(--text-dim)' }}>
                  <span>Items Subtotal</span>
                  <span style={{ color: 'var(--text-main)', fontWeight: 700 }}>₹{Number(subtotal).toLocaleString('en-IN')}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem', color: 'var(--text-dim)' }}>
                  <span>Express Delivery</span>
                  <span style={{ color: 'var(--text-main)', fontWeight: 700 }}>₹{Number(shipping).toLocaleString('en-IN')}</span>
                </div>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: '1.3rem',
                  fontWeight: 800,
                  color: 'var(--price-color)',
                  paddingTop: 12,
                  marginTop: 4,
                  borderTop: '1px solid var(--border-subtle)'
                }}>
                  <span>Total Amount</span>
                  <span>₹{Number(grandTotal).toLocaleString('en-IN')}</span>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-gold"
                style={{ width: '100%', padding: '16px', fontSize: '1rem', marginTop: 24 }}
              >
                {loading ? 'Processing Payment...' : `Place Order (₹${Number(grandTotal).toLocaleString('en-IN')})`}
                <ArrowRight size={18} />
              </button>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 16, color: 'var(--text-dim)', fontSize: '0.8rem' }}>
                <ShieldCheck size={16} color="#059669" />
                Guaranteed safe & secure checkout
              </div>

            </div>
          </div>

        </div>
      </form>
    </div>
  );
}
