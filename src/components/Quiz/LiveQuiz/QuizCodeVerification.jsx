import { motion } from "framer-motion";

const QuizCodeVerification = ({ quizCode, setQuizCode, onSubmit }) => (
  <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-4 md:p-6 flex items-center justify-center">
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 shadow-xl border border-white/20 max-w-md w-full"
    >
      <h2 className="text-2xl font-semibold text-gray-800 mb-6 text-center">
        Enter Quiz Code
      </h2>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit();
        }}
        className="space-y-4"
      >
        <input
          type="text"
          value={quizCode}
          onChange={(e) => setQuizCode(e.target.value)}
          placeholder="Enter 6-digit quiz code"
          maxLength="6"
          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:ring-0 transition-colors text-lg"
          autoFocus
        />
        <button
          type="submit"
          className="w-full px-8 py-4 bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-lg font-semibold rounded-2xl hover:from-indigo-600 hover:to-purple-600 transition-all transform hover:scale-105 shadow-xl"
        >
          Verify Code
        </button>
      </form>
    </motion.div>
  </div>
);

export default QuizCodeVerification;
