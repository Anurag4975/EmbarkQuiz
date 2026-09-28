import { motion } from "framer-motion";

const WaitingScreen = ({ quiz, participantName }) => (
  <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-4 md:p-6 flex items-center justify-center">
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 shadow-xl border border-white/20 max-w-md w-full text-center"
    >
      <h2 className="text-2xl font-semibold text-gray-800 mb-4">
        Welcome to {quiz.title}
      </h2>
      <p className="text-gray-600 mb-6">
        The quiz will start soon. Please wait for the presenter to begin.
      </p>
      <div className="bg-indigo-50 p-4 rounded-xl">
        <p className="text-indigo-800 font-medium">Your name:</p>
        <p className="text-xl font-semibold text-indigo-900">
          {participantName}
        </p>
      </div>
      {quiz.quizCode && (
        <p className="mt-4 text-gray-600 text-sm">
          Quiz Code: <span className="font-bold">{quiz.quizCode}</span>
        </p>
      )}
    </motion.div>
  </div>
);

export default WaitingScreen;
