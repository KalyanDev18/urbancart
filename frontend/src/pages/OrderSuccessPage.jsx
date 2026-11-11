import React from 'react';
import { CheckCircle2, Package, ArrowRight, Home } from 'lucide-react';

export default function OrderSuccessPage({ order, onContinueShopping, onViewOrders }) {
  if (!order) {
    return (
      <div style={{ textAlign: 'center', padding: '100px 20px' }}>
        <h2>Order Not Found</h2>
        <button onClick={onContinueShopping} className="btn-gold" style={{ marginTop: 20 }}>
          Go to Home
        </button>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 760, margin: '50px auto', padding: '0 20px' }}>
      <div 
        style={{
          borderRadius: 28,
          padding: '48px 40px',
          textAlign: 'center',
          border: '1px solid var(--border-subtle)',
          background: 'var(--bg-card)',
          boxShadow: '0 20px 50px rgba(15, 23, 42, 0.08)'
        }}
      >
        {/* Animated Check Circle */}
        <div style={{
          width: 80,
          height: 80,
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#ffffff',
          margin: '0 auto 20px',
          boxShadow: '0 8px 24px rgba(16, 185, 129, 0.3)'
        }}>
          <CheckCircle2 size={46} strokeWidth={2.5} />
        </div>

        <span className="badge-gold" style={{ marginBottom: 12 }}>
          Payment Confirmed
        </span>

        <h1 style={{ fontSize: '2.3rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: 10 }}>
          Thank You For Your Order!
        </h1>

        <p style={{ fontSize: '0.96rem', color: 'var(--text-dim)', maxWidth: 500, margin: '0 auto 28px' }}>
          Your order has been placed successfully and is being prepared for express delivery. We've sent a tax invoice to <strong style={{ color: 'var(--text-main)' }}>{order.email}</strong>.
        </p>

        {/* Invoice Summary Box */}
        <div style={{
          background: 'var(--bg-surface)',
          borderRadius: 20,
          padding: 24,
          border: '1px solid var(--border-subtle)',
          textAlign: 'left',
          marginBottom: 32,
        }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: 16,
            paddingBottom: 20,
            borderBottom: '1px solid var(--border-subtle)',
          }}>
            <div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Order Number</div>
              <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--price-color)' }}>#{order.id}</div>
            </div>

            <div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Transaction ID</div>
              <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-main)' }}>{order.transaction_id || 'PAY-INR-SUCCESS'}</div>
            </div>

            <div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Payment Method</div>
              <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-main)' }}>{order.payment_method} ({order.payment_status})</div>
            </div>

            <div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Estimated Delivery</div>
              <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#059669' }}>2 to 4 Business Days</div>
            </div>
          </div>

          {/* Delivery Destination */}
          <div style={{ paddingTop: 16 }}>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>
              Delivery Destination
            </div>
            <div style={{ fontSize: '0.95rem', color: 'var(--text-main)', fontWeight: 700 }}>
              {order.full_name}
            </div>
            <div style={{ fontSize: '0.88rem', color: 'var(--text-dim)' }}>
              {order.address}, {order.city} - {order.postal_code}
            </div>
          </div>

          {/* Total Amount Paid */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginTop: 20,
            paddingTop: 16,
            borderTop: '1px solid var(--border-subtle)',
          }}>
            <span style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-dim)' }}>Total Amount Paid</span>
            <span style={{ fontSize: '1.45rem', fontWeight: 800, color: 'var(--price-color)' }}>
              ₹{Number(order.total_amount).toLocaleString('en-IN')}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16, flexWrap: 'wrap' }}>
          <button
            onClick={onContinueShopping}
            className="btn-gold"
            style={{ padding: '14px 28px', fontSize: '0.95rem' }}
          >
            <Home size={18} />
            Continue Shopping
          </button>

          <button
            onClick={onViewOrders}
            className="btn-dark"
            style={{ padding: '14px 24px', fontSize: '0.95rem' }}
          >
            <Package size={18} color="#d97706" />
            View in Dashboard
          </button>
        </div>

      </div>
    </div>
  );
}
