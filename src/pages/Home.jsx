import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  BookOpen,
  Users,
  Trophy,
  Zap,
  ArrowRight,
  Star,
  CheckCircle,
} from "lucide-react";

const Home = () => {
  const { user } = useAuth();

  const features = [
    {
      icon: <BookOpen className="w-8 h-8" />,
      title: "Create Quizzes",
      description:
        "Build engaging quizzes with our intuitive drag-and-drop interface",
    },
    {
      icon: <Users className="w-8 h-8" />,
      title: "Share & Collaborate",
      description:
        "Share your quizzes with friends, students, or colleagues instantly",
    },
    {
      icon: <Trophy className="w-8 h-8" />,
      title: "Track Progress",
      description: "Monitor performance with detailed analytics and insights",
    },
    {
      icon: <Zap className="w-8 h-8" />,
      title: "Real-time Results",
      description:
        "Get instant feedback and results as soon as you complete a quiz",
    },
  ];

  const stats = [
    { number: "10K+", label: "Quizzes Created" },
    { number: "50K+", label: "Users Worldwide" },
    { number: "1M+", label: "Questions Answered" },
    { number: "98%", label: "User Satisfaction" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0">
          <div className="absolute top-20 left-10 w-72 h-72 bg-indigo-200/30 rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-purple-200/30 rounded-full blur-3xl"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-to-r from-indigo-100/20 to-purple-100/20 rounded-full blur-3xl"></div>
        </div>

        <div className="relative container mx-auto px-6 py-20">
          <div className="text-center max-w-4xl mx-auto">
            {/* Logo/Icon */}
            <div className="flex justify-center mb-8">
              <div className="w-20 h-20 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-3xl flex items-center justify-center shadow-2xl transform hover:scale-105 transition-transform">
                <BookOpen className="w-10 h-10 text-white" />
              </div>
            </div>

            {/* Main Heading */}
            <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
              <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-800 bg-clip-text text-transparent">
                Welcome to
              </span>
              <br />
              <span className="bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
                QuiGuru
              </span>
            </h1>

            {/* Subtitle */}
            <p className="text-xl md:text-2xl text-gray-600 mb-12 leading-relaxed max-w-3xl mx-auto">
              Create and share quizzes with ease, or test your knowledge by
              taking quizzes created by others. The future of learning is here!
              ✨
            </p>

            {/* CTA Button */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
              {user ? (
                <Link
                  to="/dashboard"
                  className="group inline-flex items-center gap-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-8 py-4 rounded-2xl hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 transform hover:scale-105 shadow-xl text-lg font-semibold"
                >
                  Go to Dashboard
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="group inline-flex items-center gap-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-8 py-4 rounded-2xl hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 transform hover:scale-105 shadow-xl text-lg font-semibold"
                  >
                    Sign In to Start
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </Link>
                  <Link
                    to="/signup"
                    className="inline-flex items-center gap-3 bg-white/80 backdrop-blur-sm text-indigo-600 px-8 py-4 rounded-2xl hover:bg-white transition-all duration-300 border-2 border-indigo-200 hover:border-indigo-300 text-lg font-semibold"
                  >
                    Create Account
                  </Link>
                </>
              )}
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
              {stats.map((stat, index) => (
                <div key={index} className="text-center">
                  <div className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2">
                    {stat.number}
                  </div>
                  <div className="text-gray-600 text-sm md:text-base">
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-20 bg-white/50 backdrop-blur-sm">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                Why Choose QuiGuru?
              </span>
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Powerful features designed to make quiz creation and taking a
              delightful experience
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto">
            {features.map((feature, index) => (
              <div key={index} className="group">
                <div className="bg-white/80 backdrop-blur-sm p-8 rounded-3xl shadow-xl border border-white/20 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 text-center h-full">
                  <div className="w-16 h-16 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-2xl flex items-center justify-center mx-auto mb-6 text-white group-hover:scale-110 transition-transform">
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-semibold text-gray-800 mb-4">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* How It Works Section */}
      <div className="py-20">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                How It Works
              </span>
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Get started in three simple steps
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {[
              {
                step: "01",
                title: "Sign Up",
                description: "Create your free account in seconds",
              },
              {
                step: "02",
                title: "Create Quiz",
                description: "Build your quiz with our intuitive tools",
              },
              {
                step: "03",
                title: "Share & Play",
                description: "Share with others or start taking quizzes",
              },
            ].map((item, index) => (
              <div key={index} className="text-center relative">
                <div className="w-20 h-20 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-6 text-white text-2xl font-bold shadow-xl">
                  {item.step}
                </div>
                <h3 className="text-2xl font-semibold text-gray-800 mb-4">
                  {item.title}
                </h3>
                <p className="text-gray-600 text-lg">{item.description}</p>
                {index < 2 && (
                  <div className="hidden md:block absolute top-10 -right-4 w-8 h-0.5 bg-gradient-to-r from-indigo-300 to-purple-300"></div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Testimonials/Social Proof */}
      <div className="py-20 bg-gradient-to-r from-indigo-50 to-purple-50">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                Loved by Educators
              </span>
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {[
              {
                quote:
                  "QuiGuru transformed how I engage with my students. The interface is intuitive and the results are fantastic!",
                author: "Sarah Johnson",
                role: "High School Teacher",
              },
              {
                quote:
                  "Perfect for corporate training. We've seen a 40% increase in knowledge retention since using QuiGuru.",
                author: "Mike Chen",
                role: "Training Manager",
              },
              {
                quote:
                  "The analytics and feedback features help me understand my students' progress like never before.",
                author: "Dr. Amanda Smith",
                role: "University Professor",
              },
            ].map((testimonial, index) => (
              <div
                key={index}
                className="bg-white/80 backdrop-blur-sm p-8 rounded-3xl shadow-xl border border-white/20"
              >
                <div className="flex mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className="w-5 h-5 text-yellow-400 fill-current"
                    />
                  ))}
                </div>
                <p className="text-gray-700 mb-6 italic">
                  "{testimonial.quote}"
                </p>
                <div>
                  <div className="font-semibold text-gray-800">
                    {testimonial.author}
                  </div>
                  <div className="text-gray-600 text-sm">
                    {testimonial.role}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Final CTA */}
      <div className="py-20 bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Ready to Get Started?
          </h2>
          <p className="text-xl mb-8 text-indigo-100 max-w-2xl mx-auto">
            Join thousands of educators and learners who are already using
            QuiGuru App to create amazing learning experiences.
          </p>
          {!user && (
            <Link
              to="/register"
              className="inline-flex items-center gap-3 bg-white text-indigo-600 px-8 py-4 rounded-2xl hover:bg-gray-50 transition-all duration-300 transform hover:scale-105 shadow-xl text-lg font-semibold"
            >
              <CheckCircle className="w-6 h-6" />
              Start Free Today
            </Link>
          )}
        </div>
      </div>
    </div>
  );
};

export default Home;
