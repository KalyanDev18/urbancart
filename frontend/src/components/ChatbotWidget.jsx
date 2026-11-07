import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, Sparkles, Bot, ShoppingBag, ArrowRight } from 'lucide-react';
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
      <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 90 }}>
        {!isOpen && (
          <button
            onClick={() => setIsOpen(true)}
            style={{
              width: 58,
              height: 58,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
              color: '#090d16',
              boxShadow: '0 8px 30px rgba(245, 158, 11, 0.45)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              border: '2px solid rgba(255, 255, 255, 0.2)',
              transition: 'transform 0.25s ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.08)')}
            onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
          >
            <Sparkles size={26} strokeWidth={2.4} />
          </button>
        )}
      </div>

      {/* Chat Window Dialog */}
      {isOpen && (
        <div 
          className="glass animate-fade-in"
          style={{
            position: 'fixed',
            bottom: 24,
            right: 24,
            width: 380,
            maxWidth: 'calc(100vw - 32px)',
            height: 560,
            maxHeight: 'calc(100vh - 48px)',
            borderRadius: 24,
            display: 'flex',
            flexDirection: 'column',
            zIndex: 100,
            background: '#0d1322',
            border: '1px solid rgba(245, 158, 11, 0.3)',
            boxShadow: '0 20px 50px rgba(0, 0, 0, 0.7)',
            overflow: 'hidden',
          }}
        >
          {/* Header */}
          <div style={{
            padding: '16px 20px',
            background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                background: '#f59e0b',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#090d16'
              }}>
                <Bot size={20} />
              </div>
              <div>
                <div style={{ fontSize: '0.96rem', fontWeight: 800, color: '#f8fafc' }}>
                  UrbanBot AI
                </div>
                <div style={{ fontSize: '0.72rem', color: '#10b981', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981' }} />
                  Online Shopping Assistant
                </div>
              </div>
            </div>

            <button
              onClick={() => setIsOpen(false)}
              style={{ background: 'none', color: '#94a3b8', cursor: 'pointer', padding: 4 }}
            >
              <X size={20} />
            </button>
          </div>

          {/* Quick Questions Pills */}
          <div style={{
            padding: '10px 14px',
            background: '#090d16',
            borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
            display: 'flex',
            gap: 8,
            overflowX: 'auto',
          }} className="no-scrollbar">
            {['Shoes under ₹4000 👟', 'Track order #1 📦', 'What are UrbanCoins? 🪙'].map((chip, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(chip)}
                style={{
                  background: '#1e293b',
                  color: '#cbd5e1',
                  fontSize: '0.74rem',
                  padding: '4px 10px',
                  borderRadius: 9999,
                  whiteSpace: 'nowrap',
                  border: '1px solid rgba(255, 255, 255, 0.06)'
                }}
              >
                {chip}
              </button>
            ))}
          </div>

          {/* Messages Scroll Area */}
          <div style={{ flex: 1, overflowY: 'auto', padding: 16, display: 'flex', flexDirection: 'column', gap: 14 }}>
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
                    padding: '12px 16px',
                    borderRadius: 16,
                    fontSize: '0.88rem',
                    lineHeight: 1.45,
                    whiteSpace: 'pre-wrap',
                    background: m.sender === 'user' ? 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' : '#1e293b',
                    color: m.sender === 'user' ? '#090d16' : '#f8fafc',
                    fontWeight: m.sender === 'user' ? 600 : 400,
                    border: m.sender === 'user' ? 'none' : '1px solid rgba(255, 255, 255, 0.06)',
                  }}
                >
                  {m.text}
                </div>

                {/* Suggested Product Cards */}
                {m.products && m.products.length > 0 && (
                  <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {m.products.map((p) => (
                      <div
                        key={p.id}
                        style={{
                          background: '#090d16',
                          borderRadius: 12,
                          padding: 10,
                          border: '1px solid rgba(245, 158, 11, 0.2)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 10,
                        }}
                      >
                        <img
                          src={p.image_url}
                          alt={p.name}
                          style={{ width: 44, height: 44, borderRadius: 8, objectFit: 'cover' }}
                        />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#f8fafc', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {p.name}
                          </div>
                          <div style={{ fontSize: '0.82rem', fontWeight: 800, color: '#fbbf24' }}>
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
                          style={{ padding: '6px 10px', fontSize: '0.72rem', borderRadius: 8 }}
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
              <div style={{ alignSelf: 'flex-start', background: '#1e293b', padding: '10px 14px', borderRadius: 16, fontSize: '0.82rem', color: '#94a3b8' }}>
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
              padding: '12px 14px',
              borderTop: '1px solid rgba(255, 255, 255, 0.08)',
              background: '#0f172a',
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
                background: '#090d16',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: 12,
                padding: '10px 14px',
                color: '#f8fafc',
                fontSize: '0.88rem',
                outline: 'none',
              }}
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="btn-gold"
              style={{ width: 42, height: 42, padding: 0, borderRadius: 12 }}
            >
              <Send size={16} />
            </button>
          </form>

        </div>
      )}
    </>
  );
}
