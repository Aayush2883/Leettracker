import React, { useState, useEffect } from 'react';
import { Terminal, RefreshCw, Download, Upload, Loader } from 'lucide-react';
import Dashboard from './components/Dashboard';
import CompanyDetail from './components/CompanyDetail';
import AuthModal from './components/AuthModal';
import { auth, isFirebaseConfigured } from './firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';

export default function App() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Selected company state
  const [selectedCompany, setSelectedCompany] = useState(null); // { id, name }

  // Authenticated user state
  const [currentUser, setCurrentUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(isFirebaseConfigured);

  // Global user progress state
  const [userProgress, setUserProgress] = useState({});

  // Fetch company metadata summary
  useEffect(() => {
    setLoading(true);
    fetch('/data/companies.json')
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch companies metadata');
        return res.json();
      })
      .then(json => {
        setData(json);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setError(err.message);
        setLoading(false);
      });
  }, []);

  // Helper to extract authentication headers (Firebase JWT token or Guest/Offline UID)
  const getAuthHeaders = async (user) => {
    if (!user) return {};

    const headers = {
      'Content-Type': 'application/json'
    };

    if (isFirebaseConfigured && !user.uid.startsWith('offline_') && user.uid !== 'guest') {
      try {
        const token = await user.getIdToken();
        headers['Authorization'] = `Bearer ${token}`;
      } catch (err) {
        console.error('Failed to retrieve Firebase ID token:', err);
      }
    } else {
      // Pass simulated/guest userId directly as bearer token
      headers['Authorization'] = `Bearer ${user.uid}`;
    }

    return headers;
  };

  // Helper to load user-specific progress
  const loadUserProgress = async (user) => {
    if (!user) {
      setUserProgress({});
      return;
    }

    try {
      const headers = await getAuthHeaders(user);
      const res = await fetch('/api/progress', { headers });
      if (res.ok) {
        const data = await res.json();
        setUserProgress(data.progress || {});
      } else {
        throw new Error(`Server status ${res.status}`);
      }
    } catch (e) {
      console.error("Error loading progress from database, falling back to local storage:", e);
      // Fallback to local storage on API failure
      const storageKey = user.uid === 'guest' ? 'leettracker::progress' : `leettracker::progress::${user.uid}`;
      const localSaved = localStorage.getItem(storageKey);
      setUserProgress(localSaved ? JSON.parse(localSaved) : {});
    }
  };

  // Auth State Listener
  useEffect(() => {
    if (!isFirebaseConfigured) {
      const savedUser = localStorage.getItem('leettracker::currentUser');
      if (savedUser) {
        const user = JSON.parse(savedUser);
        setCurrentUser(user);
        loadUserProgress(user);
      }
      setAuthLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setAuthLoading(true);
      if (user) {
        setCurrentUser(user);
        await loadUserProgress(user);
      } else {
        setCurrentUser(null);
        setUserProgress({});
      }
      setAuthLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Update progress for a specific problem link
  const handleStateChange = (link, newState, problemDetails) => {
    if (!currentUser) return;

    setUserProgress(prev => {
      const updated = {
        ...prev,
        [link]: {
          ...newState,
          problem: problemDetails || prev[link]?.problem
        }
      };

      // Save locally for offline resilience
      const storageKey = currentUser.uid === 'guest' ? 'leettracker::progress' : `leettracker::progress::${currentUser.uid}`;
      localStorage.setItem(storageKey, JSON.stringify(updated));

      // Save to Express Backend / MongoDB
      getAuthHeaders(currentUser)
        .then(headers => {
          return fetch('/api/progress', {
            method: 'POST',
            headers,
            body: JSON.stringify({ progress: updated })
          });
        })
        .catch(e => console.error("Error syncing progress to MongoDB:", e));

      return updated;
    });
  };

  // Handle Log Out
  const handleSignOut = async () => {
    const confirm = window.confirm("Are you sure you want to sign out?");
    if (!confirm) return;

    setSelectedCompany(null);
    if (isFirebaseConfigured && !currentUser.uid.startsWith('offline_') && currentUser.uid !== 'guest') {
      try {
        await signOut(auth);
      } catch (e) {
        console.error("Sign out failed:", e);
      }
    } else {
      localStorage.removeItem('leettracker::currentUser');
      setCurrentUser(null);
      setUserProgress({});
    }
  };

  // Reset all progress for current user
  const handleResetProgress = () => {
    const confirm = window.confirm("Are you sure you want to clear all your progress and bookmarks? This action cannot be undone.");
    if (confirm) {
      setUserProgress({});
      const storageKey = currentUser.uid === 'guest' ? 'leettracker::progress' : `leettracker::progress::${currentUser.uid}`;
      localStorage.removeItem(storageKey);

      getAuthHeaders(currentUser)
        .then(headers => {
          return fetch('/api/progress', {
            method: 'POST',
            headers,
            body: JSON.stringify({ progress: {} })
          });
        })
        .catch(e => console.error("Error resetting progress in MongoDB:", e));
    }
  };

  // Export progress to JSON file
  const handleExportProgress = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(userProgress, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    const emailPrefix = currentUser.email ? currentUser.email.split('@')[0] : 'guest';
    downloadAnchor.setAttribute("download", `leettracker_${emailPrefix}_progress.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Import progress from JSON file
  const handleImportProgress = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const imported = JSON.parse(e.target.result);
        if (typeof imported === 'object' && imported !== null) {
          const merged = { ...userProgress, ...imported };
          setUserProgress(merged);
          
          const storageKey = currentUser.uid === 'guest' ? 'leettracker::progress' : `leettracker::progress::${currentUser.uid}`;
          localStorage.setItem(storageKey, JSON.stringify(merged));

          const headers = await getAuthHeaders(currentUser);
          await fetch('/api/progress', {
            method: 'POST',
            headers,
            body: JSON.stringify({ progress: merged })
          });
          
          alert("Progress imported and merged successfully!");
        } else {
          alert("Invalid progress file format.");
        }
      } catch (err) {
        console.error(err);
        alert("Failed to parse progress file.");
      }
    };
    reader.readAsText(file);
    event.target.value = '';
  };

  // Compute stats
  const getStats = () => {
    if (!data) {
      return { total: 0, solved: 0, easy: { solved: 0, total: 0 }, medium: { solved: 0, total: 0 }, hard: { solved: 0, total: 0 }, bookmarked: 0 };
    }

    const solvedList = Object.values(userProgress).filter(p => p.status === 'solved');
    const bookmarkedCount = Object.values(userProgress).filter(p => p.bookmarked).length;

    const easySolved = solvedList.filter(p => p.problem?.difficulty === 'EASY').length;
    const mediumSolved = solvedList.filter(p => p.problem?.difficulty === 'MEDIUM').length;
    const hardSolved = solvedList.filter(p => p.problem?.difficulty === 'HARD').length;

    return {
      total: data.totalUnique || 0,
      solved: solvedList.length,
      easy: { solved: easySolved, total: data.easyCount || 0 },
      medium: { solved: mediumSolved, total: data.mediumCount || 0 },
      hard: { solved: hardSolved, total: data.hardCount || 0 },
      bookmarked: bookmarkedCount
    };
  };

  if (authLoading || loading) {
    return (
      <div className="app-container" style={{ alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
          <Loader size={48} className="gradient-text" style={{ animation: 'spin 2s linear infinite' }} />
          <h2 style={{ fontSize: '1.25rem', color: 'var(--text-secondary)' }}>Initializing LeetTracker...</h2>
        </div>
        <style dangerouslySetInnerHTML={{__html: `
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}} />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="app-container" style={{ alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
        <div className="glass-card" style={{ maxWidth: '500px', textAlign: 'center', padding: '2rem' }}>
          <h2 style={{ color: 'var(--color-rose)', marginBottom: '1rem' }}>Initialization Failed</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>{error || 'Could not load company lists.'}</p>
          <button onClick={() => window.location.reload()} className="btn-primary">
            <RefreshCw size={16} /> Try Again
          </button>
        </div>
      </div>
    );
  }

  // Show Auth Modal if not logged in
  if (!currentUser) {
    return (
      <div className="app-container">
        <AuthModal 
          onAuthSuccess={(user) => {
            setCurrentUser(user);
            localStorage.setItem('leettracker::currentUser', JSON.stringify(user));
            loadUserProgress(user);
          }}
          onGuestMode={() => {
            const guestUser = { uid: 'guest', email: 'guest@local', displayName: 'Guest' };
            setCurrentUser(guestUser);
            localStorage.setItem('leettracker::currentUser', JSON.stringify(guestUser));
            loadUserProgress(guestUser);
          }}
        />
      </div>
    );
  }

  return (
    <div className="app-container">
      {/* Decorative gradient top background */}
      <div className="bg-gradient-top" />

      {/* Sticky Main Header */}
      <header className="main-header">
        <div className="header-container">
          <a href="/" onClick={(e) => { e.preventDefault(); setSelectedCompany(null); }} className="logo">
            <div className="logo-icon">
              <Terminal size={20} />
            </div>
            <span className="logo-text gradient-text">LeetTracker</span>
          </a>

          {/* User Details & Backup Actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginRight: '0.5rem' }}>
              <div style={{
                width: '28px',
                height: '28px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-purple) 100%)',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.75rem',
                fontWeight: 700,
                textTransform: 'uppercase'
              }}>
                {currentUser.displayName ? currentUser.displayName[0] : currentUser.email[0]}
              </div>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
                {currentUser.displayName || currentUser.email.split('@')[0]}
              </span>
              {currentUser.uid === 'guest' && (
                <span style={{ 
                  fontSize: '0.65rem', 
                  background: 'rgba(255, 255, 255, 0.05)', 
                  color: 'var(--text-muted)', 
                  padding: '0.1rem 0.35rem', 
                  borderRadius: '4px',
                  marginLeft: '0.25rem' 
                }}>
                  Guest
                </span>
              )}
            </div>

            <button 
              onClick={handleExportProgress} 
              className="btn-secondary" 
              style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem', borderRadius: '8px', gap: '0.35rem' }}
              title="Backup your solved status"
            >
              <Download size={14} /> Export Backup
            </button>
            
            <label 
              className="btn-secondary" 
              style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem', borderRadius: '8px', gap: '0.35rem', cursor: 'pointer' }}
              title="Restore progress from backup JSON"
            >
              <Upload size={14} /> Import Backup
              <input 
                type="file" 
                accept=".json" 
                onChange={handleImportProgress} 
                style={{ display: 'none' }} 
              />
            </label>

            {Object.keys(userProgress).length > 0 && (
              <button 
                onClick={handleResetProgress}
                style={{ 
                  background: 'none', 
                  border: 'none', 
                  color: 'var(--color-rose)', 
                  fontSize: '0.8rem', 
                  cursor: 'pointer',
                  padding: '0.4rem 0.5rem'
                }}
              >
                Clear Data
              </button>
            )}

            <button 
              onClick={handleSignOut}
              style={{ 
                background: 'none', 
                border: 'none', 
                color: 'var(--color-rose)', 
                fontSize: '0.8rem', 
                cursor: 'pointer',
                padding: '0.4rem 0.5rem',
                marginLeft: '0.5rem',
                fontWeight: 600
              }}
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Layout */}
      <main className="content-wrap">
        {selectedCompany ? (
          <CompanyDetail
            companyId={selectedCompany.id}
            companyName={selectedCompany.name}
            userProgress={userProgress}
            onStateChange={handleStateChange}
            onBack={() => setSelectedCompany(null)}
          />
        ) : (
          <Dashboard
            companies={data.companies}
            userProgress={userProgress}
            onSelectCompany={(id, name) => setSelectedCompany({ id, name })}
            stats={getStats()}
            onStateChange={handleStateChange}
          />
        )}
      </main>
    </div>
  );
}
