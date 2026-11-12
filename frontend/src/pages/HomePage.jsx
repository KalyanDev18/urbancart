import React, { useState, useEffect, useCallback, useMemo, lazy, Suspense } from 'react';
import CategoryBar from '../components/CategoryBar';
import HeroCarousel from '../components/HeroCarousel';
import SpotlightHero from '../components/SpotlightHero';
import DealsScrollRow from '../components/DealsScrollRow';
import ProductCard from '../components/ProductCard';
import { api, HAS_BACKEND_URL, getCachedHome, setCachedHome } from '../api/client';
import { ShieldCheck, Truck, RefreshCw, Zap, AlertTriangle } from 'lucide-react';

const ProductDetailModal = lazy(() => import('../components/ProductDetailModal'));

const toArray = (val) => {
  if (Array.isArray(val)) return val;
  if (val && Array.isArray(val.results)) return val.results;
  return [];
};

export default function HomePage({ onRequireAuth, searchQuery, onSelectProduct }) {
  const cached = useMemo(() => getCachedHome(), []);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showAllCatalog, setShowAllCatalog] = useState(false);
  const [allProducts, setAllProducts] = useState(() => (cached ? toArray(cached.products) : []));
  const [sections, setSections] = useState(() => ({
    spotlight: cached ? toArray(cached.spotlight) : [],
    deals: cached ? toArray(cached.deals) : [],
    suggested: cached ? toArray(cached.suggested) : [],
  }));
  const [loading, setLoading] = useState(!cached);
  const [apiError, setApiError] = useState('');

  // Single-roundtrip fetch (with fallback to legacy endpoints if backend hasn't updated /home/ yet)
  const loadInitialData = useCallback(async () => {
    if (allProducts.length === 0) setLoading(true);
    setApiError('');
    try {
      let homePayload = null;
      try {
        homePayload = await api.getHomeData();
      } catch {
        const [secData, prodData] = await Promise.all([
          api.getSections().catch(() => ({})),
          api.getProducts(),
        ]);
        homePayload = {
          spotlight: toArray(secData?.spotlight),
          deals: toArray(secData?.deals),
          suggested: toArray(secData?.suggested),
          products: toArray(prodData),
        };
      }

      const normalized = {
        spotlight: toArray(homePayload?.spotlight),
        deals: toArray(homePayload?.deals),
        suggested: toArray(homePayload?.suggested),
        products: toArray(homePayload?.products),
      };

      setAllProducts(normalized.products);
      setSections({
        spotlight: normalized.spotlight,
        deals: normalized.deals,
        suggested: normalized.suggested,
      });
      setCachedHome(normalized);
    } catch (err) {
      console.error('Error loading storefront:', err);
      if (allProducts.length === 0) {
        setApiError(err.message || 'Could not connect to backend server.');
      }
    } finally {
      setLoading(false);
    }
  }, [allProducts.length]);

  useEffect(() => {
    loadInitialData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Instant zero-latency client-side filtering across category & search
  const safeProducts = useMemo(() => {
    let list = toArray(allProducts);
    if (selectedCategory && selectedCategory !== 'All') {
      const target = selectedCategory.toLowerCase();
      list = list.filter((p) => (p.category || '').toLowerCase() === target);
    }
    if (searchQuery && searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      list = list.filter(
        (p) =>
          (p.name || '').toLowerCase().includes(q) ||
          (p.description || '').toLowerCase().includes(q) ||
          (p.category || '').toLowerCase().includes(q)
      );
    }
    return list;
  }, [allProducts, selectedCategory, searchQuery]);

  const safeSpotlight = toArray(sections?.spotlight);
  const safeDeals = toArray(sections?.deals);
  const safeSuggested = toArray(sections?.suggested);

  const handleSelectProduct = (prod) => {
    setSelectedProduct(prod);
    if (onSelectProduct) onSelectProduct(prod);
  };

  const handleRatingUpdated = (productId, avgRating, reviewCount) => {
    const patchProd = (p) => (p.id === productId ? { ...p, rating: avgRating, review_count: reviewCount } : p);
    setAllProducts((prev) => {
      const nextProducts = prev.map(patchProd);
      setSections((secPrev) => {
        const nextSec = {
          spotlight: secPrev.spotlight.map(patchProd),
          deals: secPrev.deals.map(patchProd),
          suggested: secPrev.suggested.map(patchProd),
        };
        setCachedHome({ ...nextSec, products: nextProducts });
        return nextSec;
      });
      return nextProducts;
    });
    setSelectedProduct((prev) => (prev && prev.id === productId ? { ...prev, rating: avgRating, review_count: reviewCount } : prev));
  };

  // Top 5 products for carousel
  const carouselProducts = safeSpotlight.length >= 5
    ? safeSpotlight.slice(0, 5)
    : (allProducts.length >= 5 ? allProducts.slice(0, 5) : safeSpotlight);

  return (
    <div>
      {/* 1. Flipkart-style Category Bar */}
      <CategoryBar
        selectedCategory={selectedCategory}
        onSelectCategory={(cat) => setSelectedCategory(cat)}
      />

      {/* 2. Top 5-Product Hero Carousel */}
      {!searchQuery && selectedCategory === 'All' && carouselProducts.length > 0 && (
        <HeroCarousel
          products={carouselProducts}
          onRequireAuth={onRequireAuth}
          onSelectProduct={handleSelectProduct}
          onShopNow={() => {
            const el = document.getElementById('catalog-grid');
            if (el) el.scrollIntoView({ behavior: 'smooth' });
          }}
        />
      )}

      {/* 3. Spotlight Hero Showcase Section */}
      {!searchQuery && selectedCategory === 'All' && safeSpotlight.length > 0 && (
        <SpotlightHero
          spotlightProducts={safeSpotlight}
          onSelectProduct={handleSelectProduct}
          onShopNow={() => {
            const el = document.getElementById('catalog-grid');
            if (el) el.scrollIntoView({ behavior: 'smooth' });
          }}
        />
      )}

      {/* 3. Deals on your favourites! ✨ (Horizontal scroll row) */}
      {!searchQuery && selectedCategory === 'All' && safeDeals.length > 0 && (
        <DealsScrollRow
          title="Deals on your favourites! ✨"
          products={safeDeals}
          onRequireAuth={onRequireAuth}
          onSelectProduct={handleSelectProduct}
        />
      )}

      {/* 4. Suggested For You ➔ (Horizontal scroll row) */}
      {!searchQuery && selectedCategory === 'All' && safeSuggested.length > 0 && (
        <DealsScrollRow
          title="Suggested For You ➔"
          products={safeSuggested}
          onRequireAuth={onRequireAuth}
          onSelectProduct={handleSelectProduct}
        />
      )}

      {/* 5. Main Catalog Grid */}
      <div id="catalog-grid" className="section-shell">
        
        {/* Catalog Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h2 style={{ fontSize: 'clamp(1.25rem, 3vw, 1.65rem)', fontWeight: 800, color: 'var(--text-main)' }}>
              {searchQuery ? `Search Results for "${searchQuery}"` : (selectedCategory === 'All' ? 'Complete Catalog & New Drops' : `${selectedCategory} Collection`)}
            </h2>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-dim)' }}>
              Showing {safeProducts.length} items available for express delivery
            </p>
          </div>

          {selectedCategory !== 'All' && (
            <button
              onClick={() => setSelectedCategory('All')}
              className="btn-dark"
              style={{ fontSize: '0.8rem', padding: '6px 14px' }}
            >
              Reset to All
            </button>
          )}
        </div>

        {/* Product Cards Grid with Responsive Multi-Columns */}
        {loading ? (
          <div className="responsive-product-grid">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
              <div 
                key={n} 
                style={{ height: 320, borderRadius: 20, background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', opacity: 0.6, animation: 'pulseSubtle 1.5s infinite' }} 
              />
            ))}
          </div>
        ) : apiError ? (
          <div style={{ textAlign: 'center', padding: '44px 20px', borderRadius: 24, background: 'var(--badge-bg)', border: '1px solid var(--badge-border)' }}>
            <AlertTriangle size={36} color="#d97706" style={{ margin: '0 auto 12px' }} />
            <h3 style={{ fontSize: '1.15rem', color: 'var(--text-main)', fontWeight: 800, marginBottom: 8 }}>
              {!HAS_BACKEND_URL ? 'Backend URL Not Linked Yet' : 'Connecting to UrbanCart Server...'}
            </h3>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', maxWidth: 520, margin: '0 auto 18px', lineHeight: 1.5 }}>
              {apiError}
            </p>
            <button
              onClick={loadInitialData}
              className="btn-gold"
              style={{ padding: '10px 20px', fontSize: '0.9rem' }}
            >
              <RefreshCw size={15} />
              Retry Connection
            </button>
          </div>
        ) : safeProducts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '50px 20px', borderRadius: 24, background: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}>
            <h3 style={{ fontSize: '1.2rem', color: 'var(--text-main)', marginBottom: 8 }}>No products found</h3>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-dim)' }}>
              Try searching for different terms or reset your category filter.
            </p>
          </div>
        ) : (
          <>
            <div className="responsive-product-grid">
              {(searchQuery || selectedCategory !== 'All' || showAllCatalog ? safeProducts : safeProducts.slice(0, 16)).map((item) => (
                <ProductCard
                  key={item.id}
                  product={item}
                  onRequireAuth={onRequireAuth}
                  onSelectProduct={handleSelectProduct}
                />
              ))}
            </div>
            {!searchQuery && selectedCategory === 'All' && !showAllCatalog && safeProducts.length > 16 && (
              <div style={{ textAlign: 'center', marginTop: 24 }}>
                <button
                  onClick={() => setShowAllCatalog(true)}
                  className="btn-dark"
                  style={{ padding: '11px 24px', fontSize: '0.88rem' }}
                >
                  Show All {safeProducts.length} Products
                </button>
              </div>
            )}
          </>
        )}

      </div>

      {/* 6. Brand Perks & Assurance Row */}
      <div style={{
        background: 'var(--bg-secondary)',
        borderTop: '1px solid var(--border-subtle)',
        padding: '36px 16px',
        marginTop: 44,
        transition: 'background-color 0.25s ease, border-color 0.25s ease',
      }}>
        <div style={{
          maxWidth: 1280,
          margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 200px), 1fr))',
          gap: 20,
        }}>
          <div style={{ display: 'flex', gap: 12 }}>
            <div style={{
              width: 42,
              height: 42,
              borderRadius: 12,
              background: 'var(--badge-bg)',
              border: '1px solid var(--badge-border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--price-color)',
              flexShrink: 0
            }}>
              <Truck size={20} />
            </div>
            <div>
              <h4 style={{ fontSize: '0.96rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: 2 }}>
                Express Delivery
              </h4>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-dim)', lineHeight: 1.4 }}>
                Pan-India rapid air dispatch in 2-4 days.
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 12 }}>
            <div style={{
              width: 42,
              height: 42,
              borderRadius: 12,
              background: 'var(--badge-bg)',
              border: '1px solid var(--badge-border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--price-color)',
              flexShrink: 0
            }}>
              <ShieldCheck size={20} />
            </div>
            <div>
              <h4 style={{ fontSize: '0.96rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: 2 }}>
                100% Authentic
              </h4>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-dim)', lineHeight: 1.4 }}>
                Direct sourcing with serial verification.
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 12 }}>
            <div style={{
              width: 42,
              height: 42,
              borderRadius: 12,
              background: 'var(--badge-bg)',
              border: '1px solid var(--badge-border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--price-color)',
              flexShrink: 0
            }}>
              <RefreshCw size={20} />
            </div>
            <div>
              <h4 style={{ fontSize: '0.96rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: 2 }}>
                7-Day Easy Returns
              </h4>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-dim)', lineHeight: 1.4 }}>
                Doorstep pickup with instant refunds.
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 12 }}>
            <div style={{
              width: 42,
              height: 42,
              borderRadius: 12,
              background: 'var(--badge-bg)',
              border: '1px solid var(--badge-border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--price-color)',
              flexShrink: 0
            }}>
              <Zap size={20} />
            </div>
            <div>
              <h4 style={{ fontSize: '0.96rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: 2 }}>
                UrbanCoins Rewards
              </h4>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-dim)', lineHeight: 1.4 }}>
                Earn 10% instant cashback on all orders.
              </p>
            </div>
          </div>

        </div>
      </div>

      {selectedProduct && (
        <Suspense fallback={null}>
          <ProductDetailModal
            product={selectedProduct}
            onClose={() => setSelectedProduct(null)}
            onRequireAuth={onRequireAuth}
            onRatingUpdated={handleRatingUpdated}
          />
        </Suspense>
      )}

    </div>
  );
}
