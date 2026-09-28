import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { db } from "../firebase/firebase";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  deleteDoc,
} from "firebase/firestore";
import { useAuth } from "../context/AuthContext";
import { Trash2, Edit, Share2, Plus, Play } from "lucide-react";

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [quizzes, setQuizzes] = useState([]);
  const [liveQuizzes, setLiveQuizzes] = useState([]);

  useEffect(() => {
    const fetchQuizzes = async () => {
      if (!user) return;

      // Fetch regular quizzes
      const quizQuery = query(
        collection(db, "quizzes"),
        where("createdBy", "==", user.uid)
      );
      const quizSnapshot = await getDocs(quizQuery);
      const quizList = quizSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setQuizzes(quizList);

      // Fetch live quizzes
      const liveQuizQuery = query(
        collection(db, "liveQuizzes"),
        where("createdBy", "==", user.uid)
      );
      const liveQuizSnapshot = await getDocs(liveQuizQuery);
      const liveQuizList = liveQuizSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setLiveQuizzes(liveQuizList);
    };

    fetchQuizzes();
  }, [user]);

  const handleDelete = async (quizId, isLiveQuiz = false) => {
    if (window.confirm("Are you sure you want to delete this quiz?")) {
      try {
        const collectionName = isLiveQuiz ? "liveQuizzes" : "quizzes";
        await deleteDoc(doc(db, collectionName, quizId));
        if (isLiveQuiz) {
          setLiveQuizzes((prev) => prev.filter((quiz) => quiz.id !== quizId));
        } else {
          setQuizzes((prev) => prev.filter((quiz) => quiz.id !== quizId));
        }
      } catch (error) {
        console.error(
          `Error deleting ${isLiveQuiz ? "live" : "regular"} quiz:`,
          error
        );
        alert(
          `Failed to delete ${
            isLiveQuiz ? "live" : "regular"
          } quiz. Please try again.`
        );
      }
    }
  };

  const copyShareLink = (quizId, isLiveQuiz = false) => {
    const link = `${window.location.origin}/${
      isLiveQuiz ? "live-quiz" : "quiz"
    }/${quizId}`;
    navigator.clipboard.writeText(link);
    alert(
      `Shareable link for ${
        isLiveQuiz ? "live" : "regular"
      } quiz copied to clipboard!`
    );
  };

  if (!user) return null;

  return (
    <div className="container mx-auto p-6">
      <h2 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-6">
        Your Dashboard
      </h2>
      <div className="flex flex-wrap gap-4 mb-6">
        <Link
          to="/create-quiz"
          className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl hover:from-green-600 hover:to-emerald-600 transition-all transform hover:scale-105 shadow-lg"
        >
          <Plus className="w-5 h-5" />
          Create New Quiz
        </Link>
        <Link
          to="/create-live-quiz"
          className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-xl hover:from-blue-600 hover:to-indigo-600 transition-all transform hover:scale-105 shadow-lg"
        >
          <Plus className="w-5 h-5" />
          Create New Live Quiz
        </Link>
      </div>

      <h3 className="text-xl font-semibold text-gray-800 mb-4">
        Your Regular Quizzes
      </h3>
      {quizzes.length === 0 ? (
        <p className="text-gray-600 mb-8">No regular quizzes created yet.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {quizzes.map((quiz) => (
            <div
              key={quiz.id}
              className="bg-white/80 backdrop-blur-sm rounded-3xl p-6 shadow-xl border border-white/20"
            >
              <h4 className="text-lg font-bold text-gray-800 mb-2">
                {quiz.title}
              </h4>
              <p className="text-gray-600 mb-4">
                {quiz.questions.length} Questions
              </p>
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => copyShareLink(quiz.id)}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-all"
                >
                  <Share2 className="w-4 h-4" />
                  Share
                </button>
                <Link
                  to={`/quiz/${quiz.id}`}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-500 text-white rounded-xl hover:bg-indigo-600 transition-all"
                >
                  Take Quiz
                </Link>
                <Link
                  to={`/edit-quiz/${quiz.id}`}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-500 text-white rounded-xl hover:bg-yellow-600 transition-all"
                >
                  <Edit className="w-4 h-4" />
                  Edit
                </Link>
                <button
                  onClick={() => handleDelete(quiz.id)}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-all"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </button>
                <Link
                  to={`/analytics/${quiz.id}`}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-purple-500 text-white rounded-xl hover:bg-purple-600 transition-all"
                >
                  View Analytics
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      <h3 className="text-xl font-semibold text-gray-800 mb-4">
        Your Live Quizzes
      </h3>
      {liveQuizzes.length === 0 ? (
        <p className="text-gray-600">No live quizzes created yet.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {liveQuizzes.map((quiz) => (
            <div
              key={quiz.id}
              className="bg-white/80 backdrop-blur-sm rounded-3xl p-6 shadow-xl border border-white/20"
            >
              <h4 className="text-lg font-bold text-gray-800 mb-2">
                {quiz.title}
              </h4>
              <p className="text-gray-600 mb-4">
                {quiz.questions.length} Questions
              </p>
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => copyShareLink(quiz.id, true)}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-all"
                >
                  <Share2 className="w-4 h-4" />
                  Share
                </button>
                <Link
                  to={`/live-quiz/${quiz.id}`}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-500 text-white rounded-xl hover:bg-indigo-600 transition-all"
                >
                  <Play className="w-4 h-4" />
                  Start Live Quiz
                </Link>
                <button
                  onClick={() => handleDelete(quiz.id, true)}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-all"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Dashboard;
