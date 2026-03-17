import React, { useState, useEffect } from 'react';
import { db, auth } from '../firebase';
import { collection, onSnapshot, query, doc, updateDoc, getDocs, where } from 'firebase/firestore';
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
const PERIODS = ['Today','This Week','This Month','All Time'];

export default function AdminPage() {
  const [visits, setVisits] = useState([]);
  const [blocked, setBlocked] = useState({});
  const [searchText, setSearchText] = useState('');
  const [filterCollege, setFilterCollege] = useState('');
  const [filterPurpose, setFilterPurpose] = useState('');
  const [filterPeriod, setFilterPeriod] = useState('This Week');
  const [filterType, setFilterType] = useState('All');
  const navigate = useNavigate();

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'visits'), (snapshot) => {
      const data = snapshot.docs.map(d => ({
        id: d.id, ...d.data(),
        ts: d.data().timestamp?.toDate() || new Date()
      }));
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

  const isInPeriod = (ts) => {
    const now = new Date();
    if (filterPeriod === 'Today') {
      return ts.toDateString() === now.toDateString();
    } else if (filterPeriod === 'This Week') {
      const weekAgo = new Date(now); weekAgo.setDate(now.getDate() - 7);
      return ts >= weekAgo;
    } else if (filterPeriod === 'This Month') {
      return ts.getMonth() === now.getMonth() && ts.getFullYear() === now.getFullYear();
    }
    return true;
  };

  const periodFiltered = visits.filter(v => isInPeriod(v.ts));

  const filtered = periodFiltered.filter(v => {
    if (filterPurpose && v.purpose !== filterPurpose) return false;
    if (filterCollege && v.college !== filterCollege) return false;
    if (filterType === 'Students' && v.isEmployee) return false;
    if (filterType === 'Employees' && !v.isEmployee) return false;
    if (searchText) {
      const s = searchText.toLowerCase();
      return v.name?.toLowerCase().includes(s) || v.email?.toLowerCase().includes(s);
    }
    return true;
  });

  // Stats
  const totalVisitors = periodFiltered.length;
  const totalStudents = periodFiltered.filter(v => !v.isEmployee).length;
  const totalEmployees = periodFiltered.filter(v => v.isEmployee).length;
  const collegeCount = {};
  periodFiltered.forEach(v => {
    if (v.college) collegeCount[v.college] = (collegeCount[v.college] || 0) + 1;
  });
  const topCollege = Object.entries(collegeCount).sort((a, b) => b[1] - a[1])[0];
  const topCollegeName = topCollege ? topCollege[0].replace('College of ', '').replace(' Studies', '').replace(' and Computing', '') : '—';
  const topCollegeCount = topCollege ? topCollege[1] : 0;

  const purposeColors = {
    Study: '#3b82f6', Research: '#8b5cf6', Borrowing: '#f59e0b',
    Printing: '#ec4899', 'Group Work': '#10b981', Other: '#6b7280'
  };

  return (
    <div>
      {/* Top Bar */}
      <div className="top-bar">
        <div className="neu-logo">NEU</div>
        <div className="bar-title">Admin Dashboard</div>
        <button className="btn-nav-out" onClick={handleLogout}>Sign Out</button>
      </div>

      <div className="admin-body">

        {/* ── FILTERS ROW ── */}
        <div style={{ display:'flex', gap:'0.75rem', marginBottom:'1.5rem', flexWrap:'wrap', alignItems:'center' }}>
          {/* Period */}
          <div style={{ display:'flex', flexDirection:'column', gap:'0.25rem' }}>
            <label style={{ fontSize:'0.68rem', fontWeight:700, letterSpacing:'1px', textTransform:'uppercase', color:'#7a7a9a' }}>Period</label>
            <select value={filterPeriod} onChange={e => setFilterPeriod(e.target.value)} className="neu-select" style={{ minWidth:'130px' }}>
              {PERIODS.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          {/* Reason */}
          <div style={{ display:'flex', flexDirection:'column', gap:'0.25rem' }}>
            <label style={{ fontSize:'0.68rem', fontWeight:700, letterSpacing:'1px', textTransform:'uppercase', color:'#7a7a9a' }}>Reason</label>
            <select value={filterPurpose} onChange={e => setFilterPurpose(e.target.value)} className="neu-select" style={{ minWidth:'140px' }}>
              <option value="">All Reasons</option>
              {PURPOSES.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          {/* College */}
          <div style={{ display:'flex', flexDirection:'column', gap:'0.25rem', flex:1, minWidth:'180px' }}>
            <label style={{ fontSize:'0.68rem', fontWeight:700, letterSpacing:'1px', textTransform:'uppercase', color:'#7a7a9a' }}>College</label>
            <select value={filterCollege} onChange={e => setFilterCollege(e.target.value)} className="neu-select">
              <option value="">All Colleges</option>
              {COLLEGES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          {/* Visitor Type */}
          <div style={{ display:'flex', flexDirection:'column', gap:'0.25rem' }}>
            <label style={{ fontSize:'0.68rem', fontWeight:700, letterSpacing:'1px', textTransform:'uppercase', color:'#7a7a9a' }}>Visitor Type</label>
            <select value={filterType} onChange={e => setFilterType(e.target.value)} className="neu-select" style={{ minWidth:'120px' }}>
              {['All','Students','Employees'].map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
        </div>

        {/* ── STATS CARDS ── */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(140px, 1fr))', gap:'1rem', marginBottom:'1.5rem' }}>
          {/* Total */}
          <div style={{ background:'#1a2e6e', borderRadius:'12px', padding:'1.25rem 1.5rem', color:'white' }}>
            <div style={{ fontSize:'0.72rem', fontWeight:600, letterSpacing:'1px', textTransform:'uppercase', color:'rgba(255,255,255,0.6)', marginBottom:'0.5rem' }}>Total Visitors</div>
            <div style={{ fontSize:'2.2rem', fontWeight:800, lineHeight:1 }}>{totalVisitors}</div>
          </div>
          {/* Students */}
          <div style={{ background:'white', border:'2px solid #c9a227', borderRadius:'12px', padding:'1.25rem 1.5rem' }}>
            <div style={{ fontSize:'0.72rem', fontWeight:600, letterSpacing:'1px', textTransform:'uppercase', color:'#7a7a9a', marginBottom:'0.5rem' }}>Students</div>
            <div style={{ fontSize:'2.2rem', fontWeight:800, lineHeight:1, color:'#1a2e6e' }}>{totalStudents}</div>
          </div>
          {/* Employees */}
          <div style={{ background:'white', border:'1px solid #e8e3d8', borderRadius:'12px', padding:'1.25rem 1.5rem' }}>
            <div style={{ fontSize:'0.72rem', fontWeight:600, letterSpacing:'1px', textTransform:'uppercase', color:'#7a7a9a', marginBottom:'0.5rem' }}>Employees</div>
            <div style={{ fontSize:'2.2rem', fontWeight:800, lineHeight:1, color:'#1a2e6e' }}>{totalEmployees}</div>
          </div>
          {/* Top College */}
          <div style={{ background:'white', border:'1px solid #e8e3d8', borderRadius:'12px', padding:'1.25rem 1.5rem' }}>
            <div style={{ fontSize:'0.72rem', fontWeight:600, letterSpacing:'1px', textTransform:'uppercase', color:'#7a7a9a', marginBottom:'0.5rem' }}>Top College</div>
            <div style={{ fontSize:'1rem', fontWeight:700, color:'#1a2e6e', lineHeight:1.2 }}>{topCollegeName}</div>
            {topCollege && <div style={{ fontSize:'0.75rem', color:'#7a7a9a', marginTop:'0.25rem' }}>{topCollegeCount} visits</div>}
          </div>
        </div>

        {/* ── VISITOR LOG HEADER ── */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'0.75rem', flexWrap:'wrap', gap:'0.5rem' }}>
          <div style={{ fontSize:'0.75rem', fontWeight:700, letterSpacing:'2px', textTransform:'uppercase', color:'#7a7a9a' }}>Visitor Log</div>
          <input
            type="text" placeholder="Search by name or email..." value={searchText}
            onChange={e => setSearchText(e.target.value)}
            style={{ padding:'0.5rem 1rem', border:'1.5px solid #e8e3d8', borderRadius:'8px',
              fontFamily:'DM Sans, sans-serif', fontSize:'0.875rem', minWidth:'220px', background:'white' }}
          />
        </div>

        {/* ── TABLE ── */}
        <div className="table-wrap">
          <table className="log-table">
            <thead>
              <tr>
                <th>Visitor</th>
                <th>College</th>
                <th>Reason</th>
                <th>Type</th>
                <th>Time</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr><td colSpan={6} style={{ textAlign:'center', padding:'2rem', color:'#7a7a9a' }}>No records found.</td></tr>
              )}
              {filtered.map(v => (
                <tr key={v.id} className={blocked[v.email] ? 'blocked-row' : ''}>
                  <td>
                    <div className="visitor-name">{v.name}</div>
                    <div className="visitor-email">{v.email}</div>
                  </td>
                  <td style={{ fontSize:'0.82rem' }}>{v.college}</td>
                  <td>
                    <span style={{
                      display:'inline-block', padding:'3px 10px', borderRadius:'20px',
                      fontSize:'0.72rem', fontWeight:700,
                      background: purposeColors[v.purpose] ? purposeColors[v.purpose] + '20' : '#e0e7ff',
                      color: purposeColors[v.purpose] || '#3730a3',
                    }}>{v.purpose}</span>
                  </td>
                  <td>
                    <span className={`badge ${v.isEmployee ? 'badge-employee' : 'badge-student'}`}>
                      {v.isEmployee ? 'Employee' : 'Student'}
                    </span>
                  </td>
                  <td style={{ fontSize:'0.8rem', color:'#7a7a9a' }}>
                    {v.ts?.toLocaleString('en-PH', { month:'short', day:'numeric', hour:'2-digit', minute:'2-digit' })}
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
  );
}