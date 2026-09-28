import { BookOpen } from "lucide-react";
const Footer = () => {
  return (
    <footer className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 text-white mt-auto relative overflow-hidden">
      {/* Decorative Elements */}
      <div className="absolute inset-0">
        <div className="absolute top-0 left-1/4 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl"></div>
      </div>

      <div className="relative">
        {/* Main Footer Content */}
        <div className="container mx-auto px-4 py-12">
          <div className="grid md:grid-cols-3 gap-8">
            {/* Brand Section */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <div className="w-10 h-10 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center">
                  <BookOpen className="w-6 h-6 text-white" />
                </div>
                <span className="text-xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                  Quizme
                </span>
              </div>
              <p className="text-gray-400 text-sm leading-relaxed">
                Create engaging quizzes and test knowledge with our modern,
                intuitive platform. Perfect for educators, trainers, and quiz
                enthusiasts.
              </p>
            </div>

            {/* Quick Links */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white">Quick Links</h3>
              <div className="space-y-2">
                <a
                  href="/"
                  className="block text-gray-400 hover:text-white transition-colors duration-200 text-sm"
                >
                  Home
                </a>
                <a
                  href="/about"
                  className="block text-gray-400 hover:text-white transition-colors duration-200 text-sm"
                >
                  About Us
                </a>
                <a
                  href="/contact"
                  className="block text-gray-400 hover:text-white transition-colors duration-200 text-sm"
                >
                  Contact
                </a>
                <a
                  href="/privacy"
                  className="block text-gray-400 hover:text-white transition-colors duration-200 text-sm"
                >
                  Privacy Policy
                </a>
              </div>
            </div>

            {/* Contact Info */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white">Get in Touch</h3>
              <div className="space-y-2 text-sm text-gray-400">
                <p>Have questions or feedback?</p>
                <p>We'd love to hear from you!</p>
                <div className="pt-2">
                  <a
                    href="mailto:raaz4975@gmail.com"
                    className="inline-flex items-center space-x-2 px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg transition-all duration-200"
                  >
                    <span>raaz4975@gmail.com</span>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-700/50 backdrop-blur-sm">
          <div className="container mx-auto px-4 py-6">
            <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
              <p className="text-gray-400 text-sm">
                &copy; {new Date().getFullYear()} Quizme. All rights reserved.
              </p>

              <div className="flex items-center space-x-6 text-sm">
                <a
                  href="/about"
                  className="text-gray-400 hover:text-white transition-colors duration-200"
                >
                  About
                </a>
                <span className="text-gray-600">|</span>
                <a
                  href="/contact"
                  className="text-gray-400 hover:text-white transition-colors duration-200"
                >
                  Contact
                </a>
                <span className="text-gray-600">|</span>
                <a
                  href="/terms"
                  className="text-gray-400 hover:text-white transition-colors duration-200"
                >
                  Terms
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
