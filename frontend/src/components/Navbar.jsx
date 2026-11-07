import React, { useState } from 'react';
import { ShoppingBag, User as UserIcon, Search, Sparkles, LogOut, Package, MapPin } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

export default function Navbar({ onNavigate, currentPage, onSearch, searchQuery }) {
  const { user, isAuthenticated, logoutUser } = useAuth();
  const { cartCount, setIsCartOpen } = useCart();
  const [showUserMenu, setShowUserMenu] = useState(false);

  const handleLogout = async () => {
    setShowUserMenu(false);
    await logoutUser();
    if (currentPage === 'dashboard') {
      onNavigate('home');
    }
  };

  return (
    <header className="glass-nav" style={{ position: 'sticky', top: 0, zIndex: 50, padding: '14px 24px' }}>
      <div style={{ maxWidth: 1280, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 20 }}>
        
        {/* Brand Logo */}
        <div 
          onClick={() => onNavigate('home')}
          style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', flexShrink: 0 }}
        >
          <div style={{
            width: 42,
            height: 42,
            borderRadius: 12,
            background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#ffffff',
            boxShadow: '0 4px 14px rgba(217, 119, 6, 0.3)'
          }}>
            <ShoppingBag size={22} strokeWidth={2.4} />
          </div>
          <div>
            <span style={{ fontSize: '1.45rem', fontWeight: 800, letterSpacing: '-0.03em', color: '#0f172a', display: 'block', lineHeight: 1.1 }}>
              Urban<span style={{ color: '#d97706' }}>Cart</span>
            </span>
            <span style={{ fontSize: '0.68rem', letterSpacing: '0.12em', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>
              Curated Luxury
            </span>
          </div>
        </div>

        {/* Global Search Bar */}
        <div style={{ flex: 1, maxWidth: 540, position: 'relative' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            background: '#f1f5f9',
            border: '1px solid #e2e8f0',
            borderRadius: 9999,
            padding: '9px 18px',
            transition: 'border-color 0.2s, background-color 0.2s',
          }}>
            <Search size={18} color="#64748b" style={{ marginRight: 10 }} />
            <input
              type="text"
              placeholder="Search sneakers, hoodies, luxury audio, gaming gear..."
              value={searchQuery}
              onChange={(e) => onSearch(e.target.value)}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#0f172a',
                outline: 'none',
                width: '100%',
                fontSize: '0.9rem',
                fontFamily: 'inherit'
              }}
            />
            {searchQuery && (
              <button 
                onClick={() => onSearch('')}
                style={{ background: 'none', color: '#94a3b8', fontSize: '0.85rem', cursor: 'pointer', padding: '0 4px' }}
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Right Action Icons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          
          {/* Cart Icon & Badge */}
          <button
            onClick={() => setIsCartOpen(true)}
            style={{
              position: 'relative',
              background: '#f8fafc',
              border: '1px solid #cbd5e1',
              borderRadius: 12,
              padding: '9px 16px',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              color: '#0f172a',
              transition: 'all 0.2s ease',
            }}
          >
            <ShoppingBag size={19} color="#d97706" />
            <span style={{ fontSize: '0.88rem', fontWeight: 700 }}>Cart</span>
            {cartCount > 0 && (
              <span style={{
                background: '#d97706',
                color: '#ffffff',
                fontWeight: 800,
                fontSize: '0.72rem',
                padding: '2px 7px',
                borderRadius: 9999,
                lineHeight: 1,
              }}>
                {cartCount}
              </span>
            )}
          </button>

          {/* User Profile / Login */}
          {isAuthenticated ? (
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: 12,
                  padding: '7px 14px',
                  color: '#0f172a',
                }}
              >
                <div style={{
                  width: 30,
                  height: 30,
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                  color: '#ffffff',
                  fontWeight: 800,
                  fontSize: '0.82rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  {user?.first_name ? user.first_name[0].toUpperCase() : 'U'}
                </div>
                <span style={{ fontSize: '0.88rem', fontWeight: 700 }}>
                  {user?.first_name || user?.username}
                </span>
              </button>

              {/* Dropdown Menu */}
              {showUserMenu && (
                <div 
                  className="glass"
                  style={{
                    position: 'absolute',
                    top: 'calc(100% + 8px)',
                    right: 0,
                    width: 220,
                    borderRadius: 16,
                    padding: 8,
                    zIndex: 100,
                    boxShadow: '0 10px 30px rgba(15, 23, 42, 0.12)',
                    border: '1px solid #e2e8f0',
                    background: '#ffffff'
                  }}
                >
                  <div style={{ padding: '10px 12px', borderBottom: '1px solid #f1f5f9', marginBottom: 6 }}>
                    <div style={{ fontSize: '0.78rem', color: '#64748b' }}>Signed in as</div>
                    <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {user?.email || user?.username}
                    </div>
                  </div>

                  <button
                    onClick={() => { setShowUserMenu(false); onNavigate('dashboard'); }}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      padding: '10px 12px',
                      borderRadius: 10,
                      background: 'none',
                      color: '#0f172a',
                      fontSize: '0.88rem',
                      fontWeight: 600,
                      textAlign: 'left',
                    }}
                  >
                    <Package size={16} color="#d97706" />
                    My Orders & Account
                  </button>

                  <button
                    onClick={handleLogout}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      padding: '10px 12px',
                      borderRadius: 10,
                      background: 'none',
                      color: '#dc2626',
                      fontSize: '0.88rem',
                      fontWeight: 600,
                      textAlign: 'left',
                    }}
                  >
                    <LogOut size={16} />
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={() => onNavigate('login')}
              className="btn-gold"
              style={{ padding: '9px 20px', fontSize: '0.88rem' }}
            >
              <UserIcon size={16} />
              Sign In
            </button>
          )}

        </div>

      </div>
    </header>
  );
}
