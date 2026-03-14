import { useState } from "react";
import { auth, db } from "../firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore"; // [cite: 56]
import { useNavigate } from "react-router-dom";

export default function CheckInPage() {
  const [college, setCollege] = useState("");
  const [purpose, setPurpose] = useState("");
  const [done, setDone] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async () => {
    if (!college || !purpose) return alert("Punan lahat ng fields!"); // [cite: 8, 38]
    
    try {
      await addDoc(collection(db, "visits"), { // [cite: 56]
        name: auth.currentUser.displayName,
        email: auth.currentUser.email,
        college, // [cite: 40, 80]
        purpose, // [cite: 39, 79]
        timestamp: serverTimestamp() // Mas maganda gamitin ang serverTimestamp para sa statistics 
      });
      setDone(true);
    } catch (err) {
      alert("Oops! Hindi ma-save ang visit.");
    }
  };

  if (done) return (
    <div className="min-h-screen flex items-center justify-center bg-[#002B5B] p-5">
      <div className="bg-white p-10 rounded-[2.5rem] shadow-2xl text-center border-t-8 border-[#FFD700] max-w-md w-full">
        <div className="text-6xl mb-4">✅</div>
        <h2 className="text-3xl font-black text-[#002B5B] mb-2">Check-in Success!</h2> {/*  */}
        <p className="text-gray-600 font-medium">Enjoy your stay in the Library, <br/><span className="text-[#002B5B] font-bold">{auth.currentUser.displayName}</span>!</p> {/* [cite: 22] */}
        
        <button 
          onClick={() => { auth.signOut(); navigate("/"); }} 
          className="mt-8 w-full py-3 bg-[#FFD700] text-[#002B5B] font-bold rounded-xl hover:bg-[#e6c200] transition-colors"
        >
          LOGOUT
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F5F7FA] flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-[2rem] shadow-2xl w-full max-w-md border-t-8 border-[#002B5B]">
        <h2 className="text-2xl font-black text-[#002B5B] mb-6 text-center uppercase tracking-tight">Library Check-in</h2>
        
        <div className="space-y-4">
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase ml-2 mb-1 block">Your College</label>
            <select 
              value={college}
              onChange={(e)=>setCollege(e.target.value)} 
              className="w-full p-4 border-2 border-gray-100 rounded-2xl focus:border-[#FFD700] outline-none transition-all appearance-none bg-gray-50 font-semibold text-gray-700"
            >
              <option value="">-- Piliin ang College --</option>
              <option value="CICS">College of Information and Computing Sciences</option> {/* [cite: 11, 40] */}
              <option value="CBA">College of Business Administration</option>
              <option value="CED">College of Education</option>
              <option value="CAS">College of Arts and Sciences</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-bold text-gray-500 uppercase ml-2 mb-1 block">Reason for Visit</label>
            <select 
              value={purpose}
              onChange={(e)=>setPurpose(e.target.value)} 
              className="w-full p-4 border-2 border-gray-100 rounded-2xl focus:border-[#FFD700] outline-none transition-all appearance-none bg-gray-50 font-semibold text-gray-700"
            >
              <option value="">-- Layunin ng Pagbisita --</option>
              <option value="Study">Study / Review</option> {/* [cite: 10, 39] */}
              <option value="Research">Research</option>
              <option value="Books">Borrow / Return Books</option>
            </select>
          </div>

          <button 
            onClick={handleSubmit} 
            className="w-full bg-[#002B5B] text-[#FFD700] py-4 rounded-2xl font-black text-lg shadow-lg hover:scale-[1.02] transition-transform mt-4"
          >
            SUBMIT & ENTER
          </button>
        </div>
      </div>
    </div>
  );
}