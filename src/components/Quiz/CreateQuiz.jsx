import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, X, Check, BookOpen, Trash2, Save, FileUp } from "lucide-react";
import { db, auth } from "../../firebase/firebase";
import { collection, addDoc } from "firebase/firestore";
import { useAuth } from "../../context/AuthContext";
import * as XLSX from "xlsx";

const CreateQuiz = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [quiz, setQuiz] = useState({
    title: "",
    description: "",
    timer: "",
    quizCode: "",
    allowAnonymous: false, // New field to control anonymous participation
    questions: [
      {
        id: Date.now(),
        question: "",
        options: ["", "", "", ""],
        correctAnswers: [0],
        isMultipleChoice: false,
        feedback: "",
      },
    ],
  });
  const [creationMode, setCreationMode] = useState("manual");
  const fileInputRef = useRef(null);

  const generateQuizCode = () => {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    setQuiz((prev) => ({ ...prev, quizCode: code }));
  };

  // Rest of the existing functions remain the same
  const addQuestion = () => {
    setQuiz((prev) => ({
      ...prev,
      questions: [
        ...prev.questions,
        {
          id: Date.now(),
          question: "",
          options: ["", "", "", ""],
          correctAnswers: [0],
          isMultipleChoice: false,
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

  const addOption = (questionId) => {
    setQuiz((prev) => ({
      ...prev,
      questions: prev.questions.map((q) =>
        q.id === questionId ? { ...q, options: [...q.options, ""] } : q
      ),
    }));
  };

  const removeOption = (questionId, optionIndex) => {
    setQuiz((prev) => ({
      ...prev,
      questions: prev.questions.map((q) =>
        q.id === questionId
          ? {
              ...q,
              options: q.options.filter((_, idx) => idx !== optionIndex),
              correctAnswers: q.correctAnswers
                .filter((ans) => ans !== optionIndex)
                .map((ans) => (ans > optionIndex ? ans - 1 : ans)),
            }
          : q
      ),
    }));
  };

  const toggleCorrectAnswer = (questionId, optionIndex) => {
    setQuiz((prev) => ({
      ...prev,
      questions: prev.questions.map((q) =>
        q.id === questionId
          ? {
              ...q,
              correctAnswers: q.isMultipleChoice
                ? q.correctAnswers.includes(optionIndex)
                  ? q.correctAnswers.filter((ans) => ans !== optionIndex)
                  : [...q.correctAnswers, optionIndex]
                : [optionIndex],
            }
          : q
      ),
    }));
  };

  const toggleMultipleChoice = (questionId) => {
    setQuiz((prev) => ({
      ...prev,
      questions: prev.questions.map((q) =>
        q.id === questionId
          ? {
              ...q,
              isMultipleChoice: !q.isMultipleChoice,
              correctAnswers: q.isMultipleChoice
                ? [q.correctAnswers[0] || 0]
                : q.correctAnswers,
            }
          : q
      ),
    }));
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = new Uint8Array(event.target.result);
        const workbook = XLSX.read(data, { type: "array" });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        // Skip header row if exists
        const rows =
          jsonData.length > 0 && jsonData[0].length > 0 ? jsonData : [];
        const startRow =
          rows.length > 0 &&
          typeof rows[0][0] === "string" &&
          rows[0][0].toLowerCase().includes("question")
            ? 1
            : 0;
        const parsedQuestions = [];
        for (let i = startRow; i < rows.length; i++) {
          const row = rows[i];
          if (!row || row.length < 6) continue;
          const questionText = row[0]?.toString().trim() || "";
          if (!questionText) continue;
          // Extract options (columns B-E)
          const options = [];
          for (let j = 1; j <= 4; j++) {
            if (j < row.length && row[j] !== undefined && row[j] !== null) {
              const optionText = row[j].toString().trim();
              if (optionText) options.push(optionText);
            }
          }
          if (options.length < 2) continue;
          // Parse correct answers (column F)
          const correctAnswers = [];
          const answerStr = row[5]?.toString().trim().toUpperCase() || "";
          if (answerStr) {
            const answers = answerStr.split(/[,;|/]+/).map((a) => a.trim());
            answers.forEach((a) => {
              if (/^[A-Z]$/.test(a)) {
                const index = a.charCodeAt(0) - 65;
                if (index >= 0 && index < options.length) {
                  correctAnswers.push(index);
                }
              } else if (/^\d+$/.test(a)) {
                const index = parseInt(a, 10) - 1;
                if (index >= 0 && index < options.length) {
                  correctAnswers.push(index);
                }
              }
            });
          }
          if (correctAnswers.length === 0) continue;
          // Get explanation (column G)
          const explanation = row[6]?.toString().trim() || "";
          parsedQuestions.push({
            id: Date.now() + i,
            question: questionText,
            options: options,
            correctAnswers: correctAnswers,
            isMultipleChoice: correctAnswers.length > 1,
            feedback: explanation,
          });
        }
        if (parsedQuestions.length > 0) {
          setQuiz((prev) => ({
            ...prev,
            questions: parsedQuestions,
          }));
          setCreationMode("manual");
          alert(`Successfully imported ${parsedQuestions.length} questions!`);
        } else {
          alert("No valid questions found in the Excel file.");
        }
      } catch (error) {
        console.error("Error parsing Excel file:", error);
        alert("Failed to parse Excel file. Please check the format.");
      } finally {
        // Reset file input
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Validation (same as before)
    if (!quiz.title.trim()) {
      alert("Please enter a quiz title");
      return;
    }
    const hasEmptyQuestions = quiz.questions.some(
      (q) =>
        !q.question.trim() ||
        q.options.some((opt) => !opt.trim()) ||
        q.correctAnswers.length === 0
    );
    if (hasEmptyQuestions) {
      alert(
        "Please fill in all questions, options, and select at least one correct answer"
      );
      return;
    }
    if (quiz.timer && (isNaN(quiz.timer) || quiz.timer <= 0)) {
      alert("Please enter a valid timer value (positive number in minutes)");
      return;
    }
    if (quiz.quizCode && !/^\d{6}$/.test(quiz.quizCode)) {
      alert("Quiz code must be a 6-digit number");
      return;
    }
    if (!user) {
      alert("You must be logged in to create a quiz");
      return;
    }
    try {
      await addDoc(collection(db, "quizzes"), {
        title: quiz.title,
        description: quiz.description,
        timer: quiz.timer ? parseInt(quiz.timer) : null,
        quizCode: quiz.quizCode || null,
        allowAnonymous: quiz.allowAnonymous, // Save the allowAnonymous setting
        questions: quiz.questions,
        createdBy: user.uid,
        createdAt: new Date(),
      });
      navigate("/dashboard");
    } catch (error) {
      console.error("Error creating quiz:", error);
      alert("Failed to create quiz. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl mb-4">
            <BookOpen className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2">
            Create Quiz
          </h1>
          <p className="text-gray-600">
            Design engaging quizzes with instant feedback
          </p>
        </div>
        <div className="flex justify-center mb-8">
          <div className="inline-flex bg-white rounded-full p-1 border border-gray-200 shadow-sm">
            <button
              type="button"
              className={`px-6 py-2 rounded-full transition-colors ${
                creationMode === "manual"
                  ? "bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-md"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
              onClick={() => setCreationMode("manual")}
            >
              Manual Creation
            </button>
            <button
              type="button"
              className={`px-6 py-2 rounded-full transition-colors ${
                creationMode === "express"
                  ? "bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-md"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
              onClick={() => setCreationMode("express")}
            >
              Express Upload
            </button>
          </div>
        </div>
        {creationMode === "express" ? (
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 shadow-xl border border-white/20 mb-8">
            <h2 className="text-2xl font-semibold text-gray-800 mb-6 flex items-center gap-3">
              <div className="w-2 h-8 bg-gradient-to-b from-indigo-500 to-purple-500 rounded-full"></div>
              Express Quiz Creation
            </h2>
            <div className="space-y-6">
              <div>
                <p className="text-gray-700 mb-4">
                  Upload an Excel file (.xlsx) with the following structure:
                </p>
                <div className="overflow-x-auto mb-6">
                  <table className="min-w-full bg-gray-50 rounded-lg border border-gray-200">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="px-4 py-2 text-left text-sm font-medium text-gray-700 border-b border-gray-200">
                          Column A
                        </th>
                        <th className="px-4 py-2 text-left text-sm font-medium text-gray-700 border-b border-gray-200">
                          Column B
                        </th>
                        <th className="px-4 py-2 text-left text-sm font-medium text-gray-700 border-b border-gray-200">
                          Column C
                        </th>
                        <th className="px-4 py-2 text-left text-sm font-medium text-gray-700 border-b border-gray-200">
                          Column D
                        </th>
                        <th className="px-4 py-2 text-left text-sm font-medium text-gray-700 border-b border-gray-200">
                          Column E
                        </th>
                        <th className="px-4 py-2 text-left text-sm font-medium text-gray-700 border-b border-gray-200">
                          Column F
                        </th>
                        <th className="px-4 py-2 text-left text-sm font-medium text-gray-700 border-b border-gray-200">
                          Column G
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="px-4 py-2 text-sm border-b border-gray-200">
                          Question
                        </td>
                        <td className="px-4 py-2 text-sm border-b border-gray-200">
                          Option 1
                        </td>
                        <td className="px-4 py-2 text-sm border-b border-gray-200">
                          Option 2
                        </td>
                        <td className="px-4 py-2 text-sm border-b border-gray-200">
                          Option 3
                        </td>
                        <td className="px-4 py-2 text-sm border-b border-gray-200">
                          Option 4
                        </td>
                        <td className="px-4 py-2 text-sm border-b border-gray-200">
                          Correct Answer
                          <br />
                          <span className="text-xs text-gray-500">
                            (e.g., "A" or "A,C")
                          </span>
                        </td>
                        <td className="px-4 py-2 text-sm border-b border-gray-200">
                          Explanation
                        </td>
                      </tr>
                      <tr>
                        <td className="px-4 py-2 text-xs text-gray-500 italic">
                          What is the capital of France?
                        </td>
                        <td className="px-4 py-2 text-xs text-gray-500 italic">
                          London
                        </td>
                        <td className="px-4 py-2 text-xs text-gray-500 italic">
                          Paris
                        </td>
                        <td className="px-4 py-2 text-xs text-gray-500 italic">
                          Berlin
                        </td>
                        <td className="px-4 py-2 text-xs text-gray-500 italic">
                          Madrid
                        </td>
                        <td className="px-4 py-2 text-xs text-gray-500 italic">
                          B
                        </td>
                        <td className="px-4 py-2 text-xs text-gray-500 italic">
                          Paris is the capital
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Upload Excel File *
                  </label>
                  <div className="flex items-center justify-center w-full">
                    <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-gray-300 border-dashed rounded-xl cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors">
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <FileUp className="w-10 h-10 mb-3 text-gray-400" />
                        <p className="mb-2 text-sm text-gray-500">
                          <span className="font-semibold">Click to upload</span>{" "}
                          or drag and drop
                        </p>
                        <p className="text-xs text-gray-500">
                          XLSX format only
                        </p>
                      </div>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".xlsx, .xls"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>
                <div className="text-center pt-4">
                  <button
                    type="button"
                    onClick={() => setCreationMode("manual")}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition-colors"
                  >
                    Back to Manual Creation
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
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
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Timer (Optional, in minutes)
                  </label>
                  <input
                    type="number"
                    value={quiz.timer}
                    onChange={(e) =>
                      setQuiz((prev) => ({ ...prev, timer: e.target.value }))
                    }
                    placeholder="Enter quiz duration (e.g., 10)"
                    min="1"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:ring-0 transition-colors text-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Quiz Code (Optional, 6-digit)
                  </label>
                  <div className="flex gap-3">
                    <input
                      type="text"
                      value={quiz.quizCode}
                      onChange={(e) =>
                        setQuiz((prev) => ({
                          ...prev,
                          quizCode: e.target.value,
                        }))
                      }
                      placeholder="Enter or generate 6-digit code"
                      maxLength="6"
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:ring-0 transition-colors text-lg"
                    />
                    <button
                      type="button"
                      onClick={generateQuizCode}
                      className="px-4 py-3 bg-indigo-500 text-white rounded-xl hover:bg-indigo-600 transition-colors"
                    >
                      Generate
                    </button>
                  </div>
                </div>
                {/* Add the allow anonymous option */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Allow Anonymous Participation
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="allow-anonymous"
                      checked={quiz.allowAnonymous}
                      onChange={(e) =>
                        setQuiz((prev) => ({
                          ...prev,
                          allowAnonymous: e.target.checked,
                        }))
                      }
                      className="w-5 h-5 text-indigo-600 border-gray-300 focus:ring-indigo-500"
                    />
                    <label
                      htmlFor="allow-anonymous"
                      className="text-sm text-gray-700"
                    >
                      Allow participants to take this quiz anonymously
                    </label>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    When enabled, participants can choose to remain anonymous.
                    When disabled, all participants must provide their name.
                  </p>
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
                          updateQuestion(
                            question.id,
                            "question",
                            e.target.value
                          )
                        }
                        placeholder="Enter your question here..."
                        rows="2"
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:ring-0 transition-colors resize-none"
                      />
                    </div>
                    <div className="flex items-center gap-4 mb-4">
                      <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                        <input
                          type="checkbox"
                          checked={question.isMultipleChoice}
                          onChange={() => toggleMultipleChoice(question.id)}
                          className="w-5 h-5 text-indigo-600 border-gray-300 focus:ring-indigo-500"
                        />
                        Multiple Correct Answers
                      </label>
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
                                toggleCorrectAnswer(question.id, optionIndex)
                              }
                              className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all ${
                                question.correctAnswers.includes(optionIndex)
                                  ? "bg-green-500 border-green-500 text-white shadow-lg scale-110"
                                  : "border-gray-300 hover:border-green-400 hover:bg-green-50"
                              }`}
                            >
                              {question.correctAnswers.includes(
                                optionIndex
                              ) && <Check className="w-4 h-4" />}
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
                                  question.correctAnswers.includes(optionIndex)
                                    ? "border-green-300 bg-green-50 focus:border-green-500"
                                    : "border-gray-200 focus:border-indigo-500"
                                }`}
                              />
                            </div>
                            {question.options.length > 2 && (
                              <button
                                type="button"
                                onClick={() =>
                                  removeOption(question.id, optionIndex)
                                }
                                className="w-8 h-8 bg-red-100 hover:bg-red-200 text-red-600 rounded-full flex items-center justify-center transition-colors"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        ))}
                        <button
                          type="button"
                          onClick={() => addOption(question.id)}
                          className="mt-2 inline-flex items-center gap-2 px-4 py-2 bg-indigo-100 text-indigo-600 rounded-xl hover:bg-indigo-200 transition-colors"
                        >
                          <Plus className="w-4 h-4" />
                          Add Option
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Feedback (Optional)
                      </label>
                      <textarea
                        value={question.feedback}
                        onChange={(e) =>
                          updateQuestion(
                            question.id,
                            "feedback",
                            e.target.value
                          )
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
                Create Quiz
              </button>
            </div>
          </form>
        )}
        {creationMode === "manual" && (
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
        )}
      </div>
    </div>
  );
};

export default CreateQuiz;
