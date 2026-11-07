import React from 'react';
import { ShoppingBag, Shield } from 'lucide-react';

export default function Footer({ onNavigate }) {
  return (
    <footer style={{
      background: '#f8fafc',
      borderTop: '1px solid #e2e8f0',
      padding: '60px 20px 30px',
      marginTop: 80,
    }}>
      <div style={{
        maxWidth: 1280,
        margin: '0 auto',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: 40,
        marginBottom: 40,
      }}>
        {/* Brand Col */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
            <div style={{
              width: 38,
              height: 38,
              borderRadius: 10,
              background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              boxShadow: '0 4px 10px rgba(217, 119, 6, 0.25)'
            }}>
              <ShoppingBag size={20} strokeWidth={2.4} />
            </div>
            <span style={{ fontSize: '1.35rem', fontWeight: 800, color: '#0f172a' }}>
              Urban<span style={{ color: '#d97706' }}>Cart</span>
            </span>
          </div>
          <p style={{ fontSize: '0.86rem', color: '#64748b', lineHeight: 1.6 }}>
            Redefining modern luxury commerce with curated designer streetwear, premium sneakers, and high-performance audio electronics.
          </p>
        </div>

        {/* Quick Links */}
        <div>
          <h4 style={{ fontSize: '0.98rem', fontWeight: 800, color: '#0f172a', marginBottom: 16 }}>
            Collections
          </h4>
          <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 10, fontSize: '0.86rem', color: '#64748b' }}>
            <li onClick={() => onNavigate('home')} style={{ cursor: 'pointer' }}>Streetwear Hoodies & Drops</li>
            <li onClick={() => onNavigate('home')} style={{ cursor: 'pointer' }}>Luxury Sneakers & Runners</li>
            <li onClick={() => onNavigate('home')} style={{ cursor: 'pointer' }}>Studio Grade Headphones</li>
            <li onClick={() => onNavigate('home')} style={{ cursor: 'pointer' }}>Mechanical Keyboards</li>
          </ul>
        </div>

        {/* Customer Care */}
        <div>
          <h4 style={{ fontSize: '0.98rem', fontWeight: 800, color: '#0f172a', marginBottom: 16 }}>
            Customer Care
          </h4>
          <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 10, fontSize: '0.86rem', color: '#64748b' }}>
            <li onClick={() => onNavigate('dashboard')} style={{ cursor: 'pointer' }}>Track My Order</li>
            <li onClick={() => onNavigate('dashboard')} style={{ cursor: 'pointer' }}>7-Day Returns Policy</li>
            <li>Express Pan-India Shipping</li>
            <li>UrbanCoins VIP Rewards</li>
          </ul>
        </div>

        {/* Security */}
        <div>
          <h4 style={{ fontSize: '0.98rem', fontWeight: 800, color: '#0f172a', marginBottom: 16 }}>
            Payments & Security
          </h4>
          <p style={{ fontSize: '0.84rem', color: '#64748b', lineHeight: 1.6, marginBottom: 14 }}>
            Encrypted checkout with instant UPI, Visa, Mastercard, and Cash on Delivery.
          </p>
          <div className="badge-gold">
            <Shield size={13} />
            Verified Authentic Drops
          </div>
        </div>

      </div>

      <div style={{
        maxWidth: 1280,
        margin: '0 auto',
        paddingTop: 24,
        borderTop: '1px solid #e2e8f0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 12,
        fontSize: '0.82rem',
        color: '#94a3b8',
      }}>
        <div>© 2026 UrbanCart Technologies Inc. All rights reserved.</div>
        <div>
          Crafted with care & precision for high-fashion connoisseurs.
        </div>
      </div>
    </footer>
  );
}
