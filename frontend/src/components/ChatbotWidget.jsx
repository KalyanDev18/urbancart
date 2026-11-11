import React, { useState, useRef, useEffect } from 'react';
import { X, Send, Sparkles, Bot, Headphones, ArrowRight, CheckCircle2 } from 'lucide-react';
import { api } from '../api/client';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';

export default function ChatbotWidget({ onRequireAuth, onOpenDashboard }) {
  const { isAuthenticated } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [ticketMode, setTicketMode] = useState(false);
  const [issueType, setIssueType] = useState('REFUND');
  const [ticketSubject, setTicketSubject] = useState('');
  const [ticketMsg, setTicketMsg] = useState('');
  const [ticketBusy, setTicketBusy] = useState(false);
  const [messages, setMessages] = useState([
    {
      sender: 'bot',
      text: "Hey! 👋 I'm your UrbanCart Care & AI Assistant. Ask me to find drops, track/cancel/return orders, check refunds, or raise a Support Ticket!",
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
    if (isOpen && !ticketMode) {
      scrollToBottom();
    }
  }, [messages, isOpen, ticketMode]);

  const handleSend = async (textToSend) => {
    const msg = textToSend || input;
    if (!msg.trim()) return;

    setTicketMode(false);
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
          text: res.reply || "I'm here to help with all your shopping & support needs!",
          products: res.products || [],
          action: res.action || null,
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

  const handleTicketSubmit = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      setIsOpen(false);
      if (onRequireAuth) onRequireAuth();
      return;
    }
    if (!ticketSubject.trim() || !ticketMsg.trim()) return;
    setTicketBusy(true);
    try {
      const res = await api.createSupportTicket({
        issue_type: issueType,
        subject: ticketSubject.trim(),
        message: ticketMsg.trim(),
      });
      const created = res?.ticket;
      setTicketMode(false);
      setTicketSubject('');
      setTicketMsg('');
      setMessages((prev) => [
        ...prev,
        {
          sender: 'bot',
          text: `✅ Support Ticket #${created?.id || 'NEW'} logged!\n${created?.admin_reply || 'Our UrbanCart Care team will update you within 2–4 hours.'}`,
          products: [],
          action: 'open_support',
        }
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          sender: 'bot',
          text: `⚠️ ${err.message || 'Could not submit support ticket. Please try again.'}`,
          products: [],
        }
      ]);
      setTicketMode(false);
    } finally {
      setTicketBusy(false);
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
            aria-label="Open UrbanBot AI & Support"
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
            padding: '12px 16px',
            background: 'var(--bg-hero)',
            borderBottom: '1px solid var(--border-hero)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 8,
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
                {ticketMode ? <Headphones size={18} /> : <Bot size={18} />}
              </div>
              <div>
                <div style={{ fontSize: '0.92rem', fontWeight: 800, color: 'var(--text-main)' }}>
                  UrbanBot Care &amp; AI
                </div>
                <div style={{ fontSize: '0.7rem', color: '#10b981', display: 'flex', alignItems: 'center', gap: 4, fontWeight: 700 }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981' }} />
                  Cancel • Return • Live Care
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <button
                type="button"
                onClick={() => setTicketMode(!ticketMode)}
                style={{
                  background: ticketMode ? '#d97706' : 'var(--badge-bg)',
                  color: ticketMode ? '#ffffff' : 'var(--badge-text)',
                  border: '1px solid var(--badge-border)',
                  borderRadius: 9999,
                  padding: '4px 10px',
                  fontSize: '0.7rem',
                  fontWeight: 800,
                }}
              >
                {ticketMode ? 'Back to Chat' : '+ Ticket'}
              </button>
              <button
                onClick={() => setIsOpen(false)}
                style={{ background: 'none', color: 'var(--text-dim)', cursor: 'pointer', padding: 4 }}
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Quick Questions Pills */}
          {!ticketMode && (
            <div style={{
              padding: '8px 12px',
              background: 'var(--bg-surface)',
              borderBottom: '1px solid var(--border-subtle)',
              display: 'flex',
              gap: 8,
              overflowX: 'auto',
            }} className="no-scrollbar">
              {['Track my order 📦', 'Cancel / Return order 🔄', 'Refund status 💰', 'Talk to Support 🎧'].map((chip, idx) => (
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
          )}

          {/* Support Ticket Inline Mode */}
          {ticketMode ? (
            <div style={{ flex: 1, overflowY: 'auto', padding: 16 }}>
              {!isAuthenticated ? (
                <div style={{ textAlign: 'center', padding: '36px 12px' }}>
                  <Headphones size={36} color="#d97706" style={{ margin: '0 auto 12px' }} />
                  <h4 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: 6 }}>
                    Sign In for Priority Support
                  </h4>
                  <p style={{ fontSize: '0.82rem', color: 'var(--text-dim)', marginBottom: 16 }}>
                    Sign in with OTP or password to raise tickets linked to your orders &amp; refunds.
                  </p>
                  <button
                    onClick={() => {
                      setIsOpen(false);
                      if (onRequireAuth) onRequireAuth();
                    }}
                    className="btn-gold"
                    style={{ width: '100%', padding: '10px' }}
                  >
                    Sign In Now
                  </button>
                </div>
              ) : (
                <form onSubmit={handleTicketSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div style={{ fontSize: '0.88rem', fontWeight: 800, color: 'var(--text-main)' }}>
                    Raise Customer Care Ticket
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: 4 }}>
                      Issue Category
                    </label>
                    <select
                      value={issueType}
                      onChange={(e) => setIssueType(e.target.value)}
                      style={{
                        width: '100%',
                        background: 'var(--bg-surface)',
                        border: '1px solid var(--border-strong)',
                        borderRadius: 10,
                        padding: '9px 10px',
                        color: 'var(--text-main)',
                        fontSize: '0.84rem',
                      }}
                    >
                      <option value="REFUND">Refund Status / Delay</option>
                      <option value="CANCEL">Order Cancellation</option>
                      <option value="RETURN">Return / Replacement</option>
                      <option value="DELIVERY">Delivery &amp; Tracking</option>
                      <option value="OTHER">General Help</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: 4 }}>
                      Subject
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Refund status for Order #12"
                      value={ticketSubject}
                      onChange={(e) => setTicketSubject(e.target.value)}
                      style={{
                        width: '100%',
                        background: 'var(--bg-surface)',
                        border: '1px solid var(--border-strong)',
                        borderRadius: 10,
                        padding: '9px 10px',
                        color: 'var(--text-main)',
                        fontSize: '0.84rem',
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: 4 }}>
                      Describe Your Issue
                    </label>
                    <textarea
                      rows={4}
                      required
                      placeholder="Share your order number and how our care team can help..."
                      value={ticketMsg}
                      onChange={(e) => setTicketMsg(e.target.value)}
                      style={{
                        width: '100%',
                        background: 'var(--bg-surface)',
                        border: '1px solid var(--border-strong)',
                        borderRadius: 10,
                        padding: '9px 10px',
                        color: 'var(--text-main)',
                        fontSize: '0.84rem',
                        fontFamily: 'inherit',
                        resize: 'none',
                      }}
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={ticketBusy}
                    className="btn-gold"
                    style={{ width: '100%', padding: '11px', fontSize: '0.88rem' }}
                  >
                    <CheckCircle2 size={16} />
                    {ticketBusy ? 'Submitting Ticket...' : 'Submit Support Ticket'}
                  </button>
                </form>
              )}
            </div>
          ) : (
            <>
              {/* Messages Scroll Area */}
              <div style={{ flex: 1, overflowY: 'auto', padding: 14, display: 'flex', flexDirection: 'column', gap: 12 }}>
                {messages.map((m, idx) => (
                  <div
                    key={idx}
                    style={{
                      alignSelf: m.sender === 'user' ? 'flex-end' : 'flex-start',
                      maxWidth: '88%',
                    }}
                  >
                    <div
                      style={{
                        padding: '10px 14px',
                        borderRadius: 14,
                        fontSize: '0.85rem',
                        lineHeight: 1.45,
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

                    {/* Action Shortcuts */}
                    {m.action === 'open_orders' && (
                      <div style={{ marginTop: 6, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        <button
                          onClick={() => {
                            setIsOpen(false);
                            if (!isAuthenticated && onRequireAuth) onRequireAuth();
                            else if (onOpenDashboard) onOpenDashboard('orders');
                          }}
                          className="btn-dark"
                          style={{ padding: '5px 10px', fontSize: '0.74rem', borderRadius: 8 }}
                        >
                          Manage Orders (Cancel / Return)
                          <ArrowRight size={13} />
                        </button>
                      </div>
                    )}

                    {m.action === 'open_support' && (
                      <div style={{ marginTop: 6, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        <button
                          onClick={() => setTicketMode(true)}
                          className="btn-gold"
                          style={{ padding: '5px 10px', fontSize: '0.74rem', borderRadius: 8 }}
                        >
                          <Headphones size={13} />
                          Raise Support Ticket
                        </button>
                        {isAuthenticated && onOpenDashboard && (
                          <button
                            onClick={() => {
                              setIsOpen(false);
                              onOpenDashboard('support');
                            }}
                            className="btn-dark"
                            style={{ padding: '5px 10px', fontSize: '0.74rem', borderRadius: 8 }}
                          >
                            View Tickets
                          </button>
                        )}
                      </div>
                    )}

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
                  placeholder="Ask to cancel, return, track or shop..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  style={{
                    flex: 1,
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-strong)',
                    borderRadius: 10,
                    padding: '8px 12px',
                    color: 'var(--text-main)',
                    fontSize: '0.85rem',
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
            </>
          )}

        </div>
      )}
    </>
  );
}
