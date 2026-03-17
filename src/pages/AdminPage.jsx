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
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
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
    
    if (dateFrom || dateTo) {
      const from = dateFrom ? new Date(dateFrom + 'T00:00:00') : new Date(0);
      const to = dateTo ? new Date(dateTo + 'T23:59:59') : new Date();
      return ts >= from && ts <= to;
    }
    if (filterPeriod === 'Today') return ts.toDateString() === now.toDateString();
    if (filterPeriod === 'This Week') {
      const weekAgo = new Date(now); weekAgo.setDate(now.getDate() - 7);
      return ts >= weekAgo;
    }
    if (filterPeriod === 'This Month') {
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

 
  const totalVisitors = periodFiltered.length;
  const totalStudents = periodFiltered.filter(v => !v.isEmployee).length;
  const totalEmployees = periodFiltered.filter(v => v.isEmployee).length;
  const collegeCount = {};
  periodFiltered.forEach(v => {
    if (v.college) collegeCount[v.college] = (collegeCount[v.college] || 0) + 1;
  });
  const topCollege = Object.entries(collegeCount).sort((a, b) => b[1] - a[1])[0];
  const topCollegeName = topCollege
    ? topCollege[0].replace('College of Informatics and Computing Studies (CICS)', 'CICS')
        .replace('College of ', '').replace(' Studies', '').replace(' and Sciences', ' & Sci')
    : '—';
  const topCollegeCount = topCollege ? topCollege[1] : 0;


  const getDailyData = () => {
    const days = [];
    const source = (dateFrom || dateTo) ? periodFiltered : visits.filter(v => {
      const weekAgo = new Date(); weekAgo.setDate(weekAgo.getDate() - 6);
      return v.ts >= weekAgo;
    });

  
    const dateMap = {};
    source.forEach(v => {
      const key = v.ts.toLocaleDateString('en-PH', { month: 'short', day: 'numeric' });
      dateMap[key] = (dateMap[key] || 0) + 1;
    });


    return Object.entries(dateMap)
      .map(([date, count]) => ({ date, count }))
      .slice(-7);
  };

  const dailyData = getDailyData();
  const maxCount = Math.max(...dailyData.map(d => d.count), 1);

  const purposeColors = {
    Study: '#3b82f6', Research: '#8b5cf6', Borrowing: '#f59e0b',
    Printing: '#ec4899', 'Group Work': '#10b981', Other: '#6b7280'
  };

  const labelStyle = {
    fontSize: '0.68rem', fontWeight: 700, letterSpacing: '1px',
    textTransform: 'uppercase', color: '#7a7a9a', marginBottom: '0.25rem', display: 'block'
  };

  return (
    <div>
      <div className="top-bar">
        <div className="neu-logo">NEU</div>
        <div className="bar-title">Admin Dashboard</div>
        <button className="btn-nav-out" onClick={handleLogout}>Sign Out</button>
      </div>

      <div className="admin-body">

        {}
        <div style={{ display:'flex', gap:'0.75rem', marginBottom:'1.5rem', flexWrap:'wrap', alignItems:'flex-end' }}>
          <div>
            <label style={labelStyle}>Period</label>
            <select value={dateFrom || dateTo ? 'Custom' : filterPeriod}
              onChange={e => { setFilterPeriod(e.target.value); setDateFrom(''); setDateTo(''); }}
              className="neu-select" style={{ minWidth:'130px' }}>
              {PERIODS.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <div>
            <label style={labelStyle}>From</label>
            <input type="date" value={dateFrom}
              onChange={e => { setDateFrom(e.target.value); setFilterPeriod(''); }}
              style={{ padding:'0.65rem 0.75rem', border:'1.5px solid #e8e3d8', borderRadius:'10px',
                fontFamily:'DM Sans, sans-serif', fontSize:'0.85rem', background:'white', cursor:'pointer' }}
            />
          </div>
          <div>
            <label style={labelStyle}>To</label>
            <input type="date" value={dateTo}
              onChange={e => { setDateTo(e.target.value); setFilterPeriod(''); }}
              style={{ padding:'0.65rem 0.75rem', border:'1.5px solid #e8e3d8', borderRadius:'10px',
                fontFamily:'DM Sans, sans-serif', fontSize:'0.85rem', background:'white', cursor:'pointer' }}
            />
          </div>
          {(dateFrom || dateTo) && (
            <button onClick={() => { setDateFrom(''); setDateTo(''); setFilterPeriod('This Week'); }}
              style={{ padding:'0.65rem 1rem', background:'#f5f0e8', border:'1.5px solid #e8e3d8',
                borderRadius:'10px', fontFamily:'DM Sans, sans-serif', fontSize:'0.82rem',
                cursor:'pointer', color:'#7a7a9a', fontWeight:600 }}>
              Clear
            </button>
          )}
          <div>
            <label style={labelStyle}>Reason</label>
            <select value={filterPurpose} onChange={e => setFilterPurpose(e.target.value)}
              className="neu-select" style={{ minWidth:'140px' }}>
              <option value="">All Reasons</option>
              {PURPOSES.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <div style={{ flex:1, minWidth:'180px' }}>
            <label style={labelStyle}>College</label>
            <select value={filterCollege} onChange={e => setFilterCollege(e.target.value)} className="neu-select">
              <option value="">All Colleges</option>
              {COLLEGES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Visitor Type</label>
            <select value={filterType} onChange={e => setFilterType(e.target.value)}
              className="neu-select" style={{ minWidth:'120px' }}>
              {['All','Students','Employees'].map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
        </div>

        {}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(140px, 1fr))', gap:'1rem', marginBottom:'1.5rem' }}>
          <div style={{ background:'#1a2e6e', borderRadius:'12px', padding:'1.25rem 1.5rem', color:'white' }}>
            <div style={{ fontSize:'0.72rem', fontWeight:600, letterSpacing:'1px', textTransform:'uppercase', color:'rgba(255,255,255,0.6)', marginBottom:'0.5rem' }}>Total Visitors</div>
            <div style={{ fontSize:'2.2rem', fontWeight:800, lineHeight:1 }}>{totalVisitors}</div>
          </div>
          <div style={{ background:'white', border:'2px solid #c9a227', borderRadius:'12px', padding:'1.25rem 1.5rem' }}>
            <div style={{ fontSize:'0.72rem', fontWeight:600, letterSpacing:'1px', textTransform:'uppercase', color:'#7a7a9a', marginBottom:'0.5rem' }}>Students</div>
            <div style={{ fontSize:'2.2rem', fontWeight:800, lineHeight:1, color:'#1a2e6e' }}>{totalStudents}</div>
          </div>
          <div style={{ background:'white', border:'1px solid #e8e3d8', borderRadius:'12px', padding:'1.25rem 1.5rem' }}>
            <div style={{ fontSize:'0.72rem', fontWeight:600, letterSpacing:'1px', textTransform:'uppercase', color:'#7a7a9a', marginBottom:'0.5rem' }}>Employees</div>
            <div style={{ fontSize:'2.2rem', fontWeight:800, lineHeight:1, color:'#1a2e6e' }}>{totalEmployees}</div>
          </div>
          <div style={{ background:'white', border:'1px solid #e8e3d8', borderRadius:'12px', padding:'1.25rem 1.5rem' }}>
            <div style={{ fontSize:'0.72rem', fontWeight:600, letterSpacing:'1px', textTransform:'uppercase', color:'#7a7a9a', marginBottom:'0.5rem' }}>Top College</div>
            <div style={{ fontSize:'1rem', fontWeight:700, color:'#1a2e6e', lineHeight:1.2 }}>{topCollegeName}</div>
            {topCollege && <div style={{ fontSize:'0.75rem', color:'#7a7a9a', marginTop:'0.25rem' }}>{topCollegeCount} visits</div>}
          </div>
        </div>

        {}
        {dailyData.length > 0 && (
          <div style={{ background:'white', borderRadius:'16px', padding:'1.5rem', marginBottom:'1.5rem',
            border:'1px solid #e8e3d8', boxShadow:'0 2px 8px rgba(26,46,110,0.06)' }}>
            <div style={{ fontSize:'0.72rem', fontWeight:700, letterSpacing:'1.5px', textTransform:'uppercase',
              color:'#7a7a9a', marginBottom:'1.25rem' }}>
              Daily Visitors
            </div>
            <div style={{ display:'flex', alignItems:'flex-end', gap:'0.5rem', height:'120px' }}>
              {dailyData.map((d, i) => (
                <div key={i} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:'0.4rem', height:'100%', justifyContent:'flex-end' }}>
                  {}
                  <div style={{ fontSize:'0.72rem', fontWeight:700, color:'#1a2e6e' }}>{d.count}</div>
                  {}
                  <div style={{
                    width:'100%', borderRadius:'6px 6px 0 0',
                    background: i === dailyData.length - 1 ? '#1a2e6e' : '#c9a22740',
                    border: i === dailyData.length - 1 ? 'none' : '1.5px solid #c9a22760',
                    height: `${Math.max((d.count / maxCount) * 80, 6)}px`,
                    transition:'height 0.3s ease',
                    minHeight:'6px',
                  }} />
                  {}
                  <div style={{ fontSize:'0.65rem', color:'#7a7a9a', textAlign:'center', whiteSpace:'nowrap' }}>{d.date}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between',
          marginBottom:'0.75rem', flexWrap:'wrap', gap:'0.5rem' }}>
          <div style={{ fontSize:'0.75rem', fontWeight:700, letterSpacing:'2px', textTransform:'uppercase', color:'#7a7a9a' }}>
            Visitor Log
          </div>
          <input type="text" placeholder="Search by name or email..." value={searchText}
            onChange={e => setSearchText(e.target.value)}
            style={{ padding:'0.5rem 1rem', border:'1.5px solid #e8e3d8', borderRadius:'8px',
              fontFamily:'DM Sans, sans-serif', fontSize:'0.875rem', minWidth:'220px', background:'white' }}
          />
        </div>

        <div className="table-wrap">
          <table className="log-table">
            <thead>
              <tr>
                <th>Visitor</th><th>College</th><th>Reason</th>
                <th>Type</th><th>Time</th><th>Action</th>
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
                      background: (purposeColors[v.purpose] || '#6b7280') + '20',
                      color: purposeColors[v.purpose] || '#6b7280',
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