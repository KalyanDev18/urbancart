import React, { useState } from 'react';
import { Mail, KeyRound, ArrowRight, ShieldCheck, Sparkles, CheckCircle2, Lock, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';

export default function LoginPage({ onLoginSuccess, onBackToStore }) {
  const { loginWithOtp, loginWithPassword } = useAuth();
  
  // Mode: 'otp' | 'password'
  const [activeTab, setActiveTab] = useState('otp');
  
  // OTP flow state
  const [otpStep, setOtpStep] = useState('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  
  // Password flow state
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [infoMessage, setInfoMessage] = useState('');

  // Send Email OTP
  const handleSendOtp = async (e) => {
    e.preventDefault();
    if (!email || !email.includes('@')) {
      setError('Please provide a valid email address.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const res = await api.sendOtp(email);
      setOtpStep('verify');
      setOtp('');
      setInfoMessage(`Verification code sent to ${email}. Please check your inbox (and Spam folder).`);
    } catch (err) {
      setError(err.message || 'Failed to send OTP code.');
    } finally {
      setLoading(false);
    }
  };

  // Verify Email OTP
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (!otp || otp.length < 4) {
      setError('Please enter the 6-digit code sent to your email.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await loginWithOtp(email, otp);
      if (onLoginSuccess) onLoginSuccess();
    } catch (err) {
      setError(err.message || 'Invalid or expired OTP code.');
    } finally {
      setLoading(false);
    }
  };

  // Password Login
  const handlePasswordLogin = async (e) => {
    e.preventDefault();
    if (!username || !password) {
      setError('Username and password are required.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await loginWithPassword(username, password);
      if (onLoginSuccess) onLoginSuccess();
    } catch (err) {
      setError(err.message || 'Invalid username or password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '16px',
      background: 'radial-gradient(circle at 10% 20%, rgba(245, 158, 11, 0.08) 0%, #f8fafc 90%)',
    }}>
      <div 
        className="login-split-card"
        style={{
          width: '100%',
          maxWidth: 980,
          borderRadius: 24,
          overflow: 'hidden',
          boxShadow: '0 20px 50px rgba(15, 23, 42, 0.08)',
          border: '1px solid #e2e8f0',
          background: '#ffffff'
        }}
      >
        {/* Left Stylio Brand Showcase Panel */}
        <div style={{
          background: 'linear-gradient(145deg, #fffdfa 0%, #fffbeb 50%, #fef3c7 100%)',
          padding: 'clamp(24px, 5vw, 44px)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          borderRight: '1px solid #fde68a',
          position: 'relative',
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
              <div style={{
                width: 42,
                height: 42,
                borderRadius: 12,
                background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff',
                fontWeight: 800,
                fontSize: '1.1rem',
                boxShadow: '0 4px 14px rgba(217, 119, 6, 0.3)'
              }}>
                UC
              </div>
              <div>
                <span style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f172a', display: 'block' }}>
                  Urban<span style={{ color: '#d97706' }}>Cart</span>
                </span>
                <span style={{ fontSize: '0.68rem', color: '#b45309', letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 700 }}>
                  Stylio Authentication
                </span>
              </div>
            </div>

            <div className="badge-gold" style={{ marginBottom: 16 }}>
              <Sparkles size={12} />
              Welcome to Exclusive Shopping
            </div>

            <h1 style={{ fontSize: 'clamp(1.6rem, 3.5vw, 2.1rem)', fontWeight: 800, color: '#0f172a', lineHeight: 1.2, marginBottom: 12 }}>
              Curated luxury fashion & high-tech streetwear.
            </h1>

            <p style={{ fontSize: '0.9rem', color: '#475569', lineHeight: 1.5, marginBottom: 20 }}>
              Sign in to manage your bag, track express orders in real-time, and earn instant UrbanCoins cash back on every purchase.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <CheckCircle2 size={17} color="#d97706" />
                <span style={{ fontSize: '0.86rem', color: '#1e293b', fontWeight: 600 }}>10% Instant Cash Back via UrbanCoins</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <CheckCircle2 size={17} color="#d97706" />
                <span style={{ fontSize: '0.86rem', color: '#1e293b', fontWeight: 600 }}>Express 2-3 Day Doorstep Delivery</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <CheckCircle2 size={17} color="#d97706" />
                <span style={{ fontSize: '0.86rem', color: '#1e293b', fontWeight: 600 }}>7-Day Easy Returns & Replacements</span>
              </div>
            </div>
          </div>

          <div style={{ marginTop: 24, paddingTop: 16, borderTop: '1px solid rgba(217, 119, 6, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.76rem', color: '#64748b' }}>
              🔒 256-Bit SSL Encrypted
            </span>
            <button
              onClick={onBackToStore}
              style={{ background: 'none', color: '#d97706', fontSize: '0.84rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}
            >
              Back to Store ➔
            </button>
          </div>
        </div>

        {/* Right Form Panel */}
        <div style={{ padding: 'clamp(24px, 5vw, 40px)', background: '#ffffff', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          
          {/* Navigation Tabs */}
          <div style={{
            display: 'flex',
            background: '#f1f5f9',
            padding: 4,
            borderRadius: 14,
            border: '1px solid #e2e8f0',
            marginBottom: 24,
          }}>
            <button
              onClick={() => { setActiveTab('otp'); setError(''); }}
              style={{
                flex: 1,
                padding: '9px 12px',
                borderRadius: 10,
                fontSize: '0.85rem',
                fontWeight: 700,
                background: activeTab === 'otp' ? 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' : 'none',
                color: activeTab === 'otp' ? '#ffffff' : '#64748b',
                boxShadow: activeTab === 'otp' ? '0 4px 12px rgba(217, 119, 6, 0.25)' : 'none',
                transition: 'all 0.2s',
              }}
            >
              Email OTP
            </button>
            <button
              onClick={() => { setActiveTab('password'); setError(''); }}
              style={{
                flex: 1,
                padding: '9px 12px',
                borderRadius: 10,
                fontSize: '0.85rem',
                fontWeight: 700,
                background: activeTab === 'password' ? 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' : 'none',
                color: activeTab === 'password' ? '#ffffff' : '#64748b',
                boxShadow: activeTab === 'password' ? '0 4px 12px rgba(217, 119, 6, 0.25)' : 'none',
                transition: 'all 0.2s',
              }}
            >
              Password Login
            </button>
          </div>

          {/* Feedback Messages */}
          {error && (
            <div style={{
              background: '#fef2f2',
              border: '1px solid #fecaca',
              color: '#dc2626',
              padding: '10px 14px',
              borderRadius: 12,
              fontSize: '0.86rem',
              marginBottom: 16,
              fontWeight: 500,
            }}>
              {error}
            </div>
          )}

          {infoMessage && (
            <div style={{
              background: '#fffbeb',
              border: '1px solid #fde68a',
              color: '#b45309',
              padding: '10px 14px',
              borderRadius: 12,
              fontSize: '0.86rem',
              marginBottom: 16,
              fontWeight: 500,
            }}>
              {infoMessage}
            </div>
          )}

          {/* TAB 1: EMAIL OTP FLOW */}
          {activeTab === 'otp' && (
            <div>
              {otpStep === 'email' ? (
                <form onSubmit={handleSendOtp} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.84rem', color: '#1e293b', fontWeight: 700, marginBottom: 6 }}>
                      Enter your Email Address
                    </label>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      background: '#ffffff',
                      border: '1px solid #cbd5e1',
                      borderRadius: 12,
                      padding: '10px 14px',
                    }}>
                      <Mail size={17} color="#d97706" style={{ marginRight: 10 }} />
                      <input
                        type="email"
                        required
                        placeholder="you@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#0f172a',
                          outline: 'none',
                          width: '100%',
                          fontSize: '0.92rem',
                          fontFamily: 'inherit'
                        }}
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="btn-gold"
                    style={{ width: '100%', padding: '12px', fontSize: '0.96rem', marginTop: 6 }}
                  >
                    {loading ? 'Sending Code...' : 'Send Login OTP'}
                    <ArrowRight size={17} />
                  </button>

                  <p style={{ fontSize: '0.78rem', color: '#64748b', textAlign: 'center', marginTop: 6 }}>
                    We'll email you a secure 6-digit code. New customers are registered automatically!
                  </p>
                </form>
              ) : (
                <form onSubmit={handleVerifyOtp} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                      <label style={{ fontSize: '0.84rem', color: '#1e293b', fontWeight: 700 }}>
                        Enter 6-Digit OTP
                      </label>
                      <button
                        type="button"
                        onClick={() => setOtpStep('email')}
                        style={{ background: 'none', color: '#d97706', fontSize: '0.76rem', cursor: 'pointer', fontWeight: 600 }}
                      >
                        Change ({email})
                      </button>
                    </div>

                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      background: '#ffffff',
                      border: '1px solid #cbd5e1',
                      borderRadius: 12,
                      padding: '10px 14px',
                    }}>
                      <KeyRound size={17} color="#d97706" style={{ marginRight: 10 }} />
                      <input
                        type="text"
                        maxLength={6}
                        required
                        placeholder="123456"
                        value={otp}
                        onChange={(e) => setOtp(e.target.value)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#0f172a',
                          outline: 'none',
                          width: '100%',
                          fontSize: '1.15rem',
                          letterSpacing: '0.25em',
                          fontWeight: 700,
                          fontFamily: 'inherit'
                        }}
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="btn-gold"
                    style={{ width: '100%', padding: '12px', fontSize: '0.96rem', marginTop: 6 }}
                  >
                    {loading ? 'Verifying...' : 'Verify Code & Sign In'}
                    <ArrowRight size={17} />
                  </button>
                </form>
              )}
            </div>
          )}

          {/* TAB 2: PASSWORD LOGIN */}
          {activeTab === 'password' && (
            <form onSubmit={handlePasswordLogin} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.84rem', color: '#1e293b', fontWeight: 700, marginBottom: 6 }}>
                  Username or Email
                </label>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  background: '#ffffff',
                  border: '1px solid #cbd5e1',
                  borderRadius: 12,
                  padding: '10px 14px',
                }}>
                  <User size={17} color="#d97706" style={{ marginRight: 10 }} />
                  <input
                    type="text"
                    required
                    placeholder="Enter username or email"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#0f172a',
                      outline: 'none',
                      width: '100%',
                      fontSize: '0.92rem',
                      fontFamily: 'inherit'
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.84rem', color: '#1e293b', fontWeight: 700, marginBottom: 6 }}>
                  Password
                </label>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  background: '#ffffff',
                  border: '1px solid #cbd5e1',
                  borderRadius: 12,
                  padding: '10px 14px',
                }}>
                  <Lock size={17} color="#d97706" style={{ marginRight: 10 }} />
                  <input
                    type="password"
                    required
                    placeholder="Enter password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#0f172a',
                      outline: 'none',
                      width: '100%',
                      fontSize: '0.92rem',
                      fontFamily: 'inherit'
                    }}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-gold"
                style={{ width: '100%', padding: '12px', fontSize: '0.96rem', marginTop: 6 }}
              >
                {loading ? 'Authenticating...' : 'Sign In with Password'}
                <ArrowRight size={17} />
              </button>
            </form>
          )}

        </div>
      </div>
    </div>
  );
}
