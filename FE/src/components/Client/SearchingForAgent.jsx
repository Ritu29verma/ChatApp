import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";


const SearchingForAgent = () => {
  const [dotIndex, setDotIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setDotIndex((prev) => (prev + 1) % 3);
    }, 400); // Change every 400ms for smooth looping
    return () => clearInterval(interval);
  }, []);

  return (
    <motion.div
    initial={{ opacity: 0, scale: 0.9 }}
    animate={{ opacity: 1, scale: 1 }}
    exit={{ opacity: 0, scale: 0.9 }}
    transition={{ duration: 0.4, ease: "easeInOut" }}
    className="fixed inset-0 bg-opacity-50 flex justify-center items-center backdrop-blur-md"
  >
      <div className="bg-white p-6 rounded-lg shadow-lg text-center">
        <p className="text-lg font-semibold text-gray-700">
          Searching for an agent
        </p>
        <div className="flex justify-center space-x-1 mt-2">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className={`w-3 h-3 rounded-full bg-black relative`}
            >
              {/* Jumping white dot */}
              <span
                className={`absolute inset-0 w-3 h-3 bg-white rounded-full transition-transform ${
                  dotIndex === i ? "translate-y-[-9px] animate-bounce" : ""
                }`}
              />
            </span>
          ))}
        </div>
      </div>
      </motion.div>
  );
};

export default SearchingForAgent;
