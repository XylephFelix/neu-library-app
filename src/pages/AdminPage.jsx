import React, { useState, useEffect } from 'react';
import { db, auth } from '../firebase';
import { collection, onSnapshot, query, doc, updateDoc, getDocs, where } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import '../App.css';

const COLLEGES = [
  'College of Computer Studies','College of Engineering','College of Nursing',
  'College of Business Administration','College of Education',
  'College of Arts and Sciences','College of Architecture','College of Criminology',
];
const PURPOSES = ['Study','Research','Borrowing','Printing','Group Work','Other'];

export default function AdminPage() {
  const [visits, setVisits] = useState([]);
  const [blocked, setBlocked] = useState({});
  const [searchText, setSearchText] = useState('');
  const [filterCollege, setFilterCollege] = useState('');
  const [filterPurpose, setFilterPurpose] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'visits'), (snapshot) => {
      const data = snapshot.docs.map(d => ({ id: d.id, ...d.data(), ts: d.data().timestamp?.toDate() || new Date() }));
      setVisits(data.sort((a, b) => b.ts - a.ts));
    });
    return () => unsub();
  }, []);

  const toggleBlock = async (email) => {
    const q = query(collection(db, 'users'), where('email', '==', email));
    const snap = await getDocs(q);
    if (!snap.empty) {
      const userRef = doc(db, 'users', snap.docs[0].id);
      const newStatus = !snap.docs[0].data().isBlocked;
      await updateDoc(userRef, { isBlocked: newStatus });
      setBlocked(prev => ({ ...prev, [email]: newStatus }));
    }
  };

  const handleLogout = async () => { await signOut(auth); navigate('/'); };

  const filtered = visits.filter(v => {
    if (filterPurpose && v.purpose !== filterPurpose) return false;
    if (filterCollege && v.college !== filterCollege) return false;
    if (searchText) {
      const s = searchText.toLowerCase();
      return v.name?.toLowerCase().includes(s) || v.email?.toLowerCase().includes(s);
    }
    return true;
  });

  return (
    <div>
      <div className="top-bar">
        <div className="neu-logo">NEU</div>
        <div className="bar-title">Admin Dashboard</div>
        <button className="btn-nav-out" onClick={handleLogout}>Sign Out</button>
      </div>
      <div className="admin-body">
        <div className="admin-header">
          <h2>Visitor Log</h2>
          <p>{filtered.length} record{filtered.length !== 1 ? 's' : ''} found</p>
        </div>
        <div style={{ display:'flex', gap:'0.75rem', marginBottom:'1.25rem', flexWrap:'wrap' }}>
          <input type="text" placeholder="Search name or email..." value={searchText}
            onChange={e => setSearchText(e.target.value)}
            style={{ padding:'0.6rem 1rem', border:'1.5px solid #e8e3d8', borderRadius:'10px',
              fontFamily:'DM Sans, sans-serif', fontSize:'0.875rem', flex:1, minWidth:'200px', background:'white' }}
          />
          <select className="neu-select" value={filterCollege} onChange={e => setFilterCollege(e.target.value)} style={{ flex:1, minWidth:'180px' }}>
            <option value="">All Colleges</option>
            {COLLEGES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <select className="neu-select" value={filterPurpose} onChange={e => setFilterPurpose(e.target.value)} style={{ minWidth:'160px' }}>
            <option value="">All Purposes</option>
            {PURPOSES.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>
        <div className="table-wrap">
          <table className="log-table">
            <thead>
              <tr><th>Visitor</th><th>College</th><th>Purpose</th><th>Type</th><th>Time</th><th>Action</th></tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr><td colSpan={6} style={{ textAlign:'center', padding:'2rem', color:'#7a7a9a' }}>No records found.</td></tr>
              )}
              {filtered.map(v => (
                <tr key={v.id} className={blocked[v.email] ? 'blocked-row' : ''}>
                  <td><div className="visitor-name">{v.name}</div><div className="visitor-email">{v.email}</div></td>
                  <td>{v.college}</td>
                  <td><span className="badge">{v.purpose}</span></td>
                  <td><span className={`badge ${v.isEmployee ? 'badge-employee' : 'badge-student'}`}>{v.isEmployee ? 'Employee' : 'Student'}</span></td>
                  <td style={{ fontSize:'0.8rem', color:'#7a7a9a' }}>{v.ts?.toLocaleString('en-PH', { month:'short', day:'numeric', hour:'2-digit', minute:'2-digit' })}</td>
                  <td><button onClick={() => toggleBlock(v.email)} className={blocked[v.email] ? 'btn-unblock' : 'btn-block'}>{blocked[v.email] ? 'Unblock' : 'Block'}</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}