import React, { useState, useEffect } from 'react';
import { ShoppingBag, User as UserIcon, Search, LogOut, Package, Sun, Moon, Smartphone, Download, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useTheme } from '../context/ThemeContext';

export default function Navbar({ onNavigate, currentPage, onSearch, searchQuery }) {
  const { user, isAuthenticated, logoutUser } = useAuth();
  const { cartCount, setIsCartOpen } = useCart();
  const { isDark, toggleTheme } = useTheme();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [showInstallHelp, setShowInstallHelp] = useState(false);

  useEffect(() => {
    if (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }
    const handleBeforeInstall = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
      setShowInstallHelp(false);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    window.addEventListener('appinstalled', handleAppInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === 'accepted') {
        setDeferredPrompt(null);
      }
    } else {
      setShowInstallHelp(true);
    }
  };

  const handleLogout = async () => {
    setShowUserMenu(false);
    await logoutUser();
    if (currentPage === 'dashboard') {
      onNavigate('home');
    }
  };

  return (
    <>
    <header className="site-header">
      <div className="nav-container">
        
        {/* Brand Logo */}
        <div 
          onClick={() => onNavigate('home')}
          className="nav-brand"
        >
          <div className="nav-brand-logo">
            <ShoppingBag size={20} strokeWidth={2.4} />
          </div>
          <div>
            <span className="nav-brand-title">
              Urban<span style={{ color: '#f59e0b' }}>Cart</span>
            </span>
            <span className="nav-brand-sub">
              Curated Luxury
            </span>
          </div>
        </div>

        {/* Desktop Search Bar */}
        <div className="nav-search-desktop">
          <div style={{
            display: 'flex',
            alignItems: 'center',
            background: '#131b2e',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            borderRadius: 9999,
            padding: '9px 18px',
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
        <div className="nav-actions">

          {/* PWA Install App Button */}
          {!isInstalled && (
            <button
              onClick={handleInstallClick}
              title="Install UrbanCart App"
              aria-label="Install UrbanCart App"
              className="nav-install-btn"
            >
              <span className="hide-xs" style={{ display: 'inline-flex' }}>
                <Smartphone size={14} />
              </span>
              <span className="hide-xs">INSTALL</span>
              <Download size={14} />
            </button>
          )}

          {/* Dark / Light Theme Switcher */}
          <button
            onClick={toggleTheme}
            title={isDark ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
            aria-label={isDark ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
            className="nav-theme-btn"
            style={{ color: isDark ? '#fbbf24' : '#cbd5e1' }}
          >
            {isDark ? <Sun size={16} /> : <Moon size={16} />}
          </button>

          {/* Cart Icon & Badge */}
          <button
            onClick={() => setIsCartOpen(true)}
            className="nav-cart-btn"
            aria-label="Open Bag"
          >
            <ShoppingBag size={16} color="#f59e0b" />
            <span className="hide-xs" style={{ fontSize: '0.84rem', fontWeight: 700 }}>Bag</span>
            {cartCount > 0 && (
              <span className="nav-cart-badge">
                {cartCount}
              </span>
            )}
          </button>

          {/* User Profile / Login */}
          {isAuthenticated ? (
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="nav-user-btn"
              >
                <div className="nav-user-avatar">
                  {user?.first_name ? user.first_name[0].toUpperCase() : 'U'}
                </div>
                <span className="nav-user-name">
                  {user?.first_name || user?.username}
                </span>
              </button>

              {/* Dropdown Menu */}
              {showUserMenu && (
                <div 
                  style={{
                    position: 'absolute',
                    top: 'calc(100% + 8px)',
                    right: 0,
                    width: 220,
                    maxWidth: 'calc(100vw - 24px)',
                    borderRadius: 16,
                    padding: 8,
                    zIndex: 100,
                    boxShadow: '0 12px 30px rgba(0, 0, 0, 0.6)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    background: '#0d1322'
                  }}
                >
                  <div style={{ padding: '10px 12px', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', marginBottom: 6 }}>
                    <div style={{ fontSize: '0.78rem', color: '#94a3b8' }}>Signed in as</div>
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
                      borderRadius: 10,
                      background: 'none',
                      color: '#f8fafc',
                      fontSize: '0.88rem',
                      fontWeight: 600,
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
                      borderRadius: 10,
                      background: 'none',
                      color: '#ef4444',
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
              className="btn-gold nav-signin-btn"
            >
              <span className="hide-xs" style={{ display: 'inline-flex' }}>
                <UserIcon size={14} />
              </span>
              Sign In
            </button>
          )}

        </div>

      </div>

      {/* Mobile Search Bar (Row 2 on phones) */}
      <div className="nav-search-mobile">
        <div style={{
          display: 'flex',
          alignItems: 'center',
          background: '#131b2e',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          borderRadius: 9999,
          padding: '8px 14px',
        }}>
          <Search size={16} color="#94a3b8" style={{ marginRight: 8 }} />
          <input
            type="text"
            placeholder="Search products..."
            value={searchQuery}
            onChange={(e) => onSearch(e.target.value)}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#f8fafc',
              outline: 'none',
              width: '100%',
              fontSize: '0.88rem',
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

    </header>

    {showInstallHelp && (
      <div
        onClick={() => setShowInstallHelp(false)}
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 9999,
          background: 'rgba(7, 11, 19, 0.72)',
          backdropFilter: 'blur(6px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 16,
        }}
      >
        <div
          onClick={(e) => e.stopPropagation()}
          className="animate-fade-in"
          style={{
            width: '100%',
            maxWidth: 400,
            borderRadius: 22,
            padding: 24,
            background: 'var(--bg-card)',
            border: '1px solid var(--border-subtle)',
            boxShadow: '0 20px 50px rgba(0,0,0,0.45)',
            color: 'var(--text-main)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                width: 38,
                height: 38,
                borderRadius: 10,
                background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#090d16',
              }}>
                <Smartphone size={20} />
              </div>
              <div>
                <div style={{ fontWeight: 800, fontSize: '1.02rem' }}>Install UrbanCart App</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>Fast native app experience</div>
              </div>
            </div>
            <button onClick={() => setShowInstallHelp(false)} style={{ background: 'none', color: 'var(--text-dim)' }}>
              <X size={18} />
            </button>
          </div>

          <div style={{ fontSize: '0.86rem', color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: 18 }}>
            <p style={{ marginBottom: 8 }}>
              • <strong>Chrome / Edge (Desktop):</strong> Click the <strong>Install icon</strong> in the right side of the URL bar (or Menu ➔ <em>Cast, save, and share ➔ Install UrbanCart</em>).
            </p>
            <p>
              • <strong>Android / iPhone:</strong> Tap browser <strong>Menu / Share</strong> ➔ select <strong>Add to Home Screen</strong> or <strong>Install App</strong>.
            </p>
          </div>

          <button
            onClick={() => setShowInstallHelp(false)}
            className="btn-gold"
            style={{ width: '100%', padding: '10px' }}
          >
            Got it!
          </button>
        </div>
      </div>
    )}
    </>
  );
}
