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
      background: 'rgba(15, 23, 42, 0.65)',
      borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
      padding: '16px 20px',
      overflowX: 'auto',
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
                color: isSelected ? '#fbbf24' : '#94a3b8',
                transition: 'all 0.2s ease',
                flex: 1,
              }}
            >
              <div style={{
                width: 50,
                height: 50,
                borderRadius: '50%',
                background: isSelected 
                  ? 'linear-gradient(135deg, rgba(245, 158, 11, 0.25) 0%, rgba(217, 119, 6, 0.15) 100%)' 
                  : '#1e293b',
                border: isSelected ? '2px solid #f59e0b' : '1px solid rgba(255, 255, 255, 0.08)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: isSelected ? '#fbbf24' : '#cbd5e1',
                boxShadow: isSelected ? '0 0 16px rgba(245, 158, 11, 0.3)' : 'none',
                transform: isSelected ? 'scale(1.08)' : 'scale(1)',
                transition: 'all 0.2s ease'
              }}>
                <Icon size={22} strokeWidth={isSelected ? 2.5 : 1.8} />
              </div>
              <span style={{
                fontSize: '0.82rem',
                fontWeight: isSelected ? 700 : 500,
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
