import React, { useState } from 'react';
import { auth, db } from '../firebase';
import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import '../App.css';

const COLLEGES = [
  'College of Informatics and Computing Studies (CICS)',
  'College of Engineering',
  'College of Nursing',
  'College of Business Administration',
  'College of Education',
  'College of Arts and Sciences',
  'College of Architecture',
  'College of Criminology',
];
const PURPOSES = ['Study','Research','Borrowing','Printing','Group Work','Other'];

export default function CheckInPage() {
  const navigate = useNavigate();
  const user = auth.currentUser;
  const [college, setCollege] = useState('');
  const [purpose, setPurpose] = useState('');
  const [isEmployee, setIsEmployee] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [visitDetails, setVisitDetails] = useState(null);

  const handleCheckin = async () => {
    if (!college || !purpose) { setError('Piliin ang iyong Kolehiyo at Layunin.'); return; }
    setError(''); setLoading(true);
    try {
      const now = new Date();
      await addDoc(collection(db, 'visits'), {
        userId: user.uid, name: user.displayName, email: user.email,
        college, purpose, isEmployee, timestamp: Timestamp.now(),
      });
      setVisitDetails({
        name: user.displayName,
        email: user.email,
        college,
        purpose,
        type: isEmployee ? 'Employee' : 'Student',
        dateTime: now.toLocaleDateString('en-PH', { weekday:'long', year:'numeric', month:'long', day:'numeric' })
          + ', ' + now.toLocaleTimeString('en-PH', { hour:'2-digit', minute:'2-digit' }),
      });
      setDone(true);
    } catch (err) {
      setError('Error sa pag-save. Subukan muli.');
    }
    setLoading(false);
  };

  const handleLogout = async () => { await signOut(auth); navigate('/'); };

 
  if (done && visitDetails) {
    return (
      <div style={{
        minHeight: '100vh', background: '#f5f0e8',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem',
        fontFamily: "'DM Sans', sans-serif",
      }}>
        <div style={{ background: 'white', borderRadius: '16px', overflow: 'hidden',
          width: '100%', maxWidth: '480px', boxShadow: '0 8px 40px rgba(26,46,110,0.15)' }}>

          {

          }
          <div style={{
            background: '#1a2e6e', padding: '2.5rem 2rem', textAlign: 'center',
            borderBottom: '3px solid #c9a227', position: 'relative', overflow: 'hidden',
          }}>
            {

            }
            <div style={{
              position: 'absolute', width: '120px', height: '120px', borderRadius: '50%',
              background: 'rgba(255,255,255,0.05)', top: '-20px', right: '-20px',
            }} />
            {

            }
            <div style={{
              width: '64px', height: '64px', borderRadius: '50%',
              border: '2px solid rgba(201,162,39,0.5)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 1.25rem',
            }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                <path d="M5 13l4 4L19 7" stroke="#c9a227" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <h2 style={{ fontFamily: "'Playfair Display', serif", color: 'white',
              fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.4rem' }}>
              Welcome to NEU Library!
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: '0.82rem' }}>
              Your visit has been successfully recorded.
            </p>
          </div>

          {

          }
          <div style={{ padding: '1.5rem 2rem' }}>
            <div style={{
              fontSize: '0.68rem', fontWeight: 700, letterSpacing: '1.5px',
              textTransform: 'uppercase', color: '#7a7a9a', marginBottom: '0.75rem',
            }}>Visit Details</div>

            <div style={{ border: '1px solid #f0ece2', borderRadius: '10px', overflow: 'hidden' }}>
              {[
                ['Name', visitDetails.name],
                ['Email', visitDetails.email],
                ['College', visitDetails.college],
                ['Purpose', visitDetails.purpose],
                ['Type', visitDetails.type],
                ['Date & Time', visitDetails.dateTime],
              ].map(([label, value], i, arr) => (
                <div key={label} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '0.75rem 1rem',
                  borderBottom: i < arr.length - 1 ? '1px solid #f0ece2' : 'none',
                  background: i % 2 === 0 ? '#faf8f2' : 'white',
                }}>
                  <span style={{ fontSize: '0.78rem', color: '#7a7a9a', fontWeight: 500 }}>{label}</span>
                  <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#1a2e6e', textAlign: 'right', maxWidth: '60%' }}>
                    {value}
                  </span>
                </div>
              ))}
            </div>

            <button onClick={handleLogout} style={{
              width: '100%', marginTop: '1.25rem',
              background: 'white', color: '#1a1a2e',
              padding: '0.875rem', border: '1.5px solid #e8e3d8',
              borderRadius: '10px', cursor: 'pointer',
              fontFamily: 'DM Sans, sans-serif', fontWeight: 600, fontSize: '0.9rem',
              transition: 'all 0.2s',
            }}
              onMouseEnter={e => { e.currentTarget.style.background = '#f5f0e8'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'white'; }}
            >
              Sign Out
            </button>
          </div>
        </div>
        <style>{`@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=DM+Sans:wght@300;400;500;600&display=swap');`}</style>
      </div>
    );
  }


  return (
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
              <select className="neu-select" value={purpose} onChange={e => setPurpose(e.target.value)}>
                <option value="">Select purpose...</option>
                {PURPOSES.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div className="field-group">
              <label className="field-label">College</label>
              <select className="neu-select" value={college} onChange={e => setCollege(e.target.value)}>
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
            <button className="btn-submit" onClick={handleCheckin} disabled={loading}>
              {loading ? 'Saving...' : 'Submit Check-in'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}