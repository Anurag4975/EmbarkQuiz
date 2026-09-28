import { motion } from "framer-motion";
import { ArrowLeft, ArrowRight, CheckCircle } from "lucide-react";

const QuestionDisplay = ({
  currentQuestionIndex,
  currentQuestion,
  isResponseActive,
  handleNextQuestion,
  handlePreviousQuestion,
  totalQuestions,
}) => (
  <div className="lg:col-span-2 bg-white/80 backdrop-blur-sm rounded-3xl p-8 shadow-xl border border-white/20">
    <div className="flex justify-between items-center mb-6">
      <h2 className="text-2xl font-semibold text-gray-800 flex items-center gap-3">
        <div className="w-8 h-8 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
          {currentQuestionIndex + 1}
        </div>
        Question {currentQuestionIndex + 1}
      </h2>
    </div>
    <h3 className="text-xl font-medium text-gray-800 mb-4">
      {currentQuestion.question}
    </h3>
    <div className="space-y-3 mb-6">
      {currentQuestion.options.map((option, optionIndex) => {
        const isCorrectOption =
          currentQuestion.correctAnswers.includes(optionIndex);
        return (
          <motion.div
            key={optionIndex}
            className={`relative rounded-xl overflow-hidden transition-all ${
              isCorrectOption && !isResponseActive
                ? "ring-2 ring-green-500 bg-green-50"
                : "ring-gray-300"
            }`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: optionIndex * 0.1 }}
          >
            <label className="flex items-center gap-3 p-4 relative z-10">
              <span className="flex-1">{option}</span>
              {isCorrectOption && !isResponseActive && (
                <CheckCircle className="w-5 h-5 text-green-500" />
              )}
            </label>
          </motion.div>
        );
      })}
    </div>
    {!isResponseActive && (
      <div className="mt-4 p-4 bg-blue-50 rounded-xl">
        <h3 className="text-lg font-medium text-blue-800 mb-2">
          {currentQuestion.isMultipleChoice
            ? "Correct Answers:"
            : "Correct Answer:"}
        </h3>
        <p className="text-blue-600">
          {currentQuestion.correctAnswers
            .map((index) => currentQuestion.options[index])
            .join(", ")}
        </p>
      </div>
    )}
    <div className="flex justify-between mt-6">
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={handlePreviousQuestion}
        disabled={currentQuestionIndex === 0}
        className="inline-flex items-center gap-2 px-6 py-3 bg-gray-200 text-gray-800 rounded-xl disabled:opacity-50"
      >
        <ArrowLeft className="w-5 h-5" />
        Previous
      </motion.button>
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={handleNextQuestion}
        disabled={currentQuestionIndex === totalQuestions - 1}
        className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-500 text-white rounded-xl disabled:opacity-50"
      >
        Next
        <ArrowRight className="w-5 h-5" />
      </motion.button>
    </div>
  </div>
);

export default QuestionDisplay;
