import React from 'react';
import { CheckCircle2, Package, ArrowRight, Home, FileText } from 'lucide-react';

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
        className="glass"
        style={{
          borderRadius: 28,
          padding: '48px 40px',
          textAlign: 'center',
          border: '1px solid rgba(245, 158, 11, 0.3)',
          background: 'linear-gradient(145deg, #0f172a 0%, #090d16 100%)',
          boxShadow: '0 25px 60px rgba(0,0,0,0.6)'
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
          boxShadow: '0 0 30px rgba(16, 185, 129, 0.4)'
        }}>
          <CheckCircle2 size={46} strokeWidth={2.5} />
        </div>

        <span className="badge-gold" style={{ marginBottom: 12 }}>
          Payment Confirmed
        </span>

        <h1 style={{ fontSize: '2.4rem', fontWeight: 800, color: '#f8fafc', marginBottom: 10 }}>
          Thank You For Your Order!
        </h1>

        <p style={{ fontSize: '0.96rem', color: '#94a3b8', maxWidth: 500, margin: '0 auto 28px' }}>
          Your order has been placed successfully and is being prepared for express delivery. We've sent a tax invoice to <strong style={{ color: '#f8fafc' }}>{order.email}</strong>.
        </p>

        {/* Invoice Summary Box */}
        <div style={{
          background: '#090d16',
          borderRadius: 20,
          padding: 24,
          border: '1px solid rgba(255, 255, 255, 0.08)',
          textAlign: 'left',
          marginBottom: 32,
        }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: 16,
            paddingBottom: 20,
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          }}>
            <div>
              <div style={{ fontSize: '0.78rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Order Number</div>
              <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#fbbf24' }}>#{order.id}</div>
            </div>

            <div>
              <div style={{ fontSize: '0.78rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Transaction ID</div>
              <div style={{ fontSize: '0.9rem', fontWeight: 600, color: '#f8fafc' }}>{order.transaction_id || 'PAY-INR-SUCCESS'}</div>
            </div>

            <div>
              <div style={{ fontSize: '0.78rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Payment Method</div>
              <div style={{ fontSize: '0.9rem', fontWeight: 600, color: '#f8fafc' }}>{order.payment_method} ({order.payment_status})</div>
            </div>

            <div>
              <div style={{ fontSize: '0.78rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Estimated Delivery</div>
              <div style={{ fontSize: '0.9rem', fontWeight: 600, color: '#10b981' }}>2 to 4 Business Days</div>
            </div>
          </div>

          {/* Delivery To */}
          <div style={{ paddingTop: 16 }}>
            <div style={{ fontSize: '0.78rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>
              Delivery Destination
            </div>
            <div style={{ fontSize: '0.92rem', color: '#f8fafc', fontWeight: 600 }}>
              {order.full_name}
            </div>
            <div style={{ fontSize: '0.86rem', color: '#94a3b8' }}>
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
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
          }}>
            <span style={{ fontSize: '1rem', fontWeight: 600, color: '#94a3b8' }}>Total Amount Paid</span>
            <span style={{ fontSize: '1.4rem', fontWeight: 800, color: '#fbbf24' }}>
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
            <Package size={18} color="#f59e0b" />
            View in Dashboard
          </button>
        </div>

      </div>
    </div>
  );
}
