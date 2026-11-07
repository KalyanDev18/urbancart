import React, { useState, useEffect } from 'react';
import CategoryBar from '../components/CategoryBar';
import SpotlightHero from '../components/SpotlightHero';
import DealsScrollRow from '../components/DealsScrollRow';
import ProductCard from '../components/ProductCard';
import { api } from '../api/client';
import { Sparkles, ArrowRight, ShieldCheck, Truck, RefreshCw, Zap } from 'lucide-react';

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

  return (
    <div>
      {/* 1. Flipkart-style Category Bar */}
      <CategoryBar
        selectedCategory={selectedCategory}
        onSelectCategory={(cat) => setSelectedCategory(cat)}
      />

      {/* 2. Spotlight Hero Section (Shown when no search query and All category) */}
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
      <div id="catalog-grid" style={{ maxWidth: 1280, margin: '40px auto', padding: '0 20px' }}>
        
        {/* Catalog Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <div>
            <h2 style={{ fontSize: '1.65rem', fontWeight: 800, color: '#0f172a' }}>
              {searchQuery ? `Search Results for "${searchQuery}"` : (selectedCategory === 'All' ? 'Complete Catalog & New Drops' : `${selectedCategory} Collection`)}
            </h2>
            <p style={{ fontSize: '0.86rem', color: '#64748b' }}>
              Showing {products.length} luxury items available for express delivery
            </p>
          </div>

          {selectedCategory !== 'All' && (
            <button
              onClick={() => setSelectedCategory('All')}
              className="btn-dark"
              style={{ fontSize: '0.82rem', padding: '8px 16px', background: '#ffffff' }}
            >
              Reset to All
            </button>
          )}
        </div>

        {/* Product Cards Grid */}
        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 24 }}>
            {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
              <div 
                key={n} 
                style={{ height: 380, borderRadius: 20, background: '#ffffff', border: '1px solid #e2e8f0', opacity: 0.6, animation: 'pulseSubtle 1.5s infinite' }} 
              />
            ))}
          </div>
        ) : products.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', borderRadius: 24, background: '#ffffff', border: '1px solid #e2e8f0' }}>
            <h3 style={{ fontSize: '1.25rem', color: '#0f172a', marginBottom: 8 }}>No products found</h3>
            <p style={{ fontSize: '0.9rem', color: '#64748b' }}>
              Try searching for different terms or reset your category filter.
            </p>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
            gap: 24,
          }}>
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
        padding: '50px 20px',
        marginTop: 60,
      }}>
        <div style={{
          maxWidth: 1280,
          margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: 30,
        }}>
          <div style={{ display: 'flex', gap: 14 }}>
            <div style={{
              width: 46,
              height: 46,
              borderRadius: 14,
              background: '#fffbeb',
              border: '1px solid #fde68a',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#d97706',
              flexShrink: 0
            }}>
              <Truck size={22} />
            </div>
            <div>
              <h4 style={{ fontSize: '1.02rem', fontWeight: 700, color: '#0f172a', marginBottom: 4 }}>
                Express Delivery
              </h4>
              <p style={{ fontSize: '0.86rem', color: '#64748b', lineHeight: 1.5 }}>
                Pan-India rapid air dispatch within 2-4 business days.
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 14 }}>
            <div style={{
              width: 46,
              height: 46,
              borderRadius: 14,
              background: '#fffbeb',
              border: '1px solid #fde68a',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#d97706',
              flexShrink: 0
            }}>
              <ShieldCheck size={22} />
            </div>
            <div>
              <h4 style={{ fontSize: '1.02rem', fontWeight: 700, color: '#0f172a', marginBottom: 4 }}>
                100% Authentic Drops
              </h4>
              <p style={{ fontSize: '0.86rem', color: '#64748b', lineHeight: 1.5 }}>
                Direct sourcing guarantee with individual serial verification.
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 14 }}>
            <div style={{
              width: 46,
              height: 46,
              borderRadius: 14,
              background: '#fffbeb',
              border: '1px solid #fde68a',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#d97706',
              flexShrink: 0
            }}>
              <RefreshCw size={22} />
            </div>
            <div>
              <h4 style={{ fontSize: '1.02rem', fontWeight: 700, color: '#0f172a', marginBottom: 4 }}>
                7-Day Easy Returns
              </h4>
              <p style={{ fontSize: '0.86rem', color: '#64748b', lineHeight: 1.5 }}>
                Doorstep pickup with instant refunds & replacements.
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 14 }}>
            <div style={{
              width: 46,
              height: 46,
              borderRadius: 14,
              background: '#fffbeb',
              border: '1px solid #fde68a',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#d97706',
              flexShrink: 0
            }}>
              <Zap size={22} />
            </div>
            <div>
              <h4 style={{ fontSize: '1.02rem', fontWeight: 700, color: '#0f172a', marginBottom: 4 }}>
                UrbanCoins Rewards
              </h4>
              <p style={{ fontSize: '0.86rem', color: '#64748b', lineHeight: 1.5 }}>
                Earn 10% instant cashback on every single order.
              </p>
            </div>
          </div>

        </div>
      </div>

    </div>
  );
}
