import { useState } from "react";
import { auth, db } from "../firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { useNavigate } from "react-router-dom";

export default function CheckInPage() {
  const [college, setCollege] = useState("");
  const [purpose, setPurpose] = useState("");
  const [done, setDone] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async () => {
    if (!college || !purpose) return alert("Punan lahat ng fields!");
    try {
      await addDoc(collection(db, "visits"), {
        name: auth.currentUser.displayName,
        email: auth.currentUser.email,
        college,
        purpose,
        timestamp: serverTimestamp()
      });
      setDone(true);
    } catch (err) {
      alert("Error saving visit.");
    }
  };

  if (done) return (
    <div className="min-h-screen flex items-center justify-center bg-[#002B5B] p-5">
      <div className="bg-white p-10 rounded-[2.5rem] shadow-2xl text-center border-t-8 border-[#FFD700] max-w-md w-full">
        <div className="text-6xl mb-4">✅</div>
        <h2 className="text-3xl font-black text-[#002B5B] mb-2 text-center">Check-in Success!</h2>
        <p className="text-gray-600 font-medium text-center">Welcome to NEU Library, <br/><span className="text-[#002B5B] font-bold">{auth.currentUser.displayName}</span>!</p>
        <button onClick={() => { auth.signOut(); navigate("/"); }} className="mt-8 w-full py-3 bg-[#FFD700] text-[#002B5B] font-bold rounded-xl hover:bg-[#e6c200]">LOGOUT</button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F5F7FA] flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-[2rem] shadow-2xl w-full max-w-md border-t-8 border-[#002B5B]">
        <h2 className="text-2xl font-black text-[#002B5B] mb-6 text-center uppercase">Library Check-in</h2>
        <div className="space-y-4">
          <select value={college} onChange={(e)=>setCollege(e.target.value)} className="w-full p-4 border-2 border-gray-100 rounded-2xl outline-none focus:border-[#FFD700] bg-gray-50 font-semibold">
            <option value="">-- Select College --</option>
            <option value="CICS">College of Information and Computing Sciences</option>
            <option value="CBA">College of Business Administration</option>
            <option value="CON">College of Nursing</option>
            <option value="COE">College of Engineering</option>
          </select>
          <select value={purpose} onChange={(e)=>setPurpose(e.target.value)} className="w-full p-4 border-2 border-gray-100 rounded-2xl outline-none focus:border-[#FFD700] bg-gray-50 font-semibold">
            <option value="">-- Purpose of Visit --</option>
            <option value="Study">Study / Review</option>
            <option value="Research">Research</option>
            <option value="Books">Borrow / Return Books</option>
          </select>
          <button onClick={handleSubmit} className="w-full bg-[#002B5B] text-[#FFD700] py-4 rounded-2xl font-black text-lg shadow-lg hover:scale-105 transition-transform">SUBMIT</button>
        </div>
      </div>
    </div>
  );
}