import React from 'react';
import { ShoppingBag, Heart, Shield, Sparkles } from 'lucide-react';

export default function Footer({ onNavigate }) {
  return (
    <footer style={{
      background: '#070b12',
      borderTop: '1px solid rgba(255, 255, 255, 0.08)',
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
              width: 36,
              height: 36,
              borderRadius: 10,
              background: '#f59e0b',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#090d16',
            }}>
              <ShoppingBag size={20} strokeWidth={2.4} />
            </div>
            <span style={{ fontSize: '1.3rem', fontWeight: 800, color: '#f8fafc' }}>
              Urban<span style={{ color: '#f59e0b' }}>Cart</span>
            </span>
          </div>
          <p style={{ fontSize: '0.86rem', color: '#94a3b8', lineHeight: 1.6 }}>
            Redefining modern luxury commerce with curated designer streetwear, premium sneakers, and high-performance audio electronics.
          </p>
        </div>

        {/* Quick Links */}
        <div>
          <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#f8fafc', marginBottom: 16 }}>
            Collections
          </h4>
          <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 10, fontSize: '0.86rem', color: '#94a3b8' }}>
            <li onClick={() => onNavigate('home')} style={{ cursor: 'pointer' }}>Streetwear Hoodies & Drops</li>
            <li onClick={() => onNavigate('home')} style={{ cursor: 'pointer' }}>Luxury Sneakers & Runners</li>
            <li onClick={() => onNavigate('home')} style={{ cursor: 'pointer' }}>Studio Grade Headphones</li>
            <li onClick={() => onNavigate('home')} style={{ cursor: 'pointer' }}>Mechanical Keyboards</li>
          </ul>
        </div>

        {/* Customer Care */}
        <div>
          <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#f8fafc', marginBottom: 16 }}>
            Customer Care
          </h4>
          <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 10, fontSize: '0.86rem', color: '#94a3b8' }}>
            <li onClick={() => onNavigate('dashboard')} style={{ cursor: 'pointer' }}>Track My Order</li>
            <li onClick={() => onNavigate('dashboard')} style={{ cursor: 'pointer' }}>7-Day Returns Policy</li>
            <li>Express Pan-India Shipping</li>
            <li>UrbanCoins VIP Rewards</li>
          </ul>
        </div>

        {/* Security */}
        <div>
          <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#f8fafc', marginBottom: 16 }}>
            Payments & Security
          </h4>
          <p style={{ fontSize: '0.84rem', color: '#94a3b8', lineHeight: 1.6, marginBottom: 12 }}>
            Encrypted checkout with instant UPI, Visa, Mastercard, and Cash on Delivery.
          </p>
          <div className="badge-gold">
            <Shield size={12} />
            Verified Authentic Drops
          </div>
        </div>

      </div>

      <div style={{
        maxWidth: 1280,
        margin: '0 auto',
        paddingTop: 24,
        borderTop: '1px solid rgba(255, 255, 255, 0.05)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 12,
        fontSize: '0.82rem',
        color: '#64748b',
      }}>
        <div>© 2026 UrbanCart Technologies Inc. All rights reserved.</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          Crafted with care & precision for high-fashion connoisseurs.
        </div>
      </div>
    </footer>
  );
}
