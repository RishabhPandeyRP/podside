"use client";
import { motion } from "framer-motion";
import { useEffect } from "react";
import { useRouter } from "next/router";

interface RedirectScreenProps {
  redirectCountdown: number;
  isLeaving: boolean;
  setRedirectCountdown: React.Dispatch<React.SetStateAction<number>>;
}

export default function RedirectScreen({
  redirectCountdown,
    isLeaving,
  setRedirectCountdown,
}: RedirectScreenProps) {
  const totalTime = 10; // 10 seconds countdown
  const radius = 50;
  const circumference = 2 * Math.PI * radius;
  const progress = ((totalTime - redirectCountdown) / totalTime) * circumference;
  const router = useRouter();

  // Countdown effect
  useEffect(() => {
    if (redirectCountdown <= 0) {
      router.push("/");
      return;
    }
    const timer = setTimeout(() => setRedirectCountdown((prev) => prev - 1), 1000);
    return () => clearTimeout(timer);
  }, [redirectCountdown, setRedirectCountdown]);

  const handleReturnNow = () => {
    router.push("/");
  };

  return (
    <motion.div
      className="h-screen w-full flex flex-col items-center justify-center bg-[#111111] text-gray-100"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6, ease: "easeInOut" }}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="text-center space-y-6"
      >
        <h1 className="text-3xl font-semibold text-[#9966CC]">
          Thanks for joining the meeting
        </h1>

        <p className="text-gray-400 text-lg">Redirecting to homepage in</p>

        {/* Circular countdown */}
        <div className="relative w-32 h-32 mx-auto flex items-center justify-center">
          <svg
            className="-rotate-90 w-32 h-32 absolute"
            viewBox="0 0 120 120"
          >
            {/* Background circle */}
            <circle
              cx="60"
              cy="60"
              r={radius}
              stroke="#2c2c2c"
              strokeWidth="8"
              fill="none"
            />
            {/* Progress circle */}
            <motion.circle
              cx="60"
              cy="60"
              r={radius}
              stroke="#9966CA"
              strokeWidth="8"
              fill="none"
              strokeDasharray={circumference}
              strokeDashoffset={progress}
              strokeLinecap="round"
              transition={{ duration: 1, ease: "linear" }}
            />
          </svg>

          <motion.span
            key={redirectCountdown}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="text-4xl font-bold text-white"
          >
            {redirectCountdown}
          </motion.span>
        </div>

        <div className="pt-4">
          <button
            onClick={handleReturnNow}
            disabled={isLeaving}
            className="bg-[#9966CA]/80 hover:bg-[#9966CA] text-white px-7 py-3 rounded-lg shadow-lg transition-all"
          >
            Return Now
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
