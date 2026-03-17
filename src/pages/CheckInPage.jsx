import React, { useState } from 'react';
import { auth, db } from '../firebase';
import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';

const COLLEGES = [
  'College of Computer Studies','College of Engineering','College of Nursing',
  'College of Business Administration','College of Education',
  'College of Arts and Sciences','College of Architecture','College of Criminology',
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

  const handleCheckin = async () => {
    if (!college || !purpose) { setError('Piliin ang iyong Kolehiyo at Layunin.'); return; }
    setError(''); setLoading(true);
    try {
      await addDoc(collection(db, 'visits'), {
        userId: user.uid, name: user.displayName, email: user.email,
        college, purpose, isEmployee, timestamp: Timestamp.now(),
      });
      handleLogout();
    } catch (err) { setError('Error sa pag-save. Subukan muli.'); setLoading(false); }
  };

  const handleLogout = async () => { await signOut(auth); navigate('/'); };

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
              <input type="checkbox" checked={isEmployee} onChange={e => setIsEmployee(e.target.checked)} onClick={e => e.stopPropagation()} />
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