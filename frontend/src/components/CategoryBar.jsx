import React from 'react';
import { Sparkles, Shirt, Footprints, Headphones, Watch, Gamepad2, Compass, Home } from 'lucide-react';

const CATEGORIES = [
  { name: 'All', icon: Sparkles },
  { name: 'Clothing', icon: Shirt },
  { name: 'Footwear', icon: Footprints },
  { name: 'Electronics', icon: Headphones },
  { name: 'Wearables', icon: Watch },
  { name: 'Gaming', icon: Gamepad2 },
  { name: 'Lifestyle', icon: Compass },
  { name: 'Home Tech', icon: Home },
];

export default function CategoryBar({ selectedCategory, onSelectCategory }) {
  return (
    <div className="category-strip-wrap no-scrollbar">
      <div className="category-strip-inner">
        {CATEGORIES.map((cat) => {
          const Icon = cat.icon;
          const isSelected = selectedCategory === cat.name;

          return (
            <button
              key={cat.name}
              onClick={() => onSelectCategory(cat.name)}
              className="category-item-btn"
              style={{
                color: isSelected ? 'var(--price-color)' : 'var(--text-dim)',
              }}
            >
              <div
                className="category-circle"
                style={{
                  background: isSelected 
                    ? 'var(--badge-bg)' 
                    : 'var(--bg-surface)',
                  border: isSelected ? '2px solid var(--amber-dark)' : '1px solid var(--border-subtle)',
                  color: isSelected ? 'var(--price-color)' : 'var(--text-muted)',
                  boxShadow: isSelected ? '0 4px 14px rgba(217, 119, 6, 0.2)' : 'none',
                  transform: isSelected ? 'scale(1.06)' : 'scale(1)',
                }}
              >
                <Icon size={20} strokeWidth={isSelected ? 2.5 : 1.9} />
              </div>
              <span style={{
                fontSize: '0.78rem',
                fontWeight: isSelected ? 800 : 600,
                letterSpacing: '0.01em',
                whiteSpace: 'nowrap',
              }}>
                {cat.name}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
