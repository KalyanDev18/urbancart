import React, { useState } from 'react';
import GmailOtpLogin from './components/GmailOtpLogin';
import { User, LogOut, CheckCircle2, ShieldCheck, Mail, KeyRound } from 'lucide-react';

export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [authToken, setAuthToken] = useState(null);

  const handleLoginSuccess = (user, token) => {
    setCurrentUser(user);
    setAuthToken(token);
  };

  const handleSignOut = () => {
    setCurrentUser(null);
    setAuthToken(null);
  };

  // If user is logged in, show authenticated dashboard
  if (currentUser) {
    return (
      <div style={dashStyles.wrapper}>
        <div style={dashStyles.card}>
          <div style={dashStyles.header}>
            <div style={dashStyles.avatarCircle}>
              <User size={30} color="#ffffff" />
            </div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', marginBottom: 4 }}>
              Authentication Successful!
            </h2>
            <p style={{ fontSize: '0.88rem', color: '#64748b' }}>
              You are signed in via Gmail OTP Verification.
            </p>
          </div>

          <div style={dashStyles.infoGrid}>
            <div style={dashStyles.infoItem}>
              <Mail size={16} color="#d97706" />
              <div>
                <div style={dashStyles.infoLabel}>Verified Email Address</div>
                <div style={dashStyles.infoVal}>{currentUser.email}</div>
              </div>
            </div>

            <div style={dashStyles.infoItem}>
              <ShieldCheck size={16} color="#d97706" />
              <div>
                <div style={dashStyles.infoLabel}>User ID</div>
                <div style={dashStyles.infoVal}>{currentUser.id}</div>
              </div>
            </div>

            <div style={dashStyles.infoItem}>
              <KeyRound size={16} color="#d97706" />
              <div>
                <div style={dashStyles.infoLabel}>Session Auth Token</div>
                <div style={{ ...dashStyles.infoVal, fontSize: '0.78rem', fontFamily: 'monospace' }}>
                  {authToken}
                </div>
              </div>
            </div>
          </div>

          <button onClick={handleSignOut} style={dashStyles.signOutBtn}>
            <LogOut size={16} />
            <span>Sign Out</span>
          </button>
        </div>
      </div>
    );
  }

  // Otherwise, show Login Component
  return <GmailOtpLogin onLoginSuccess={handleLoginSuccess} />;
}

const dashStyles = {
  wrapper: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px',
    background: '#f8fafc',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
  card: {
    width: '100%',
    maxWidth: '520px',
    background: '#ffffff',
    borderRadius: '20px',
    padding: '36px',
    boxShadow: '0 10px 30px rgba(15, 23, 42, 0.08)',
    border: '1px solid #e2e8f0',
    textAlign: 'center',
  },
  header: {
    marginBottom: '28px',
  },
  avatarCircle: {
    width: 64,
    height: 64,
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 4px 16px rgba(217, 119, 6, 0.3)',
    marginBottom: '16px',
  },
  infoGrid: {
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
    textAlign: 'left',
    marginBottom: '28px',
  },
  infoItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    background: '#f8fafc',
    border: '1px solid #e2e8f0',
    borderRadius: '12px',
    padding: '12px 16px',
  },
  infoLabel: {
    fontSize: '0.72rem',
    color: '#64748b',
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  infoVal: {
    fontSize: '0.92rem',
    color: '#0f172a',
    fontWeight: 700,
  },
  signOutBtn: {
    width: '100%',
    padding: '12px',
    borderRadius: '12px',
    background: '#0f172a',
    color: '#ffffff',
    border: 'none',
    fontSize: '0.94rem',
    fontWeight: 700,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    boxShadow: '0 4px 12px rgba(15, 23, 42, 0.15)',
  },
};
