import { useEffect, useState } from "react";
import { db, auth } from "../firebase";
import { collection, getDocs, query, orderBy, doc, updateDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";

export default function AdminPage() {
  const [visits, setVisits] = useState([]);
  const [searchTerm, setSearchTerm] = useState(""); // State para sa Search
  const navigate = useNavigate();

  useEffect(() => {
    const getData = async () => {
      const q = query(collection(db, "visits"), orderBy("timestamp", "desc"));
      const snap = await getDocs(q);
      setVisits(snap.docs.map(doc => ({ ...doc.data(), id: doc.id })));
    };
    getData();
  }, []);

  // --- STATISTICS LOGIC ---
  const today = new Date().toDateString();
  const lastWeek = new Date();
  lastWeek.setDate(lastWeek.getDate() - 7);

  const stats = {
    todayCount: visits.filter(v => v.timestamp?.toDate().toDateString() === today).length,
    weeklyCount: visits.filter(v => v.timestamp?.toDate() > lastWeek).length,
    ccsCount: visits.filter(v => v.college === "CCS").length
  };

  // --- SEARCH LOGIC ---
  const filteredVisits = visits.filter(v => 
    v.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // --- BLOCK USER LOGIC ---
  const toggleBlock = async (userId, currentStatus) => {
    try {
      const userRef = doc(db, "users", userId); // Siguraduhin na 'users' ang collection name sa Firebase
      await updateDoc(userRef, { isBlocked: !currentStatus });
      alert("Status updated!");
      window.location.reload(); // Refresh para makita ang update
    } catch (err) {
      alert("Error: Make sure the user exists in the 'users' collection.");
    }
  };

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-extrabold text-blue-900">Library Admin Dashboard</h1>
        <button onClick={() => { auth.signOut(); navigate("/"); }} className="bg-red-600 hover:bg-red-700 text-white px-5 py-2 rounded-xl transition">Logout</button>
      </div>

      {/* --- STATS CARDS --- */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-2xl shadow-sm border-t-4 border-blue-500">
          <h3 className="text-gray-500 font-bold uppercase text-xs">Today's Visits</h3>
          <p className="text-4xl font-black text-gray-800">{stats.todayCount}</p>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border-t-4 border-green-500">
          <h3 className="text-gray-500 font-bold uppercase text-xs">Total CCS</h3>
          <p className="text-4xl font-black text-gray-800">{stats.ccsCount}</p>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border-t-4 border-purple-500">
          <h3 className="text-gray-500 font-bold uppercase text-xs">Last 7 Days</h3>
          <p className="text-4xl font-black text-gray-800">{stats.weeklyCount}</p>
        </div>
      </div>

      {/* --- SEARCH BAR --- */}
      <div className="mb-6">
        <input 
          type="text"
          placeholder="Maghanap ng pangalan ng estudyante..."
          className="w-full md:w-1/3 p-3 rounded-xl border-none shadow-sm focus:ring-2 focus:ring-blue-400 outline-none"
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-200">
        <table className="w-full text-left border-collapse">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="p-4 font-bold text-gray-600">Pangalan</th>
              <th className="p-4 font-bold text-gray-600">College</th>
              <th className="p-4 font-bold text-gray-600">Layunin</th>
              <th className="p-4 font-bold text-gray-600">Oras</th>
              <th className="p-4 font-bold text-gray-600 text-center">Aksyon</th>
            </tr>
          </thead>
          <tbody>
            {filteredVisits.map(v => (
              <tr key={v.id} className="hover:bg-gray-50 transition border-b last:border-0">
                <td className="p-4 font-medium text-gray-800">{v.name}</td>
                <td className="p-4"><span className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs font-bold">{v.college}</span></td>
                <td className="p-4 text-gray-600">{v.purpose}</td>
                <td className="p-4 text-gray-500 text-sm">{v.timestamp?.toDate().toLocaleString()}</td>
                <td className="p-4 text-center">
                  <button 
                    onClick={() => toggleBlock(v.userId, v.isBlocked)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition ${v.isBlocked ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-red-100 text-red-700 hover:bg-red-200'}`}
                  >
                    {v.isBlocked ? "UNBLOCK" : "BLOCK USER"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}