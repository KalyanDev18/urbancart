import React from 'react';
import { ShoppingBag, Shield, Heart } from 'lucide-react';

export default function Footer({ onNavigate }) {
  return (
    <footer style={{
      background: '#070b12',
      borderTop: '1px solid rgba(255, 255, 255, 0.08)',
      padding: '44px 16px 28px',
      marginTop: 52,
    }}>
      <div style={{
        maxWidth: 1280,
        margin: '0 auto',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 220px), 1fr))',
        gap: 32,
        marginBottom: 32,
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
              color: '#090d16',
              boxShadow: '0 4px 10px rgba(217, 119, 6, 0.35)'
            }}>
              <ShoppingBag size={20} strokeWidth={2.4} />
            </div>
            <span style={{ fontSize: '1.35rem', fontWeight: 800, color: '#f8fafc' }}>
              Urban<span style={{ color: '#f59e0b' }}>Cart</span>
            </span>
          </div>
          <p style={{ fontSize: '0.86rem', color: '#94a3b8', lineHeight: 1.6 }}>
            Redefining modern luxury commerce with curated designer streetwear, premium sneakers, and high-performance audio electronics.
          </p>
        </div>

        {/* Quick Links */}
        <div>
          <h4 style={{ fontSize: '0.98rem', fontWeight: 800, color: '#f8fafc', marginBottom: 16 }}>
            Collections
          </h4>
          <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 10, fontSize: '0.86rem', color: '#94a3b8' }}>
            <li onClick={() => onNavigate('home')} style={{ cursor: 'pointer', transition: 'color 0.2s' }} onMouseEnter={(e) => e.target.style.color = '#f59e0b'} onMouseLeave={(e) => e.target.style.color = '#94a3b8'}>Streetwear Hoodies & Drops</li>
            <li onClick={() => onNavigate('home')} style={{ cursor: 'pointer', transition: 'color 0.2s' }} onMouseEnter={(e) => e.target.style.color = '#f59e0b'} onMouseLeave={(e) => e.target.style.color = '#94a3b8'}>Luxury Sneakers & Runners</li>
            <li onClick={() => onNavigate('home')} style={{ cursor: 'pointer', transition: 'color 0.2s' }} onMouseEnter={(e) => e.target.style.color = '#f59e0b'} onMouseLeave={(e) => e.target.style.color = '#94a3b8'}>Studio Grade Headphones</li>
            <li onClick={() => onNavigate('home')} style={{ cursor: 'pointer', transition: 'color 0.2s' }} onMouseEnter={(e) => e.target.style.color = '#f59e0b'} onMouseLeave={(e) => e.target.style.color = '#94a3b8'}>Mechanical Keyboards</li>
          </ul>
        </div>

        {/* Customer Care */}
        <div>
          <h4 style={{ fontSize: '0.98rem', fontWeight: 800, color: '#f8fafc', marginBottom: 16 }}>
            Customer Care
          </h4>
          <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 10, fontSize: '0.86rem', color: '#94a3b8' }}>
            <li onClick={() => onNavigate('dashboard')} style={{ cursor: 'pointer', transition: 'color 0.2s' }} onMouseEnter={(e) => e.target.style.color = '#f59e0b'} onMouseLeave={(e) => e.target.style.color = '#94a3b8'}>Track My Order</li>
            <li onClick={() => onNavigate('dashboard')} style={{ cursor: 'pointer', transition: 'color 0.2s' }} onMouseEnter={(e) => e.target.style.color = '#f59e0b'} onMouseLeave={(e) => e.target.style.color = '#94a3b8'}>7-Day Returns Policy</li>
            <li>Express Pan-India Shipping</li>
            <li>UrbanCoins VIP Rewards</li>
          </ul>
        </div>

        {/* Security */}
        <div>
          <h4 style={{ fontSize: '0.98rem', fontWeight: 800, color: '#f8fafc', marginBottom: 16 }}>
            Payments & Security
          </h4>
          <p style={{ fontSize: '0.84rem', color: '#94a3b8', lineHeight: 1.6, marginBottom: 14 }}>
            Encrypted checkout with instant UPI, Visa, Mastercard, and Cash on Delivery.
          </p>
          <div style={{
            background: 'rgba(245, 158, 11, 0.12)',
            color: '#fbbf24',
            border: '1px solid rgba(245, 158, 11, 0.25)',
            padding: '5px 12px',
            borderRadius: 9999,
            fontSize: '0.74rem',
            fontWeight: 700,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6
          }}>
            <Shield size={13} />
            Verified Authentic Drops
          </div>
        </div>

      </div>

      {/* Copyright Bar with Kalyan Dev */}
      <div style={{
        maxWidth: 1280,
        margin: '0 auto',
        paddingTop: 24,
        borderTop: '1px solid rgba(255, 255, 255, 0.08)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 12,
        fontSize: '0.85rem',
        color: '#94a3b8',
      }}>
        <div>
          © 2026 UrbanCart. All Rights Reserved.
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#cbd5e1' }}>
          Designed & Developed with <Heart size={14} color="#ef4444" fill="#ef4444" /> by <strong style={{ color: '#f59e0b', fontWeight: 700 }}>Kalyan Dev</strong>
        </div>
      </div>
    </footer>
  );
}
