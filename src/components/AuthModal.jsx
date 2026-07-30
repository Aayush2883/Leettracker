import React, { useState } from 'react';
import { Mail, Lock, LogIn, UserPlus, AlertCircle, Loader } from 'lucide-react';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signInWithPopup } from 'firebase/auth';
import { auth, googleProvider, isFirebaseConfigured } from '../firebase';

export default function AuthModal({ onAuthSuccess, onGuestMode }) {
  const [mode, setMode] = useState('login'); // 'login' | 'signup'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Please fill in all fields.");
      return;
    }
    setError(null);
    setLoading(true);

    if (isFirebaseConfigured) {
      try {
        if (mode === 'login') {
          await signInWithEmailAndPassword(auth, email, password);
        } else {
          await createUserWithEmailAndPassword(auth, email, password);
        }
      } catch (err) {
        console.error(err);
        let msg = err.message;
        if (err.code === 'auth/wrong-password') msg = 'Incorrect password.';
        else if (err.code === 'auth/user-not-found') msg = 'No account associated with this email.';
        else if (err.code === 'auth/email-already-in-use') msg = 'This email is already in use.';
        else if (err.code === 'auth/weak-password') msg = 'Password should be at least 6 characters.';
        setError(msg);
      } finally {
        setLoading(false);
      }
    } else {
      // Offline Simulation Mode
      setTimeout(() => {
        setLoading(false);
        const simulatedUser = {
          uid: `offline_${email.replace(/[^a-zA-Z0-9]/g, '')}`,
          email: email,
          isAnonymous: false,
          displayName: email.split('@')[0]
        };
        onAuthSuccess(simulatedUser);
      }, 800);
    }
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    setLoading(true);

    if (isFirebaseConfigured) {
      try {
        await signInWithPopup(auth, googleProvider);
      } catch (err) {
        console.error(err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    } else {
      // Offline Simulation Mode
      setTimeout(() => {
        setLoading(false);
        const simulatedUser = {
          uid: 'offline_google_user',
          email: 'google.demo@example.com',
          displayName: 'Demo User'
        };
        onAuthSuccess(simulatedUser);
      }, 800);
    }
  };

  return (
    <div className="modal-overlay" style={{ backdropFilter: 'blur(16px)' }}>
      <div className="modal-content glass-card animate-fade-in" style={{ maxWidth: '440px', padding: '2rem', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
        
        {/* Title / Description */}
        <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '0.5rem' }} className="gradient-text">
            LeetTracker
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
            Track progress across multiple accounts
          </p>
        </div>

        {/* Demo Warning Banner */}
        {!isFirebaseConfigured && (
          <div style={{
            display: 'flex',
            gap: '0.5rem',
            padding: '0.75rem',
            borderRadius: '8px',
            backgroundColor: 'rgba(245, 158, 11, 0.08)',
            border: '1px solid rgba(245, 158, 11, 0.2)',
            color: 'var(--status-inprogress-text)',
            fontSize: '0.75rem',
            lineHeight: '1.35',
            marginBottom: '1.25rem'
          }}>
            <AlertCircle size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>
              <strong>Running in Demo/Offline Mode.</strong> Firebase credentials not configured in `.env`. You can enter any email/password to login.
            </div>
          </div>
        )}

        {/* Mode Selector Tabs */}
        <div className="tabs-container" style={{ marginBottom: '1.5rem', padding: '0.25rem' }}>
          <button 
            type="button"
            className={`tab-btn ${mode === 'login' ? 'active' : ''}`}
            onClick={() => { setMode('login'); setError(null); }}
            style={{ width: '50%' }}
          >
            Sign In
          </button>
          <button 
            type="button"
            className={`tab-btn ${mode === 'signup' ? 'active' : ''}`}
            onClick={() => { setMode('signup'); setError(null); }}
            style={{ width: '50%' }}
          >
            Sign Up
          </button>
        </div>

        {/* Auth Error Message */}
        {error && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            color: 'var(--color-rose)',
            fontSize: '0.8rem',
            marginBottom: '1rem',
            backgroundColor: 'rgba(244, 63, 94, 0.08)',
            border: '1px solid rgba(244, 63, 94, 0.2)',
            borderRadius: '8px',
            padding: '0.75rem'
          }}>
            <AlertCircle size={16} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        {/* Credentials Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.25rem' }}>
          
          {/* Email Input */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
            <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Email Address</label>
            <div className="search-input-wrapper">
              <input 
                type="email" 
                placeholder="you@example.com" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="search-input"
                style={{ padding: '0.65rem 1rem 0.65rem 2.25rem', borderRadius: '10px' }}
                required
              />
              <Mail size={15} className="search-icon" style={{ left: '0.75rem' }} />
            </div>
          </div>

          {/* Password Input */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
            <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Password</label>
            <div className="search-input-wrapper">
              <input 
                type="password" 
                placeholder="••••••••" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="search-input"
                style={{ padding: '0.65rem 1rem 0.65rem 2.25rem', borderRadius: '10px' }}
                required
              />
              <Lock size={15} className="search-icon" style={{ left: '0.75rem' }} />
            </div>
          </div>

          {/* Submit Button */}
          <button 
            type="submit" 
            className="btn-primary" 
            disabled={loading}
            style={{ 
              marginTop: '0.5rem', 
              justifyContent: 'center', 
              padding: '0.65rem 1.25rem',
              background: 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-purple) 100%)',
              opacity: loading ? 0.75 : 1
            }}
          >
            {loading ? (
              <Loader size={18} style={{ animation: 'spin 1s linear infinite' }} />
            ) : mode === 'login' ? (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}><LogIn size={16} /> Sign In</span>
            ) : (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}><UserPlus size={16} /> Create Account</span>
            )}
          </button>
        </form>

        {/* Divider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', margin: '1.25rem 0', color: 'var(--text-muted)', fontSize: '0.75rem' }}>
          <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--border-light)' }}></div>
          <span>OR</span>
          <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--border-light)' }}></div>
        </div>

        {/* Google Sign-In */}
        <button 
          type="button"
          onClick={handleGoogleSignIn}
          disabled={loading}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.65rem',
            width: '100%',
            padding: '0.65rem 1.25rem',
            borderRadius: '10px',
            border: '1px solid var(--border-light)',
            backgroundColor: 'rgba(255, 255, 255, 0.02)',
            color: 'var(--text-primary)',
            fontFamily: 'var(--font-primary)',
            fontWeight: 600,
            fontSize: '0.85rem',
            cursor: 'pointer',
            transition: 'all var(--transition-fast)'
          }}
          className="btn-google-hover"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18c-.75 1.49-1.18 3.16-1.18 4.94s.43 3.45 1.18 4.94l3.66-2.85z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.85c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          Continue with Google
        </button>

        {/* Guest Mode Option */}
        <div style={{ textAlign: 'center', marginTop: '1.25rem' }}>
          <button 
            type="button"
            onClick={onGuestMode}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-muted)',
              fontSize: '0.75rem',
              cursor: 'pointer',
              textDecoration: 'underline'
            }}
          >
            Continue as Guest (Local Mode)
          </button>
        </div>

      </div>
    </div>
  );
}
