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
            width: 40,
            height: 40,
            borderRadius: 12,
            background: 'linear-gradient(135deg, #f59e0b 0%, #b45309 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#090d16',
            boxShadow: '0 4px 14px rgba(245, 158, 11, 0.35)'
          }}>
            <ShoppingBag size={22} strokeWidth={2.4} />
          </div>
          <div>
            <span style={{ fontSize: '1.4rem', fontWeight: 800, letterSpacing: '-0.03em', color: '#f8fafc', display: 'block', lineHeight: 1.1 }}>
              Urban<span style={{ color: '#f59e0b' }}>Cart</span>
            </span>
            <span style={{ fontSize: '0.68rem', letterSpacing: '0.12em', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 600 }}>
              Curated Luxury
            </span>
          </div>
        </div>

        {/* Global Search Bar */}
        <div style={{ flex: 1, maxWidth: 540, position: 'relative' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            background: '#0f172a',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: 9999,
            padding: '8px 16px',
            transition: 'border-color 0.2s',
          }}>
            <Search size={18} color="#94a3b8" style={{ marginRight: 10 }} />
            <input
              type="text"
              placeholder="Search sneakers, hoodies, luxury audio, gaming gear..."
              value={searchQuery}
              onChange={(e) => onSearch(e.target.value)}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#f8fafc',
                outline: 'none',
                width: '100%',
                fontSize: '0.9rem',
                fontFamily: 'inherit'
              }}
            />
            {searchQuery && (
              <button 
                onClick={() => onSearch('')}
                style={{ background: 'none', color: '#64748b', fontSize: '0.85rem', cursor: 'pointer', padding: '0 4px' }}
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
              background: '#0f172a',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: 12,
              padding: '10px 14px',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              color: '#f8fafc',
              transition: 'all 0.2s ease',
            }}
          >
            <ShoppingBag size={19} color="#f59e0b" />
            <span style={{ fontSize: '0.88rem', fontWeight: 600 }}>Cart</span>
            {cartCount > 0 && (
              <span style={{
                background: '#f59e0b',
                color: '#090d16',
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
                  background: '#0f172a',
                  border: '1px solid rgba(245, 158, 11, 0.3)',
                  borderRadius: 12,
                  padding: '8px 14px',
                  color: '#f8fafc',
                }}
              >
                <div style={{
                  width: 28,
                  height: 28,
                  borderRadius: '50%',
                  background: '#f59e0b',
                  color: '#090d16',
                  fontWeight: 800,
                  fontSize: '0.82rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  {user?.first_name ? user.first_name[0].toUpperCase() : 'U'}
                </div>
                <span style={{ fontSize: '0.88rem', fontWeight: 600 }}>
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
                    width: 210,
                    borderRadius: 14,
                    padding: 8,
                    zIndex: 100,
                    boxShadow: '0 12px 30px rgba(0,0,0,0.5)',
                  }}
                >
                  <div style={{ padding: '8px 12px', borderBottom: '1px solid rgba(255,255,255,0.08)', marginBottom: 6 }}>
                    <div style={{ fontSize: '0.82rem', color: '#94a3b8' }}>Signed in as</div>
                    <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#f8fafc', overflow: 'hidden', textOverflow: 'ellipsis' }}>
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
                      borderRadius: 8,
                      background: 'none',
                      color: '#f8fafc',
                      fontSize: '0.88rem',
                      textAlign: 'left',
                    }}
                  >
                    <Package size={16} color="#f59e0b" />
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
                      borderRadius: 8,
                      background: 'none',
                      color: '#ef4444',
                      fontSize: '0.88rem',
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
              style={{ padding: '9px 18px', fontSize: '0.88rem' }}
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
