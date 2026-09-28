import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { auth } from "../../firebase/firebase";
import { signOut } from "firebase/auth";
import {
  BookOpen,
  Home,
  Plus,
  LayoutDashboard,
  LogOut,
  User,
  Menu,
  X,
  UserPlus,
} from "lucide-react";
import { useState } from "react";

const Navbar = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      navigate("/login");
    } catch (error) {
      console.error("Sign out error:", error);
    }
  };

  return (
    <nav className="bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 shadow-xl sticky top-0 z-50 backdrop-blur-md">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link
            to="/"
            className="flex items-center space-x-2 text-white font-bold text-xl hover:scale-105 transition-transform"
          >
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
              <BookOpen className="w-6 h-6" />
            </div>
            <span className="bg-gradient-to-r from-white to-indigo-100 bg-clip-text text-transparent">
              QuiGuru
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1">
            <Link
              to="/"
              className="flex items-center space-x-2 px-4 py-2 rounded-xl text-white/90 hover:text-white hover:bg-white/10 transition-all duration-200"
            >
              <Home className="w-4 h-4" />
              <span>Home</span>
            </Link>

            <Link
              to="/quizzes"
              className="flex items-center space-x-2 px-4 py-2 rounded-xl text-white/90 hover:text-white hover:bg-white/10 transition-all duration-200"
            >
              <BookOpen className="w-4 h-4" />
              <span>Quizzes</span>
            </Link>

            {user ? (
              <>
                <Link
                  to="/dashboard"
                  className="flex items-center space-x-2 px-4 py-2 rounded-xl text-white/90 hover:text-white hover:bg-white/10 transition-all duration-200"
                >
                  <LayoutDashboard className="w-4 h-4" />
                  <span>Dashboard</span>
                </Link>

                <Link
                  to="/create-quiz"
                  className="flex items-center space-x-2 px-4 py-2 rounded-xl text-white/90 hover:text-white hover:bg-white/10 transition-all duration-200"
                >
                  <Plus className="w-4 h-4" />
                  <span>Create Quiz</span>
                </Link>

                <div className="flex items-center space-x-3 ml-4 pl-4 border-l border-white/20">
                  <div className="flex items-center space-x-2 px-3 py-1 bg-white/10 rounded-full">
                    <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                      <User className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-white/90 text-sm">
                      {user.email?.split("@")[0]}
                    </span>
                  </div>

                  <button
                    onClick={handleSignOut}
                    className="flex items-center space-x-2 px-4 py-2 bg-red-500/80 hover:bg-red-500 text-white rounded-xl transition-all duration-200 transform hover:scale-105"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="flex items-center space-x-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-all duration-200 transform hover:scale-105"
                >
                  <User className="w-4 h-4" />
                  <span>Login</span>
                </Link>
                <Link
                  to="/signup"
                  className="flex items-center space-x-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-all duration-200 transform hover:scale-105"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Sign Up</span>
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center text-white hover:bg-white/20 transition-colors"
          >
            {isMobileMenuOpen ? (
              <X className="w-5 h-5" />
            ) : (
              <Menu className="w-5 h-5" />
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-white/10 py-4">
            <div className="space-y-2">
              <Link
                to="/"
                className="flex items-center space-x-3 px-4 py-3 text-white/90 hover:text-white hover:bg-white/10 rounded-xl transition-all"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <Home className="w-5 h-5" />
                <span>Home</span>
              </Link>

              <Link
                to="/quizzes"
                className="flex items-center space-x-3 px-4 py-3 text-white/90 hover:text-white hover:bg-white/10 rounded-xl transition-all"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <BookOpen className="w-5 h-5" />
                <span>Public Quizzes</span>
              </Link>

              {user ? (
                <>
                  <Link
                    to="/dashboard"
                    className="flex items-center space-x-3 px-4 py-3 text-white/90 hover:text-white hover:bg-white/10 rounded-xl transition-all"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <LayoutDashboard className="w-5 h-5" />
                    <span>Dashboard</span>
                  </Link>

                  <Link
                    to="/create-quiz"
                    className="flex items-center space-x-3 px-4 py-3 text-white/90 hover:text-white hover:bg-white/10 rounded-xl transition-all"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <Plus className="w-5 h-5" />
                    <span>Create Quiz</span>
                  </Link>

                  <div className="px-4 py-2 border-t border-white/10 mt-2 pt-4">
                    <div className="flex items-center space-x-2 mb-3">
                      <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                        <User className="w-4 h-4 text-white" />
                      </div>
                      <span className="text-white/90 text-sm">
                        {user.email?.split("@")[0]}
                      </span>
                    </div>

                    <button
                      onClick={() => {
                        handleSignOut();
                        setIsMobileMenuOpen(false);
                      }}
                      className="flex items-center space-x-3 w-full px-4 py-3 bg-red-500/80 hover:bg-red-500 text-white rounded-xl transition-all"
                    >
                      <LogOut className="w-5 h-5" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="flex items-center space-x-3 px-4 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-all"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <User className="w-5 h-5" />
                    <span>Login</span>
                  </Link>
                  <Link
                    to="/signup"
                    className="flex items-center space-x-3 px-4 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-all"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <UserPlus className="w-5 h-5" />
                    <span>Sign Up</span>
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
