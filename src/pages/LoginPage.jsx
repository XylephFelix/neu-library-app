import { useState } from "react";
import { signInWithEmailAndPassword, signInWithPopup } from "firebase/auth";
import { auth, provider, db } from "../firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";

export default function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const processLogin = async (user) => {
    if (!user.email.endsWith("@neu.edu.ph")) {
      await auth.signOut();
      setError("Institutional email lang ang pinapayagan (@neu.edu.ph)");
      return;
    }
    const userRef = doc(db, "users", user.uid);
    const userSnap = await getDoc(userRef);
    if (userSnap.exists() && userSnap.data().isBlocked) {
      await auth.signOut();
      setError("Blocked ang account mo. Contact admin.");
      return;
    }
    if (!userSnap.exists()) {
      await setDoc(userRef, {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName || user.email.split('@')[0],
        role: ["jcesperanza@neu.edu.ph", "admin@neu.edu.ph"].includes(user.email) ? "admin" : "user",
        isBlocked: false,
        createdAt: new Date()
      });
    }
    const role = userSnap.exists() ? userSnap.data().role : 
      (["jcesperanza@neu.edu.ph", "admin@neu.edu.ph"].includes(user.email) ? "admin" : "user");
    navigate(role === "admin" ? "/admin" : "/checkin");
  };

  const handleEmailLogin = async () => {
    if (!email || !password) { setError("Punan ang email at password."); return; }
    setError(''); setLoading(true);
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      await processLogin(result.user);
    } catch (err) {
      setError("Mali ang email o password. Subukan ulit.");
    }
    setLoading(false);
  };

  const handleGoogleLogin = async () => {
    setError(''); setLoading(true);
    try {
      const result = await signInWithPopup(auth, provider);
      await processLogin(result.user);
    } catch (err) {
      setError("Error sa Google login. Subukan ulit.");
    }
    setLoading(false);
  };

  const inputStyle = {
    width: '100%',
    padding: '0.75rem 1rem',
    borderRadius: '10px',
    border: '1.5px solid rgba(201,162,39,0.3)',
    background: 'rgba(255,255,255,0.06)',
    color: 'white',
    fontFamily: 'DM Sans, sans-serif',
    fontSize: '0.9rem',
    boxSizing: 'border-box',
    outline: 'none',
  };

  const labelStyle = {
    color: 'rgba(255,255,255,0.55)',
    fontSize: '0.78rem',
    fontWeight: '600',
    letterSpacing: '0.5px',
    display: 'block',
    marginBottom: '0.4rem',
  };

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
          fontSize: '3.5rem', color: '#c9a227', letterSpacing: '6px', lineHeight: 1,
          marginBottom: '0.5rem' }}>NEU</div>

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

        {/* Email */}
        <div style={{ marginBottom: '1rem', textAlign: 'left' }}>
          <label style={labelStyle}>Institutional Email</label>
          <input
            type="email" placeholder="yourname@neu.edu.ph"
            value={email} onChange={e => setEmail(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleEmailLogin()}
            style={inputStyle}
          />
        </div>

        {/* Password */}
        <div style={{ marginBottom: '1.5rem', textAlign: 'left' }}>
          <label style={labelStyle}>Password</label>
          <input
            type="password" placeholder="••••••••"
            value={password} onChange={e => setPassword(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleEmailLogin()}
            style={inputStyle}
          />
        </div>

        {/* Email Login Button */}
        <button onClick={handleEmailLogin} disabled={loading}
          style={{
            width: '100%', background: '#c9a227', color: '#0d1a42',
            padding: '0.875rem 1.5rem', border: 'none', borderRadius: '12px',
            cursor: loading ? 'not-allowed' : 'pointer',
            fontFamily: 'DM Sans, sans-serif', fontWeight: 700, fontSize: '0.9rem',
            marginBottom: '0.75rem', opacity: loading ? 0.7 : 1,
            transition: 'all 0.25s ease',
          }}
          onMouseEnter={e => { if(!loading) { e.currentTarget.style.background = '#e6bb3a'; e.currentTarget.style.transform = 'translateY(-2px)'; }}}
          onMouseLeave={e => { e.currentTarget.style.background = '#c9a227'; e.currentTarget.style.transform = 'translateY(0)'; }}
        >
          {loading ? 'Signing in...' : 'Sign in with Institutional ID'}
        </button>

        {/* Divider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', margin: '0.75rem 0' }}>
          <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.1)' }} />
          <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.72rem' }}>or</span>
          <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.1)' }} />
        </div>

        {/* Google Login Button */}
        <button onClick={handleGoogleLogin} disabled={loading}
          style={{
            width: '100%', background: 'rgba(255,255,255,0.06)',
            color: 'rgba(255,255,255,0.8)', padding: '0.75rem 1.5rem',
            border: '1.5px solid rgba(255,255,255,0.15)', borderRadius: '12px',
            cursor: loading ? 'not-allowed' : 'pointer',
            fontFamily: 'DM Sans, sans-serif', fontWeight: 600, fontSize: '0.85rem',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.6rem',
            transition: 'all 0.25s ease',
          }}
          onMouseEnter={e => { if(!loading) e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; }}
        >
          <svg width="16" height="16" viewBox="0 0 18 18" fill="none">
            <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" fill="#4285F4"/>
            <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853"/>
            <path d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
            <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
          </svg>
          Continue with Google
        </button>

        {/* Info footer */}
        <div style={{ marginTop: '1.5rem', padding: '0.85rem 1rem',
          background: 'rgba(255,255,255,0.04)', borderRadius: '8px',
          border: '1px solid rgba(255,255,255,0.07)', textAlign: 'center' }}>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.72rem', marginBottom: '0.2rem' }}>
            Only <span style={{ color: '#c9a227' }}>@neu.edu.ph</span> accounts are accepted.
          </p>
          <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: '0.68rem', marginBottom: '0.5rem' }}>
            No. 9 Central Avenue, New Era, Quezon City · (02) 7273-6345
          </p>
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.07)', paddingTop: '0.5rem' }}>
            <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: '0.68rem' }}>
              Demo: <span style={{ color: 'rgba(201,162,39,0.7)', cursor: 'pointer' }}
                onClick={() => { setEmail('user@neu.edu.ph'); setPassword('demo1234'); }}>
                user@neu.edu.ph
              </span> or <span style={{ color: 'rgba(201,162,39,0.7)', cursor: 'pointer' }}
                onClick={() => { setEmail('admin@neu.edu.ph'); setPassword('demo1234'); }}>
                admin@neu.edu.ph
              </span> — any password
            </p>
          </div>
        </div>

      </div>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=DM+Sans:wght@300;400;500;600&display=swap');
        input::placeholder { color: rgba(255,255,255,0.25); }
        input:focus { border-color: rgba(201,162,39,0.6) !important; box-shadow: 0 0 0 3px rgba(201,162,39,0.1); }
      `}</style>
    </div>
  );
}