import { motion } from "framer-motion";
import {
  CheckCircle,
  XCircle,
  Trophy,
  Star,
  Zap,
  Sparkles,
  ChevronRight,
} from "lucide-react";
import { ToastContainer, toast } from "react-toastify";
import Confetti from "react-confetti";
import TimerProgress from "./TimeProgress";
import { useMemo, useCallback, useState, useEffect } from "react";

const ParticipantInterface = ({
  quiz,
  currentQuestionIndex,
  currentQuestion,
  participantName,
  isResponseActive,
  hasSubmittedCurrentQuestion,
  timeLeft,
  handleAnswerSubmit,
  windowSize,
  showConfetti,
  totalQuestions,
}) => {
  const [localSelections, setLocalSelections] = useState([]);
  const [showCelebration, setShowCelebration] = useState(false);
  const [score, setScore] = useState(0);
  const [selectedCount, setSelectedCount] = useState(0);

  // Calculate score when answers are submitted
  useEffect(() => {
    if (!isResponseActive && hasSubmittedCurrentQuestion) {
      const isCorrect = checkAnswerCorrectness();
      if (isCorrect) {
        setScore((prev) => prev + (currentQuestion.points || 1));
        setShowCelebration(true);
        const timer = setTimeout(() => setShowCelebration(false), 3000);
        return () => clearTimeout(timer);
      }
    }
  }, [currentQuestionIndex, isResponseActive, hasSubmittedCurrentQuestion]);

  // Update selected count
  useEffect(() => {
    setSelectedCount(localSelections.length);
  }, [localSelections]);

  // Memoize participant response
  const participantResponse = useMemo(() => {
    return (
      (quiz.responses || []).find(
        (r) => r.participantName === participantName
      ) || {}
    );
  }, [quiz.responses, participantName]);

  // Memoize participant answer
  const participantAnswer = useMemo(() => {
    return participantResponse.answers?.[currentQuestionIndex] || [];
  }, [participantResponse, currentQuestionIndex]);

  // Check if answer is correct
  const checkAnswerCorrectness = useCallback(() => {
    if (!hasSubmittedCurrentQuestion || isResponseActive) return false;
    const correctAnswers = currentQuestion.correctAnswers || [];
    return (
      participantAnswer.length === correctAnswers.length &&
      participantAnswer.every((ans) => correctAnswers.includes(ans)) &&
      correctAnswers.every((ans) => participantAnswer.includes(ans))
    );
  }, [
    participantAnswer,
    currentQuestion.correctAnswers,
    hasSubmittedCurrentQuestion,
    isResponseActive,
  ]);

  const isAnswerCorrect = useMemo(checkAnswerCorrectness, [
    checkAnswerCorrectness,
  ]);

  // Handle option selection
  const handleOptionSelect = useCallback(
    (optionIndex) => {
      if (!hasSubmittedCurrentQuestion && isResponseActive) {
        let newSelectedAnswers;
        if (currentQuestion.isMultipleChoice) {
          newSelectedAnswers = localSelections.includes(optionIndex)
            ? localSelections.filter((ans) => ans !== optionIndex)
            : [...localSelections, optionIndex];
        } else {
          // For single choice, replace the selection
          newSelectedAnswers = [optionIndex];
        }
        setLocalSelections(newSelectedAnswers);

        // For single choice questions, submit immediately
        if (!currentQuestion.isMultipleChoice) {
          handleAnswerSubmit(currentQuestionIndex, newSelectedAnswers);
        }
      }
    },
    [
      currentQuestion.isMultipleChoice,
      localSelections,
      hasSubmittedCurrentQuestion,
      isResponseActive,
      handleAnswerSubmit,
      currentQuestionIndex,
    ]
  );

  // Submit multiple choice answers
  const submitMultipleChoice = useCallback(() => {
    if (localSelections.length > 0) {
      handleAnswerSubmit(currentQuestionIndex, localSelections);
    } else {
      toast.warn("Please select at least one option!", {
        position: "top-center",
        autoClose: 2000,
        hideProgressBar: true,
      });
    }
  }, [localSelections, currentQuestionIndex, handleAnswerSubmit]);

  // Get option status
  const getOptionStatus = useCallback(
    (optionIndex) => {
      const isSelected = isResponseActive
        ? localSelections.includes(optionIndex)
        : participantAnswer.includes(optionIndex);
      const isCorrect = (currentQuestion.correctAnswers || []).includes(
        optionIndex
      );

      if (!isResponseActive && hasSubmittedCurrentQuestion) {
        return isSelected
          ? isCorrect
            ? "correct"
            : "incorrect"
          : isCorrect
          ? "correct-unselected"
          : "default";
      }
      return isSelected ? "selected" : "default";
    },
    [
      localSelections,
      participantAnswer,
      currentQuestion.correctAnswers,
      isResponseActive,
      hasSubmittedCurrentQuestion,
    ]
  );

  // Reset local selections when moving to a new question
  useEffect(() => {
    setLocalSelections(participantAnswer);
  }, [currentQuestionIndex, participantAnswer]);

  // Animation variants
  const optionVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: (i) => ({
      opacity: 1,
      x: 0,
      transition: { delay: i * 0.1, duration: 0.3 },
    }),
    hover: { scale: 1.02 },
    tap: { scale: 0.98 },
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-purple-100 to-pink-100 p-4 md:p-8 flex items-center justify-center">
      {isAnswerCorrect && showConfetti && (
        <Confetti
          width={windowSize.width}
          height={windowSize.height}
          numberOfPieces={600}
          recycle={false}
          colors={["#ff6b6b", "#4ecdc4", "#45b7d1", "#96c93d"]}
        />
      )}

      {showCelebration && (
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 1.2 }}
          className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none"
        >
          <Sparkles className="absolute text-yellow-400 w-full h-full" />
          <motion.div
            animate={{
              scale: [1, 1.2, 1],
              rotate: [0, 10, -10, 0],
            }}
            transition={{
              duration: 0.8,
              repeat: Infinity,
              repeatType: "reverse",
            }}
            className="text-6xl"
          >
            🎉
          </motion.div>
        </motion.div>
      )}

      <div className="max-w-4xl w-full mx-auto">
        {/* Quiz Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-extrabold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-3 drop-shadow-md">
            {quiz.title}
          </h1>
          <p className="text-gray-700 text-base md:text-lg font-medium">
            {quiz.description}
          </p>

          <div className="flex justify-center items-center gap-4 mt-4">
            <div className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white px-6 py-2 rounded-full text-sm md:text-base font-semibold shadow-md flex items-center gap-2">
              <Zap className="w-4 h-4" />
              <span>{participantName}</span>
            </div>

            <div className="bg-gradient-to-r from-amber-500 to-pink-500 text-white px-6 py-2 rounded-full text-sm md:text-base font-semibold shadow-md flex items-center gap-2">
              <Trophy className="w-4 h-4" />
              <span>
                Score: {score}/{currentQuestionIndex + 1}
              </span>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mt-4">
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div
                className="bg-gradient-to-r from-indigo-500 to-purple-500 h-2.5 rounded-full transition-all duration-500"
                style={{
                  width: `${
                    ((currentQuestionIndex + 1) / totalQuestions) * 100
                  }%`,
                }}
              ></div>
            </div>
            <p className="text-sm text-gray-600 mt-2">
              Question {currentQuestionIndex + 1} of {totalQuestions}
            </p>
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="bg-white/95 backdrop-blur-md rounded-3xl p-8 shadow-xl border border-gray-100 relative"
        >
          {/* Question Badge */}
          <div className="absolute -top-3 -right-3 bg-gradient-to-r from-pink-500 to-purple-600 text-white text-sm font-bold px-3 py-1 rounded-full shadow-lg flex items-center">
            <Star className="w-3 h-3 mr-1" />
            {currentQuestion.points || 1}{" "}
            {currentQuestion.points === 1 ? "point" : "points"}
          </div>

          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-800 flex items-center gap-3">
              <span className="w-10 h-10 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-full flex items-center justify-center text-white text-base font-bold shadow-md">
                {currentQuestionIndex + 1}
              </span>
              Question {currentQuestionIndex + 1}
            </h2>
          </div>

          <h3 className="text-xl md:text-2xl font-semibold text-gray-800 mb-6">
            {currentQuestion.question}
          </h3>

          <div className="space-y-4 mb-8">
            {currentQuestion.options.map((option, optionIndex) => {
              const status = getOptionStatus(optionIndex);
              const isDisabled =
                hasSubmittedCurrentQuestion || !isResponseActive;
              const isCorrectAnswer = (
                currentQuestion.correctAnswers || []
              ).includes(optionIndex);

              return (
                <motion.div
                  key={optionIndex}
                  custom={optionIndex}
                  initial="hidden"
                  animate="visible"
                  whileHover={!isDisabled ? "hover" : {}}
                  whileTap={!isDisabled ? "tap" : {}}
                  variants={optionVariants}
                  onClick={() => handleOptionSelect(optionIndex)}
                  className={`relative flex items-center gap-4 p-4 rounded-xl transition-all duration-300 border-2 shadow-md ${
                    status === "correct"
                      ? "bg-green-100 border-green-400 animate-pulse"
                      : status === "correct-unselected"
                      ? "bg-green-50 border-green-300"
                      : status === "incorrect"
                      ? "bg-red-100 border-red-400"
                      : status === "selected"
                      ? "bg-teal-100 border-teal-400"
                      : "bg-white border-gray-200 group hover:bg-teal-50 hover:border-teal-300"
                  } ${isDisabled ? "cursor-default" : "cursor-pointer"}`}
                >
                  {/* Option Letter */}
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-base font-bold ${
                      status === "correct"
                        ? "bg-green-500 text-white"
                        : status === "correct-unselected"
                        ? "bg-green-400 text-white"
                        : status === "incorrect"
                        ? "bg-red-500 text-white"
                        : status === "selected"
                        ? "bg-teal-500 text-white"
                        : "bg-gray-100 text-gray-600 group-hover:bg-teal-100 group-hover:text-teal-600"
                    }`}
                  >
                    {String.fromCharCode(65 + optionIndex)}
                  </div>

                  {/* Option Text */}
                  <span
                    className={`flex-1 text-lg md:text-xl font-medium ${
                      status === "correct"
                        ? "text-green-800"
                        : status === "correct-unselected"
                        ? "text-green-700"
                        : status === "incorrect"
                        ? "text-red-800"
                        : status === "selected"
                        ? "text-teal-800"
                        : "text-gray-700 group-hover:text-teal-600"
                    }`}
                  >
                    {option}
                  </span>

                  {/* Feedback Icons */}
                  {status === "selected" && isResponseActive && (
                    <div className="w-5 h-5 bg-teal-500 rounded-full flex items-center justify-center">
                      <div className="w-3 h-3 bg-white rounded-full"></div>
                    </div>
                  )}
                  {status === "correct" && !isResponseActive && (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  )}
                  {status === "incorrect" && !isResponseActive && (
                    <XCircle className="w-5 h-5 text-red-500" />
                  )}
                  {status === "correct-unselected" && !isResponseActive && (
                    <CheckCircle className="w-5 h-5 text-green-300" />
                  )}
                </motion.div>
              );
            })}
          </div>

          {/* Multiple Choice Hint */}
          {currentQuestion.isMultipleChoice && isResponseActive && (
            <div className="mb-6 p-3 bg-blue-50 border border-blue-200 rounded-xl text-center animate-pulse">
              <p className="text-sm md:text-base text-blue-700 font-semibold">
                🎯 Select all correct answers! ({selectedCount} selected)
              </p>
            </div>
          )}

          {/* Submit button for multiple choice */}
          {currentQuestion.isMultipleChoice &&
            isResponseActive &&
            !hasSubmittedCurrentQuestion && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="flex justify-center"
              >
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={submitMultipleChoice}
                  className="bg-gradient-to-r from-purple-500 to-indigo-600 text-white px-6 py-3 rounded-full font-bold shadow-lg flex items-center gap-2"
                >
                  Submit Answers <ChevronRight className="w-5 h-5" />
                </motion.button>
              </motion.div>
            )}

          {/* Correct Answer Display */}
          {!isResponseActive && hasSubmittedCurrentQuestion && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-xl"
            >
              <h3 className="text-lg md:text-xl font-semibold text-blue-800 mb-3 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-blue-600" />
                {currentQuestion.isMultipleChoice
                  ? "Correct Answers:"
                  : "Correct Answer:"}
              </h3>
              <p className="text-blue-600 text-base md:text-lg font-medium">
                {currentQuestion.correctAnswers
                  .map(
                    (index) =>
                      `${String.fromCharCode(65 + index)}. ${
                        currentQuestion.options[index]
                      }`
                  )
                  .join(", ")}
              </p>
            </motion.div>
          )}

          {/* Feedback Message */}
          {!isResponseActive &&
            hasSubmittedCurrentQuestion &&
            isAnswerCorrect && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
                className="mt-6 p-4 bg-gradient-to-r from-green-50 to-teal-100 border border-green-200 rounded-xl text-center"
              >
                <p className="text-lg md:text-xl font-bold text-green-700 flex items-center justify-center gap-2">
                  <Sparkles className="w-5 h-5" />
                  🎉 Awesome! You got it right! +{currentQuestion.points ||
                    1}{" "}
                  points!
                  <Sparkles className="w-5 h-5" />
                </p>
              </motion.div>
            )}

          {/* Incorrect Feedback Message */}
          {!isResponseActive &&
            hasSubmittedCurrentQuestion &&
            !isAnswerCorrect && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
                className="mt-6 p-4 bg-gradient-to-r from-amber-50 to-orange-100 border border-amber-200 rounded-xl text-center"
              >
                <p className="text-lg md:text-xl font-bold text-amber-700 flex items-center justify-center gap-2">
                  💡 Keep trying! The correct answer is above
                </p>
              </motion.div>
            )}

          <TimerProgress timeLeft={timeLeft} timer={quiz.timer} />
        </motion.div>
      </div>
      <ToastContainer position="top-center" autoClose={2000} hideProgressBar />
    </div>
  );
};

export default ParticipantInterface;
