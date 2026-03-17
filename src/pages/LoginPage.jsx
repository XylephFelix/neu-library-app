import { useState } from "react";
import { signInWithPopup } from "firebase/auth";
import { auth, provider, db } from "../firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";

const ADMIN_EMAILS = ['jcesperanza@neu.edu.ph', 'admin@neu.edu.ph'];

export default function LoginPage() {
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showRoleSelect, setShowRoleSelect] = useState(false);
  const [pendingUser, setPendingUser] = useState(null);

  const handleLogin = async () => {
    setError(''); setLoading(true);
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      if (!user.email.endsWith('@neu.edu.ph')) {
        await auth.signOut();
        setError('Institutional email lang ang pinapayagan (@neu.edu.ph)');
        setLoading(false);
        return;
      }

      const userRef = doc(db, 'users', user.uid);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists() && userSnap.data().isBlocked) {
        await auth.signOut();
        setError('Blocked ang account mo. Contact admin.');
        setLoading(false);
        return;
      }

      if (!userSnap.exists()) {
        await setDoc(userRef, {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          role: ADMIN_EMAILS.includes(user.email) ? 'admin' : 'user',
          isBlocked: false,
          createdAt: new Date()
        });
      }

      
      if (ADMIN_EMAILS.includes(user.email)) {
        setPendingUser(user);
        setShowRoleSelect(true);
        setLoading(false);
        return;
      }

      navigate('/checkin');
    } catch (err) {
      setError('Error sa login. Subukan ulit.');
      console.error(err);
    }
    setLoading(false);
  };

  const handleRoleSelect = (role) => {
    navigate(role === 'admin' ? '/admin' : '/checkin');
  };


  if (showRoleSelect && pendingUser) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #1a2e6e 0%, #0d1a42 60%, #0a1230 100%)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '2rem', fontFamily: "'DM Sans', sans-serif",
      }}>
        <div style={{
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(201,162,39,0.2)',
          borderRadius: '20px', padding: '3rem 2.5rem',
          textAlign: 'center', width: '100%', maxWidth: '400px',
          backdropFilter: 'blur(10px)',
          boxShadow: '0 40px 80px rgba(0,0,0,0.4)',
        }}>
          {}
          <div style={{
            width: '64px', height: '64px', borderRadius: '50%',
            background: 'linear-gradient(135deg, #c9a227, #e6bb3a)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 1.25rem', fontSize: '1.5rem', fontWeight: 800,
            color: '#0d1a42',
          }}>
            {pendingUser.displayName?.charAt(0) || 'U'}
          </div>

          <h2 style={{ fontFamily: "'Playfair Display', serif", color: 'white',
            fontSize: '1.3rem', fontWeight: 700, marginBottom: '0.4rem' }}>
            Welcome back!
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.82rem', marginBottom: '0.25rem' }}>
            {pendingUser.displayName}
          </p>
          <p style={{ color: 'rgba(201,162,39,0.8)', fontSize: '0.75rem', marginBottom: '2rem' }}>
            {pendingUser.email}
          </p>

          <div style={{ width: '48px', height: '2px', background: '#c9a227',
            margin: '0 auto 1.75rem', borderRadius: '2px' }} />

          <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: '0.78rem',
            letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '1.25rem' }}>
            Continue as
          </p>

          {}
          <button onClick={() => handleRoleSelect('user')}
            style={{
              width: '100%', background: '#c9a227', color: '#0d1a42',
              padding: '1rem 1.5rem', border: 'none', borderRadius: '12px',
              cursor: 'pointer', fontFamily: 'DM Sans, sans-serif',
              fontWeight: 700, fontSize: '0.9rem', marginBottom: '0.75rem',
              transition: 'all 0.25s ease', display: 'flex',
              alignItems: 'center', justifyContent: 'center', gap: '0.6rem',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = '#e6bb3a'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = '#c9a227'; e.currentTarget.style.transform = 'translateY(0)'; }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              <circle cx="12" cy="7" r="4" stroke="currentColor" strokeWidth="2"/>
            </svg>
            Regular User
          </button>

          {}
          <button onClick={() => handleRoleSelect('admin')}
            style={{
              width: '100%', background: 'rgba(255,255,255,0.06)',
              color: 'rgba(255,255,255,0.85)', padding: '1rem 1.5rem',
              border: '1.5px solid rgba(255,255,255,0.15)', borderRadius: '12px',
              cursor: 'pointer', fontFamily: 'DM Sans, sans-serif',
              fontWeight: 600, fontSize: '0.9rem',
              transition: 'all 0.25s ease', display: 'flex',
              alignItems: 'center', justifyContent: 'center', gap: '0.6rem',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.12)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.transform = 'translateY(0)'; }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M12 15a3 3 0 100-6 3 3 0 000 6z" stroke="currentColor" strokeWidth="2"/>
              <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" stroke="currentColor" strokeWidth="2"/>
            </svg>
            Admin
          </button>

          {}
          <button onClick={() => { auth.signOut(); setShowRoleSelect(false); setPendingUser(null); }}
            style={{ marginTop: '1.25rem', background: 'none', border: 'none',
              color: 'rgba(255,255,255,0.3)', fontSize: '0.75rem', cursor: 'pointer',
              fontFamily: 'DM Sans, sans-serif', textDecoration: 'underline' }}>
            Sign out
          </button>
        </div>

        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=DM+Sans:wght@300;400;500;600&display=swap');
        `}</style>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #1a2e6e 0%, #0d1a42 60%, #0a1230 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '2rem', position: 'relative', overflow: 'hidden',
      fontFamily: "'DM Sans', sans-serif",
    }}>
      <div style={{
        position: 'absolute', width: '600px', height: '600px', borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(201,162,39,0.08) 0%, transparent 70%)',
        top: '-200px', right: '-200px', pointerEvents: 'none',
      }} />

      <div style={{
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(201,162,39,0.2)',
        borderRadius: '20px', padding: '3rem 2.5rem', textAlign: 'center',
        width: '100%', maxWidth: '400px', backdropFilter: 'blur(10px)',
        boxShadow: '0 40px 80px rgba(0,0,0,0.4)',
      }}>
        <div style={{ fontFamily: "'Playfair Display', serif", fontWeight: 900,
          fontSize: '3.5rem', color: '#c9a227', letterSpacing: '6px',
          lineHeight: 1, marginBottom: '0.5rem' }}>NEU</div>

        <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.15rem',
          fontWeight: 700, color: 'white', marginBottom: '0.25rem' }}>
          New Era University Library
        </h1>
        <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.45)',
          letterSpacing: '2px', textTransform: 'uppercase', marginBottom: 0 }}>
          Visitor Management System
        </p>

        <div style={{ width: '48px', height: '2px', background: '#c9a227',
          margin: '1.5rem auto', borderRadius: '2px' }} />

        {error && (
          <div style={{ background: 'rgba(220,38,38,0.15)', border: '1px solid rgba(220,38,38,0.3)',
            color: '#fca5a5', padding: '0.75rem 1rem', borderRadius: '8px',
            fontSize: '0.82rem', marginBottom: '1.25rem', textAlign: 'left' }}>
            {error}
          </div>
        )}

        <div style={{ marginBottom: '1rem', textAlign: 'left' }}>
          <label style={{ color: 'rgba(255,255,255,0.55)', fontSize: '0.78rem',
            fontWeight: 600, letterSpacing: '0.5px', display: 'block', marginBottom: '0.4rem' }}>
            Institutional Email
          </label>
          <input type="email" placeholder="yourname@neu.edu.ph" disabled
            style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '10px',
              border: '1.5px solid rgba(201,162,39,0.3)', background: 'rgba(255,255,255,0.06)',
              color: 'rgba(255,255,255,0.35)', fontFamily: 'DM Sans, sans-serif',
              fontSize: '0.9rem', boxSizing: 'border-box', cursor: 'not-allowed' }}
          />
        </div>

        <div style={{ marginBottom: '1.5rem', textAlign: 'left' }}>
          <label style={{ color: 'rgba(255,255,255,0.55)', fontSize: '0.78rem',
            fontWeight: 600, letterSpacing: '0.5px', display: 'block', marginBottom: '0.4rem' }}>
            Password
          </label>
          <input type="password" placeholder="••••••••" disabled
            style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '10px',
              border: '1.5px solid rgba(201,162,39,0.3)', background: 'rgba(255,255,255,0.06)',
              color: 'rgba(255,255,255,0.35)', fontFamily: 'DM Sans, sans-serif',
              fontSize: '0.9rem', boxSizing: 'border-box', cursor: 'not-allowed' }}
          />
        </div>

        <button onClick={handleLogin} disabled={loading}
          style={{
            width: '100%', background: '#c9a227', color: '#0d1a42',
            padding: '0.875rem 1.5rem', border: 'none', borderRadius: '12px',
            cursor: loading ? 'not-allowed' : 'pointer',
            fontFamily: 'DM Sans, sans-serif', fontWeight: 700, fontSize: '0.9rem',
            opacity: loading ? 0.7 : 1, transition: 'all 0.25s ease',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.6rem',
          }}
          onMouseEnter={e => { if (!loading) { e.currentTarget.style.background = '#e6bb3a'; e.currentTarget.style.transform = 'translateY(-2px)'; }}}
          onMouseLeave={e => { e.currentTarget.style.background = '#c9a227'; e.currentTarget.style.transform = 'translateY(0)'; }}
        >
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" fill="#4285F4"/>
            <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853"/>
            <path d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
            <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
          </svg>
          {loading ? 'Signing in...' : 'Sign in with Institutional ID'}
        </button>

        <div style={{ marginTop: '1.5rem', padding: '0.85rem 1rem',
          background: 'rgba(255,255,255,0.04)', borderRadius: '8px',
          border: '1px solid rgba(255,255,255,0.07)', textAlign: 'center' }}>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.72rem', marginBottom: '0.2rem' }}>
            Only <span style={{ color: '#c9a227' }}>@neu.edu.ph</span> accounts are accepted.
          </p>
          <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: '0.68rem' }}>
            No. 9 Central Avenue, New Era, Quezon City · (02) 7273-6345
          </p>
        </div>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=DM+Sans:wght@300;400;500;600&display=swap');
      `}</style>
    </div>
  );
}