import { useState, useEffect } from "react";
import { db } from "../firebase";
import { collection, query, orderBy, onSnapshot, doc, updateDoc, where } from "firebase/firestore";

export default function AdminPage() {
  const [visits, setVisits] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [stats, setStats] = useState({ today: 0, total: 0 });

  useEffect(() => {
    // 1. Real-time listener para sa lahat ng visits [cite: 67, 71]
    const q = query(collection(db, "visits"), orderBy("timestamp", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const visitData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.id, ...doc.data() }));
      setVisits(visitData);
      
      // 2. Simpleng calculation para sa statistics [cite: 19, 43]
      const today = new Date().toLocaleDateString();
      const todayCount = visitData.filter(v => 
        v.timestamp?.toDate().toLocaleDateString() === today
      ).length;
      
      setStats({ today: todayCount, total: visitData.length });
    });

    return () => unsubscribe();
  }, []);

  // 3. Logic para sa pag-block ng user [cite: 20, 48, 74]
  const toggleBlockStatus = async (userId, currentStatus) => {
    const userRef = doc(db, "users", userId);
    await updateDoc(userRef, { isBlocked: !currentStatus });
    alert("User status updated!");
  };

  const filteredVisits = visits.filter(v => 
    v.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    v.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header Section */}
      <div className="max-w-6xl mx-auto mb-8 flex justify-between items-center">
        <h1 className="text-3xl font-black text-[#002B5B]">ADMIN DASHBOARD</h1>
        <div className="bg-[#FFD700] text-[#002B5B] px-4 py-1 rounded-full font-bold text-sm">LIVE MONITORING</div>
      </div>

      {/* Stats Cards [cite: 19, 43] */}
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
        <div className="bg-white p-6 rounded-3xl shadow-lg border-l-8 border-[#002B5B]">
          <p className="text-gray-500 font-bold uppercase text-xs">Visits Today</p>
          <h2 className="text-5xl font-black text-[#002B5B]">{stats.today}</h2>
        </div>
        <div className="bg-white p-6 rounded-3xl shadow-lg border-l-8 border-[#FFD700]">
          <p className="text-gray-500 font-bold uppercase text-xs">Total Library Users</p>
          <h2 className="text-5xl font-black text-[#002B5B]">{stats.total}</h2>
        </div>
      </div>

      {/* Search and Table [cite: 18, 47] */}
      <div className="max-w-6xl mx-auto bg-white rounded-3xl shadow-xl overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <input 
            type="text" 
            placeholder="Search visitor name or email..." 
            className="w-full p-4 bg-gray-50 rounded-2xl border-2 border-transparent focus:border-[#FFD700] outline-none transition-all font-medium"
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-[#002B5B] text-[#FFD700] uppercase text-xs font-bold">
              <tr>
                <th className="p-4">Name</th>
                <th className="p-4">College</th>
                <th className="p-4">Purpose</th>
                <th className="p-4">Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredVisits.map((visit) => (
                <tr key={visit.id} className="hover:bg-blue-50 transition-colors">
                  <td className="p-4 font-bold text-[#002B5B]">{visit.name}</td>
                  <td className="p-4 text-gray-600 font-semibold">{visit.college}</td>
                  <td className="p-4"><span className="bg-gray-100 px-3 py-1 rounded-lg text-xs font-bold text-gray-500">{visit.purpose}</span></td>
                  <td className="p-4 text-sm text-gray-400 italic">
                    {visit.timestamp?.toDate().toLocaleTimeString()}
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