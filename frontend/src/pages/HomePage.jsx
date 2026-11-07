import React, { useState, useEffect } from 'react';
import CategoryBar from '../components/CategoryBar';
import HeroCarousel from '../components/HeroCarousel';
import SpotlightHero from '../components/SpotlightHero';
import DealsScrollRow from '../components/DealsScrollRow';
import ProductCard from '../components/ProductCard';
import { api } from '../api/client';
import { ShieldCheck, Truck, RefreshCw, Zap } from 'lucide-react';

export default function HomePage({ onRequireAuth, searchQuery, onSelectProduct }) {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [products, setProducts] = useState([]);
  const [sections, setSections] = useState({ spotlight: [], deals: [], suggested: [] });
  const [loading, setLoading] = useState(true);

  // Fetch sections (Spotlight, Deals, Suggested)
  useEffect(() => {
    api.getSections()
      .then((data) => {
        setSections(data);
      })
      .catch((err) => console.error('Error loading sections:', err));
  }, []);

  // Fetch catalog with category and search query filters
  useEffect(() => {
    setLoading(true);
    const params = {};
    if (selectedCategory && selectedCategory !== 'All') {
      params.category = selectedCategory;
    }
    if (searchQuery) {
      params.q = searchQuery;
    }

    api.getProducts(params)
      .then((data) => {
        setProducts(data || []);
      })
      .catch((err) => console.error('Error loading catalog:', err))
      .finally(() => setLoading(false));
  }, [selectedCategory, searchQuery]);

  // Top 5 products for carousel
  const carouselProducts = sections.spotlight?.length >= 5 
    ? sections.spotlight.slice(0, 5) 
    : (products.length >= 5 ? products.slice(0, 5) : sections.spotlight);

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
          onShopNow={() => {
            const el = document.getElementById('catalog-grid');
            if (el) el.scrollIntoView({ behavior: 'smooth' });
          }}
        />
      )}

      {/* 3. Spotlight Hero Showcase Section */}
      {!searchQuery && selectedCategory === 'All' && (
        <SpotlightHero
          spotlightProducts={sections.spotlight}
          onSelectProduct={onSelectProduct}
          onShopNow={() => {
            const el = document.getElementById('catalog-grid');
            if (el) el.scrollIntoView({ behavior: 'smooth' });
          }}
        />
      )}

      {/* 3. Deals on your favourites! ✨ (Horizontal scroll row) */}
      {!searchQuery && selectedCategory === 'All' && sections.deals.length > 0 && (
        <DealsScrollRow
          title="Deals on your favourites! ✨"
          products={sections.deals}
          onRequireAuth={onRequireAuth}
        />
      )}

      {/* 4. Suggested For You ➔ (Horizontal scroll row) */}
      {!searchQuery && selectedCategory === 'All' && sections.suggested.length > 0 && (
        <DealsScrollRow
          title="Suggested For You ➔"
          products={sections.suggested}
          onRequireAuth={onRequireAuth}
        />
      )}

      {/* 5. Main Catalog Grid */}
      <div id="catalog-grid" style={{ maxWidth: 1280, margin: '30px auto', padding: '0 16px' }}>
        
        {/* Catalog Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h2 style={{ fontSize: 'clamp(1.25rem, 3vw, 1.65rem)', fontWeight: 800, color: '#0f172a' }}>
              {searchQuery ? `Search Results for "${searchQuery}"` : (selectedCategory === 'All' ? 'Complete Catalog & New Drops' : `${selectedCategory} Collection`)}
            </h2>
            <p style={{ fontSize: '0.82rem', color: '#64748b' }}>
              Showing {products.length} luxury items available for express delivery
            </p>
          </div>

          {selectedCategory !== 'All' && (
            <button
              onClick={() => setSelectedCategory('All')}
              className="btn-dark"
              style={{ fontSize: '0.8rem', padding: '6px 14px', background: '#ffffff' }}
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
                style={{ height: 320, borderRadius: 20, background: '#ffffff', border: '1px solid #e2e8f0', opacity: 0.6, animation: 'pulseSubtle 1.5s infinite' }} 
              />
            ))}
          </div>
        ) : products.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '50px 20px', borderRadius: 24, background: '#ffffff', border: '1px solid #e2e8f0' }}>
            <h3 style={{ fontSize: '1.2rem', color: '#0f172a', marginBottom: 8 }}>No products found</h3>
            <p style={{ fontSize: '0.88rem', color: '#64748b' }}>
              Try searching for different terms or reset your category filter.
            </p>
          </div>
        ) : (
          <div className="responsive-product-grid">
            {products.map((item) => (
              <ProductCard
                key={item.id}
                product={item}
                onRequireAuth={onRequireAuth}
              />
            ))}
          </div>
        )}

      </div>

      {/* 6. Brand Perks & Assurance Row */}
      <div style={{
        background: '#ffffff',
        borderTop: '1px solid #e2e8f0',
        padding: '40px 16px',
        marginTop: 50,
      }}>
        <div style={{
          maxWidth: 1280,
          margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: 24,
        }}>
          <div style={{ display: 'flex', gap: 12 }}>
            <div style={{
              width: 42,
              height: 42,
              borderRadius: 12,
              background: '#fffbeb',
              border: '1px solid #fde68a',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#d97706',
              flexShrink: 0
            }}>
              <Truck size={20} />
            </div>
            <div>
              <h4 style={{ fontSize: '0.96rem', fontWeight: 700, color: '#0f172a', marginBottom: 2 }}>
                Express Delivery
              </h4>
              <p style={{ fontSize: '0.82rem', color: '#64748b', lineHeight: 1.4 }}>
                Pan-India rapid air dispatch in 2-4 days.
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 12 }}>
            <div style={{
              width: 42,
              height: 42,
              borderRadius: 12,
              background: '#fffbeb',
              border: '1px solid #fde68a',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#d97706',
              flexShrink: 0
            }}>
              <ShieldCheck size={20} />
            </div>
            <div>
              <h4 style={{ fontSize: '0.96rem', fontWeight: 700, color: '#0f172a', marginBottom: 2 }}>
                100% Authentic
              </h4>
              <p style={{ fontSize: '0.82rem', color: '#64748b', lineHeight: 1.4 }}>
                Direct sourcing with serial verification.
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 12 }}>
            <div style={{
              width: 42,
              height: 42,
              borderRadius: 12,
              background: '#fffbeb',
              border: '1px solid #fde68a',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#d97706',
              flexShrink: 0
            }}>
              <RefreshCw size={20} />
            </div>
            <div>
              <h4 style={{ fontSize: '0.96rem', fontWeight: 700, color: '#0f172a', marginBottom: 2 }}>
                7-Day Easy Returns
              </h4>
              <p style={{ fontSize: '0.82rem', color: '#64748b', lineHeight: 1.4 }}>
                Doorstep pickup with instant refunds.
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 12 }}>
            <div style={{
              width: 42,
              height: 42,
              borderRadius: 12,
              background: '#fffbeb',
              border: '1px solid #fde68a',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#d97706',
              flexShrink: 0
            }}>
              <Zap size={20} />
            </div>
            <div>
              <h4 style={{ fontSize: '0.96rem', fontWeight: 700, color: '#0f172a', marginBottom: 2 }}>
                UrbanCoins Rewards
              </h4>
              <p style={{ fontSize: '0.82rem', color: '#64748b', lineHeight: 1.4 }}>
                Earn 10% instant cashback on all orders.
              </p>
            </div>
          </div>

        </div>
      </div>

    </div>
  );
}
