import { Plus, Trash2 } from "lucide-react";

const QuizForm = ({ quiz, setQuiz, handleSubmit }) => {
  // Prevent rendering if quiz is undefined
  if (!quiz) {
    return (
      <div className="container mx-auto p-6">
        <p className="text-red-600 text-center">
          Error: Quiz data is not initialized.
        </p>
      </div>
    );
  }

  const addQuestion = () => {
    setQuiz({
      ...quiz,
      questions: [
        ...quiz.questions,
        {
          id: Date.now(), // Unique ID for key
          question: "",
          options: ["", "", "", ""],
          correctAnswers: [], // Array for multiple correct answers
          feedback: "",
        },
      ],
    });
  };

  const removeQuestion = (index) => {
    setQuiz({
      ...quiz,
      questions: quiz.questions.filter((_, i) => i !== index),
    });
  };

  const updateQuestion = (index, field, value) => {
    const updatedQuestions = [...quiz.questions];
    updatedQuestions[index] = { ...updatedQuestions[index], [field]: value };
    setQuiz({ ...quiz, questions: updatedQuestions });
  };

  const updateOption = (qIndex, oIndex, value) => {
    const updatedQuestions = [...quiz.questions];
    updatedQuestions[qIndex] = {
      ...updatedQuestions[qIndex],
      options: updatedQuestions[qIndex].options.map((opt, i) =>
        i === oIndex ? value : opt
      ),
    };
    setQuiz({ ...quiz, questions: updatedQuestions });
  };

  const toggleCorrectAnswer = (qIndex, oIndex) => {
    const updatedQuestions = [...quiz.questions];
    const currentCorrect = updatedQuestions[qIndex].correctAnswers || [];
    const isSelected = currentCorrect.includes(oIndex);
    updatedQuestions[qIndex] = {
      ...updatedQuestions[qIndex],
      correctAnswers: isSelected
        ? currentCorrect.filter((i) => i !== oIndex)
        : [...currentCorrect, oIndex].sort(),
    };
    setQuiz({ ...quiz, questions: updatedQuestions });
  };

  const onSubmit = (e) => {
    e.preventDefault();
    // Validate form
    if (!quiz.topic) {
      alert("Please enter a quiz topic.");
      return;
    }
    for (const q of quiz.questions) {
      if (!q.question) {
        alert("Please fill in all question texts.");
        return;
      }
      if (q.options.some((opt) => !opt)) {
        alert("Please fill in all options for each question.");
        return;
      }
      if (!q.correctAnswers || q.correctAnswers.length === 0) {
        alert("Please select at least one correct answer for each question.");
        return;
      }
    }
    handleSubmit(e);
  };

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-6 shadow-xl border border-white/20">
        <label className="block text-gray-700 font-medium mb-2">
          Quiz Topic
        </label>
        <input
          type="text"
          value={quiz.topic || ""}
          onChange={(e) => setQuiz({ ...quiz, topic: e.target.value })}
          placeholder="Quiz Topic"
          className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
          required
        />
      </div>

      {quiz.questions.map((q, qIndex) => (
        <div
          key={q.id || qIndex} // Use id if available, fallback to index
          className="bg-white/80 backdrop-blur-sm rounded-3xl p-6 shadow-xl border border-white/20"
        >
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-semibold text-gray-800">
              Question {qIndex + 1}
            </h3>
            {quiz.questions.length > 1 && (
              <button
                type="button"
                onClick={() => removeQuestion(qIndex)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-all"
              >
                <Trash2 className="w-4 h-4" />
                Remove
              </button>
            )}
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-gray-700 font-medium mb-2">
                Question
              </label>
              <input
                type="text"
                value={q.question || ""}
                onChange={(e) =>
                  updateQuestion(qIndex, "question", e.target.value)
                }
                placeholder="Enter question"
                className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>
            <div>
              <label className="block text-gray-700 font-medium mb-2">
                Options
              </label>
              {q.options.map((option, oIndex) => (
                <div key={oIndex} className="flex items-center gap-3 mb-2">
                  <input
                    type="text"
                    value={option || ""}
                    onChange={(e) =>
                      updateOption(qIndex, oIndex, e.target.value)
                    }
                    placeholder={`Option ${oIndex + 1}`}
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>
              ))}
            </div>
            <div>
              <label className="block text-gray-700 font-medium mb-2">
                Correct Answers
              </label>
              <div className="space-y-2">
                {q.options.map((option, oIndex) => (
                  <label
                    key={oIndex}
                    className="flex items-center gap-3 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={(q.correctAnswers || []).includes(oIndex)}
                      onChange={() => toggleCorrectAnswer(qIndex, oIndex)}
                      className="w-5 h-5 text-indigo-600 border-gray-300 focus:ring-indigo-500"
                    />
                    <span className="text-gray-700">
                      Option {oIndex + 1}: {option || "(empty)"}
                    </span>
                  </label>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-gray-700 font-medium mb-2">
                Feedback
              </label>
              <textarea
                value={q.feedback || ""}
                onChange={(e) =>
                  updateQuestion(qIndex, "feedback", e.target.value)
                }
                placeholder="Feedback for this question"
                className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
        </div>
      ))}

      <div className="text-center">
        <button
          type="button"
          onClick={addQuestion}
          className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl hover:from-green-600 hover:to-emerald-600 transition-all transform hover:scale-105 shadow-lg"
        >
          <Plus className="w-5 h-5" />
          Add Question
        </button>
      </div>

      <div className="text-center">
        <button
          type="submit"
          className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-blue-500 to-indigo-500 text-white text-lg font-semibold rounded-2xl hover:from-blue-600 hover:to-indigo-600 transition-all transform hover:scale-105 shadow-xl"
        >
          Save Quiz
        </button>
      </div>
    </form>
  );
};

export default QuizForm;
