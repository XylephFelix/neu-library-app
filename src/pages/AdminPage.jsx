import { useEffect, useState } from "react";
import { db, auth } from "../firebase";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { useNavigate } from "react-router-dom";

export default function AdminPage() {
  const [visits, setVisits] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const getData = async () => {
      const q = query(collection(db, "visits"), orderBy("timestamp", "desc"));
      const snap = await getDocs(q);
      setVisits(snap.docs.map(doc => ({ ...doc.data(), id: doc.id })));
    };
    getData();
  }, []);

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="flex justify-between mb-8">
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        <button onClick={() => { auth.signOut(); navigate("/"); }} className="bg-red-500 text-white px-4 py-2 rounded-lg">Logout</button>
      </div>
      <div className="bg-white rounded-xl shadow overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-200">
            <tr>
              <th className="p-4">Pangalan</th>
              <th className="p-4">College</th>
              <th className="p-4">Layunin</th>
              <th className="p-4">Oras</th>
            </tr>
          </thead>
          <tbody>
            {visits.map(v => (
              <tr key={v.id} className="border-b">
                <td className="p-4">{v.name}</td>
                <td className="p-4">{v.college}</td>
                <td className="p-4">{v.purpose}</td>
                <td className="p-4">{v.timestamp.toDate().toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}