import { Routes, Route } from "react-router-dom";
import Login from "./components/Auth/Login";
import ProtectedRoute from "./components/Auth/ProtectedRoute";
import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import CreateQuizPage from "./pages/CreateQuizPage";
import TakeQuizPage from "./pages/TakeQuizPage";
import AnalyticsPage from "./pages/AnalyticsPage";
import EditQuizPage from "./pages/EditQuizPage";
import CreateLiveQuiz from "./components/Quiz/createLiveQuiz"; // New import
import LiveQuiz from "./components/Quiz/LiveQuiz/LiveQuiz"; // New import
import SignUp from "./components/Auth/SignUp";
import PublicQuizzes from "./components/Quiz/PublicQuizzes";

const AppRoutes = () => (
  <Routes>
    <Route path="/" element={<Home />} />
    <Route path="/login" element={<Login />} />
    <Route path="/signup" element={<SignUp />} />
    <Route path="/quizzes" element={<PublicQuizzes />} />
    <Route
      path="/dashboard"
      element={
        <ProtectedRoute>
          <Dashboard />
        </ProtectedRoute>
      }
    />
    <Route
      path="/create-quiz"
      element={
        <ProtectedRoute>
          <CreateQuizPage />
        </ProtectedRoute>
      }
    />
    <Route path="/quiz/:id" element={<TakeQuizPage />} />
    <Route
      path="/analytics/:id"
      element={
        <ProtectedRoute>
          <AnalyticsPage />
        </ProtectedRoute>
      }
    />
    <Route
      path="/edit-quiz/:id"
      element={
        <ProtectedRoute>
          <EditQuizPage />
        </ProtectedRoute>
      }
    />
    <Route
      path="/create-live-quiz"
      element={
        <ProtectedRoute>
          <CreateLiveQuiz />
        </ProtectedRoute>
      }
    />
    <Route path="/live-quiz/:id" element={<LiveQuiz />} />
  </Routes>
);

export default AppRoutes;
