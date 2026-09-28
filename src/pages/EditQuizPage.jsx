import EditQuiz from "../components/Quiz/EditQuiz";
import { useAuth } from "../context/AuthContext";
import { Navigate } from "react-router-dom";

const EditQuizPage = () => {
  const { user } = useAuth();

  if (!user) return <Navigate to="/login" />;

  return (
    <div className="container mx-auto p-6">
      <EditQuiz />
    </div>
  );
};

export default EditQuizPage;
