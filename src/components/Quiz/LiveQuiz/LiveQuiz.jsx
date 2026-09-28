import { useState, useEffect, useCallback, useMemo } from "react";
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
import { db } from "../../../firebase/firebase";
import { useAuth } from "../../../context/AuthContext";
import LoadingScreen from "./LoadingScreen";
import QuizCodeVerification from "./QuizCodeVerification";
import JoinQuizForm from "./JoinQuizForm";
import WaitingScreen from "./WaitingScreen";
import PresenterInterface from "./PresenterInterface";
import ParticipantInterface from "./ParticipantInterface";
import { toast } from "react-toastify";

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
  const [isJoined, setIsJoined] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [responses, setResponses] = useState([]);
  const [isResponseActive, setIsResponseActive] = useState(true);
  const [timer, setTimer] = useState(null);
  const [timeLeft, setTimeLeft] = useState(null);
  const [hasSubmittedCurrentQuestion, setHasSubmittedCurrentQuestion] =
    useState(false);
  const [isQuizStarted, setIsQuizStarted] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [showQrCode, setShowQrCode] = useState(false);
  const [windowSize, setWindowSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });

  // Memoized window resize handler
  useEffect(() => {
    const handleResize = () =>
      setWindowSize({ width: window.innerWidth, height: window.innerHeight });
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
        toast.error("Error fetching live quiz");
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
      setResponses(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    });

    return () => {
      unsubscribeQuiz();
      unsubscribeResponses();
    };
  }, [id, user, navigate]);

  // Set participant name from localStorage
  useEffect(() => {
    const savedName = localStorage.getItem(`quiz_${id}_participantName`);
    if (savedName) {
      setParticipantName(savedName.trim());
      setIsJoined(true);
    }
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
    setIsJoined(true);
  }, []);

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
        // Update UI immediately for responsiveness
        setHasSubmittedCurrentQuestion(true);

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
        // Revert UI update on error
        setHasSubmittedCurrentQuestion(false);
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
    await updateDoc(doc(db, "liveQuizzes", id), {
      currentQuestionIndex: currentQuestionIndex + 1,
      isResponseActive: true,
      timer: quiz.timer || null,
      timeLeft: quiz.timer || null,
    });
  }, [currentQuestionIndex, quiz, id]);

  const handlePreviousQuestion = useCallback(async () => {
    if (currentQuestionIndex === 0) return;
    await updateDoc(doc(db, "liveQuizzes", id), {
      currentQuestionIndex: currentQuestionIndex - 1,
      isResponseActive: false,
      timer: null,
      timeLeft: null,
    });
  }, [currentQuestionIndex, id]);

  const toggleResponseActive = useCallback(async () => {
    await updateDoc(doc(db, "liveQuizzes", id), {
      isResponseActive: !isResponseActive,
      timeLeft: !isResponseActive ? quiz.timer : null,
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
      await Promise.all(querySnapshot.docs.map((doc) => deleteDoc(doc.ref)));
      await updateDoc(doc(db, "liveQuizzes", id), {
        isQuizStarted: false,
        isResponseActive: false,
        currentQuestionIndex: 0,
        timer: null,
        timeLeft: null,
      });
      toast.success("Quiz has been reset successfully!");
    } catch (error) {
      toast.error("Failed to reset quiz. Please try again.");
    }
  }, [id]);

  const toggleAnalytics = useCallback(
    () => setShowAnalytics((prev) => !prev),
    []
  );

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
      (r) => r.answers?.[currentQuestionIndex]
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

  if (!quiz) return <LoadingScreen />;
  if (!isAdmin && quiz.quizCode && !isVerified) {
    return (
      <QuizCodeVerification
        quizCode={quizCode}
        setQuizCode={setQuizCode}
        onSubmit={handleQuizCodeSubmit}
      />
    );
  }
  if (!isAdmin && !isJoined && isVerified) {
    return (
      <JoinQuizForm
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

export default LiveQuiz;
