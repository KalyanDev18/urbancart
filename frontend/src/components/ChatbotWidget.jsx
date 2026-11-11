import React, { useState, useRef, useEffect } from 'react';
import { X, Send, Sparkles, Bot, ShoppingBag } from 'lucide-react';
import { api } from '../api/client';
import { useCart } from '../context/CartContext';

export default function ChatbotWidget({ onRequireAuth }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      sender: 'bot',
      text: "Hey! 👋 I'm your UrbanCart AI Assistant. Ask me to find streetwear hoodies, sneakers under your budget, track orders, or explain UrbanCoins!",
      products: [],
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const { addToCart } = useCart();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const handleSend = async (textToSend) => {
    const msg = textToSend || input;
    if (!msg.trim()) return;

    const userMessage = { sender: 'user', text: msg };
    setMessages((prev) => [...prev, userMessage]);
    if (!textToSend) setInput('');
    setLoading(true);

    try {
      const res = await api.askChatbot(msg);
      setMessages((prev) => [
        ...prev,
        {
          sender: 'bot',
          text: res.reply || "I'm here to help with all your shopping needs!",
          products: res.products || [],
        }
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          sender: 'bot',
          text: "Sorry, I had a momentary connection glitch. Please try again!",
          products: [],
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Floating Launcher Button */}
      <div className="chatbot-launcher-wrap">
        {!isOpen && (
          <button
            onClick={() => setIsOpen(true)}
            className="chatbot-fab"
            aria-label="Open UrbanBot AI"
            onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.08)')}
            onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
          >
            <Sparkles size={21} strokeWidth={2.4} />
          </button>
        )}
      </div>

      {/* Chat Window Dialog */}
      {isOpen && (
        <div 
          className="animate-fade-in"
          style={{
            position: 'fixed',
            bottom: 16,
            right: 16,
            width: 'calc(100vw - 24px)',
            maxWidth: 380,
            height: 'min(560px, calc(100dvh - 32px))',
            borderRadius: 22,
            display: 'flex',
            flexDirection: 'column',
            zIndex: 100,
            background: 'var(--bg-card)',
            border: '1px solid var(--border-subtle)',
            boxShadow: '0 20px 50px rgba(15, 23, 42, 0.25)',
            overflow: 'hidden',
          }}
        >
          {/* Header */}
          <div style={{
            padding: '14px 18px',
            background: 'var(--bg-hero)',
            borderBottom: '1px solid var(--border-hero)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                width: 34,
                height: 34,
                borderRadius: 10,
                background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff',
                boxShadow: '0 4px 10px rgba(217, 119, 6, 0.25)'
              }}>
                <Bot size={18} />
              </div>
              <div>
                <div style={{ fontSize: '0.94rem', fontWeight: 800, color: 'var(--text-main)' }}>
                  UrbanBot AI
                </div>
                <div style={{ fontSize: '0.72rem', color: '#10b981', display: 'flex', alignItems: 'center', gap: 4, fontWeight: 700 }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981' }} />
                  Online Assistant
                </div>
              </div>
            </div>

            <button
              onClick={() => setIsOpen(false)}
              style={{ background: 'none', color: 'var(--text-dim)', cursor: 'pointer', padding: 4 }}
            >
              <X size={18} />
            </button>
          </div>

          {/* Quick Questions Pills */}
          <div style={{
            padding: '8px 12px',
            background: 'var(--bg-surface)',
            borderBottom: '1px solid var(--border-subtle)',
            display: 'flex',
            gap: 8,
            overflowX: 'auto',
          }} className="no-scrollbar">
            {['Shoes under ₹4000 👟', 'Track order #1 📦', 'What are UrbanCoins? 🪙'].map((chip, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(chip)}
                style={{
                  background: 'var(--bg-card)',
                  color: 'var(--text-main)',
                  fontSize: '0.72rem',
                  fontWeight: 600,
                  padding: '4px 10px',
                  borderRadius: 9999,
                  whiteSpace: 'nowrap',
                  border: '1px solid var(--border-strong)',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
                }}
              >
                {chip}
              </button>
            ))}
          </div>

          {/* Messages Scroll Area */}
          <div style={{ flex: 1, overflowY: 'auto', padding: 14, display: 'flex', flexDirection: 'column', gap: 12 }}>
            {messages.map((m, idx) => (
              <div
                key={idx}
                style={{
                  alignSelf: m.sender === 'user' ? 'flex-end' : 'flex-start',
                  maxWidth: '85%',
                }}
              >
                <div
                  style={{
                    padding: '10px 14px',
                    borderRadius: 14,
                    fontSize: '0.86rem',
                    lineHeight: 1.4,
                    whiteSpace: 'pre-wrap',
                    background: m.sender === 'user' ? 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' : 'var(--bg-surface)',
                    color: m.sender === 'user' ? '#ffffff' : 'var(--text-main)',
                    fontWeight: m.sender === 'user' ? 600 : 400,
                    border: m.sender === 'user' ? 'none' : '1px solid var(--border-subtle)',
                    boxShadow: m.sender === 'user' ? '0 4px 12px rgba(217, 119, 6, 0.25)' : 'none'
                  }}
                >
                  {m.text}
                </div>

                {/* Suggested Product Cards */}
                {m.products && m.products.length > 0 && (
                  <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {m.products.map((p) => (
                      <div
                        key={p.id}
                        style={{
                          background: 'var(--bg-surface)',
                          borderRadius: 10,
                          padding: 8,
                          border: '1px solid var(--border-subtle)',
                          boxShadow: '0 2px 6px rgba(0,0,0,0.04)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 8,
                        }}
                      >
                        <img
                          src={p.image_url}
                          alt={p.name}
                          loading="lazy"
                          style={{ width: 38, height: 38, borderRadius: 6, objectFit: 'cover' }}
                        />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-main)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {p.name}
                          </div>
                          <div style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--price-color)' }}>
                            ₹{Number(p.price).toLocaleString('en-IN')}
                          </div>
                        </div>
                        <button
                          onClick={async () => {
                            const res = await addToCart(p.id, 1);
                            if (res && res.authRequired && onRequireAuth) {
                              onRequireAuth();
                            }
                          }}
                          className="btn-gold"
                          style={{ padding: '4px 10px', fontSize: '0.72rem', borderRadius: 6 }}
                        >
                          Add
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {loading && (
              <div style={{ alignSelf: 'flex-start', background: 'var(--bg-surface)', padding: '8px 12px', borderRadius: 14, fontSize: '0.8rem', color: 'var(--text-dim)' }}>
                UrbanBot is typing...
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Footer */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            style={{
              padding: '10px 12px',
              borderTop: '1px solid var(--border-subtle)',
              background: 'var(--bg-surface)',
              display: 'flex',
              gap: 8,
            }}
          >
            <input
              type="text"
              placeholder="Ask anything..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              style={{
                flex: 1,
                background: 'var(--bg-card)',
                border: '1px solid var(--border-strong)',
                borderRadius: 10,
                padding: '8px 12px',
                color: 'var(--text-main)',
                fontSize: '0.86rem',
                outline: 'none',
              }}
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="btn-gold"
              style={{ width: 38, height: 38, padding: 0, borderRadius: 10 }}
            >
              <Send size={15} />
            </button>
          </form>

        </div>
      )}
    </>
  );
}
