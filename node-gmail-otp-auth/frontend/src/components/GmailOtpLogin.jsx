import React, { useState, useEffect } from 'react';
import { Mail, KeyRound, ArrowRight, ShieldCheck, Sparkles, RefreshCw, CheckCircle2, AlertCircle } from 'lucide-react';

const API_BASE_URL = 'http://localhost:5000';

export default function GmailOtpLogin({ onLoginSuccess }) {
  // Step: 'EMAIL' | 'OTP'
  const [step, setStep] = useState('EMAIL');

  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [devOtpHint, setDevOtpHint] = useState('');

  // 60-second Resend countdown
  const [resendTimer, setResendTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);

  useEffect(() => {
    let interval = null;
    if (step === 'OTP' && resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    } else if (resendTimer === 0) {
      setCanResend(true);
      if (interval) clearInterval(interval);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [step, resendTimer]);

  // 1. Send OTP Request
  const handleSendOtp = async (e) => {
    if (e) e.preventDefault();

    if (!email || !email.includes('@') || !email.includes('.')) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }

    setErrorMessage('');
    setSuccessMessage('');
    setDevOtpHint('');
    setLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Failed to dispatch OTP code.');
      }

      setStep('OTP');
      setSuccessMessage(data.message);
      if (data.dev_otp) {
        setDevOtpHint(data.dev_otp);
        setOtp(data.dev_otp); // prefill in dev mode
      }
      setResendTimer(60);
      setCanResend(false);
    } catch (err) {
      setErrorMessage(err.message || 'Unable to connect to Node.js backend on port 5000.');
    } finally {
      setLoading(false);
    }
  };

  // 2. Verify OTP Request
  const handleVerifyOtp = async (e) => {
    e.preventDefault();

    if (!otp || otp.trim().length !== 6) {
      setErrorMessage('Please enter the full 6-digit code sent to your email.');
      return;
    }

    setErrorMessage('');
    setSuccessMessage('');
    setLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp: otp.trim() }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Verification failed. Please check the code.');
      }

      setSuccessMessage('🎉 Verified successfully! Redirecting...');
      if (onLoginSuccess) {
        onLoginSuccess(data.user, data.token);
      }
    } catch (err) {
      setErrorMessage(err.message || 'Verification failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.pageWrapper}>
      <div style={styles.cardContainer}>
        {/* Left Brand Panel */}
        <div style={styles.leftPanel}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
              <div style={styles.logoBadge}>UC</div>
              <div>
                <span style={{ fontSize: '1.35rem', fontWeight: 800, color: '#0f172a', display: 'block' }}>
                  Urban<span style={{ color: '#d97706' }}>Cart</span>
                </span>
                <span style={{ fontSize: '0.68rem', color: '#b45309', letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 700 }}>
                  Express + React Auth
                </span>
              </div>
            </div>

            <div style={styles.goldPill}>
              <Sparkles size={13} color="#b45309" />
              <span>Passwordless Security</span>
            </div>

            <h1 style={styles.leftHeadline}>
              Instant Sign In via Gmail OTP.
            </h1>

            <p style={styles.leftParagraph}>
              No passwords to remember. Simply enter your Gmail, receive a 6-digit OTP code, and access your account securely.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 24 }}>
              <div style={styles.featureRow}>
                <CheckCircle2 size={17} color="#d97706" />
                <span>Nodemailer + Gmail App Password</span>
              </div>
              <div style={styles.featureRow}>
                <CheckCircle2 size={17} color="#d97706" />
                <span>5-Minute Automatic Expiry Timer</span>
              </div>
              <div style={styles.featureRow}>
                <CheckCircle2 size={17} color="#d97706" />
                <span>Anti-Brute Force Protection</span>
              </div>
            </div>
          </div>

          <div style={styles.leftFooter}>
            <ShieldCheck size={16} color="#64748b" />
            <span>256-Bit Cryptographic Security</span>
          </div>
        </div>

        {/* Right Form Panel */}
        <div style={styles.rightPanel}>
          <div style={{ marginBottom: 24 }}>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f172a', marginBottom: 6 }}>
              {step === 'EMAIL' ? 'Welcome Back' : 'Verify One-Time Code'}
            </h2>
            <p style={{ fontSize: '0.86rem', color: '#64748b' }}>
              {step === 'EMAIL'
                ? 'Enter your email to receive a secure login verification code.'
                : `We emailed a 6-digit verification code to ${email}`}
            </p>
          </div>

          {/* Error Banner */}
          {errorMessage && (
            <div style={styles.errorBox}>
              <AlertCircle size={16} style={{ flexShrink: 0, marginTop: 1 }} />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Success Banner */}
          {successMessage && (
            <div style={styles.successBox}>
              <CheckCircle2 size={16} style={{ flexShrink: 0, marginTop: 1 }} />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Dev Mode OTP Hint */}
          {devOtpHint && (
            <div style={styles.devHintBox}>
              <strong>⚡ Dev Mode:</strong> Your OTP code is <code style={styles.devCode}>{devOtpHint}</code>
            </div>
          )}

          {/* STEP 1: EMAIL INPUT */}
          {step === 'EMAIL' && (
            <form onSubmit={handleSendOtp} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              <div>
                <label style={styles.fieldLabel}>Gmail Address</label>
                <div style={styles.inputContainer}>
                  <Mail size={18} color="#d97706" style={{ marginRight: 10, flexShrink: 0 }} />
                  <input
                    type="email"
                    required
                    placeholder="name@gmail.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    style={styles.textInput}
                    autoFocus
                  />
                </div>
              </div>

              <button type="submit" disabled={loading} style={styles.primaryButton}>
                {loading ? 'Sending Code...' : 'Send Login OTP'}
                <ArrowRight size={17} />
              </button>

              <p style={{ fontSize: '0.78rem', color: '#94a3b8', textAlign: 'center', lineHeight: 1.4 }}>
                A 6-digit code will be dispatched to your Gmail inbox via Nodemailer SMTP.
              </p>
            </form>
          )}

          {/* STEP 2: OTP CODE INPUT */}
          {step === 'OTP' && (
            <form onSubmit={handleVerifyOtp} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <label style={styles.fieldLabel}>Enter 6-Digit OTP</label>
                  <button
                    type="button"
                    onClick={() => {
                      setStep('EMAIL');
                      setOtp('');
                      setErrorMessage('');
                      setDevOtpHint('');
                    }}
                    style={styles.changeEmailButton}
                  >
                    Change Email
                  </button>
                </div>

                <div style={styles.inputContainer}>
                  <KeyRound size={18} color="#d97706" style={{ marginRight: 10, flexShrink: 0 }} />
                  <input
                    type="text"
                    maxLength={6}
                    required
                    placeholder="123456"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                    style={styles.otpInput}
                    autoFocus
                  />
                </div>
              </div>

              <button type="submit" disabled={loading} style={styles.primaryButton}>
                {loading ? 'Verifying OTP...' : 'Verify OTP & Log In'}
                <ArrowRight size={17} />
              </button>

              {/* Resend Section */}
              <div style={{ textAlign: 'center', marginTop: 4 }}>
                {canResend ? (
                  <button
                    type="button"
                    onClick={() => handleSendOtp()}
                    disabled={loading}
                    style={styles.resendLink}
                  >
                    <RefreshCw size={14} />
                    <span>Didn't get code? <strong>Resend OTP</strong></span>
                  </button>
                ) : (
                  <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                    Resend code available in <strong>{resendTimer}s</strong>
                  </span>
                )}
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

const styles = {
  pageWrapper: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px',
    background: 'radial-gradient(circle at 10% 20%, rgba(245, 158, 11, 0.08) 0%, #f8fafc 90%)',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
  cardContainer: {
    width: '100%',
    maxWidth: '920px',
    borderRadius: '24px',
    overflow: 'hidden',
    boxShadow: '0 20px 50px rgba(15, 23, 42, 0.08)',
    border: '1px solid #e2e8f0',
    background: '#ffffff',
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
  },
  leftPanel: {
    background: 'linear-gradient(145deg, #fffdfa 0%, #fffbeb 50%, #fef3c7 100%)',
    padding: '40px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    borderRight: '1px solid #fde68a',
  },
  logoBadge: {
    width: 40,
    height: 40,
    borderRadius: 12,
    background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#ffffff',
    fontWeight: 800,
    fontSize: '1.05rem',
    boxShadow: '0 4px 14px rgba(217, 119, 6, 0.3)',
  },
  goldPill: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    background: '#fef3c7',
    border: '1px solid #fde68a',
    borderRadius: 20,
    padding: '4px 12px',
    fontSize: '0.75rem',
    fontWeight: 700,
    color: '#b45309',
    marginBottom: 16,
  },
  leftHeadline: {
    fontSize: '1.8rem',
    fontWeight: 800,
    color: '#0f172a',
    lineHeight: 1.25,
    marginBottom: 12,
  },
  leftParagraph: {
    fontSize: '0.9rem',
    color: '#475569',
    lineHeight: 1.5,
  },
  featureRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    fontSize: '0.86rem',
    color: '#1e293b',
    fontWeight: 600,
  },
  leftFooter: {
    marginTop: 32,
    paddingTop: 16,
    borderTop: '1px solid rgba(217, 119, 6, 0.2)',
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    fontSize: '0.78rem',
    color: '#64748b',
  },
  rightPanel: {
    padding: '44px 36px',
    background: '#ffffff',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
  },
  fieldLabel: {
    display: 'block',
    fontSize: '0.84rem',
    color: '#1e293b',
    fontWeight: 700,
    marginBottom: 6,
  },
  inputContainer: {
    display: 'flex',
    alignItems: 'center',
    background: '#ffffff',
    border: '1px solid #cbd5e1',
    borderRadius: 12,
    padding: '11px 14px',
    transition: 'border-color 0.2s',
  },
  textInput: {
    background: 'none',
    border: 'none',
    color: '#0f172a',
    outline: 'none',
    width: '100%',
    fontSize: '0.94rem',
    fontFamily: 'inherit',
  },
  otpInput: {
    background: 'none',
    border: 'none',
    color: '#0f172a',
    outline: 'none',
    width: '100%',
    fontSize: '1.25rem',
    letterSpacing: '0.35em',
    fontWeight: 800,
    fontFamily: 'inherit',
    textAlign: 'center',
  },
  primaryButton: {
    background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
    color: '#ffffff',
    border: 'none',
    borderRadius: 12,
    padding: '13px',
    fontSize: '0.96rem',
    fontWeight: 700,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    cursor: 'pointer',
    boxShadow: '0 4px 14px rgba(217, 119, 6, 0.3)',
    transition: 'opacity 0.2s',
  },
  errorBox: {
    background: '#fef2f2',
    border: '1px solid #fecaca',
    color: '#dc2626',
    padding: '10px 14px',
    borderRadius: 10,
    fontSize: '0.84rem',
    marginBottom: 16,
    display: 'flex',
    alignItems: 'flex-start',
    gap: 8,
  },
  successBox: {
    background: '#f0fdf4',
    border: '1px solid #bbf7d0',
    color: '#16a34a',
    padding: '10px 14px',
    borderRadius: 10,
    fontSize: '0.84rem',
    marginBottom: 16,
    display: 'flex',
    alignItems: 'flex-start',
    gap: 8,
  },
  devHintBox: {
    background: '#fffbeb',
    border: '1px solid #fde68a',
    color: '#92400e',
    padding: '10px 14px',
    borderRadius: 10,
    fontSize: '0.82rem',
    marginBottom: 16,
  },
  devCode: {
    background: '#fef3c7',
    padding: '2px 8px',
    borderRadius: 6,
    fontWeight: 800,
    letterSpacing: '2px',
    color: '#b45309',
  },
  changeEmailButton: {
    background: 'none',
    border: 'none',
    color: '#d97706',
    fontSize: '0.78rem',
    fontWeight: 700,
    cursor: 'pointer',
  },
  resendLink: {
    background: 'none',
    border: 'none',
    color: '#d97706',
    fontSize: '0.82rem',
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    fontWeight: 600,
  },
};
