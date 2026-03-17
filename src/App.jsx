import React, { useState, useEffect } from 'react';
import { auth, db } from './firebase';
import {
  GoogleAuthProvider,
  signInWithPopup,
  signOut
} from 'firebase/auth';
import {
  collection,
  addDoc,
  getDocs,
  doc,
  updateDoc,
  setDoc,
  query,
  where,
  Timestamp,
  onSnapshot
} from 'firebase/firestore';
import './App.css';

const ALLOWED_DOMAIN = '@neu.edu.ph';
const ADMIN_EMAILS = ['jcesperanza@neu.edu.ph', 'admin@neu.edu.ph'];
const COLLEGES = [
  'College of Computer Studies','College of Engineering','College of Nursing',
  'College of Business Administration','College of Education',
  'College of Arts and Sciences','College of Architecture','College of Criminology',
];
const PURPOSES = ['Study','Research','Borrowing','Printing','Group Work','Other'];

export default function App() {
  const [screen, setScreen] = useState('login');
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [error, setError] = useState('');
  const [visits, setVisits] = useState([]);
  const [blocked, setBlocked] = useState({});
  const [purpose, setPurpose] = useState('');
  const [college, setCollege] = useState('');
  const [isEmployee, setIsEmployee] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [filterCollege, setFilterCollege] = useState('');
  const [filterPurpose, setFilterPurpose] = useState('');
  const [visitDetails, setVisitDetails] = useState(null);

  // ── REAL-TIME LISTENER (admin) ─────────────────────────
  useEffect(() => {
    if (role === 'admin') {
      const unsub = onSnapshot(collection(db, 'visits'), (snap) => {
        const data = snap.docs.map(d => ({
          id: d.id, ...d.data(),
          ts: d.data().timestamp?.toDate() || new Date(),
        }));
        setVisits(data.sort((a, b) => b.ts - a.ts));
      });
      return () => unsub();
    }
  }, [role]);

  // ── LOGIN ──────────────────────────────────────────────
  const handleLogin = async () => {
    setError('');
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    try {
      const result = await signInWithPopup(auth, provider);
      const email = result.user.email;
      if (!email.endsWith(ALLOWED_DOMAIN)) {
        await signOut(auth);
        setError('Tanggap lang ang @neu.edu.ph na email. Subukan ulit.');
        return;
      }
      const q = query(collection(db, 'users'), where('email', '==', email));
      const snap = await getDocs(q);
      if (!snap.empty && snap.docs[0].data().isBlocked) {
        await signOut(auth);
        setError('Blocked ang iyong account. Makipag-ugnayan sa library admin.');
        return;
      }
      await setDoc(doc(db, 'users', result.user.uid), {
        uid: result.user.uid, email,
        displayName: result.user.displayName,
        role: ADMIN_EMAILS.includes(email) ? 'admin' : 'user',
        isBlocked: false,
      }, { merge: true });
      const isAdmin = ADMIN_EMAILS.includes(email);
      setUser(result.user);
      setRole(isAdmin ? 'admin' : 'user');
      setScreen(isAdmin ? 'admin' : 'checkin');
    } catch (err) {
      setError('Hindi makapag-login. Subukan muli.');
      console.error(err);
    }
  };

  // ── LOGOUT ─────────────────────────────────────────────
  const handleLogout = async () => {
    await signOut(auth);
    setUser(null); setRole(null); setScreen('login'); setError('');
  };

  // ── CHECK-IN ───────────────────────────────────────────
  const handleCheckin = async () => {
    if (!purpose) { setError('Pumili ng layunin ng pagbisita.'); return; }
    if (!college) { setError('Pumili ng iyong kolehiyo.'); return; }
    setError('');
    try {
      await addDoc(collection(db, 'visits'), {
        userId: user.uid, email: user.email, name: user.displayName,
        college, purpose, isEmployee, timestamp: Timestamp.now(),
      });
      setVisitDetails({
        name: user.displayName, email: user.email, college, purpose,
        type: isEmployee ? 'Employee' : 'Student',
        time: new Date().toLocaleString('en-PH'),
      });
      setScreen('welcome');
    } catch (err) { setError('Hindi ma-save ang check-in.'); }
  };

  // ── BLOCK/UNBLOCK ──────────────────────────────────────
  const toggleBlock = async (email) => {
    const q = query(collection(db, 'users'), where('email', '==', email));
    const snap = await getDocs(q);
    if (!snap.empty) {
      const ref = doc(db, 'users', snap.docs[0].id);
      const newStatus = !snap.docs[0].data().isBlocked;
      await updateDoc(ref, { isBlocked: newStatus });
      setBlocked(prev => ({ ...prev, [email]: newStatus }));
    }
  };

  // ── FILTER ─────────────────────────────────────────────
  const filtered = visits.filter(v => {
    if (filterPurpose && v.purpose !== filterPurpose) return false;
    if (filterCollege && v.college !== filterCollege) return false;
    if (searchText) {
      const s = searchText.toLowerCase();
      return v.name?.toLowerCase().includes(s) || v.email?.toLowerCase().includes(s);
    }
    return true;
  });

  const filterBar = (
    <div style={{ display:'flex', gap:'0.75rem', marginBottom:'1.25rem', flexWrap:'wrap' }}>
      <input
        type="text" placeholder="Search name or email..." value={searchText}
        onChange={e => setSearchText(e.target.value)}
        style={{ padding:'0.6rem 1rem', border:'1.5px solid #e8e3d8', borderRadius:'10px',
          fontFamily:'DM Sans, sans-serif', fontSize:'0.875rem', flex:1, minWidth:'200px', background:'white' }}
      />
      <select className="neu-select" value={filterCollege}
        onChange={e => setFilterCollege(e.target.value)} style={{ flex:1, minWidth:'180px' }}>
        <option value="">All Colleges</option>
        {COLLEGES.map(c => <option key={c} value={c}>{c}</option>)}
      </select>
      <select className="neu-select" value={filterPurpose}
        onChange={e => setFilterPurpose(e.target.value)} style={{ minWidth:'160px' }}>
        <option value="">All Purposes</option>
        {PURPOSES.map(p => <option key={p} value={p}>{p}</option>)}
      </select>
    </div>
  );

  const inputStyle = {
    width: '100%',
    padding: '0.75rem 1rem',
    borderRadius: '10px',
    border: '1.5px solid rgba(201,162,39,0.3)',
    background: 'rgba(255,255,255,0.06)',
    color: 'rgba(255,255,255,0.35)',
    fontFamily: 'DM Sans, sans-serif',
    fontSize: '0.9rem',
    boxSizing: 'border-box',
    cursor: 'not-allowed',
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
    <div className="app-container">

      {/* ── LOGIN ───────────────────────────────────────── */}
      {screen === 'login' && (
        <div className="login-container">
          <div className="login-card">
            <div className="login-logo">NEU</div>
            <h1>New Era University Library</h1>
            <p>Visitor Management System</p>
            <div className="gold-divider" />

            <div className={`error-msg ${error ? 'visible' : ''}`}>{error}</div>

            {/* Email field (decorative) */}
            <div style={{ marginBottom: '1rem', textAlign: 'left' }}>
              <label style={labelStyle}>Institutional Email</label>
              <input
                type="email"
                placeholder="yourname@neu.edu.ph"
                disabled
                style={inputStyle}
              />
            </div>

            {/* Password field (decorative) */}
            <div style={{ marginBottom: '1.5rem', textAlign: 'left' }}>
              <label style={labelStyle}>Password</label>
              <input
                type="password"
                placeholder="••••••••"
                disabled
                style={inputStyle}
              />
            </div>

            {/* Google Sign-in button */}
            <button className="btn-google" onClick={handleLogin}>
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" fill="#4285F4"/>
                <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853"/>
                <path d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
                <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
              </svg>
              Sign in with Institutional ID
            </button>

            {/* Info footer */}
            <div style={{
              marginTop: '1.5rem',
              padding: '0.85rem 1rem',
              background: 'rgba(255,255,255,0.04)',
              borderRadius: '8px',
              border: '1px solid rgba(255,255,255,0.07)',
              textAlign: 'center',
            }}>
              <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.72rem', marginBottom: '0.2rem' }}>
                Only <span style={{ color: 'var(--neu-gold)' }}>@neu.edu.ph</span> accounts are accepted.
              </p>
              <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: '0.68rem', marginBottom: '0.5rem' }}>
                No. 9 Central Avenue, New Era, Quezon City · (02) 7273-6345
              </p>
              <div style={{ borderTop: '1px solid rgba(255,255,255,0.07)', paddingTop: '0.5rem' }}>
                <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: '0.68rem' }}>
                  Demo: <span style={{ color: 'rgba(201,162,39,0.7)' }}>user@neu.edu.ph</span> or{' '}
                  <span style={{ color: 'rgba(201,162,39,0.7)' }}>admin@neu.edu.ph</span> — any password
                </p>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ── CHECK-IN ─────────────────────────────────────── */}
      {screen === 'checkin' && (
        <div>
          <div className="top-bar">
            <div className="neu-logo">NEU</div>
            <div className="bar-title">Library Check-in</div>
            <button className="btn-nav-out" onClick={handleLogout}>Sign Out</button>
          </div>
          <div className="checkin-body">
            <div className="checkin-card">
              <div className="checkin-card-header">
                <h2>Welcome, {user?.displayName?.split(' ')[0]}!</h2>
                <p>Please fill in your visit details</p>
              </div>
              <div className="checkin-card-body">
                {error && <div className="error-msg visible">{error}</div>}
                <div className="field-group">
                  <label className="field-label">Purpose of Visit</label>
                  <select className="neu-select" value={purpose}
                    onChange={e => setPurpose(e.target.value)}>
                    <option value="">Select purpose...</option>
                    {PURPOSES.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
                <div className="field-group">
                  <label className="field-label">College</label>
                  <select className="neu-select" value={college}
                    onChange={e => setCollege(e.target.value)}>
                    <option value="">Select college...</option>
                    {COLLEGES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="checkbox-group" onClick={() => setIsEmployee(!isEmployee)}>
                  <input type="checkbox" checked={isEmployee}
                    onChange={e => setIsEmployee(e.target.checked)}
                    onClick={e => e.stopPropagation()} />
                  <label>I am a Faculty / Employee</label>
                </div>
                <button className="btn-submit" onClick={handleCheckin}>
                  Submit Check-in
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── WELCOME ──────────────────────────────────────── */}
      {screen === 'welcome' && visitDetails && (
        <div>
          <div className="top-bar">
            <div className="neu-logo">NEU</div>
            <div className="bar-title">Check-in Complete</div>
            <button className="btn-nav-out" onClick={handleLogout}>Sign Out</button>
          </div>
          <div className="welcome-body">
            <div className="welcome-card">
              <div className="welcome-icon">✓</div>
              <h2>Check-in Successful!</h2>
              <p>Welcome to the NEU Library</p>
              <div className="welcome-detail">
                {[['Name', visitDetails.name], ['College', visitDetails.college],
                  ['Purpose', visitDetails.purpose], ['Type', visitDetails.type],
                  ['Time', visitDetails.time]].map(([label, value]) => (
                  <div className="detail-row" key={label}>
                    <span className="detail-label">{label}</span>
                    <span className="detail-value">{value}</span>
                  </div>
                ))}
              </div>
              <button className="btn-submit" onClick={handleLogout}>Done</button>
            </div>
          </div>
        </div>
      )}

      {/* ── ADMIN ────────────────────────────────────────── */}
      {screen === 'admin' && (
        <div>
          <div className="top-bar">
            <div className="neu-logo">NEU</div>
            <div className="bar-title">Admin Dashboard</div>
            <button className="btn-nav-out" onClick={handleLogout}>Sign Out</button>
          </div>
          <div className="admin-body">
            <div className="admin-header">
              <h2>Visitor Log</h2>
              <p>{filtered.length} records found</p>
            </div>
            {filterBar}
            <div className="table-wrap">
              <table className="log-table">
                <thead>
                  <tr>
                    <th>Visitor</th><th>College</th><th>Purpose</th>
                    <th>Type</th><th>Time</th><th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 && (
                    <tr>
                      <td colSpan={6} style={{ textAlign:'center', padding:'2rem', color:'#7a7a9a' }}>
                        No records found.
                      </td>
                    </tr>
                  )}
                  {filtered.map(v => (
                    <tr key={v.id} className={blocked[v.email] ? 'blocked-row' : ''}>
                      <td>
                        <div className="visitor-name">{v.name}</div>
                        <div className="visitor-email">{v.email}</div>
                      </td>
                      <td>{v.college}</td>
                      <td><span className="badge">{v.purpose}</span></td>
                      <td>
                        <span className={`badge ${v.isEmployee ? 'badge-employee' : 'badge-student'}`}>
                          {v.isEmployee ? 'Employee' : 'Student'}
                        </span>
                      </td>
                      <td style={{ fontSize:'0.8rem', color:'#7a7a9a' }}>
                        {v.ts?.toLocaleString('en-PH', {
                          month:'short', day:'numeric',
                          hour:'2-digit', minute:'2-digit'
                        })}
                      </td>
                      <td>
                        <button onClick={() => toggleBlock(v.email)}
                          className={blocked[v.email] ? 'btn-unblock' : 'btn-block'}>
                          {blocked[v.email] ? 'Unblock' : 'Block'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}