import React, { useState } from 'react';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import CartDrawer from './components/CartDrawer';
import ChatbotWidget from './components/ChatbotWidget';

import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import CheckoutPage from './pages/CheckoutPage';
import OrderSuccessPage from './pages/OrderSuccessPage';
import DashboardPage from './pages/DashboardPage';

function MainApp() {
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
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      
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
    <AuthProvider>
      <CartProvider>
        <MainApp />
      </CartProvider>
    </AuthProvider>
  );
}
