import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Plus, X, Check, BookOpen, Trash2, Save } from "lucide-react";
import { db } from "../../firebase/firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { useAuth } from "../../context/AuthContext";

const EditQuiz = () => {
  const { user } = useAuth();
  const { id } = useParams();
  const navigate = useNavigate();
  const [quiz, setQuiz] = useState({
    title: "",
    description: "",
    questions: [
      {
        id: Date.now(),
        question: "",
        options: ["", "", "", ""],
        correctAnswer: 0,
        feedback: "",
      },
    ],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchQuiz = async () => {
      try {
        const quizDoc = await getDoc(doc(db, "quizzes", id));
        if (quizDoc.exists() && quizDoc.data().createdBy === user.uid) {
          setQuiz(quizDoc.data());
        } else {
          alert("Quiz not found or you do not have permission to edit it.");
          navigate("/dashboard");
        }
      } catch (error) {
        console.error("Error fetching quiz:", error);
        alert("Failed to load quiz.");
        navigate("/dashboard");
      } finally {
        setLoading(false);
      }
    };
    if (user) fetchQuiz();
  }, [id, user, navigate]);

  const addQuestion = () => {
    setQuiz((prev) => ({
      ...prev,
      questions: [
        ...prev.questions,
        {
          id: Date.now(),
          question: "",
          options: ["", "", "", ""],
          correctAnswer: 0,
          feedback: "",
        },
      ],
    }));
  };

  const removeQuestion = (questionId) => {
    setQuiz((prev) => ({
      ...prev,
      questions: prev.questions.filter((q) => q.id !== questionId),
    }));
  };

  const updateQuestion = (questionId, field, value) => {
    setQuiz((prev) => ({
      ...prev,
      questions: prev.questions.map((q) =>
        q.id === questionId ? { ...q, [field]: value } : q
      ),
    }));
  };

  const updateOption = (questionId, optionIndex, value) => {
    setQuiz((prev) => ({
      ...prev,
      questions: prev.questions.map((q) =>
        q.id === questionId
          ? {
              ...q,
              options: q.options.map((opt, idx) =>
                idx === optionIndex ? value : opt
              ),
            }
          : q
      ),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!quiz.title.trim()) {
      alert("Please enter a quiz title");
      return;
    }

    const hasEmptyQuestions = quiz.questions.some(
      (q) => !q.question.trim() || q.options.some((opt) => !opt.trim())
    );

    if (hasEmptyQuestions) {
      alert("Please fill in all questions and options");
      return;
    }

    try {
      await updateDoc(doc(db, "quizzes", id), {
        title: quiz.title,
        description: quiz.description,
        questions: quiz.questions,
        updatedAt: new Date(),
      });
      navigate("/dashboard");
    } catch (error) {
      console.error("Error updating quiz:", error);
      alert("Failed to update quiz. Please try again.");
    }
  };

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading...
      </div>
    );

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl mb-4">
            <BookOpen className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2">
            Edit Quiz
          </h1>
          <p className="text-gray-600">
            Update your quiz details and questions
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 shadow-xl border border-white/20">
            <h2 className="text-2xl font-semibold text-gray-800 mb-6 flex items-center gap-3">
              <div className="w-2 h-8 bg-gradient-to-b from-indigo-500 to-purple-500 rounded-full"></div>
              Quiz Information
            </h2>
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Quiz Title *
                </label>
                <input
                  type="text"
                  value={quiz.title}
                  onChange={(e) =>
                    setQuiz((prev) => ({ ...prev, title: e.target.value }))
                  }
                  placeholder="Enter an engaging quiz title..."
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:ring-0 transition-colors text-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description (Optional)
                </label>
                <textarea
                  value={quiz.description}
                  onChange={(e) =>
                    setQuiz((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  placeholder="Brief description of your quiz..."
                  rows="3"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:ring-0 transition-colors resize-none"
                />
              </div>
            </div>
          </div>
          <div className="space-y-6">
            {quiz.questions.map((question, questionIndex) => (
              <div
                key={question.id}
                className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 shadow-xl border border-white/20 relative group"
              >
                {quiz.questions.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeQuestion(question.id)}
                    className="absolute top-6 right-6 w-10 h-10 bg-red-100 hover:bg-red-200 text-red-600 rounded-full flex items-center justify-center transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                )}
                <h3 className="text-xl font-semibold text-gray-800 mb-6 flex items-center gap-3">
                  <div className="w-8 h-8 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
                    {questionIndex + 1}
                  </div>
                  Question {questionIndex + 1}
                </h3>
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Question *
                    </label>
                    <textarea
                      value={question.question}
                      onChange={(e) =>
                        updateQuestion(question.id, "question", e.target.value)
                      }
                      placeholder="Enter your question here..."
                      rows="2"
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:ring-0 transition-colors resize-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-4">
                      Answer Options * (Click to mark as correct)
                    </label>
                    <div className="space-y-3">
                      {question.options.map((option, optionIndex) => (
                        <div
                          key={optionIndex}
                          className="flex gap-3 items-center"
                        >
                          <button
                            type="button"
                            onClick={() =>
                              updateQuestion(
                                question.id,
                                "correctAnswer",
                                optionIndex
                              )
                            }
                            className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all ${
                              question.correctAnswer === optionIndex
                                ? "bg-green-500 border-green-500 text-white shadow-lg scale-110"
                                : "border-gray-300 hover:border-green-400 hover:bg-green-50"
                            }`}
                          >
                            {question.correctAnswer === optionIndex && (
                              <Check className="w-4 h-4" />
                            )}
                          </button>
                          <div className="flex-1">
                            <input
                              type="text"
                              value={option}
                              onChange={(e) =>
                                updateOption(
                                  question.id,
                                  optionIndex,
                                  e.target.value
                                )
                              }
                              placeholder={`Option ${String.fromCharCode(
                                65 + optionIndex
                              )}`}
                              className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-0 transition-all ${
                                question.correctAnswer === optionIndex
                                  ? "border-green-300 bg-green-50 focus:border-green-500"
                                  : "border-gray-200 focus:border-indigo-500"
                              }`}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Feedback (Optional)
                    </label>
                    <textarea
                      value={question.feedback}
                      onChange={(e) =>
                        updateQuestion(question.id, "feedback", e.target.value)
                      }
                      placeholder="Provide explanation or additional context..."
                      rows="2"
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:ring-0 transition-colors resize-none"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="text-center">
            <button
              type="button"
              onClick={addQuestion}
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-xl hover:from-indigo-600 hover:to-purple-600 transition-all transform hover:scale-105 shadow-lg"
            >
              <Plus className="w-5 h-5" />
              Add Question
            </button>
          </div>
          <div className="text-center pt-8">
            <button
              type="submit"
              className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-green-500 to-emerald-500 text-white text-lg font-semibold rounded-2xl hover:from-green-600 hover:to-emerald-600 transition-all transform hover:scale-105 shadow-xl"
            >
              <Save className="w-6 h-6" />
              Update Quiz
            </button>
          </div>
        </form>
        <div className="mt-12 text-center">
          <div className="inline-flex items-center gap-8 px-6 py-3 bg-white/60 backdrop-blur-sm rounded-full border border-white/20">
            <div className="text-center">
              <div className="text-2xl font-bold text-indigo-600">
                {quiz.questions.length}
              </div>
              <div className="text-sm text-gray-600">Questions</div>
            </div>
            <div className="w-px h-8 bg-gray-300"></div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {quiz.questions.reduce(
                  (acc, q) =>
                    acc + q.options.filter((opt) => opt.trim()).length,
                  0
                )}
              </div>
              <div className="text-sm text-gray-600">Options</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditQuiz;
