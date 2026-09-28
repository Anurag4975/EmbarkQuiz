import { motion } from "framer-motion";
import { Clock } from "lucide-react";

const TimerProgress = ({ timeLeft, timer }) => {
  if (timeLeft === null) return null;
  return (
    <motion.div
      className="flex items-center justify-center gap-2 text-gray-800 mt-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <Clock className="w-6 h-6 animate-pulse" />
      <span className="text-2xl font-bold">{timeLeft}s</span>
      <div className="w-full bg-gray-200 rounded-full h-2 ml-4">
        <motion.div
          className="h-2 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500"
          initial={{ width: "100%" }}
          animate={{ width: `${Math.max(5, (timeLeft / timer) * 100)}%` }}
          transition={{ duration: 0.5 }}
        />
      </div>
    </motion.div>
  );
};

export default TimerProgress;
