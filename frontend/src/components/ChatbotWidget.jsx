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
      <div style={{ position: 'fixed', bottom: 20, right: 20, zIndex: 90 }}>
        {!isOpen && (
          <button
            onClick={() => setIsOpen(true)}
            style={{
              width: 54,
              height: 54,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
              color: '#ffffff',
              boxShadow: '0 6px 24px rgba(217, 119, 6, 0.35)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              border: '2px solid #ffffff',
              transition: 'transform 0.25s ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.08)')}
            onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
          >
            <Sparkles size={24} strokeWidth={2.4} />
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
            width: 'calc(100vw - 32px)',
            maxWidth: 380,
            height: 'calc(100vh - 40px)',
            maxHeight: 560,
            borderRadius: 24,
            display: 'flex',
            flexDirection: 'column',
            zIndex: 100,
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            boxShadow: '0 20px 50px rgba(15, 23, 42, 0.15)',
            overflow: 'hidden',
          }}
        >
          {/* Header */}
          <div style={{
            padding: '14px 18px',
            background: 'linear-gradient(135deg, #fffdfa 0%, #fffbeb 50%, #fef3c7 100%)',
            borderBottom: '1px solid #fde68a',
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
                <div style={{ fontSize: '0.94rem', fontWeight: 800, color: '#0f172a' }}>
                  UrbanBot AI
                </div>
                <div style={{ fontSize: '0.72rem', color: '#059669', display: 'flex', alignItems: 'center', gap: 4, fontWeight: 700 }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#059669' }} />
                  Online Assistant
                </div>
              </div>
            </div>

            <button
              onClick={() => setIsOpen(false)}
              style={{ background: 'none', color: '#64748b', cursor: 'pointer', padding: 4 }}
            >
              <X size={18} />
            </button>
          </div>

          {/* Quick Questions Pills */}
          <div style={{
            padding: '8px 12px',
            background: '#f8fafc',
            borderBottom: '1px solid #e2e8f0',
            display: 'flex',
            gap: 8,
            overflowX: 'auto',
          }} className="no-scrollbar">
            {['Shoes under ₹4000 👟', 'Track order #1 📦', 'What are UrbanCoins? 🪙'].map((chip, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(chip)}
                style={{
                  background: '#ffffff',
                  color: '#1e293b',
                  fontSize: '0.72rem',
                  fontWeight: 600,
                  padding: '4px 10px',
                  borderRadius: 9999,
                  whiteSpace: 'nowrap',
                  border: '1px solid #cbd5e1',
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
                    background: m.sender === 'user' ? 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' : '#f1f5f9',
                    color: m.sender === 'user' ? '#ffffff' : '#0f172a',
                    fontWeight: m.sender === 'user' ? 600 : 400,
                    border: m.sender === 'user' ? 'none' : '1px solid #e2e8f0',
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
                          background: '#ffffff',
                          borderRadius: 10,
                          padding: 8,
                          border: '1px solid #e2e8f0',
                          boxShadow: '0 2px 6px rgba(0,0,0,0.04)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 8,
                        }}
                      >
                        <img
                          src={p.image_url}
                          alt={p.name}
                          style={{ width: 38, height: 38, borderRadius: 6, objectFit: 'cover' }}
                        />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {p.name}
                          </div>
                          <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#b45309' }}>
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
              <div style={{ alignSelf: 'flex-start', background: '#f1f5f9', padding: '8px 12px', borderRadius: 14, fontSize: '0.8rem', color: '#64748b' }}>
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
              borderTop: '1px solid #e2e8f0',
              background: '#f8fafc',
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
                background: '#ffffff',
                border: '1px solid #cbd5e1',
                borderRadius: 10,
                padding: '8px 12px',
                color: '#0f172a',
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
