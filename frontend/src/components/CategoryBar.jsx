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
    <div style={{
      background: '#ffffff',
      borderBottom: '1px solid #e2e8f0',
      padding: '16px 20px',
      overflowX: 'auto',
      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.02)',
    }} className="no-scrollbar">
      <div style={{
        maxWidth: 1280,
        margin: '0 auto',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 24,
        minWidth: 700,
      }}>
        {CATEGORIES.map((cat) => {
          const Icon = cat.icon;
          const isSelected = selectedCategory === cat.name;

          return (
            <button
              key={cat.name}
              onClick={() => onSelectCategory(cat.name)}
              style={{
                background: 'none',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 8,
                color: isSelected ? '#b45309' : '#64748b',
                transition: 'all 0.2s ease',
                flex: 1,
              }}
            >
              <div style={{
                width: 52,
                height: 52,
                borderRadius: '50%',
                background: isSelected 
                  ? 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)' 
                  : '#f8fafc',
                border: isSelected ? '2px solid #d97706' : '1px solid #e2e8f0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: isSelected ? '#b45309' : '#475569',
                boxShadow: isSelected ? '0 4px 14px rgba(217, 119, 6, 0.2)' : 'none',
                transform: isSelected ? 'scale(1.08)' : 'scale(1)',
                transition: 'all 0.2s ease'
              }}>
                <Icon size={22} strokeWidth={isSelected ? 2.5 : 1.9} />
              </div>
              <span style={{
                fontSize: '0.84rem',
                fontWeight: isSelected ? 800 : 600,
                letterSpacing: '0.01em',
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
