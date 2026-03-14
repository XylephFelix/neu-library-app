import { signInWithPopup } from "firebase/auth";
import { auth, provider, db } from "../firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";

export default function LoginPage() {
  const navigate = useNavigate();

  const handleLogin = async () => {
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      if (!user.email.endsWith("@neu.edu.ph")) {
        await auth.signOut();
        alert("Institutional email lang ang pinapayagan (@neu.edu.ph)"); // [cite: 35, 36, 63]
        return;
      }

      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists() && userSnap.data().isBlocked) { // [cite: 20, 48, 65]
        await auth.signOut();
        alert("Blocked ang account mo. Contact admin.");
        return;
      }

      if (!userSnap.exists()) {
        await setDoc(userRef, { // [cite: 55]
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          role: "user", 
          isBlocked: false,
          createdAt: new Date()
        });
      }

      const role = userSnap.exists() ? userSnap.data().role : "user";
      navigate(role === "admin" ? "/admin" : "/checkin"); // [cite: 17, 66]
      
    } catch (error) {
      alert("Error sa login. Subukan ulit.");
    }
  };

  return (
    <div className="min-h-screen bg-[#002B5B] flex items-center justify-center p-4"> {/* NEU Blue Background */}
      <div className="bg-white rounded-3xl shadow-2xl p-10 text-center max-w-sm w-full border-b-8 border-[#FFD700]"> {/* Gold Accent Border */}
        <div className="mb-6">
           <div className="w-20 h-20 bg-[#FFD700] rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
              <span className="text-[#002B5B] text-4xl font-bold">L</span>
           </div>
           <h1 className="text-4xl font-black text-[#002B5B] tracking-tight">NEU Library</h1>
           <p className="text-gray-400 font-medium uppercase tracking-widest text-xs mt-2">Visitor Management System</p>
        </div>

        <button 
          onClick={handleLogin} 
          className="w-full bg-[#002B5B] hover:bg-[#003d82] text-[#FFD700] font-black py-4 px-6 rounded-2xl transition-all shadow-[0_4px_0_rgb(0,0,0,0.2)] active:translate-y-1 active:shadow-none"
        >
          SIGN IN WITH INSTITUTIONAL ID {/* [cite: 78] */}
        </button>
        
        <p className="mt-8 text-[10px] text-gray-400 font-semibold italic">
          New Era University - Library Facility
        </p>
      </div>
    </div>
  );
}