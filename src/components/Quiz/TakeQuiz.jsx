import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { db } from "../../firebase/firebase";
import { doc, getDoc, addDoc, collection } from "firebase/firestore";
import { useAuth } from "../../context/AuthContext";
import { CheckCircle, XCircle, Clock, Download, X, Menu } from "lucide-react";
import { jsPDF } from "jspdf";

const TakeQuiz = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [quiz, setQuiz] = useState(null);
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(null);
  const [results, setResults] = useState([]);
  const [timeLeft, setTimeLeft] = useState(null);
  const [showResultsModal, setShowResultsModal] = useState(false);
  const [showSideMenu, setShowSideMenu] = useState(false);
  const [participantName, setParticipantName] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [participantIP, setParticipantIP] = useState("");
  const [quizCode, setQuizCode] = useState("");
  const [isVerified, setIsVerified] = useState(false);
  const questionRefs = useRef([]);
  const [showNameInput, setShowNameInput] = useState(true);

  useEffect(() => {
    const fetchQuiz = async () => {
      try {
        const quizDoc = await getDoc(doc(db, "quizzes", id));
        if (quizDoc.exists()) {
          const quizData = { id: quizDoc.id, ...quizDoc.data() };
          setQuiz(quizData);
          if (quizData.timer) {
            setTimeLeft(quizData.timer * 60);
          }
          if (!quizData.quizCode) {
            setIsVerified(true);
          }
        } else {
          console.error("Quiz not found");
        }
      } catch (error) {
        console.error("Error fetching quiz:", error);
      }
    };

    const fetchIP = async () => {
      try {
        const response = await fetch("https://api.ipify.org?format=json");
        const data = await response.json();
        setParticipantIP(data.ip);
      } catch (error) {
        console.error("Error fetching IP:", error);
      }
    };

    fetchQuiz();
    fetchIP();
  }, [id]);

  useEffect(() => {
    if (timeLeft === null || timeLeft <= 0 || submitted) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleAutoSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft, submitted]);

  const handleAnswerChange = (questionIndex, optionIndex) => {
    setAnswers((prev) => {
      const question = quiz.questions[questionIndex];
      if (question.isMultipleChoice) {
        const currentAnswers = prev[questionIndex] || [];
        if (currentAnswers.includes(optionIndex)) {
          return {
            ...prev,
            [questionIndex]: currentAnswers.filter(
              (ans) => ans !== optionIndex
            ),
          };
        } else {
          return { ...prev, [questionIndex]: [...currentAnswers, optionIndex] };
        }
      } else {
        return { ...prev, [questionIndex]: [optionIndex] };
      }
    });
  };

  const handleQuizCodeSubmit = (e) => {
    e.preventDefault();
    if (quiz.quizCode && quiz.quizCode === quizCode) {
      setIsVerified(true);
    } else {
      alert("Invalid quiz code");
    }
  };

  const handleAutoSubmit = async () => {
    if (submitted) return;
    let correctCount = 0;
    const resultArray = quiz.questions.map((q, index) => {
      const selectedAnswers = answers[index] || [];
      const correctAnswers = q.correctAnswers || []; // Add this line for safety
      const isCorrect = q.isMultipleChoice
        ? correctAnswers.length === selectedAnswers.length &&
          correctAnswers.every((ans) => selectedAnswers.includes(ans))
        : selectedAnswers.length > 0 && // Check if there's a selected answer
          correctAnswers.length > 0 && // Check if there's a correct answer
          selectedAnswers[0] === correctAnswers[0];
      if (isCorrect) correctCount++;
      return {
        question: q.question,
        selectedOptions:
          selectedAnswers.map((idx) => q.options[idx]).join(", ") ||
          "Not answered",
        correctOptions: correctAnswers.map((idx) => q.options[idx]).join(", "),
        isCorrect,
        feedback: q.feedback,
      };
    });
    // Rest of the function remains the same
    setScore(correctCount);
    setResults(resultArray);
    setSubmitted(true);
    setShowResultsModal(true);
    try {
      await addDoc(collection(db, "results"), {
        quizId: id,
        userId: user?.uid || null,
        participantId: isAnonymous
          ? participantIP
          : participantName || "Anonymous",
        isAnonymous,
        answers,
        score: correctCount,
        total: quiz.questions.length,
        submittedAt: new Date(),
      });
    } catch (error) {
      console.error("Error saving results:", error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    await handleAutoSubmit();
  };

  const handleCancel = () => {
    if (
      window.confirm(
        "Are you sure you want to cancel the quiz? Your progress will not be saved."
      )
    ) {
      navigate("/");
    }
  };

  const generatePDF = () => {
    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });
    const indigo600 = "#4f46e5";
    const green600 = "#16a34a";
    const red600 = "#dc2626";
    const gray600 = "#4b5563";
    doc.setFont("helvetica", "bold");
    doc.setFontSize(20);
    doc.setTextColor(indigo600);
    doc.text(quiz.title, 20, 20);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(12);
    doc.setTextColor(gray600);
    doc.text(`Date: ${new Date().toLocaleDateString()}`, 20, 30);
    doc.text(
      `Participant: ${
        isAnonymous ? "Anonymous" : participantName || "Unknown"
      }`,
      20,
      36
    );
    doc.text(`Score: ${score}/${quiz.questions.length}`, 20, 42);
    if (quiz.description) {
      doc.setFont("helvetica", "italic");
      doc.text(`Description: ${quiz.description}`, 20, 48, { maxWidth: 170 });
    }
    let yOffset = quiz.description ? 56 : 50;
    results.forEach((result, index) => {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(14);
      doc.setTextColor(gray600);
      doc.text(`Question ${index + 1}: ${result.question}`, 20, yOffset, {
        maxWidth: 170,
      });
      yOffset +=
        doc.getTextDimensions(`Question ${index + 1}: ${result.question}`, {
          maxWidth: 170,
        }).h + 4;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(12);
      doc.setTextColor(result.isCorrect ? green600 : red600);
      doc.text(`Your Answer: ${result.selectedOptions}`, 25, yOffset, {
        maxWidth: 165,
      });
      yOffset += 6;
      if (!result.isCorrect) {
        doc.setTextColor(green600);
        doc.text(`Correct Answer: ${result.correctOptions}`, 25, yOffset, {
          maxWidth: 165,
        });
        yOffset += 6;
      }
      if (result.feedback) {
        doc.setTextColor(gray600);
        doc.text(`Feedback: ${result.feedback}`, 25, yOffset, {
          maxWidth: 165,
        });
        yOffset +=
          doc.getTextDimensions(`Feedback: ${result.feedback}`, {
            maxWidth: 165,
          }).h + 6;
      }
      if (yOffset > 260 && index < results.length - 1) {
        doc.addPage();
        yOffset = 20;
      }
    });
    doc.save(`${quiz.title.replace(/\s+/g, "_")}_results.pdf`);
  };

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs < 10 ? "0" : ""}${secs}`;
  };

  const scrollToQuestion = (index) => {
    setShowSideMenu(false);
    questionRefs.current[index]?.scrollIntoView({ behavior: "smooth" });
  };

  if (!quiz)
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading...
      </div>
    );

  if (!isVerified && quiz.quizCode) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-4 md:p-6 flex items-center justify-center">
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 shadow-xl border border-white/20 max-w-md w-full">
          <h2 className="text-2xl font-semibold text-gray-800 mb-6 text-center">
            Enter Quiz Code
          </h2>
          <form onSubmit={handleQuizCodeSubmit} className="space-y-4">
            <input
              type="text"
              value={quizCode}
              onChange={(e) => setQuizCode(e.target.value)}
              placeholder="Enter 6-digit quiz code"
              maxLength="6"
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:ring-0 transition-colors text-lg"
            />
            <button
              type="submit"
              className="w-full px-8 py-4 bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-lg font-semibold rounded-2xl hover:from-indigo-600 hover:to-purple-600 transition-all transform hover:scale-105 shadow-xl"
            >
              Verify Code
            </button>
          </form>
        </div>
      </div>
    );
  }

  if (!submitted && showNameInput) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-4 md:p-6 flex items-center justify-center">
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 shadow-xl border border-white/20 max-w-md w-full">
          <h2 className="text-2xl font-semibold text-gray-800 mb-6 text-center">
            Join Quiz
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Your Name (Required)
              </label>
              <input
                type="text"
                value={participantName}
                onChange={(e) => setParticipantName(e.target.value)}
                placeholder="Enter your name"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:ring-0 transition-colors text-lg"
                autoFocus
              />
            </div>

            {/* Only show the anonymous option if the quiz creator allowed it */}
            {quiz.allowAnonymous && (
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="anonymous-checkbox"
                  checked={isAnonymous}
                  onChange={(e) => {
                    setIsAnonymous(e.target.checked);
                    if (e.target.checked) {
                      setShowNameInput(false);
                    }
                  }}
                  className="w-5 h-5 text-indigo-600 border-gray-300 focus:ring-indigo-500"
                />
                <label
                  htmlFor="anonymous-checkbox"
                  className="text-sm font-medium text-gray-700"
                >
                  Join Anonymously
                </label>
              </div>
            )}

            <button
              onClick={() => {
                // If anonymous is not allowed or not selected, validate name
                if (!quiz.allowAnonymous || !isAnonymous) {
                  if (!participantName.trim()) {
                    alert("Please enter your name");
                    return;
                  }
                }
                setShowNameInput(false);
              }}
              className="w-full px-8 py-4 bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-lg font-semibold rounded-2xl hover:from-indigo-600 hover:to-purple-600 transition-all transform hover:scale-105 shadow-xl"
            >
              Start Quiz
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-4 md:p-6">
      <div className="max-w-5xl mx-auto relative">
        {!submitted && quiz.questions && (
          <button
            onClick={() => setShowSideMenu(!showSideMenu)}
            className="fixed left-4 top-20 z-40 p-2 bg-white rounded-lg shadow-md border border-gray-200 hover:bg-gray-50 transition-colors"
          >
            <Menu className="w-6 h-6 text-indigo-600" />
          </button>
        )}

        {!submitted && quiz.questions && (
          <div
            className={`fixed top-24 left-4 w-64 bg-white shadow-xl z-30 rounded-lg border border-gray-200 transition-all duration-300 ease-in-out ${
              showSideMenu ? "opacity-100 visible" : "opacity-0 invisible"
            }`}
          >
            <div className="p-4 max-h-[70vh] overflow-y-auto">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                Jump to Question
              </h3>
              <div className="grid grid-cols-4 gap-2">
                {quiz.questions.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => scrollToQuestion(index)}
                    className={`w-full h-12 rounded-lg flex items-center justify-center text-sm font-medium transition-all ${
                      answers[index]?.length > 0
                        ? "bg-indigo-500 text-white"
                        : "bg-gray-200 text-gray-800 hover:bg-gray-300"
                    }`}
                  >
                    Q{index + 1}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {showSideMenu && (
          <div
            className="fixed inset-0 bg-black/50 z-20 md:hidden"
            onClick={() => setShowSideMenu(false)}
          />
        )}

        <div className="flex-1 max-w-4xl mx-auto relative">
          <h2 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-6 text-center">
            {quiz.title}
          </h2>

          {quiz.description && (
            <p className="text-gray-600 mb-8 text-center">{quiz.description}</p>
          )}

          {quiz.timer && !submitted && (
            <div className="fixed top-16 right-4 sm:top-20 sm:right-8 flex items-center gap-2 bg-white/80 backdrop-blur-sm rounded-xl p-4 shadow-lg border border-white/20 z-50">
              <Clock className="w-6 h-6 text-indigo-600" />
              <span className="text-lg font-semibold text-gray-800">
                Time Left: {formatTime(timeLeft)}
              </span>
            </div>
          )}

          {!submitted ? (
            <form onSubmit={handleSubmit} className="space-y-6">
              {quiz.questions.map((question, questionIndex) => (
                <div
                  key={question.id}
                  ref={(el) => (questionRefs.current[questionIndex] = el)}
                  className="bg-white/80 backdrop-blur-sm rounded-3xl p-6 shadow-xl border border-white/20"
                >
                  <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-3">
                    <div className="w-8 h-8 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
                      {questionIndex + 1}
                    </div>
                    {question.question}
                  </h3>
                  <div className="space-y-3">
                    {question.options.map((option, optionIndex) => (
                      <label
                        key={optionIndex}
                        className="flex items-center gap-3 cursor-pointer"
                      >
                        <input
                          type={
                            question.isMultipleChoice ? "checkbox" : "radio"
                          }
                          name={`question-${questionIndex}`}
                          value={optionIndex}
                          checked={
                            question.isMultipleChoice
                              ? (answers[questionIndex] || []).includes(
                                  optionIndex
                                )
                              : answers[questionIndex]?.[0] === optionIndex
                          }
                          onChange={() =>
                            handleAnswerChange(questionIndex, optionIndex)
                          }
                          className="w-5 h-5 text-indigo-600 border-gray-300 focus:ring-indigo-500"
                        />
                        <span className="text-gray-700">{option}</span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
              <div className="text-center flex justify-center gap-4">
                <button
                  type="submit"
                  className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-green-500 to-emerald-500 text-white text-lg font-semibold rounded-2xl hover:from-green-600 hover:to-emerald-600 transition-all transform hover:scale-105 shadow-xl"
                >
                  Submit Quiz
                </button>
                <button
                  type="button"
                  onClick={handleCancel}
                  className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-red-500 to-rose-500 text-white text-lg font-semibold rounded-2xl hover:from-red-600 hover:to-rose-600 transition-all transform hover:scale-105 shadow-xl"
                >
                  <X className="w-6 h-6" />
                  Cancel Quiz
                </button>
              </div>
            </form>
          ) : (
            <>
              {showResultsModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                  <div className="bg-white/90 backdrop-blur-sm rounded-3xl p-8 max-w-2xl w-full max-h-[80vh] overflow-y-auto shadow-2xl border border-white/20">
                    <div className="flex justify-between items-center mb-6">
                      <h3 className="text-2xl font-semibold text-gray-800">
                        Quiz Results
                      </h3>
                      <button
                        onClick={() => setShowResultsModal(false)}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                      >
                        <X className="w-6 h-6 text-gray-600" />
                      </button>
                    </div>
                    <div className="text-center mb-6">
                      <h4 className="text-xl font-semibold text-gray-800">
                        Your Score: {score}/{quiz.questions.length}
                      </h4>
                      <p className="text-gray-600 mt-2">
                        {score === quiz.questions.length
                          ? "Perfect! You got all answers correct! ðŸŽ‰"
                          : "Great effort! Review the feedback below to improve."}
                      </p>
                      <button
                        onClick={generatePDF}
                        className="mt-4 inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-blue-500 to-indigo-500 text-white text-lg font-semibold rounded-2xl hover:from-blue-600 hover:to-indigo-600 transition-all transform hover:scale-105 shadow-xl"
                      >
                        <Download className="w-6 h-6" />
                        Download PDF
                      </button>
                    </div>
                    <div className="space-y-6">
                      {results.map((result, index) => (
                        <div
                          key={index}
                          className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 shadow-lg border border-white/20"
                        >
                          <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-3">
                            <div className="w-8 h-8 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
                              {index + 1}
                            </div>
                            {result.question}
                          </h3>
                          <div className="mt-4 space-y-2">
                            <p className="flex items-center gap-2">
                              <span className="font-medium">Your Answer:</span>
                              <span
                                className={
                                  result.isCorrect
                                    ? "text-green-600"
                                    : "text-red-600"
                                }
                              >
                                {result.selectedOptions}{" "}
                                {result.isCorrect ? (
                                  <CheckCircle className="inline w-5 h-5" />
                                ) : (
                                  <XCircle className="inline w-5 h-5" />
                                )}
                              </span>
                            </p>
                            {!result.isCorrect && (
                              <p className="font-medium">
                                Correct Answer:{" "}
                                <span className="text-green-600">
                                  {result.correctOptions}
                                </span>
                              </p>
                            )}
                            {result.feedback && (
                              <p className="text-gray-600">
                                <span className="font-medium">Feedback:</span>{" "}
                                {result.feedback}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-6">
                {results.map((result, index) => (
                  <div
                    key={index}
                    className="bg-white/80 backdrop-blur-sm rounded-3xl p-6 shadow-xl border border-white/20"
                  >
                    <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-3">
                      <div className="w-8 h-8 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
                        {index + 1}
                      </div>
                      {result.question}
                    </h3>
                    <div className="mt-4 space-y-2">
                      <p className="flex items-center gap-2">
                        <span className="font-medium">Your Answer:</span>
                        <span
                          className={
                            result.isCorrect ? "text-green-600" : "text-red-600"
                          }
                        >
                          {result.selectedOptions}{" "}
                          {result.isCorrect ? (
                            <CheckCircle className="inline w-5 h-5" />
                          ) : (
                            <XCircle className="inline w-5 h-5" />
                          )}
                        </span>
                      </p>
                      {!result.isCorrect && (
                        <p className="font-medium">
                          Correct Answer:{" "}
                          <span className="text-green-600">
                            {result.correctOptions}
                          </span>
                        </p>
                      )}
                      {result.feedback && (
                        <p className="text-gray-600">
                          <span className="font-medium">Feedback:</span>{" "}
                          {result.feedback}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default TakeQuiz;
