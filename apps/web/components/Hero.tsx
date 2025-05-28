"use client";
import { motion } from "motion/react";
import { Highlight } from "./ui/hero-highlight";

export function Hero() {
  return (
    <motion.h1
      initial={{
        opacity: 0,
        y: 20,
      }}
      animate={{
        opacity: 1,
        y: [20, -5, 0],
      }}
      transition={{
        duration: 0.5,
        ease: [0.4, 0.0, 0.2, 1],
      }}
      className="text-3xl px-4 md:text-5xl lg:text-6xl font-bold text-neutral-700 dark:text-white max-w-4xl leading-relaxed lg:leading-snug text-center mx-auto border-0 border-red-500 my-[50px] mt-[150px] z-30"
    >
      Elevating brands through{" "}
      <Highlight className="text-black dark:text-white">
        code, design, and strategy
      </Highlight>
    </motion.h1>
  );
}
