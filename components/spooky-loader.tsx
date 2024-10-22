import { motion } from "framer-motion";
import { Skull } from "lucide-react";

const SpookyLoader = () => {
  return (
    <div className="flex flex-col items-center justify-center space-y-4 p-6">
      <motion.div
        animate={{
          rotate: 360,
          scale: [1, 1.1, 1],
        }}
        transition={{
          rotate: {
            duration: 2,
            repeat: Infinity,
            ease: "linear",
          },
          scale: {
            duration: 1,
            repeat: Infinity,
            ease: "easeInOut",
          },
        }}
        className="text-orange-500"
      >
        <Skull className="w-12 h-12" />
      </motion.div>
      <motion.div
        animate={{
          opacity: [0.5, 1, 0.5],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="text-orange-400 text-sm"
      >
        Summoning your story...
      </motion.div>
    </div>
  );
};

export default SpookyLoader;