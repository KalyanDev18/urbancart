import React, { useState, lazy, Suspense } from 'react';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { ThemeProvider } from './context/ThemeContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import CartDrawer from './components/CartDrawer';
import ChatbotWidget from './components/ChatbotWidget';
import WelcomeSplash from './components/WelcomeSplash';

import HomePage from './pages/HomePage';

const LoginPage = lazy(() => import('./pages/LoginPage'));
const CheckoutPage = lazy(() => import('./pages/CheckoutPage'));
const OrderSuccessPage = lazy(() => import('./pages/OrderSuccessPage'));
const DashboardPage = lazy(() => import('./pages/DashboardPage'));

const PageLoader = () => (
  <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-dim)', fontSize: '0.92rem', fontWeight: 600 }}>
    Loading UrbanCart...
  </div>
);

function MainApp() {
  const [showSplash, setShowSplash] = useState(true);
  const [currentPage, setCurrentPage] = useState('home');
  const [searchQuery, setSearchQuery] = useState('');
  const [completedOrder, setCompletedOrder] = useState(null);
  const [redirectAfterLogin, setRedirectAfterLogin] = useState('home');

  const navigateTo = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleRequireAuth = (redirectTo = 'home') => {
    setRedirectAfterLogin(redirectTo);
    navigateTo('login');
  };

  const handleLoginSuccess = () => {
    navigateTo(redirectAfterLogin);
  };

  const handleOrderPlaced = (order) => {
    setCompletedOrder(order);
    navigateTo('order-success');
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg-primary)', color: 'var(--text-main)' }}>
      
      {/* 1-Second Luxury Animated Landing Screen */}
      {showSplash && <WelcomeSplash onDone={() => setShowSplash(false)} />}

      {/* Top Navbar */}
      <Navbar
        currentPage={currentPage}
        onNavigate={(page) => navigateTo(page)}
        searchQuery={searchQuery}
        onSearch={(q) => {
          setSearchQuery(q);
          if (currentPage !== 'home') navigateTo('home');
        }}
      />

      {/* Main View Router */}
      <main style={{ flex: 1 }}>
        <Suspense fallback={<PageLoader />}>
          {currentPage === 'home' && (
            <HomePage
              searchQuery={searchQuery}
              onRequireAuth={() => handleRequireAuth('home')}
              onSelectProduct={(p) => {}}
            />
          )}

          {currentPage === 'login' && (
            <LoginPage
              onLoginSuccess={handleLoginSuccess}
              onBackToStore={() => navigateTo('home')}
            />
          )}

          {currentPage === 'checkout' && (
            <CheckoutPage
              onOrderSuccess={handleOrderPlaced}
              onBackToCart={() => navigateTo('home')}
            />
          )}

          {currentPage === 'order-success' && (
            <OrderSuccessPage
              order={completedOrder}
              onContinueShopping={() => navigateTo('home')}
              onViewOrders={() => navigateTo('dashboard')}
            />
          )}

          {currentPage === 'dashboard' && (
            <DashboardPage
              onContinueShopping={() => navigateTo('home')}
            />
          )}
        </Suspense>
      </main>

      {/* Slide-out Cart Drawer */}
      <CartDrawer
        onCheckout={() => navigateTo('checkout')}
        onLogin={() => handleRequireAuth('checkout')}
      />

      {/* Floating AI Shopping Assistant */}
      <ChatbotWidget
        onRequireAuth={() => handleRequireAuth('home')}
      />

      {/* Global Footer (Hidden on login page) */}
      {currentPage !== 'login' && (
        <Footer onNavigate={(page) => navigateTo(page)} />
      )}

    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <CartProvider>
          <MainApp />
        </CartProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
