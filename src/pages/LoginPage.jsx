import { signInWithPopup } from "firebase/auth";
import { auth, provider, db } from "../firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";


let logo;
try {
  logo = require("../assets/logo.jpg");
} catch (e) {
  logo = ""; 
}

export default function LoginPage() {
  const navigate = useNavigate();

  const handleLogin = async () => {
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      if (!user.email.endsWith("@neu.edu.ph")) {
        await auth.signOut();
        alert("Institutional email lang ang pinapayagan (@neu.edu.ph)");
        return;
      }

      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists() && userSnap.data().isBlocked) {
        await auth.signOut();
        alert("Blocked ang account mo. Contact admin.");
        return;
      }

      if (!userSnap.exists()) {
        await setDoc(userRef, {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          role: "user",
          isBlocked: false,
          createdAt: new Date()
        });
      }

      const role = userSnap.exists() ? userSnap.data().role : "user";
      navigate(role === "admin" ? "/admin" : "/checkin");
      
    } catch (error) {
      alert("Error sa login. Subukan ulit.");
    }
  };

  return (
    <div className="min-h-screen bg-[#002B5B] flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl p-10 text-center max-w-sm w-full border-b-8 border-[#FFD700]">
        <div className="mb-6">
           {logo ? (
             <img src={logo} alt="NEU Logo" className="w-24 h-24 mx-auto mb-4 drop-shadow-lg" />
           ) : (
             <div className="w-24 h-24 bg-[#002B5B] text-[#FFD700] rounded-full mx-auto flex items-center justify-center text-4xl font-black mb-4">L</div>
           )}
           <h1 className="text-4xl font-black text-[#002B5B] tracking-tight">NEU Library</h1>
           <p className="text-gray-400 font-medium uppercase tracking-widest text-[10px] mt-2">Visitor Management System</p>
        </div>
        <button onClick={handleLogin} className="w-full bg-[#002B5B] hover:bg-[#003d82] text-[#FFD700] font-black py-4 px-6 rounded-2xl transition-all shadow-lg">
          SIGN IN WITH NEU EMAIL
        </button>
      </div>
    </div>
  );
}