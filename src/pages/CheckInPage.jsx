import { useState } from "react";
import { auth, db } from "../firebase";
import { collection, addDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";

export default function CheckInPage() {
  const [college, setCollege] = useState("");
  const [purpose, setPurpose] = useState("");
  const [done, setDone] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async () => {
    if (!college || !purpose) return alert("Punan lahat ng fields!");
    await addDoc(collection(db, "visits"), {
      name: auth.currentUser.displayName,
      email: auth.currentUser.email,
      college,
      purpose,
      timestamp: new Date()
    });
    setDone(true);
  };

  if (done) return (
    <div className="min-h-screen flex items-center justify-center bg-green-50 text-center p-5">
      <div className="bg-white p-8 rounded-2xl shadow-md">
        <h2 className="text-3xl font-bold text-green-600 mb-4">Check-in Success!</h2>
        <p>Enjoy your stay in the Library, {auth.currentUser.displayName}!</p>
        <button onClick={() => { auth.signOut(); navigate("/"); }} className="mt-6 text-blue-600 underline">Logout</button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-2xl shadow-lg w-full max-w-md">
        <h2 className="text-xl font-bold mb-6">Library Check-in</h2>
        <select onChange={(e)=>setCollege(e.target.value)} className="w-full p-3 border rounded-xl mb-4">
          <option value="">-- Piliin ang College --</option>
          <option value="CCS">College of Computer Studies</option>
          <option value="CBA">College of Business Admin</option>
          <option value="CE">College of Engineering</option>
        </select>
        <select onChange={(e)=>setPurpose(e.target.value)} className="w-full p-3 border rounded-xl mb-6">
          <option value="">-- Layunin ng Pagbisita --</option>
          <option value="Study">Study / Review</option>
          <option value="Research">Research</option>
          <option value="Books">Borrow/Return Books</option>
        </select>
        <button onClick={handleSubmit} className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold">Submit</button>
      </div>
    </div>
  );
}