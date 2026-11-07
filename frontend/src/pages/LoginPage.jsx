import React, { useState } from 'react';
import { Mail, KeyRound, ArrowRight, ShieldCheck, Sparkles, CheckCircle2, Lock, User, RefreshCw } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';

export default function LoginPage({ onLoginSuccess, onBackToStore }) {
  const { loginWithOtp, loginWithPassword, registerUser } = useAuth();
  
  // Mode: 'otp' | 'password' | 'register'
  const [activeTab, setActiveTab] = useState('otp');
  
  // OTP flow state
  const [otpStep, setOtpStep] = useState('email'); // 'email' | 'verify'
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  
  // Password flow state
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  
  // Register flow state
  const [regFullName, setRegFullName] = useState('');
  const [regUsername, setRegUsername] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');

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
      setInfoMessage(`Verification code sent to ${email}. Please check your inbox.`);
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

  // Register New User
  const handleRegister = async (e) => {
    e.preventDefault();
    if (!regUsername || !regPassword) {
      setError('Username and password are required.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await registerUser({
        username: regUsername,
        email: regEmail,
        password: regPassword,
        full_name: regFullName,
      });
      if (onLoginSuccess) onLoginSuccess();
    } catch (err) {
      setError(err.message || 'Registration failed.');
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
      padding: 20,
      background: 'radial-gradient(circle at 10% 20%, rgba(245, 158, 11, 0.08) 0%, #090d16 90%)',
    }}>
      <div 
        className="glass"
        style={{
          width: '100%',
          maxWidth: 1040,
          borderRadius: 28,
          overflow: 'hidden',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.7)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
        }}
      >
        {/* Left Stylio Brand Showcase Panel */}
        <div style={{
          background: 'linear-gradient(145deg, #0f172a 0%, #090d16 100%)',
          padding: '48px 40px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          borderRight: '1px solid rgba(255, 255, 255, 0.06)',
          position: 'relative',
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 28 }}>
              <div style={{
                width: 44,
                height: 44,
                borderRadius: 14,
                background: 'linear-gradient(135deg, #f59e0b 0%, #b45309 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#090d16',
                fontWeight: 800,
                fontSize: '1.2rem',
                boxShadow: '0 4px 16px rgba(245, 158, 11, 0.4)'
              }}>
                UC
              </div>
              <div>
                <span style={{ fontSize: '1.5rem', fontWeight: 800, color: '#f8fafc', display: 'block' }}>
                  Urban<span style={{ color: '#f59e0b' }}>Cart</span>
                </span>
                <span style={{ fontSize: '0.72rem', color: '#94a3b8', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                  Stylio Authentication
                </span>
              </div>
            </div>

            <div className="badge-gold" style={{ marginBottom: 20 }}>
              <Sparkles size={12} />
              Welcome to Exclusive Shopping
            </div>

            <h1 style={{ fontSize: '2.2rem', fontWeight: 800, color: '#f8fafc', lineHeight: 1.2, marginBottom: 16 }}>
              Curated luxury fashion & high-tech streetwear.
            </h1>

            <p style={{ fontSize: '0.94rem', color: '#94a3b8', lineHeight: 1.6, marginBottom: 24 }}>
              Sign in to manage your bag, track express orders in real-time, and earn instant UrbanCoins cash back on every purchase.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <CheckCircle2 size={18} color="#f59e0b" />
                <span style={{ fontSize: '0.88rem', color: '#cbd5e1' }}>10% Instant Cash Back via UrbanCoins</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <CheckCircle2 size={18} color="#f59e0b" />
                <span style={{ fontSize: '0.88rem', color: '#cbd5e1' }}>Express 2-3 Day Doorstep Delivery</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <CheckCircle2 size={18} color="#f59e0b" />
                <span style={{ fontSize: '0.88rem', color: '#cbd5e1' }}>7-Day Hassle-Free Returns & Replacements</span>
              </div>
            </div>
          </div>

          <div style={{ marginTop: 36, paddingTop: 20, borderTop: '1px solid rgba(255, 255, 255, 0.08)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
              🔒 256-Bit SSL Encrypted & Verified
            </span>
            <button
              onClick={onBackToStore}
              style={{ background: 'none', color: '#f59e0b', fontSize: '0.84rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}
            >
              Back to Store ➔
            </button>
          </div>
        </div>

        {/* Right Form Panel */}
        <div style={{ padding: '48px 40px', background: '#090d16', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          
          {/* Navigation Tabs */}
          <div style={{
            display: 'flex',
            background: '#0f172a',
            padding: 4,
            borderRadius: 14,
            border: '1px solid rgba(255, 255, 255, 0.08)',
            marginBottom: 28,
          }}>
            <button
              onClick={() => { setActiveTab('otp'); setError(''); }}
              style={{
                flex: 1,
                padding: '10px 14px',
                borderRadius: 10,
                fontSize: '0.85rem',
                fontWeight: 700,
                background: activeTab === 'otp' ? 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' : 'none',
                color: activeTab === 'otp' ? '#090d16' : '#94a3b8',
                transition: 'all 0.2s',
              }}
            >
              Email OTP
            </button>
            <button
              onClick={() => { setActiveTab('password'); setError(''); }}
              style={{
                flex: 1,
                padding: '10px 14px',
                borderRadius: 10,
                fontSize: '0.85rem',
                fontWeight: 700,
                background: activeTab === 'password' ? 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' : 'none',
                color: activeTab === 'password' ? '#090d16' : '#94a3b8',
                transition: 'all 0.2s',
              }}
            >
              Password Login
            </button>
          </div>

          {/* Feedback Messages */}
          {error && (
            <div style={{
              background: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              color: '#fca5a5',
              padding: '12px 16px',
              borderRadius: 12,
              fontSize: '0.88rem',
              marginBottom: 20,
            }}>
              {error}
            </div>
          )}

          {infoMessage && (
            <div style={{
              background: 'rgba(245, 158, 11, 0.15)',
              border: '1px solid rgba(245, 158, 11, 0.3)',
              color: '#fbbf24',
              padding: '12px 16px',
              borderRadius: 12,
              fontSize: '0.88rem',
              marginBottom: 20,
            }}>
              {infoMessage}
            </div>
          )}

          {/* TAB 1: EMAIL OTP FLOW */}
          {activeTab === 'otp' && (
            <div>
              {otpStep === 'email' ? (
                <form onSubmit={handleSendOtp} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.86rem', color: '#cbd5e1', fontWeight: 600, marginBottom: 8 }}>
                      Enter your Email Address
                    </label>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      background: '#0f172a',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: 14,
                      padding: '12px 16px',
                    }}>
                      <Mail size={18} color="#f59e0b" style={{ marginRight: 12 }} />
                      <input
                        type="email"
                        required
                        placeholder="you@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#f8fafc',
                          outline: 'none',
                          width: '100%',
                          fontSize: '0.95rem',
                          fontFamily: 'inherit'
                        }}
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="btn-gold"
                    style={{ width: '100%', padding: '14px', fontSize: '1rem', marginTop: 10 }}
                  >
                    {loading ? 'Sending Code...' : 'Send Login OTP'}
                    <ArrowRight size={18} />
                  </button>

                  <p style={{ fontSize: '0.8rem', color: '#64748b', textAlign: 'center', marginTop: 10 }}>
                    We'll email you a secure 6-digit code. New customers are registered automatically!
                  </p>
                </form>
              ) : (
                <form onSubmit={handleVerifyOtp} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                      <label style={{ fontSize: '0.86rem', color: '#cbd5e1', fontWeight: 600 }}>
                        Enter 6-Digit OTP
                      </label>
                      <button
                        type="button"
                        onClick={() => setOtpStep('email')}
                        style={{ background: 'none', color: '#f59e0b', fontSize: '0.78rem', cursor: 'pointer' }}
                      >
                        Change Email ({email})
                      </button>
                    </div>

                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      background: '#0f172a',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: 14,
                      padding: '12px 16px',
                    }}>
                      <KeyRound size={18} color="#f59e0b" style={{ marginRight: 12 }} />
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
                          color: '#f8fafc',
                          outline: 'none',
                          width: '100%',
                          fontSize: '1.2rem',
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
                    style={{ width: '100%', padding: '14px', fontSize: '1rem', marginTop: 10 }}
                  >
                    {loading ? 'Verifying...' : 'Verify Code & Sign In'}
                    <ArrowRight size={18} />
                  </button>
                </form>
              )}
            </div>
          )}

          {/* TAB 2: PASSWORD LOGIN */}
          {activeTab === 'password' && (
            <form onSubmit={handlePasswordLogin} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.86rem', color: '#cbd5e1', fontWeight: 600, marginBottom: 8 }}>
                  Username or Email
                </label>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  background: '#0f172a',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: 14,
                  padding: '12px 16px',
                }}>
                  <User size={18} color="#f59e0b" style={{ marginRight: 12 }} />
                  <input
                    type="text"
                    required
                    placeholder="Enter username or email"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#f8fafc',
                      outline: 'none',
                      width: '100%',
                      fontSize: '0.95rem',
                      fontFamily: 'inherit'
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.86rem', color: '#cbd5e1', fontWeight: 600, marginBottom: 8 }}>
                  Password
                </label>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  background: '#0f172a',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: 14,
                  padding: '12px 16px',
                }}>
                  <Lock size={18} color="#f59e0b" style={{ marginRight: 12 }} />
                  <input
                    type="password"
                    required
                    placeholder="Enter password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#f8fafc',
                      outline: 'none',
                      width: '100%',
                      fontSize: '0.95rem',
                      fontFamily: 'inherit'
                    }}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-gold"
                style={{ width: '100%', padding: '14px', fontSize: '1rem', marginTop: 10 }}
              >
                {loading ? 'Authenticating...' : 'Sign In with Password'}
                <ArrowRight size={18} />
              </button>
            </form>
          )}

        </div>
      </div>
    </div>
  );
}
