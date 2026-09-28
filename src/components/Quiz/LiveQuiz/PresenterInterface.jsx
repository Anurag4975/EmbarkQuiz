import { motion } from "framer-motion";
import { Play, Pause, QrCode, BarChart2, RefreshCw } from "lucide-react";
import { ToastContainer } from "react-toastify";
import QuestionDisplay from "./QuestionDisplay";
import AnalyticsPanel from "./AnalyticalPanel";
import QRCodeDisplay from "./QRCodeDisplay";
import TimerProgress from "./TimeProgress";

const PresenterInterface = ({
  quiz,
  currentQuestionIndex,
  currentQuestion,
  isResponseActive,
  timeLeft,
  showQrCode,
  showAnalytics,
  analytics,
  responses,
  handleNextQuestion,
  handlePreviousQuestion,
  toggleResponseActive,
  startQuiz,
  resetQuiz,
  setQuizTimer,
  toggleAnalytics,
  setShowQrCode,
  quizCode,
  windowSize,
}) => (
  <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-4 md:p-6">
    <div className="max-w-6xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2">
          {quiz.title}
        </h1>
        <p className="text-gray-600">{quiz.description}</p>
        <div className="mt-4 flex gap-4 justify-center flex-wrap">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={startQuiz}
            disabled={quiz.isQuizStarted}
            className="inline-flex items-center gap-2 px-6 py-3 bg-green-500 text-white rounded-xl disabled:opacity-50"
          >
            <Play className="w-5 h-5" />
            {quiz.isQuizStarted ? "Quiz Started" : "Start Quiz"}
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowQrCode(!showQrCode)}
            className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-500 text-white rounded-xl"
          >
            <QrCode className="w-5 h-5" />
            {showQrCode ? "Hide QR Code" : "Show QR Code"}
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={toggleResponseActive}
            className={`inline-flex items-center gap-2 px-6 py-3 ${
              isResponseActive
                ? "bg-red-500 hover:bg-red-600"
                : "bg-green-500 hover:bg-green-600"
            } text-white rounded-xl`}
          >
            {isResponseActive ? (
              <Pause className="w-5 h-5" />
            ) : (
              <Play className="w-5 h-5" />
            )}
            {isResponseActive ? "Stop Responses" : "Start Responses"}
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={toggleAnalytics}
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-500 text-white rounded-xl"
          >
            <BarChart2 className="w-5 h-5" />
            {showAnalytics ? "Hide Analytics" : "Show Analytics"}
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={resetQuiz}
            className="inline-flex items-center gap-2 px-6 py-3 bg-orange-500 text-white rounded-xl"
          >
            <RefreshCw className="w-5 h-5" />
            Reset Quiz
          </motion.button>
          <select
            onChange={(e) => setQuizTimer(Number(e.target.value))}
            value={quiz.timer || ""}
            className="px-6 py-3 bg-indigo-500 text-white rounded-xl hover:bg-indigo-600 cursor-pointer"
          >
            <option value="">Set Timer</option>
            <option value="10">10 seconds</option>
            <option value="20">20 seconds</option>
            <option value="30">30 seconds</option>
            <option value="60">60 seconds</option>
          </select>
        </div>
        <TimerProgress timeLeft={timeLeft} timer={quiz.timer} />
        {showQrCode && <QRCodeDisplay quizId={quiz.id} quizCode={quizCode} />}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <QuestionDisplay
          currentQuestionIndex={currentQuestionIndex}
          currentQuestion={currentQuestion}
          isResponseActive={isResponseActive}
          handleNextQuestion={handleNextQuestion}
          handlePreviousQuestion={handlePreviousQuestion}
          totalQuestions={quiz.questions.length}
        />
        {showAnalytics && (
          <AnalyticsPanel
            currentQuestion={currentQuestion}
            analytics={analytics}
          />
        )}
      </div>
    </div>
    <ToastContainer position="top-right" autoClose={3000} />
  </div>
);

export default PresenterInterface;
