import React, { useState } from 'react';
import { Mail, Lock, User, Phone, KeyRound, ArrowRight, CheckCircle2, AlertCircle, RefreshCw, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';

// Official Google 4-Color "G" Icon
const GoogleIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
  </svg>
);

export default function LoginPage({ onLoginSuccess, onBackToStore }) {
  const { loginWithOtp, loginWithPassword, loginWithGoogle, registerUser } = useAuth();

  // Active Flow: 'login' | 'register' | 'otp'
  const [authMode, setAuthMode] = useState('login');

  // Form Fields
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [referralCode, setReferralCode] = useState('');

  // OTP Verification state
  const [otpStep, setOtpStep] = useState('email'); // 'email' | 'verify'
  const [otp, setOtp] = useState('');
  const [resendTimer, setResendTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);

  // Status feedback
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [infoMessage, setInfoMessage] = useState('');

  // Countdown timer for OTP resend
  React.useEffect(() => {
    let interval = null;
    if (authMode === 'otp' && otpStep === 'verify' && resendTimer > 0) {
      interval = setInterval(() => setResendTimer((prev) => prev - 1), 1000);
    } else if (resendTimer === 0) {
      setCanResend(true);
      if (interval) clearInterval(interval);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [authMode, otpStep, resendTimer]);

  const switchMode = (mode) => {
    setAuthMode(mode);
    setError('');
    setInfoMessage('');
    if (mode === 'otp') {
      setOtpStep('email');
      setOtp('');
    }
  };

  // 1. Password Login
  const handlePasswordLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Email and password are required.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await loginWithPassword(email, password);
      if (onLoginSuccess) onLoginSuccess();
    } catch (err) {
      setError(err.message || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  // 2. User Registration
  const handleRegister = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Email and password are required.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await registerUser({
        full_name: fullName,
        email: email,
        password: password,
        phone: phone,
      });
      if (onLoginSuccess) onLoginSuccess();
    } catch (err) {
      setError(err.message || 'Registration failed. This email may already be in use.');
    } finally {
      setLoading(false);
    }
  };

  // 3. Send Email OTP
  const handleSendOtp = async (e) => {
    if (e) e.preventDefault();
    if (!email || !email.includes('@')) {
      setError('Please provide a valid email address.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await api.sendOtp(email);
      setOtpStep('verify');
      setOtp('');
      setResendTimer(60);
      setCanResend(false);
      setInfoMessage(`Verification code sent to ${email}! Please check your inbox (and Spam folder).`);
    } catch (err) {
      setError(err.message || 'Failed to dispatch OTP code.');
    } finally {
      setLoading(false);
    }
  };

  // 4. Verify Email OTP
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (!otp || otp.length < 6) {
      setError('Please enter the 6-digit code received on your email.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await loginWithOtp(email, otp.trim());
      if (onLoginSuccess) onLoginSuccess();
    } catch (err) {
      setError(err.message || 'Invalid or expired OTP code.');
    } finally {
      setLoading(false);
    }
  };

  // 5. Google 1-Click Sign-In
  const handleGoogleSignIn = async () => {
    setError('');
    setLoading(true);
    try {
      const targetEmail = email.trim() || 'kdev23416@gmail.com';
      const targetName = fullName.trim() || targetEmail.split('@')[0] || 'Kalyan Dev';
      await loginWithGoogle(targetEmail, targetName);
      if (onLoginSuccess) onLoginSuccess();
    } catch (err) {
      setError(err.message || 'Google Sign-In failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.pageBackdrop}>
      <div style={styles.card}>
        
        {/* Navigation Tabs (Login / Register / Email OTP) */}
        <div style={styles.tabContainer}>
          <button
            type="button"
            onClick={() => switchMode('login')}
            style={{
              ...styles.tabBtn,
              background: authMode === 'login' ? 'linear-gradient(135deg, #f59e0b 0%, #ea580c 100%)' : 'transparent',
              color: authMode === 'login' ? '#ffffff' : '#94a3b8',
              fontWeight: authMode === 'login' ? 700 : 500,
            }}
          >
            Password Login
          </button>
          <button
            type="button"
            onClick={() => switchMode('otp')}
            style={{
              ...styles.tabBtn,
              background: authMode === 'otp' ? 'linear-gradient(135deg, #f59e0b 0%, #ea580c 100%)' : 'transparent',
              color: authMode === 'otp' ? '#ffffff' : '#94a3b8',
              fontWeight: authMode === 'otp' ? 700 : 500,
            }}
          >
            Email OTP
          </button>
          <button
            type="button"
            onClick={() => switchMode('register')}
            style={{
              ...styles.tabBtn,
              background: authMode === 'register' ? 'linear-gradient(135deg, #f59e0b 0%, #ea580c 100%)' : 'transparent',
              color: authMode === 'register' ? '#ffffff' : '#94a3b8',
              fontWeight: authMode === 'register' ? 700 : 500,
            }}
          >
            Sign Up
          </button>
        </div>

        {/* Header Section */}
        <div style={styles.headerBox}>
          {authMode === 'login' && (
            <>
              <h1 style={styles.titleLine}>
                Ready to Shop? Let's get you
              </h1>
              <div style={styles.brandTitle}>
                Urban<span style={{ color: '#f59e0b' }}>Cart</span>
              </div>
            </>
          )}

          {authMode === 'register' && (
            <>
              <h1 style={styles.titleLine}>
                Ready for Style? Join
              </h1>
              <div style={styles.brandTitle}>
                Urban<span style={{ color: '#f59e0b' }}>Cart</span>
              </div>
              <p style={styles.subtitle}>
                Create an account to start shopping
              </p>
            </>
          )}

          {authMode === 'otp' && (
            <>
              <h1 style={styles.titleLine}>
                {otpStep === 'email' ? "Instant Sign In with" : "Verify One-Time Code"}
              </h1>
              <div style={styles.brandTitle}>
                Urban<span style={{ color: '#f59e0b' }}>Cart OTP</span>
              </div>
              <p style={styles.subtitle}>
                {otpStep === 'email' 
                  ? "We'll send a 6-digit verification code to your Gmail inbox" 
                  : `Enter the 6-digit code sent to ${email}`}
              </p>
            </>
          )}
        </div>

        {/* Error Feedback */}
        {error && (
          <div style={styles.errorAlert}>
            <AlertCircle size={16} style={{ flexShrink: 0, marginTop: 1 }} />
            <span>{error}</span>
          </div>
        )}

        {/* Success Feedback */}
        {infoMessage && (
          <div style={styles.infoAlert}>
            <CheckCircle2 size={16} style={{ flexShrink: 0, marginTop: 1 }} />
            <span>{infoMessage}</span>
          </div>
        )}

        {/* ========================================================= */}
        {/* VIEW 1: PASSWORD LOGIN                                     */}
        {/* ========================================================= */}
        {authMode === 'login' && (
          <form onSubmit={handlePasswordLogin} style={styles.form}>
            <div style={styles.inputWrapper}>
              <Mail size={18} color="#64748b" style={styles.inputIcon} />
              <input
                type="text"
                required
                placeholder="Email Address or Username"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={styles.input}
                autoFocus
              />
            </div>

            <div style={styles.inputWrapper}>
              <Lock size={18} color="#64748b" style={styles.inputIcon} />
              <input
                type="password"
                required
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={styles.input}
              />
            </div>

            <div style={{ textAlign: 'right', marginTop: -4 }}>
              <button
                type="button"
                onClick={() => switchMode('otp')}
                style={styles.forgotBtn}
              >
                Forgot Password?
              </button>
            </div>

            <button
              type="submit"
              disabled={loading}
              style={styles.primaryBtn}
            >
              {loading ? 'Logging In...' : 'Login ➔'}
            </button>
          </form>
        )}

        {/* ========================================================= */}
        {/* VIEW 2: REGISTER / SIGN UP                                */}
        {/* ========================================================= */}
        {authMode === 'register' && (
          <form onSubmit={handleRegister} style={styles.form}>
            <div style={styles.inputWrapper}>
              <User size={18} color="#64748b" style={styles.inputIcon} />
              <input
                type="text"
                required
                placeholder="Full Name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                style={styles.input}
                autoFocus
              />
            </div>

            <div style={styles.inputWrapper}>
              <Mail size={18} color="#64748b" style={styles.inputIcon} />
              <input
                type="email"
                required
                placeholder="Email Address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={styles.input}
              />
            </div>

            <div style={styles.inputWrapper}>
              <Phone size={18} color="#64748b" style={styles.inputIcon} />
              <input
                type="tel"
                placeholder="Phone Number (Optional)"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                style={styles.input}
              />
            </div>

            <div style={styles.inputWrapper}>
              <Lock size={18} color="#64748b" style={styles.inputIcon} />
              <input
                type="password"
                required
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={styles.input}
              />
            </div>

            <div style={styles.inputWrapper}>
              <Lock size={18} color="#64748b" style={styles.inputIcon} />
              <input
                type="password"
                required
                placeholder="Confirm Password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                style={styles.input}
              />
            </div>

            <div style={styles.inputWrapper}>
              <Sparkles size={18} color="#64748b" style={styles.inputIcon} />
              <input
                type="text"
                placeholder="Referral Code (Optional)"
                value={referralCode}
                onChange={(e) => setReferralCode(e.target.value)}
                style={styles.input}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              style={styles.primaryBtn}
            >
              {loading ? 'Creating Account...' : 'Get Started ➔'}
            </button>
          </form>
        )}

        {/* ========================================================= */}
        {/* VIEW 3: GMAIL OTP LOGIN                                   */}
        {/* ========================================================= */}
        {authMode === 'otp' && (
          <div>
            {otpStep === 'email' ? (
              <form onSubmit={handleSendOtp} style={styles.form}>
                <div style={styles.inputWrapper}>
                  <Mail size={18} color="#64748b" style={styles.inputIcon} />
                  <input
                    type="email"
                    required
                    placeholder="Email Address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    style={styles.input}
                    autoFocus
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  style={styles.primaryBtn}
                >
                  {loading ? 'Sending Code...' : 'Get OTP ➔'}
                </button>
              </form>
            ) : (
              <form onSubmit={handleVerifyOtp} style={styles.form}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Sent to {email}</span>
                  <button
                    type="button"
                    onClick={() => { setOtpStep('email'); setOtp(''); }}
                    style={{ background: 'none', border: 'none', color: '#f59e0b', fontSize: '0.8rem', cursor: 'pointer', fontWeight: 600 }}
                  >
                    Change Email
                  </button>
                </div>

                <div style={styles.inputWrapper}>
                  <KeyRound size={18} color="#64748b" style={styles.inputIcon} />
                  <input
                    type="text"
                    maxLength={6}
                    required
                    placeholder="Enter 6-Digit Code"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                    style={{
                      ...styles.input,
                      fontSize: '1.25rem',
                      letterSpacing: '0.3em',
                      fontWeight: 800,
                      textAlign: 'center',
                    }}
                    autoFocus
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  style={styles.primaryBtn}
                >
                  {loading ? 'Verifying...' : 'Verify OTP & Log In ➔'}
                </button>

                {/* Resend Link */}
                <div style={{ textAlign: 'center', marginTop: 4 }}>
                  {canResend ? (
                    <button
                      type="button"
                      onClick={() => handleSendOtp()}
                      disabled={loading}
                      style={{ background: 'none', border: 'none', color: '#f59e0b', fontSize: '0.82rem', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}
                    >
                      <RefreshCw size={13} />
                      <span>Didn't get code? <strong>Resend OTP</strong></span>
                    </button>
                  ) : (
                    <span style={{ fontSize: '0.78rem', color: '#64748b' }}>
                      Resend code in <strong>{resendTimer}s</strong>
                    </span>
                  )}
                </div>
              </form>
            )}
          </div>
        )}

        {/* ========================================================= */}
        {/* DIVIDER & CONTINUE WITH GOOGLE (EXACT SWADKART REPLICA)    */}
        {/* ========================================================= */}
        {otpStep !== 'verify' && (
          <>
            <div style={styles.dividerBox}>
              <div style={styles.dividerLine} />
              <span style={styles.dividerText}>OR</span>
              <div style={styles.dividerLine} />
            </div>

            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={loading}
              style={styles.googleBtn}
              onMouseEnter={(e) => { e.currentTarget.style.background = '#f1f5f9'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = '#ffffff'; }}
            >
              <GoogleIcon />
              <span>CONTINUE WITH GOOGLE</span>
            </button>
          </>
        )}

        {/* Footer Navigation Switchers */}
        <div style={styles.footerSwitch}>
          {authMode === 'login' && (
            <>
              <p style={{ margin: '0 0 8px 0' }}>
                New to UrbanCart?{' '}
                <button
                  type="button"
                  onClick={() => switchMode('register')}
                  style={styles.linkHighlight}
                >
                  Register here
                </button>
              </p>
              <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748b' }}>
                Prefer passwordless?{' '}
                <button
                  type="button"
                  onClick={() => switchMode('otp')}
                  style={{ ...styles.linkHighlight, color: '#f59e0b' }}
                >
                  Sign in with Email OTP
                </button>
              </p>
            </>
          )}

          {authMode === 'register' && (
            <p style={{ margin: 0 }}>
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => switchMode('login')}
                style={styles.linkHighlight}
              >
                Log In
              </button>
            </p>
          )}

          {authMode === 'otp' && (
            <p style={{ margin: 0 }}>
              Prefer password?{' '}
              <button
                type="button"
                onClick={() => switchMode('login')}
                style={styles.linkHighlight}
              >
                Log In with Password
              </button>
            </p>
          )}
        </div>

      </div>
    </div>
  );
}

const styles = {
  pageBackdrop: {
    minHeight: 'calc(100vh - 120px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '32px 16px 48px',
    background: '#070b13',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
  card: {
    width: '100%',
    maxWidth: '460px',
    background: '#0c1322',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    borderRadius: '24px',
    padding: '36px 32px',
    boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.8)',
  },
  tabContainer: {
    display: 'flex',
    background: '#070b13',
    padding: '4px',
    borderRadius: '14px',
    border: '1px solid rgba(255, 255, 255, 0.06)',
    marginBottom: '26px',
    gap: 4,
  },
  tabBtn: {
    flex: 1,
    padding: '8px 10px',
    borderRadius: '10px',
    border: 'none',
    fontSize: '0.8rem',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  headerBox: {
    textAlign: 'center',
    marginBottom: '24px',
  },
  titleLine: {
    fontSize: '1.65rem',
    fontWeight: 800,
    color: '#ffffff',
    lineHeight: 1.25,
    margin: 0,
    letterSpacing: '-0.02em',
  },
  brandTitle: {
    fontSize: '1.9rem',
    fontWeight: 900,
    color: '#ffffff',
    letterSpacing: '-0.02em',
    marginTop: '2px',
  },
  subtitle: {
    fontSize: '0.88rem',
    color: '#94a3b8',
    marginTop: '8px',
    margin: 0,
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '14px',
  },
  inputWrapper: {
    display: 'flex',
    alignItems: 'center',
    background: '#111827',
    border: '1px solid #1f293d',
    borderRadius: '12px',
    padding: '12px 14px',
    transition: 'border-color 0.2s',
  },
  inputIcon: {
    marginRight: '12px',
    flexShrink: 0,
  },
  input: {
    background: 'none',
    border: 'none',
    color: '#f8fafc',
    outline: 'none',
    width: '100%',
    fontSize: '0.94rem',
    fontFamily: 'inherit',
  },
  forgotBtn: {
    background: 'none',
    border: 'none',
    color: '#f59e0b',
    fontSize: '0.82rem',
    fontWeight: 600,
    cursor: 'pointer',
  },
  primaryBtn: {
    width: '100%',
    padding: '13px',
    borderRadius: '12px',
    background: 'linear-gradient(135deg, #f59e0b 0%, #ea580c 100%)',
    color: '#ffffff',
    fontSize: '0.98rem',
    fontWeight: 700,
    border: 'none',
    cursor: 'pointer',
    marginTop: '4px',
    boxShadow: '0 4px 18px rgba(245, 158, 11, 0.35)',
    transition: 'transform 0.15s, opacity 0.2s',
  },
  dividerBox: {
    display: 'flex',
    alignItems: 'center',
    margin: '20px 0',
    gap: '12px',
  },
  dividerLine: {
    flex: 1,
    height: '1px',
    background: 'rgba(255, 255, 255, 0.1)',
  },
  dividerText: {
    fontSize: '0.72rem',
    color: '#64748b',
    fontWeight: 800,
    textTransform: 'uppercase',
    letterSpacing: '0.1em',
  },
  googleBtn: {
    width: '100%',
    padding: '12px 16px',
    borderRadius: '12px',
    background: '#ffffff',
    color: '#000000',
    fontSize: '0.82rem',
    fontWeight: 800,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    border: 'none',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '12px',
    cursor: 'pointer',
    boxShadow: '0 4px 14px rgba(0, 0, 0, 0.3)',
    transition: 'background 0.2s, transform 0.15s',
  },
  footerSwitch: {
    textAlign: 'center',
    marginTop: '24px',
    fontSize: '0.86rem',
    color: '#94a3b8',
  },
  linkHighlight: {
    background: 'none',
    border: 'none',
    color: '#f59e0b',
    fontWeight: 700,
    cursor: 'pointer',
    padding: 0,
    fontFamily: 'inherit',
    fontSize: 'inherit',
  },
  errorAlert: {
    background: 'rgba(239, 68, 68, 0.15)',
    border: '1px solid rgba(239, 68, 68, 0.3)',
    color: '#fca5a5',
    padding: '10px 14px',
    borderRadius: '10px',
    fontSize: '0.84rem',
    marginBottom: '16px',
    display: 'flex',
    alignItems: 'flex-start',
    gap: '8px',
  },
  infoAlert: {
    background: 'rgba(34, 197, 94, 0.15)',
    border: '1px solid rgba(34, 197, 94, 0.3)',
    color: '#86efac',
    padding: '10px 14px',
    borderRadius: '10px',
    fontSize: '0.84rem',
    marginBottom: '16px',
    display: 'flex',
    alignItems: 'flex-start',
    gap: '8px',
  },
};
