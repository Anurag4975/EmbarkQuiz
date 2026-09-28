import { useState, useCallback, useRef } from "react";
import { motion } from "framer-motion";
import { toast } from "react-toastify";

const JoinQuizForm = ({ setParticipantName, onJoin }) => {
  const [inputName, setInputName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const inputRef = useRef(null);
  const isValidName = inputName.trim().length >= 2;

  const handleInputChange = useCallback((e) => {
    const newName = e.target.value.replace(/[^a-zA-Z0-9\s]/g, "");
    setInputName(newName);
  }, []);

  const handleSubmit = useCallback(
    (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (!isValidName) {
        toast.warn("Please enter a valid name (at least 2 characters).");
        return;
      }
      setIsSubmitting(true);
      try {
        setParticipantName(inputName.trim());
        onJoin();
      } catch (error) {
        toast.error("Error joining quiz");
        setIsSubmitting(false);
      }
    },
    [inputName, isValidName, setParticipantName, onJoin]
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-4 md:p-6 flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 shadow-xl border border-white/20 max-w-md w-full"
      >
        <h2 className="text-2xl font-semibold text-gray-800 mb-6 text-center">
          Join Live Quiz
        </h2>
        <form onSubmit={handleSubmit} noValidate>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Your Name *
              </label>
              <input
                ref={inputRef}
                type="text"
                value={inputName}
                onChange={handleInputChange}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    if (isValidName) {
                      handleSubmit(e);
                    } else {
                      toast.warn(
                        "Please enter a valid name (at least 2 characters)."
                      );
                    }
                  }
                }}
                placeholder="Enter your name"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:ring-0 transition-colors text-lg"
                autoComplete="off"
                autoFocus
                disabled={isSubmitting}
              />
            </div>
            <button
              type="submit"
              disabled={isSubmitting || !isValidName}
              className={`w-full px-8 py-4 bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-lg font-semibold rounded-2xl hover:from-indigo-600 hover:to-purple-600 transition-all transform hover:scale-105 shadow-xl ${
                isSubmitting || !isValidName
                  ? "opacity-75 cursor-not-allowed"
                  : ""
              }`}
            >
              {isSubmitting ? "Joining..." : "Join Quiz"}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default JoinQuizForm;
