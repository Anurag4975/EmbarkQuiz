import QuizAnalytics from "../components/Quiz/QuizAnalytics";
import { useAuth } from "../context/AuthContext";
import { Navigate } from "react-router-dom";

const AnalyticsPage = () => {
  const { user } = useAuth();

  if (!user) return <Navigate to="/login" />;

  return (
    <div className="container mx-auto p-6">
      <QuizAnalytics />
    </div>
  );
};

export default AnalyticsPage;
