import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { db } from "../../firebase/firebase";
import {
  collection,
  query,
  where,
  getDocs,
  getDoc,
  doc,
} from "firebase/firestore";
import { useAuth } from "../../context/AuthContext";
import {
  BarChart2,
  Users,
  Clock,
  AlertCircle,
  CheckCircle,
  XCircle,
  User,
} from "lucide-react";
import { Bar, Pie } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from "chart.js";
// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);
const QuizAnalytics = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const [analytics, setAnalytics] = useState({
    attempts: 0,
    submissions: [],
    mistakes: {},
    averageScore: 0,
    quiz: null,
    error: null,
    scoreDistribution: {},
  });
  const [filter, setFilter] = useState("all"); // all, named, anonymous
  const [sortBy, setSortBy] = useState("submittedAt"); // submittedAt, score, participantId
  const [loading, setLoading] = useState(true);
  const [selectedParticipant, setSelectedParticipant] = useState(null);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        // Fetch quiz details
        const quizRef = doc(db, "quizzes", id);
        const quizDoc = await getDoc(quizRef);
        let quizData = null;
        if (quizDoc.exists()) {
          quizData = { id: quizDoc.id, ...quizDoc.data() };
        } else {
          setAnalytics((prev) => ({ ...prev, error: "Quiz not found" }));
          setLoading(false);
          return;
        }
        // Fetch results
        const resultsQuery = query(
          collection(db, "results"),
          where("quizId", "==", id)
        );
        const resultsSnapshot = await getDocs(resultsQuery);
        const submissions = [];
        const mistakes = {};
        const scoreDistribution = {};
        resultsSnapshot.forEach((doc) => {
          const data = doc.data();
          let correctCount = 0;
          // Calculate correct answers considering multiple-choice questions
          Object.keys(data.answers).forEach((qIndex) => {
            const question = quizData?.questions[parseInt(qIndex)];
            if (!question) return; // Skip if question not found
            const selectedAnswers = data.answers[qIndex] || [];
            const isCorrect = question.isMultipleChoice
              ? question.correctAnswers.length === selectedAnswers.length &&
                question.correctAnswers.every((ans) =>
                  selectedAnswers.includes(ans)
                )
              : selectedAnswers[0] === question.correctAnswers[0];
            if (!isCorrect) {
              mistakes[qIndex] = (mistakes[qIndex] || 0) + 1;
            } else {
              correctCount++;
            }
          });
          const score = data.score || correctCount;
          const total = data.total || quizData.questions.length;
          const percentageScore = Math.round((score / total) * 100);
          // Group scores into ranges for distribution
          const scoreRange = Math.floor(percentageScore / 10) * 10;
          scoreDistribution[scoreRange] =
            (scoreDistribution[scoreRange] || 0) + 1;
          submissions.push({
            id: doc.id,
            participantId: data.participantId || "Unknown",
            isAnonymous: data.isAnonymous || false,
            score,
            total,
            percentageScore,
            answers: data.answers,
            submittedAt: data.submittedAt?.toDate() || new Date(),
          });
        });
        // Calculate average score
        const averageScore =
          submissions.length > 0
            ? submissions.reduce((sum, sub) => sum + sub.percentageScore, 0) /
              submissions.length
            : 0;
        setAnalytics({
          attempts: resultsSnapshot.size,
          submissions,
          mistakes,
          averageScore,
          quiz: quizData,
          error: null,
          scoreDistribution,
        });
      } catch (error) {
        console.error("Error fetching analytics:", error);
        setAnalytics((prev) => ({
          ...prev,
          error: "Failed to load analytics. Please try again.",
        }));
      } finally {
        setLoading(false);
      }
    };
    if (user) {
      fetchAnalytics();
    }
  }, [id, user]);

  const filteredSubmissions = analytics.submissions.filter((submission) => {
    if (filter === "named") return !submission.isAnonymous;
    if (filter === "anonymous") return submission.isAnonymous;
    return true;
  });

  const sortedSubmissions = [...filteredSubmissions].sort((a, b) => {
    if (sortBy === "score") return b.percentageScore - a.percentageScore;
    if (sortBy === "participantId") {
      return a.participantId.localeCompare(b.participantId);
    }
    return b.submittedAt - a.submittedAt; // Default by submittedAt
  });

  const getMistakePercentage = (questionIndex) => {
    const totalAttempts = analytics.attempts;
    const mistakeCount = analytics.mistakes[questionIndex] || 0;
    return totalAttempts > 0
      ? ((mistakeCount / totalAttempts) * 100).toFixed(1)
      : 0;
  };

  // Prepare data for charts
  const mistakesChartData = {
    labels: Object.keys(analytics.mistakes).map(
      (qIndex) => `Q${parseInt(qIndex) + 1}`
    ),
    datasets: [
      {
        label: "Incorrect Answers",
        data: Object.keys(analytics.mistakes).map(
          (qIndex) => analytics.mistakes[qIndex]
        ),
        backgroundColor: "#ef4444",
        borderColor: "#b91c1c",
        borderWidth: 1,
      },
    ],
  };

  const scoreDistributionData = {
    labels: [
      "0-9%",
      "10-19%",
      "20-29%",
      "30-39%",
      "40-49%",
      "50-59%",
      "60-69%",
      "70-79%",
      "80-89%",
      "90-100%",
    ],
    datasets: [
      {
        label: "Participants",
        data: Array.from(
          { length: 10 },
          (_, i) => analytics.scoreDistribution[i * 10] || 0
        ),
        backgroundColor: [
          "rgba(239, 68, 68, 0.7)",
          "rgba(249, 115, 22, 0.7)",
          "rgba(234, 179, 8, 0.7)",
          "rgba(132, 204, 22, 0.7)",
          "rgba(16, 185, 129, 0.7)",
          "rgba(5, 150, 105, 0.7)",
          "rgba(6, 182, 212, 0.7)",
          "rgba(14, 165, 233, 0.7)",
          "rgba(99, 102, 241, 0.7)",
          "rgba(124, 58, 237, 0.7)",
        ],
        borderColor: [
          "rgba(239, 68, 68, 1)",
          "rgba(249, 115, 22, 1)",
          "rgba(234, 179, 8, 1)",
          "rgba(132, 204, 22, 1)",
          "rgba(16, 185, 129, 1)",
          "rgba(5, 150, 105, 1)",
          "rgba(6, 182, 212, 1)",
          "rgba(14, 165, 233, 1)",
          "rgba(99, 102, 241, 1)",
          "rgba(124, 58, 237, 1)",
        ],
        borderWidth: 1,
      },
    ],
  };

  const participationChartData = {
    labels: ["Named", "Anonymous"],
    datasets: [
      {
        data: [
          analytics.submissions.filter((s) => !s.isAnonymous).length,
          analytics.submissions.filter((s) => s.isAnonymous).length,
        ],
        backgroundColor: [
          "rgba(99, 102, 241, 0.7)",
          "rgba(209, 213, 219, 0.7)",
        ],
        borderColor: ["rgba(99, 102, 241, 1)", "rgba(209, 213, 219, 1)"],
        borderWidth: 1,
      },
    ],
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-purple-50">
        <p className="text-gray-600">Please log in to view quiz analytics.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-purple-50">
        <div className="animate-pulse flex flex-col items-center">
          <div className="w-16 h-16 bg-indigo-200 rounded-full mb-4"></div>
          <div className="h-6 bg-indigo-200 rounded w-48 mb-2"></div>
          <div className="h-4 bg-indigo-200 rounded w-64"></div>
        </div>
      </div>
    );
  }

  if (analytics.error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-purple-50">
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 shadow-xl border border-white/20 max-w-md w-full text-center">
          <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
          <p className="text-gray-600">{analytics.error}</p>
        </div>
      </div>
    );
  }

  if (!analytics.quiz) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-purple-50">
        <p className="text-gray-600">No quiz data available.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl mb-4">
            <BarChart2 className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2">
            Quiz Analytics: {analytics.quiz.title}
          </h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            {analytics.quiz.description}
          </p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-indigo-100 rounded-xl">
                <Users className="w-6 h-6 text-indigo-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Attempts</p>
                <p className="text-2xl font-bold text-gray-800">
                  {analytics.attempts}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-100 rounded-xl">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Average Score</p>
                <p className="text-2xl font-bold text-gray-800">
                  {analytics.averageScore.toFixed(1)}%
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-100 rounded-xl">
                <Clock className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Quiz Duration</p>
                <p className="text-2xl font-bold text-gray-800">
                  {analytics.quiz.timer
                    ? `${analytics.quiz.timer} min`
                    : "No Timer"}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 rounded-xl">
                <BarChart2 className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Questions</p>
                <p className="text-2xl font-bold text-gray-800">
                  {analytics.quiz.questions?.length || 0}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Mistakes Chart */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              Question Accuracy
            </h2>
            <div className="h-64">
              <Bar
                data={mistakesChartData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      display: false,
                    },
                    tooltip: {
                      callbacks: {
                        label: (context) => {
                          const total = analytics.attempts;
                          const value = context.raw;
                          const percentage = ((value / total) * 100).toFixed(1);
                          return `${value} incorrect (${percentage}%)`;
                        },
                      },
                    },
                  },
                  scales: {
                    y: {
                      beginAtZero: true,
                      title: {
                        display: true,
                        text: "Incorrect Answers",
                      },
                    },
                    x: {
                      title: {
                        display: true,
                        text: "Question Number",
                      },
                    },
                  },
                }}
              />
            </div>
          </div>

          {/* Score Distribution Chart */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              Score Distribution
            </h2>
            <div className="h-64">
              <Pie
                data={scoreDistributionData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      position: "right",
                    },
                    tooltip: {
                      callbacks: {
                        label: (context) => {
                          const label = context.label || "";
                          const value = context.raw;
                          const total = context.dataset.data.reduce(
                            (a, b) => a + b,
                            0
                          );
                          const percentage = Math.round((value / total) * 100);
                          return `${label}: ${value} (${percentage}%)`;
                        },
                      },
                    },
                  },
                }}
              />
            </div>
          </div>
        </div>

        {/* Participation Chart */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20 mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            Participation Type
          </h2>
          <div className="h-64">
            <Pie
              data={participationChartData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    position: "right",
                  },
                  tooltip: {
                    callbacks: {
                      label: (context) => {
                        const label = context.label || "";
                        const value = context.raw;
                        const total = context.dataset.data.reduce(
                          (a, b) => a + b,
                          0
                        );
                        const percentage = Math.round((value / total) * 100);
                        return `${label}: ${value} (${percentage}%)`;
                      },
                    },
                  },
                },
              }}
            />
          </div>
        </div>

        {/* Filters Section */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20 mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            Filters & Sorting
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Filter by Participant Type
              </label>
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:ring-0 transition-colors"
              >
                <option value="all">All Participants</option>
                <option value="named">Named Participants</option>
                <option value="anonymous">Anonymous Participants</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sort By
              </label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:ring-0 transition-colors"
              >
                <option value="submittedAt">
                  Submission Time (Newest First)
                </option>
                <option value="score">Score (Highest First)</option>
                <option value="participantId">Participant ID (A-Z)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Participant Overview Table */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20 mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-6">
            Participant Overview
          </h2>

          {sortedSubmissions.length === 0 ? (
            <p className="text-gray-600">No submissions yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="pb-3 text-sm font-semibold text-gray-700 text-left">
                      Participant
                    </th>
                    <th className="pb-3 text-sm font-semibold text-gray-700 text-left">
                      Score
                    </th>
                    <th className="pb-3 text-sm font-semibold text-gray-700 text-left">
                      Percentage
                    </th>
                    <th className="pb-3 text-sm font-semibold text-gray-700 text-left">
                      Submitted At
                    </th>
                    <th className="pb-3 text-sm font-semibold text-gray-700 text-left">
                      Type
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {sortedSubmissions.map((submission) => (
                    <tr
                      key={submission.id}
                      onClick={() =>
                        setSelectedParticipant(
                          selectedParticipant?.id === submission.id
                            ? null
                            : submission
                        )
                      }
                      className={`cursor-pointer hover:bg-gray-50 transition-colors ${
                        selectedParticipant?.id === submission.id
                          ? "bg-indigo-50 border-r-4 border-r-indigo-500"
                          : ""
                      }`}
                    >
                      <td className="py-4 pr-4">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full flex items-center justify-center mr-3">
                            <User className="w-4 h-4 text-white" />
                          </div>
                          <span className="font-medium text-gray-800">
                            {submission.isAnonymous
                              ? "Anonymous"
                              : submission.participantId}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 pr-4">
                        <span className="text-gray-700">
                          {submission.score}/{submission.total}
                        </span>
                      </td>
                      <td className="py-4 pr-4">
                        <span
                          className={`font-medium ${
                            submission.percentageScore >= 70
                              ? "text-green-600"
                              : submission.percentageScore >= 50
                              ? "text-yellow-600"
                              : "text-red-600"
                          }`}
                        >
                          {submission.percentageScore}%
                        </span>
                      </td>
                      <td className="py-4 pr-4">
                        <span className="text-gray-600 text-sm">
                          {submission.submittedAt.toLocaleString()}
                        </span>
                      </td>
                      <td className="py-4 pr-4">
                        <span
                          className={`inline-flex px-2 py-1 text-xs rounded-full ${
                            submission.isAnonymous
                              ? "bg-gray-100 text-gray-800"
                              : "bg-indigo-100 text-indigo-800"
                          }`}
                        >
                          {submission.isAnonymous ? "Anonymous" : "Named"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Selected Participant Details */}
        {selectedParticipant && (
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20 mb-8 animate-fadeIn">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-800">
                Submission Details:{" "}
                {selectedParticipant.isAnonymous
                  ? "Anonymous"
                  : selectedParticipant.participantId}
              </h2>
              <button
                onClick={() => setSelectedParticipant(null)}
                className="text-gray-500 hover:text-gray-700 text-sm font-medium"
              >
                Hide Details
              </button>
            </div>

            <div className="bg-gray-50 rounded-xl p-5 shadow-sm border border-gray-100 mb-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <p className="text-sm text-gray-600">Final Score</p>
                  <p className="text-2xl font-bold text-indigo-600 mt-1">
                    {selectedParticipant.score}/{selectedParticipant.total}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-600">Percentage</p>
                  <p className="text-2xl font-bold text-green-600 mt-1">
                    {selectedParticipant.percentageScore}%
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-600">Submitted On</p>
                  <p className="text-sm text-gray-800 mt-1">
                    {selectedParticipant.submittedAt.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              {Object.keys(selectedParticipant.answers).map((qIndex) => {
                const question = analytics.quiz.questions[parseInt(qIndex)];
                if (!question) return null;
                const selectedAnswers =
                  selectedParticipant.answers[qIndex] || [];
                const isCorrect = question.isMultipleChoice
                  ? question.correctAnswers.length === selectedAnswers.length &&
                    question.correctAnswers.every((ans) =>
                      selectedAnswers.includes(ans)
                    )
                  : selectedAnswers[0] === question.correctAnswers[0];
                return (
                  <div
                    key={qIndex}
                    className={`p-4 rounded-lg border ${
                      isCorrect
                        ? "bg-green-50 border-green-200"
                        : "bg-red-50 border-red-200"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                          isCorrect
                            ? "bg-green-100 text-green-600"
                            : "bg-red-100 text-red-600"
                        }`}
                      >
                        {isCorrect ? (
                          <CheckCircle className="w-4 h-4" />
                        ) : (
                          <XCircle className="w-4 h-4" />
                        )}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-800 mb-2">
                          Q{parseInt(qIndex) + 1}: {question.question}
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
                          <div>
                            <p className="text-sm font-medium text-gray-700 mb-1">
                              Selected:
                            </p>
                            {selectedAnswers.length > 0 ? (
                              <ul className="space-y-1">
                                {selectedAnswers.map((ansIndex, i) => (
                                  <li
                                    key={i}
                                    className={`text-sm px-2 py-1 rounded ${
                                      isCorrect
                                        ? "bg-green-100 text-green-800"
                                        : "bg-red-100 text-red-800"
                                    }`}
                                  >
                                    {question.options[ansIndex]}
                                  </li>
                                ))}
                              </ul>
                            ) : (
                              <p className="text-sm text-gray-500 italic">
                                No answer selected
                              </p>
                            )}
                          </div>
                          {!isCorrect && (
                            <div>
                              <p className="text-sm font-medium text-gray-700 mb-1">
                                Correct Answer:
                              </p>
                              <ul className="space-y-1">
                                {question.correctAnswers.map((ansIndex, i) => (
                                  <li
                                    key={i}
                                    className="text-sm bg-green-100 text-green-800 px-2 py-1 rounded"
                                  >
                                    {question.options[ansIndex]}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                        {question.feedback && (
                          <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                            <h5 className="text-sm font-medium text-blue-800 mb-1">
                              Feedback
                            </h5>
                            <p className="text-sm text-blue-700">
                              {question.feedback}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Common Mistakes Section */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20 mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            Question Performance Details
          </h2>
          {Object.keys(analytics.mistakes).length === 0 ? (
            <p className="text-gray-600">No mistakes recorded.</p>
          ) : (
            <div className="space-y-6">
              {Object.keys(analytics.mistakes).map((qIndex) => {
                const question = analytics.quiz.questions[parseInt(qIndex)];
                if (!question) return null;
                return (
                  <div key={qIndex} className="bg-gray-50 rounded-xl p-4">
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
                        {parseInt(qIndex) + 1}
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-medium text-gray-800">
                          {question.question}
                        </h3>
                        <p className="text-sm text-gray-600 mb-3">
                          {question.isMultipleChoice
                            ? "Multiple Choice"
                            : "Single Choice"}
                        </p>
                        <div className="mb-3">
                          <div className="flex justify-between text-sm mb-1">
                            <span>
                              Incorrect Answers: {analytics.mistakes[qIndex]} (
                              {getMistakePercentage(qIndex)}%)
                            </span>
                            <span>
                              Accuracy:{" "}
                              {100 - parseFloat(getMistakePercentage(qIndex))}%
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2.5">
                            <div
                              className="bg-green-500 h-2.5 rounded-full"
                              style={{
                                width: `${
                                  100 - parseFloat(getMistakePercentage(qIndex))
                                }%`,
                              }}
                            ></div>
                          </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <h4 className="text-sm font-medium text-gray-700 mb-2">
                              Correct Answer(s)
                            </h4>
                            <ul className="space-y-1">
                              {question.correctAnswers.map((ansIndex, i) => (
                                <li
                                  key={i}
                                  className="text-sm bg-green-50 text-green-800 px-3 py-1 rounded"
                                >
                                  {question.options[ansIndex]}
                                </li>
                              ))}
                            </ul>
                          </div>
                          <div>
                            <h4 className="text-sm font-medium text-gray-700 mb-2">
                              All Options
                            </h4>
                            <ul className="space-y-1">
                              {question.options.map((option, i) => (
                                <li
                                  key={i}
                                  className={`text-sm px-3 py-1 rounded ${
                                    question.correctAnswers.includes(i)
                                      ? "bg-green-50 text-green-800"
                                      : "bg-gray-50 text-gray-800"
                                  }`}
                                >
                                  {option}
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                        {question.feedback && (
                          <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                            <h4 className="text-sm font-medium text-blue-800 mb-1">
                              Feedback
                            </h4>
                            <p className="text-sm text-blue-700">
                              {question.feedback}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Submissions Section */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-800">
              Submission Details
            </h2>
            <p className="text-sm text-gray-600">
              Showing {sortedSubmissions.length} of{" "}
              {analytics.submissions.length} submissions
            </p>
          </div>
          {sortedSubmissions.length === 0 ? (
            <p className="text-gray-600">No submissions yet.</p>
          ) : (
            <div className="space-y-4">
              {sortedSubmissions.map((submission) => (
                <div
                  key={submission.id}
                  className="bg-gray-50 rounded-xl p-5 shadow-sm border border-gray-100"
                >
                  <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-4">
                    <div>
                      <h3 className="text-lg font-medium text-gray-800">
                        {submission.isAnonymous
                          ? "Anonymous"
                          : submission.participantId}
                      </h3>
                      <p className="text-sm text-gray-600">
                        Submitted: {submission.submittedAt.toLocaleString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="bg-white px-4 py-2 rounded-lg shadow-sm border border-gray-200">
                        <p className="text-sm text-gray-600">Score</p>
                        <p className="text-xl font-bold text-indigo-600">
                          {submission.score}/{submission.total} (
                          {submission.percentageScore}%)
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    {Object.keys(submission.answers).map((qIndex) => {
                      const question =
                        analytics.quiz.questions[parseInt(qIndex)];
                      if (!question) return null;
                      const selectedAnswers = submission.answers[qIndex] || [];
                      const isCorrect = question.isMultipleChoice
                        ? question.correctAnswers.length ===
                            selectedAnswers.length &&
                          question.correctAnswers.every((ans) =>
                            selectedAnswers.includes(ans)
                          )
                        : selectedAnswers[0] === question.correctAnswers[0];
                      return (
                        <div
                          key={qIndex}
                          className={`p-3 rounded-lg border ${
                            isCorrect
                              ? "bg-green-50 border-green-200"
                              : "bg-red-50 border-red-200"
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <div
                              className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                                isCorrect
                                  ? "bg-green-100 text-green-600"
                                  : "bg-red-100 text-red-600"
                              }`}
                            >
                              {isCorrect ? (
                                <CheckCircle className="w-4 h-4" />
                              ) : (
                                <XCircle className="w-4 h-4" />
                              )}
                            </div>
                            <div className="flex-1">
                              <h4 className="font-medium text-gray-800 mb-1">
                                Q{parseInt(qIndex) + 1}: {question.question}
                              </h4>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
                                <div>
                                  <p className="text-sm font-medium text-gray-700 mb-1">
                                    Selected:
                                  </p>
                                  {selectedAnswers.length > 0 ? (
                                    <ul className="space-y-1">
                                      {selectedAnswers.map((ansIndex, i) => (
                                        <li
                                          key={i}
                                          className={`text-sm px-2 py-1 rounded ${
                                            isCorrect
                                              ? "bg-green-100 text-green-800"
                                              : "bg-red-100 text-red-800"
                                          }`}
                                        >
                                          {question.options[ansIndex]}
                                        </li>
                                      ))}
                                    </ul>
                                  ) : (
                                    <p className="text-sm text-gray-500 italic">
                                      No answer selected
                                    </p>
                                  )}
                                </div>
                                {!isCorrect && (
                                  <div>
                                    <p className="text-sm font-medium text-gray-700 mb-1">
                                      Correct:
                                    </p>
                                    <ul className="space-y-1">
                                      {question.correctAnswers.map(
                                        (ansIndex, i) => (
                                          <li
                                            key={i}
                                            className="text-sm bg-green-100 text-green-800 px-2 py-1 rounded"
                                          >
                                            {question.options[ansIndex]}
                                          </li>
                                        )
                                      )}
                                    </ul>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
export default QuizAnalytics;
