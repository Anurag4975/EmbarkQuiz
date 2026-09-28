import { motion, AnimatePresence } from "framer-motion";
import { Users, CheckCircle } from "lucide-react";

const AnalyticsPanel = ({ currentQuestion, analytics }) => (
  <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 shadow-xl border border-white/20">
    <h2 className="text-2xl font-semibold text-gray-800 mb-6 flex items-center gap-3">
      <div className="w-2 h-8 bg-gradient-to-b from-indigo-500 to-purple-500 rounded-full"></div>
      Live Analytics
    </h2>
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-indigo-50 p-4 rounded-xl text-center"
        >
          <Users className="w-8 h-8 text-indigo-600 mx-auto" />
          <p className="text-xl font-semibold text-gray-800">
            {analytics.responseCount}
          </p>
          <p className="text-sm text-gray-600">Responses</p>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-green-50 p-4 rounded-xl text-center"
        >
          <CheckCircle className="w-8 h-8 text-green-600 mx-auto" />
          <p className="text-xl font-semibold text-gray-800">
            {analytics.correctCount}
          </p>
          <p className="text-sm text-gray-600">Correct</p>
        </motion.div>
      </div>
      <div>
        <h3 className="text-lg font-medium text-gray-800 mb-4">
          Answer Distribution
        </h3>
        <div className="space-y-4">
          {currentQuestion.options.map((option, index) => {
            const percentage =
              analytics.responseCount > 0
                ? (analytics.optionCounts[index] / analytics.responseCount) *
                  100
                : 0;
            const isCorrect = currentQuestion.correctAnswers.includes(index);
            return (
              <motion.div
                key={index}
                initial={{ height: 0 }}
                animate={{ height: "auto" }}
                transition={{ duration: 0.5 }}
                className="space-y-1"
              >
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${
                        isCorrect
                          ? "bg-green-100 text-green-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {String.fromCharCode(65 + index)}
                    </div>
                    <span
                      className={`font-medium ${
                        isCorrect ? "text-green-700" : "text-gray-700"
                      }`}
                    >
                      {option}
                    </span>
                  </div>
                  <span className="text-sm font-medium text-gray-500">
                    {analytics.optionCounts[index]} ({Math.round(percentage)}%)
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-8 overflow-hidden">
                  <motion.div
                    className={`h-8 ${
                      isCorrect ? "bg-green-500" : "bg-indigo-500"
                    }`}
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.max(5, percentage)}%` }}
                    transition={{ duration: 0.5 }}
                  />
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
      <div>
        <h3 className="text-lg font-medium text-gray-800 mb-4">
          Participant Responses
        </h3>
        <AnimatePresence>
          {analytics.participantChoices.length > 0 ? (
            <div className="space-y-3">
              {analytics.participantChoices.map((choice, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className={`p-3 rounded-lg ${
                    choice.isCorrect ? "bg-green-50" : "bg-red-50"
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <span
                      className={`font-medium ${
                        choice.isCorrect ? "text-green-800" : "text-red-800"
                      }`}
                    >
                      {choice.name}
                    </span>
                    <span className="text-xs px-2 py-1 rounded-full bg-white">
                      {choice.isCorrect ? "Correct" : "Incorrect"}
                    </span>
                  </div>
                  <p className="text-sm mt-1">
                    Chose: {choice.selectedOptions.join(", ")}
                  </p>
                </motion.div>
              ))}
            </div>
          ) : (
            <p className="text-gray-600">No responses yet.</p>
          )}
        </AnimatePresence>
      </div>
    </div>
  </div>
);

export default AnalyticsPanel;
