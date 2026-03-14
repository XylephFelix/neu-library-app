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
    <div className="min-h-screen bg-blue-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-10 text-center max-w-sm w-full border-t-4 border-blue-700">
        <h1 className="text-3xl font-bold text-blue-900 mb-2">NEU Library</h1>
        <p className="text-gray-500 mb-8">Visitor Management System</p>
        <button onClick={handleLogin} className="w-full bg-blue-700 hover:bg-blue-800 text-white font-bold py-3 px-6 rounded-xl transition-all shadow-lg">
          Sign in with NEU Email
        </button>
      </div>
    </div>
  );
}