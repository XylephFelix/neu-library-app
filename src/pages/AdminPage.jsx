import { useState, useEffect } from "react";
import { auth, db } from "../firebase";
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";
import { useNavigate } from "react-router-dom";

export default function AdminPage() {
  const [visits, setVisits] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [stats, setStats] = useState({ today: 0, total: 0 });
  const navigate = useNavigate();

  useEffect(() => {
    const q = query(collection(db, "visits"), orderBy("timestamp", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const visitData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setVisits(visitData);
      const today = new Date().toLocaleDateString();
      const todayCount = visitData.filter(v => v.timestamp?.toDate().toLocaleDateString() === today).length;
      setStats({ today: todayCount, total: visitData.length });
    });
    return () => unsubscribe();
  }, []);

  const handleLogout = () => {
    auth.signOut();
    navigate("/");
  };

  const filteredVisits = visits.filter(v => v.name?.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto mb-8 flex justify-between items-center bg-white p-6 rounded-3xl shadow-sm border-b-4 border-[#FFD700]">
        <h1 className="text-2xl font-black text-[#002B5B]">NEU LIBRARY ADMIN</h1>
        <button onClick={handleLogout} className="bg-red-500 hover:bg-red-600 text-white px-6 py-2 rounded-xl font-bold transition-all shadow-md">
          LOGOUT
        </button>
      </div>

      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white p-8 rounded-3xl shadow-lg border-l-8 border-[#002B5B]">
          <p className="text-gray-400 font-bold uppercase text-xs">Today's Entry</p>
          <h2 className="text-5xl font-black text-[#002B5B]">{stats.today}</h2>
        </div>
        <div className="bg-white p-8 rounded-3xl shadow-lg border-l-8 border-[#FFD700]">
          <p className="text-gray-400 font-bold uppercase text-xs">Total Logs</p>
          <h2 className="text-5xl font-black text-[#002B5B]">{stats.total}</h2>
        </div>
      </div>

      <div className="max-w-6xl mx-auto bg-white rounded-3xl shadow-xl overflow-hidden">
        <input 
          type="text" 
          placeholder="Search visitor name..." 
          className="w-full p-5 border-b outline-none focus:bg-blue-50 transition-all font-bold text-[#002B5B]" 
          onChange={(e)=>setSearchTerm(e.target.value)} 
        />
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[#002B5B] text-[#FFD700] text-sm uppercase">
              <tr>
                <th className="p-4 text-left">Name</th>
                <th className="p-4 text-left">College</th>
                <th className="p-4 text-left">Purpose</th>
                <th className="p-4 text-left">Time</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filteredVisits.map((v) => (
                <tr key={v.id} className="hover:bg-gray-50">
                  <td className="p-4 font-bold text-[#002B5B]">{v.name}</td>
                  <td className="p-4">{v.college}</td>
                  <td className="p-4">{v.purpose}</td>
                  <td className="p-4 text-gray-400 italic text-sm">
                    {v.timestamp?.toDate().toLocaleTimeString()}
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