import { useNavigate } from "react-router-dom";
import { signInWithGoogle } from "../../firebase/firebase";
import { useAuth } from "../../context/AuthContext";
import { LogIn } from "lucide-react";

const Login = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleGoogleSignIn = async () => {
    try {
      await signInWithGoogle();
      navigate("/dashboard");
    } catch (error) {
      console.error("Login failed:", error);
      alert("Failed to sign in. Please try again.");
    }
  };

  if (user) {
    navigate("/dashboard");
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white/80 backdrop-blur-sm rounded-3xl p-8 shadow-xl border border-white/20">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl mb-4">
            <LogIn className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2">
            Sign In to Quizgro
          </h1>
          <p className="text-gray-600">
            Access your quizzes or create new ones with Google
          </p>
        </div>
        <div className="flex justify-center">
          <button
            onClick={handleGoogleSignIn}
            className="inline-flex items-center gap-3 px-6 py-3 bg-white text-gray-800 text-lg font-semibold rounded-xl hover:bg-gray-100 transition-all transform hover:scale-105 shadow-md border"
          >
            <img
              src="https://www.google.com/images/branding/googleg/1x/googleg_standard_color_128dp.png"
              alt="Google logo"
              className="w-6 h-6"
            />
            Sign in with Google
          </button>
        </div>
      </div>
    </div>
  );
};

export default Login;
