import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../../firebase/firebase";
import { BookOpen, Search, Filter } from "lucide-react";

const PublicQuizzes = () => {
  const [quizzes, setQuizzes] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [loading, setLoading] = useState(true);

  // Sample categories (you can expand this based on your needs)
  const categories = [
    { value: "all", label: "All Categories" },
    { value: "math", label: "Mathematics" },
    { value: "science", label: "Science" },
    { value: "history", label: "History" },
    { value: "literature", label: "Literature" },
    { value: "general", label: "General Knowledge" },
  ];

  useEffect(() => {
    const fetchPublicQuizzes = async () => {
      try {
        setLoading(true);
        const q = query(
          collection(db, "quizzes"),
          where("isPublic", "==", true)
        );
        const querySnapshot = await getDocs(q);
        const quizzesData = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setQuizzes(quizzesData);
      } catch (error) {
        console.error("Error fetching public quizzes:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPublicQuizzes();
  }, []);

  // Filter quizzes based on search term and category
  const filteredQuizzes = quizzes.filter((quiz) => {
    const matchesSearch = quiz.title
      ?.toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesCategory =
      selectedCategory === "all" || quiz.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 py-12">
      <div className="container mx-auto px-6">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              Explore Quizzes
            </span>
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Discover and take quizzes created by the Quizgro community
          </p>
        </div>

        {/* Search and Filter */}
        <div className="flex flex-col md:flex-row gap-4 mb-12 max-w-4xl mx-auto">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search quizzes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white/80 backdrop-blur-sm"
            />
          </div>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white/80 backdrop-blur-sm"
            >
              {categories.map((category) => (
                <option key={category.value} value={category.value}>
                  {category.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Quizzes Grid */}
        {loading ? (
          <div className="text-center text-gray-600">Loading quizzes...</div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredQuizzes.length === 0 ? (
              <div className="col-span-full text-center text-gray-600">
                No quizzes found matching your criteria.
              </div>
            ) : (
              filteredQuizzes.map((quiz) => (
                <Link
                  key={quiz.id}
                  to={`/quiz/${quiz.id}`}
                  className="group bg-white/80 backdrop-blur-sm p-6 rounded-3xl shadow-xl border border-white/20 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2"
                >
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-2xl flex items-center justify-center text-white">
                      <BookOpen className="w-6 h-6" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-800">
                      {quiz.title}
                    </h3>
                  </div>
                  <p className="text-gray-600 mb-4 line-clamp-2">
                    {quiz.description || "No description available"}
                  </p>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500">
                      Category: {quiz.category || "General"}
                    </span>
                    <span className="text-sm text-indigo-600 font-semibold group-hover:underline">
                      Take Quiz →
                    </span>
                  </div>
                </Link>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default PublicQuizzes;
