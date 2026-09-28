import { motion } from "framer-motion";

const LoadingScreen = () => (
  <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-purple-50">
    <motion.div
      animate={{ rotate: 360 }}
      transition={{ repeat: Infinity, duration: 1 }}
      className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full"
    />
  </div>
);

export default LoadingScreen;
