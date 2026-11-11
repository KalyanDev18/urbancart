import React, { useEffect, useState } from 'react';
import { ShoppingBag, Sparkles } from 'lucide-react';

export default function WelcomeSplash({ onDone }) {
  const [fading, setFading] = useState(false);

  useEffect(() => {
    // 1-second landing intro: start smooth fade at 820ms, finish unmount at 1050ms
    const fadeTimer = setTimeout(() => setFading(true), 820);
    const doneTimer = setTimeout(() => {
      if (onDone) onDone();
    }, 1050);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(doneTimer);
    };
  }, [onDone]);

  return (
    <div
      onClick={() => {
        setFading(true);
        setTimeout(() => onDone && onDone(), 180);
      }}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'radial-gradient(circle at 50% 35%, rgba(245, 158, 11, 0.16) 0%, #070b13 65%)',
        opacity: fading ? 0 : 1,
        transform: fading ? 'scale(1.03)' : 'scale(1)',
        transition: 'opacity 0.25s ease-out, transform 0.25s ease-out',
        cursor: 'pointer',
        padding: 24,
        textAlign: 'center',
      }}
    >
      {/* Glowing Logo Emblem */}
      <div
        className="splash-pop"
        style={{
          width: 72,
          height: 72,
          borderRadius: 20,
          background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#090d16',
          boxShadow: '0 0 40px rgba(245, 158, 11, 0.45)',
          marginBottom: 20,
        }}
      >
        <ShoppingBag size={36} strokeWidth={2.4} />
      </div>

      {/* Brand Wordmark */}
      <h1
        className="splash-fade-up"
        style={{
          fontSize: 'clamp(2.2rem, 6vw, 3.2rem)',
          fontWeight: 900,
          color: '#ffffff',
          letterSpacing: '-0.03em',
          lineHeight: 1.1,
          marginBottom: 8,
        }}
      >
        Urban<span style={{ color: '#f59e0b' }}>Cart</span>
      </h1>

      {/* Luxury Tagline */}
      <div
        className="splash-fade-up"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          fontSize: '0.78rem',
          fontWeight: 700,
          letterSpacing: '0.18em',
          textTransform: 'uppercase',
          color: '#fbbf24',
          marginBottom: 26,
        }}
      >
        <Sparkles size={13} />
        Curated Luxury &amp; Tech Streetwear
      </div>

      {/* 1-Second Progress Bar */}
      <div
        style={{
          width: 180,
          height: 4,
          borderRadius: 9999,
          background: 'rgba(255, 255, 255, 0.1)',
          overflow: 'hidden',
        }}
      >
        <div
          className="splash-progress"
          style={{
            height: '100%',
            background: 'linear-gradient(90deg, #f59e0b, #fbbf24)',
            borderRadius: 9999,
          }}
        />
      </div>
    </div>
  );
}
