import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  doc,
  getDoc,
  updateDoc,
  collection,
  addDoc,
  onSnapshot,
  query,
  where,
  getDocs,
  deleteDoc,
} from "firebase/firestore";
import { db } from "../../firebase/firebase";
import { useAuth } from "../../context/AuthContext";
import {
  CheckCircle,
  ArrowLeft,
  ArrowRight,
  Users,
  QrCode,
  Clock,
  BarChart2,
  Play,
  Pause,
  RefreshCw,
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import Confetti from "react-confetti";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { motion, AnimatePresence } from "framer-motion";

const LiveQuiz = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  // State
  const [quiz, setQuiz] = useState(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [participantName, setParticipantName] = useState("");
  const [quizCode, setQuizCode] = useState("");
  const [isVerified, setIsVerified] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [responses, setResponses] = useState([]);
  const [showQrCode, setShowQrCode] = useState(false);
  const [isResponseActive, setIsResponseActive] = useState(true);
  const [timer, setTimer] = useState(null);
  const [timeLeft, setTimeLeft] = useState(null);
  const [hasSubmittedCurrentQuestion, setHasSubmittedCurrentQuestion] =
    useState(false);
  const [isQuizStarted, setIsQuizStarted] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [windowSize, setWindowSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });

  // Memoized effect for window resize
  useEffect(() => {
    const handleResize = () => {
      setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Load quiz data
  useEffect(() => {
    const fetchQuiz = async () => {
      try {
        const quizDocRef = doc(db, "liveQuizzes", id);
        const quizDoc = await getDoc(quizDocRef);
        if (quizDoc.exists()) {
          const quizData = { id: quizDoc.id, ...quizDoc.data() };
          setQuiz(quizData);
          setCurrentQuestionIndex(quizData.currentQuestionIndex || 0);
          setIsAdmin(user && quizData.createdBy === user.uid);
          setIsResponseActive(quizData.isResponseActive !== false);
          setTimer(quizData.timer || null);
          setTimeLeft(quizData.timeLeft || quizData.timer || null);
          setIsQuizStarted(quizData.isQuizStarted || false);

          if (!quizData.quizCode) setIsVerified(true);
          else if (localStorage.getItem(`quiz_${id}_verified`) === "true")
            setIsVerified(true);
        } else {
          navigate("/");
        }
      } catch (error) {
        console.error("Error fetching live quiz:", error);
      }
    };

    fetchQuiz();

    const unsubscribeQuiz = onSnapshot(doc(db, "liveQuizzes", id), (doc) => {
      if (doc.exists()) {
        const quizData = { id: doc.id, ...doc.data() };
        setQuiz(quizData);
        setCurrentQuestionIndex(quizData.currentQuestionIndex || 0);
        setIsResponseActive(quizData.isResponseActive !== false);
        setTimer(quizData.timer || null);
        setTimeLeft(
          quizData.timeLeft !== undefined
            ? quizData.timeLeft
            : quizData.timer || null
        );
        setIsQuizStarted(quizData.isQuizStarted || false);
      }
    });

    const q = query(
      collection(db, "liveQuizResponses"),
      where("quizId", "==", id)
    );
    const unsubscribeResponses = onSnapshot(q, (snapshot) => {
      const updatedResponses = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setResponses(updatedResponses);
    });

    return () => {
      unsubscribeQuiz();
      unsubscribeResponses();
    };
  }, [id, user, navigate]);

  // Set participant name
  useEffect(() => {
    const savedName = localStorage.getItem(`quiz_${id}_participantName`);
    setParticipantName(savedName ? savedName.trim() : "");
  }, [id]);

  // Update submission status
  useEffect(() => {
    if (!isAdmin && participantName) {
      const participantResponse = responses.find(
        (r) => r.participantName === participantName.trim()
      );
      setHasSubmittedCurrentQuestion(
        !!participantResponse?.answers?.[currentQuestionIndex]
      );
    }
  }, [currentQuestionIndex, responses, participantName, isAdmin]);

  // Timer logic
  useEffect(() => {
    let timerInterval;
    if (isAdmin && timer && isResponseActive && timeLeft !== null) {
      if (timeLeft > 0) {
        timerInterval = setInterval(async () => {
          setTimeLeft((prev) => {
            if (prev <= 1) {
              clearInterval(timerInterval);
              handleTimerEnd();
              return 0;
            }
            return prev - 1;
          });
          await updateDoc(doc(db, "liveQuizzes", id), {
            timeLeft: timeLeft - 1,
          });
        }, 1000);
      } else {
        handleTimerEnd();
      }
    }
    return () => clearInterval(timerInterval);
  }, [timeLeft, timer, isResponseActive, isAdmin, id]);

  // Handlers
  const handleQuizCodeSubmit = useCallback(() => {
    if (!quiz) return;
    if (quiz.quizCode === quizCode) {
      setIsVerified(true);
      localStorage.setItem(`quiz_${id}_verified`, "true");
    } else {
      toast.error("Invalid quiz code");
    }
  }, [quiz, quizCode, id]);

  const handleJoinQuiz = useCallback(() => {
    const trimmedName = participantName.trim();
    if (!trimmedName || trimmedName.length < 2) {
      toast.warn("Please enter a valid name (at least 2 characters).");
      return;
    }
    localStorage.setItem(`quiz_${id}_participantName`, trimmedName);
    setIsVerified(true);
  }, [participantName, id]);

  const handleAnswerSubmit = useCallback(
    async (questionIndex, selectedAnswers) => {
      if (
        isAdmin ||
        !participantName ||
        hasSubmittedCurrentQuestion ||
        !isResponseActive
      )
        return;

      try {
        const trimmedName = participantName.trim();
        const responseQuery = query(
          collection(db, "liveQuizResponses"),
          where("quizId", "==", id),
          where("participantName", "==", trimmedName)
        );

        const querySnapshot = await getDocs(responseQuery);
        let existingResponseId = null;
        let existingAnswers = {};

        if (!querySnapshot.empty) {
          const doc = querySnapshot.docs[0];
          existingResponseId = doc.id;
          existingAnswers = doc.data().answers || {};
        }

        const newAnswers = {
          ...existingAnswers,
          [questionIndex]: selectedAnswers,
        };

        if (existingResponseId) {
          await updateDoc(doc(db, "liveQuizResponses", existingResponseId), {
            answers: newAnswers,
            submittedAt: new Date(),
          });
        } else {
          await addDoc(collection(db, "liveQuizResponses"), {
            quizId: id,
            participantName: trimmedName,
            answers: newAnswers,
            submittedAt: new Date(),
          });
        }

        setHasSubmittedCurrentQuestion(true);

        const currentQuestion = quiz.questions[questionIndex];
        const isCorrect = currentQuestion.isMultipleChoice
          ? currentQuestion.correctAnswers.length === selectedAnswers.length &&
            currentQuestion.correctAnswers.every((ans) =>
              selectedAnswers.includes(ans)
            )
          : selectedAnswers[0] === currentQuestion.correctAnswers[0];

        if (isCorrect) {
          setShowConfetti(true);
          setTimeout(() => setShowConfetti(false), 3000);
        }
      } catch (error) {
        console.error("Error submitting answer:", error);
        toast.error("Failed to submit answer. Please try again.");
      }
    },
    [
      isAdmin,
      participantName,
      hasSubmittedCurrentQuestion,
      isResponseActive,
      id,
      quiz,
    ]
  );

  const handleNextQuestion = useCallback(async () => {
    if (!quiz || currentQuestionIndex >= quiz.questions.length - 1) return;
    const newIndex = currentQuestionIndex + 1;
    await updateDoc(doc(db, "liveQuizzes", id), {
      currentQuestionIndex: newIndex,
      isResponseActive: true,
      timer: quiz.timer || null,
      timeLeft: quiz.timer || null,
    });
  }, [currentQuestionIndex, quiz, id]);

  const handlePreviousQuestion = useCallback(async () => {
    if (currentQuestionIndex === 0) return;
    const newIndex = currentQuestionIndex - 1;
    await updateDoc(doc(db, "liveQuizzes", id), {
      currentQuestionIndex: newIndex,
      isResponseActive: false,
      timer: null,
      timeLeft: null,
    });
  }, [currentQuestionIndex, id]);

  const toggleResponseActive = useCallback(async () => {
    const newState = !isResponseActive;
    await updateDoc(doc(db, "liveQuizzes", id), {
      isResponseActive: newState,
      timeLeft: newState ? quiz.timer : null,
    });
  }, [isResponseActive, quiz, id]);

  const handleTimerEnd = useCallback(async () => {
    await updateDoc(doc(db, "liveQuizzes", id), {
      isResponseActive: false,
      timeLeft: 0,
    });
  }, [id]);

  const setQuizTimer = useCallback(
    async (seconds) => {
      await updateDoc(doc(db, "liveQuizzes", id), {
        timer: seconds,
        timeLeft: seconds,
        isResponseActive: true,
      });
    },
    [id]
  );

  const startQuiz = useCallback(async () => {
    await updateDoc(doc(db, "liveQuizzes", id), {
      isQuizStarted: true,
      isResponseActive: true,
      currentQuestionIndex: 0,
      timer: quiz.timer || null,
      timeLeft: quiz.timer || null,
    });
  }, [id, quiz]);

  const resetQuiz = useCallback(async () => {
    try {
      const responseQuery = query(
        collection(db, "liveQuizResponses"),
        where("quizId", "==", id)
      );
      const querySnapshot = await getDocs(responseQuery);
      const deletePromises = querySnapshot.docs.map((doc) =>
        deleteDoc(doc.ref)
      );
      await Promise.all(deletePromises);

      await updateDoc(doc(db, "liveQuizzes", id), {
        isQuizStarted: false,
        isResponseActive: false,
        currentQuestionIndex: 0,
        timer: null,
        timeLeft: null,
      });
      toast.success("Quiz has been reset successfully!");
    } catch (error) {
      console.error("Error resetting quiz:", error);
      toast.error("Failed to reset quiz. Please try again.");
    }
  }, [id]);

  const toggleAnalytics = useCallback(() => {
    setShowAnalytics((prev) => !prev);
  }, []);

  const analytics = useMemo(() => {
    if (!quiz || !quiz.questions[currentQuestionIndex]) {
      return {
        responseCount: 0,
        correctCount: 0,
        optionCounts: [],
        participantChoices: [],
      };
    }

    const currentQuestion = quiz.questions[currentQuestionIndex];
    const responsesForCurrentQuestion = responses.filter(
      (r) => r.answers && r.answers[currentQuestionIndex]
    );

    const responseCount = responsesForCurrentQuestion.length;
    let correctCount = 0;
    const optionCounts = Array(currentQuestion.options.length).fill(0);
    const participantChoices = responsesForCurrentQuestion.map((r) => {
      const selectedAnswers = r.answers[currentQuestionIndex] || [];
      const isCorrect = currentQuestion.isMultipleChoice
        ? currentQuestion.correctAnswers.length === selectedAnswers.length &&
          currentQuestion.correctAnswers.every((ans) =>
            selectedAnswers.includes(ans)
          )
        : selectedAnswers[0] === currentQuestion.correctAnswers[0];
      if (isCorrect) correctCount++;
      selectedAnswers.forEach((index) => {
        if (optionCounts[index] !== undefined) optionCounts[index]++;
      });
      return {
        name: r.participantName,
        selectedOptions: selectedAnswers.map(
          (index) => currentQuestion.options[index]
        ),
        isCorrect,
      };
    });

    return { responseCount, correctCount, optionCounts, participantChoices };
  }, [quiz, responses, currentQuestionIndex]);

  if (!quiz) {
    return <LoadingScreen />;
  }

  if (!isAdmin && quiz.quizCode && !isVerified) {
    return (
      <QuizCodeVerification
        quizCode={quizCode}
        setQuizCode={setQuizCode}
        onSubmit={handleQuizCodeSubmit}
      />
    );
  }

  if (!isAdmin && !participantName.trim() && isVerified) {
    return (
      <JoinQuizForm
        participantName={participantName}
        setParticipantName={setParticipantName}
        onJoin={handleJoinQuiz}
      />
    );
  }

  if (!isAdmin && !isQuizStarted) {
    return <WaitingScreen quiz={quiz} participantName={participantName} />;
  }

  return isAdmin ? (
    <PresenterInterface
      quiz={quiz}
      currentQuestionIndex={currentQuestionIndex}
      currentQuestion={quiz.questions[currentQuestionIndex]}
      isResponseActive={isResponseActive}
      timeLeft={timeLeft}
      showQrCode={showQrCode}
      showAnalytics={showAnalytics}
      analytics={analytics}
      responses={responses}
      handleNextQuestion={handleNextQuestion}
      handlePreviousQuestion={handlePreviousQuestion}
      toggleResponseActive={toggleResponseActive}
      startQuiz={startQuiz}
      resetQuiz={resetQuiz}
      setQuizTimer={setQuizTimer}
      toggleAnalytics={toggleAnalytics}
      setShowQrCode={setShowQrCode}
      quizCode={quiz.quizCode}
      windowSize={windowSize}
    />
  ) : (
    <ParticipantInterface
      quiz={quiz}
      currentQuestionIndex={currentQuestionIndex}
      currentQuestion={quiz.questions[currentQuestionIndex]}
      participantName={participantName}
      isResponseActive={isResponseActive}
      hasSubmittedCurrentQuestion={hasSubmittedCurrentQuestion}
      timeLeft={timeLeft}
      handleAnswerSubmit={handleAnswerSubmit}
      windowSize={windowSize}
      showConfetti={showConfetti}
    />
  );
};

const LoadingScreen = () => (
  <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-purple-50">
    <motion.div
      animate={{ rotate: 360 }}
      transition={{ repeat: Infinity, duration: 1 }}
      className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full"
    />
  </div>
);

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

const JoinQuizForm = ({ participantName, setParticipantName, onJoin }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isValidName = participantName.trim().length >= 2;
  const inputRef = useRef(null);

  // Debug re-renders
  useEffect(() => {
    console.log(
      "JoinQuizForm re-rendered with participantName:",
      participantName
    );
  }, [participantName]);

  const handleInputChange = (e) => {
    const newName = e.target.value.replace(/[^a-zA-Z0-9\s]/g, "");
    console.log("Input changed:", newName);
    setParticipantName(newName);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    e.stopPropagation();
    console.log("Form submission triggered by:", {
      eventType: e.type,
      target: e.target.tagName,
      currentTarget: e.currentTarget.tagName,
      participantName,
    });

    if (!isValidName) {
      console.log("Invalid name:", participantName);
      toast.warn("Please enter a valid name (at least 2 characters).");
      return;
    }

    setIsSubmitting(true);
    console.log("Submitting with name:", participantName);
    try {
      onJoin();
    } catch (error) {
      console.error("Error in onJoin:", error);
      setIsSubmitting(false);
    }
  };

  const handleBlur = () => {
    console.log("Input lost focus");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-4 md:p-6 flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 shadow-xl border border-white/20 max-w-md w-full"
      >
        <h2 className="text-2xl font-semibold text-gray-800 mb-6 text-center">
          Join Live Quiz
        </h2>
        <form onSubmit={handleSubmit} noValidate>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Your Name *
              </label>
              <input
                ref={inputRef}
                type="text"
                value={participantName}
                onChange={handleInputChange}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    // Prevent auto-submit on Enter in case form is invalid
                    e.preventDefault();
                    e.stopPropagation();
                  }
                }}
                onBlur={handleBlur}
                placeholder="Enter your name"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:ring-0 transition-colors text-lg"
                autoComplete="off"
                autoFocus
                disabled={isSubmitting}
              />
            </div>
            <button
              type="submit"
              disabled={isSubmitting || !isValidName}
              className={`w-full px-8 py-4 bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-lg font-semibold rounded-2xl hover:from-indigo-600 hover:to-purple-600 transition-all transform hover:scale-105 shadow-xl ${
                isSubmitting || !isValidName
                  ? "opacity-75 cursor-not-allowed"
                  : ""
              }`}
            >
              {isSubmitting ? "Joining..." : "Join Quiz"}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};
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

        {timeLeft !== null && (
          <div className="flex items-center justify-center gap-2 text-gray-800 mt-4">
            <Clock className="w-6 h-6 animate-pulse" />
            <span className="text-2xl font-bold">{timeLeft}s</span>
            <motion.div
              className="w-full bg-gray-200 rounded-full h-2 ml-4"
              initial={{ width: "100%" }}
              animate={{
                width: `${Math.max(5, (timeLeft / quiz.timer) * 100)}%`,
              }}
            >
              <div className="h-2 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500"></div>
            </motion.div>
          </div>
        )}

        {showQrCode && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mt-4 bg-white p-4 rounded-xl inline-block"
          >
            <QRCodeSVG
              value={`${window.location.origin}/live-quiz/${quiz.id}`}
              size={200}
            />
            <p className="mt-2 text-gray-600">Quiz Code: {quizCode}</p>
            <p className="mt-1 text-gray-600 text-sm">
              Participants scan this to join.
            </p>
          </motion.div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
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
              disabled={currentQuestionIndex === quiz.questions.length - 1}
              className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-500 text-white rounded-xl disabled:opacity-50"
            >
              Next
              <ArrowRight className="w-5 h-5" />
            </motion.button>
          </div>
        </div>

        {showAnalytics && (
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
                        ? (analytics.optionCounts[index] /
                            analytics.responseCount) *
                          100
                        : 0;
                    const isCorrect =
                      currentQuestion.correctAnswers.includes(index);
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
                            {analytics.optionCounts[index]} (
                            {Math.round(percentage)}%)
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
                                choice.isCorrect
                                  ? "text-green-800"
                                  : "text-red-800"
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
        )}
      </div>
    </div>
    <ToastContainer position="top-right" autoClose={3000} />
  </div>
);

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
}) => {
  const participantResponse = useMemo(
    () =>
      quiz.responses?.find((r) => r.participantName === participantName) || {},
    [quiz.responses, participantName]
  );
  const participantAnswer =
    participantResponse.answers?.[currentQuestionIndex] || [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-4 md:p-6">
      {showConfetti && (
        <Confetti
          width={windowSize.width}
          height={windowSize.height}
          numberOfPieces={500}
        />
      )}
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2">
            {quiz.title}
          </h1>
          <p className="text-gray-600">{quiz.description}</p>
          <div className="mt-4 bg-indigo-100 text-indigo-800 px-4 py-2 rounded-full text-sm font-medium inline-block">
            {participantName}
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 shadow-xl border border-white/20"
        >
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
              const isSelectedByParticipant =
                participantAnswer.includes(optionIndex);
              const showFeedback = !isResponseActive;

              return (
                <motion.div
                  key={optionIndex}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: optionIndex * 0.1 }}
                  className={`relative rounded-xl overflow-hidden transition-all ${
                    isSelectedByParticipant ? "ring-2 ring-offset-2" : ""
                  } ${
                    showFeedback
                      ? isSelectedByParticipant && isCorrectOption
                        ? "ring-green-500 bg-green-50"
                        : isSelectedByParticipant && !isCorrectOption
                        ? "ring-red-500 bg-red-50"
                        : isCorrectOption
                        ? "ring-green-500 bg-green-50"
                        : "ring-gray-300"
                      : "ring-indigo-500 hover:bg-gray-50"
                  }`}
                >
                  <label
                    className={`flex items-center gap-3 p-4 relative z-10 cursor-pointer ${
                      isSelectedByParticipant ? "font-semibold" : ""
                    }`}
                  >
                    <input
                      type={
                        currentQuestion.isMultipleChoice ? "checkbox" : "radio"
                      }
                      name={`question-${currentQuestionIndex}`}
                      value={optionIndex}
                      disabled={
                        hasSubmittedCurrentQuestion || !isResponseActive
                      }
                      checked={isSelectedByParticipant}
                      onChange={() => {
                        if (!hasSubmittedCurrentQuestion && isResponseActive) {
                          const newSelectedAnswers =
                            currentQuestion.isMultipleChoice
                              ? isSelectedByParticipant
                                ? participantAnswer.filter(
                                    (ans) => ans !== optionIndex
                                  )
                                : [...participantAnswer, optionIndex]
                              : [optionIndex];
                          handleAnswerSubmit(
                            currentQuestionIndex,
                            newSelectedAnswers
                          );
                        }
                      }}
                      className={`w-5 h-5 ${
                        isSelectedByParticipant
                          ? showFeedback && isCorrectOption
                            ? "text-green-600 accent-green-600"
                            : showFeedback && !isCorrectOption
                            ? "text-red-600 accent-red-600"
                            : "text-indigo-600 accent-indigo-600"
                          : showFeedback && isCorrectOption
                          ? "text-green-600 accent-green-600"
                          : "text-gray-400"
                      } border-gray-300 focus:ring-0`}
                    />
                    <span className="flex-1">{option}</span>
                    {showFeedback && isCorrectOption && (
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    )}
                  </label>
                </motion.div>
              );
            })}
          </div>

          {!isResponseActive && hasSubmittedCurrentQuestion && (
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

          {timeLeft !== null && (
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
                  animate={{
                    width: `${Math.max(5, (timeLeft / quiz.timer) * 100)}%`,
                  }}
                  transition={{ duration: 0.5 }}
                />
              </div>
            </motion.div>
          )}
        </motion.div>
      </div>
      <ToastContainer position="top-right" autoClose={3000} />
    </div>
  );
};

export default LiveQuiz;
