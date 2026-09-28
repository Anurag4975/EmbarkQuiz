import { motion } from "framer-motion";
import { QRCodeSVG } from "qrcode.react";

const QRCodeDisplay = ({ quizId, quizCode }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.8 }}
    animate={{ opacity: 1, scale: 1 }}
    className="mt-4 bg-white p-4 rounded-xl inline-block"
  >
    <QRCodeSVG
      value={`${window.location.origin}/live-quiz/${quizId}`}
      size={200}
    />
    <p className="mt-2 text-gray-600">Quiz Code: {quizCode}</p>
    <p className="mt-1 text-gray-600 text-sm">
      Participants scan this to join.
    </p>
  </motion.div>
);

export default QRCodeDisplay;
