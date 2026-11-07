import React, { useState, useEffect } from 'react';
import { CreditCard, QrCode, Truck, ShieldCheck, ArrowRight, CheckCircle2 } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';

export default function CheckoutPage({ onOrderSuccess, onBackToCart }) {
  const { cartItems, subtotal, shipping, grandTotal, clearCart } = useCart();
  const { user } = useAuth();

  const [fullName, setFullName] = useState(user ? `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.username : '');
  const [email, setEmail] = useState(user?.email || '');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('CARD');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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
    <div style={{ maxWidth: 1100, margin: '40px auto', padding: '0 20px' }}>
      
      {/* Title */}
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 800, color: '#f8fafc' }}>
          Secure Checkout
        </h1>
        <p style={{ fontSize: '0.88rem', color: '#94a3b8' }}>
          Complete your delivery details and choose a payment method
        </p>
      </div>

      {error && (
        <div style={{
          background: 'rgba(239, 68, 68, 0.15)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          color: '#fca5a5',
          padding: '14px 18px',
          borderRadius: 14,
          marginBottom: 24,
        }}>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: 32,
        }}>
          
          {/* Left: Shipping & Payment Details */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            
            {/* 1. Contact & Address */}
            <div className="glass" style={{ padding: 28, borderRadius: 24 }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#f8fafc', marginBottom: 20 }}>
                1. Shipping Address
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.84rem', color: '#cbd5e1', fontWeight: 600, marginBottom: 6 }}>
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
                      background: '#090d16',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: 12,
                      padding: '12px 14px',
                      color: '#f8fafc',
                      fontSize: '0.92rem',
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.84rem', color: '#cbd5e1', fontWeight: 600, marginBottom: 6 }}>
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
                      background: '#090d16',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: 12,
                      padding: '12px 14px',
                      color: '#f8fafc',
                      fontSize: '0.92rem',
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.84rem', color: '#cbd5e1', fontWeight: 600, marginBottom: 6 }}>
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
                      background: '#090d16',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: 12,
                      padding: '12px 14px',
                      color: '#f8fafc',
                      fontSize: '0.92rem',
                      fontFamily: 'inherit',
                      resize: 'none',
                    }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.84rem', color: '#cbd5e1', fontWeight: 600, marginBottom: 6 }}>
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
                        background: '#090d16',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: 12,
                        padding: '12px 14px',
                        color: '#f8fafc',
                        fontSize: '0.92rem',
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.84rem', color: '#cbd5e1', fontWeight: 600, marginBottom: 6 }}>
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
                        background: '#090d16',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: 12,
                        padding: '12px 14px',
                        color: '#f8fafc',
                        fontSize: '0.92rem',
                      }}
                    />
                  </div>
                </div>

              </div>
            </div>

            {/* 2. Payment Method */}
            <div className="glass" style={{ padding: 28, borderRadius: 24 }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#f8fafc', marginBottom: 20 }}>
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
                    background: paymentMethod === 'CARD' ? 'rgba(245, 158, 11, 0.1)' : '#090d16',
                    border: paymentMethod === 'CARD' ? '1px solid #f59e0b' : '1px solid rgba(255, 255, 255, 0.08)',
                    cursor: 'pointer',
                  }}
                >
                  <input
                    type="radio"
                    name="payment_method"
                    value="CARD"
                    checked={paymentMethod === 'CARD'}
                    onChange={() => setPaymentMethod('CARD')}
                    style={{ accentColor: '#f59e0b' }}
                  />
                  <CreditCard size={20} color="#f59e0b" />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '0.92rem', fontWeight: 700, color: '#f8fafc' }}>
                      Credit / Debit Card (Instant Simulation)
                    </div>
                    <div style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
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
                    background: paymentMethod === 'UPI' ? 'rgba(245, 158, 11, 0.1)' : '#090d16',
                    border: paymentMethod === 'UPI' ? '1px solid #f59e0b' : '1px solid rgba(255, 255, 255, 0.08)',
                    cursor: 'pointer',
                  }}
                >
                  <input
                    type="radio"
                    name="payment_method"
                    value="UPI"
                    checked={paymentMethod === 'UPI'}
                    onChange={() => setPaymentMethod('UPI')}
                    style={{ accentColor: '#f59e0b' }}
                  />
                  <QrCode size={20} color="#f59e0b" />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '0.92rem', fontWeight: 700, color: '#f8fafc' }}>
                      UPI Payment (GPay / PhonePe / Paytm)
                    </div>
                    <div style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
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
                    background: paymentMethod === 'COD' ? 'rgba(245, 158, 11, 0.1)' : '#090d16',
                    border: paymentMethod === 'COD' ? '1px solid #f59e0b' : '1px solid rgba(255, 255, 255, 0.08)',
                    cursor: 'pointer',
                  }}
                >
                  <input
                    type="radio"
                    name="payment_method"
                    value="COD"
                    checked={paymentMethod === 'COD'}
                    onChange={() => setPaymentMethod('COD')}
                    style={{ accentColor: '#f59e0b' }}
                  />
                  <Truck size={20} color="#f59e0b" />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '0.92rem', fontWeight: 700, color: '#f8fafc' }}>
                      Cash on Delivery (COD)
                    </div>
                    <div style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
                      Pay at doorstep upon delivery
                    </div>
                  </div>
                </label>

              </div>
            </div>

          </div>

          {/* Right: Order Summary */}
          <div>
            <div className="glass" style={{ padding: 28, borderRadius: 24, position: 'sticky', top: 90 }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#f8fafc', marginBottom: 20 }}>
                Order Summary
              </h3>

              {/* Items List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14, maxHeight: 240, overflowY: 'auto', marginBottom: 20 }}>
                {cartItems.map((item) => (
                  <div key={item.id} style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                    <img
                      src={item.product_details?.image_url}
                      alt={item.product_details?.name}
                      style={{ width: 48, height: 48, borderRadius: 8, objectFit: 'cover', background: '#090d16' }}
                    />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#f8fafc', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {item.product_details?.name}
                      </div>
                      <div style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
                        Qty: {item.quantity} × ₹{Number(item.product_details?.price || 0).toLocaleString('en-IN')}
                      </div>
                    </div>
                    <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#fbbf24' }}>
                      ₹{Number(item.total_price || 0).toLocaleString('en-IN')}
                    </div>
                  </div>
                ))}
              </div>

              {/* Price Calculation */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, paddingTop: 16, borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem', color: '#94a3b8' }}>
                  <span>Items Subtotal</span>
                  <span style={{ color: '#f8fafc', fontWeight: 600 }}>₹{Number(subtotal).toLocaleString('en-IN')}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem', color: '#94a3b8' }}>
                  <span>Express Delivery</span>
                  <span style={{ color: '#f8fafc', fontWeight: 600 }}>₹{Number(shipping).toLocaleString('en-IN')}</span>
                </div>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: '1.25rem',
                  fontWeight: 800,
                  color: '#fbbf24',
                  paddingTop: 12,
                  marginTop: 4,
                  borderTop: '1px solid rgba(255, 255, 255, 0.1)'
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

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 16, color: '#64748b', fontSize: '0.78rem' }}>
                <ShieldCheck size={14} color="#10b981" />
                Guaranteed safe & secure checkout
              </div>

            </div>
          </div>

        </div>
      </form>
    </div>
  );
}
